# Financial methodology and coverage notes

An evidence-led company research tool with a responsive editorial interface, SEC annual financial history, editable five-year FCFF scenarios, DCF sensitivity analysis, and self-contained interactive HTML exports. No investment ratings.

## Run

Node 20+; no dependencies.

```
npm run build
npm test
npm run dev
```

Open http://127.0.0.1:4173 and enter a symbol on the homepage. The deployed Worker exposes the same `/api/company?ticker=MSFT` endpoint and serves the embedded UI. SEC responses are cached in memory for one hour. SEC may restrict data-center access; original company-facts JSON import is an alternative.

## Sources and calculations

`src/finance.mjs` selects USD US GAAP facts with exact revenue-period matches, keeps filing accession/tag/date provenance, and selects the latest eligible disclosure for each fact. Annual periods are 330–380 days; quarterly periods and future-dated filings are excluded. It does not guarantee comparability after accounting or business changes. Microsoft is a dated, authentic SEC snapshot bundled for immediate viewing, not live market data.

Historical free cash flow = operating cash flow − cash purchases of property and equipment. Forecast FCFF = revenue × operating margin × (1 − tax) − net reinvestment. A five-year discounted FCFF stream plus Gordon-growth terminal value produces enterprise value. The simplified equity bridge adds period-end cash and disclosed short-term investments, subtracts tagged debt, and divides by period-end common shares outstanding. Unknown short-term borrowing and investment fields are excluded and disclosed; absence is not proof of zero. The bridge omits various claims and full dilution. Growth and operating-margin starts use suitable reported history; tax uses eligible reported accounting rates where available. Reinvestment, discount rate, and terminal growth require explicit user input before valuation is calculated. These are not management guidance or analyst consensus.

## Files

- `src/page.html`, `src/style.css`, `src/app.js`: responsive interface and interactions.
- `src/finance.mjs`: financial normalization and deterministic model.
- `src/worker.mjs`: SEC data retrieval and HTTP routing.
- `src/snapshot.json`: normalized SEC Microsoft snapshot with individual filing sources.
- `scripts/build.mjs`: embeds assets and data into the Worker and `report.html`.
- `report.html`: generated app document with a bundled dataset; exported company reports preserve offline scenario interactions. New ticker lookups require the running server or hosted app.
- `test/finance.test.mjs`: independent valuation reconciliation, sensitivity, missing-data and normalization tests.

## Current limits

US GAAP annual and supported quarterly figures in USD. Segment coverage is described below. Company-specific operating KPI feeds, live prices, peer multiples, automated narrative research, and consensus estimates are not integrated. Banks, insurers, REITs, and complex capital structures require specialized valuation models. Source gaps and model limitations are visible in the report.

## Business overview and revenue composition

Reviewed, filing-linked profiles cover Microsoft FY2026, Apple FY2025, and Amazon FY2025. Profiles are selected by CIK, exact annual end date, and reconciled total revenue. Apple product categories and geographic operating segments are separate views of the same revenue. Drivers are paraphrases of company disclosures, not independent causal findings or forecasts.

For other tickers, the API attempts conservative extraction of standard USD revenue facts from the original inline-XBRL filing. It accepts only supported single-axis business/product/geographic groups that match the exact annual period, contain unique nonnegative categories, and reconcile to the annual company total. Conflicts, overlaps, unsupported transforms, and failed extraction produce a visible coverage gap. Automatically derived tag names may be less readable; reviewed business descriptions and drivers are not fabricated. Reviewed profiles and any fetched extracted breakdown travel with the self-contained HTML report.

## Forecast context

Growth starts from elapsed-date annualized revenue growth over the displayed history (fallback 10% if missing or outside -25% to 60%). Operating margin uses the median of up to three suitable recent margins, preserving losses down to −500%; missing margins use an explicit 0% placeholder. Tax uses the median of recent tax expense / positive pretax income with eligible rates 0%–50% (fallback 21%). History-based starting values round to 0.1 percentage point to match controls. Net reinvestment, WACC and terminal growth start blank and require explicit entries. Displayed capex intensity and selected reinvestment proxies are context, not automatic future assumptions. The three comparison cards vary current growth by ±5 percentage points with all other inputs fixed; the range is not a confidence interval.

