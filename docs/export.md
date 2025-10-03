# Export

Export conversations in multiple formats.

## Available Formats

### JSON Export
**Format**: `.json`

**Use case**: Archiving, data analysis, backup

**Contents**:
```json
{
  "session": {
    "sessionId": "...",
    "title": "...",
    "template": "claude-code-v3"
  },
  "messages": [...],
  "stats": {...},
  "exportedAt": "2025-10-03T..."
}
```

**Best for**:
- ✅ Complete data backup
- ✅ Importing into other tools
- ✅ Programmatic analysis

### HTML Export
**Format**: `.html`

**Use case**: Sharing, presentation, archiving

**Features**:
- Standalone file (no dependencies)
- Styled and formatted
- Syntax highlighted code
- Print-friendly

**Best for**:
- ✅ Sharing with team members
- ✅ Creating reports
- ✅ Offline viewing

### TXT Export
**Format**: `.txt`

**Use case**: Documentation, plain text backup

**Features**:
- Clean transcript format
- Role indicators
- Timestamps
- No formatting/styling

**Best for**:
- ✅ Adding to documentation
- ✅ Plain text archiving
- ✅ Copying into other documents

## How to Export

See [UI Guide - Export Button](ui-guide.md#export-button)
