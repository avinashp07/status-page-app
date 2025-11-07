# Testing Checklist

Use this checklist to verify all features are working after deployment.

## ✅ Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed on Render
- [ ] Frontend deployed on Render
- [ ] Environment variables configured correctly
- [ ] Database seeded with demo data
- [ ] Backend health check passes
- [ ] Frontend loads without errors

---

## 🧪 Functional Testing

### Public Access (No Authentication)

#### Home Page
- [ ] Generic home page loads at `/`
- [ ] Navigation links work
- [ ] "Login" button visible
- [ ] Link to Plivo status page works

#### Organization Status Page (`/plivo-inc`)
- [ ] Page loads successfully
- [ ] Shows "Plivo Inc" as organization name
- [ ] All 4 services displayed (Website, API, Database, Payment Gateway)
- [ ] Service statuses shown correctly
- [ ] "All Systems Operational" status shows
- [ ] Login button visible
- [ ] Real-time updates indicator present

---

### Authentication

#### Login Page (`/login`)
- [ ] Login page loads
- [ ] Email and password fields present
- [ ] No "Sign Up" link visible (admins create users)
- [ ] "Back to home" link works

#### Super Admin Login
- [ ] Login with `platform@admin.com` / `superadmin123` succeeds
- [ ] Redirects to `/admin` dashboard
- [ ] Shows "Organizations" tab ONLY (no Services/Incidents/Teams/Users)
- [ ] Can view all organizations
- [ ] Status Page button navigates to home (no specific org)

#### Organization Admin Login
- [ ] Login with `admin@plivo.com` / `admin123` succeeds
- [ ] Redirects to `/admin` dashboard
- [ ] Shows all tabs: Services, Incidents, Teams, Users, Organization
- [ ] Displays organization name in header
- [ ] Status Page button navigates to `/plivo-inc`

#### Regular User Login
- [ ] Login with `user@plivo.com` / `user123` succeeds
- [ ] Shows limited tabs based on permissions (Services, Incidents, Teams)
- [ ] Users tab NOT visible (no permission)
- [ ] Can access assigned features only

---

### Super Admin Features

#### Organizations Management
- [ ] Can view all organizations list
- [ ] See organization stats (users, services, incidents count)
- [ ] Create new organization button works
- [ ] Can fill in org details (name, slug, description)
- [ ] New organization created successfully
- [ ] Cannot access Services/Incidents/Teams tabs

---

### Organization Admin Features

#### Services Management
- [ ] Services tab displays all services
- [ ] "Add Service" button visible
- [ ] Can create new service with name, description, status
- [ ] Service appears in list immediately
- [ ] Can edit existing service
- [ ] Can delete service (with confirmation)
- [ ] Service status changes (Operational, Degraded, Partial Outage, Major Outage)

#### Incidents Management
- [ ] Incidents tab shows all incidents
- [ ] "Create Incident" button visible
- [ ] Can create incident with title, description, affected services
- [ ] Can select multiple affected services
- [ ] Can set incident severity (minor, medium, major)
- [ ] Incident appears in list
- [ ] Can add incident updates
- [ ] Update timeline shows chronologically
- [ ] Can resolve incident
- [ ] Resolved timestamp recorded

#### Teams Management
- [ ] Teams tab shows all teams
- [ ] "Create Team" button visible
- [ ] Can create team with name and description
- [ ] Can add members to team from user list
- [ ] Can assign roles (admin, member)
- [ ] Can remove members from team
- [ ] Team member count updates
- [ ] Can delete entire team

#### Users Management
- [ ] Users tab visible (requires canManageUsers permission)
- [ ] "Create User" button visible
- [ ] Can create new user with:
  - [ ] Full name
  - [ ] Email address
  - [ ] Password (min 8 characters)
  - [ ] Role (user, admin)
  - [ ] Permissions (Services, Incidents, Users)
- [ ] New user appears in list immediately
- [ ] Can edit existing user permissions
- [ ] Can delete users (except self)
- [ ] Super admin NOT visible in users list
- [ ] Shows team memberships for each user

#### Organization View
- [ ] Shows current organization details
- [ ] Organization name and slug displayed
- [ ] Can view but not edit (unless super admin)

---

### Real-time Features

#### WebSocket Connection
- [ ] Open browser console
- [ ] Check Network tab → WS
- [ ] WebSocket connection established
- [ ] No connection errors

#### Real-time Service Updates
- [ ] Open status page in one browser tab
- [ ] Open admin dashboard in another tab (logged in)
- [ ] Create a new service in admin
- [ ] Service appears on status page without refresh
- [ ] Update service status
- [ ] Status updates on status page immediately

#### Real-time Incident Updates
- [ ] Create incident in admin
- [ ] Incident appears on status page (if active)
- [ ] Add incident update
- [ ] Update appears in timeline without refresh
- [ ] Resolve incident
- [ ] Status changes to resolved immediately

---

### Data Isolation (Multi-Tenancy)

#### Organization Isolation
- [ ] Login as admin of Org A
- [ ] Create services in Org A
- [ ] Logout
- [ ] Login as admin of Org B
- [ ] Verify cannot see Org A's services
- [ ] Create services in Org B
- [ ] Visit `/org-a-slug` status page - only Org A data
- [ ] Visit `/org-b-slug` status page - only Org B data

