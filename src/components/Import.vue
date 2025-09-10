<template>
  <div class="card mb-4">
    <div class="card-body">
      <h4 class="card-title">2. Import processed checklists</h4>

      <div class="row">
        <div class="col-12" v-if="importState.status === 'idle'">
          <!-- File Upload Section -->
          <p>Import the CSV file with checklists:</p>
          <input
            type="file"
            accept=".csv"
            @change="handleCsvUpload"
            class="form-control mb-3"
            ref="fileInput"
          />
        </div>
      </div>

      <!-- Alert -->
      <div class="row">
        <div class="col-12">
          <!-- Processing -->
          <div
            v-if="importState.status === 'processing'"
            class="alert alert-warning d-flex align-items-center"
          >
            <span
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            <strong>Reading file...</strong> Please wait while your file is being processed.
          </div>
          <!-- Error -->
          <div v-else-if="importState.status === 'error'" class="alert alert-danger">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Processing failed!</strong>
            {{
              importState.message ||
              "An error occurred while processing your file. Please check the file format and try again."
            }}
          </div>
          <!-- Success -->
          <div
            v-else-if="importState.status === 'success'"
            class="alert alert-success alert-dismissible fade show"
            role="alert"
          >
            <i class="bi bi-check-circle-fill me-2"></i>
            <strong>Success!</strong>
            {{ importState.message || "File loaded successfully." }}
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="alert"
              aria-label="Close"
            ></button>
          </div>
        </div>
      </div>

      <!-- Filter -->
      <div class="row" v-if="checklists && checklists.length > 0">
        <div class="col-12">
          <p>
            Use the filters below to narrow down your checklists to a manageable subset that you
            will have time to process.
          </p>
        </div>
        <!-- Date Range Filter -->
        <div class="col-4">
          <label class="form-label fw-semibold">Date Range</label>
          <div class="form-group">
            <label for="minYear" class="form-label small">Min Year</label>
            <select id="minYear" v-model="filters.minYear" class="form-select form-select-sm">
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="maxYear" class="form-label small">Max Year</label>
            <select id="maxYear" v-model="filters.maxYear" class="form-select form-select-sm">
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>
        </div>
        <!-- State Filters -->
        <div v-if="availableStates.length > 1" class="col-4">
          <label for="stateFilter" class="form-label fw-semibold">State/Province</label>
          <select
            id="stateFilter"
            v-model="filters.state"
            class="form-select form-select-sm"
            multiple
            size="4"
            style="min-height: 100px"
          >
            <option v-for="state in availableStates" :key="state" :value="state">
              {{ state }}
            </option>
          </select>
          <small class="text-muted">Hold Ctrl/Cmd to select multiple states</small>
        </div>
        <!-- County Filters -->
        <div v-if="availableCounties.length > 1" class="col-4">
          <label for="countyFilter" class="form-label fw-semibold">County</label>
          <select
            id="countyFilter"
            v-model="filters.county"
            class="form-select form-select-sm"
            multiple
            size="4"
            style="min-height: 100px"
          >
            <option v-for="county in availableCounties" :key="county" :value="county">
              {{ county }}
            </option>
          </select>
          <small class="text-muted">Hold Ctrl/Cmd to select multiple counties</small>
        </div>

        <!-- Filter Summary -->
        <div class="col-12">
          <div
            class="alert alert-info d-flex flex-column flex-md-row align-items-center justify-content-center gap-3 m-2 py-2 px-3"
            style="font-size: 1.1rem; font-weight: 500"
            role="alert"
          >
            <div class="d-flex align-items-center justify-content-center">
              <i class="bi bi-funnel-fill me-2 text-muted small"></i>
              <small class="text-muted">
                {{ (filteredChecklists?.length || 0).toLocaleString() }} checklists |
                {{
                  checklists?.length
                    ? Math.round(((filteredChecklists?.length || 0) / checklists.length) * 100)
                    : 0
                }}% of total
              </small>
            </div>
            <div class="d-flex align-items-center justify-content-center">
              <button
                v-if="filteredChecklists && filteredChecklists.length > 0"
                class="btn btn-primary btn-lg px-4 py-2"
                @click="emitFilteredChecklists"
                style="min-width: 240px; font-size: 1.15rem"
              >
                <i class="bi bi-arrow-right-circle me-2"></i>Check filtered checklists
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from "vue";
import Papa from "papaparse";

