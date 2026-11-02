# Repository workflow

- The user wants completed changes committed and pushed to the GitHub remote as part of finishing work. The current remote is `github`; verify the remote and branch before pushing. Respect any later local-only or no-push instruction.
- Run checks appropriate to the change. Build before testing application changes because the Worker regression suite imports the generated bundle. Documentation-only edits do not require rerunning financial tests.
- Keep `README.md` and `CONTRIBUTING.md` accurate when setup or contributor workflows change.
- Keep secrets out of source and commit history. Preserve the existing Sites project identity and audience when publishing app changes.
- Confirm the push succeeded; clearly report any work that remains local or unpushed. Do not force-push or overwrite contributor work.
