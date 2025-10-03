# Project Structure

Overview of Claudex codebase organization.

## Directory Layout

```
claudex/
├── client/          # React frontend
├── server/          # Node.js backend
├── docs/            # Documentation (this site)
├── screenshots/     # UI screenshots
└── scripts/         # Utility scripts
```

## Frontend (client/)

```
client/
├── src/
│   ├── components/   # React components
│   ├── services/     # API client
│   └── App.jsx       # Main app
├── public/           # Static assets
└── package.json
```

## Backend (server/)

```
server/
├── src/
│   ├── parsers/      # Template parsers
│   ├── services/     # Business logic
│   ├── routes/       # API routes
│   ├── utils/        # Helpers
│   └── server.js     # Entry point
├── data/             # SQLite database
└── .env             # Configuration
```

## Key Files

- `server/src/parsers/messageParser.js` - Message parsing logic
- `server/src/parsers/templateDetector.js` - Template detection
- `client/src/components/ConversationThread.jsx` - Message display
- `docs/index.html` - Documentation site config
