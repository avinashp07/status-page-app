import { Router } from 'express';
import prisma from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { broadcastIncidentUpdate } from '../websocket/server';

const router = Router();

// Get updates for an incident (public)
router.get('/:incidentId', async (req, res) => {
  try {
    const { incidentId } = req.params;

    const updates = await prisma.incidentUpdate.findMany({
      where: { incidentId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(updates);
  } catch (error) {
    console.error('Get incident updates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create incident update (requires permission)
router.post('/', authenticate, requirePermission('canManageIncidents'), async (req: AuthRequest, res) => {
  try {
    const { incidentId, message, status } = req.body;

    if (!incidentId || !message || !status) {
      return res.status(400).json({ error: 'Incident ID, message, and status are required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const update = await prisma.incidentUpdate.create({
      data: {
        incidentId,
        message,
        status,
        createdById: req.user.userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        incident: {
          include: {
            affectedServices: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    // Broadcast to WebSocket clients
    broadcastIncidentUpdate({
      type: 'incident_update_created',
      update,
      incident: update.incident,
    });

    res.status(201).json(update);
  } catch (error) {
    console.error('Create incident update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete incident update (requires permission)
router.delete('/:id', authenticate, requirePermission('canManageIncidents'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.incidentUpdate.delete({
      where: { id },
    });

    res.json({ message: 'Incident update deleted successfully' });
  } catch (error) {
    console.error('Delete incident update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

