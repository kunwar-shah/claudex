# Frequently Asked Questions

Common questions about Claudex.

## General

### What is Claudex?
A web viewer for Claude Code conversation histories with full-text search.

### Is my data uploaded anywhere?
No. Everything runs locally. Your conversations never leave your machine.

### What formats are supported?
All Claude Code formats (v1.x, v2-mixed, v2.0+) are automatically detected.

## Usage

### How do I search?
Navigate to Search page, enter query, optionally add filters.

### Can I edit conversations?
No. Claudex is read-only. Use Claude Code to edit conversations.

### How do I export?
Click Export button in session summary, choose format.

## Technical

### What's the search index?
SQLite database that enables fast full-text search.

### When to rebuild index?
- First time setup
- After template changes
- When new conversations added

### What are templates?
Different formats Claude Code uses to save messages. Claudex handles all automatically.

## More Questions?

Check [UI Guide](ui-guide.md) or [open an issue](https://github.com/kunwar-shah/claudex/issues)
