<template>
  <div class="container">
    <!-- Header -->
    <!-- Introduction -->
    <div class="row mt-4">
      <Introduction />
    </div>

    <div class="row">
      <Initiate />
    </div>

    <!-- File Upload Section -->
    <div class="row">
      <Import @import-checklists="handleImportChecklists" />
    </div>

    <!-- File Upload Section -->
    <div class="row">
      <Checks :importedChecklists="importedChecklists" />
    </div>

    <!-- Footer -->
    <div class="row">
      <div class="col-12">
        <hr />
        <footer class="d-flex flex-column flex-md-row justify-content-between align-items-center">
          <span class="text-muted small mb-2 mb-md-0"
            >Made by
            <a
              href="https://github.com/Rafnuss"
              target="_blank"
              class="text-dark text-decoration-none"
              title="Raphaël Nussbaumer"
            >
              Raphaël Nussbaumer</a
            >, with support from
            <a
              href="https://github.com/linusblomqvist"
              target="_blank"
              class="text-dark text-decoration-none"
              title="Linus Blomqvist"
            >
              Linus Blomqvist
            </a>
            &amp;
            <a
              href="https://github.com/richardlitt"
              target="_blank"
              class="text-dark text-decoration-none"
              title="Richard Littauer"
            >
              Richard Littauer
            </a>
          </span>
          <span class="text-muted small mb-2 mb-md-0">v{{ version }}</span>
          <a
            href="https://github.com/Zoziologie/ChecklistReview"
            target="_blank"
            class="link-secondary text-muted small d-flex align-items-center text-decoration-none"
            title="Project Repository"
          >
            <i class="bi bi-github"></i>
            <span class="ms-1">GitHub</span>
          </a>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

<script>
import { ref } from "vue";
import Introduction from "./components/Introduction.vue";
import Initiate from "./components/Initiate.vue";
import Import from "./components/Import.vue";
import Checks from "./components/Checks.vue";

export default {
  name: "App",
  components: {
    Introduction,
    Initiate,
    Import,
    Checks,
  },
  setup() {
    const importedChecklists = ref([]);
    function handleImportChecklists(data) {
      importedChecklists.value = data;
    }
    return { importedChecklists, handleImportChecklists, version: __APP_VERSION__ };
  },
};
</script>
