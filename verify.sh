#!/bin/bash

echo "🔍 Verifying Status Page Application Setup..."
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js installed: $(node -v)"
else
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    echo "✅ npm installed: $(npm -v)"
else
    echo "❌ npm not found"
    exit 1
fi

# Check backend structure
echo ""
echo "Checking backend structure..."
if [ -d "backend/src" ] && [ -f "backend/package.json" ]; then
    echo "✅ Backend structure exists"
else
    echo "❌ Backend structure missing"
    exit 1
fi

# Check frontend structure
echo "Checking frontend structure..."
if [ -d "frontend/src" ] && [ -f "frontend/package.json" ]; then
    echo "✅ Frontend structure exists"
else
    echo "❌ Frontend structure missing"
    exit 1
fi

# Check if dependencies are installed
echo ""
echo "Checking dependencies..."
if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies not installed. Run: cd backend && npm install"
fi

if [ -d "frontend/node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Frontend dependencies not installed. Run: cd frontend && npm install"
fi

# Check database
echo ""
echo "Checking database..."
if [ -f "backend/dev.db" ]; then
    echo "✅ Database file exists"
else
    echo "⚠️  Database not initialized. Run: cd backend && npm run prisma:push && npm run prisma:seed"
fi

# Check Docker
echo ""
echo "Checking Docker (optional)..."
if command -v docker &> /dev/null; then
    echo "✅ Docker installed: $(docker --version)"
    if command -v docker-compose &> /dev/null; then
        echo "✅ Docker Compose installed: $(docker-compose --version)"
    else
        echo "⚠️  Docker Compose not found"
    fi
else
    echo "⚠️  Docker not found (optional for development)"
fi

# Check environment files
echo ""
echo "Checking environment files..."
if [ -f "backend/.env" ]; then
    echo "✅ Backend .env exists"
else
    echo "⚠️  Backend .env missing. Run: cp backend/.env.example backend/.env"
fi

if [ -f "frontend/.env" ]; then
    echo "✅ Frontend .env exists"
else
    echo "ℹ️  Frontend .env missing (optional, defaults will work)"
fi

echo ""
echo "✨ Verification complete!"
echo ""
echo "If all checks passed, you can start the application:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Or use Docker:"
echo "  docker-compose up --build"

