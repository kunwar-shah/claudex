# 🌿 Claudex Git Branching Strategy

This document outlines the branching strategy for Claudex development to keep the main branch stable and production-ready.

---

## 📋 Branch Structure

### Main Branches

**`main`** (Production Branch)
- Always stable and production-ready
- Contains only tested and approved releases
- Protected branch (no direct commits)
- Tagged with version releases (v1.0.0, v1.1.0, etc.)

**`dev-X.X`** (Development Branches)
- One branch per version/phase
- Contains work-in-progress for that version
- Can be unstable during development
- Merged to main only when phase is complete and tested

---

## 🚀 Workflow for Each Phase

### Phase 1: v1.1.0 (Quick Wins)

**Current Branch**: `dev-1.1`

```
main (v1.0.0)
  ↓
  └─→ dev-1.1 (work here)
         ↓
         └─→ feature branches (optional)
```

**Steps:**

1. **Start Phase 1**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b dev-1.1
   ```

2. **Work on Features** (Current branch: `dev-1.1`)
   - Implement title extraction
   - Re-enable Tremor dashboard
   - Add Docker support
   - Commit regularly with clear messages

3. **Complete Phase 1**
   ```bash
   # On dev-1.1 branch
   git add .
   git commit -m "feat: complete Phase 1 - Quick wins

   - Fix title extraction from messages
   - Re-enable Tremor UI dashboard with real data
   - Add Docker containerization
   - Update documentation

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"

   git push origin dev-1.1
   ```

4. **Test Everything**
   - Run all tests
   - Manual testing
   - Check Docker build
   - Verify documentation

5. **Merge to Main**
   ```bash
   git checkout main
   git merge dev-1.1
   git tag -a v1.1.0 -m "Release v1.1.0: Quick Wins"
   git push origin main --tags
   ```

6. **Create GitHub Release**
   - Go to GitHub releases
   - Create new release from v1.1.0 tag
   - Add release notes
   - Publish

---

### Phase 2: v1.2.0 (UX Enhancements)

**After Phase 1 is merged:**

```bash
git checkout main
git pull origin main
git checkout -b dev-1.2
```

**Workflow:**
- Work on dev-1.2 branch
- Implement dark mode and favorites
- Test thoroughly
- Merge to main when complete
- Tag as v1.2.0

---

### Phase 3-6: Similar Pattern

**Phase 3: v1.3.0**
```bash
git checkout main
git pull origin main
git checkout -b dev-1.3
```

**Phase 4: v1.4.0**
```bash
git checkout main
git pull origin main
git checkout -b dev-1.4
```

**Phase 5: v1.5.0**
```bash
git checkout main
git pull origin main
git checkout -b dev-1.5
```

**Phase 6A: v1.6.0 (RAG)**
```bash
git checkout main
git pull origin main
git checkout -b dev-1.6
```

**Phase 6B: v1.7.0 (Fine-tuning) - Optional**
```bash
git checkout main
git pull origin main
git checkout -b dev-1.7
```

---

## 🔀 Optional: Feature Branches

For larger features, you can create feature branches from dev-X.X:

```bash
# Example: Working on dark mode in Phase 2
git checkout dev-1.2
git checkout -b feature/dark-mode

# Work on feature
git add .
git commit -m "feat: implement dark mode toggle"

# Merge back to dev branch
git checkout dev-1.2
git merge feature/dark-mode

# Delete feature branch
git branch -d feature/dark-mode
```

---

## 📝 Commit Message Format

Use conventional commits format:

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**

```bash
# Feature
git commit -m "feat: add dark mode toggle with theme persistence"

# Bug fix
git commit -m "fix: resolve title extraction for empty conversations"

# Documentation
git commit -m "docs: update setup guide with Docker instructions"

# Multiple changes
git commit -m "feat: complete Phase 1 features

- Implement title extraction from first messages
- Re-enable Tremor dashboard with analytics
- Add Docker and docker-compose configuration
- Update README and documentation

Closes #12, #13, #15"
```

---

## 🚫 Branch Protection Rules

### Main Branch Rules:

**Recommended Settings (configure on GitHub):**

1. **Require pull request reviews**
   - At least 1 approval (if team)
   - Or: Direct merge allowed for solo dev

2. **Require status checks to pass**
   - Run tests before merging
   - Build must succeed

3. **Require branches to be up to date**
   - Prevents conflicts

4. **Do not allow force push**
   - Protects history

**For solo development:**
- Direct merges to main are OK
- Just ensure thorough testing first
- Always test on dev branch before merging

---

## 🔄 Development Workflow Diagram

```
main (v1.0.0)
  │
  ├─→ dev-1.1 (Phase 1: Quick Wins)
  │     │
  │     ├─→ Work on title extraction
  │     ├─→ Work on Tremor dashboard
  │     ├─→ Work on Docker
  │     └─→ Test everything
  │
  ├─← Merge dev-1.1 → main (v1.1.0) ✓
  │
  ├─→ dev-1.2 (Phase 2: UX)
  │     │
  │     ├─→ Work on dark mode
  │     ├─→ Work on favorites
  │     └─→ Test everything
  │
  ├─← Merge dev-1.2 → main (v1.2.0) ✓
  │
  ├─→ dev-1.3 (Phase 3: Performance)
  │     └─→ ...
  │
  └─→ ... and so on
