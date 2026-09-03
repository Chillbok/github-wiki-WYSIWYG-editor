---
name: commit-rules
description: Use when creating git commits, writing commit messages, checking git status/diff/log for commit. Triggers on commit, git commit, 커밋, 커밋 메시지 requests. Enforces English-only Conventional Commits style for this project.
---

# Commit Rules

## What I do

- Create consistent git commits for this project.
- Inspect staged/unstaged/untracked changes before committing.
- Write English-only commit messages in Conventional Commits style.

## When to use me

Use this when the user asks to create a commit, write a commit message,
or check changes for a commit. Trigger keywords: `commit`, `git commit`,
`커밋`, `커밋 메시지`, `변경사항 커밋`.

Do NOT use for amending the last commit message. Delegate that case to
the `amend-commit` skill.

## Pre-check procedure

1. Run read-only inspection:
   - `git status --short`
   - `git branch --show-current`
   - `git log --oneline -5`
   - `git diff --stat` and `git diff`
   - For untracked files, read the file content directly.
2. Classify changes into staged / unstaged / untracked.
3. Stage only intended files. Do NOT use `git add -A` blindly.
   Example: `git add README.md`
4. Verify with `git diff --cached --stat` before committing.
5. Check push status with `git status` and `git log @{u}..HEAD`.
   Do NOT push unless the user explicitly requests it.

## Message rules (English only - strict)

- Title AND body MUST be written in English. Korean is not allowed
  anywhere in the commit message.
- Format: `<type>: <subject>` plus English bullet body when needed.
- Allowed types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`,
  `build`, `ci`.
- Subject rules:
  - Imperative English, max 50 chars.
  - Start with lowercase, no trailing period.
  - Example: `docs: add README with features, stack, and roadmap`
- Body rules:
  - English bullets describing what and why.
  - Keep one bullet per meaningful change.
  - Include `Refs:` or `Follow-up:` in English if needed.
- Never commit secrets, tokens, large logs, or unrelated files.

## Example

```text
docs: add README with features, stack, and roadmap

- Add 52-line project overview for GitHub Wiki WYSIWYG editor
- Document auto-completion, live preview, tabs, and file search
- Describe image upload, duplicate check, and https link rewrite
- Document batch commit, push, pull and message helper
- Record Tauri, JavaScript, Rust stack choices and reasons
- Define editor core, GFM parser, Git sync, explorer architecture
- Add v0.1 roadmap and MIT license notice
```

Corresponding commands:

```bash
git add README.md
git diff --cached --stat
git commit -m "docs: add README with features, stack, and roadmap" -m "- Add 52-line project overview..."
```

## Verification

- After `git commit`, run `git log --oneline -3`, `git status --short`,
  and `git show --stat HEAD` to confirm.
- Report the new commit hash, title, and changed files concisely in Korean.
  The report itself is Korean, but the commit message stays English.