## Quarterly performance

Quarter-only USD revenue, operating income, net income, operating cash flow and cash capex are selected with filing provenance. Missing standalone figures are derived only from cumulative totals with a common fiscal start and XBRL tag; same-accession pairs are preferred. Fiscal Q4 can be annual total minus nine months. Cross-filing subtraction is labeled because revisions can affect comparability. TTM needs four contiguous 65–110 day quarters spanning 330–380 days. At fiscal year ends, sums are checked against matching annual totals and conflicting metrics are withheld. Same-quarter comparisons allow 52/53-week calendars. Latest revenue-bearing filing date, quarter dates, and retrieval date are shown separately; this is not an earnings-release monitor. Valuation remains anchored to annual figures.

## Financial strength

The financial-strength section uses the latest annual period consistently, with separate newer-quarter coverage above. It shows cash, selected borrowing balances, and operating/finance lease liabilities separately. Current plus noncurrent long-term debt is a subtotal, not total debt. Tagged principal maturity buckets are measured from the annual reporting date and need not equal carrying-value debt. Interest coverage is operating income divided by the selected positive reported interest expense; finance-lease interest is displayed separately without assuming that interest categories can be added. Cash after selected uses subtracts cash capex, common dividends paid and common-share buybacks paid from operating cash flow only when all inputs exist. It is not the change in cash, free cash flow, or a forecast. Missing tags, other contractual commitments, and subsequent financing are explicit gaps. No financial-health score or recommendation is produced.

## Data quality & coverage

The coverage panel evaluates the active company's selected annual metrics, quarterly metrics and prior-period match, trailing totals, reviewed versus extracted business detail, debt fields, maturity buckets, cash-use inputs, and interest coverage. It links every area to its affected report section and explains the consequence of missing data. Derived quarter-metric values and cross-filing calculations are counted separately from reported figures. Forecasts remain assumptions. Acquisitions, restatements, accounting changes, and segment reorganizations are explicitly marked not systematically reviewed; coverage never claims these events did not occur. Labels describe report coverage, not an audit opinion, investment rating, or financial-health score.

## Company comparison

Choose up to two US tickers alongside the main report. The comparison uses the same SEC normalization and deterministic calculations for annual and quarterly growth, annual/TTM operating margins and free-cash-flow margins, annual-end cash, selected long-term debt balances and a reported-interest coverage proxy. Each value includes its period and linked calculation/filing provenance. Data gaps remain explicit; no winner, peer suitability, ranking, market multiple or recommendation is inferred. Fiscal calendars and business/accounting definitions are not synchronized. Duplicate issuer CIKs are omitted. Switching the main issuer clears peer state and invalidates in-flight requests. Successful peers remain when another requested symbol fails. Loaded peer datasets are embedded in HTML exports and included in JSON downloads; offline comparisons can be read without refetching, while loading new tickers requires the running app.

Valuation evidence now shows a selected reinvestment proxy: cash PP&E purchases less separately tagged depreciation plus the change in receivables + inventory − accounts payable. Missing components or nonconsecutive annual balances withhold the proxy; other working-capital items, acquisition/currency effects, intangibles and noncash additions limit its usefulness. It does not set the forecast default. The explicit equity bridge keeps missing optional balances visible, supports manual additional claims and share dilution, and documents lease/debt overlap. It is a partial bridge, not a fully diluted or fully lease-adjusted valuation. Manual assumptions persist in exported HTML and normalized-data downloads.


### Market-price context

The price panel supports manually sourced USD prices with a mandatory price date and source name, plus an optional HTTPS link. Manual inputs are explicitly unverified. Its Alpha Vantage adapter uses `SYMBOL_SEARCH` to verify an exact US equity / USD symbol, then `GLOBAL_QUOTE` without a realtime entitlement. Quote dates are provider trading dates, not exact execution timestamps. No data or provider key is bundled.

