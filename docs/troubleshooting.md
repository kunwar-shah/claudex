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

## More Help

- [UI Guide](ui-guide.md)
- [Search Guide](search.md)
- [GitHub Issues](https://github.com/kunwar-shah/claudex/issues)
