# Status Page Application

A production-ready, multi-tenant status page application similar to StatusPage.io or Cachet. Built with modern web technologies for real-time system status monitoring and incident management.

## 🌟 Features

### Core Functionality
- **Multi-Tenant Architecture**: Complete organization isolation with dedicated status pages per organization
- **Real-time Updates**: WebSocket-powered live status updates across all clients
- **Organization-Specific Status Pages**: Each organization gets a branded page at `/:org-slug`
- **Admin Dashboard**: Comprehensive management interface with role-based access
- **Service Management**: CRUD operations for monitoring services with status tracking
- **Incident Management**: Create, update, and resolve incidents with duration-based filtering
- **Incident Update Timeline**: Track incident progression with chronological history
- **Team Management**: Create teams and manage members with role assignments
- **User Management**: Admins can create and manage users within their organization
- **Super Admin Panel**: Platform-level organization management

### Security & Access Control
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Permissions**: Three-tier role system (Super Admin, Admin, User)
- **Granular Permissions**: Fine-grained access control for services, incidents, and users
- **Organization Data Isolation**: Complete data separation between organizations

### Technical Highlights
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: SQLite with Prisma ORM
- **Frontend**: React, Vite, TypeScript, TailwindCSS, Shadcn/UI
- **Real-time**: WebSocket (ws library)
- **Deployment**: Docker & Docker Compose ready

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [User Roles](#-user-roles)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [License](#-license)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- npm or yarn
- Docker & Docker Compose (optional, for containerized deployment)

### Option 1: Local Development (Recommended)

#### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Push database schema
npm run prisma:push

# Seed database with demo data
npm run prisma:seed

# Start development server
npm run dev
```

The backend will run at `http://localhost:3000`

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run at `http://localhost:5173`

### Option 2: Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

Services:
- Frontend: `http://localhost`
- Backend API: `http://localhost:3000`
- WebSocket: `ws://localhost:3000/ws`

---

## 🏗️ Architecture

### Project Structure

```
status-page-app/
├── backend/
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.routes.ts
│   │   │   ├── service.routes.ts
│   │   │   ├── incident.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── team.routes.ts
│   │   │   ├── organization.routes.ts
│   │   │   ├── incidentUpdate.routes.ts
│   │   │   └── timeline.routes.ts
│   │   ├── middleware/        # Auth & permissions
│   │   ├── websocket/         # WebSocket server
│   │   ├── utils/             # JWT utilities
│   │   ├── prisma/            # Prisma client
│   │   ├── app.ts             # Express configuration
│   │   └── index.ts           # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Database seeding
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/             # React pages
│   │   │   ├── Home.tsx       # Generic home page
│   │   │   ├── OrgStatus.tsx  # Organization status page
│   │   │   ├── Login.tsx      # Login page
│   │   │   └── Admin.tsx      # Admin dashboard
│   │   ├── components/        # Shadcn UI components
│   │   ├── context/           # Auth context
│   │   ├── hooks/             # WebSocket hooks
│   │   ├── lib/               # API client & utilities
│   │   └── App.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

### Database Schema

- **Organizations**: Multi-tenant isolation
- **Users**: Authentication and permissions
- **Services**: Monitored system components
- **Incidents**: System issues and outages
- **Teams**: Team collaboration
- **TeamMembers**: Team membership
- **IncidentUpdates**: Incident timeline
- **IncidentService**: Many-to-many incidents↔services

---

## 👥 User Roles

### Super Admin (Platform Administrator)
- **Email**: `platform@admin.com`
- **Password**: `superadmin123`
- **Permissions**:
  - Create and manage ALL organizations
  - Platform-level administration
  - Not tied to any specific organization
  - Cannot manage individual organization's services/incidents

### Organization Admin (e.g., Plivo Inc Admin)
- **Email**: `admin@plivo.com`
- **Password**: `admin123`
- **Permissions**:
  - Full access within their organization
  - Manage services, incidents, teams
  - Create and manage users
  - View organization details

### Regular User (e.g., Plivo Inc User)
- **Email**: `user@plivo.com`
- **Password**: `user123`
- **Permissions**:
  - Customizable by org admin
  - Default: Manage incidents only
  - Can be added to teams

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### POST /api/auth/login
Authenticate and receive JWT token.

**Request:**
```json
{
  "email": "admin@plivo.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "admin@plivo.com",
    "name": "Admin User",
    "role": "admin",
    "organization": {
      "id": "uuid",
      "name": "Plivo Inc",
      "slug": "plivo-inc"
    },
    "permissions": {
      "canManageServices": true,
      "canManageIncidents": true,
      "canManageUsers": true
    }
  }
}
```

### Service Endpoints

#### GET /api/services?org=:orgSlug
Get all services for an organization (public).

**Example:**
```bash
curl http://localhost:3000/api/services?org=plivo-inc
```

#### POST /api/services
Create a new service (requires `canManageServices` permission).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "name": "API Service",
  "description": "REST API for integrations",
  "status": "Operational"
}
```

### Incident Endpoints

