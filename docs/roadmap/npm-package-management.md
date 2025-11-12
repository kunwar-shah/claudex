# npm Package Management Guide

**Package Name**: `@kunwarshah/claudex`
**Current Version**: 1.2.1
**Registry**: https://www.npmjs.com/package/@kunwarshah/claudex
**Last Updated**: 2025-11-12

---

## 📦 Package Overview

Claudex is distributed as a global npm package that provides a CLI command `claudex` for running the conversation viewer locally.

### Current Package Features (v1.2.2+)

✅ **Global CLI Installation**
- Install: `npm install -g @kunwarshah/claudex`
- Command: `claudex` (available globally)
- Supports: `--help`, `--version`, `--port`, `--project-root` flags

✅ **Flexible Port Configuration**
- CLI flag: `claudex --port 3500` or `claudex -p 3500`
- Environment variable: `PORT=3500 claudex`
- Default: 3400
- Better error messages for port conflicts

✅ **Automatic Mode Detection**
- **Production Mode**: Serves pre-built files from `client/dist` (custom port)
- **Development Mode**: Runs Vite dev server if no dist folder (ports 3000 + custom port)

✅ **On-Demand Dependency Installation**
- First run: Automatically installs server + client dependencies
- Subsequent runs: Instant startup (dependencies cached)
- No postinstall script (security best practice)

✅ **npm Workspaces**
- Manages server and client as separate workspaces
- Compatible with npm, yarn, pnpm, bun
- No postinstall security concerns

✅ **Cross-Platform Compatibility**
- Works on Linux, macOS, WSL2
- Node.js 18+ required
- Graceful shutdown handling (SIGINT/SIGTERM)

---

## 🎯 CLI Usage

### Basic Commands

```bash
# Start with default settings
claudex

# Show help
claudex --help

# Show version
claudex --version
```

### Port Configuration

```bash
# Use custom port (CLI flag)
claudex --port 3500
claudex -p 8080

# Use environment variable
PORT=3500 claudex

# If port is in use, you'll see:
❌ Port 3400 is already in use!
💡 Try: claudex --port 3500
```

### Custom Project Directory

```bash
# Use custom Claude projects directory
claudex --project-root ~/my-claude-chats

# Or with environment variable
PROJECT_ROOT=~/my-claude-chats claudex
```

### Combined Options

```bash
# Custom port + custom projects
claudex --port 8080 --project-root ~/my-chats

# Environment variables
PORT=8080 PROJECT_ROOT=~/my-chats claudex
```

---

## 🚀 Publishing Workflow

### Version Numbering (Semantic Versioning)

```bash
# Patch (bug fixes): 1.2.1 → 1.2.2
npm version patch

# Minor (new features): 1.2.2 → 1.3.0
npm version minor

# Major (breaking changes): 1.3.0 → 2.0.0
npm version major
```

### Pre-Publish Checklist

- [ ] All tests passing: `npm test --workspaces`
- [ ] Client built: `npm run build --workspace=client`
- [ ] Version updated in package.json
- [ ] CHANGELOG.md updated with release notes
- [ ] All changes committed to git
- [ ] On correct branch (main or release branch)
- [ ] No uncommitted changes

### Publishing Steps

```bash
# 1. Navigate to package directory
cd /home/boss/claude-chats/claude-viewer

# 2. Ensure you're on main branch with latest code
git checkout main
git pull origin main

# 3. Update version (creates git tag automatically)
npm version patch  # or minor/major

# 4. Build client for production
npm run build --workspace=client

# 5. Test package locally
npm pack
npm install -g ./kunwarshah-claudex-1.2.2.tgz
claudex --version  # Should show new version
claudex  # Test it works
npm uninstall -g @kunwarshah/claudex

# 6. Publish to npm
npm publish --access public

# 7. Verify publication
npm view @kunwarshah/claudex version
npm view @kunwarshah/claudex

# 8. Test installation from npm
npm install -g @kunwarshah/claudex
claudex --version
claudex

# 9. Push git tags to GitHub
git push origin main --tags

# 10. Create GitHub release (optional but recommended)
gh release create v1.2.2 --title "v1.2.2" --notes "Release notes here"
```

---

## 📝 Best Practices

### 1. Always Build Before Publishing

```bash
# ALWAYS run this before npm publish
npm run build --workspace=client
```

**Why**: The package includes `client/dist/` in the tarball. Without building, users get an empty dist folder and the package won't work in production mode.

### 2. Test Locally Before Publishing

```bash
# Create tarball and test locally
npm pack
npm install -g ./kunwarshah-claudex-*.tgz
claudex  # Should work without errors
npm uninstall -g @kunwarshah/claudex
```

**Why**: Catches issues before they reach users (missing files, broken scripts, etc.)

### 3. Use Workspaces (Not Postinstall)

