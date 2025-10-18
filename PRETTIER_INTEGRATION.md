# Prettier Integration Guide

## 🚀 Getting Started with Prettier

### Installation Complete ✅

Prettier v3.6.2 has been installed and configured for your Angular project with:
- 44 TypeScript files
- 19 HTML templates
- 9 CSS stylesheets
- **Total: 72 files formatted**

---

## 📋 Quick Commands

### Format All Files
```bash
npm run format
```
Formats all TypeScript, HTML, CSS, SCSS, and JSON files in the `src` directory.

### Check Formatting (No Changes)
```bash
npm run format:check
```
Reports which files don't meet Prettier standards without modifying them.

### Format Specific Directory
```bash
npx prettier --write "src/app/features/**/*.ts"
npx prettier --write "src/app/**/*.html"
```

### Format Single File
```bash
npx prettier --write "src/app/app.component.ts"
```

---

## 🎯 VS Code Integration

### Auto-Format on Save

1. **Install Prettier Extension** (if not already installed)
   - Press `Cmd + Shift + X` (Mac) or `Ctrl + Shift + X` (Windows/Linux)
   - Search for "Prettier"
   - Click "Install" on "Prettier - Code formatter by Prettier"

2. **File Will Auto-Format When You:**
   - Save (Cmd + S / Ctrl + S)
   - Paste code (Cmd + V / Ctrl + V)

3. **Manual Format Shortcut**
   - Press `Shift + Option + F` (Mac) or `Shift + Alt + F` (Windows/Linux)
   - Or right-click → "Format Document"

### Configuration Files

The following files control Prettier behavior in VS Code:

**`.prettierrc`** - Main configuration
```json
{
  "printWidth": 100,        // Max line length
  "tabWidth": 2,            // Indent size
  "useTabs": false,         // Use spaces
  "semi": true,             // Require semicolons
  "singleQuote": true,      // Use single quotes
  "trailingComma": "es5",   // Add trailing commas
  "arrowParens": "always"   // Parentheses on arrow functions
}
```

**`.vscode/settings.json`** - Editor configuration
- Default formatter set to Prettier
- Format on save enabled
- Format on paste enabled

**`.prettierignore`** - Files to skip
- node_modules/
- .angular/
- dist/ (build output)
- .env files
- Generated files

---

## 📊 Format Standards

### TypeScript
```typescript
// Before
const obj={a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12,m:13,n:14}

// After
const obj = {
  a: 1,
  b: 2,
  c: 3,
  d: 4,
  e: 5,
  f: 6,
  g: 7,
  h: 8,
  i: 9,
  j: 10,
  k: 11,
  l: 12,
  m: 13,
  n: 14,
};
```

### HTML
```html
<!-- Before -->
<div class="container"><button (click)="handleClick($event)" class="btn btn-primary">Click Me</button></div>

<!-- After -->
<div class="container">
  <button
    (click)="handleClick($event)"
    class="btn btn-primary"
  >
    Click Me
  </button>
</div>
```

### CSS
```css
/* Before */
h1{color:red;font-size:24px;font-weight:bold;text-align:center;margin:10px;}

/* After */
h1 {
  color: red;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin: 10px;
}
```

---

## 🔧 Advanced Configuration

### Disable Prettier for Specific Files

Add comment at top of file:
```typescript
// prettier-ignore
const unformattedCode = {a:1,b:2,c:3}
```

Or for entire file:
```typescript
// prettier-ignore-start
const code1 = {a:1}
const code2 = {b:2}
// prettier-ignore-end
```

### Format Before Git Commit (Optional)

Install husky for pre-commit hooks:
```bash
npm install --save-dev husky lint-staged

npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

Add to `package.json`:
```json
{
  "lint-staged": {
    "src/**/*.{ts,html,css,scss,json}": "prettier --write"
  }
}
```

---

## 🐛 Troubleshooting

### Prettier Not Formatting on Save

**Solution 1:** Ensure Prettier extension is installed
```bash
# Search for "Prettier - Code formatter" in VS Code extensions
```

**Solution 2:** Set as default formatter
```
1. Open Command Palette (Cmd + Shift + P)
2. Type "Format Document With"
3. Select "Prettier"
4. It will be remembered for future saves
```

**Solution 3:** Check `.vscode/settings.json`
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

### Formatting Conflicts with ESLint

**Solution:** Configure ESLint to use Prettier rules
```bash
npm install --save-dev eslint-config-prettier
```

In `.eslintrc.json`:
```json
{
  "extends": ["prettier"]
}
```

### Some Files Not Formatting

**Check:**
1. File type is supported (ts, html, css, scss, json, js)
2. File is not in `.prettierignore`
3. File doesn't have `// prettier-ignore` comment
4. Run `npm run format:check` to see what's wrong

---

## 📚 Resources

- [Prettier Official Documentation](https://prettier.io/)
- [Configuration Options](https://prettier.io/docs/en/options.html)
- [VS Code Extension Guide](https://github.com/prettier/prettier-vscode)
- [Prettier CLI Reference](https://prettier.io/docs/en/cli.html)

---

## 🎉 Status Summary

| Component | Status |
|-----------|--------|
| Installation | ✅ Complete |
| Configuration | ✅ Complete |
| VS Code Settings | ✅ Configured |
| Auto-format on Save | ✅ Enabled |
| NPM Scripts | ✅ Added |
| All Files Formatted | ✅ Done (72 files) |

**You're all set! Start coding and Prettier will keep your code formatted automatically.**

---

**Last Updated:** October 18, 2025  
**Prettier Version:** 3.6.2  
**Status:** ✅ Ready to Use
