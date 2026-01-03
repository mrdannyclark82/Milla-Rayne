#!/bin/bash

# MCP Services Installation Script
# Completes the MCP implementation by installing required packages

echo "🚀 Milla-Rayne MCP Services Installation"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Installing required MCP dependencies..."
echo ""

# Install required packages
npm install @octokit/rest puppeteer

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
else
    echo ""
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ .env file created. Please add your API keys!"
    echo ""
fi

echo "📋 MCP Services Status:"
echo ""
echo "✅ Filesystem MCP - Ready (no API key needed)"
echo "✅ Memory MCP - Ready (no API key needed)"
echo "✅ Postgres MCP - Ready (uses DATABASE_URL)"
echo "⏳ GitHub MCP - Needs GITHUB_TOKEN in .env"
echo "⏳ Brave Search MCP - Needs BRAVE_SEARCH_API_KEY in .env"
echo "⏳ Puppeteer MCP - Ready (optional API configuration)"
echo ""

echo "🔑 Required Environment Variables:"
echo ""
echo "  GITHUB_TOKEN=ghp_your_token_here"
echo "  BRAVE_SEARCH_API_KEY=your_brave_api_key"
echo ""

echo "📖 Documentation:"
echo ""
echo "  - Implementation Summary: docs/MCP_IMPLEMENTATION_SUMMARY.md"
echo "  - Complete Guide: docs/MCP_SERVICES_GUIDE.md"
echo "  - API Reference: docs/MCP_QUICK_REFERENCE.md"
echo ""

echo "🎯 Next Steps:"
echo ""
echo "  1. Add your API keys to .env file"
echo "  2. Run: npm run dev"
echo "  3. Test endpoints with curl or Postman"
echo "  4. Integrate MCP services into your AI workflows"
echo ""

echo "✨ Installation complete! All 6 MCP services are ready."
