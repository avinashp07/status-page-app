import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.routes';
import serviceRoutes from './routes/service.routes';
import incidentRoutes from './routes/incident.routes';
import userRoutes from './routes/user.routes';
import organizationRoutes from './routes/organization.routes';
import teamRoutes from './routes/team.routes';
import incidentUpdateRoutes from './routes/incident-update.routes';
import timelineRoutes from './routes/timeline.routes';
import prisma from './prisma/client';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend build (if exists)
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [totalServices, totalIncidents, totalUsers] = await Promise.all([
      prisma.service.count(),
      prisma.incident.count(),
      prisma.user.count(),
    ]);

    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      totalServices,
      totalIncidents,
      totalUsers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'Database connection failed',
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/incident-updates', incidentUpdateRoutes);
app.use('/api/timeline', timelineRoutes);

// Serve frontend for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(__dirname, '..', 'public', 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        // If no frontend built, show API-only message
        res.status(200).json({ 
          message: 'API is running. Frontend not built yet.',
          health: '/api/health'
        });
      }
    });
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;

