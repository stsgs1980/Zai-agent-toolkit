# Diagnostic Disclosure Rule

## Instruction for AI Agent Behavior

---

## Rule: Never Assert Data Loss Without Exhaustive Verification

When something goes wrong (git conflict, session reset, file deletion, build failure),
the agent must verify the actual state before informing the user.

---

## Verification Checklist

Before telling the user that data is lost, corrupted, or unrecoverable,
check ALL of the following in order:

### Step 1: Direct File Check
```bash
ls <expected-file-path>
wc -l <expected-file-path>
```
Does the file exist? Is it non-empty?

### Step 2: Git State Check
```bash
git status
git log --oneline -10
```
Are the expected commits in history? Is the working tree clean?

### Step 3: Git Recovery Paths
```bash
git reflog                          # All HEAD movements
git fsck --lost-found               # Dangling commits/blobs
ls .git/rebase-merge/               # Paused rebase (commits preserved)
ls .git/rebase-apply/               # Paused apply
```
Are there lost commits that can be recovered?

### Step 4: Backup Locations
```bash
ls /tmp/src-backup-*/               # Manual backups from git-safe-ops
ls /tmp/git-log-backup-*.txt        # Git log snapshots
```
Were backups created before the operation?

### Step 5: Session State
```bash
# Is this the same session or a new one?
# Same session = files likely preserved
# New session = sandbox may have reset
```

---

## Communication Rules

### DO:

- Say "I cannot determine the current state" if checks are blocked
- Say "Let me verify before concluding" when uncertain
- Present findings as facts: "File X exists, Y lines. Commit Z is in history."
- Give the user hope: "There are 3 recovery paths remaining"
- Ask the user to help if you're truly stuck: "Can you check if..."

### DO NOT:

- Say "code is permanently lost" without completing all 5 verification steps
- Say "there is nothing we can do" without trying every recovery method
- Assume session reset = data loss (sandbox often preserves files)
- Skip verification steps because you're "sure" about the outcome
- Use definitive language about loss when you have incomplete information

### Severity Ladder

When communicating problems, use appropriate severity:

| Certainty | Phrase |
|-----------|--------|
| File definitely exists | "File X is present, Y lines" |
| File not found at expected path | "File X not found at expected path, checking alternatives..." |
| All checks exhausted, file not found | "File X was not found after exhaustive search. Recovery options: A, B, C" |
| All recovery options failed | "File X could not be recovered. The last known state was [description]. You may need to recreate it." |

Never jump to the last row without passing through all previous rows.

---

## Real Example of Violation

**Wrong:**
> "Your code is permanently lost. The sandbox reset deleted all files."

**Right:**
> "I cannot see the .tsx files right now. Let me verify:
> 1. Checking /home/z/my-project/src/app/...
> 2. Checking git history...
> 3. Checking git reflog...
> 4. Checking /tmp/ backups...
> After checking all 4 paths, the files were not found.
> However, if this is the same session, the .git/rebase-merge/ directory
> may still contain the commits. Can you try starting from the same session?"

The second approach is honest, transparent, and gives the user actionable options.

---
Built with: Python + PowerShell + Markdown