export default {
  emits: ["import-checklists"],
  setup(props, { emit }) {
    const checklists = ref([]);
    const fileInput = ref(null);
    const importState = ref({ status: "idle", message: "" });

    // CSV upload handler
    const handleCsvUpload = (event) => {
      console.log("Import file");
      const file = event.target.files[0];
      if (!file) {
        checklists.value = [];
        importState.value = { status: "idle", message: "" };
        return;
      }
      importState.value = { status: "processing", message: "Reading file..." };
      processFile(file);
      // Reset file input so uploading the same file again will trigger change
      if (fileInput.value) fileInput.value.value = null;
    };

    const processFile = (file) => {
      console.log("processFile");
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          if (Array.isArray(results.data) && results.data.length > 0) {
            const converted = results.data.map((row) => {
              // convert to array
              const newRow = { ...row };
              // Convert numbers
              [
                "latitude",
                "longitude",
                "effort_distance_km",
                "duration_minutes",
                "mediaCount",
                "medianCount",
                "number_observations",
                "number_observers",
                "number_species",
                "number_unique_count",
              ].forEach((key) => {
                if (key in newRow) {
                  const val = newRow[key];
                  newRow[key] =
                    val === "" || val === null || val === undefined ? null : Number(val);
                }
              });
              // Convert booleans
              ["fixed", "nocturnal"].forEach((key) => {
                if (key in newRow) {
                  newRow[key] = String(newRow[key]).toLowerCase() === "true";
                }
              });
              newRow.date = new Date(newRow.date);
              newRow.year = newRow.date ? newRow.date.getFullYear() : null;
              return newRow;
            });
            checklists.value = converted;
            importState.value = {
              status: "success",
              message: `Loaded ${converted.length.toLocaleString()} checklists.`,
            };
            // Initiate filter
            initFilters();
          } else {
            checklists.value = [];
            importState.value = {
              status: "error",
              message: `No data found in file '${file.name}'.`,
            };
          }
        },
        error: function () {
          checklists.value = [];
          importState.value = {
            status: "error",
            message: `Failed to parse file '${file.name}'.`,
          };
        },
      });
    };

    const availableYears = ref([]);
    const availableStates = ref([]);
    const availableCounties = ref([]);

    // Filter configuration
    const filters = reactive({
      minYear: "",
      maxYear: "",
      state: [],
      county: [],
    });

    const initFilters = () => {
      // Reset filters when new data is uploaded
      filters.minYear = "";
      filters.maxYear = "";
      filters.state = [];
      filters.county = [];

      // Set available filter options from the uploaded data
      const years = [
        ...new Set(
          checklists.value
            .map((checklist) => {
              return isNaN(checklist.year) ? null : checklist.year;
            })
            .filter((year) => year !== null)
        ),
      ];
      availableYears.value = years.sort((a, b) => b - a);

      // Set default min/max years to the actual range of the data
      if (years.length > 0) {
        filters.minYear = years[years.length - 1]; // First element after sorting (minimum)
        filters.maxYear = years[0]; // Last element after sorting (maximum)
      }

      const states = [
        ...new Set(
          checklists.value
            .map((checklist) => checklist.state)
            .filter((state) => state && state.trim() !== "")
        ),
      ];
      availableStates.value = states.sort();

      const counties = [
        ...new Set(
          checklists.value
            .map((checklist) => checklist.county)
            .filter((county) => county && county.trim() !== "")
        ),
      ];
      availableCounties.value = counties.sort();
    };

    // Filtered data based on current filters
    const filteredChecklists = computed(() => {
      console.log("filteredChecklists");
      if (!checklists.value) return null;
      return checklists.value.filter((checklist) => {
        // Date filter
        if (filters.minYear || filters.maxYear) {
          if (filters.minYear && checklist.year < parseInt(filters.minYear)) return false;
          if (filters.maxYear && checklist.year > parseInt(filters.maxYear)) return false;
        }

        // State filter
        if (filters.state.length > 0 && !filters.state.includes(checklist.state)) return false;

        // County filter
        if (filters.county.length > 0 && !filters.county.includes(checklist.county)) return false;

        return true;
      });
    });

    function emitFilteredChecklists() {
      emit("import-checklists", filteredChecklists.value);
      console.log("emitFilteredChecklists");
    }

    return {
      handleCsvUpload,
      checklists,
      importState,
      filteredChecklists,
      availableYears,
      availableStates,
      availableCounties,
      filters,
      fileInput,
      emitFilteredChecklists,
    };
  },
};
</script>
