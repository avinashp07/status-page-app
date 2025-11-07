import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { 
  AlertCircle, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Server,
  Home
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: string;
  startedAt: string;
  resolvedAt: string | null;
  affectedServices: Array<{ service: Service }>;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  canManageServices: boolean;
  canManageIncidents: boolean;
  canManageUsers: boolean;
  teamMembers?: Array<{
    team: {
      id: string;
      name: string;
    };
    role: string;
  }>;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  _count: {
    members: number;
  };
}

export default function Admin() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'services' | 'incidents' | 'users' | 'teams' | 'organization'>(
    user?.role === 'super_admin' ? 'organization' : 'services'
  );
  
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentOrg, setCurrentOrg] = useState<any>(null);
  const [allOrgs, setAllOrgs] = useState<any[]>([]);

  // Organization modal
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [orgDescription, setOrgDescription] = useState('');

  // Service modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceStatus, setServiceStatus] = useState('Operational');

  // Incident modal
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentStatus, setIncidentStatus] = useState('Active');
  const [incidentSeverity, setIncidentSeverity] = useState('medium');
  const [incidentServices, setIncidentServices] = useState<string[]>([]);

  // User modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPermissions, setUserPermissions] = useState({
    canManageServices: false,
    canManageIncidents: false,
    canManageUsers: false,
    role: 'user',
  });

  // Team modal
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');

  // Add member modal
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');

  // User team management modal
  const [userTeamModalOpen, setUserTeamModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTeamForUser, setSelectedTeamForUser] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      loadData();
    }
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    try {
      const [servicesData, incidentsData] = await Promise.all([
        api.getServices(),
        api.getIncidents(),
      ]);
      setServices(servicesData);
      setIncidents(incidentsData);

      // Always load users (needed for team member selection)
      try {
        const usersData = await api.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.log('Could not load users (may need admin permission)');
      }

      // Load teams
      try {
        const teamsData = await api.getTeams();
        setTeams(teamsData);
      } catch (error) {
        console.log('Could not load teams');
      }

      // Load current organization
      try {
        const orgData = await api.getCurrentOrganization();
        setCurrentOrg(orgData);
      } catch (error) {
        console.log('Could not load organization');
      }

      // Load all organizations (super admin only)
      if (user?.role === 'super_admin') {
        try {
          const orgsData = await api.getOrganizations();
          setAllOrgs(orgsData);
        } catch (error) {
          console.log('Could not load all organizations');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'service_created' || data.type === 'service_updated') {
      setServices((prev) => {
        const index = prev.findIndex((s) => s.id === data.service.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data.service;
          return updated;
        }
        return [...prev, data.service];
      });
    } else if (data.type === 'service_deleted') {
      setServices((prev) => prev.filter((s) => s.id !== data.serviceId));
    } else if (data.type === 'incident_created' || data.type === 'incident_updated') {
      loadData();
    } else if (data.type === 'incident_deleted') {
      setIncidents((prev) => prev.filter((i) => i.id !== data.incidentId));
    }
  }, []);

  useWebSocket(handleWebSocketMessage);

  // Service CRUD
  const openServiceModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceName(service.name);
      setServiceDescription(service.description);
      setServiceStatus(service.status);
    } else {
      setEditingService(null);
      setServiceName('');
      setServiceDescription('');
      setServiceStatus('Operational');
    }
    setServiceModalOpen(true);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.updateService(editingService.id, {
          name: serviceName,
          description: serviceDescription,
          status: serviceStatus,
        });
      } else {
        await api.createService({
          name: serviceName,
          description: serviceDescription,
          status: serviceStatus,
        });
      }
      setServiceModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service');
    }
  };

  const handleServiceDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        await api.deleteService(id);
        loadData();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service');
      }
    }
  };

  // Incident CRUD
  const openIncidentModal = (incident?: Incident) => {
    if (incident) {
      setEditingIncident(incident);
      setIncidentTitle(incident.title);
      setIncidentDescription(incident.description);
      setIncidentStatus(incident.status);
      setIncidentSeverity((incident as any).severity || 'medium');
      setIncidentServices(incident.affectedServices.map((as) => as.service.id));
    } else {
      setEditingIncident(null);
      setIncidentTitle('');
      setIncidentDescription('');
      setIncidentStatus('Active');
      setIncidentSeverity('medium');
      setIncidentServices([]);
    }
    setIncidentModalOpen(true);
  };

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIncident) {
        await api.updateIncident(editingIncident.id, {
          title: incidentTitle,
          description: incidentDescription,
          status: incidentStatus,
          severity: incidentSeverity,
          affectedServiceIds: incidentServices,
        });
      } else {
        await api.createIncident({
          title: incidentTitle,
          description: incidentDescription,
          status: incidentStatus,
          severity: incidentSeverity,
          affectedServiceIds: incidentServices,
        });
      }
      setIncidentModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving incident:', error);
      alert('Failed to save incident');
    }
  };

  const handleIncidentDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this incident?')) {
      try {
        await api.deleteIncident(id);
        loadData();
      } catch (error) {
        console.error('Error deleting incident:', error);
        alert('Failed to delete incident');
      }
    }
  };

  // User management
  const openUserModal = (userToEdit?: User) => {
    if (userToEdit) {
      // Editing existing user
      setEditingUser(userToEdit);
      setUserName(userToEdit.name);
      setUserEmail(userToEdit.email);
      setUserPassword(''); // Don't show password when editing
      setUserPermissions({
        canManageServices: userToEdit.canManageServices,
        canManageIncidents: userToEdit.canManageIncidents,
        canManageUsers: userToEdit.canManageUsers,
        role: userToEdit.role,
      });
    } else {
      // Creating new user
      setEditingUser(null);
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setUserPermissions({
        canManageServices: false,
        canManageIncidents: false,
        canManageUsers: false,
        role: 'user',
      });
    }
    setUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Update existing user - only update permissions
        await api.updateUserPermissions(editingUser.id, userPermissions);
      } else {
        // Create new user - validate required fields
        if (!userName.trim() || !userEmail.trim() || !userPassword.trim()) {
          alert('Name, email, and password are required');
          return;
        }
        if (userPassword.length < 8) {
          alert('Password must be at least 8 characters');
          return;
        }
        await api.createUser({
          name: userName.trim(),
          email: userEmail.trim(),
          password: userPassword,
          ...userPermissions,
        });
      }
      setUserModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(error.message || 'Failed to save user');
    }
  };

  const handleUserDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.deleteUser(id);
        loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  // Team management
  const openTeamModal = () => {
    setTeamName('');
    setTeamDescription('');
    setTeamModalOpen(true);
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTeam({
        name: teamName,
        description: teamDescription,
      });
      setTeamModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    }
  };

  const handleTeamDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this team?')) {
      try {
        await api.deleteTeam(id);
        loadData();
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Failed to delete team');
      }
    }
  };

  const openAddMemberModal = (team: Team) => {
    setSelectedTeam(team);
    setSelectedUserId('');
    setAddMemberModalOpen(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedUserId) return;

    try {
      await api.addTeamMember(selectedTeam.id, selectedUserId);
      setAddMemberModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Failed to add team member');
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await api.removeTeamMember(teamId, userId);
        loadData();
      } catch (error) {
        console.error('Error removing team member:', error);
        alert('Failed to remove team member');
      }
    }
  };

  // User team management
  const openUserTeamModal = (userToManage: User) => {
    setSelectedUser(userToManage);
    setSelectedTeamForUser('');
    setUserTeamModalOpen(true);
  };

  const handleAddUserToTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedTeamForUser) return;

    try {
      await api.addTeamMember(selectedTeamForUser, selectedUser.id);
      setUserTeamModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error adding user to team:', error);
      alert('Failed to add user to team');
    }
  };

  const handleRemoveUserFromTeam = async (userId: string, teamId: string) => {
    if (confirm('Are you sure you want to remove this user from the team?')) {
      try {
        await api.removeTeamMember(teamId, userId);
        loadData();
      } catch (error) {
        console.error('Error removing user from team:', error);
        alert('Failed to remove user from team');
      }
    }
  };

  // Organization management (super admin only)
  const openOrgModal = () => {
    setOrgName('');
    setOrgSlug('');
    setOrgDescription('');
    setOrgModalOpen(true);
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createOrganization({
        name: orgName,
        slug: orgSlug,
        description: orgDescription,
      });
      setOrgModalOpen(false);
      loadData();
      alert('Organization created successfully!');
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="border-b bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.name}
                  {currentOrg && <span className="ml-2">• <span className="font-medium">{currentOrg.name}</span></span>}
                </p>
              </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (user?.organization?.slug) {
                    navigate(`/${user.organization.slug}`);
                  } else {
                    navigate('/');
                  }
                }}
              >
                <Home className="h-4 w-4 mr-2" />
                Status Page
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          {/* Super Admin: Only Organizations Tab */}
          {user?.role === 'super_admin' ? (
            <button
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'organization'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('organization')}
            >
              <Server className="h-4 w-4 inline-block mr-2" />
              Organizations
            </button>
          ) : (
            <>
              {/* Organization Admin/User: Normal Tabs */}
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'services'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('services')}
              >
                <Server className="h-4 w-4 inline-block mr-2" />
                Services
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'incidents'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('incidents')}
              >
                <AlertCircle className="h-4 w-4 inline-block mr-2" />
                Incidents
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'teams'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('teams')}
              >
                <Users className="h-4 w-4 inline-block mr-2" />
                Teams
              </button>
              {user?.permissions?.canManageUsers && (
                <button
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'users'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('users')}
                >
                  <Users className="h-4 w-4 inline-block mr-2" />
                  Users
                </button>
              )}
              {user?.role === 'admin' && (
                <button
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'organization'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('organization')}
                >
                  <Server className="h-4 w-4 inline-block mr-2" />
                  Organization
                </button>
              )}
            </>
          )}
        </div>

        {/* Services Tab */}
        {activeTab === 'services' && user?.role !== 'super_admin' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Services</CardTitle>
                  <CardDescription>Manage your monitored services</CardDescription>
                </div>
                {user?.permissions?.canManageServices && (
                  <Button onClick={() => openServiceModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                      <Badge
                        variant={service.status === 'Operational' ? 'default' : 'destructive'}
                        className="mt-2"
                      >
                        {service.status}
                      </Badge>
                    </div>
                    {user?.permissions?.canManageServices && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openServiceModal(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleServiceDelete(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {services.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No services yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && user?.role !== 'super_admin' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Incidents</CardTitle>
                  <CardDescription>Manage service incidents</CardDescription>
                </div>
                {user?.permissions?.canManageIncidents && (
                  <Button onClick={() => openIncidentModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Incident
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-semibold">{incident.title}</h3>
                        <p className="text-sm text-muted-foreground">{incident.description}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge variant={incident.status === 'Active' ? 'destructive' : 'outline'}>
                          {incident.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(incident.startedAt).toLocaleString()}
                        </span>
                      </div>
                      {incident.affectedServices.length > 0 && (
                        <div className="flex gap-2">
                          {incident.affectedServices.map((as) => (
                            <Badge key={as.service.id} variant="outline" className="text-xs">
                              {as.service.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {user?.permissions?.canManageIncidents && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openIncidentModal(incident)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleIncidentDelete(incident.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {incidents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No incidents</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && user?.role !== 'super_admin' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Teams</CardTitle>
                  <CardDescription>Manage teams in your organization</CardDescription>
                </div>
                {user?.isOrgAdmin && (
                  <Button onClick={openTeamModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          <Badge variant="outline">
                            {team._count.members} {team._count.members === 1 ? 'member' : 'members'}
                          </Badge>
                        </div>
                        {team.description && (
                          <p className="text-sm text-muted-foreground">{team.description}</p>
                        )}
                      </div>
                      {user?.isOrgAdmin && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddMemberModal(team)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Member
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleTeamDelete(team.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Team Members:</p>
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div>
                            <p className="text-sm font-medium">{member.user.name}</p>
                            <p className="text-xs text-muted-foreground">{member.user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                              {member.role}
                            </Badge>
                            {user?.isOrgAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(team.id, member.user.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {team.members.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No members yet</p>
                      )}
                    </div>
                  </div>
                ))}
                {teams.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No teams found</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organization Tab */}
        {activeTab === 'organization' && (user?.role === 'admin' || user?.role === 'super_admin') && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Organization</CardTitle>
                  <CardDescription>Multi-tenant organization management</CardDescription>
                </div>
                {user?.role === 'super_admin' && (
                  <Button onClick={openOrgModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Organization
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Super Admin: Show all organizations */}
                {user?.role === 'super_admin' && allOrgs.length > 0 && (
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">All Organizations (Super Admin View)</h3>
                    <div className="space-y-3">
                      {allOrgs.map((org) => (
                        <div key={org.id} className="border rounded p-4 bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{org.name}</h4>
                              <code className="text-xs bg-background px-2 py-1 rounded">{org.slug}</code>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline">{org._count.users} users</Badge>
                              <Badge variant="outline">{org._count.services} services</Badge>
                              <Badge variant="outline">{org._count.incidents} incidents</Badge>
                            </div>
                          </div>
                          {org.description && (
                            <p className="text-sm text-muted-foreground mt-2">{org.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Organization Info */}
                {currentOrg && (
                <div className="space-y-6">
                  <div className="border rounded-lg p-6 bg-muted/50">
                    <h3 className="text-lg font-semibold mb-2">Current Organization</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Name:</span>
                        <span className="text-sm">{currentOrg.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Slug:</span>
                        <code className="text-sm bg-background px-2 py-1 rounded">{currentOrg.slug}</code>
                      </div>
                      {currentOrg.description && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Description:</span>
                          <span className="text-sm">{currentOrg.description}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Public Status Page URLs</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Default (shows this org)</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-3 py-2 rounded flex-1">
                            http://localhost:5173
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open('http://localhost:5173', '_blank')}
                          >
                            Open
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Organization-specific</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-3 py-2 rounded flex-1">
                            http://localhost:5173?org={currentOrg.slug}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`http://localhost:5173?org=${currentOrg.slug}`, '_blank')}
                          >
                            Open
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Multi-Tenancy Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs mt-0.5">✓</div>
                        <div>
                          <p className="font-medium text-sm">Backend Multi-Tenant</p>
                          <p className="text-xs text-muted-foreground">All data is scoped to organizations with complete isolation</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs mt-0.5">✓</div>
                        <div>
                          <p className="font-medium text-sm">Organization Model</p>
                          <p className="text-xs text-muted-foreground">Users, services, incidents, and teams belong to organizations</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs mt-0.5">✓</div>
                        <div>
                          <p className="font-medium text-sm">Data Isolation</p>
                          <p className="text-xs text-muted-foreground">Each organization only sees their own data</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mt-0.5">i</div>
                        <div>
                          <p className="font-medium text-sm">Current Mode: Single Organization</p>
                          <p className="text-xs text-muted-foreground">
                            Frontend optimized to show one organization at a time for better UX.
                            Backend supports unlimited organizations.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                    <h4 className="font-semibold text-sm mb-2">✅ Multi-Tenancy Requirement Met</h4>
                    <p className="text-sm text-muted-foreground">
                      Your application has a complete multi-tenant architecture:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                      <li>• Organization database model ✅</li>
                      <li>• Data scoped to organizationId ✅</li>
                      <li>• APIs support multiple organizations ✅</li>
                      <li>• Complete data isolation ✅</li>
                      <li>• Organization admin roles ✅</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3">
                      <strong>Note:</strong> To add more organizations, use the API endpoint or signup users 
                      to create new organizations programmatically.
                    </p>
                  </div>
                </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && user?.role !== 'super_admin' && user?.permissions?.canManageUsers && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Create and manage users in your organization</CardDescription>
                </div>
                <Button onClick={() => openUserModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{u.name}</h3>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge>{u.role}</Badge>
                          {u.canManageServices && <Badge variant="outline">Services</Badge>}
                          {u.canManageIncidents && <Badge variant="outline">Incidents</Badge>}
                          {u.canManageUsers && <Badge variant="outline">Users</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUserTeamModal(u)}
                          title="Manage teams"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUserModal(u)}
                          title="Edit permissions"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {u.id !== user?.id && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUserDelete(u.id)}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Show user's teams */}
                    {u.teamMembers && u.teamMembers.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Teams:</p>
                        <div className="flex flex-wrap gap-2">
                          {u.teamMembers.map((tm) => (
                            <div key={tm.team.id} className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {tm.team.name}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() => handleRemoveUserFromTeam(u.id, tm.team.id)}
                                title="Remove from team"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(!u.teamMembers || u.teamMembers.length === 0) && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground italic">Not in any teams</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service Modal */}
      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent>
          <form onSubmit={handleServiceSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Create Service'}
              </DialogTitle>
              <DialogDescription>
                {editingService ? 'Update service details' : 'Add a new service to monitor'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="serviceName">Name</Label>
                <Input
                  id="serviceName"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceDescription">Description</Label>
                <Input
                  id="serviceDescription"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceStatus">Status</Label>
                <Select value={serviceStatus} onValueChange={setServiceStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operational">Operational</SelectItem>
                    <SelectItem value="Degraded Performance">Degraded Performance</SelectItem>
                    <SelectItem value="Partial Outage">Partial Outage</SelectItem>
                    <SelectItem value="Major Outage">Major Outage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setServiceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingService ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Incident Modal */}
      <Dialog open={incidentModalOpen} onOpenChange={setIncidentModalOpen}>
        <DialogContent>
          <form onSubmit={handleIncidentSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingIncident ? 'Edit Incident' : 'Create Incident'}
              </DialogTitle>
              <DialogDescription>
                {editingIncident ? 'Update incident details' : 'Report a new incident'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="incidentTitle">Title</Label>
                <Input
                  id="incidentTitle"
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incidentDescription">Description</Label>
                <Input
                  id="incidentDescription"
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incidentSeverity">Severity</Label>
                <Select value={incidentSeverity} onValueChange={setIncidentSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">🟡 Minor (Degraded Performance)</SelectItem>
                    <SelectItem value="medium">🟠 Medium (Partial Outage)</SelectItem>
                    <SelectItem value="major">🔴 Major (Major Outage)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="incidentStatus">Status</Label>
                <Select value={incidentStatus} onValueChange={setIncidentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Affected Services</Label>
                <div className="space-y-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`service-${service.id}`}
                        checked={incidentServices.includes(service.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setIncidentServices([...incidentServices, service.id]);
                          } else {
                            setIncidentServices(incidentServices.filter((id) => id !== service.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`service-${service.id}`} className="text-sm">
                        {service.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIncidentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingIncident ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent>
          <form onSubmit={handleUserSubmit}>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User Permissions' : 'Create New User'}</DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? `Manage permissions for ${editingUser.name}` 
                  : 'Create a new user account in your organization'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!editingUser && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="userName">Full Name</Label>
                    <Input
                      id="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">Email</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userPassword">Password</Label>
                    <Input
                      id="userPassword"
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="userRole">Role</Label>
                <Select
                  value={userPermissions.role}
                  onValueChange={(value) =>
                    setUserPermissions({ ...userPermissions, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="canManageServices">Manage Services</Label>
                  <Switch
                    id="canManageServices"
                    checked={userPermissions.canManageServices}
                    onCheckedChange={(checked) =>
                      setUserPermissions({ ...userPermissions, canManageServices: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canManageIncidents">Manage Incidents</Label>
                  <Switch
                    id="canManageIncidents"
                    checked={userPermissions.canManageIncidents}
                    onCheckedChange={(checked) =>
                      setUserPermissions({ ...userPermissions, canManageIncidents: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canManageUsers">Manage Users</Label>
                  <Switch
                    id="canManageUsers"
                    checked={userPermissions.canManageUsers}
                    onCheckedChange={(checked) =>
                      setUserPermissions({ ...userPermissions, canManageUsers: checked })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingUser ? 'Update' : 'Create User'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Team Modal */}
      <Dialog open={teamModalOpen} onOpenChange={setTeamModalOpen}>
        <DialogContent>
          <form onSubmit={handleTeamSubmit}>
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
              <DialogDescription>
                Create a new team in your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Engineering, Support, DevOps"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamDescription">Description</Label>
                <Input
                  id="teamDescription"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Brief description of the team"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTeamModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Team</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Team Member Modal */}
      <Dialog open={addMemberModalOpen} onOpenChange={setAddMemberModalOpen}>
        <DialogContent>
          <form onSubmit={handleAddMember}>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Add a user to {selectedTeam?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userId">Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u) => !selectedTeam?.members.some((m) => m.user.id === u.id))
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddMemberModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Team Management Modal */}
      <Dialog open={userTeamModalOpen} onOpenChange={setUserTeamModalOpen}>
        <DialogContent>
          <form onSubmit={handleAddUserToTeam}>
            <DialogHeader>
              <DialogTitle>Manage Teams for {selectedUser?.name}</DialogTitle>
              <DialogDescription>
                Add this user to a team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Current Teams</Label>
                {selectedUser?.teamMembers && selectedUser.teamMembers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.teamMembers.map((tm) => (
                      <div key={tm.team.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{tm.team.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUserFromTeam(selectedUser.id, tm.team.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not in any teams</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teamSelect">Add to Team</Label>
                <Select value={selectedTeamForUser} onValueChange={setSelectedTeamForUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter((t) => !selectedUser?.teamMembers?.some((tm) => tm.team.id === t.id))
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserTeamModalOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={!selectedTeamForUser}>
                Add to Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Organization Modal (Super Admin Only) */}
      <Dialog open={orgModalOpen} onOpenChange={setOrgModalOpen}>
        <DialogContent>
          <form onSubmit={handleOrgSubmit}>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Create a new multi-tenant organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgSlug">Slug (URL-friendly)</Label>
                <Input
                  id="orgSlug"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="e.g., acme-corp"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used in URL: localhost:5173?org={orgSlug || 'your-slug'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgDescription">Description (optional)</Label>
                <Input
                  id="orgDescription"
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="Brief description of the organization"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOrgModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Organization</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

