<template>
  <div class="card mb-4">
    <div class="card-body">
      <h4 class="card-title">1. Initiate checklists from EBD</h4>
      <p>
        Download
        <a href="https://ebird.org/data/download" target="_blank">the eBird Basic Dataset</a> for
        the region you wish to review (one-time process). All records data will be grouped into
        checklists in CSV format (we only consider complete checklists).
      </p>
      <div class="row">
        <div class="col-12">
          <input
            type="file"
            id="fileInput"
            @change="handleFileUpload"
            accept=".txt,.zip"
            ref="fileInput"
            class="form-control"
          />
          <!-- Processing or Results -->
          <div v-if="processingProgress > 0" class="progress-container">
            <!-- Progress bar -->
            <div class="progress" v-if="processingProgress > 1">
              <div
                class="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                :style="{ width: processingProgress + '%' }"
              >
                {{ Math.round(processingProgress) }}%
              </div>
            </div>
            <small class="text-muted">
              <span
                v-if="processingStatus && processingStatus.startsWith('<span')"
                v-html="processingStatus"
              ></span>
              <span v-else>{{ processingStatus }}</span>
            </small>
          </div>
          <div v-if="uploadedFile">
            <!-- Success message -->
            <div v-if="!hasError && checklists" class="alert alert-success alert-dismissible mt-3">
              <i class="bi bi-check-circle-fill me-2"></i>
              <strong>Success!</strong>
              {{ processingStatus }}
            </div>

            <!-- Error message -->
            <div v-else-if="hasError" class="alert alert-danger mt-3">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Processing failed!</strong>
              {{
                processingStatus ||
                "An error occurred while processing your file. Please check the file format and try again."
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import Papa from "papaparse";
import SunCalc from "suncalc";
import tzlookup from "@photostructure/tz-lookup";
import { DateTime } from "luxon";
import JSZip from "jszip";

import taxonomy from "../assets/eBird_taxonomy.json";
const taxonomy_sci = taxonomy.reduce((acc, row) => {
  acc[row["sciName"]] = row; // Add the row as the value under the key `sciName`
  return acc;
}, {});
const taxonomy_code = taxonomy.reduce((acc, row) => {
  acc[row["speciesCode"]] = row; // Add the row as the value under the key `speciesCode`
  return acc;
}, {});

// Essential columns needed for checklist validation (reduces memory usage by ~80%)
const ESSENTIAL_COLUMNS = [
  "SAMPLING EVENT IDENTIFIER",
  "ALL SPECIES REPORTED",
  "LOCALITY",
  "STATE",
  "COUNTY",
  "OBSERVATION DATE",
  "TIME OBSERVATIONS STARTED",
  "OBSERVER ID",
  "PROTOCOL NAME",
  "DURATION MINUTES",
  "EFFORT DISTANCE KM",
  "NUMBER OBSERVERS",
  "LATITUDE",
  "LONGITUDE",
  // Observation level
  "OBSERVATION COUNT",
  "HAS MEDIA",
  "SCIENTIFIC NAME",
];

export default {
  setup() {
    const fileInput = ref(null);
    const uploadedFile = ref(null);
    const processingProgress = ref(0);
    const processingStatus = ref("");
    const hasError = ref(false);
    const checklists = ref(null);

    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Accept .txt or .zip
      if (file.name.endsWith(".txt")) {
        uploadedFile.value = file;
        hasError.value = false;
        processFile();
      } else if (file.name.endsWith(".zip")) {
        processingStatus.value =
          '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Retrieving TXT from ZIP file...';
        processingProgress.value = 1;
        hasError.value = false;
        try {
          const zip = await JSZip.loadAsync(file);
          // Find the largest .txt file in the zip (reduce directly over zip files)
          const largestTxtFile = Object.values(zip.files).reduce((largest, entry) => {
            if (entry.name.toLowerCase().endsWith(".txt") && entry._data) {
              if (!largest || entry._data.uncompressedSize > largest._data.uncompressedSize) {
                return entry;
              }
            }
            return largest;
          }, null);
          if (!largestTxtFile) {
            processingStatus.value = "No .txt file found in ZIP.";
            hasError.value = true;
            event.target.value = "";
            return;
          }
          // Read the largest TXT file as a Blob
          const txtContent = await largestTxtFile.async("blob");
          // Create a File object to mimic a normal upload
          const txtFileObj = new File([txtContent], largestTxtFile.name, { type: "text/plain" });
          uploadedFile.value = txtFileObj;
          processingStatus.value = `TXT file extracted (${largestTxtFile.name}). Processing...`;
          processFile();
        } catch (err) {
          processingStatus.value = "Failed to extract ZIP: " + err.message;
          hasError.value = true;
          event.target.value = "";
          uploadedFile.value = null;
        } finally {
          processingProgress.value = 0;
        }
      } else {
        alert("Please select a .txt or .zip file");
        event.target.value = "";
        uploadedFile.value = null;
        return;
      }
    };

    const processFile = () => {
      console.log("processFile");
      if (!uploadedFile.value) return;

      checklists.value = null;

      processingProgress.value = 1; // Start processing
      processingStatus.value = "Starting file processing...";
      hasError.value = false;

      const groups = {};
      let processedRows = 0;
      let columnsValidated = false;

      Papa.parse(uploadedFile.value, {
        header: true,
        delimiter: "\t",
        skipEmptyLines: true,
        worker: true, // Use Web Worker for large files
        chunkSize: 2 * 1024 * 1024, // 2MB chunks

        chunk: function (results, parser) {
          // Validate columns on first chunk
          if (!columnsValidated) {
            columnsValidated = true;
            const columnValidation = validateColumns(results.meta.fields || []);
            if (!columnValidation.valid) {
              parser.abort();
              processingProgress.value = 0;
              processingStatus.value = columnValidation.error;
              hasError.value = true;
              checklists.value = null;
              return;
            }
          }

          const progress = (results.meta.cursor / uploadedFile.value.size) * 100;
          processingProgress.value = progress;
          processingStatus.value = `Grouping records into checklists (${processedRows.toLocaleString()} records processed)`;

          // Filter for complete checklists only and keep essential columns with optimized types
          const completeChecklists = results.data
            .filter((row) => row["ALL SPECIES REPORTED"])
            .map(filterEssentialColumns)
            .map((row) => {
              const sciName = row["SCIENTIFIC NAME"];
              const match = taxonomy_sci[sciName];
              const speciesID = match?.REPORT_AS || match?.speciesCode || sciName;
              const match2 = taxonomy_code[speciesID] || { comName: row["COMMON NAME"] };
              row["PARENT COMMON NAME"] = match2.comName;
              row["PARENT CATEGORY"] = match2.CATEGORY || "species";
              row["CATEGORY"] = match ? match.CATEGORY : undefined;
              return row;
            });

          // Group by checklist ID
          completeChecklists.forEach((row) => {
            const checklistId = row["SAMPLING EVENT IDENTIFIER"];
            if (!groups[checklistId]) {
              groups[checklistId] = [];
            }
            groups[checklistId].push(row);
          });

          processedRows += results.data.length;
        },

        complete: function (results) {
          processingProgress.value = 100;
          processingStatus.value =
            '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Finalizing checklist data...';
          checklists.value = Object.values(groups).map((chk) => {
            // Parse the local observation time (stays in local timezone)
            const datetime = parseEBirdDateTime(
              chk[0]["OBSERVATION DATE"],
              chk[0]["TIME OBSERVATIONS STARTED"],
              chk[0]["LATITUDE"],
              chk[0]["LONGITUDE"]
            );

            // Get sun times and determine if nocturnal only if time was provided
            let nocturnal = null;
            if (
              chk[0]["TIME OBSERVATIONS STARTED"] &&
              chk[0]["TIME OBSERVATIONS STARTED"].trim() !== ""
            ) {
              const sun = SunCalc.getTimes(datetime, chk[0]["LATITUDE"], chk[0]["LONGITUDE"]);
              nocturnal = datetime < sun.nauticalDawn || datetime >= sun.nauticalDusk;
            }

            const observations = chk.map((row) => {
              return {
                common_name: row["COMMON NAME"],
                category: row["CATEGORY"],
                parent_common_name: row["PARENT COMMON NAME"],
                // scientific_name: row["SCIENTIFIC NAME"],
                // category: row["PARENT CATEGORY"],
                observation_count: row["OBSERVATION COUNT"],
                has_media: row["HAS MEDIA"],
              };
            });

            return {
              checklist_id: chk[0]["SAMPLING EVENT IDENTIFIER"],
              latitude: chk[0]["LATITUDE"],
              longitude: chk[0]["LONGITUDE"],
              date: chk[0]["OBSERVATION DATE"],
              time: chk[0]["TIME OBSERVATIONS STARTED"],
              datetime: datetime,
              locality: chk[0]["LOCALITY"],
              state: chk[0]["STATE"],
              county: chk[0]["COUNTY"],
              protocol: chk[0]["PROTOCOL NAME"],
              observers: chk[0]["OBSERVER ID"],
              duration_minutes: chk[0]["DURATION MINUTES"],
              effort_distance_km: chk[0]["EFFORT DISTANCE KM"],
              number_observers: chk[0]["NUMBER OBSERVERS"],
              all_species_reported: chk[0]["ALL SPECIES REPORTED"],

              // Observation level data
              // number of unique common_names
              number_observations: observations.length,
              number_species: new Set(observations.map((obs) => obs.parent_common_name)).size,
              number_unique_count: new Set(observations.map((obs) => obs.observation_count)).size,
              median_count: (() => {
                const counts = observations
                  .map((obs) => obs.observation_count)
                  .filter((count) => count != null)
                  .map(Number)
                  .sort((a, b) => a - b);
                const middleIndex = Math.floor(counts.length / 2);
                return counts.length > 0
                  ? counts.length % 2 === 0
                    ? (counts[middleIndex - 1] + counts[middleIndex]) / 2
                    : counts[middleIndex]
                  : 0;
              })(),
              // Number of media
              media_count: observations.filter((obs) => obs.has_media).length,
              // Is nocturnal
              nocturnal: nocturnal,

              // Fix
              fixed: false,
            };
          });

          processingStatus.value = `Processed ${checklists.value.length.toLocaleString()} complete checklists from ${processedRows.toLocaleString()} total records.`;
          processingProgress.value = 0;

          exportChecklists();
        },

        error: function (error) {
          console.error("File processing error:", error);
          processingProgress.value = 0;
          processingStatus.value = error?.message || "Error occurred while processing the file";
          hasError.value = true;
          checklists.value = null;
        },
      });
    };

    // Export checklists as JSON file
    const exportChecklists = () => {
      if (!checklists.value || checklists.value.length === 0) return;
      // Convert checklists to CSV using Papa.unparse
      const csv = Papa.unparse(checklists.value);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      // Build filename from uploaded file name and filters
      let baseName = uploadedFile.value?.name
        ? uploadedFile.value.name.replace(/\.[^/.]+$/, "").replace("ebd_", "checklists_")
        : "checklists_";
      // Add date and time up to seconds, removing all T, space, :, -, _
      const dateTimeStr = new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(0, 14);
      a.href = url;
      a.download = `${baseName}_${dateTimeStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return {
      uploadedFile,
      fileInput,
      processingProgress,
      processingStatus,
      hasError,
      checklists,
      handleFileUpload,
      processFile,
    };
  },
};

/**
 * Filter row to keep only essential columns with minimal type conversion for speed
 */
function filterEssentialColumns(row) {
  const filtered = {};

  ESSENTIAL_COLUMNS.forEach((col) => {
    if (row.hasOwnProperty(col)) {
      const value = row[col];

      // Only do essential conversions during parsing for speed
      switch (col) {
        case "ALL SPECIES REPORTED":
          // Critical boolean conversion for filtering
          filtered[col] = value === "1" || value === "true";
          break;

        case "HAS MEDIA":
          // Quick boolean conversion
          filtered[col] = value === "1" || value === "true";
          break;

        case "OBSERVATION COUNT":
        case "LATITUDE":
        case "LONGITUDE":
        case "DURATION MINUTES":
        case "EFFORT DISTANCE KM":
        case "NUMBER OBSERVERS":
          // Convert numeric fields to float for calculations
          filtered[col] = value === "" ? null : parseFloat(value) || 0;
          break;

        default:
          // Keep as trimmed strings - convert to numbers during validation
          filtered[col] = value?.toString().trim() || "";
      }
    }
  });

  return filtered;
}

/**
 * Validate that the file contains all essential eBird columns
 */
function validateColumns(headers) {
  const missingColumns = ESSENTIAL_COLUMNS.filter((col) => !headers.includes(col));

  if (missingColumns.length > 0) {
    return {
      valid: false,
      error: `This doesn't appear to be a valid eBird Basic Dataset file. Missing required columns: ${missingColumns
        .slice(0, 3)
        .join(", ")}${
        missingColumns.length > 3 ? ` and ${missingColumns.length - 3} more` : ""
      }. Please ensure you've downloaded the complete eBird Basic Dataset (EBD) file.`,
    };
  }

  return { valid: true };
}

/**
 * Combine eBird date and time strings into a local Date object
 * @param {string} dateStr - Date string like "2023-09-22"
 * @param {string} timeStr - Time string like "11:18:00" or null/empty
 * @param {number} lat - Latitude for timezone detection
 * @param {number} lon - Longitude for timezone detection
 * @returns {Date|null} Local DateTime object or null if parsing fails
 */
function parseEBirdDateTime(dateStr, timeStr, lat = null, lon = null) {
  try {
    // If no time provided, use midnight
    if (!timeStr || typeof timeStr !== "string" || timeStr.trim() === "") {
      timeStr = "00:00:00";
    }

    // Get timezone for the location using tz-lookup
    if (lat !== null && lon !== null) {
      const timezone = tzlookup(lat, lon);

      if (timezone) {
        return DateTime.fromFormat(`${dateStr.trim()} ${timeStr.trim()}`, "yyyy-MM-dd HH:mm:ss", {
          zone: timezone,
        }).toJSDate();
      }
    }

    // Fallback: create date without timezone context
    return new Date(`${dateStr.trim()}T${timeStr.trim()}`);
  } catch (error) {
    console.warn("Failed to parse datetime:", dateStr, timeStr, error);
    return null;
  }
}
</script>
