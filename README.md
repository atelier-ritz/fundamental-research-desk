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

Historical free cash flow = operating cash flow − cash purchases of property and equipment. Forecast FCFF = revenue × operating margin × (1 − tax) − net reinvestment. A five-year discounted FCFF stream plus Gordon-growth terminal value produces enterprise value. The simplified equity bridge adds period-end cash and disclosed short-term investments, subtracts tagged debt, and divides by period-end common shares outstanding. Unknown short-term borrowing and investment fields are excluded and disclosed; absence is not proof of zero. The bridge omits various claims and full dilution. Growth and operating-margin starts use suitable reported history; tax uses eligible reported accounting rates where available. Reinvestment, discount rate, and terminal growth remain illustrative judgment inputs. These are not management guidance or analyst consensus.

## Files

- `src/page.html`, `src/style.css`, `src/app.js`: responsive interface and interactions.
- `src/finance.mjs`: financial normalization and deterministic model.
- `src/worker.mjs`: SEC data retrieval and HTTP routing.
- `src/snapshot.json`: normalized SEC Microsoft snapshot with individual filing sources.
- `scripts/build.mjs`: embeds assets and data into the Worker and `report.html`.
- `report.html`: self-contained Microsoft report; offline interactions work. New ticker lookups require the running server or hosted app.
- `test/finance.test.mjs`: independent valuation reconciliation, sensitivity, missing-data and normalization tests.

## Current limits

US GAAP annual figures only. Segment coverage is described below. Company-specific operating KPI feeds, quarterly/TTM histories, live prices, peer multiples, automated narrative research, and consensus estimates are not integrated. Banks, insurers, REITs, and complex capital structures require specialized valuation models. Source gaps and model limitations are visible in the report.

## Business overview and revenue composition

Reviewed, filing-linked profiles cover Microsoft FY2026, Apple FY2025, and Amazon FY2025. Profiles are selected by CIK, exact annual end date, and reconciled total revenue. Apple product categories and geographic operating segments are separate views of the same revenue. Drivers are paraphrases of company disclosures, not independent causal findings or forecasts.

For other tickers, the API attempts conservative extraction of standard USD revenue facts from the original inline-XBRL filing. It accepts only supported single-axis business/product/geographic groups that match the exact annual period, contain unique nonnegative categories, and reconcile to the annual company total. Conflicts, overlaps, unsupported transforms, and failed extraction produce a visible coverage gap. Automatically derived tag names may be less readable; reviewed business descriptions and drivers are not fabricated. Reviewed profiles and any fetched extracted breakdown travel with the self-contained HTML report.

## Forecast context

Growth starts from elapsed-date annualized revenue growth over the displayed history (fallback 10% if missing or outside -25% to 60%). Operating margin uses the median of up to three recent margins (fallback 25% if missing or outside -30% to 80%). Tax uses the median of recent tax expense / positive pretax income with eligible rates 0%–50% (fallback 21%). History-based starting values round to 0.1 percentage point to match controls. Net reinvestment stays illustrative at 8%; displayed cash-capex intensity is context, not a substitute for net reinvestment. WACC and terminal growth start at illustrative 10% and 2.5%. The three comparison cards vary current growth by ±5 percentage points with all other inputs fixed; the range is not a confidence interval.
