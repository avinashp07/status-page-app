# Single Service Deployment Guide

Deploy **entire application** as ONE service on Render!

## 🚀 Deploy in 5 Minutes

### Step 1: Create Web Service on Render

1. Go to **https://render.com**
2. Click **"New +"** → **"Web Service"**
3. Connect **`avinashp07/status-page-app`**

### Step 2: Configure (ONE Service for Everything!)

```
Name: status-page-app
Region: Singapore (Southeast Asia)
Branch: main
Root Directory: [leave empty - use root]
Runtime: Node

Build Command:
chmod +x build-all.sh && ./build-all.sh && cd backend && npm run build

Start Command:
cd backend && npm start
```

### Step 3: Environment Variables

Add these:
```
DATABASE_URL=file:./prod.db
JWT_SECRET=your-secret-key-12345
NODE_ENV=production
PORT=3000
```

### Step 4: Deploy!

1. Click **"Create Web Service"**
2. Wait 5-6 minutes (builds both frontend + backend)
3. Once live, click **"Shell"** tab
4. Run: `cd backend && npm run prisma:seed`
5. Done! ✅

### Your URLs:

**Everything served from ONE URL:**
- App: `https://your-app.onrender.com`
- API: `https://your-app.onrender.com/api/health`  
- Status Page: `https://your-app.onrender.com/plivo-inc`
- Admin: `https://your-app.onrender.com/admin`
- Login: `https://your-app.onrender.com/login`

## ✅ Advantages

- ✅ **ONE deployment** instead of two
- ✅ **ONE URL** to remember
- ✅ **No CORS issues**
- ✅ **Simpler configuration**
- ✅ **Faster (no cross-domain calls)**

## 🔧 How It Works

1. Build script builds frontend → copies to `backend/public/`
2. Backend serves static files from `/public`
3. All routes go through one server
4. API at `/api/*`, frontend at `/*`

## 🐛 Troubleshooting

**Build fails:**
- Make sure Root Directory is **empty** (not `backend`)
- Check build command includes `chmod +x build-all.sh`

**Frontend doesn't load:**
- Check logs: should see "Frontend copied to backend/public"
- Visit `/api/health` - should return JSON
- Visit `/` - should show frontend

**Database seed fails:**
- After first deploy, open Shell
- Run: `cd backend && npm run prisma:seed`

## 💡 Local Testing

Test locally:
```bash
cd /Users/avinash/status-page-app
./build-all.sh
cd backend
npm start
```

Visit: `http://localhost:3000`

