#!/usr/bin/env node

const { spawn} = require('cross-spawn');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const PROJECT_ROOT = path.join(__dirname, '..');
const SERVER_DIR = path.join(PROJECT_ROOT, 'server');
const CLIENT_DIR = path.join(PROJECT_ROOT, 'client');

console.log(chalk.cyan('📦 Running Claudex post-install setup...'));

// Check if this is a global install
const isGlobalInstall = process.env.npm_config_global === 'true';

if (isGlobalInstall) {
  console.log(chalk.blue('🌍 Detected global installation'));
}

// Install server dependencies
function installServerDeps() {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue('📦 Installing server dependencies...'));

    if (!fs.existsSync(SERVER_DIR)) {
      console.log(chalk.yellow('⚠️  Server directory not found, skipping...'));
      resolve();
      return;
    }

    const install = spawn('npm', ['install', '--production'], {
      cwd: SERVER_DIR,
      stdio: 'inherit'
    });

    install.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Server dependency installation failed'));
      } else {
        console.log(chalk.green('✅ Server dependencies installed'));
        resolve();
      }
    });
  });
}

// Install client dependencies (only if building)
function installClientDeps() {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue('📦 Installing client dependencies...'));

    if (!fs.existsSync(CLIENT_DIR)) {
      console.log(chalk.yellow('⚠️  Client directory not found, skipping...'));
      resolve();
      return;
    }

    const install = spawn('npm', ['install'], {
      cwd: CLIENT_DIR,
      stdio: 'inherit'
    });

    install.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Client dependency installation failed'));
      } else {
        console.log(chalk.green('✅ Client dependencies installed'));
        resolve();
      }
    });
  });
}

// Build client (production)
function buildClient() {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue('🏗️  Building client...'));

    if (!fs.existsSync(CLIENT_DIR)) {
      console.log(chalk.yellow('⚠️  Client directory not found, skipping build...'));
      resolve();
      return;
    }

    const build = spawn('npm', ['run', 'build'], {
      cwd: CLIENT_DIR,
      stdio: 'inherit'
    });

    build.on('close', (code) => {
      if (code !== 0) {
        console.log(chalk.yellow('⚠️  Client build failed (not critical for global install)'));
        // Don't reject - build failure shouldn't prevent installation
        resolve();
      } else {
        console.log(chalk.green('✅ Client built successfully'));
        resolve();
      }
    });
  });
}

// Main installation flow
async function postInstall() {
  try {
    await installServerDeps();

    // Only install client deps and build if not in production mode
    if (!isGlobalInstall || process.env.NODE_ENV !== 'production') {
      await installClientDeps();
      // Skip build during npm install, will be done by prepublishOnly
      // await buildClient();
    }

    console.log(chalk.green.bold('\n✨ Claudex post-install completed successfully!\n'));
    console.log(chalk.cyan('To start Claudex, run: claudex'));
    console.log(chalk.gray('For help, run: claudex --help'));
  } catch (error) {
    console.error(chalk.red('\n❌ Post-install failed:'), error.message);
    console.error(chalk.yellow('\n⚠️  You may need to run: npm run install-deps'));
    process.exit(1);
  }
}

postInstall();
