# Adding Templates

How to add support for new message formats.

## Overview

Claudex uses a template system to parse different message formats. You can add new templates by updating two files.

## Step 1: Add Template Detection

**File**: `server/src/parsers/templateDetector.js`

```javascript
'my-template': {
  name: 'My Template Name',
  detect: (samples) => {
    // Return true if messages match your template
    return samples.some(s => s.myUniqueField !== undefined);
  },
  parser: 'my-template'
}
```

## Step 2: Add Parser Method

**File**: `server/src/parsers/messageParser.js`

```javascript
parseMyTemplate(rawMessage) {
  return {
    id: rawMessage.id || this.generateId(),
    role: rawMessage.role === 'user' ? 'user' : 'assistant',
    content: rawMessage.content || '',
    timestamp: rawMessage.timestamp,
    metadata: {...}
  };
}
```

## Step 3: Rebuild Search Index

After adding a new template:

```bash
curl -X POST http://localhost:3400/api/search/index/build
```

Done! Your new template will be automatically detected.
