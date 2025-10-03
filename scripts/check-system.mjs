#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// CLI arguments
const args = process.argv.slice(2);
const isVerbose = args.includes('--verbose') || args.includes('-v');
const isAutoFix = args.includes('--fix') || args.includes('-f');
const isJson = args.includes('--json');
const isQuiet = args.includes('--quiet') || args.includes('-q');

// Results tracking
const results = {
  passed: 0,
  warnings: 0,
  errors: 0,
  checks: [],
};

// Utility functions
function log(message, color = 'reset') {
  if (!isQuiet && !isJson) {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }
}

function logCheck(status, message, details = null) {
  const icon = status === 'pass' ? '✓' : status === 'warn' ? '⚠️' : '✗';
  const color = status === 'pass' ? 'green' : status === 'warn' ? 'yellow' : 'red';

  if (!isQuiet && !isJson) {
    console.log(`   ${colors[color]}${icon} ${message}${colors.reset}`);
    if (details && isVerbose) {
      console.log(`${colors.gray}     ${details}${colors.reset}`);
    }
  }

  results.checks.push({ status, message, details });
  if (status === 'pass') results.passed++;
  else if (status === 'warn') results.warnings++;
  else results.errors++;
}

function logInfo(message) {
  if (!isQuiet && !isJson) {
    console.log(`${colors.cyan}   ℹ️  ${message}${colors.reset}`);
  }
}

function section(title) {
  if (!isQuiet && !isJson) {
    console.log(`\n${colors.bright}${title}${colors.reset}`);
  }
}

