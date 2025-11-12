# npm Package Testing & Publishing Guide

Complete guide for testing the Claudex npm package before publishing.

---

## 🧪 Iterative Testing Workflow

### Method 1: Test from Tarball (Recommended)

This simulates the exact npm install experience without actually publishing.

```bash
# 1. Build the package tarball
cd /path/to/claude-viewer
npm pack

# Output: kunwarshah-claudex-1.2.0.tgz (469KB)

# 2. Install globally from tarball
npm install -g ./kunwarshah-claudex-1.2.0.tgz

# 3. Test the command
claudex --help
claudex --version

# 4. Try starting the app
claudex
# (Ctrl+C to stop)

# 5. Uninstall after testing
npm uninstall -g @kunwarshah/claudex

# 6. Make changes, rebuild, test again
# Repeat steps 1-5 as many times as needed
```

**Why this works**: `npm pack` creates the exact tarball that would be uploaded to npm. Installing from it mimics the real npm install experience.

---

### Method 2: Test with npm link (Live Development)

For rapid iteration during development (changes reflect immediately).

```bash
# 1. In claude-viewer directory
npm link

# 2. Test the command (links to current directory)
claudex --help

# 3. Make changes to code
# Changes are immediately available

# 4. Unlink when done testing
npm unlink -g @kunwarshah/claudex
```

**Note**: This doesn't test the postinstall script or package contents - use Method 1 for final validation.

---

## 🖥️ Testing on Different Platforms

### WSL (Linux) - Primary Testing

**What to Test**:
- ✅ `npm install -g ./kunwarshah-claudex-1.2.0.tgz` works
- ✅ `claudex` command available in PATH
- ✅ postinstall script runs successfully
- ✅ Server dependencies install
- ✅ Client dependencies install
- ✅ Application starts correctly
- ✅ Can access http://localhost:3000
- ✅ Claude projects detected (~/.claude/projects)

**Testing Script** (WSL):
```bash
#!/bin/bash
# test-npm-package-wsl.sh

echo "🧪 Testing Claudex npm package on WSL..."

# Clean previous install
npm uninstall -g @kunwarshah/claudex 2>/dev/null

# Install from tarball
echo "📦 Installing from tarball..."
npm install -g ./kunwarshah-claudex-1.2.0.tgz

# Check command exists
if command -v claudex &> /dev/null; then
    echo "✅ claudex command available"
else
    echo "❌ claudex command not found"
    exit 1
fi

# Check version
echo "📌 Version check:"
claudex --version

# Check help
echo "📖 Help output:"
claudex --help

# Check system checker
echo "🔧 Running system check:"
cd $(npm root -g)/@kunwarshah/claudex
npm run check

echo "✅ All tests passed!"
```

---

### Windows (PowerShell/CMD) - Failure Testing

**Expected Behaviors**:
- ✅ `npm install -g` should work
- ✅ `claudex` command should be available
- ⚠️ postinstall might fail (no bash for .sh files)
- ⚠️ Application might fail to find Claude projects
- ⚠️ Path expansion (~/) might not work

**What to Test**:
1. **Installation**: Does npm install complete?
2. **Command Availability**: Can you run `claudex --help`?
3. **Graceful Failures**: Does it show helpful error messages?
4. **Postinstall Errors**: Are they non-blocking?

**Testing Script** (PowerShell):
```powershell
# test-npm-package-windows.ps1

Write-Host "🧪 Testing Claudex npm package on Windows..." -ForegroundColor Cyan

# Clean previous install
npm uninstall -g @kunwarshah/claudex 2>$null

# Install from tarball
Write-Host "📦 Installing from tarball..." -ForegroundColor Blue
npm install -g .\kunwarshah-claudex-1.2.0.tgz

# Check command exists
if (Get-Command claudex -ErrorAction SilentlyContinue) {
    Write-Host "✅ claudex command available" -ForegroundColor Green
} else {
    Write-Host "❌ claudex command not found" -ForegroundColor Red
    exit 1
}

# Check version
Write-Host "📌 Version check:" -ForegroundColor Yellow
claudex --version

# Check help
Write-Host "📖 Help output:" -ForegroundColor Yellow
claudex --help

# Try to start (expect failure - no Claude projects)
Write-Host "🚀 Attempting to start (expect failure on Windows):" -ForegroundColor Yellow
# claudex  # Uncomment to test, use Ctrl+C to stop

Write-Host "✅ Installation tests passed!" -ForegroundColor Green
Write-Host "⚠️ Runtime requires Claude projects directory" -ForegroundColor Yellow
```

