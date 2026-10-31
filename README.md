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

US GAAP annual figures only. Segment coverage is described below. Company-specific operating KPI feeds, live prices, peer multiples, automated narrative research, and consensus estimates are not integrated. Banks, insurers, REITs, and complex capital structures require specialized valuation models. Source gaps and model limitations are visible in the report.

## Business overview and revenue composition

Reviewed, filing-linked profiles cover Microsoft FY2026, Apple FY2025, and Amazon FY2025. Profiles are selected by CIK, exact annual end date, and reconciled total revenue. Apple product categories and geographic operating segments are separate views of the same revenue. Drivers are paraphrases of company disclosures, not independent causal findings or forecasts.

For other tickers, the API attempts conservative extraction of standard USD revenue facts from the original inline-XBRL filing. It accepts only supported single-axis business/product/geographic groups that match the exact annual period, contain unique nonnegative categories, and reconcile to the annual company total. Conflicts, overlaps, unsupported transforms, and failed extraction produce a visible coverage gap. Automatically derived tag names may be less readable; reviewed business descriptions and drivers are not fabricated. Reviewed profiles and any fetched extracted breakdown travel with the self-contained HTML report.

## Forecast context

Growth starts from elapsed-date annualized revenue growth over the displayed history (fallback 10% if missing or outside -25% to 60%). Operating margin uses the median of up to three recent margins (fallback 25% if missing or outside -30% to 80%). Tax uses the median of recent tax expense / positive pretax income with eligible rates 0%–50% (fallback 21%). History-based starting values round to 0.1 percentage point to match controls. Net reinvestment stays illustrative at 8%; displayed cash-capex intensity is context, not a substitute for net reinvestment. WACC and terminal growth start at illustrative 10% and 2.5%. The three comparison cards vary current growth by ±5 percentage points with all other inputs fixed; the range is not a confidence interval.

## Quarterly performance

Quarter-only USD revenue, operating income, net income, operating cash flow and cash capex are selected with filing provenance. Missing standalone figures are derived only from cumulative totals with a common fiscal start and XBRL tag; same-accession pairs are preferred. Fiscal Q4 can be annual total minus nine months. Cross-filing subtraction is labeled because revisions can affect comparability. TTM needs four contiguous 65–110 day quarters spanning 330–380 days. At fiscal year ends, sums are checked against matching annual totals and conflicting metrics are withheld. Same-quarter comparisons allow 52/53-week calendars. Latest revenue-bearing filing date, quarter dates, and retrieval date are shown separately; this is not an earnings-release monitor. Valuation remains anchored to annual figures.

## Financial strength

The financial-strength section uses the latest annual period consistently, with separate newer-quarter coverage above. It shows cash, selected borrowing balances, and operating/finance lease liabilities separately. Current plus noncurrent long-term debt is a subtotal, not total debt. Tagged principal maturity buckets are measured from the annual reporting date and need not equal carrying-value debt. Interest coverage is operating income divided by the selected positive reported interest expense; finance-lease interest is displayed separately without assuming that interest categories can be added. Cash after selected uses subtracts cash capex, common dividends paid and common-share buybacks paid from operating cash flow only when all inputs exist. It is not the change in cash, free cash flow, or a forecast. Missing tags, other contractual commitments, and subsequent financing are explicit gaps. No financial-health score or recommendation is produced.

## Data quality & coverage

The coverage panel evaluates the active company's selected annual metrics, quarterly metrics and prior-period match, trailing totals, reviewed versus extracted business detail, debt fields, maturity buckets, cash-use inputs, and interest coverage. It links every area to its affected report section and explains the consequence of missing data. Derived quarter-metric values and cross-filing calculations are counted separately from reported figures. Forecasts remain assumptions. Acquisitions, restatements, accounting changes, and segment reorganizations are explicitly marked not systematically reviewed; coverage never claims these events did not occur. Labels describe report coverage, not an audit opinion, investment rating, or financial-health score.

## Company comparison

Choose up to two US tickers alongside the main report. The comparison uses the same SEC normalization and deterministic calculations for annual and quarterly growth, annual/TTM operating margins and free-cash-flow margins, annual-end cash, selected long-term debt balances and a reported-interest coverage proxy. Each value includes its period and linked calculation/filing provenance. Data gaps remain explicit; no winner, peer suitability, ranking, market multiple or recommendation is inferred. Fiscal calendars and business/accounting definitions are not synchronized. Duplicate issuer CIKs are omitted. Switching the main issuer clears peer state and invalidates in-flight requests. Successful peers remain when another requested symbol fails. Loaded peer datasets are embedded in HTML exports and included in JSON downloads; offline comparisons can be read without refetching, while loading new tickers requires the running app.
