#!/bin/bash

echo "🚀 Setting up Status Page Application..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Backend setup
echo "📦 Setting up Backend..."
cd backend

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created backend .env file"
fi

# Install dependencies
echo "📥 Installing backend dependencies..."
npm install

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npm run prisma:generate

# Push database schema
echo "🗄️  Pushing database schema..."
npm run prisma:push

# Seed database
echo "🌱 Seeding database with initial data..."
npm run prisma:seed

echo "✅ Backend setup complete!"
echo ""

# Frontend setup
cd ../frontend
echo "📦 Setting up Frontend..."

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created frontend .env file"
fi

# Install dependencies
echo "📥 Installing frontend dependencies..."
npm install

echo "✅ Frontend setup complete!"
echo ""

cd ..

echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Or use Docker:"
echo "  docker-compose up --build"
echo ""
echo "Default credentials:"
echo "  Admin: admin@plivo.com / admin123"
echo "  User: user@plivo.com / user123"
echo ""
echo "Access the application:"
echo "  Status Page: http://localhost:5173 (or http://localhost with Docker)"
echo "  API: http://localhost:3000/api"
echo "  WebSocket: ws://localhost:3000/ws"

