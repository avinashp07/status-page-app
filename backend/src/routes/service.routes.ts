import { Router } from 'express';
import prisma from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { broadcastServiceUpdate } from '../websocket/server';

const router = Router();

// Get all services (public) - filtered by organization if org slug provided
router.get('/', async (req, res) => {
  try {
    const { org } = req.query;
    
    let services;
    if (org) {
      // Get services for specific organization
      const organization = await prisma.organization.findUnique({
        where: { slug: org as string },
      });
      
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      services = await prisma.service.findMany({
        where: { organizationId: organization.id },
        orderBy: { createdAt: 'asc' },
      });
    } else {
      // For backward compatibility, return services from first organization
      services = await prisma.service.findMany({
        orderBy: { createdAt: 'asc' },
      });
    }

    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single service (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        incidents: {
          include: {
            incident: true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create service (requires permission)
router.post('/', authenticate, requirePermission('canManageServices'), async (req: AuthRequest, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
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

    const service = await prisma.service.create({
      data: {
        name,
        description,
        status: status || 'Operational',
        organizationId: user.organizationId,
      },
    });

    // Broadcast to WebSocket clients
    broadcastServiceUpdate({
      type: 'service_created',
      service,
    });

    res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update service (requires permission)
router.put('/:id', authenticate, requirePermission('canManageServices'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(status && { status }),
      },
    });

    // Broadcast to WebSocket clients
    broadcastServiceUpdate({
      type: 'service_updated',
      service,
    });

    res.json(service);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete service (requires permission)
router.delete('/:id', authenticate, requirePermission('canManageServices'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.service.delete({
      where: { id },
    });

    // Broadcast to WebSocket clients
    broadcastServiceUpdate({
      type: 'service_deleted',
      serviceId: id,
    });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

