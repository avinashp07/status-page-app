import { API_URL } from './utils';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const api = {
  // Auth
  signup: async (data: { email: string; password: string; name: string }) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  login: async (data: { email: string; password: string }) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  // Services
  getServices: async (org?: string) => {
    const url = org ? `${API_URL}/services?org=${org}` : `${API_URL}/services`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  createService: async (data: { name: string; description: string; status?: string }) => {
    const response = await fetch(`${API_URL}/services`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  updateService: async (id: string, data: { name?: string; description?: string; status?: string }) => {
    const response = await fetch(`${API_URL}/services/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  deleteService: async (id: string) => {
    const response = await fetch(`${API_URL}/services/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  // Incidents
  getPublicIncidents: async (org?: string) => {
    const url = org ? `${API_URL}/incidents/public?org=${org}` : `${API_URL}/incidents/public`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getIncidents: async () => {
    const response = await fetch(`${API_URL}/incidents`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  createIncident: async (data: { title: string; description: string; affectedServiceIds?: string[]; status?: string; severity?: string }) => {
    const response = await fetch(`${API_URL}/incidents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  updateIncident: async (id: string, data: { title?: string; description?: string; status?: string; severity?: string; affectedServiceIds?: string[] }) => {
    const response = await fetch(`${API_URL}/incidents/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  deleteIncident: async (id: string) => {
    const response = await fetch(`${API_URL}/incidents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  // Users
  getUsers: async () => {
    const response = await fetch(`${API_URL}/users`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  createUser: async (data: { email: string; password: string; name: string; role?: string; canManageServices?: boolean; canManageIncidents?: boolean; canManageUsers?: boolean }) => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  updateUserPermissions: async (id: string, permissions: any) => {
    const response = await fetch(`${API_URL}/users/${id}/permissions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(permissions),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  deleteUser: async (id: string) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  // Teams
  getTeams: async () => {
    const response = await fetch(`${API_URL}/teams`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  createTeam: async (data: { name: string; description?: string }) => {
    const response = await fetch(`${API_URL}/teams`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  addTeamMember: async (teamId: string, userId: string, role: string = 'member') => {
    const response = await fetch(`${API_URL}/teams/${teamId}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, role }),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  removeTeamMember: async (teamId: string, userId: string) => {
    const response = await fetch(`${API_URL}/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  deleteTeam: async (id: string) => {
    const response = await fetch(`${API_URL}/teams/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  // Incident Updates
  getIncidentUpdates: async (incidentId: string) => {
    const response = await fetch(`${API_URL}/incident-updates/${incidentId}`);
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  createIncidentUpdate: async (data: { incidentId: string; message: string; status: string }) => {
    const response = await fetch(`${API_URL}/incident-updates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  // Timeline
  getTimeline: async (days: number = 7, org?: string) => {
    const url = org 
      ? `${API_URL}/timeline?days=${days}&org=${org}` 
      : `${API_URL}/timeline?days=${days}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  // Organizations
  getCurrentOrganization: async () => {
    const response = await fetch(`${API_URL}/organizations/current`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getOrganizations: async () => {
    const response = await fetch(`${API_URL}/organizations`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  createOrganization: async (data: { name: string; slug: string; description?: string }) => {
    const response = await fetch(`${API_URL}/organizations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
};

