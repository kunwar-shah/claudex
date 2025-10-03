# System Checker

Claudex includes a comprehensive system checker that validates your environment before running the application.

## Overview

The system checker performs **17+ validation checks** across three phases:
- **Phase 1**: Basic prerequisites (Node.js, npm, ports, dependencies)
- **Phase 2**: Advanced checks (permissions, data validation, database)
- **Phase 3**: Polished output (verbose, JSON, auto-fix)

## Usage

### Quick Check

```bash
npm run check
```

Runs a quick system validation and displays a summary.

### Verbose Mode

```bash
npm run check:verbose
```

Shows detailed information about each check, including:
- Exact paths being validated
- File counts and statistics
- Detailed error messages

### Auto-Fix Mode

```bash
npm run check:fix
```

Automatically fixes common setup issues:
- Creates `.env` from `.env.example`
- Creates missing directories (`server/data/`)
- Installs missing dependencies
- Sets up the environment

### JSON Output

```bash
npm run check:json
```

Outputs results in JSON format for CI/CD integration:

```json
{
  "passed": 13,
  "warnings": 4,
  "errors": 0,
  "checks": [
    {
      "status": "pass",
      "message": "Node.js v18.19.1 (required: >= 18.0.0)",
      "details": null
    }
  ]
}
```

### Quiet Mode

```bash
npm run check --quiet
```

Suppresses output, only returns exit code:
- Exit code `0`: All checks passed
- Exit code `1`: Errors found

## What It Checks

### Prerequisites
- ✅ **Node.js version** (>= 18.0.0)
- ✅ **npm version** (>= 9.0.0)
- ✅ **Platform** (Linux, macOS, Windows/WSL)

### Paths & Permissions
- ✅ **`.env` file** exists
- ✅ **PROJECT_ROOT** configured and expanded
- ✅ **Path exists** and is readable
- ✅ **Projects found** in PROJECT_ROOT
- ✅ **Sessions found** (.jsonl files)
- ✅ **JSONL validity** (can parse files)
- ✅ **Database directory** writable

### Port Availability
- ✅ **Port 3000** available (frontend)
- ✅ **Port 3400** available (backend)
- ⚠️ Shows PID if port is in use

### Dependencies
- ✅ **Root dependencies** installed
- ✅ **Server dependencies** installed
- ✅ **Client dependencies** installed

### Database & Search
- ✅ **Database directory** exists and writable
- ✅ **Search index** status

## Example Output

### Successful Check

```
🔍 Claudex System Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Prerequisites
   ✓ Node.js v20.11.0 (required: >= 18.0.0)
   ✓ npm v10.2.4 (required: >= 9.0.0)
   ✓ Platform: Linux (WSL)

✅ Paths & Permissions
   ✓ .env file exists
   ✓ PROJECT_ROOT configured: /home/user/.claude/projects
   ✓ PROJECT_ROOT path exists
   ✓ PROJECT_ROOT is readable
   ✓ Found 10 projects
   ✓ Found 62 sessions
   ✓ JSONL files are valid (checked 5 files)
   ✓ Database directory is writable

✅ Port Availability
   ✓ Port 3400 is available
   ✓ Port 3000 is available

✅ Dependencies
   ✓ Root dependencies installed
   ✓ Server dependencies installed
   ✓ Client dependencies installed

✅ Search Index
   ✓ Search index exists

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary: 17 passed, 0 warnings, 0 errors

✓ System is ready! Run: npm run dev
```

### With Warnings

```
⚠️  Port Availability
   ⚠️ Port 3400 is in use (PID: 12345)
   ℹ️  Kill process: kill 12345 (or change PORT in .env)
   ✓ Port 3000 is available

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary: 15 passed, 2 warnings, 0 errors

⚠️  System is ready with warnings. Run: npm run dev
```

### With Errors

```
❌ Paths & Permissions
   ✗ PROJECT_ROOT path does not exist: /home/user/.claude/projects
   ℹ️  Check your .env file and verify Claude Code is installed
   ℹ️  Expected structure: PROJECT_ROOT/project-name/sessions/*.jsonl

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary: 10 passed, 2 warnings, 5 errors

✗ System has errors. Please fix the issues above.

Tip: Run with --fix to automatically fix common issues
```

## Integration

### Pre-Start Check

The system checker runs automatically before `npm run dev`:

```json
{
  "scripts": {
    "predev": "node scripts/check-system.mjs --quiet || true"
  }
}
```

The `|| true` ensures dev starts even if there are warnings.

### CI/CD Integration

Use JSON output in your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: System Check
  run: npm run check:json > check-results.json

- name: Validate Results
  run: |
    if [ $(jq '.errors' check-results.json) -gt 0 ]; then
      echo "System check failed"
      exit 1
    fi
```

## Troubleshooting

### Check Not Running

If the check doesn't run automatically:

```bash
# Verify script exists
ls scripts/check-system.mjs

# Check permissions
chmod +x scripts/check-system.mjs

# Run manually
node scripts/check-system.mjs
```

### Auto-Fix Fails

If `npm run check:fix` fails:

```bash
# Run with verbose to see detailed errors
npm run check:verbose

# Fix manually based on error messages
# Then re-run check
npm run check
```

## Advanced Usage

### Custom Checks

The checker is extensible. Add custom checks in `scripts/check-system.mjs`:

```javascript
function checkCustomRequirement() {
  try {
    // Your validation logic
    logCheck('pass', 'Custom requirement met');
    return true;
  } catch (error) {
    logCheck('error', `Custom check failed: ${error.message}`);
    return false;
  }
}
```

### Environment Variables

Override behavior with environment variables:

```bash
# Skip certain checks
SKIP_PORT_CHECK=1 npm run check

# Custom PROJECT_ROOT
PROJECT_ROOT=/custom/path npm run check
```

## Best Practices

1. **Run before first start**: Always run `npm run check` on new setups
2. **Use auto-fix**: Let it handle common setup issues
3. **Check after updates**: Re-validate after pulling changes
4. **CI integration**: Add to your CI pipeline
5. **Document custom checks**: If you add checks, document them

## Common Issues

### False Positives

If checks fail incorrectly:

```bash
# Verify manually
ls ~/.claude/projects
node --version
npm --version

# Report issue if checks are incorrect
```

### Ports Already in Use

This is usually fine if your dev servers are already running:

```bash
# Kill existing processes
lsof -ti:3400 | xargs kill
lsof -ti:3000 | xargs kill

# Or change ports in .env
```

## See Also

- [Getting Started](getting-started.md)
- [Troubleshooting](troubleshooting.md)
- [Contributing](contributing.md)
