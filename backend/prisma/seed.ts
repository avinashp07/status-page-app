import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create SUPER ADMIN (not tied to any organization)
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'platform@admin.com' },
    update: {},
    create: {
      email: 'platform@admin.com',
      password: superAdminPassword,
      name: 'Platform Super Admin',
      role: 'super_admin',
      organizationId: null, // Not tied to any org - manages entire platform
      canManageServices: true,
      canManageIncidents: true,
      canManageUsers: true,
      isOrgAdmin: false, // This is for org-level admins
    },
  });

  console.log('✅ Super Admin user created:', superAdmin.email);

  // Create default organization
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: 'plivo-inc' },
    update: {},
    create: {
      name: 'Plivo Inc',
      slug: 'plivo-inc',
      description: 'Default organization for Plivo status page',
    },
  });

  console.log('✅ Organization created:', defaultOrg.name);

  // Create organization admin user
  const orgAdminPassword = await bcrypt.hash('admin123', 10);
  const orgAdmin = await prisma.user.upsert({
    where: { email: 'admin@plivo.com' },
    update: {},
    create: {
      email: 'admin@plivo.com',
      password: orgAdminPassword,
      name: 'Org Admin',
      role: 'admin',
      organizationId: defaultOrg.id,
      canManageServices: true,
      canManageIncidents: true,
      canManageUsers: true,
      isOrgAdmin: true, // Admin of Plivo Inc organization
    },
  });

  console.log('✅ Organization Admin user created:', orgAdmin.email);

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@plivo.com' },
    update: {},
    create: {
      email: 'user@plivo.com',
      password: userPassword,
      name: 'Regular User',
      role: 'user',
      organizationId: defaultOrg.id,
      canManageServices: false,
      canManageIncidents: true,
      canManageUsers: false,
      isOrgAdmin: false,
    },
  });

  console.log('✅ Regular user created:', user.email);

  // Create services
  const services = [
    {
      name: 'Website',
      description: 'Customer-facing website',
      status: 'Operational',
    },
    {
      name: 'API',
      description: 'REST API for integrations',
      status: 'Operational',
    },
    {
      name: 'Database',
      description: 'Primary database cluster',
      status: 'Operational',
    },
    {
      name: 'Payment Gateway',
      description: 'Payment processing service',
      status: 'Operational',
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { 
        name_organizationId: {
          name: service.name,
          organizationId: defaultOrg.id
        }
      },
      update: {},
      create: {
        ...service,
        organizationId: defaultOrg.id,
      },
    });
  }

  console.log('✅ Services created');

  // Create default teams
  const adminTeam = await prisma.team.upsert({
    where: {
      name_organizationId: {
        name: 'Administrators',
        organizationId: defaultOrg.id,
      },
    },
    update: {},
    create: {
      name: 'Administrators',
      description: 'Organization administrators and leadership',
      organizationId: defaultOrg.id,
    },
  });

  const engineeringTeam = await prisma.team.upsert({
    where: {
      name_organizationId: {
        name: 'Engineering',
        organizationId: defaultOrg.id,
      },
    },
    update: {},
    create: {
      name: 'Engineering',
      description: 'Engineering and development team',
      organizationId: defaultOrg.id,
    },
  });

  const opsTeam = await prisma.team.upsert({
    where: {
      name_organizationId: {
        name: 'Operations',
        organizationId: defaultOrg.id,
      },
    },
    update: {},
    create: {
      name: 'Operations',
      description: 'Operations and SRE team',
      organizationId: defaultOrg.id,
    },
  });

  // Add org admin to Administrators team
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: adminTeam.id,
        userId: orgAdmin.id,
      },
    },
    update: {},
    create: {
      teamId: adminTeam.id,
      userId: orgAdmin.id,
      role: 'admin',
    },
  });

  // Add org admin to Engineering team as well
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: engineeringTeam.id,
        userId: orgAdmin.id,
      },
    },
    update: {},
    create: {
      teamId: engineeringTeam.id,
      userId: orgAdmin.id,
      role: 'admin',
    },
  });

  // Add regular user to Operations team
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: opsTeam.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      teamId: opsTeam.id,
      userId: user.id,
      role: 'member',
    },
  });

  console.log('✅ Teams and team members created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
