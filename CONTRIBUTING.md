# Contributing to Pulse

Pulse started as a solo university project, so this isn't a mature open-source workflow with a governance doc — just a normal repo that's happy to take issues and pull requests.

## Reporting a bug or suggesting a feature

Open an issue with:

- What you expected vs. what actually happened
- Steps to reproduce (for bugs)
- Your environment (OS, PHP version, browser) if it's likely relevant

## Submitting a change

1. Fork the repo and create a branch off `main`:
   ```bash
   git checkout -b fix/short-description
   ```
2. Keep the change focused — one bug or one feature per PR. Large, mixed PRs are hard to review and easy to reject by accident.
3. Match the existing structure: controllers/models/routes stay separated on the backend, and frontend components follow the patterns already in `frontend/pages` and `frontend/src`.
4. Before opening the PR, run the same checks CI would expect:
   ```bash
   npm run check
   ```
   ```powershell
   Get-ChildItem backend,tests -Recurse -Filter *.php | ForEach-Object { & C:\xampp\php\php.exe -l $_.FullName }
   ```
   ```powershell
   & C:\xampp\php\php.exe tests\api_test.php
   ```
5. Write a commit message that explains *why*, not just *what* (`Fix follower count not updating on unfollow`, not `fix bug`).
6. Open the PR against `main` with a short description and, for UI changes, a before/after screenshot or GIF.

## What's genuinely useful right now

The Roadmap section in the README is the honest list of what's missing — pagination, CI/CD, image upload hardening, and production deploy config are all real gaps, not busywork. A PR against any of those is worth more than a drive-by formatting change.

## Ground rules

Be respectful in issues and reviews, and don't submit AI-generated PRs you haven't actually read and tested yourself — a reviewer's time is the scarcest resource on a small project like this.
