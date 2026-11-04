# Follow-up to the top-50 volume audit — November 4, 2026

Baseline: `docs/active50-2026-11-04/` preserves the original production observation (38 reports loaded). It is not overwritten by this fix.

## Implemented

- Annual US GAAP 20-F / 40-F forms now join the 10-K path. US GAAP quarterly reconstruction still accepts only its supported 10-K/10-Q periods; foreign forms are not assumed to be ordinary quarters.
- Selected IFRS annual definitions in USD are supported, using exact IFRS tags. A small ancillary US GAAP namespace no longer hides the primary IFRS statements. Non-USD currencies produce `unsupported_currency`; no converted or mixed-currency report is produced.
- New standard revenue alternatives cover revenue including assessed taxes (XXII) and revenue net of interest expense (RKT), retaining scope notes. They are selected, never summed. These definitions are not assumed comparable to industrial tax-exclusive revenue.
- The newest annual document can recover eligible nondimensional standard-tag facts missing from company-facts. Entity identifier, unit, exact period, filing provenance and conflicts are checked. Facts link to the original document. Recovery failures do not erase existing facts or certify completeness.
- Geron's FY2024/FY2025 total revenue is a reviewed printed-total exception, $76.994M / $183.881M. Product-only revenue is $76.495M / $183.623M and excludes royalties. The exception is tied to the exact source accession, printed totals and operating-income bases. It is visibly labeled as reviewed, not a calculated sum or invented standard tag. Quarterly scope is not verified; Geron's quarterly table is withheld rather than showing a component as the total.
- Latest annual filing metadata is compared with the returned revenue base. Incomplete coverage produces a prominent warning and withholds valuation. SGRX is explicitly flagged: submissions lists June 30, 2026, while available supported annual revenue ends June 30, 2025. This discrepancy is not repaired by shifting dates or assuming an undisclosed value. Matching annual periods do not verify latest earnings announcements.
- Display names prefer the matching SEC submissions record. BAC now displays BANK OF AMERICA CORP /DE/, retaining BofA Finance LLC as the differing facts-feed name. A conflicting CIK withholds the report; legal-name abbreviation normalization reduces nuisance differences.
- Broader cash purchases of productive assets and debt/capital-lease balances can appear as separate source-scope lines when narrower coverage is missing. They do not replace PP&E-only capex or noncurrent debt in FCF/valuation calculations. For example, American Airlines' productive-asset purchase line includes aircraft purchase deposits.
- Segment extraction can retain directly tagged operating profits in matching single-axis annual contexts, including losses. Conflicts remain unmapped. Margin modeling still requires reconciliation to company operating income. It does not treat arbitrary segment-profit definitions as operating income.

## Observed scope after fixes

The built Worker was exercised against all 50 downloaded official facts/submissions responses and original annual documents. **46/50 load**, compared with **38/50** in the baseline. GERN and XXII now reach FY2025. New loaders include HUBC, GRAB, INLF, NU, RBNE, CHSN, SGRX and RKT. SGRX remains explicitly flagged for annual coverage rather than silently current. Segment profit support remains limited: the original-filing run recovered directly tagged profits for RBNE in addition to the existing reviewed Amazon profile; this is not complete segment coverage.

The four retained support boundaries are BBD (BRL statements), NOK/STLA (EUR statements), and SPCX (no eligible comparable annual revenue history in the supported filing path; quarterly and registration facts are not silently treated as audited annual statements). These are explicit unsupported cases, not successful complete reports. Supporting non-USD presentation, registration statements and more custom disclosures remains future work.

## Validation

94 tests pass, including the full 50-company snapshot, Geron's total-vs-product distinction and changed-source withholding, IFRS and foreign forms, non-USD boundaries, issuer mismatch, stale valuation withholding, source parser conflicts/dimensions/entity checks, separate broad-scope fields and segment-profit losses/conflicts. Build and ESM artifact validation pass. Saved fragments are regression data, not an independent financial audit or proof of current data.

Sources include:

- Geron: https://www.sec.gov/Archives/edgar/data/886744/000088674426000008/gern-20251231.htm (MD&A total revenue versus product revenue and royalties)
- XXII: https://www.sec.gov/Archives/edgar/data/1347858/000110465926034814/xxii-20251231x10k.htm
- Rocket: https://www.sec.gov/Archives/edgar/data/1805284/000162828026013283/rkt-20251231.htm
- Grab: https://www.sec.gov/Archives/edgar/data/1855612/000185561226000020/ck0001855612-20251231.htm
- BAC issuer metadata: https://data.sec.gov/submissions/CIK0000070858.json

The original live audit and any post-publication rerun remain dated software observations, with selected original-filing checks. Missing fields are not necessarily missing company disclosures or extraction defects.
