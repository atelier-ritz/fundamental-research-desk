# Cross-industry coverage audit — November 2, 2026

This is a targeted data-extraction check, not verification of every company disclosure. The new sample covers 11 issuers across technology, autos, retail, healthcare, industrials, beverages, energy, banking and an IFRS boundary case. The existing Microsoft, Apple, Amazon and NVIDIA cases remain covered by their separate fixtures.

## What was checked

- Official SEC company-facts data and submissions metadata were retrieved for all 11 issuers, with issuer CIKs checked.
- Ten US GAAP issuers normalized successfully. Selected latest annual values, five-year period matching, numeric values and filing provenance are covered by network-free regression tests.
- Quarterly reported values are checked against source facts; reconstructed values are checked against their cumulative source subtraction. This verifies the implementation, not independent accounting comparability of every quarter.
- Original annual-filing tables were additionally spot-checked for Costco, Caterpillar, Coca-Cola and Johnson & Johnson. The other sample baselines are SEC feed checks; their entire original filing tables have not been manually verified.
- JPMorgan's specialist-model safeguard and TSM's IFRS rejection were tested. No unsupported IFRS facts or bank DCF were generated.

[Machine-readable results and fact-level source links](coverage-audit.json) include the selected values, exact periods, tags, filing dates, latest supported quarter and latest directly reported quarter. They are captured test data, not a live feed.

## Sample and remaining gaps

| Symbol | Industry | Latest annual end | Findings within selected scope |
| --- | --- | --- | --- |
| META | Digital platforms | 2025-12-31 | Core annual figures present. Period-end common shares and short-term borrowing remain unmapped; do not substitute a later cover-page count or assume zero. |
| GOOGL | Internet/cloud | 2025-12-31 | Selected core and borrowing/share fields present. Share-class comparability and corporate actions still require separate review. |
| TSLA | Automotive/energy | 2025-12-31 | Core annual figures present. Debt tags have broader scope than the selected current/noncurrent long-term-debt fields; no blanket substitution was made. |
| WMT | Retail | 2026-01-31 | Core annual figures present. Exact annual-end shares and selected investment field remain unmapped. |
| COST | Warehouse retail | 2026-08-30 | Fixed the 16/17-week Q4 calendar exclusion. The latest reconstructed Q4 stays in Calculated analysis; the primary table retains the latest directly reported quarter. |
| JNJ | Healthcare | 2025-12-28 | Fixed cash dividends paid. Selected operating-income and exact period-end share fields remain unmapped. |
| CAT | Manufacturing/finance | 2025-12-31 | Added income available to common shareholders under its own label. Parent-net-income and current long-term-debt fields remain unmapped. Financing subsidiary complicates comparability. |
| KO | Beverages | 2025-12-31 | Core annual figures present. Other short-term investments and combined debt/lease tags have different scopes from existing fields; gaps remain documented. |
| XOM | Energy | 2025-12-31 | Revenue, net income and cash flows present. Selected operating-income and noncurrent-debt fields remain unmapped. Do not calculate an operating-profit substitute. |
| JPM | Banking | 2025-12-31 | Industrial capex/cash/debt fields are incomplete or unsuitable. Specialist valuation safeguard remains active. Negative reported CFO is preserved. |
| TSM | Semiconductors / IFRS | Not normalized | The feed uses IFRS taxonomy. The app explicitly supports US GAAP; no translation was invented. |

“Unmapped” means the extraction has not established that field, not that the company failed to disclose it. A present field does not establish total balance-sheet coverage or suitability for valuation.

## Verified corrections

### J&J: cash paid versus dividends declared

The 2025 cash-flow statement reports **$12.381B dividends to shareholders**. The feed uses `PaymentsOfOrdinaryDividends`, now a fallback after the existing cash-paid dividend tags. `DividendsCommonStockCash` is a paid-and-unpaid declared measure and is deliberately not a fallback.

Source: [J&J 2025 Form 10-K, consolidated cash-flow statement](https://www.sec.gov/Archives/edgar/data/200406/000020040626000016/jnj-20251228.htm).

### Caterpillar: preserve the income definition

The filing shows **$8.882B profit of consolidated and affiliated companies**, **−$0.002B attributable to noncontrolling interests**, and **$8.884B profit attributable to common shareholders**. The latter is tagged `NetIncomeLossAvailableToCommonStockholdersBasic`.

The app now retains that concept as `commonIncome`, displayed as **Income available to common shareholders** when parent net income is missing. It does not overwrite `NetIncomeLoss` or use the two measures interchangeably in ratios.

Source: [Caterpillar 2025 Form 10-K, Statement 1 and its common-shareholder footnote](https://www.sec.gov/Archives/edgar/data/18230/000001823026000008/cat-20251231.htm).

### Costco: retail quarters are not all 13 weeks

The filing describes 13 four-week periods per fiscal year: Q1–Q3 contain three periods each; Q4 contains four periods, with an extra week in a 53-week year. The former 110-day maximum excluded a valid 112-day Q4.

Only Costco now allows periods up to 119 days. Its FY2026 Q4 (May 11–August 30) is derived from annual minus nine-month totals, including **$95.723B revenue**. Four-quarter sums reconcile to annual revenue **$303.154B** and CFO **$15.817B**. These remain calculated values. The reported table does not present that reconstructed quarter as a company-reported standalone period.

Source: [Costco 2026 Form 10-K, Business fiscal-calendar description and financial statements](https://www.sec.gov/Archives/edgar/data/909832/000090983226000093/cost-20260830.htm).

## Why some potential mappings were left unchanged

[Coca-Cola's balance sheet](https://www.sec.gov/Archives/edgar/data/21344/000162828026010047/ko-20251231.htm) lists short-term investments separately from marketable securities. The feed's other-investment and combined debt/lease tags were not blindly added to existing totals. Tesla's `DebtCurrent` includes broader short-term/current obligations; it is not automatically equivalent to current long-term debt. Multi-class shares or shares measured after year-end are not substitutes for an exact annual-end common-share count.

## Reproduce

```bash
npm run build
npm test
npm run audit
npm run validate
```

`npm run audit` regenerates `docs/coverage-audit.json` from the captured fixtures without network access. Raw fixtures retain only selected standard tags and eligible histories, plus minimal SEC industry metadata. TSM retains only the namespace needed to reproduce the unsupported-taxonomy boundary. Fixture URLs and retrieval dates are stored with each case.

Add evidence and a failing regression case before broadening a mapping. This sample is not a claim of universal coverage, latest earnings-announcement review, or verified segment/source-link completeness.