To enable automatic retrieval, set `ALPHA_VANTAGE_API_KEY` as a **secret production runtime environment variable** through Sites, then deploy a saved version to apply that environment revision. Use a provider account/plan appropriate for your usage. Do not put the key in HTML, source, browser storage, or the hosting manifest. An absent key (or `demo`) leaves the automatic refresh disabled while manual prices remain usable. Provider quota failures do not erase an existing dated reference. Quotes are cached in an isolate for one hour; symbol metadata for one day. The first request for a symbol can use two provider calls. No background price polling occurs.

Annual P/E is price / positive annual diluted EPS. Annual FCF yield is (annual CFO − cash PP&E purchases) / (price × annual-end common shares). The latter uses an estimated market-value denominator, not a provider-reported current market cap. Required source facts must have been filed by the price date; ratios with missing or ineligible inputs are withheld. Prices and per-share metrics must share a split/share-class basis; corporate actions and ADR ratios are not verified. This is not a point-in-time historical backtesting database. Price/scenario ratios are comparisons, not expected returns. Exported HTML saves price provenance and assumptions with automatic refresh disabled; manual editing remains interactive.

### Cross-company model checks

SEC-based regression cases cover MSFT, RIVN, XOM and JPM. Suitable negative annual margin history is preserved (down to −500%), and slider bounds expand to fit it. Unavailable or unsuitable operating margins start at an explicit 0% placeholder rather than a profitable fallback. SEC SIC 6000–6499 and 6700–6799 trigger a specialist-model restriction: industrial DCF, selected reinvestment proxy, FCF-yield and industrial coverage comparisons are withheld. Eligible annual P/E and reported historical figures remain available. This SIC screening is a conservative rule, not a comprehensive suitability review; missing classifications are explicitly flagged. Live ticker lookup now loads classification metadata even for companies with reviewed business profiles. Imported company-facts JSON alone has no SIC metadata and remains unreviewed.

### Plain-English research brief

Four evidence-linked cards summarize annual performance, the first reconciled revenue view, selected cash/debt/maturity figures, and open questions. Content is deterministic and uses only the displayed report dataset; no model-generated causes or ratings are supplied. Financial-business restrictions, missing inputs, negative results and source dates remain explicit. A local sensitivity statement compares enterprise-value effects from independent ±1 percentage-point changes to growth, operating margin and discount rate, holding other current assumptions fixed; it is withheld if all three pairs cannot be calculated. The summary refreshes with company/scenario changes and is embedded in HTML exports.

### Category-based revenue forecasts

Forecast & valuation offers an opt-in category model when a matching, reconciled revenue view has 2–20 categories and the company is not excluded by the financial-industry screen. One view is used at a time, including clearly labeled product/geographic views when supplied. Each category compounds at its own user-assumed annual rate for five years; yearly sums feed the existing DCF, equity bridge, sensitivity grid, research brief and market-price scenarios. Tax, reinvestment and terminal-growth assumptions remain company-wide. When reviewed segment profits reconcile, optional segment-specific margin assumptions can capture changing business mix; otherwise the company-wide margin applies. No undisclosed segment costs or profits are inferred.

Category inputs initially use rounded supplied prior-category growth if between −90% and +100%; otherwise they start at an explicit 0% judgment input. Historical definitions/reorganizations are not systematically reviewed. A common adjustment shifts every category rate equally in percentage points; lower/higher scenarios apply −/+5 points to all rates. The derived company growth rate can vary each year as business mix changes. Switching views replaces, rather than adds, the revenue basis. Reset returns to company-wide mode. Exported HTML and normalized-data downloads retain the category model within assumptions; company changes reset it. DCF validation checks company, fiscal period, total revenue reconciliation and finite bounded effective growth rates.

### Financial coverage corrections — November 1, 2026

