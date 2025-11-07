# Access Credentials

## 🌐 Application URLs

### Live Application
- **Frontend (Main App)**: `[REPLACE WITH YOUR RENDER FRONTEND URL]`
- **Backend API**: `[REPLACE WITH YOUR RENDER BACKEND URL]`
- **GitHub Repository**: https://github.com/avinashp07/status-page-app

### Public Status Pages
- **Generic Home**: `[REPLACE WITH YOUR FRONTEND URL]/`
- **Plivo Status Page**: `[REPLACE WITH YOUR FRONTEND URL]/plivo-inc`

### Example URLs (Replace with yours):
```
Frontend: https://status-page-frontend.onrender.com
Backend: https://status-page-backend.onrender.com
Status Page: https://status-page-frontend.onrender.com/plivo-inc
```

---

## 👤 Login Credentials

### Super Admin (Platform Administrator)
```
Email: platform@admin.com
Password: superadmin123
Role: Super Admin

Access:
- ✅ Create and manage ALL organizations
- ✅ Platform-level administration
- ❌ Cannot access individual organization services/incidents
- Use Case: Platform management, create new organizations

Login URL: https://your-frontend-url/login
Dashboard: https://your-frontend-url/admin
```

### Organization Admin (Plivo Inc)
```
Email: admin@plivo.com
Password: admin123
Role: Admin

Access:
- ✅ Full access within Plivo Inc organization
- ✅ Manage services, incidents, teams
- ✅ Create and manage users
- ✅ View organization details
- Use Case: Day-to-day organization management

Login URL: https://your-frontend-url/login
Dashboard: https://your-frontend-url/admin
Status Page: https://your-frontend-url/plivo-inc
```

### Regular User (Plivo Inc)
```
Email: user@plivo.com
Password: user123
Role: User

Access:
- ✅ Manage incidents (default permission)
- ✅ View services and teams
- ❌ Cannot manage services (unless granted)
- ❌ Cannot manage users (unless granted)
- Note: Permissions can be customized by org admin

Login URL: https://your-frontend-url/login
Dashboard: https://your-frontend-url/admin
```

---

## 🧪 Test Scenarios

### Scenario 1: View Public Status Page (No Login Required)
1. Visit: `https://your-frontend-url/plivo-inc`
2. You should see:
   - All services and their status
   - Active incidents
   - Recent resolved incidents (>5 min duration)
   - Real-time updates

### Scenario 2: Login as Organization Admin
1. Visit: `https://your-frontend-url/login`
2. Login: `admin@plivo.com` / `admin123`
3. You'll be redirected to Admin Dashboard
4. Test features:
   - ✅ Create a new service
   - ✅ Create an incident
   - ✅ Create a new user
   - ✅ Create a team
   - ✅ Add incident updates

### Scenario 3: Real-time Updates
1. Open status page in one browser tab
2. Open admin dashboard in another tab (logged in)
3. Create or update a service
4. Watch the status page update in real-time (no refresh needed)

### Scenario 4: Super Admin - Manage Organizations
1. Login: `platform@admin.com` / `superadmin123`
2. You'll see "Organizations" tab only
3. View all organizations
4. Create a new organization
5. Note: Super admin cannot access org-specific services/incidents

### Scenario 5: Multi-Tenant Isolation
1. Create a second organization (as super admin)
2. Create an admin user for that organization
3. Login as that admin
4. Verify they only see their organization's data

---

## 🔧 API Testing (Optional)

### Health Check
```bash
curl https://your-backend-url/api/health
```

### Login via API
```bash
curl -X POST https://your-backend-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@plivo.com","password":"admin123"}'
```

### Get Services (Public)
```bash
curl https://your-backend-url/api/services?org=plivo-inc
```

### Get Services (Authenticated)
```bash
curl https://your-backend-url/api/services \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📋 Features to Demonstrate

### ✅ Core Features
- [x] Multi-tenant architecture
- [x] Organization-specific status pages (`/:org-slug`)
- [x] Real-time WebSocket updates
- [x] JWT authentication
- [x] Role-based access control (Super Admin, Admin, User)
- [x] Service management (CRUD)
- [x] Incident management with timeline
- [x] Team management
- [x] User management (admin can create users)
- [x] Incident duration filtering (>5 min shown publicly)
- [x] Responsive UI with modern design

### ✅ Security Features
- [x] JWT token authentication
- [x] Role-based permissions
- [x] Organization data isolation
- [x] Password hashing (bcrypt)
- [x] Protected routes

### ✅ Technical Features
- [x] TypeScript (full-stack)
- [x] Prisma ORM
- [x] WebSocket real-time updates
- [x] Docker deployment ready
- [x] RESTful API design

---

## 🚨 Important Security Notes

### Before Sharing in Production
1. **Change all default passwords immediately**
2. **Generate a secure JWT secret**: `openssl rand -base64 32`
3. **Update credentials in this document after changing**
4. **Consider using environment-specific passwords**
5. **Enable HTTPS (Render provides this automatically)**

### For Demo/Testing
- Current credentials are fine
- Clearly mark as "demo credentials"
- Note that data can be reset anytime

---

## 📊 System Status

### Database
- **Type**: SQLite (development) / PostgreSQL (recommended for production)
- **Seeded Data**: 
  - 1 Super Admin
  - 1 Organization (Plivo Inc)
  - 2 Organization users (Admin + User)
  - 4 Services (Website, API, Database, Payment Gateway)
  - 3 Sample Incidents
  - 2 Teams (Administrators, Operations)

### Performance
- **Backend**: Node.js with Express
- **Frontend**: React with Vite
- **Real-time**: WebSocket connections
- **Response Time**: <100ms for most API calls

---

## 🔗 Quick Links

- **Repository**: https://github.com/avinashp07/status-page-app
- **README**: Full documentation and API reference
- **DEPLOYMENT.md**: Deployment guide for multiple platforms
- **Issues**: Report bugs or request features on GitHub

---

## 📞 Support

For testing or access issues:
1. Check browser console for errors
2. Verify backend health: `https://your-backend-url/api/health`
3. Check WebSocket connection in Network tab
4. Review Render logs if deployed there

---

**Last Updated**: [Will be auto-updated on deployment]
**Version**: 1.0.0