function separator() {
  if (!isQuiet && !isJson) {
    console.log(`${colors.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  }
}

function expandPath(filepath) {
  if (!filepath) return filepath;
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

function checkNodeVersion() {
  try {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);

    if (major >= 18) {
      logCheck('pass', `Node.js ${version} (required: >= 18.0.0)`);
      return true;
    } else {
      logCheck('error', `Node.js ${version} is too old (required: >= 18.0.0)`);
      logInfo('Please upgrade Node.js: https://nodejs.org/');
      return false;
    }
  } catch (error) {
    logCheck('error', `Failed to check Node.js version: ${error.message}`);
    return false;
  }
}

function checkNpmVersion() {
  try {
    const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
    const major = parseInt(version.split('.')[0]);

    if (major >= 9) {
      logCheck('pass', `npm v${version} (required: >= 9.0.0)`);
      return true;
    } else {
      logCheck('warn', `npm v${version} is old (recommended: >= 9.0.0)`);
      logInfo('Consider upgrading: npm install -g npm@latest');
      return true;
    }
  } catch (error) {
    logCheck('error', `Failed to check npm version: ${error.message}`);
    return false;
  }
}

function checkPlatform() {
  const platform = process.platform;
  const platformName = {
    'linux': 'Linux',
    'darwin': 'macOS',
    'win32': 'Windows',
  }[platform] || platform;

  const isWSL = fs.existsSync('/proc/version') &&
                fs.readFileSync('/proc/version', 'utf-8').toLowerCase().includes('microsoft');

  const displayName = isWSL ? `${platformName} (WSL)` : platformName;

  if (['linux', 'darwin'].includes(platform) || isWSL) {
    logCheck('pass', `Platform: ${displayName}`);
    return true;
  } else {
    logCheck('warn', `Platform: ${displayName} (untested)`);
    logInfo('Claudex is primarily tested on Linux, macOS, and WSL');
    return true;
  }
}

function checkProjectRoot() {
  const rootDir = path.resolve(__dirname, '..');
  const envPath = path.join(rootDir, 'server', '.env');

  if (!fs.existsSync(envPath)) {
    logCheck('error', '.env file not found');
    logInfo('Run: cp server/.env.example server/.env');
    return null;
  }

  logCheck('pass', '.env file exists');

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const projectRootMatch = envContent.match(/PROJECT_ROOT=(.+)/);

  if (!projectRootMatch) {
    logCheck('warn', 'PROJECT_ROOT not set in .env');
    logInfo('Using default: ~/.claude/projects');
    return expandPath('~/.claude/projects');
  }

  const projectRoot = expandPath(projectRootMatch[1].trim());
  logCheck('pass', `PROJECT_ROOT configured: ${projectRoot}`);

  return projectRoot;
}

function checkPathExists(projectRoot) {
  if (!projectRoot) return false;

  if (fs.existsSync(projectRoot)) {
    logCheck('pass', 'PROJECT_ROOT path exists');
    return true;
  } else {
    logCheck('error', `PROJECT_ROOT path does not exist: ${projectRoot}`);
    logInfo('Check your .env file and verify Claude Code is installed');
    logInfo('Expected structure: PROJECT_ROOT/project-name/sessions/*.jsonl');
    return false;
  }
}

function checkPathReadable(projectRoot) {
  if (!projectRoot) return false;

  try {
    fs.accessSync(projectRoot, fs.constants.R_OK);
    logCheck('pass', 'PROJECT_ROOT is readable');
    return true;
  } catch (error) {
    logCheck('error', `Cannot read PROJECT_ROOT: ${error.message}`);
    logInfo(`Run: chmod +r ${projectRoot}`);
    return false;
  }
}

function checkClaudeData(projectRoot) {
  if (!projectRoot || !fs.existsSync(projectRoot)) return false;

  try {
    const projects = fs.readdirSync(projectRoot).filter(name => {
      const fullPath = path.join(projectRoot, name);
      return fs.statSync(fullPath).isDirectory();
    });

    if (projects.length === 0) {
      logCheck('warn', 'No projects found');
      logInfo('Make sure Claude Code has created some projects');
      return false;
    }

    logCheck('pass', `Found ${projects.length} projects`);

    let totalSessions = 0;
    for (const project of projects) {
      const sessionsDir = path.join(projectRoot, project, 'sessions');
      if (fs.existsSync(sessionsDir)) {
        const sessions = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
        totalSessions += sessions.length;
      }
    }

    if (totalSessions === 0) {
      logCheck('warn', 'No conversation files found');
      logInfo('Make sure Claude Code has created some conversations');
      return false;
    }

    logCheck('pass', `Found ${totalSessions} sessions`);
    return true;
  } catch (error) {
    logCheck('error', `Failed to scan Claude data: ${error.message}`);
    return false;
  }
}

function checkJSONLValidity(projectRoot) {
  if (!projectRoot || !fs.existsSync(projectRoot)) return false;

  try {
    const projects = fs.readdirSync(projectRoot).filter(name => {
      const fullPath = path.join(projectRoot, name);
      return fs.statSync(fullPath).isDirectory();
    });

    let validFiles = 0;
    let invalidFiles = 0;

    for (const project of projects) {
      const sessionsDir = path.join(projectRoot, project, 'sessions');
      if (!fs.existsSync(sessionsDir)) continue;

      const sessions = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));

      for (const session of sessions.slice(0, 5)) { // Check first 5 files
        const filePath = path.join(sessionsDir, session);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const firstLine = content.split('\n')[0];
          if (firstLine) {
            JSON.parse(firstLine);
            validFiles++;
          }
        } catch (e) {
          invalidFiles++;
          if (isVerbose) {
            logInfo(`Invalid JSONL: ${filePath}`);
          }
        }
      }
    }

    if (invalidFiles > 0) {
      logCheck('warn', `Found ${invalidFiles} invalid JSONL files`);
      return false;
    } else if (validFiles > 0) {
      logCheck('pass', `JSONL files are valid (checked ${validFiles} files)`);
      return true;
    } else {
      logCheck('warn', 'No JSONL files to validate');
      return false;
    }
  } catch (error) {
    logCheck('error', `Failed to validate JSONL: ${error.message}`);
    return false;
  }
}

function checkPortAvailable(port) {
  try {
    const cmd = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -ti:${port}`;

    const result = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();

    if (result) {
      const pid = process.platform === 'win32'
        ? result.split(/\s+/).pop()
        : result.split('\n')[0];

      logCheck('warn', `Port ${port} is in use (PID: ${pid})`);
      logInfo(`Kill process: kill ${pid} (or change PORT in .env)`);
      return false;
    }

    logCheck('pass', `Port ${port} is available`);
    return true;
  } catch (error) {
    // No output means port is available
    logCheck('pass', `Port ${port} is available`);
    return true;
  }
}

function checkDependencies(dir, name) {
  const nodeModulesPath = path.join(dir, 'node_modules');

  if (fs.existsSync(nodeModulesPath)) {
    logCheck('pass', `${name} dependencies installed`);
    return true;
  } else {
    logCheck('error', `${name} dependencies not installed`);
    logInfo(`Run: cd ${path.relative(process.cwd(), dir)} && npm install`);
    return false;
  }
}

function checkDatabaseDirectory() {
  const rootDir = path.resolve(__dirname, '..');
  const dbDir = path.join(rootDir, 'server', 'data');

  if (!fs.existsSync(dbDir)) {
    logCheck('warn', 'Database directory does not exist');
    logInfo('Will be created on first run');
    return true;
  }

  try {
    fs.accessSync(dbDir, fs.constants.W_OK);
    logCheck('pass', 'Database directory is writable');
    return true;
  } catch (error) {
    logCheck('error', `Database directory is not writable: ${dbDir}`);
    logInfo(`Run: chmod +w ${dbDir}`);
    return false;
  }
}

function checkSearchIndex() {
  const rootDir = path.resolve(__dirname, '..');
  const dbPath = path.join(rootDir, 'server', 'data', 'search.db');

  if (!fs.existsSync(dbPath)) {
    logCheck('warn', 'Search index not built');
    logInfo('Run: npm run dev, then visit /search and click "Rebuild Index"');
    return false;
  }

  logCheck('pass', 'Search index exists');
  return true;
}

async function autoFix() {
  log('\n🔧 Auto-fix mode enabled\n', 'cyan');

  const rootDir = path.resolve(__dirname, '..');

  // Create .env if missing
  const envPath = path.join(rootDir, 'server', '.env');
  const envExamplePath = path.join(rootDir, 'server', '.env.example');

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    log('Creating .env from .env.example...', 'yellow');
    fs.copyFileSync(envExamplePath, envPath);
    log('✓ Created .env file', 'green');
  }

  // Create database directory
  const dbDir = path.join(rootDir, 'server', 'data');
  if (!fs.existsSync(dbDir)) {
    log('Creating database directory...', 'yellow');
    fs.mkdirSync(dbDir, { recursive: true });
    log('✓ Created database directory', 'green');
  }

  // Install dependencies
  const dirs = [
    { path: rootDir, name: 'root' },
    { path: path.join(rootDir, 'server'), name: 'server' },
    { path: path.join(rootDir, 'client'), name: 'client' },
  ];

  for (const { path: dir, name } of dirs) {
    const nodeModulesPath = path.join(dir, 'node_modules');

    if (!fs.existsSync(nodeModulesPath)) {
      log(`\nInstalling ${name} dependencies...`, 'yellow');
      try {
        execSync('npm install', { cwd: dir, stdio: 'inherit' });
        log(`✓ Installed ${name} dependencies`, 'green');
      } catch (error) {
        log(`✗ Failed to install ${name} dependencies`, 'red');
      }
    }
  }

  log('\n✓ Auto-fix completed\n', 'green');
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');

  if (!isQuiet && !isJson) {
    log('\n🔍 Claudex System Check\n', 'bright');
    separator();
  }

  // Phase 1: Prerequisites
  section('✅ Prerequisites');
  const nodeOk = checkNodeVersion();
  const npmOk = checkNpmVersion();
  checkPlatform();

  // Phase 1: Paths & Permissions
  section('\n✅ Paths & Permissions');
  const projectRoot = checkProjectRoot();
  const pathExists = checkPathExists(projectRoot);
  const pathReadable = checkPathReadable(projectRoot);
  const hasData = checkClaudeData(projectRoot);

  // Phase 2: JSONL Validation
  if (pathExists && pathReadable) {
    checkJSONLValidity(projectRoot);
  }

  checkDatabaseDirectory();

  // Phase 1: Port Availability
  section('\n⚠️  Port Availability');
  checkPortAvailable(3400);
  checkPortAvailable(3000);

  // Phase 1: Dependencies
  section('\n✅ Dependencies');
  checkDependencies(rootDir, 'Root');
  checkDependencies(path.join(rootDir, 'server'), 'Server');
  checkDependencies(path.join(rootDir, 'client'), 'Client');

  // Phase 2: Search Index
  section('\n⚠️  Search Index');
  checkSearchIndex();

  // Summary
  if (!isQuiet && !isJson) {
    separator();
    log(`\nSummary: ${results.passed} passed, ${results.warnings} warnings, ${results.errors} errors\n`, 'bright');

    if (results.errors === 0 && results.warnings === 0) {
      log('✓ System is ready! Run: npm run dev\n', 'green');
    } else if (results.errors === 0) {
      log('⚠️  System is ready with warnings. Run: npm run dev\n', 'yellow');
    } else {
      log('✗ System has errors. Please fix the issues above.\n', 'red');
      if (!isAutoFix) {
        log('Tip: Run with --fix to automatically fix common issues\n', 'cyan');
      }
    }
  }

  // JSON output
  if (isJson) {
    console.log(JSON.stringify(results, null, 2));
  }

  // Auto-fix
  if (isAutoFix) {
    await autoFix();
  }

  // Exit code
  process.exit(results.errors > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
