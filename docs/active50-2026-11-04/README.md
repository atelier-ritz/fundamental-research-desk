# Top-50 share-volume coverage audit

Ranking session: November 3, 2026. Audited November 4, 2026 using production revision 2026-11-03.2.

Open [report.html](report.html) for the interactive audit. [results.json](results.json) retains selected normalized facts, gap reasons and filing sources; [ranking.json](ranking.json) freezes the ranked sample.

Observed outcomes: **38/50 loaded**, **4 unsupported-US-GAAP errors**, **8 minimum-eligible-history errors**. **25/38** loaded reports contain all five selected core fields; only AAPL and GOOGL contain all 12 selected fields. These counts describe extraction coverage, not verified financial accuracy.

## Highest priority: a loaded report can be stale

GERN and XXII load but anchor to FY2023. Their FY2025 10-Ks exist. XXII has a newer standard revenue tag including assessed tax that the engine does not support; Geron’s newer product revenue requires original-filing extraction review. This can omit newer years from the entire report, not just one field.

- https://www.sec.gov/Archives/edgar/data/886744/000088674426000008/gern-20251231.htm
- https://www.sec.gov/Archives/edgar/data/1347858/000110465926034814/xxii-20251231x10k.htm

## “Insufficient history” is not a reliable root-cause diagnosis

Eight tickers receive the two-comparable-periods error. RKT actually reports FY2025 net revenue of $6.695B under RevenuesNetOfInterestExpense, outside the supported revenue tags. GRAB reports $3.370B FY2025 revenue under IFRS in a 20-F; a small US-GAAP namespace is present, so the current format guard gives a misleading history error. The other six require individual diagnosis; this audit does not assume they lack financial history.

- https://www.sec.gov/Archives/edgar/data/1805284/000162828026013283/rkt-20251231.htm
- https://www.sec.gov/Archives/edgar/data/1855612/000185561226000020/ck0001855612-20251231.htm

## Issuer-name consistency needs a guard

BAC resolves to the expected CIK 70858, but company-facts names it “BofA Finance LLC” while submissions names it “BANK OF AMERICA CORP /DE/”. This is a confirmed name inconsistency, not proof that the CIK or numerical facts belong to the wrong issuer. The UI currently trusts the facts-feed name.

- https://data.sec.gov/api/xbrl/companyfacts/CIK0000070858.json
- https://data.sec.gov/submissions/CIK0000070858.json

## Blank capex and debt do not all have the same cause

12 of 38 loaded reports lack selected PP&E cash purchases; 18 lack selected noncurrent long-term debt. Broader spending definitions, leases, financial-company reporting, custom tags and absent matching periods can all explain gaps. NVIDIA’s broader equipment/intangible purchases must remain distinct. These counts are extraction coverage, not a count of proven mapping bugs.



## Business mix is only partly covered

23 of 38 loaded reports have a reconciled revenue breakdown. Only Amazon has mapped segment operating profits in this sample. Reviewed Microsoft profit coverage exists but MSFT is not in this session’s top 50. Missing profits do not imply that issuers did not disclose them.



## Reproduce

Run `node scripts/audit-active50.mjs` from the project root (network required; calls production with two concurrent workers). Successful and failed responses are reused from `/tmp/fundamental-active50-2026-11-04` on the same machine. To perform a new live observation, use a fresh cache location and preserve this dated report; do not present new results as this snapshot. Then run `node scripts/render-active50.mjs` to rebuild the HTML. The four original-filing spot checks and BAC metadata checks are documented findings, not automated by the renderer.

Ranking source: https://stockanalysis.com/markets/active/. One-session share volume, not average or dollar volume. Ranking provider’s universe; not independently consolidated exchange data. No production application code was changed as part of this audit.
