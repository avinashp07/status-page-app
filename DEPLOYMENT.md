# Deployment Guide

## Quick Deployment Options

### Option 1: Render.com (Recommended - Free Tier Available)

#### Deploy Backend

1. Create account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `status-page-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   ```
   DATABASE_URL=file:./prod.db
   JWT_SECRET=<generate-secure-secret>
   NODE_ENV=production
   PORT=3000
   ```

6. Deploy!

#### Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `status-page-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_WS_URL=wss://your-backend.onrender.com/ws
   ```

5. Deploy!

---

### Option 2: Railway.app (Easy + Free Tier)

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects the services
6. Set environment variables for each service
7. Deploy!

---

### Option 3: Vercel (Frontend) + Render (Backend)

#### Backend on Render
Follow the Render backend instructions above.

#### Frontend on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_WS_URL=wss://your-backend.onrender.com/ws
   ```

6. Deploy!

---

### Option 4: Docker on VPS (DigitalOcean, Linode, etc.)

1. Create a VPS instance
2. SSH into your server
3. Clone repository:
   ```bash
   git clone https://github.com/yourusername/status-page-app.git
   cd status-page-app
   ```

4. Set environment variables:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit both .env files with production values
   ```

5. Deploy with Docker:
   ```bash
   docker-compose up -d --build
   ```

6. Set up nginx reverse proxy (optional):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:80;
       }

       location /api {
           proxy_pass http://localhost:3000;
       }

       location /ws {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

---

### Option 5: Heroku

#### Backend

```bash
cd backend
heroku create status-page-backend
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production
git push heroku main
```

#### Frontend

```bash
cd frontend
heroku create status-page-frontend
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static
# Create static.json:
# {
#   "root": "dist",
#   "routes": {
#     "/**": "index.html"
#   }
# }
git push heroku main
```

---

## Post-Deployment Checklist

- [ ] Backend health check: `https://your-backend/api/health`
- [ ] Frontend loads correctly
- [ ] WebSocket connects (check browser console)
- [ ] Can login with default credentials
- [ ] Can create services
- [ ] Can create incidents
- [ ] Real-time updates work
- [ ] Organization-specific status pages work
- [ ] Change default passwords!

---

## Production Database

**Important**: SQLite is for development only. For production, use PostgreSQL.

### Migrate to PostgreSQL

1. Set up PostgreSQL database (ElephantSQL, Supabase, or Railway)

2. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Update DATABASE_URL:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   ```

4. Run migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

---

## Security for Production

1. **Change JWT Secret**: Use `openssl rand -base64 32`
2. **Change Default Passwords**: Update all seed data
3. **Enable HTTPS**: Use Let's Encrypt or platform SSL
4. **Set CORS Origins**: Restrict to your frontend domain
5. **Rate Limiting**: Add rate limiting middleware
6. **Database Backups**: Set up automated backups
7. **Environment Variables**: Never commit .env files
8. **Update Dependencies**: Regularly run `npm audit fix`

---

## Monitoring

- Use platform monitoring tools (Render, Railway, Vercel dashboards)
- Set up error tracking (Sentry, LogRocket)
- Monitor WebSocket connections
- Track API response times
- Set up uptime monitoring (UptimeRobot, Pingdom)

---

## Troubleshooting Deployment

### Backend Issues

**Problem**: Database not found
- **Solution**: Run `npx prisma migrate deploy` or `npx prisma db push`

**Problem**: JWT errors
- **Solution**: Verify JWT_SECRET is set in environment variables

**Problem**: CORS errors
- **Solution**: Add frontend URL to CORS whitelist in `backend/src/app.ts`

### Frontend Issues

**Problem**: API calls fail
- **Solution**: Check VITE_API_URL is correct and includes `/api`

**Problem**: WebSocket won't connect
- **Solution**: Check VITE_WS_URL uses `wss://` (not `ws://`) for HTTPS

**Problem**: Build fails
- **Solution**: Ensure Node version is 20+ on deployment platform

---

## GitHub Repository Setup

1. Create new repository on GitHub
2. Add remote:
   ```bash
   git remote add origin https://github.com/yourusername/status-page-app.git
   git push -u origin main
   ```

3. Add repository description and topics:
   - status-page
   - incident-management
   - typescript
   - react
   - nodejs
   - websocket
   - multi-tenant

4. Enable GitHub Actions (optional) for CI/CD

---

## Scaling Tips

- Use Redis for WebSocket pub/sub in multi-instance deployments
- Implement caching for frequently accessed data
- Use CDN for frontend assets
- Consider serverless functions for API endpoints
- Implement database connection pooling
- Use load balancers for high traffic

---

Happy Deploying! 🚀

