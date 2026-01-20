# Git Auto-Push Rules - Mandatory GitHub Sync

**Version:** 1.0  
**Last Updated:** January 20, 2026  
**Status:** Active - Mandatory

---

## PRINSIP UTAMA

**"Setiap perubahan kode, sekecil apapun, HARUS langsung di-push ke GitHub."**

---

## I. ATURAN WAJIB AUTO-PUSH

### Kapan Harus Push ke GitHub

**WAJIB push setelah:**
- ✅ Setiap file baru dibuat
- ✅ Setiap file dimodifikasi
- ✅ Setiap file dihapus
- ✅ Setiap bug fix (sekecil apapun)
- ✅ Setiap fitur baru (sekecil apapun)
- ✅ Setiap perubahan styling/UI
- ✅ Setiap perubahan konfigurasi
- ✅ Setiap update dependencies
- ✅ Setiap perubahan database schema
- ✅ Setiap perubahan environment variables (template)

**TIDAK ADA PENGECUALIAN.**

---

## II. WORKFLOW AUTO-PUSH

### Standard Workflow (Setiap Perubahan)

```bash
# 1. Add all changes
git add .

# 2. Commit with descriptive message
git commit -m "feat: [deskripsi perubahan]"

# 3. Push to GitHub
git push origin main
```

### Commit Message Format

Gunakan conventional commit format:

```bash
# Feature baru
git commit -m "feat: add export/import layout feature"
git commit -m "feat: add watermark copyright"

# Bug fix
git commit -m "fix: resolve TypeScript error in worker.ts"
git commit -m "fix: fix overlapping panels on mobile"

# UI/Styling changes
git commit -m "style: improve button hover states"
git commit -m "style: add responsive spacing to map controls"

# Refactoring
git commit -m "refactor: simplify device status logic"

# Documentation
git commit -m "docs: update README installation steps"
git commit -m "docs: add git auto-push rules"

# Configuration
git commit -m "chore: update dependencies"
git commit -m "chore: add new environment variable"

# Database
git commit -m "db: add deviceStatusHistory model"
git commit -m "db: add netwatch configuration fields"

# Performance
git commit -m "perf: optimize device list rendering"

# Tests
git commit -m "test: add unit tests for calculateUptime"
```

---

## III. IMPLEMENTASI DALAM KIRO

### Setelah Setiap Task Completion

**MANDATORY STEPS:**

1. ✅ Verify code dengan getDiagnostics
2. ✅ Pastikan zero errors
3. ✅ Add all changes: `git add .`
4. ✅ Commit dengan descriptive message
5. ✅ Push ke GitHub: `git push origin main`

### Template Response Kiro

Setiap kali selesai mengerjakan task, Kiro HARUS:

```
✅ Task selesai - [nama task]

Yang telah dikerjakan:
- [Item 1]
- [Item 2]

Verifikasi:
- ✅ Zero TypeScript errors
- ✅ Code berfungsi dengan baik

Saya akan push perubahan ke GitHub sekarang...

[Execute git commands]

✅ Perubahan berhasil di-push ke GitHub
```

---

## IV. GIT COMMANDS REFERENCE

### Basic Commands

```bash
# Check status
git status

# Add all changes
git add .

# Add specific file
git add path/to/file.ts

# Commit
git commit -m "feat: descriptive message"

# Push to main branch
git push origin main

# Pull latest changes
git pull origin main

# Check commit history
git log --oneline -10
```

### Handling Conflicts

```bash
# If push fails due to remote changes
git pull origin main --rebase
git push origin main

# If conflicts occur
# 1. Resolve conflicts manually
# 2. Add resolved files
git add .
# 3. Continue rebase
git rebase --continue
# 4. Push
git push origin main
```

---

## V. COMMIT MESSAGE BEST PRACTICES

### Good Commit Messages

```bash
✅ git commit -m "feat: add device search functionality"
✅ git commit -m "fix: resolve session timeout issue"
✅ git commit -m "style: improve mobile responsive layout"
✅ git commit -m "refactor: extract device status logic to utility"
✅ git commit -m "perf: optimize SWR polling interval"
✅ git commit -m "docs: add git auto-push rules"
✅ git commit -m "chore: update Next.js to 14.2.0"
✅ git commit -m "db: add room assignment to devices"
```

### Bad Commit Messages

```bash
❌ git commit -m "update"
❌ git commit -m "fix bug"
❌ git commit -m "changes"
❌ git commit -m "wip"
❌ git commit -m "test"
❌ git commit -m "asdf"
```

### Commit Message Structure

```
<type>(<scope>): <subject>

<body> (optional)

<footer> (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `style`: UI/styling changes
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `docs`: Documentation
- `chore`: Maintenance tasks
- `db`: Database changes

**Examples with scope:**
```bash
git commit -m "feat(devices): add bulk delete functionality"
git commit -m "fix(auth): resolve login redirect issue"
git commit -m "style(map): improve panel positioning"
git commit -m "refactor(api): simplify error handling"
```

---

## VI. KIRO AUTOMATION

### Auto-Push After Every Change

Kiro HARUS menjalankan command ini setelah setiap perubahan:

```bash
# Single command untuk add, commit, dan push
git add . && git commit -m "feat: [deskripsi]" && git push origin main
```

### Example Kiro Workflow

```typescript
// 1. Make changes to files
// ... code changes ...

