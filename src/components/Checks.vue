<template>
  <div>
    <!-- Spinner overlay during initial processing -->
    <div
      v-if="spinner && checklists.length == 0"
      class="d-flex flex-column align-items-center justify-content-center py-5"
    >
      <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem" role="status">
        <span class="visually-hidden">Processing...</span>
      </div>
    </div>
    <!-- Checks and Thresholds -->
    <div class="row" v-if="checklists !== null && checklists.length > 0">
      <div class="col-12">
        <!-- Checks and Thresholds -->

        <div class="card mb-4">
          <div class="card-body">
            <h4 class="card-title">3. Configure quality checks</h4>
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div class="d-flex">
                <button
                  class="btn btn-sm btn-outline-primary me-2"
                  type="button"
                  @click="selectAllChecks"
                >
                  Select All
                </button>
                <button
                  class="btn btn-sm btn-outline-secondary"
                  type="button"
                  @click="deselectAllChecks"
                >
                  Select None
                </button>
              </div>
              <div class="d-flex gap-2">
                <button
                  class="btn btn-sm btn-outline-secondary"
                  type="button"
                  @click="exportChecksConfig"
                >
                  Export
                </button>
                <label class="btn btn-sm btn-outline-secondary" type="button">
                  Import
                  <input
                    type="file"
                    accept="application/json"
                    @change="importChecksConfig"
                    style="display: none"
                  />
                </label>
              </div>
            </div>

            <!-- Check Selection -->
            <div class="mb-4">
              <div class="row">
                <div class="col-lg-4 col-md-6" v-for="check in checks" :key="check.id">
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :id="check.id"
                      v-model="check.selected"
                    />
                    <label class="form-check-label" :for="check.id">
                      {{ check.label }}
                    </label>
                  </div>

                  <!-- Description and Threshold Configuration -->
                  <div
                    v-if="check.selected"
                    class="ms-4 mt-1 mb-3 ps-3 border-start border-3 border-secondary"
                  >
                    <div class="mb-2">
                      <small class="text-muted">{{ check.description }}</small>
                    </div>
                    <div
                      v-if="check.thresholds.length > 0"
                      class="d-flex flex-wrap gap-2 align-items-center"
                    >
                      <span
                        v-for="threshold in check.thresholds"
                        :key="threshold.key"
                        class="d-flex align-items-center gap-1"
                      >
                        <label
                          :for="threshold.key"
                          class="form-label mb-0 small text-muted"
                          style="font-size: 0.75rem"
                        >
                          {{ threshold.label }}:
                        </label>
                        <input
                          :type="threshold.type"
                          :id="threshold.key"
                          v-model.number="thresholds[threshold.key]"
                          class="form-control form-control-sm"
                          :min="threshold.min"
                          :step="threshold.step"
                          @change="runChecks(check.id)"
                          style="width: 80px; font-size: 0.75rem"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ResultsPreview v-if="checklists.length > 0" :processedData="flaggedChecklists" />
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from "vue";
import { checksConfig as defaultChecksConfig } from "../utils/checksConfig.js";
import Review from "./Review.vue";

export default {
  components: {
    Review,
  },
  props: {
    importedChecklists: {
      type: Array,
      default: () => [],
    },
  },
  setup(props) {
    // Select all/none for checks
    const selectAllChecks = () => {
      checks.forEach((check) => {
        check.selected = true;
      });
      runChecks();
    };
    const deselectAllChecks = () => {
      checks.forEach((check) => {
        check.selected = false;
      });
      runChecks();
    };
    const checklists = ref([]);
    const hasError = ref(false);
    const processingStatus = ref("");
    const spinner = ref(false);

    // Reactive checks configuration
    const checks = reactive(defaultChecksConfig);

    // Function to create thresholds object from checks definitions
    const makeThresholds = (checksArr) => {
      const thresholdObj = {};
      checksArr.forEach((check) => {
        check.thresholds.forEach((threshold) => {
          thresholdObj[threshold.key] = threshold.defaultValue;
        });
      });
      return thresholdObj;
    };

    // Generate thresholds object from checks definitions
    const thresholds = reactive(makeThresholds(checks));

    // Export checks config as JSON
    const exportChecksConfig = () => {
      // Deep copy checks and update threshold defaultValue with current thresholds
      const checksToExport = JSON.parse(JSON.stringify(checks));
      checksToExport.forEach((check) => {
        if (Array.isArray(check.thresholds)) {
          check.thresholds.forEach((threshold) => {
            if (threshold.key in thresholds) {
              threshold.defaultValue = thresholds[threshold.key];
            }
          });
        }
      });
      const dataStr = JSON.stringify(checksToExport, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "checksConfig.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    // Import checks config from JSON
    const importChecksConfig = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          // Overwrite checks
          while (checks.length) checks.pop();
          imported.forEach((c) => checks.push(c));
          // Reset thresholds
          const newThresholds = makeThresholds(imported);
          Object.keys(thresholds).forEach((k) => delete thresholds[k]);
          Object.entries(newThresholds).forEach(([k, v]) => (thresholds[k] = v));
        } catch (err) {
          alert("Invalid checks config JSON");
        }
        // Reset file input so same file can be re-imported if needed
        event.target.value = "";
      };
      reader.readAsText(file);
    };

    const flaggedChecklists = computed(() => {
      // Get IDs of currently selected checks
      const selectedChecks = checks.filter((check) => check.selected).map((c) => c.id);
      // Filter checklists: efficiently skip those with no truthy flags
      return checklists.value
        .filter((item) => {
          if (!item.flags) return false;
          // Fast skip: if no flags are true, skip
          const hasAnyTrue = Object.values(item.flags).some(Boolean);
          if (!hasAnyTrue) return false;
          // Now check if any selected check is true
          return selectedChecks.some((checkId) => item.flags[checkId]);
        })
        .map((cl) => ({
          ...cl,
          // Set flags to array of check IDs that are true
          flags: cl.flags ? Object.keys(cl.flags).filter((key) => cl.flags[key]) : [],
        }));
    });

    // Run checks and update checklists directly
    const runChecks = (tocheck = checks.map((c) => c.id)) => {
      console.log("Running checks:", tocheck);
      const checks_to_run = checks.filter((c) => tocheck.includes(c.id));
      checklists.value = checklists.value.map((checklist) => {
        // Ensure flags object exists
        if (!checklist.flags) checklist.flags = {};
        checks_to_run.forEach((check) => {
          if (check.checkFunction(checklist, thresholds)) {
            checklist.flags[check.id] = true;
          } else {
            checklist.flags[check.id] = false;
          }
        });
        return checklist;
      });
    };

    // Watch for prop changes and sync local ref
    watch(
      () => props.importedChecklists,
      (newVal) => {
        spinner.value = true;
        console.log("importedChecklists changed");
        setTimeout(() => {
          checklists.value = newVal;
          runChecks();
          spinner.value = false;
        }, 0);
      }
    );

    return {
      spinner,
      checklists,
      runChecks,
      checks,
      thresholds,
      exportChecksConfig,
      importChecksConfig,
      hasError,
      processingStatus,
      flaggedChecklists,
      selectAllChecks,
      deselectAllChecks,
    };
  },
};
</script>
