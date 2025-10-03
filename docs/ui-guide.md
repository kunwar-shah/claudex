# User Interface Guide

Complete guide to using Claudex interface features.

## Overview

Claudex has a clean, three-panel layout:
- **Left**: Project selector and session list
- **Center**: Conversation thread (messages)
- **Right**: Session summary and actions

---

## Navigation

### Top Bar

#### Project Selector
**Location**: Top-left dropdown

**What it does**: Switch between different Claude Code projects

**How to use**:
1. Click the dropdown showing current project name
2. Select a different project from the list
3. The session list will update automatically

**Tip**: The project name shows the folder name from `~/.claude/projects`

---

## Session List (Left Sidebar)

### Session Cards

Each session shows:
- **Title**: Session ID or first message
- **Date**: When the conversation was created
- **Message Count**: Total messages in the session
- **Template Badge**: Which format (v1/v2/v3)

**Clicking a session**: Loads the conversation in the center panel

**Visual Indicators**:
- **Blue border**: Currently selected session
- **Hover effect**: Gray background when hovering

---

## Conversation View (Center Panel)

### Message Bubbles

Each message has:
- **Role Badge**: Shows "user" or "assistant"
- **Timestamp**: When the message was sent
- **Content**: The actual message text

**Role Colors**:
- 🔵 **Blue**: User messages (left border)
- 🟢 **Green**: Assistant messages (left border)

### Message Actions

Every message has action buttons in the top-right corner:

#### 📋 Copy Button
**Icon**: Copy icon (two overlapping squares)

**What it does**: Copies the entire message content to your clipboard

**How to use**:
1. Click the copy icon on any message
2. Success notification appears
3. Message is now in your clipboard
4. Paste anywhere with Ctrl+V (Cmd+V on Mac)

**Use cases**:
- Save code snippets
- Share specific responses
- Archive important information

#### ➕ Expand/Collapse Button
**Icon**: Plus (+) or Minus (-) sign

**What it does**: Shows or hides message details

**How to use**:
1. Click the **+** icon to expand
2. Click the **-** icon to collapse

**What it shows when expanded**:
- **Tool Usage**: Any tools Claude used (file reads, edits, searches)
- **Thinking Process**: Internal reasoning (if available)
- **File Operations**: Files created, modified, or deleted
- **Metadata**: Message ID, line number, template info

**Example expanded view**:
```
🔧 Tool Calls
  ├─ Read: src/components/Header.jsx
  ├─ Edit: src/App.jsx
  └─ Bash: npm install

📁 File Operations
  ├─ Modified: 2 files
  └─ Created: 1 file

🧠 Thinking
  [Shows Claude's internal reasoning process]
```

**When to expand**:
- ✅ To see which files were changed
- ✅ To understand tool usage
- ✅ To debug what happened
- ✅ To see the full conversation context

#### 🔗 Link Button (if available)
**Icon**: Link icon

**What it does**: Copies a direct link to this specific message

**How to use**:
1. Click the link icon
2. URL is copied with message ID
3. Share with others or bookmark

---

## Message Content Rendering

### Markdown Support

Claudex renders markdown beautifully:

**Text Formatting**:
- **Bold**: `**text**`
- *Italic*: `*text*`
- `Code`: `` `code` ``
- ~~Strikethrough~~: `~~text~~`

**Lists**:
- Bullet lists
- Numbered lists
- Nested lists
- Task lists (checkboxes)

**Code Blocks**:
```javascript
// Syntax highlighted
function example() {
  return "Code is colored based on language";
}
```

**Features**:
- ✅ Language detection
- ✅ Syntax highlighting
- ✅ Copy button on code blocks
- ✅ Line numbers (for long code)

**Tables**:
| Feature | Status |
|---------|--------|
| Search  | ✅     |
| Export  | ✅     |

**Blockquotes**:
> Important information is highlighted
> with a left border

### Special Content Types

#### Diffs (File Changes)
Shows what changed in files:
```diff
- Old line (red)
+ New line (green)
  Unchanged line
```

#### JSON
Automatically formatted and highlighted:
```json
{
  "key": "value",
  "nested": {
    "data": true
  }
}
```

#### Tool Usage Blocks
Visual display of tool executions:
- Tool name and ID
- Input parameters
- Results/output
- Expandable details

---

## Session Summary (Right Sidebar)

### Summary Panel

Shows at-a-glance information:

#### Session Metadata
- **Session ID**: Unique identifier
- **Created**: Date and time
- **Template**: Format detected (v1/v2/v3)
- **Total Messages**: Count

#### Message Distribution
Visual breakdown:
- 👤 **User**: X messages
- 🤖 **Assistant**: Y messages
- 📊 **Total**: Z messages

#### File Operations (if any)
- 📝 **Files Modified**: Count
- ➕ **Files Created**: Count
- ❌ **Files Deleted**: Count

### Export Button

**Location**: Bottom of summary panel

**What it does**: Download the conversation

**Export Formats**:

#### 📄 JSON Export
- Complete data structure
- All metadata included
- Good for archiving
- Import into other tools

**Example JSON**:
```json
{
  "session": {...},
  "messages": [...],
  "stats": {...}
}
```