#### GET /api/incidents/public?org=:orgSlug
Get prolonged incidents (>5 minutes) and active incidents (public).

#### POST /api/incidents
Create a new incident (requires `canManageIncidents` permission).

**Request:**
```json
{
  "title": "Database Connection Issues",
  "description": "Unable to connect to primary database",
  "status": "Active",
  "affectedServiceIds": ["service-uuid-1", "service-uuid-2"]
}
```

### User Management Endpoints

#### GET /api/users
Get all users in the organization (admin only).

#### POST /api/users
Create a new user (admin only).

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@plivo.com",
  "password": "securepass123",
  "role": "user",
  "canManageServices": false,
  "canManageIncidents": true,
  "canManageUsers": false
}
```

### Organization Management Endpoints

#### GET /api/organizations
Get all organizations (super admin only).

#### POST /api/organizations
Create a new organization (super admin only).

**Request:**
```json
{
  "name": "Acme Corp",
  "slug": "acme-corp",
  "description": "Acme Corporation"
}
```

#### DELETE /api/organizations/:id
Delete an organization (super admin only).

### WebSocket Events

Connect to: `ws://localhost:3000/ws`

**Events:**
- `service_created`, `service_updated`, `service_deleted`
- `incident_created`, `incident_updated`, `incident_deleted`

---

## 🚢 Deployment

### Environment Setup

#### Backend `.env`
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3000
NODE_ENV=production
```

#### Frontend `.env`
```env
VITE_API_URL=https://your-backend-url.com/api
VITE_WS_URL=wss://your-backend-url.com/ws
```

### Docker Production Deployment

```bash
# Build for production
docker-compose -f docker-compose.yml up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Production Build

#### Backend
```bash
cd backend
npm install
npm run build
npm start
```

#### Frontend
```bash
cd frontend
npm install
npm run build
# Serve the dist/ folder with nginx or any static server
```

---

## 🔐 Security Best Practices

1. **Change default passwords** in production
2. **Use strong JWT secrets** (generate with `openssl rand -base64 32`)
3. **Enable HTTPS** for production deployments
4. **Use secure WebSocket** (wss://) in production
5. **Set proper CORS origins** in backend
6. **Use PostgreSQL** for production (SQLite is for development)
7. **Enable rate limiting** for API endpoints
8. **Regular security audits** and dependency updates

---

## 🛠️ Development Commands

### Backend
```bash
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript
npm start                # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:push      # Push schema to database
npm run prisma:seed      # Seed database with demo data
npm run prisma:studio    # Open Prisma Studio GUI
```

### Frontend
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint code
```

---

## 🎯 Usage Guide

### 1. Access the Application

- **Home**: http://localhost:5173/
- **Plivo Status Page**: http://localhost:5173/plivo-inc
- **Admin Dashboard**: http://localhost:5173/admin
- **Login**: http://localhost:5173/login

### 2. Login as Organization Admin

```
Email: admin@plivo.com
Password: admin123
```

### 3. Create a Service

1. Navigate to Admin Dashboard
2. Go to "Services" tab
3. Click "Add Service"
4. Fill in service details
5. Service appears on public status page

### 4. Create an Incident

1. Go to "Incidents" tab
2. Click "Create Incident"
3. Select affected services
4. Add incident updates
5. Incident appears on public page (if >5 min or active)

### 5. Create Users

1. Go to "Users" tab (admin only)
2. Click "Create User"
3. Fill in user details and assign permissions
4. User can now login

### 6. Manage Organizations (Super Admin)

1. Login as `platform@admin.com`
2. Access "Organizations" tab
3. Create new organizations
4. View all organizations and their stats

---

## 📊 Key Design Decisions

### Prolonged Incident Filtering
- Public status page only shows:
  - Currently active incidents, OR
  - Resolved incidents that lasted > 5 minutes
- Prevents short-lived blips from cluttering public page
- Admin dashboard shows ALL incidents

### Multi-Tenancy
- Each organization has isolated data
- Services, incidents, teams scoped by `organizationId`
- Super admins manage organizations, not org-specific data
- Organization admins manage their organization's resources

### Permission Architecture
- Super Admin: Platform-level management only
- Admin: Full access within organization
- User: Customizable permissions per user

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Regenerate Prisma client
cd backend && npm run prisma:generate

# Check database
npm run prisma:studio
```

### Frontend won't start
```bash
# Check if port 5173 is in use
lsof -i :5173

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### WebSocket not connecting
- Check CORS settings in backend
- Verify WebSocket URL in frontend `.env`
- Ensure both servers are running

---

## 📄 License

MIT License - Feel free to use for your own projects.

---

## 🤝 Contributing

This is a demonstration project showcasing modern web development practices including:
- TypeScript full-stack development
- Multi-tenant architecture
- Real-time communication
- JWT authentication
- Role-based access control
- Docker containerization

For production use, consider adding:
- Comprehensive test coverage
- Rate limiting
- Email notifications
- Enhanced logging and monitoring
- PostgreSQL for production
- CI/CD pipelines
- API documentation (Swagger/OpenAPI)

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Review backend logs

---

Built with ❤️ using modern web technologies
