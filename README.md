# Checklist Review

Checklist Review is a modern Vue.js web application for eBird reviewers to efficiently process, filter, and check eBird checklists for data quality. The app guides users through the workflow of preparing, importing, filtering, and reviewing checklists, with a focus on usability and transparency.

## Workflow

1. **Initiate checklists from EBD:**
   - Download your eBird Basic Dataset from [eBird Data Download](https://ebird.org/data/download).
   - Upload your eBird Basic Dataset (.txt or .zip) and convert it to a CSV of complete checklists.
2. **Import processed checklists:**
   - Upload the generated CSV.
   - Filter by year, state, or county, and review summary stats.
3. **Configure quality checks:**
   - Select which checks to apply and adjust thresholds as needed.
4. **Review flagged checklists:**
   - See results, preview issues, and export flagged checklists for follow-up.

## Key Features

- **Client-side processing:** All data is processed in your browser for privacy and speed.
- **Flexible filtering:** Filter checklists by year, state/province, and county before running checks.
- **Customizable checks:** Enable/disable individual checks and adjust thresholds for species count, distance, duration, and more.
- **Email template generation:** Automatically generate ready-to-use email templates for contacting observers about flagged checklists.

## Tech Stack

<p align="left">
   <a href="https://vuejs.org/" target="_blank"><img src="https://img.shields.io/badge/Vue.js-35495E?logo=vue.js&logoColor=4FC08D&style=for-the-badge" alt="Vue.js" /></a>
   <a href="https://vitejs.dev/" target="_blank"><img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=FFD62E&style=for-the-badge" alt="Vite" /></a>
   <a href="https://getbootstrap.com/" target="_blank"><img src="https://img.shields.io/badge/Bootstrap-7952B3?logo=bootstrap&logoColor=fff&style=for-the-badge" alt="Bootstrap" /></a>
   <a href="https://bootswatch.com/" target="_blank"><img src="https://img.shields.io/badge/Bootswatch-4A90E2?logo=bootstrap&logoColor=fff&style=for-the-badge" alt="Bootswatch" /></a>
   <a href="https://icons.getbootstrap.com/" target="_blank"><img src="https://img.shields.io/badge/Bootstrap%20Icons-563D7C?logo=bootstrap&logoColor=fff&style=for-the-badge" alt="Bootstrap Icons" /></a>
   <a href="https://www.papaparse.com/" target="_blank"><img src="https://img.shields.io/badge/Papa%20Parse-4B8DF8?logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjZmZmIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQxIDAtOC0zLjU5LTgtOHMzLjU5LTggOC04IDggMy41OSA4IDgtMy41OSA4LTggOHoiLz48L3N2Zz4=&style=for-the-badge" alt="Papa Parse" /></a>
   <a href="https://moment.github.io/luxon/" target="_blank"><img src="https://img.shields.io/badge/Luxon-0A192F?logo=javascript&logoColor=fff&style=for-the-badge" alt="Luxon" /></a>
   <a href="https://github.com/mourner/suncalc" target="_blank"><img src="https://img.shields.io/badge/SunCalc-F9D923?logo=github&logoColor=000&style=for-the-badge" alt="SunCalc" /></a>
   <a href="https://stuk.github.io/jszip/" target="_blank"><img src="https://img.shields.io/badge/JSZip-4B8DF8?logo=zip&logoColor=fff&style=for-the-badge" alt="JSZip" /></a>
</p>

## Resources

- [eBird Basic Dataset (EBD)](https://science.ebird.org/en/use-ebird-data/download-ebird-data-products)
- [eBird Rules and Best Practices](https://support.ebird.org/en/support/solutions/articles/48000795623-ebird-rules-and-best-practices)
- [Old Project: Check-eBird-Checklist](https://github.com/Zoziologie/Check-eBird-Checklist)