---

## 🔍 What to Check During Testing

### 1. Package Contents
```bash
# Extract tarball to inspect contents
tar -tzf claudex-1.1.1.tgz | head -30

# Check size
ls -lh claudex-1.1.1.tgz
# Should be ~473KB

# Verify no sensitive files
tar -tzf claudex-1.1.1.tgz | grep -E "\.env$|\.log$|data/|node_modules"
# Should return nothing
```

### 2. Installation Process
```bash
# Install with verbose logging
npm install -g ./claudex-1.1.1.tgz --loglevel verbose

# Check installation location
npm root -g
# Usually: /usr/local/lib/node_modules (Linux)
# Or: C:\Users\<name>\AppData\Roaming\npm\node_modules (Windows)

# Check bin link
which claudex  # Linux/WSL
where claudex  # Windows
```

### 3. Postinstall Script
```bash
# After install, check if dependencies installed
cd $(npm root -g)/claudex/server
ls node_modules/  # Should have fastify, etc.

cd $(npm root -g)/claudex/client
ls node_modules/  # Should have react, vite, etc.
```

### 4. Command Functionality
```bash
# Test all CLI options
claudex --help
claudex --version

# Test environment detection
claudex  # Should start or show helpful error
```

### 5. Uninstall Cleanliness
```bash
# Uninstall
npm uninstall -g claudex

# Check command removed
claudex  # Should say "command not found"

# Check directory removed
ls $(npm root -g)/claudex  # Should not exist
```

---

## 🐛 Common Issues & Fixes

### Issue 1: postinstall fails on Windows

**Error**:
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! claudex@1.1.1 postinstall: `node scripts/postinstall.js`
```

**Fix**: Make sure `scripts/postinstall.js` uses Node.js (not bash). Our current script uses `cross-spawn` which is cross-platform.

---

### Issue 2: Command not found after install

**Error**: `claudex: command not found`

**Fix**:
```bash
# Check npm bin directory in PATH
echo $PATH | grep npm  # Linux/WSL
echo %PATH% | findstr npm  # Windows

# If missing, add to PATH
export PATH="$(npm bin -g):$PATH"  # Linux/WSL
```

---

### Issue 3: Permission denied on Linux

**Error**: `EACCES: permission denied`

**Fix**:
```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g ./claudex-1.1.1.tgz

# Option 2: Configure npm to use home directory (recommended)
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g ./claudex-1.1.1.tgz
```

---

## 📤 Publishing to npm

### Prerequisites

1. **npm Account**:
   ```bash
   # Create account at https://www.npmjs.com/signup

   # Login from CLI
   npm login
   # Enter username, password, email
   ```

2. **Enable 2FA** (Highly Recommended):
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/twofa
   - Enable "Authorization and Publishing" mode
   - Save recovery codes

3. **Check Package Name Availability**:
   ```bash
   npm search claudex
   # If no results, name is available
   ```

---

### Pre-Publish Checklist

- [ ] Version number correct in package.json (1.1.1)
- [ ] All tests passing (`npm test`)
- [ ] Client built (`npm run build`)
- [ ] Package size verified (`npm pack --dry-run`)
- [ ] README.md complete and accurate
- [ ] LICENSE file present
- [ ] No sensitive files in tarball
- [ ] Tested installation on WSL
- [ ] Tested installation on Windows (optional but recommended)
- [ ] Git repo clean (no uncommitted changes)
- [ ] Latest code pushed to GitHub

---

### Publish Steps

#### Step 1: Final Build & Test
```bash
# Clean build
rm -rf client/dist/
npm run build