✅ **DO**: Use npm workspaces for dependency management
❌ **DON'T**: Use postinstall scripts (blocked by pnpm/bun, security risk)

**Current approach**: `bin/claude-viewer.js` checks for dependencies and installs on first run.

### 4. Semantic Versioning

- **Patch** (1.2.1 → 1.2.2): Bug fixes, no breaking changes
- **Minor** (1.2.2 → 1.3.0): New features, backward compatible
- **Major** (1.3.0 → 2.0.0): Breaking changes, API changes

### 5. Keep Package Small

Current size: ~469 KB (1.8 MB unpacked)

**Included files** (via `files` in package.json):
- `bin/` - CLI entry point
- `server/src/` - Backend code
- `server/package.json` - Server dependencies
- `client/dist/` - Pre-built frontend (MUST build before publish)
- `client/package.json` - Client dependencies
- `scripts/check-system.mjs` - System checker
- `LICENSE`, `README.md`, `quick-start.sh`

**Excluded** (automatically):
- `node_modules/` - Users install their own
- `.git/`, `.env`, `data/`, logs, test files
- Development config files

### 6. Two-Factor Authentication

Enable 2FA on npm account:
- **Authorization Only**: Require 2FA for login
- **Authorization and Publishing**: Require 2FA for publish (RECOMMENDED)

---

## 🛠️ Package Structure

```
@kunwarshah/claudex/
├── bin/
│   └── claude-viewer.js        # CLI entry point (mode detection)
├── server/
│   ├── src/                    # Backend source
│   └── package.json            # Server dependencies
├── client/
│   ├── dist/                   # Pre-built frontend (REQUIRED)
│   ├── package.json            # Client dependencies
│   └── vite.config.js          # Build config
├── scripts/
│   └── check-system.mjs        # System checker
├── package.json                # Root package with workspaces
├── LICENSE                     # MIT License
├── README.md                   # User documentation
└── quick-start.sh              # Quick setup script
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "EADDRINUSE: address already in use"

**Cause**: Port 3400 already in use
**Fix**:
```bash
lsof -i :3400 -t | xargs kill -9
```

### Issue 2: Package shows old version code

**Cause**: Branch outdated, didn't pull latest code before publishing
**Fix**:
```bash
git checkout main
git pull origin main
npm version patch
npm run build --workspace=client
npm publish --access public
```

### Issue 3: "client/dist not found" in production

**Cause**: Forgot to run build before publishing
**Fix**:
```bash
npm run build --workspace=client
npm version patch
npm publish --access public
```

### Issue 4: Can't unpublish last version

**Cause**: npm protects against accidental unpublish
**Fix**: Just publish next patch version (npm prefers this)

---

## 📊 Version History

| Version | Date | Changes | Branch |
|---------|------|---------|--------|
| 1.2.2 | 2025-11-12 | Added CLI flags (--port, --project-root), better error messages | feat/npm-package-distribution |
| 1.2.1 | 2025-11-12 | Fixed production mode detection in bin script | feat/npm-package-distribution |
| 1.2.0 | 2025-11-12 | Initial npm publish (broken - used dev mode) | feat/npm-package-distribution |
| 1.1.1 | 2025-10-31 | Pre-npm version (GitHub only) | main |

---

## 🔮 Future Improvements

### Phase B.3: Enhanced npm Package (Planned)

- [ ] **Windows compatibility testing** (PowerShell, CMD)
- [ ] **Environment variable docs** (`PROJECT_ROOT`, `PORT`)
- [ ] **npx support** (`npx @kunwarshah/claudex`)
- [ ] **Update notifier** (warn if new version available)
- [ ] **Telemetry opt-in** (anonymous usage stats)

### Phase C: CI/CD Automation (Planned)

- [ ] **GitHub Actions workflow** for automated publishing
- [ ] **Multi-platform testing** (Linux, macOS, Windows)
- [ ] **Automated changelog generation**
- [ ] **Release notes from PRs**

---

## 📚 Additional Resources

- **npm Package**: https://www.npmjs.com/package/@kunwarshah/claudex
- **GitHub Repository**: https://github.com/kunwar-shah/claudex
- **Documentation**: https://kunwar-shah.github.io/claudex/
- **npm Publishing Guide**: https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry
- **Semantic Versioning**: https://semver.org/

---

## 🎯 Quick Reference

```bash
# Install globally
npm install -g @kunwarshah/claudex

# Run
claudex

# Check version
claudex --version

# Help
claudex --help

# Uninstall
npm uninstall -g @kunwarshah/claudex

# View package info
npm view @kunwarshah/claudex

# Check latest version
npm view @kunwarshah/claudex version
```

---

**Maintained by**: Kunwar Shah
**Contact**: https://github.com/kunwar-shah/claudex/issues
