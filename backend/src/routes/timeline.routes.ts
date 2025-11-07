import { Router } from 'express';
import prisma from '../prisma/client';

const router = Router();

// Get timeline of all status changes and incidents (public)
router.get('/', async (req, res) => {
  try {
    const { org, days = 7 } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));
    
    const whereClause: any = {
      createdAt: {
        gte: daysAgo,
      },
    };
    
    if (org) {
      const organization = await prisma.organization.findUnique({
        where: { slug: org as string },
      });
      if (organization) {
        whereClause.organizationId = organization.id;
      }
    }
    
    // Get all incidents with their updates
    const incidents = await prisma.incident.findMany({
      where: whereClause,
      include: {
        affectedServices: {
          include: {
            service: true,
          },
        },
        updates: {
          include: {
            createdBy: {
              select: {
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Build timeline entries
    const timeline: any[] = [];
    
    // Add incident events
    for (const incident of incidents) {
      // Incident created
      timeline.push({
        id: `incident-created-${incident.id}`,
        type: 'incident_created',
        timestamp: incident.createdAt,
        title: `Incident: ${incident.title}`,
        description: incident.description,
        severity: (incident as any).severity || 'medium',
        affectedServices: incident.affectedServices.map(as => as.service.name),
        createdBy: incident.createdBy.name,
      });
      
      // Incident updates
      for (const update of incident.updates) {
        timeline.push({
          id: `update-${update.id}`,
          type: 'incident_update',
          timestamp: update.createdAt,
          title: `Update: ${incident.title}`,
          description: update.message,
          status: update.status,
          createdBy: update.createdBy.name,
        });
      }
      
      // Incident resolved
      if (incident.resolvedAt) {
        timeline.push({
          id: `incident-resolved-${incident.id}`,
          type: 'incident_resolved',
          timestamp: incident.resolvedAt,
          title: `Resolved: ${incident.title}`,
          description: 'Incident has been resolved',
          affectedServices: incident.affectedServices.map(as => as.service.name),
        });
      }
    }
    
    // Sort by timestamp (newest first)
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json(timeline);
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

