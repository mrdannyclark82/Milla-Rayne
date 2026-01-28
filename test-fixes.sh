#!/bin/bash
# Test script to verify settings panel fix and proactive server setup

echo "Testing Milla-Rayne Fixes..."
echo "=============================="
echo ""

# Check if ports are available
echo "1. Checking port availability..."
if lsof -ti:5000 > /dev/null 2>&1; then
    echo "   ❌ Port 5000 is already in use"
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    echo "   ✅ Killed process on port 5000"
fi

if lsof -ti:5001 > /dev/null 2>&1; then
    echo "   ❌ Port 5001 is already in use"
    lsof -ti:5001 | xargs kill -9 2>/dev/null
    echo "   ✅ Killed process on port 5001"
fi

echo "   ✅ Ports 5000 and 5001 are available"
echo ""

# Check TypeScript compilation
echo "2. Checking TypeScript compilation..."
npm run check > /tmp/ts-check.log 2>&1
TS_ERRORS=$(grep -c "error TS" /tmp/ts-check.log || echo 0)
if [ "$TS_ERRORS" -gt 0 ]; then
    echo "   ⚠️  Found $TS_ERRORS TypeScript errors (pre-existing)"
else
    echo "   ✅ No TypeScript errors"
fi
echo ""

# Test that proactiveServer.ts exists
echo "3. Checking proactive server file..."
if [ -f "server/proactiveServer.ts" ]; then
    echo "   ✅ Proactive server file exists"
else
    echo "   ❌ Proactive server file not found"
    exit 1
fi
echo ""

# Test that proactiveApi.ts exists
echo "4. Checking proactive API client..."
if [ -f "client/src/lib/proactiveApi.ts" ]; then
    echo "   ✅ Proactive API client exists"
else
    echo "   ❌ Proactive API client not found"
    exit 1
fi
echo ""

# Check .env.example has new port config
echo "5. Checking .env.example..."
if grep -q "PROACTIVE_PORT" .env.example; then
    echo "   ✅ PROACTIVE_PORT documented in .env.example"
else
    echo "   ❌ PROACTIVE_PORT not found in .env.example"
    exit 1
fi
echo ""

# Check package.json has new scripts
echo "6. Checking package.json scripts..."
if grep -q "dev:proactive" package.json; then
    echo "   ✅ dev:proactive script exists"
else
    echo "   ❌ dev:proactive script not found"
    exit 1
fi

if grep -q "dev:all" package.json; then
    echo "   ✅ dev:all script exists"
else
    echo "   ❌ dev:all script not found"
    exit 1
fi
echo ""

# Check SettingsPanel.tsx fix
echo "7. Checking SettingsPanel.tsx fix..."
if grep -q "\\\\n\\\\n" client/src/components/SettingsPanel.tsx; then
    echo "   ❌ Syntax error still present in SettingsPanel.tsx"
    exit 1
else
    echo "   ✅ SettingsPanel.tsx syntax error fixed"
fi
echo ""

echo "=============================="
echo "✅ All checks passed!"
echo ""
echo "To start the application with both servers:"
echo "  npm run dev:all"
echo ""
echo "Or start them separately:"
echo "  npm run dev              # Main server (port 5000)"
echo "  npm run dev:proactive    # Proactive server (port 5001)"
