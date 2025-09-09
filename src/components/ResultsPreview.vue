<template>
  <div v-if="processedData && processedData.length > 0">
    <div class="card mb-4">
      <div class="card-body">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <h4 class="card-title mb-0 flex-shrink-1" style="min-width: 180px">
            4. Review flagged checklists
          </h4>
          <div class="d-flex align-items-center gap-2 flex-shrink-0" style="width: 280px">
            <label class="form-label mb-0 small" style="font-size: 0.85rem; white-space: nowrap"
              >Columns:</label
            >
            <multiselect
              v-model="selectedColumns"
              :options="tableCols"
              :multiple="true"
              :close-on-select="false"
              :clear-on-select="false"
              :preserve-search="true"
              placeholder="Pick some"
              label="label"
              track-by="key"
              :preselect-first="true"
              class="mb-0 small-columns-selector"
              style="font-size: 0.85rem"
            >
              <template #selection="{ values, isOpen }">
                <span
                  class="multiselect__single"
                  v-if="values.length"
                  v-show="!isOpen"
                  style="font-size: 0.85rem"
                >
                  {{ values.length }} / {{ tableCols.length }} columns selected
                </span>
              </template>
            </multiselect>
          </div>
        </div>
        <div class="table-responsive" style="max-height: 400px; overflow: auto">
          <table class="table table-striped table-sm results-table-sticky">
            <thead>
              <tr>
                <!--<th style="cursor: pointer" @click="sortBy('fixed')">
                  Fixed
                  <span v-if="sortKey === 'fixed'">{{ sortAsc ? "▲" : "▼" }}</span>
                </th>-->
                <th
                  v-for="col in visibleCols"
                  :key="col.key"
                  @click="col.sortable ? sortBy(col.key) : null"
                  style="cursor: pointer"
                >
                  {{ col.label }}
                  <span v-if="col.sortable">
                    <template v-if="sortKey === col.key">{{ sortAsc ? "▲" : "▼" }}</template>
                    <template v-else>↕</template>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in displayedData" :key="index">
                <!--<td>
                  <input
                    type="checkbox"
                    :checked="row.fixed"
                    @change="
                      $emit('update-fixed', {
                        value: !row.fixed,
                        checklist_id: row.checklist_id,
                      })
                    "
                  />
                </td>-->
                <td v-for="col in visibleCols" :key="col.key">
                  <span
                    v-html="col.displayFun ? col.displayFun(row, index, $emit) : row[col.key]"
                  ></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mb-2 text-muted small">Flagged checklists: {{ processedData.length }}</div>
      </div>
    </div>
  </div>
  <div v-else class="alert alert-info mt-4" role="alert">
    No flagged checklists to show yet. Try adjusting your check settings and running the checks
    again.
  </div>
</template>

<script>
import { ref, computed } from "vue";
import Multiselect from "vue-multiselect";
import { checksConfig } from "../utils/checksConfig";

const mail_template_intro = function (row) {
  return (
    `Dear ${row.observers},\n\n` +
    `Thank you for being a part of eBird. To help make sure that eBird can be used for scientific research and conservation, volunteers like me follow up on unusual observations as a part of the eBird data quality process.\n\n` +
    `I am writing about the following observation:\n\n` +
    `Observation Date: ${row.date.toLocaleDateString()}\n` +
    `Location: ${row.locality}\n` +
    `https://ebird.org/checklist/${row.checklist_id}\n\n`
  );
};

const mail_template_outro =
  `Thank you again for your contributions to eBird—your observations help to make eBird useful to millions of people each year, providing real-time bird information and powering eBird science around the world.\n\n` +
  `Learn more about eBird data quality https://support.ebird.org/en/support/solutions/articles/48000795278
and eBird science https://ebird.org/science.\n\n`;

