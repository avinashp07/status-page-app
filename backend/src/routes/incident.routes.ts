import { Router } from 'express';
import prisma from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { broadcastIncidentUpdate, broadcastServiceUpdate } from '../websocket/server';

const router = Router();

// Helper function to calculate duration in minutes
const calculateDuration = (startedAt: Date, resolvedAt: Date | null): number => {
  const endTime = resolvedAt || new Date();
  return (endTime.getTime() - startedAt.getTime()) / (1000 * 60);
};

// Get all incidents (public - only prolonged ones)
router.get('/public', async (req, res) => {
  try {
    const { org } = req.query;
    
    const whereClause: any = {};
    if (org) {
      const organization = await prisma.organization.findUnique({
        where: { slug: org as string },
      });
      if (organization) {
        whereClause.organizationId = organization.id;
      }
    }
    
    const incidents = await prisma.incident.findMany({
      where: whereClause,
      include: {
        affectedServices: {
          include: {
            service: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    // Filter to only show active or prolonged incidents (> 5 minutes)
    const filteredIncidents = incidents.filter((incident) => {
      if (incident.status === 'Active') return true;
      
      const duration = calculateDuration(incident.startedAt, incident.resolvedAt);
      return duration > 5;
    });

    res.json(filteredIncidents);
  } catch (error) {
    console.error('Get public incidents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all incidents (authenticated - all incidents)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      include: {
        affectedServices: {
          include: {
            service: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    res.json(incidents);
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single incident
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        affectedServices: {
          include: {
            service: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json(incident);
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create incident (requires permission)
router.post('/', authenticate, requirePermission('canManageIncidents'), async (req: AuthRequest, res) => {
  try {
    const { title, description, affectedServiceIds, status, severity } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return res.status(400).json({ error: 'User not assigned to an organization' });
    }

    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        status: status || 'Active',
        severity: severity || 'medium',
        createdById: req.user.userId,
        organizationId: user.organizationId,
        affectedServices: {
          create: (affectedServiceIds || []).map((serviceId: string) => ({
            serviceId,
          })),
        },
      },
      include: {
        affectedServices: {
          include: {
            service: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Auto-update affected service statuses based on incident severity
    if (incident.status === 'Active' && affectedServiceIds && affectedServiceIds.length > 0) {
      // Map severity to service status
      const severityToStatus: { [key: string]: string } = {
        minor: 'Degraded Performance',
        medium: 'Partial Outage',
        major: 'Major Outage',
      };
      
      const newStatus = severityToStatus[incident.severity] || 'Partial Outage';
      
      for (const serviceId of affectedServiceIds) {
        await prisma.service.update({
          where: { id: serviceId },
          data: { status: newStatus },
        });
        
        // Broadcast service update
        const updatedService = await prisma.service.findUnique({
          where: { id: serviceId },
        });
        
        if (updatedService) {
          broadcastServiceUpdate({
            type: 'service_updated',
            service: updatedService,
          });
        }
      }
    }

    // Broadcast to WebSocket clients
    broadcastIncidentUpdate({
      type: 'incident_created',
      incident,
    });

    res.status(201).json(incident);
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update incident (requires permission)
router.put('/:id', authenticate, requirePermission('canManageIncidents'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, affectedServiceIds } = req.body;

    // If status is being set to "Resolved", set resolvedAt timestamp
    const resolvedAt = status === 'Resolved' ? new Date() : undefined;

    // Get current incident to check affected services before update
    const currentIncident = await prisma.incident.findUnique({
      where: { id },
      include: {
        affectedServices: {
          include: {
            service: true,
          },
        },
      },
    });

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(resolvedAt && { resolvedAt }),
        ...(affectedServiceIds && {
          affectedServices: {
            deleteMany: {},
            create: affectedServiceIds.map((serviceId: string) => ({
              serviceId,
            })),
          },
        }),
      },
      include: {
        affectedServices: {
          include: {
            service: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If incident is being resolved, check if we should restore affected services to "Operational"
    if (status === 'Resolved' && currentIncident && currentIncident.affectedServices.length > 0) {
      for (const affectedService of currentIncident.affectedServices) {
        // Check if there are any other ACTIVE incidents for this service
        const otherActiveIncidents = await prisma.incident.findMany({
          where: {
            status: 'Active',
            id: { not: incident.id },
            affectedServices: {
              some: {
                serviceId: affectedService.service.id,
              },
            },
          },
        });

        // If no other active incidents, restore to Operational
        if (otherActiveIncidents.length === 0) {
          await prisma.service.update({
            where: { id: affectedService.service.id },
            data: { status: 'Operational' },
          });

          // Broadcast service update
          const updatedService = await prisma.service.findUnique({
            where: { id: affectedService.service.id },
          });

          if (updatedService) {
            broadcastServiceUpdate({
              type: 'service_updated',
              service: updatedService,
            });
          }
        }
      }
    }

    // Broadcast to WebSocket clients
    broadcastIncidentUpdate({
      type: 'incident_updated',
      incident,
    });

    res.json(incident);
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete incident (requires permission)
router.delete('/:id', authenticate, requirePermission('canManageIncidents'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Get incident before deleting to check affected services
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        affectedServices: {
          include: {
            service: true,
          },
        },
      },
    });

    // Delete the incident
    await prisma.incident.delete({
      where: { id },
    });

    // If incident was active, restore affected services if no other active incidents
    if (incident && incident.status === 'Active' && incident.affectedServices.length > 0) {
      for (const affectedService of incident.affectedServices) {
        // Check for other active incidents
        const otherActiveIncidents = await prisma.incident.findMany({
          where: {
            status: 'Active',
            affectedServices: {
              some: {
                serviceId: affectedService.service.id,
              },
            },
          },
        });

        // If no other active incidents, restore to Operational
        if (otherActiveIncidents.length === 0) {
          await prisma.service.update({
            where: { id: affectedService.service.id },
            data: { status: 'Operational' },
          });

          // Broadcast service update
          const updatedService = await prisma.service.findUnique({
            where: { id: affectedService.service.id },
          });

          if (updatedService) {
            broadcastServiceUpdate({
              type: 'service_updated',
              service: updatedService,
            });
          }
        }
      }
    }

    // Broadcast to WebSocket clients
    broadcastIncidentUpdate({
      type: 'incident_deleted',
      incidentId: id,
    });

    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