// 2. Verify with getDiagnostics
getDiagnostics(['modified-file-1.ts', 'modified-file-2.tsx'])

// 3. If no errors, push to GitHub
executePwsh({
  command: 'git add . && git commit -m "feat: add new feature" && git push origin main'
})
```

---

## VII. BRANCH STRATEGY

### Main Branch Only (For Now)

```bash
# All changes go directly to main
git push origin main
```

### Future: Feature Branches (Optional)

```bash
# Create feature branch
git checkout -b feature/new-feature

# Work on feature
# ... make changes ...

# Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Merge to main (via PR or direct)
git checkout main
git merge feature/new-feature
git push origin main
```

---

## VIII. GITIGNORE VERIFICATION

### Ensure Sensitive Files Are Ignored

```bash
# .gitignore should include:
.env
.env.local
.env.production
node_modules/
.next/
*.log
.DS_Store
```

### Check Before Push

```bash
# Verify no sensitive files will be committed
git status

# If .env is showing, add to .gitignore
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: update gitignore"
git push origin main
```

---

## IX. TROUBLESHOOTING

### Push Rejected (Remote Has Changes)

```bash
# Pull and rebase
git pull origin main --rebase

# Resolve conflicts if any
# Then push
git push origin main
```

### Forgot to Commit

```bash
# Add forgotten files
git add forgotten-file.ts

# Amend last commit
git commit --amend --no-edit

# Force push (only if not shared)
git push origin main --force
```

### Wrong Commit Message

```bash
# Amend last commit message
git commit --amend -m "feat: correct message"

# Force push (only if not shared)
git push origin main --force
```

### Undo Last Commit (Keep Changes)

```bash
# Undo commit but keep changes
git reset --soft HEAD~1

# Make corrections
# Commit again
git add .
git commit -m "feat: corrected implementation"
git push origin main
```

---

## X. CHECKLIST SEBELUM PUSH

### Pre-Push Verification

- [ ] Code compiles (no TypeScript errors)
- [ ] getDiagnostics returns zero errors
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] No sensitive data (passwords, API keys)
- [ ] .env not included in commit
- [ ] Commit message is descriptive
- [ ] Using conventional commit format

---

## XI. KIRO MANDATORY PROTOCOL

### After Every Code Change

**Kiro MUST execute these steps:**

1. **Verify Code**
   ```bash
   getDiagnostics(['all-modified-files'])
   ```

2. **If No Errors, Push**
   ```bash
   git add .
   git commit -m "feat: [descriptive message]"
   git push origin main
   ```

3. **Confirm to User**
   ```
   ✅ Perubahan berhasil di-push ke GitHub
   Commit: feat: [descriptive message]
   ```

### No Exceptions

**EVERY change MUST be pushed immediately.**

- ❌ NO "I'll push later"
- ❌ NO "Waiting for more changes"
- ❌ NO "Let me test first" (test, then push)
- ✅ YES "Push immediately after verification"

---

## XII. BENEFITS OF AUTO-PUSH

### Why Push Every Change?

1. **Backup** - Code is always backed up on GitHub
2. **History** - Complete history of all changes
3. **Collaboration** - Team always has latest code
4. **Rollback** - Easy to revert if needed
5. **Transparency** - Clear record of what changed when
6. **Safety** - No risk of losing work

### Real-World Scenarios

**Scenario 1: Computer Crash**
- ✅ With auto-push: All work is safe on GitHub
- ❌ Without auto-push: Lose hours of work

**Scenario 2: Need to Rollback**
- ✅ With auto-push: Easy to find and revert specific change
- ❌ Without auto-push: Hard to know what changed

**Scenario 3: Team Collaboration**
- ✅ With auto-push: Team always has latest code
- ❌ Without auto-push: Conflicts and confusion

---

## XIII. QUICK REFERENCE

### Standard Push Command

```bash
git add . && git commit -m "feat: [description]" && git push origin main
```

### Commit Types Quick Reference

```
feat:     New feature
fix:      Bug fix
style:    UI/styling
refactor: Code refactoring
perf:     Performance
test:     Tests
docs:     Documentation
chore:    Maintenance
db:       Database
```

### Example Commands

```bash
# After adding new feature
git add . && git commit -m "feat: add device search" && git push origin main

# After fixing bug
git add . && git commit -m "fix: resolve login issue" && git push origin main

# After styling changes
git add . && git commit -m "style: improve mobile layout" && git push origin main

# After refactoring
git add . && git commit -m "refactor: simplify API logic" && git push origin main
```

---

## XIV. ENFORCEMENT

### Mandatory Compliance

**Every Kiro execution MUST:**
1. ✅ Make code changes
2. ✅ Verify with getDiagnostics
3. ✅ Push to GitHub immediately
4. ✅ Confirm push success to user

**No exceptions. No delays. No "later".**

### Verification

User can verify by checking GitHub:
```bash
# Check last commit
git log -1

# Check remote status
git status
```

---

## REMEMBER

**"Code not pushed is code at risk. Push immediately, push always."**

Setiap perubahan, sekecil apapun, HARUS langsung di-push ke GitHub.

**NO EXCEPTIONS. NO DELAYS.**

---

**END OF GIT AUTO-PUSH RULES**

*Follow this rule religiously. Every change = immediate push.*
