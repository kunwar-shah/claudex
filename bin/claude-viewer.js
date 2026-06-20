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

  // Check if we should run in production or development mode
  // Priority: NODE_ENV > dist folder existence
  const clientDist = path.join(CLIENT_DIR, 'dist')
  const hasProductionBuild = fs.existsSync(clientDist)
  const isExplicitDev = process.env.NODE_ENV === 'development'
  const isExplicitProd = process.env.NODE_ENV === 'production'

  // Run in production mode if:
  // 1. NODE_ENV=production is explicitly set, OR
  // 2. dist folder exists AND NODE_ENV is not explicitly set to development
  const useProductionMode = isExplicitProd || (hasProductionBuild && !isExplicitDev)

  if (useProductionMode && hasProductionBuild) {
    // Production mode: serve pre-built files
    console.log(chalk.blue('📦 Running in production mode...'))

    // Set environment for production
    process.env.NODE_ENV = 'production'
    process.env.CLIENT_DIST_PATH = clientDist

    // Start server only (it will serve static files from client/dist)
    const server = spawn('node', ['src/server.js'], {
      cwd: SERVER_DIR,
      stdio: 'inherit',
      env: process.env
    })

    server.on('close', (code) => {
      if (code !== 0) {
        console.log(chalk.red('❌ Server failed to start'))
        process.exit(1)
      }
    })

    // Handle process termination gracefully
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n👋 Shutting down Claude Viewer...'))
      server.kill('SIGINT')
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      console.log(chalk.yellow('\n👋 Shutting down Claude Viewer...'))
      server.kill('SIGTERM')
      process.exit(0)
    })
  } else {
    // Development mode: use vite dev server
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
}

function showHelp() {
  console.log(chalk.cyan('Claude Code Conversations Viewer CLI'))
  console.log('')
  console.log(chalk.white('Usage:'))
  console.log('  claudex [options]')
  console.log('  claudex mcp              Start MCP server for Claude Code integration')
  console.log('')
  console.log(chalk.white('Options:'))
  console.log('  --help, -h              Show this help message')
  console.log('  --version, -v           Show version')
  console.log('  --port, -p <port>       Server port (default: 3400)')
  console.log('  --project-root <path>   Path to Claude projects directory')
  console.log('  --reindex-interval <s>  Auto incremental re-index every <s> seconds (default: off)')
  console.log('')
  console.log(chalk.white('Environment Variables:'))
  console.log('  PROJECT_ROOT              Path to Claude projects directory (default: ~/.claude/projects)')
  console.log('  PORT                      Server port (default: 3400)')
  console.log('  CLAUDEX_REINDEX_INTERVAL  Auto incremental re-index interval in seconds (default: off)')
  console.log('')
  console.log(chalk.white('Examples:'))
  console.log('  claudex                              Start on default port (3400)')
  console.log('  claudex --port 3500                  Start on custom port')
  console.log('  claudex -p 8080                      Short form')
  console.log('  claudex --project-root ~/my-chats    Custom projects directory')
  console.log('  claudex --reindex-interval 60        Auto re-index every 60s')
  console.log('  PORT=3500 claudex                    Using environment variable')
  console.log('')
  console.log(chalk.white('MCP (Claude Code Integration):'))
  console.log('  claudex mcp                          Start MCP server (stdio)')
  console.log('  claudex mcp --help                   Show MCP server help')
  console.log('  claude mcp add claudex -- claudex-mcp   Register with Claude Code')
  console.log('')
  console.log(chalk.green('The application will be available at:'))
  console.log(chalk.blue('  http://localhost:<port>'))
  console.log('')
  console.log(chalk.yellow('Troubleshooting:'))
  console.log('  Port already in use? Try: claudex --port 3500')
  console.log('  Projects not found? Try: claudex --project-root /custom/path')
}

function showVersion() {
  const packageJson = require('../package.json')
  console.log(chalk.cyan(`claude-viewer v${packageJson.version}`))
}

// Parse command line arguments
const args = process.argv.slice(2)

// Parse port flag
let customPort = null
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' || args[i] === '-p') {
    customPort = args[i + 1]
    if (!customPort || isNaN(parseInt(customPort))) {
      console.log(chalk.red('❌ Invalid port number'))
      console.log(chalk.yellow('Usage: claudex --port 3500'))
      process.exit(1)
    }
    break
  }
}

// Parse project root flag
let customProjectRoot = null
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project-root') {
    customProjectRoot = args[i + 1]
    if (!customProjectRoot) {
      console.log(chalk.red('❌ Invalid project root path'))
      console.log(chalk.yellow('Usage: claudex --project-root /path/to/projects'))
      process.exit(1)
    }
    break
  }
}

// Parse periodic re-index interval flag (seconds)
let reindexInterval = null
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--reindex-interval') {
    reindexInterval = args[i + 1]
    if (!reindexInterval || isNaN(parseInt(reindexInterval))) {
      console.log(chalk.red('❌ Invalid re-index interval (seconds)'))
      console.log(chalk.yellow('Usage: claudex --reindex-interval 60'))
      process.exit(1)
    }
    break
  }
}

// Set environment variables from CLI flags
if (customPort) {
  process.env.PORT = customPort
}
if (customProjectRoot) {
  process.env.PROJECT_ROOT = customProjectRoot
}
if (reindexInterval) {
  process.env.CLAUDEX_REINDEX_INTERVAL = reindexInterval
}

if (args.includes('--help') || args.includes('-h')) {
  showHelp()
  process.exit(0)
}

if (args.includes('--version') || args.includes('-v')) {
  showVersion()
  process.exit(0)
}

// MCP subcommand — launch MCP server directly
if (args[0] === 'mcp') {
  const mcpArgs = args.slice(1)
  // Handle --help for MCP
  if (mcpArgs.includes('--help') || mcpArgs.includes('-h')) {
    const mcpScript = path.join(__dirname, 'claudex-mcp.js')
    const child = spawn('node', [mcpScript, '--help'], { stdio: 'inherit' })
    child.on('exit', (code) => process.exit(code || 0))
    return
  }
  // Launch MCP server with stdio inherited (Claude Code pipes through here)
  const mcpEntry = path.join(__dirname, '..', 'server', 'src', 'mcp', 'index.js')
  const child = spawn('node', [mcpEntry], {
    stdio: 'inherit',
    env: process.env
  })
  child.on('exit', (code) => process.exit(code || 0))
  return
}

// Welcome message
const port = process.env.PORT || 3400
console.log(chalk.cyan.bold('🔍 Claude Code Conversations Viewer'))
console.log(chalk.gray('   A professional UI for Claude Code conversation files'))
console.log(chalk.gray(`   Port: ${port}`))
console.log('')

// Check dependencies and start
checkDependencies()