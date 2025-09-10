<template>
  <div class="col-7">
    <h2 class="mt-4 mb-4 fw-bold">Checklist Review</h2>
    <p>
      As an eBird reviewer, you need to decide which checklists are public or not, following the
      <a
        href="https://support.ebird.org/en/support/solutions/articles/48000795623-ebird-rules-and-best-practices"
        target="_blank"
      >
        eBird Rules and Best Practices </a
      >. This tool makes the job easier. It flags checklists that may not meet data quality
      guidelines and gives you ready-to-use emails for observers.
    </p>
    <p><strong>How it works:</strong></p>
    <ol>
      <li>Download the eBird Basic Dataset</li>
      <li>Import processed checklists file and filter by years and/or regions</li>
      <li>Select and adjust the quality checks you want to apply</li>
      <li>Review the flagged checklists and send template emails</li>
    </ol>
  </div>
  <div class="col-5">
    <div class="card h-100">
      <a
        href="https://ebird.org/checklist/S253342535?#corplo"
        target="_blank"
        rel="noopener"
        class="small text-decoration-underline"
      >
        <img src="/2400.jpeg" class="card-img-top" alt="Intro image" />
      </a>
    </div>
  </div>
  <div class="col-12">
    <!-- How to review checklists collapsible -->
    <details class="mb-4">
      <summary class="fw-bold" style="cursor: pointer">
        How to review checklists (click to expand)
      </summary>
      <div class="mt-2">
        <p>
          Detailed explanations on how to review checklists are provided in the
          <a
            href="https://drive.google.com/file/d/1zeGEwMt9vrJL3dvj1aAuYodErB8ikl3e/view?usp=drive_link"
            target="_blank"
            >eBird Reviewer Handbook</a
          >:
        </p>
        <div class="row">
          <div class="col-sm-6 mb-3">
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">Checklist-Date Imprecise</h5>
                <p class="card-text">
                  Use this when an observer submits records from a correct location, but uses a date
                  that is clearly incorrect. Some users submit lists spanning multiple days. eBird
                  does not accept multi-day lists and it is best to make these checklists Not Public
                  using this reason, even if they are otherwise correct.
                </p>
              </div>
            </div>
          </div>
          <div class="col-sm-6 mb-3">
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">Checklist-Distance Too Long</h5>
                <p class="card-text">
                  Mainland checklists of 80.5 km (50.0 miles) or longer, or High Seas checklists of
                  160.9 km (100.0 miles) or longer, are automatically tagged as Checklist-Distance
                  Too Long.
                </p>
              </div>
            </div>
          </div>
          <div class="col-sm-6 mb-3">
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">Checklist-Error</h5>
                <p class="card-text">
                  This reason is to be used for miscellaneous issues with the checklist that are not
                  covered by the other review reasons.
                </p>
              </div>
            </div>
          </div>
          <div class="col-sm-6 mb-3">
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">Checklist-List Building</h5>
                <p class="card-text">
                  It is common for observers to create a life list or a state list by plotting a
                  location or selecting a random point, picking a random date, and submitting a full
                  list.
                </p>
              </div>
            </div>
          </div>
          <div class="col-sm-6 mb-3">
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">Checklist-Multi-party</h5>
                <p class="card-text">
                  eBird is a system for collecting single-party checklists. If two or more observers
                  go birding independently, these birding efforts should be submitted separately.
                </p>
              </div>
            </div>
          </div>
          <div class="col-sm-6 mb-3">
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">Checklist-Protocol Error</h5>
                <p class="card-text">
                  This reason is to be used when eBirders use protocols incorrectly.
                </p>
              </div>
            </div>
          </div>
          <div class="col-sm-6 mb-3">
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">Location-Issue</h5>
                <p class="card-text">
                  This review reason is to be used for any case where the observer has badly
                  misplotted the location or has selected the incorrect location.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </details>
  </div>
</template>
