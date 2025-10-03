# Templates

Understanding Claude Code message templates and formats.

## What are Templates?

Templates are the different formats Claude Code uses to save conversation messages. Claudex automatically detects and parses all formats.

## Supported Templates

### Claude Code V3 (Universal)
**Status**: ✅ Recommended

**Description**: Universal template that handles all Claude Code versions

**Features**:
- Works with v1.x, v2-mixed, and v2.0+ formats
- Handles new `file-history-snapshot` messages
- Maps system messages to assistant
- Binary user/assistant classification

**When used**: Automatically detected for all conversations

### Claude Code V2.0+
**Status**: ✅ Fully Supported

**Description**: New format with direct role field

**Features**:
- `role` field directly in message
- New message types
- Enhanced metadata

### Claude Code V1.x
**Status**: ✅ Fully Supported

**Description**: Original Claude Code format

**Features**:
- `type` field for message role
- Standard timestamp format
- UUID-based message IDs

## Template Detection

Claudex automatically detects the correct template using a waterfall approach:

1. Check for V2.0+ indicators (role field)
2. Check for file-history-snapshot
3. Check for V1.x structure
4. Fall back to generic parser

**You don't need to do anything** - detection is automatic!

## Role Mapping

All templates are normalized to:
- **user**: Messages from you
- **assistant**: Messages from Claude (including system messages)

This provides a consistent experience regardless of the underlying format.

## Learn More

- [UI Guide](ui-guide.md) - Understanding template badges
- [Features](features.md) - Template support features
