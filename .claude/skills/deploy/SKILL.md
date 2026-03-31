---
description: Build, commit, and push to GitHub
command: deploy
user-invocable: true
---

# Deploy

1. Run `cd /Users/tedretzloff/kite-matcher && npx next build` and fix any errors before continuing.
2. Run `git status` to see what changed.
3. Stage the changed files (don't use `git add -A`, be specific).
4. Create a commit with a clear message describing what changed.
5. Push to origin main.
6. Report what was committed and the push status.

If the build fails, fix the errors and re-run. Don't push broken code.
