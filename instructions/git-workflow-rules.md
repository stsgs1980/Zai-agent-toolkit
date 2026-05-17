# Git Workflow Rules

## Instruction for AI Agent Behavior

These rules govern how the agent handles git operations in sandboxed environments.
They exist because git history-rewriting operations (rebase, merge) can block the
entire environment if a conflict occurs, making it impossible to recover.

---

## Rule 1: Backup Before Rewrite

**Before** any git operation that rewrites history (rebase, merge, pull, reset --hard),
create a backup:

1. `git stash push -m "pre-op-backup"`
2. Copy critical source files to `/tmp/` (e.g., `cp -r src/ /tmp/src-backup/`)
3. Save git log: `git log --oneline -20 > /tmp/git-log-backup.txt`

**Why:** If the operation fails and locks the environment, you have a fallback.
Without a backup, code can be permanently lost when the session resets.

## Rule 2: Force Push Over Rebase

When `git push` is rejected because "the remote contains work that you do not have
locally" (diverged branches):

- **DO** use `git push --force-with-lease origin main` if local commits are authoritative
- **DO NOT** use `git push --force` (use only as last resort if `--force-with-lease` fails)
- **DO NOT** use `git pull --rebase` or `git pull` to synchronize first

**Why:** Rebase in a sandbox creates a catch-22: if a conflict occurs, all tools
(Bash, Read, Write, LS) are blocked by a pre-execution hook. You cannot resolve
the conflict because you cannot run any command. Force push avoids this entirely.

## Rule 3: Never Pull After Remote URL Change

After `git remote set-url origin <new-url>`:

- **DO** immediately `git push --force-with-lease origin main`
- **DO NOT** use `git push --force` (use only as last resort)
- **DO NOT** run `git pull` or `git fetch + merge`

**Why:** The new remote may have a different commit history. Pulling creates an
unnecessary merge conflict with no benefit since local state is already correct.

## Rule 4: No Panic Diagnostics

If something goes wrong with git:

1. First check: do source files still exist? (`ls src/app/`)
2. Then check: `.git/rebase-merge/` directory (rebase may be paused, not lost)
3. Then check: `git reflog` (commits are still referenced)
4. Then check: `/tmp/` backups
5. Then check: `git fsck --lost-found` (find dangling objects)

**DO NOT** tell the user "code is permanently lost" until ALL 5 checks are done.
**DO NOT** assume session reset = data loss. The sandbox often preserves files.

## Rule 5: Log Everything

After every git operation:

1. Log to `/home/z/my-project/worklog.md`: operation performed, hash before/after, result
2. Log any errors encountered
3. Log recovery steps taken

**Why:** If something goes wrong later, the log provides a trail for diagnosis.

## Rule 6: Five Checks Before Declaring Data Loss

Before declaring that code or data is permanently lost, you MUST complete ALL 5 checks:

1. `git log --oneline -20` -- do commits exist in local history?
2. `git log --oneline origin/main -10` -- do commits exist on remote?
3. `git status` -- are there uncommitted changes or stashed data?
4. `git stash list` -- are there saved stashes with your changes?
5. `ls src/app/` -- do the actual source files still exist on disk?

**NEVER** say "data is permanently lost" until all 5 checks return negative results.
The sandbox preserves files across sessions even when processes die.

## Rule 7: Diff Before Commit

Before every `git commit`, run `git diff --staged` (or `git diff` if not yet staged)
to verify that ONLY the requested changes are being committed.

```bash
1. Make changes to requested files only
2. Stage only those files: git add <specific-files>
3. Review: git diff --staged
4. Confirm: only requested changes are present
5. Then: git commit -m "..."
```

**Why:** Without a diff review, it is easy to accidentally commit unrelated changes,
temporary files, or auto-generated content. The diff check is a safety gate.

---

## Summary Table

| Situation | Correct Action | Wrong Action |
|-----------|---------------|--------------|
| Push rejected (diverged) | `git push --force-with-lease` | `git push --force` or `git pull --rebase` |
| Changed remote URL | `git push --force-with-lease` | `git push --force` or `git pull` |
| Before any rebase/merge | Backup files first | Operate without backup |
| Environment blocked by conflict | Force unlock from /tmp | Try `git rebase --continue` |
| Unsure if code is lost | Check 5 diagnostic paths | Tell user "permanently lost" |
| Before commit | `git diff --staged` review | Blind `git add . && git commit` |

---
Built with: Python + PowerShell + Markdown
