import { Router } from 'express';
import prisma from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all teams in user's organization
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return res.status(400).json({ error: 'User not assigned to an organization' });
    }

    const teams = await prisma.team.findMany({
      where: { organizationId: user.organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create team
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true, isOrgAdmin: true },
    });

    if (!user?.organizationId) {
      return res.status(400).json({ error: 'User not assigned to an organization' });
    }

    if (!user.isOrgAdmin) {
      return res.status(403).json({ error: 'Only organization admins can create teams' });
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        organizationId: user.organizationId,
      },
    });

    res.status(201).json(team);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add member to team
router.post('/:teamId/members', authenticate, async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const { userId, role } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role: role || 'member',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(teamMember);
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member from team
router.delete('/:teamId/members/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { teamId, userId } = req.params;

    await prisma.teamMember.deleteMany({
      where: {
        teamId,
        userId,
      },
    });

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete team
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isOrgAdmin: true },
    });

    if (!user?.isOrgAdmin) {
      return res.status(403).json({ error: 'Only organization admins can delete teams' });
    }

    await prisma.team.delete({
      where: { id },
    });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

