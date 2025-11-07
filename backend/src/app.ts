import express from 'express';
import cors from 'cors';
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;

