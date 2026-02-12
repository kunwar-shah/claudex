# Installation

Detailed installation instructions for Claudex.

> For a quick start guide, see [Getting Started](getting-started.md)

## System Requirements

### Minimum
- Node.js 18.0+
- npm 9.0+
- 2GB RAM
- 500MB disk space

### Recommended
- Node.js 20.x
- npm 10.x
- 4GB RAM
- 1GB disk space

## Installation Methods

### Method 1: npm Global Package (Recommended) ⭐

Install Claudex globally from npm registry and run from anywhere:

```bash
# Install globally
npm install -g @kunwarshah/claudex

# Run from anywhere
claudex

# Custom port (if 3400 is in use)
claudex --port 3500

# Custom project directory
claudex --project-root ~/my-claude-projects
```

**CLI Options:**
- `--help, -h` - Show help message
- `--version, -v` - Show version
- `--port, -p <port>` - Server port (default: 3400)
- `--project-root <path>` - Claude projects directory

**Environment Variables:**
- `PORT` - Server port (default: 3400)
- `PROJECT_ROOT` - Claude projects directory (default: ~/.claude/projects)

**Features:**
- ✅ Zero configuration - works out of the box
- ✅ Automatic dependency installation on first run
- ✅ Production-optimized (pre-built files)
- ✅ Cross-platform (Linux, macOS, WSL2)
- ✅ Flexible port configuration (no conflicts)

### Method 2: npx (No Installation)

Run Claudex without installing:

```bash
npx @kunwarshah/claudex
```

### Method 3: From Source (Development)

For development or contributing:

```bash
# Clone repository
git clone https://github.com/kunwar-shah/claudex.git
cd claudex

# Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Run development mode
npm run dev
```

## MCP Server Registration

After installing Claudex, register the MCP server to give Claude Code persistent memory:

```bash
# If installed globally
claude mcp add --transport stdio claudex -- claudex-mcp

# If using npx (no global install)
claude mcp add --transport stdio claudex -- npx @kunwarshah/claudex mcp
```

See the [MCP Server Guide](mcp.md) for full documentation.

## Configuration

See [Configuration Guide](configuration.md) for detailed setup options.