- Added alternative standard tags for current marketable securities, commercial paper, and dividends paid. Alternatives are selected by priority and are never added together. The dividends fallback can include dividend equivalents or other classes; source scope remains visible.
- Amazon alone maps `PaymentsToAcquireProductiveAssets` to gross cash equipment purchases in annual and quarterly normalization. Reviewed custom-tag property-sales/incentive amounts for FY2021–2025 retain exact periods, filing URLs and review date. These fixed supplements are not an automatically refreshed custom-tag feed. History keeps CFO minus gross cash purchases; a separate table reconciles to Amazon's net-purchase definition. FY2025: $139.514B CFO − $131.819B purchases = $7.695B; adding $3.499B proceeds/incentives gives $11.194B company-definition FCF.
- Reinvestment, WACC and terminal growth have no preset values. Valuation, scenarios, sensitivity and equity bridge are withheld until all three are explicitly entered. History-based inputs remain hypotheses. Exports retain entered inputs and the gate survives reload.
- Amazon FY2025 segment operating income is reviewed and reconciled ($29.619B North America, $4.750B International, $45.606B AWS). Microsoft FY2026 also has reviewed segment profits, as described below; unsupported views explicitly show profit coverage gaps. Reconciled profit views can optionally use separate editable segment-margin assumptions; projected company profit is the sum of segment revenue × segment margin. The common margin anchor shifts each segment margin equally; taxes and reinvestment remain company-wide. No margins are inferred where profits do not reconcile.
- `?ticker=AAPL` and other valid ticker parameters load the requested report, preserve section anchors, and support browser back/forward. Successful searches update the URL. Pending/failed lookups explicitly label retained results. Initial bundled snapshots are labeled separately from on-demand SEC retrieval.
- The public header now reads Company research. SEC mapped-period/filing freshness is separated from earnings-release review. The reviewed Amazon FY2025 release is identified as such; newer announcements are explicitly not checked. No automated latest-earnings claim is made.

Validation: 59 formula/normalization regression tests, including actual Apple/Amazon SEC tag fixtures, exact cash-flow reconciliation, required valuation inputs, issuer scoping, and segment-mix profit calculations. Browser checks cover Apple/Amazon lookup, explicit input gate, category-margin mode, retained-result warning and ticker bookmarks. These checks are targeted and do not constitute a full audit of every company or quarterly disclosure.

### Refresh reliability follow-up — report revision 2026-11-01.2

Fresh production API checks confirmed Apple FY2025 investments $18.763B, commercial paper $7.979B and dividends $15.421B, plus all five Amazon gross-capex periods. The reported blanks were not reproduced on a fresh browser page. The former API allowed browser caching for an hour, so stale responses remain a plausible explanation, not a proven root cause. Analyze and peer retrieval now use `cache: no-store`, revision-specific query keys and `refresh=1` to bypass the normalized-company cache. Both cached and fresh backend responses and the HTML use `Cache-Control: no-store`; the browser rejects a mismatched response schema. Report revision is visible in the sidebar and load status. Server-side metadata caching is unchanged.

Microsoft FY2026 segment operating income is now reviewed against the annual report: Productivity and Business Processes $83.879B; Intelligent Cloud $56.972B; More Personal Computing $14.386B; total $155.237B. Prior FY2025 amounts reconcile to $128.528B. Source: https://www.microsoft.com/investor/reports/ar26/index.html, Segment Results of Operations and Note 18. The existing optional segment-margin forecast now works for this reconciled view too.

Freshness leads with Latest announcement not verified; any historical release review is subordinate and dated. Company-specific report links are visible and successful lookups update `?ticker=...`. Missing judgment inputs show one checklist; equity bridge, scenario comparison, projections, sensitivity and price-scenario panels stay hidden until the model is valid. Annual USD amounts and the FCF reconciliation now show three decimals in billions to preserve million-dollar precision.

Validation: 61 passing tests, including a new test of the actual assembled production Worker with official SEC fixture inputs, browser-cache headers, normalized-cache bypass and returned field values. Browser checks verify the input checklist, panel restoration/hiding and company switching. The cache explanation is provisional; verification of every disclosure remains outside this targeted correction.