```

---

## ✅ Checklist Before Merging to Main

Before merging any dev-X.X branch to main:

- [ ] All planned features complete
- [ ] All tests passing
- [ ] Manual testing done
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] README.md updated (if needed)
- [ ] No merge conflicts
- [ ] Build succeeds
- [ ] Docker image builds (if applicable)
- [ ] Code reviewed (if team)
- [ ] Version number updated in package.json

---

## 🏷️ Tagging Strategy

### Version Tags

**Format**: `vMAJOR.MINOR.PATCH`

- `v1.0.0` - Initial release
- `v1.1.0` - Phase 1 (Quick wins)
- `v1.2.0` - Phase 2 (UX)
- `v1.3.0` - Phase 3 (Performance)
- `v1.4.0` - Phase 4 (Integration)
- `v1.5.0` - Phase 5 (Analytics)
- `v1.6.0` - Phase 6A (RAG AI)
- `v1.7.0` - Phase 6B (Fine-tuning) [Optional]

**Creating Tags:**

```bash
# After merging to main
git checkout main
git pull origin main

# Create annotated tag
git tag -a v1.1.0 -m "Release v1.1.0: Quick Wins

Features:
- Title extraction from messages
- Tremor UI dashboard with analytics
- Docker containerization

See CHANGELOG.md for full details."

# Push tag to remote
git push origin v1.1.0

# Or push all tags
git push origin --tags
```

**Viewing Tags:**

```bash
# List all tags
git tag

# Show tag details
git show v1.1.0

# Checkout a specific tag
git checkout v1.1.0
```

---

## 🔧 Useful Git Commands

### Switching Branches

```bash
# Switch to existing branch
git checkout dev-1.1

# Create and switch to new branch
git checkout -b dev-1.2

# Switch back to main
git checkout main
```

### Checking Status

```bash
# Current branch and changes
git status

# List all branches
git branch -a

# Show branch history
git log --oneline --graph --all
```

### Updating Branches

```bash
# Update main from remote
git checkout main
git pull origin main

# Update dev branch from main
git checkout dev-1.1
git merge main
```

### Stashing Changes

```bash
# Save work in progress
git stash

# List stashes
git stash list

# Apply stashed changes
git stash pop

# Apply specific stash
git stash apply stash@{0}
```

---

## 🚨 Emergency Fixes (Hotfixes)

If you need to fix a critical bug in production:

```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-bug-fix

# Fix the bug
# ... make changes ...

git add .
git commit -m "fix: resolve critical bug in production"

# Merge directly to main
git checkout main
git merge hotfix/critical-bug-fix

# Tag as patch version
git tag -a v1.1.1 -m "Hotfix: Critical bug fix"
git push origin main --tags

# Also merge to current dev branch
git checkout dev-1.2  # or whatever current dev branch
git merge hotfix/critical-bug-fix

# Delete hotfix branch
git branch -d hotfix/critical-bug-fix
```

---

## 📊 Current Branch Status

| Branch | Purpose | Status | Based On | Merges To |
|--------|---------|--------|----------|-----------|
| `main` | Production | ✅ Stable (v1.0.0) | - | - |
| `dev-1.1` | Phase 1 development | 🟡 Active | main | main |
| `dev-1.2` | Phase 2 development | ⚪ Not created yet | main | main |
| `dev-1.3` | Phase 3 development | ⚪ Not created yet | main | main |
| `dev-1.4` | Phase 4 development | ⚪ Not created yet | main | main |
| `dev-1.5` | Phase 5 development | ⚪ Not created yet | main | main |
| `dev-1.6` | Phase 6A development | ⚪ Not created yet | main | main |
| `dev-1.7` | Phase 6B development | ⚪ Not created yet | main | main |

---

## 🎯 Quick Reference

### Start New Phase
```bash
git checkout main
git pull origin main
git checkout -b dev-X.X
```

### Save Progress
```bash
git add .
git commit -m "feat: description of changes"
git push origin dev-X.X
```

### Complete Phase
```bash
# Test everything first!
git checkout main
git merge dev-X.X
git tag -a vX.X.0 -m "Release vX.X.0: Phase name"
git push origin main --tags
```

### Create Next Phase Branch
```bash
git checkout main
git pull origin main
git checkout -b dev-X.X
```

---

## 📚 Resources

- [Git Branching Documentation](https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

---

**Current Active Branch**: `dev-1.1` (Phase 1: Quick Wins)

**Next Steps:**
1. Work on Phase 1 features in `dev-1.1` branch
2. Commit regularly with clear messages
3. Test thoroughly
4. Merge to `main` when Phase 1 is complete
5. Create `dev-1.2` for Phase 2

---

*Last Updated: October 24, 2025*
