# Configuration

Configure Claudex to work with your environment.

## Environment Variables

### Server Configuration (`server/.env`)

```env
# Path to Claude Code projects
PROJECT_ROOT=~/.claude/projects

# Server port
PORT=3400

# Environment
NODE_ENV=development
```

### Path Expansion

The `~/` notation automatically expands to your home directory:
- Linux/macOS: `/home/username/.claude/projects`
- Windows WSL: `/home/username/.claude/projects`

You can also use absolute paths:
```env
PROJECT_ROOT=/home/username/.claude/projects
```

## Advanced Configuration

See [SETUP.md](https://github.com/kunwar-shah/claudex/blob/main/SETUP.md) for advanced configuration options.
