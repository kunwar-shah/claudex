# 🚀 Claudex - Setup Guide

Complete guide to set up Claudex on any machine.

---

## 📋 **Prerequisites**

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v9+ (comes with Node.js)
- **Claude Code** installed and configured

---

## ⚡ **Quick Setup (5 minutes)**

### **1. Clone or Download the Project**

```bash
git clone https://github.com/kunwar-shah/claudex.git
cd claudex
```

### **2. Configure Environment Variables**

```bash
# Copy example environment file
cp server/.env.example server/.env
```

**Edit `server/.env` if needed:**
```env
# Default location (works for most users)
PROJECT_ROOT=~/.claude/projects

# Or use custom path:
# PROJECT_ROOT=/path/to/your/claude/projects

PORT=3400
NODE_ENV=development
```

> **Note:** The `~` will automatically expand to your home directory!

### **3. Install Dependencies**

```bash
# Install all dependencies (server + client)
npm run install-deps
```

### **4. Start the Application**

```bash
# Start both frontend and backend with hot reload
npm run dev
```

**Access the application:**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3400

---

## 🔍 **First-Time Setup - Search Index**

After starting the application, build the search index:

**Option 1: Via API**
```bash
curl -X POST http://localhost:3400/api/search/index/build
```

**Option 2: Via UI**
- Navigate to http://localhost:3000
- Go to Search page
- Click "Build Index" (if available)

> **Note:** Index building happens in the background and may take a few minutes depending on the number of conversations.

---

## 📁 **Claude Projects Location**

Claude Viewer expects your Claude Code projects in one of these locations:

### **Default Location**
```
~/.claude/projects/
```

### **Custom Location**
If your projects are elsewhere, update `server/.env`:
```env
PROJECT_ROOT=/custom/path/to/projects
```

### **Verify Your Projects Directory**
```bash
ls ~/.claude/projects
```

You should see directories like:
```
project1/
project2/
...
```

---

## 🛠️ **Development Commands**

```bash
# Start development mode (hot reload)
npm run dev

# Start production mode
npm start

# Build client for production
npm run build

# Install dependencies only
npm run install-deps

# Run tests
npm test
```

---

## 🔧 **Configuration Options**

### **Server Configuration** (`server/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_ROOT` | `~/.claude/projects` | Path to Claude Code projects |
| `PORT` | `3400` | Backend server port |
| `NODE_ENV` | `development` | Environment mode |
| `SEARCH_DB_PATH` | `./data/search.db` | Search database location |

### **Client Configuration** (`client/vite.config.js`)

The client proxies API requests to the backend automatically:
- Development: `http://localhost:3400`
- Production: Same host as frontend

---

## 🐛 **Troubleshooting**

### **"Cannot find module" errors**
```bash
# Reinstall dependencies
rm -rf node_modules server/node_modules client/node_modules
npm run install-deps
```

### **Port already in use**
```bash
# Change port in server/.env
PORT=3500

# Or kill process using the port
lsof -ti:3400 | xargs kill -9
```

### **Projects not showing up**
1. Verify `PROJECT_ROOT` in `server/.env`
2. Check directory exists: `ls ~/.claude/projects`
3. Ensure projects have `.jsonl` conversation files

### **Search not working**
```bash
# Rebuild search index
curl -X POST http://localhost:3400/api/search/index/build
```

---

## 📦 **Production Deployment**

### **1. Build the Client**
```bash
cd client
npm run build
```

### **2. Set Environment**
```env
NODE_ENV=production
PROJECT_ROOT=~/.claude/projects
PORT=3400
```

### **3. Start the Server**
```bash
cd server
npm start
```

The server will serve the built client at http://localhost:3400

---

## 🔐 **Security Considerations**

- **Local Use Only:** Claude Viewer is designed for local development use
- **No Authentication:** Do not expose to the internet without proper authentication
- **File Access:** The server has read access to your Claude Code projects directory

---

## 📚 **Project Structure**

```
claude-viewer/
├── client/          # React frontend (Vite)
├── server/          # Fastify backend
├── docs/            # Documentation
├── package.json     # Root package file
└── README.md        # Project overview
```

---

## 🤝 **Support**

Having issues? Check:
1. Node.js version: `node --version` (should be v18+)
2. npm version: `npm --version` (should be v9+)
3. Claude Code installation: `ls ~/.claude/projects`
4. Server logs in terminal

---

## 🎉 **You're All Set!**

Your Claude Viewer should now be running at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3400

Happy viewing! 🚀
