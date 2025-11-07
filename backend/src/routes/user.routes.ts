import { Router } from 'express';
import prisma from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/permissions';

const router = Router();

// Get current user info
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isOrgAdmin: true,
        canManageServices: true,
        canManageIncidents: true,
        canManageUsers: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user with permissions in nested structure to match login response
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isOrgAdmin: user.isOrgAdmin,
      organization: user.organization,
      permissions: {
        canManageServices: user.canManageServices,
        canManageIncidents: user.canManageIncidents,
        canManageUsers: user.canManageUsers,
      },
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the requesting user's organization
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true, role: true },
    });

    if (!requestingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build the filter: only show users from the same organization
    // Exclude super_admins (they don't belong to any organization)
    const whereClause: any = {
      role: { not: 'super_admin' }, // Exclude super admins
    };

    // If the requesting user is not a super admin, filter by organization
    if (requestingUser.role !== 'super_admin' && requestingUser.organizationId) {
      whereClause.organizationId = requestingUser.organizationId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        canManageServices: true,
        canManageIncidents: true,
        canManageUsers: true,
        createdAt: true,
        teamMembers: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { email, password, name, role, canManageServices, canManageIncidents, canManageUsers } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the requesting user's organization
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true, role: true },
    });

    if (!requestingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only super admin or org admin with an organization can create users
    if (requestingUser.role !== 'super_admin' && !requestingUser.organizationId) {
      return res.status(403).json({ error: 'You must be assigned to an organization to create users' });
    }

    // Hash the password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'user',
        organizationId: requestingUser.organizationId, // Assign to same org as admin
        canManageServices: canManageServices || false,
        canManageIncidents: canManageIncidents || false,
        canManageUsers: canManageUsers || false,
        isOrgAdmin: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        canManageServices: true,
        canManageIncidents: true,
        canManageUsers: true,
        createdAt: true,
      },
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user permissions (admin only)
router.put('/:id/permissions', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { canManageServices, canManageIncidents, canManageUsers, role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(canManageServices !== undefined && { canManageServices }),
        ...(canManageIncidents !== undefined && { canManageIncidents }),
        ...(canManageUsers !== undefined && { canManageUsers }),
        ...(role && { role }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        canManageServices: true,
        canManageIncidents: true,
        canManageUsers: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (req.user && req.user.userId === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

