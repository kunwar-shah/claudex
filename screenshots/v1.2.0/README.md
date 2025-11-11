# Claudex v1.2.0 Screenshots

## Required Screenshots

### 1. **Theme Selector** (`01-theme-selector.png`)
- Settings modal open, Appearance tab
- All 10 theme buttons visible in 3x4 grid

### 2. **Font Family Preview** (`02-font-family-preview.png`)
- Font grid showing actual typefaces
- At least 18 fonts visible

### 3. **Font Size & Border Radius** (`03-font-size-border-radius.png`)
- Dropdowns showing all options

### 4. **Settings Tabs - "Soon" Badges** (`04-settings-tabs-soon-badges.png`)
- Sidebar with "Soon" badges on disabled tabs

## Taking Screenshots

### Automated (Playwright):
```bash
npm install -D @playwright/test
npx playwright install chromium
node scripts/take-screenshots.js
```

### Manual:
1. Start app: `npm run dev`
2. Open settings, take screenshots
3. Save with filenames above
