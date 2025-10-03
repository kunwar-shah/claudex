# Git Setup & Verification Guide

## 📦 What's Included in the Repository

### Core Files
- ✅ All source code (server + client)
- ✅ Configuration templates (`.env.example`)
- ✅ Scripts (`install.sh`, `test-search.sh`)
- ✅ Documentation (`README.md`, `SETUP.md`, `INSTALL.md`)
- ✅ Package files (`package.json`, `package-lock.json`)

### Excluded (via .gitignore)
- ❌ `node_modules/` (will be installed via npm)
- ❌ `server/.env` (user-specific, use `.env.example` as template)
- ❌ `server/data/` (SQLite database, created on first run)
- ❌ `client/dist/` (production build, generated)
- ❌ Log files and temporary files

## 🚀 Setup Instructions for New Users

### 1. Clone the Repository

```bash
git clone https://github.com/kunwar-shah/claudex.git
cd claudex
```

### 2. Install All Dependencies

```bash
# Install root dependencies (for npm run dev command)
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 3. Configure Environment

```bash
# Copy environment template
cd server
cp .env.example .env

# Edit .env if needed (default works for most users)
# PROJECT_ROOT=~/.claude/projects  # This is the default
```

### 4. Start the Application

```bash
# From claudex directory
npm run dev
```

This will start:
- Backend server on `http://localhost:3400`
- Frontend dev server on `http://localhost:3000`

### 5. Build Search Index (First Time)

```bash
# Option 1: Using test script
./test-search.sh

# Option 2: Via API
curl -X POST http://localhost:3400/api/search/index/build

# Option 3: Via UI (Search page → "Rebuild Index" button)
```

## ✅ Verification Checklist

After cloning and setup, verify everything works:

- [ ] Dependencies installed without errors
- [ ] Server starts on port 3400
- [ ] Frontend accessible at http://localhost:3000
- [ ] Projects list loads (shows your Claude Code projects)
- [ ] Can view a conversation session
- [ ] Search index builds successfully
- [ ] Search returns results

## 🔍 Troubleshooting Clone Issues

### Missing .env File
**Problem**: Server fails to start with "PROJECT_ROOT not found"

**Solution**:
```bash
cd server
cp .env.example .env
```

### No Projects Found
**Problem**: UI shows "No projects found"

**Solution**: Verify Claude Code projects exist
```bash
ls ~/.claude/projects
# Should show project directories
```

### Port Already in Use
**Problem**: "Port 3400 already in use"

**Solution**: Change port in `server/.env`
```bash
PORT=3401  # or any available port
```

Don't forget to update `client/vite.config.js` proxy target if you change the port.

### Search Not Working
**Problem**: Search returns no results

**Solution**: Build the search index
```bash
curl -X POST http://localhost:3400/api/search/index/build
```

## 📝 Development Workflow

### Making Changes

1. **Create a branch**:
```bash
git checkout -b feature/my-feature
```

2. **Make changes** and test locally:
```bash
npm run dev
```

3. **Commit changes**:
```bash
git add .
git commit -m "Description of changes"
```

4. **Push to remote**:
```bash
git push origin feature/my-feature
```

### Keeping Dependencies Updated

```bash
# Update root dependencies
npm update

# Update server dependencies
cd server && npm update && cd ..

# Update client dependencies
cd client && npm update && cd ..
```

## 🎯 Quick Start for Contributors

### Minimal Setup
```bash
# Clone and install
git clone https://github.com/kunwar-shah/claudex.git && cd claudex
npm install && cd server && npm install && cd ../client && npm install && cd ..

# Configure
cd server && cp .env.example .env && cd ..

# Run
npm run dev
```

### Full Setup with Search
```bash
# Clone and install
git clone https://github.com/kunwar-shah/claudex.git && cd claudex
npm install && cd server && npm install && cd ../client && npm install && cd ..

# Configure
cd server && cp .env.example .env && cd ..

# Run
npm run dev

# In another terminal: Build search index
./test-search.sh
```

## 🔐 Security Notes

### Never Commit These Files
- `server/.env` - Contains user-specific paths
- `server/data/*.db` - SQLite database files
- `node_modules/` - Dependencies (installed via npm)
- `.vscode/` or `.idea/` - IDE settings

### Safe to Commit
- `server/.env.example` - Template for environment variables
- All source code files
- Documentation files
- Configuration files (package.json, etc.)

## 📚 Additional Resources

- [README.md](README.md) - Main documentation
- [SETUP.md](SETUP.md) - Detailed setup guide
- [INSTALL.md](INSTALL.md) - Global CLI installation

## 🐛 Common Git Issues

### Merge Conflicts in package-lock.json
```bash
# Delete package-lock.json and regenerate
rm package-lock.json
npm install
```

### Outdated Dependencies After Pull
```bash
# Reinstall all dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Reset to Clean State
```bash
# Remove all local changes (careful!)
git reset --hard HEAD

# Remove untracked files
git clean -fd

# Reinstall dependencies
npm install
cd server && npm install && cd ../client && npm install && cd ..
```

## ✨ Success Indicators

Your setup is successful when:

1. ✅ All `npm install` commands complete without errors
2. ✅ `npm run dev` starts both frontend and backend
3. ✅ Browser shows UI at http://localhost:3000
4. ✅ Projects list populates with your Claude Code projects
5. ✅ Clicking a session loads the conversation
6. ✅ Search index builds and returns results
7. ✅ Export works (JSON/HTML/TXT formats)

## 🎉 You're Ready!

Once all verification steps pass, you have a fully working Claude Viewer setup. Happy coding! 🚀
