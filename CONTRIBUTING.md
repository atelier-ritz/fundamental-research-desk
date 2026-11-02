# Contributing to Fundamental

Thanks for helping make company research more traceable and understandable. Financial correctness and explicit coverage gaps take priority over additional narrative or ratings.

[Open an issue](https://github.com/atelier-ritz/fundamental-research-desk/issues/new) · [Browse pull requests](https://github.com/atelier-ritz/fundamental-research-desk/pulls)

## Start with an issue

For a missing or incorrect figure, include:

- Stock symbol, issuer and fiscal period.
- The report section and current result.
- Expected value, currency and units.
- A public SEC filing or company statement link, preferably with accession number and page/table reference.
- Exact steps to reproduce and the report revision shown in the sidebar.

For larger features or accounting-method changes, discuss the approach before opening a large pull request. Never include credentials or private financial/account data in an issue.

## Development workflow

1. Fork the repository and create a branch for a focused change.
2. Use Node.js 20+, npm and Bash. No dependency installation is currently needed.
3. Edit files in `src/`; do not edit generated bundles directly.
4. Build, test, validate, then launch the local preview:

```bash
npm run build
npm test
npm run validate
npm run dev
```

Open http://127.0.0.1:4173. After another edit, rebuild and restart the dev server. Tests use Node's built-in test runner and public SEC fixtures; ordinary checks need no provider key or live SEC access.

5. Include the regenerated `worker/index.js` and `report.html` when changing application source. Leave `dist/` untracked.
6. Open a pull request describing the problem, resulting behavior, source evidence and checks performed. Add screenshots for visible changes.

## Financial-data changes

A mapping fix needs evidence that the proposed accounting tag means what the report claims. Similar names do not guarantee equivalent scope.

- Preserve exact period dates, units, tag, filing date, accession and source URL.
- Missing is unknown, never an implicit zero.
- Treat alternative tags as alternatives; do not add overlapping totals or debt categories.
- Keep point-in-time balance-sheet values separate from duration cash-flow values.
- Do not replace gross cash purchases with accrual capex or a company's net-purchase definition.
- Reconcile free cash flow definitions explicitly when they differ.
- Restrict issuer-specific mappings to verified issuers and definitions.
- Retain losses and avoid unsupported profitable fallbacks.
- Do not invent segments, margins, operating drivers or disclosure freshness.
- Segment views can overlap. Separate margin models require profit reconciliation to the company total.
- Keep historical facts and forecast assumptions distinct; preserve financial-business safeguards.

Add a regression test that fails before the fix and passes afterward. Prefer a small source-linked SEC fixture and independent expected values over tests that merely repeat the implementation. Where relevant, cover both the normalizer and the assembled Worker, plus a company where the fallback must not apply. Document fixture retrieval dates and any reviewed supplements in `test/fixtures/README.md`.

## Interface changes

Preserve the reported-first structure. New calculated metrics belong in the collapsed Calculated analysis section; future scenarios belong in the separate Forecast model. A company-published non-GAAP value needs a first-hand URL, exact fiscal period, definition, publication/review dates and regression checks against a matching reported base. Never relabel an app-computed result as company-reported. Broader asset-purchase tags must retain their disclosed scope rather than silently filling PP&E-only capex.

Keep the search homepage simple, preserve bookmarkable ticker URLs, and test failed searches, browser back/forward and mobile widths. Preserve keyboard labels and focus states. Plain-language explanations use explicit question-mark controls; avoid restoring card-wide hover balloons. Annual-history rows intentionally omit question-mark buttons.

Exports must retain company facts and entered assumptions without silently loading a different default company. Verify affected browser behavior after unit checks; report any verification limit in the pull request.

## Secrets, hosting and scope

Never commit API keys, tokens, `.env` files or personal account data. Configure optional provider keys only in the server environment. Do not change the existing `.openai/hosting.json` project identity in a normal pull request. Forks use their own deployment identity.

No LLM runs during a company lookup. Introducing an external model, data provider, dependency, persistent storage or a new accounting methodology should be discussed explicitly because it changes cost, reproducibility or data handling.

The project currently has no license file; do not assume permissive licensing or introduce a license change incidentally in another contribution.