export default {
  name: "ResultsPreview",
  components: { Multiselect },
  props: {
    processedData: {
      type: Array,
      default: () => [],
    },
  },
  //emits: ["update-fixed"],
  setup(props, { emit }) {
    const displayCount = ref(50);
    const maxDisplay = 200; // Maximum to show in browser for performance

    const sortKey = ref("");
    const sortAsc = ref(true);

    // Table column definitions
    const tableCols = [
      {
        key: "observers",
        label: "Observer",
        sortable: true,
        display: true,
        sort: 2,
        displayFun: (row, idx, emit) => {
          return `<a href='https://review.ebird.org/admin/observer.htm?userID=USER${row.observers.replace(
            "obsr",
            ""
          )} ' target='_blank'>${
            row.observers
          }</a> <a href="#" class="ms-1" title="Copy mail template" onclick="window.copyMailTemplate && window.copyMailTemplate(${idx}); return false;"><i class='bi bi-envelope'></i></a>`;
        },
      },
      {
        key: "checklist_id",
        label: "Checklists",
        sortable: true,
        display: true,
        sort: 1,
        displayFun: (row) =>
          `<a href='https://review.ebird.org/admin/reviewSub.htm?subID=${row.checklist_id}' target='_blank'>${row.checklist_id}</a>`,
      },
      {
        key: "flags",
        label: "Flags",
        sortable: true,
        display: true,
        sort: 3,
        displayFun: (row) => `<small>${row.flags.join(", ")}</small>`,
      },
      {
        key: "date",
        label: "Date",
        sortable: true,
        display: true,
        sort: 4,
        displayFun: (row) => `<small>${row.date.toISOString().slice(0, 10)}</small>`,
      },
      {
        key: "time",
        label: "Time",
        sortable: true,
        display: true,
        sort: 5,
        displayFun: (row) => {
          if (row.time) {
            const timeStr = row.time ? row.time.slice(0, 5) : "";
            const isNocturnal = row.nocturnal === true;
            const icon = isNocturnal
              ? '<i class="bi bi-moon" title="Nocturnal"></i>'
              : '<i class="bi bi-sun" title="Diurnal"></i>';
            return `<small>${timeStr} ${icon}</small>`;
          } else {
            return "<small>–</small>";
          }
        },
      },
      {
        key: "protocol",
        label: "Protocol",
        sortable: true,
        display: true,
        sort: 6,
        displayFun: (row) => `<small>${row.protocol}</small>`,
      },
      {
        key: "duration_minutes",
        label: "Duration",
        sortable: true,
        display: true,
        sort: 7,
        displayFun: (row) => {
          const min = row.duration_minutes;
          if (min === null || min === undefined || min === "") return "<small>–</small>";
          if (min < 60) return `<small>${min}min</small>`;
          const h = Math.floor(min / 60);
          const m = min % 60;
          return `<small>${h}h${m > 0 ? m + "min" : ""}</small>`;
        },
      },
      {
        key: "effort_distance_km",
        label: "Distance",
        sortable: true,
        display: true,
        sort: 8,
        displayFun: (row) => {
          let val = row.effort_distance_km;
          if (val === null || val === undefined || val === "") return "<small>–</small>";
          val = Number(val);
          if (isNaN(val)) return `<small>–</small>`;
          let rounded = Math.round(val * 100) / 100;
          //let str = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2).replace(/\.00$/, "");
          return `<small>${rounded}km</small>`;
        },
      },
      {
        key: "number_observers",
        label: "#observers",
        sortable: true,
        display: false,
        sort: 9,
        displayFun: (row) => `<small>${row.number_observers}</small>`,
      },
      {
        key: "number_observations",
        label: "#obs.",
        sortable: true,
        display: false,
        sort: 10,
        displayFun: (row) => `<small>${row.number_observations}</small>`,
      },
      {
        key: "number_unique_count",
        label: "#unique count",
        sortable: true,
        display: false,
        sort: 11,
        displayFun: (row) => `<small>${row.number_unique_count}</small>`,
      },
      {
        key: "number_species",
        label: "#sp.",
        sortable: true,
        display: true,
        sort: 12,
        displayFun: (row) => `<small>${row.number_species}</small>`,
      },
    ];

    // User-selected columns to display (as objects, not keys)
    const selectedColumns = ref(tableCols.filter((col) => col.display));

    // Always order by 'sort' property
    const visibleCols = computed(() =>
      [...selectedColumns.value].sort((a, b) => (a.sort || 0) - (b.sort || 0))
    );

    const sortBy = (key) => {
      if (sortKey.value === key) {
        sortAsc.value = !sortAsc.value;
      } else {
        sortKey.value = key;
        sortAsc.value = true;
      }
    };

    const displayedData = computed(() => {
      let data = props.processedData;
      if (sortKey.value) {
        data = [...data].sort((a, b) => {
          let aVal = a[sortKey.value];
          let bVal = b[sortKey.value];
          // Handle arrays (flags)
          if (Array.isArray(aVal)) aVal = aVal.join(",");
          if (Array.isArray(bVal)) bVal = bVal.join(",");
          // Handle booleans
          if (typeof aVal === "boolean" && typeof bVal === "boolean") {
            return sortAsc.value
              ? aVal === bVal
                ? 0
                : aVal
                ? 1
                : -1
              : aVal === bVal
              ? 0
              : aVal
              ? -1
              : 1;
          }
          // Handle numbers
          if (!isNaN(aVal) && !isNaN(bVal)) {
            return sortAsc.value ? aVal - bVal : bVal - aVal;
          }
          // Default string comparison
          aVal = aVal === null || aVal === undefined ? "" : String(aVal);
          bVal = bVal === null || bVal === undefined ? "" : String(bVal);
          return sortAsc.value ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
      }
      return data.slice(0, Math.min(displayCount.value, maxDisplay));
    });

    // Expose a global function for copying mail template
    if (typeof window !== "undefined") {
      window.copyMailTemplate = (rowIdx) => {
        console.log("Copying mail template for row", rowIdx);
        const row = displayedData.value[rowIdx];
        let txt = mail_template_intro(row);
        row.flags.map((f) => {
          txt += checksConfig.find((c) => c.id === f).mail_template(row);
        });
        txt += mail_template_outro;
        navigator.clipboard.writeText(txt);
        alert("Mail template copied to clipboard:\n" + txt);
      };
    }
    return {
      displayCount,
      maxDisplay,
      displayedData,
      sortKey,
      sortAsc,
      sortBy,
      tableCols,
      selectedColumns,
      visibleCols,
    };
  },
};
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
.small-columns-selector .multiselect__tags {
  min-height: 28px;
  padding: 2px 6px;
  font-size: 0.85rem;
}
.small-columns-selector .multiselect__option {
  font-size: 0.85rem;
  padding: 3px 8px;
}
.small-columns-selector .multiselect__single {
  font-size: 0.85rem;
}
.small-columns-selector .multiselect__input {
  font-size: 0.85rem;
}
</style>
