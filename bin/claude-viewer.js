#!/usr/bin/env node

const { spawn } = require('cross-spawn')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')

const PROJECT_ROOT = path.join(__dirname, '..')
const SERVER_DIR = path.join(PROJECT_ROOT, 'server')
const CLIENT_DIR = path.join(PROJECT_ROOT, 'client')

// Check if dependencies are installed
function checkDependencies() {
  const serverNodeModules = path.join(SERVER_DIR, 'node_modules')
  const clientNodeModules = path.join(CLIENT_DIR, 'node_modules')
  
  if (!fs.existsSync(serverNodeModules) || !fs.existsSync(clientNodeModules)) {
    console.log(chalk.yellow('⚠️  Dependencies not found. Installing...'))
    console.log(chalk.blue('📦 Running npm install for server...'))
    
    const serverInstall = spawn('npm', ['install'], { 
      cwd: SERVER_DIR, 
      stdio: 'inherit' 
    })
    
    serverInstall.on('close', (code) => {
      if (code !== 0) {
        console.log(chalk.red('❌ Server dependency installation failed'))
        process.exit(1)
      }
      
      console.log(chalk.blue('📦 Running npm install for client...'))
      const clientInstall = spawn('npm', ['install'], { 
        cwd: CLIENT_DIR, 
        stdio: 'inherit' 
      })
      
      clientInstall.on('close', (code) => {
        if (code !== 0) {
          console.log(chalk.red('❌ Client dependency installation failed'))
          process.exit(1)
        }
        
        console.log(chalk.green('✅ Dependencies installed successfully'))
        startApplication()
      })
    })
  } else {
    startApplication()
  }
}

function startApplication() {
  console.log(chalk.cyan('🚀 Starting Claude Code Conversations Viewer...'))
  console.log(chalk.blue('🔧 Starting development servers...'))
  
  // Start both server and client concurrently
  const concurrently = spawn('npx', [
    'concurrently',
    '--kill-others',
    '--prefix', 'name',
    '--names', 'SERVER,CLIENT',
    '--prefix-colors', 'blue,green',
    '"npm run dev --prefix server"',
    '"npm run dev --prefix client"'
  ], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit'
  })
  
  concurrently.on('close', (code) => {
    if (code !== 0) {
      console.log(chalk.red('❌ Application failed to start'))
      process.exit(1)
    }
  })
  
  // Handle process termination gracefully
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Shutting down Claude Viewer...'))
    concurrently.kill('SIGINT')
    process.exit(0)
  })
  
  process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n👋 Shutting down Claude Viewer...'))
    concurrently.kill('SIGTERM')
    process.exit(0)
  })
}

function showHelp() {
  console.log(chalk.cyan('Claude Code Conversations Viewer CLI'))
  console.log('')
  console.log(chalk.white('Usage:'))
  console.log('  claude-viewer [options]')
  console.log('')
  console.log(chalk.white('Options:'))
  console.log('  --help, -h     Show this help message')
  console.log('  --version, -v  Show version')
  console.log('')
  console.log(chalk.white('Environment Variables:'))
  console.log('  PROJECT_ROOT   Path to Claude projects directory (default: ~/.claude/projects)')
  console.log('  PORT          Server port (default: 3001)')
  console.log('')
  console.log(chalk.white('Examples:'))
  console.log('  claude-viewer                    Start the application')
  console.log('  PROJECT_ROOT=/custom/path claude-viewer')
  console.log('')
  console.log(chalk.green('The application will be available at:'))
  console.log(chalk.blue('  Frontend: http://localhost:3000'))
  console.log(chalk.blue('  Backend:  http://localhost:3001'))
}

function showVersion() {
  const packageJson = require('../package.json')
  console.log(chalk.cyan(`claude-viewer v${packageJson.version}`))
}

// Parse command line arguments
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  showHelp()
  process.exit(0)
}

if (args.includes('--version') || args.includes('-v')) {
  showVersion()
  process.exit(0)
}

// Welcome message
console.log(chalk.cyan.bold('🔍 Claude Code Conversations Viewer'))
console.log(chalk.gray('   A professional UI for Claude Code conversation files'))
console.log('')

// Check dependencies and start
checkDependencies()