#### 📝 HTML Export
- Standalone web page
- Styled and formatted
- Open in any browser
- Print-friendly
- Share via email

**Example use**: Share conversation with team member

#### 📋 TXT Export
- Plain text transcript
- Clean, readable format
- Role indicators
- Timestamps
- Good for documentation

**Example use**: Add to project notes

**How to export**:
1. Click **Export** button
2. Choose format from dropdown
3. File downloads automatically
4. Named: `project-session-date.format`

---

## Search Page

### Search Interface

**Location**: Click "Search" in navigation

#### Search Bar
**What to type**: Any text you're looking for

**Examples**:
- `migration` - Find all mentions
- `"exact phrase"` - Match exactly
- `npm install` - Multiple words

#### Filters (Advanced)

**Project Filter**:
- Dropdown to select specific project
- Default: Search all projects

**Role Filter**:
- **All**: Search both user and assistant
- **User**: Only user messages
- **Assistant**: Only assistant messages

**Date Range**:
- **From**: Start date
- **To**: End date
- Leave blank for all time

**Template Filter**:
- **All Templates**: Search everything
- **V3**: Only v3 format
- **V2**: Only v2 format
- **V1**: Only v1 format

**Advanced Filters Toggle**:
- Click the filter icon (⚡)
- Shows/hides all filter options

### Search Results

Each result shows:
- **Role Badge**: user/assistant
- **Session Info**: Which conversation
- **Timestamp**: When it was sent
- **Content Preview**: Matching text
- **Project Name**: Which project
- **Relevance Score**: How good the match (0-10)
- **Line Number**: Location in file

**Actions on results**:
- **Click result**: Opens full message in modal
- **Click "Open"**: Opens full conversation in new tab
- **Modal actions**: Copy, close

---

## Keyboard Shortcuts

### Global
- `Ctrl+K` / `Cmd+K`: Focus search
- `Esc`: Close modals
- `Ctrl+/` / `Cmd+/`: Show keyboard shortcuts

### Navigation
- `↑` / `↓`: Navigate sessions
- `Enter`: Open selected session
- `←` / `→`: Previous/Next message page

### Messages
- `C`: Copy message
- `E`: Expand/collapse message
- `Ctrl+C` / `Cmd+C`: Copy selected text

---

## Tips & Tricks

### Efficient Navigation

**Quickly find conversations**:
1. Use search instead of scrolling
2. Filter by date if you remember when
3. Look at message count (longer = more detailed)

**Switch projects fast**:
- Use keyboard to open dropdown
- Type first letter of project name

### Working with Messages

**Copy code efficiently**:
1. Expand message to see all code blocks
2. Use code block copy button (not message copy)
3. Preserves formatting

**Share specific messages**:
1. Click link icon on message
2. Send URL to colleague
3. They open directly to that message

**Export for different uses**:
- **JSON**: Backup or data analysis
- **HTML**: Share with non-technical people
- **TXT**: Add to documentation

### Search Like a Pro

**Narrow down results**:
1. Start broad search
2. Add filters based on results
3. Use date range if too many matches

**Find code snippets**:
- Search for function names
- Search for file paths
- Filter by assistant role (code is usually from assistant)

**Track conversations**:
- Search for project names
- Search for error messages
- Search for dates

---

## Common Questions

### Why can't I see some messages?

**Messages are paginated** - scroll down or click "Load More" to see additional messages.

**Default**: 50 messages per page

### What does the template badge mean?

**Template** = The format Claude Code used to save the conversation

- **v3**: Latest universal format (recommended)
- **v2-mixed**: Transition format
- **v1**: Original format

All work the same - v3 just handles all edge cases better.

### Can I edit messages?

**No** - Claudex is view-only. It reads from your Claude Code history files but doesn't modify them.

To edit conversations, use Claude Code directly.

### Where is the data stored?

**Local only** - All your conversations are in `~/.claude/projects`

Claudex reads from there but doesn't:
- ❌ Upload to cloud
- ❌ Modify files
- ❌ Share data
- ❌ Track usage

### What's the search index?

**SQLite database** that makes search fast

- Built once from your conversations
- Stored locally in `server/data/`
- Rebuild when:
  - New conversations added
  - Template changes
  - Search seems outdated

**Rebuild**: See [Search Guide](search.md)

---

## Troubleshooting UI Issues

### Buttons not working

**Try**:
1. Hard refresh: `Ctrl+Shift+R` / `Cmd+Shift+R`
2. Clear browser cache
3. Check browser console for errors (F12)

### Messages not displaying

**Check**:
1. Template is detected correctly
2. JSONL file isn't corrupted
3. Browser console for errors

### Export not downloading

**Try**:
1. Check browser popup blocker
2. Allow downloads from localhost
3. Try different export format

### Search not finding results

**Solutions**:
1. Rebuild search index
2. Check spelling
3. Reduce filters
4. Try simpler search terms

---

## Need More Help?

- 📖 [Full Documentation](https://kunwar-shah.github.io/claudex/)
- 🐛 [Report Issues](https://github.com/kunwar-shah/claudex/issues)
- 💬 [Ask Questions](https://github.com/kunwar-shah/claudex/discussions)
