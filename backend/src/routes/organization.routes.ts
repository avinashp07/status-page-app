import { Router } from 'express';
import prisma from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/permissions';

const router = Router();

// Get current user's organization
router.get('/current', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        organization: true,
      },
    });

    if (!user?.organization) {
      return res.status(404).json({ error: 'No organization found' });
    }

    res.json(user.organization);
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all organizations (super admin only)
router.get('/', authenticate, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            services: true,
            incidents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(organizations);
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create organization (super admin only)
router.post('/', authenticate, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        description,
      },
    });

    res.status(201).json(organization);
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update organization (org admin or super admin)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is org admin or super admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { organization: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Super admin can update any organization
    // Org admin can only update their own organization
    if (user.role !== 'super_admin') {
      if (!user.isOrgAdmin && user.role !== 'admin') {
        return res.status(403).json({ error: 'Only organization admins can update organization' });
      }
      
      // Ensure org admin is updating their own organization
      if (user.organizationId !== id) {
        return res.status(403).json({ error: 'You can only update your own organization' });
      }
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
      },
    });

    res.json(organization);
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete organization (super admin only)
router.delete('/:id', authenticate, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.organization.delete({
      where: { id },
    });

    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