#### User Isolation
- [ ] Super admin not visible in organization user lists
- [ ] Organization users only see their org's data
- [ ] Services scoped to organization
- [ ] Incidents scoped to organization
- [ ] Teams scoped to organization

---

### Incident Duration Filtering

#### Public Status Page Shows:
- [ ] All active incidents (regardless of duration)
- [ ] Resolved incidents lasting > 5 minutes
- [ ] Does NOT show resolved incidents < 5 minutes

#### Admin Dashboard Shows:
- [ ] ALL incidents (including short-duration resolved ones)
- [ ] Duration information
- [ ] Complete incident history

#### Test This:
- [ ] Create incident
- [ ] Immediately resolve it (< 5 min)
- [ ] Check public status page - should NOT appear
- [ ] Check admin dashboard - should appear
- [ ] Create another incident
- [ ] Wait 6+ minutes or manually set old timestamp
- [ ] Resolve it
- [ ] Check public status page - should appear
- [ ] Shows as "Recent Resolved Incidents"

---

### Permission System

#### Regular User with No Permissions
- [ ] Cannot see Users tab
- [ ] Cannot see "Add Service" button
- [ ] Cannot see "Create Incident" button
- [ ] Can only view data

#### Regular User with Incidents Permission
- [ ] Can create incidents
- [ ] Can edit incidents
- [ ] Can add incident updates
- [ ] Cannot manage services
- [ ] Cannot manage users

#### Admin User
- [ ] All permissions enabled by default
- [ ] Can access all tabs
- [ ] Can perform all operations

---

### Navigation & UI

#### Navigation Flow
- [ ] Home → Login → Admin Dashboard
- [ ] Admin Dashboard → Status Page → Home
- [ ] Logout redirects to home
- [ ] Direct URL access works (e.g., `/plivo-inc`)
- [ ] Invalid org slug shows 404 page
- [ ] Protected routes redirect to login

#### Responsive Design
- [ ] Mobile view works
- [ ] Tablet view works
- [ ] Desktop view optimal
- [ ] Navigation menu accessible on all devices

#### Visual Design
- [ ] Color-coded service statuses
  - [ ] Green = Operational
  - [ ] Yellow = Degraded Performance
  - [ ] Orange = Partial Outage
  - [ ] Red = Major Outage
- [ ] Icons display correctly
- [ ] Cards and layouts render properly
- [ ] Forms are user-friendly
- [ ] Buttons have hover states

---

### Error Handling

#### Frontend Errors
- [ ] Invalid login shows error message
- [ ] Required field validation works
- [ ] API errors display user-friendly messages
- [ ] Network errors handled gracefully
- [ ] 404 pages for invalid routes

#### Backend Errors
- [ ] Duplicate email shows error when creating user
- [ ] Invalid credentials rejected
- [ ] Unauthorized access blocked
- [ ] Malformed requests return 400 errors
- [ ] Server errors return 500 with message

---

### Performance

#### Load Times
- [ ] Home page loads < 2 seconds
- [ ] Status page loads < 2 seconds
- [ ] Admin dashboard loads < 3 seconds
- [ ] API responses < 500ms
- [ ] WebSocket connects < 1 second

#### Data Handling
- [ ] Handles 10+ services without issues
- [ ] Handles 20+ incidents without slowdown
- [ ] Real-time updates don't cause lag
- [ ] Large team lists render quickly

---

### Security

#### Authentication
- [ ] Cannot access admin without login
- [ ] JWT token expires appropriately
- [ ] Token stored securely (localStorage)
- [ ] Logout clears token

#### Authorization
- [ ] Users cannot access features without permissions
- [ ] Organization data properly isolated
- [ ] Super admin cannot access org-specific data
- [ ] Regular users cannot access admin features

#### Data Protection
- [ ] Passwords not visible in responses
- [ ] JWT secret not exposed
- [ ] CORS configured correctly
- [ ] HTTPS enabled (Render default)

---

## 🐛 Known Issues to Check

- [ ] WebSocket reconnection on network interruption
- [ ] Database connection pooling under load
- [ ] Memory usage over extended periods
- [ ] Concurrent user editing conflicts
- [ ] Large file uploads (if implemented)

---

## 📊 API Testing (Optional)

### Health Check
```bash
curl https://your-backend-url/api/health
```
Expected: `{"status":"healthy","uptime":...}`

### Public Services
```bash
curl https://your-backend-url/api/services?org=plivo-inc
```
Expected: Array of 4 services

### Authentication
```bash
curl -X POST https://your-backend-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@plivo.com","password":"admin123"}'
```
Expected: `{"token":"...","user":{...}}`

---

## ✅ Post-Testing

- [ ] All critical features working
- [ ] No console errors
- [ ] No network errors
- [ ] Real-time updates functioning
- [ ] All roles tested
- [ ] Multi-tenancy verified
- [ ] Security checks passed
- [ ] Performance acceptable

---

## 📝 Notes

**Testing Environment:**
- Browser: _______________
- Date: _______________
- Tester: _______________

**Issues Found:**
1. _______________
2. _______________
3. _______________

**Overall Status:** ⭐⭐⭐⭐⭐ (Rate 1-5)

---

**Ready for Production:** [ ] Yes [ ] No

**Recommendations:**
- _______________
- _______________

