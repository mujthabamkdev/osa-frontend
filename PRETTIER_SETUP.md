# Prettier Setup & Configuration Guide

## ✅ What Was Configured

Prettier has been set up to auto-format all pages and code files in your Angular project following consistent code standards.

## 📦 Installation & Configuration

### Installed
- ✅ `prettier` (v3.x) - Code formatter
- ✅ `.prettierrc` - Configuration file
- ✅ `.prettierignore` - Ignore patterns
- ✅ `.vscode/settings.json` - VS Code auto-format settings
- ✅ `.vscode/extensions.json` - Recommended extensions

## 🎯 Prettier Configuration

### `.prettierrc` Settings

```json
{
  "printWidth": 100,                    // Line length
  "tabWidth": 2,                        // Spaces per indent
  "useTabs": false,                     // Use spaces not tabs
  "semi": true,                         // Semicolons required
  "singleQuote": true,                  // Single quotes for JS
  "trailingComma": "es5",               // Trailing commas where valid
  "bracketSpacing": true,               // Space in object literals
  "arrowParens": "always",              // Parentheses around arrow function params
  "endOfLine": "lf",                    // LF line endings
  "singleAttributePerLine": true        // One HTML attribute per line
}
```

## 📋 NPM Scripts Added

```bash
# Format all source files
npm run format

# Check formatting without changing files
npm run format:check

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🔧 VS Code Configuration

### Auto-Format on Save
Prettier will automatically format files when you save them in VS Code:
- ✅ TypeScript files (.ts)
- ✅ HTML templates (.html)
- ✅ CSS stylesheets (.css)
- ✅ SCSS files (.scss)
- ✅ JSON files (.json)
- ✅ JavaScript files (.js)

### Format on Paste
Formatting is also applied when pasting code snippets.

## 🚀 Usage

### Manual Formatting

Format all files:
```bash
npm run format
```

Format specific files:
```bash
npx prettier --write "src/app/**/*.ts"
npx prettier --write "src/app/**/*.html"
npx prettier --write "src/app/**/*.css"
```

Check formatting without changes:
```bash
npm run format:check
```

### Auto-Formatting in VS Code

1. **Install Prettier Extension**
   - Open VS Code Extensions
   - Search for "Prettier - Code formatter"
   - Click Install (or it will suggest when it sees .prettierrc)

2. **Auto-Format on Save**
   - Files will be automatically formatted when you save
   - Format on paste is also enabled

3. **Manual Format**
   - Right-click → Format Document (Shift + Option + F on Mac)
   - Or use keyboard shortcut in VS Code

## 📊 What Gets Formatted

### Files Formatted
✅ All TypeScript (.ts) files
✅ All HTML templates (.html)
✅ All CSS stylesheets (.css)
✅ All SCSS files (.scss)
✅ JSON configuration files (.json)
✅ JavaScript files (.js)

### Files Ignored (`.prettierignore`)
```
node_modules/
.angular/
dist/
build/
.env files
.vscode/ (except settings.json)
.idea/
coverage/
Generated files
```

## ✨ Formatting Examples

### Before Prettier
```typescript
// Inconsistent spacing and formatting
const component = { selector: 'app-test', template: `<div>test</div>`, styles: [`h1 { color: red; }`] }

// Long lines
function calculateSomething(parameterOne, parameterTwo, parameterThree, parameterFour) { return parameterOne + parameterTwo + parameterThree + parameterFour; }
```

### After Prettier
```typescript
// Consistent formatting
const component = {
  selector: 'app-test',
  template: `<div>test</div>`,
  styles: [`h1 { color: red; }`],
};

// Properly wrapped
function calculateSomething(
  parameterOne,
  parameterTwo,
  parameterThree,
  parameterFour
) {
  return parameterOne + parameterTwo + parameterThree + parameterFour;
}
```

## 🔗 Git Pre-commit Hook (Optional)

To automatically format files before committing, you can add a pre-commit hook:

```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

Then add to `package.json`:
```json
"lint-staged": {
  "src/**/*.{ts,html,css,scss,json}": "prettier --write"
}
```

## 📚 Resources

- [Prettier Official Docs](https://prettier.io/docs)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [VS Code Prettier Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## ✅ Verification

Check that Prettier is working:

```bash
# Format all and check
npm run format

# Verify formatting
npm run format:check
```

All files should be formatted consistently now!

---

**Setup Date**: October 18, 2025  
**Status**: ✅ Complete and Ready to Use
