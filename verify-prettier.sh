#!/bin/bash

echo "🔍 Prettier Setup Verification"
echo "=============================="
echo ""

FRONTEND_DIR="/Users/mujthabamk/Desktop/real-world-projects/osa/OSA/osa-frontend"
cd "$FRONTEND_DIR" || exit 1

echo "✅ Checking Installation..."
echo ""

# Check if prettier is installed
if npm list prettier >/dev/null 2>&1; then
    PRETTIER_VERSION=$(npm list prettier | grep prettier | head -1)
    echo "✓ Prettier installed: $PRETTIER_VERSION"
else
    echo "✗ Prettier NOT installed"
    exit 1
fi

# Check configuration files
echo ""
echo "✅ Checking Configuration Files..."
echo ""

if [ -f ".prettierrc" ]; then
    echo "✓ .prettierrc found"
    echo "  Settings:"
    grep -E '"(printWidth|tabWidth|semi|singleQuote)"' .prettierrc | sed 's/^/    /'
else
    echo "✗ .prettierrc NOT found"
fi

if [ -f ".prettierignore" ]; then
    echo "✓ .prettierignore found"
else
    echo "✗ .prettierignore NOT found"
fi

if [ -f ".vscode/settings.json" ]; then
    echo "✓ .vscode/settings.json configured"
else
    echo "✗ .vscode/settings.json NOT found"
fi

if [ -f ".vscode/extensions.json" ]; then
    echo "✓ .vscode/extensions.json configured"
else
    echo "✗ .vscode/extensions.json NOT found"
fi

# Check npm scripts
echo ""
echo "✅ Checking npm Scripts..."
echo ""

if grep -q '"format"' package.json; then
    echo "✓ format script available"
fi

if grep -q '"format:check"' package.json; then
    echo "✓ format:check script available"
fi

# Check formatted files
echo ""
echo "✅ File Statistics..."
echo ""

TS_COUNT=$(find src -name "*.ts" -type f | wc -l)
HTML_COUNT=$(find src -name "*.html" -type f | wc -l)
CSS_COUNT=$(find src -name "*.css" -type f | wc -l)
JSON_COUNT=$(find src -name "*.json" -type f 2>/dev/null | wc -l)

echo "TypeScript files:    $TS_COUNT"
echo "HTML files:         $HTML_COUNT"
echo "CSS files:          $CSS_COUNT"
echo "JSON files:         $JSON_COUNT"
echo "Total:              $((TS_COUNT + HTML_COUNT + CSS_COUNT + JSON_COUNT))"

echo ""
echo "✅ Usage Commands"
echo ""
echo "Format all files:"
echo "  npm run format"
echo ""
echo "Check formatting:"
echo "  npm run format:check"
echo ""
echo "Format specific file:"
echo "  npx prettier --write \"src/app/app.component.ts\""
echo ""

echo "🎉 Prettier Setup Complete!"
echo ""
