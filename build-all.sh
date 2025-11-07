#!/bin/bash
set -e

echo "🔨 Building Status Page Application..."
echo ""

echo "📦 Step 1: Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

echo "🗄️  Step 2: Setting up database..."
npx prisma generate
npx prisma db push
echo "✅ Database ready"
echo ""

echo "⚙️  Step 3: Building backend..."
npm run build
echo "✅ Backend built"
echo ""

echo "📦 Step 4: Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

echo "🎨 Step 5: Building frontend..."
npm run build
echo "✅ Frontend built"
echo ""

echo "📂 Step 6: Copying frontend to backend..."
cd ..
rm -rf backend/public
mkdir -p backend/public
cp -r frontend/dist/* backend/public/
echo "✅ Frontend copied to backend/public"
echo ""

echo "🎉 Build complete! Backend will serve frontend at root path."
echo "Run: cd backend && npm start"

