# Fundamental

An evidence-led company research tool with a responsive editorial interface, SEC annual financial history, editable five-year FCFF scenarios, DCF sensitivity analysis, and self-contained interactive HTML exports. No investment ratings.

## Run

Node 20+; no dependencies.

```
npm run build
npm test
npm run dev
```

Open http://127.0.0.1:4173. The deployed Worker exposes the same `/api/company?ticker=MSFT` endpoint and serves the embedded UI. SEC responses are cached in memory for one hour. SEC may restrict data-center access; original company-facts JSON import is an alternative.

## Sources and calculations

`src/finance.mjs` selects USD US GAAP facts with exact revenue-period matches, keeps filing accession/tag/date provenance, and selects the latest eligible disclosure for each fact. Annual periods are 330–380 days; quarterly periods and future-dated filings are excluded. It does not guarantee comparability after accounting or business changes. Microsoft is a dated, authentic SEC snapshot bundled for immediate viewing, not live market data.

Historical free cash flow = operating cash flow − cash purchases of property and equipment. Forecast FCFF = revenue × operating margin × (1 − tax) − net reinvestment. A five-year discounted FCFF stream plus Gordon-growth terminal value produces enterprise value. The simplified equity bridge adds period-end cash and disclosed short-term investments, subtracts tagged debt, and divides by period-end common shares outstanding. Unknown short-term borrowing and investment fields are excluded and disclosed; absence is not proof of zero. The bridge omits various claims and full dilution. Defaults are explicitly illustrative, not management guidance, analyst consensus, or model-calibrated forecasts.

## Files

- `src/page.html`, `src/style.css`, `src/app.js`: responsive interface and interactions.
- `src/finance.mjs`: financial normalization and deterministic model.
- `src/worker.mjs`: SEC data retrieval and HTTP routing.
- `src/snapshot.json`: normalized SEC Microsoft snapshot with individual filing sources.
- `scripts/build.mjs`: embeds assets and data into the Worker and `report.html`.
- `report.html`: self-contained Microsoft report; offline interactions work. New ticker lookups require the running server or hosted app.
- `test/finance.test.mjs`: independent valuation reconciliation, sensitivity, missing-data and normalization tests.

## Current limits

US GAAP annual figures only. Segment dimensions, company-specific KPIs, quarterly/TTM histories, live prices, peer multiples, automated narrative research, and consensus estimates are not integrated. Banks, insurers, REITs, and complex capital structures require specialized valuation models. Source gaps and model limitations are visible in the report.
