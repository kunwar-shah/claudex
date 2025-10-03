# API Reference

REST API documentation for Claudex.

## Base URL

```
http://localhost:3400/api
```

## Endpoints

### Projects

#### GET /projects
List all projects

**Response**:
```json
{
  "projects": [
    {
      "id": "project-id",
      "name": "Project Name",
      "path": "/path/to/project",
      "sessionCount": 10
    }
  ]
}
```

#### GET /projects/:id/sessions
Get sessions for a project

**Response**:
```json
{
  "sessions": [
    {
      "sessionId": "...",
      "title": "...",
      "messageCount": 100,
      "createdAt": "..."
    }
  ]
}
```

#### GET /projects/:id/sessions/:sessionId
Get full session with messages

**Query params**:
- `page` (default: 1)
- `pageSize` (default: 50)

**Response**:
```json
{
  "session": {...},
  "messages": [...],
  "stats": {...},
  "template": "claude-code-v3"
}
```

### Search

#### POST /search
Search conversations

**Request**:
```json
{
  "q": "search query",
  "projectId": "optional",
  "role": "user|assistant",
  "limit": 50,
  "offset": 0
}
```

**Response**: See [Search Guide](search.md#search-endpoint)

### Health

#### GET /health
Health check

**Response**:
```json
{
  "status": "healthy",
  "projectsRoot": "...",
  "searchIndex": {...}
}
```