# Create tarball
npm pack

# Test installation one last time
npm install -g ./claudex-1.1.1.tgz
claudex --version
claudex --help
npm uninstall -g claudex
```

#### Step 2: Dry Run Publish
```bash
# See what would be published (doesn't actually publish)
npm publish --dry-run

# Output should show:
# - Package name: claudex
# - Version: 1.1.1
# - Tarball size: ~473KB
# - Files: 28
```

#### Step 3: Publish to npm
```bash
# For first publish (public package)
npm publish --access public

# For subsequent updates
npm publish
```

**If 2FA enabled**, you'll be prompted for OTP code.

#### Step 4: Verify Published Package
```bash
# Check on npm website
open https://www.npmjs.com/package/claudex

# Check package info
npm view claudex

# Test global install from npm
npm install -g claudex
claudex --version
```

---

### Post-Publish Steps

1. **Update README.md**:
   ```bash
   # Remove "Coming Soon" note
   # Update installation section to remove beta warning
   ```

2. **Add npm Badge**:
   ```markdown
   [![npm version](https://img.shields.io/npm/v/claudex.svg)](https://www.npmjs.com/package/claudex)
   [![npm downloads](https://img.shields.io/npm/dm/claudex.svg)](https://www.npmjs.com/package/claudex)
   ```

3. **Create GitHub Release**:
   ```bash
   git tag v1.1.1
   git push origin v1.1.1

   # Create release on GitHub with changelog
   ```

4. **Announce**:
   - GitHub Discussions
   - Twitter/Social media
   - Reddit (r/ClaudeAI, r/programming)
   - Hacker News (if appropriate)

---

## 🔄 Updating Published Package

### Publish New Version

1. **Update version**:
   ```bash
   # Patch (1.1.1 → 1.1.2)
   npm version patch

   # Minor (1.1.1 → 1.2.0)
   npm version minor

   # Major (1.1.1 → 2.0.0)
   npm version major
   ```

2. **Build & test**:
   ```bash
   npm run build
   npm pack
   npm install -g ./claudex-1.1.2.tgz  # Test new version
   ```

3. **Publish**:
   ```bash
   npm publish
   ```

4. **Create git tag**:
   ```bash
   git push origin main --tags
   ```

---

## 📊 Quick Reference

### Testing Commands
```bash
# Build tarball
npm pack

# Install from tarball (local test)
npm install -g ./claudex-1.1.1.tgz

# Test command
claudex --help
claudex --version

# Uninstall
npm uninstall -g claudex

# Check package contents
tar -tzf claudex-1.1.1.tgz

# Dry run publish
npm publish --dry-run
```

### Publishing Commands
```bash
# Login to npm
npm login

# Publish (first time)
npm publish --access public

# Publish (update)
npm publish

# Unpublish (within 72 hours, use sparingly)
npm unpublish claudex@1.1.1
```

---

## ⚠️ Important Notes

1. **You cannot re-publish the same version**: Once `claudex@1.1.1` is published, you can't change it. Increment version for updates.

2. **Unpublish restrictions**: Can only unpublish within 72 hours. After that, version is permanent.

3. **Testing is crucial**: Once published, millions of users can install. Test thoroughly!

4. **Windows compatibility**: Our package uses Node.js (not bash), so it should work on Windows. But Claude projects directory might not exist there.

5. **Scope packages**: If `claudex` name is taken, you can use scoped package like `@your-username/claudex`.

---

## 🎯 Recommended Testing Schedule

**Before First Publish**:
1. ✅ Test on WSL (5 iterations)
2. ✅ Test on Windows (2 iterations for failure modes)
3. ✅ Test uninstall/reinstall cycle
4. ✅ Test with fresh npm cache
5. ✅ Test on different Node.js versions (18, 20, 22)

**Before Updates**:
1. ✅ Test on WSL (2-3 iterations)
2. ✅ Test upgrade from previous version
3. ✅ Verify backward compatibility

---

## 📚 Additional Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [npm CLI Documentation](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)
- [Package.json Documentation](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)

---

**Good luck with testing and publishing!** 🚀
