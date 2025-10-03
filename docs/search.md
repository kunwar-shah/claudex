# Search System

Claudex includes a powerful full-text search engine powered by SQLite FTS5.

## Overview

The search system allows you to quickly find conversations, messages, and specific content across all your Claude Code sessions.

### Key Features
- **Full-Text Search**: Search entire message content
- **Fast Performance**: Sub-millisecond search times
- **Relevance Ranking**: Results sorted by match quality
- **Advanced Filters**: Project, role, date, template filters
- **Persistent Index**: Build once, search instantly

## Building the Search Index

### First Time Setup

Before searching, you need to build the search index:

```bash
# Via API
curl -X POST http://localhost:3400/api/search/index/build

# Via test script
./test-search.sh

# Via UI
Navigate to Search page → Click "Rebuild Index"
```

### When to Rebuild

Rebuild the search index when:
- ✅ First time setup
- ✅ After template changes (V1 → V3 upgrade)
- ✅ When new conversations are added
- ✅ If search results seem outdated

## Using Search

### Basic Search

1. Navigate to the Search page
2. Enter your search query
3. Press Enter or click "Search"

**Example queries**:
```
migration
"exact phrase"
database schema
npm install
```

### Advanced Filtering

#### Filter by Project
Select a specific project from the dropdown to limit search scope.

#### Filter by Role
- **User**: Search only user messages
- **Assistant**: Search only assistant messages
- **All**: Search both (default)

#### Filter by Date Range
- **From Date**: Messages after this date
- **To Date**: Messages before this date

#### Filter by Template
- **Claude Code v3**: Universal template
- **Claude Code v2 Mixed**: Transition format
- **Claude Code v1**: Original format

### Search Results

Each result shows:
- **Role Badge**: user or assistant
- **Session Info**: Session ID and timestamp
- **Project Name**: Which project it's from
- **Content Preview**: Matching text snippet
- **Relevance Score**: Match quality (0-10)
- **Line Number**: Location in file

### Viewing Full Message

Click on any search result to:
- View the full message content
- See properly formatted markdown/code
- Copy the message to clipboard
- Navigate to the full conversation

## Search Tips

### Exact Phrases
Use quotes for exact matches:
```
"npm install"
"Cannot read property"
```

### Boolean Operators
Combine terms with AND/OR:
```
database AND migration
react OR vue
```

### Wildcards
Use `*` for partial matches:
```
migrat*  (matches migration, migrate, migrating)
```

### Special Characters
Escape special characters:
```
file\.ts
function\(\)
```

## API Usage

### Search Endpoint

**POST** `/api/search`

```bash
curl -X POST http://localhost:3400/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "q": "migration",
    "projectId": "my-project",
    "role": "user",
    "limit": 20,
    "offset": 0
  }'
```

**Response**:
```json
{
  "hits": [
    {
      "projectId": "my-project",
      "projectName": "My Project",
      "sessionId": "session-123",
      "messageId": "msg-456",
      "role": "user",
      "snippet": "...migration code...",
      "timestamp": "2025-10-03T...",
      "score": 8.5,
      "line": 172
    }
  ],
  "total": 42,
  "query": "migration"
}
```

### Index Management

#### Build Index
```bash
POST /api/search/index/build
```

#### Check Status
```bash
GET /api/search/index/status
```

#### Clear Index
```bash
POST /api/search/index/clear
```

## Performance

### Index Size
- **10,000 messages**: ~50MB index
- **50,000 messages**: ~250MB index
- **100,000 messages**: ~500MB index

### Build Time
- **10,000 messages**: ~30 seconds
- **50,000 messages**: ~2-3 minutes
- **100,000 messages**: ~5-6 minutes

### Search Speed
- **Average**: <10ms per search
- **Complex queries**: <50ms
- **Large result sets**: <100ms

## Troubleshooting

### No Results Found

**Check**:
1. Index is built: `curl http://localhost:3400/api/search/index/status`
2. Query spelling is correct
3. Filters aren't too restrictive
4. Messages actually exist with that content

### Slow Search

**Solutions**:
1. Rebuild index if corrupted
2. Reduce result limit
3. Use more specific queries
4. Add filters to narrow scope

### Index Build Fails

**Common causes**:
1. Malformed JSONL files
2. Disk space full
3. Permission issues
4. Large conversation files

**Fix**:
```bash
# Clear and rebuild
curl -X POST http://localhost:3400/api/search/index/clear
curl -X POST http://localhost:3400/api/search/index/build
```

## Future Enhancements

- [ ] Fuzzy matching
- [ ] Spell correction
- [ ] Search suggestions
- [ ] Saved searches
- [ ] Search history
- [ ] Export search results
