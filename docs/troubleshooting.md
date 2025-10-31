# Troubleshooting

Common issues and solutions.

## Installation Issues

### npm install fails
- Check Node.js version (need 18+)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

### Port already in use
- Change PORT in `server/.env`
- Kill process: `lsof -ti:3400 | xargs kill -9`

## Search Issues

### No results found
- Rebuild index: `curl -X POST http://localhost:3400/api/search/index/build`
- Check query spelling
- Reduce filters

### Search index build fails
- Check disk space
- Check file permissions
- Look for malformed JSONL files

## UI Issues

### Page not loading
- Check server is running
- Clear browser cache
- Check browser console (F12)

### Messages showing "unknown"
- Rebuild search index with latest V3 template
- Template detection may have failed

### "No messages found" despite messages existing
**Symptoms:**
- Session shows "No messages found" or "This session appears to be empty"
- Messages appear intermittently (sometimes show, sometimes don't)
- React console shows: "Encountered two children with the same key"
- Browser console has duplicate key warnings

**Cause:**
- Claude Code's .jsonl format can have multiple consecutive lines with the same message ID
- These lines represent different parts of the same conversation turn (tool_use, tool_result, thinking blocks)
- React drops messages with duplicate keys, causing intermittent empty displays

**Solution:**
Update to v1.1.1+ which implements line-based unique ID generation:
```bash
# Check your version
npm --prefix claude-viewer ls claudex

# Update to latest
cd claude-viewer
git pull origin main
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
npm run dev
```

**Fixed in:** v1.1.1 ([PR #7](https://github.com/kunwar-shah/claudex/pull/7))

**Technical Details:**
- v1.1.1+ uses `{sourceId}-L{lineNumber}` format for IDs
- Guarantees uniqueness even when source IDs repeat
- All messages render correctly without conflicts

## More Help

- [UI Guide](ui-guide.md)
- [Search Guide](search.md)
- [GitHub Issues](https://github.com/kunwar-shah/claudex/issues)
