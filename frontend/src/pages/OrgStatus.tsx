import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Activity, AlertCircle, CheckCircle2, Clock, LogOut, LayoutDashboard, Home } from 'lucide-react';

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
  affectedServices: Array<{
    service: Service;
  }>;
  updates?: Array<{
    id: string;
    message: string;
    status: string;
    createdAt: string;
    createdBy: {
      name: string;
    };
  }>;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Operational':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'Degraded Performance':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case 'Partial Outage':
    case 'Major Outage':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Activity className="h-5 w-5 text-gray-500" />;
  }
};

export default function OrgStatus() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [orgName, setOrgName] = useState<string>('');
  const [notFound, setNotFound] = useState(false);

  const loadData = async () => {
    try {
      if (!orgSlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const [servicesData, incidentsData, timelineData] = await Promise.all([
        api.getServices(orgSlug),
        api.getPublicIncidents(orgSlug),
        api.getTimeline(7, orgSlug),
      ]);
      
      setServices(servicesData);
      setIncidents(incidentsData);
      setTimeline(timelineData);
      setLastUpdated(new Date());
      setOrgName(orgSlug);
      setNotFound(false);
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.response?.status === 404) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgSlug]);

  const handleWebSocketMessage = useCallback((data: any) => {
    console.log('WebSocket message:', data);
    
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
      setLastUpdated(new Date());
    } else if (data.type === 'service_deleted') {
      setServices((prev) => prev.filter((s) => s.id !== data.serviceId));
      setLastUpdated(new Date());
    } else if (data.type === 'incident_created' || data.type === 'incident_updated') {
      loadData(); // Reload to apply filtering
    } else if (data.type === 'incident_deleted') {
      setIncidents((prev) => prev.filter((i) => i.id !== data.incidentId));
      setLastUpdated(new Date());
    }
  }, []);

  useWebSocket(handleWebSocketMessage);

  const activeIncidents = incidents.filter((i) => i.status === 'Active');
  const resolvedIncidents = incidents.filter((i) => i.status === 'Resolved');
  const allOperational = services.every((s) => s.status === 'Operational') && activeIncidents.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading status...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Organization Not Found</CardTitle>
            <CardDescription>
              The organization "{orgSlug}" does not exist or has no public status page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <h1 className="text-5xl font-bold tracking-tight text-primary">
            {orgName.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </h1>
          <p className="text-xl text-muted-foreground">
            System Status
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Logged in as <span className="font-medium text-foreground">{user?.name}</span>
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/admin')}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      logout();
                      navigate(`/${orgSlug}`);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Overall Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {allOperational ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                )}
                <div>
                  <CardTitle className="text-2xl">
                    {allOperational ? 'All Systems Operational' : 'Experiencing Issues'}
                  </CardTitle>
                  <CardDescription>
                    {activeIncidents.length > 0
                      ? `${activeIncidents.length} active incident${activeIncidents.length !== 1 ? 's' : ''}`
                      : 'No active incidents'}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>Current status of all monitored services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <Badge
                  variant={service.status === 'Operational' ? 'default' : 'destructive'}
                  className={service.status === 'Operational' ? 'bg-green-500' : ''}
                >
                  {service.status}
                </Badge>
              </div>
            ))}
            {services.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No services configured</p>
            )}
          </CardContent>
        </Card>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Active Incidents
              </CardTitle>
              <CardDescription>Currently ongoing issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeIncidents.map((incident) => (
                <div key={incident.id} className="border-l-4 border-orange-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-semibold">{incident.title}</h3>
                      <p className="text-sm text-muted-foreground">{incident.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Started {new Date(incident.startedAt).toLocaleString()}
                      </div>
                      {incident.affectedServices.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {incident.affectedServices.map((as) => (
                            <Badge key={as.service.id} variant="outline" className="text-xs">
                              {as.service.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {/* Incident Updates Timeline */}
                      {incident.updates && incident.updates.length > 0 && (
                        <div className="mt-4 space-y-2 border-t pt-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Updates</p>
                          {incident.updates.slice(0, 3).map((update) => (
                            <div key={update.id} className="text-sm bg-muted/50 rounded p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {update.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(update.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">{update.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant="destructive">Active</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Resolved Incidents */}
        {resolvedIncidents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Recent Resolved Incidents
              </CardTitle>
              <CardDescription>Previously resolved prolonged incidents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resolvedIncidents.slice(0, 5).map((incident) => (
                <div key={incident.id} className="border-l-4 border-green-500 pl-4 py-2 opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-semibold">{incident.title}</h3>
                      <p className="text-sm text-muted-foreground">{incident.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Resolved {new Date(incident.resolvedAt!).toLocaleString()}
                      </div>
                      {/* Show latest update if available */}
                      {incident.updates && incident.updates.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground italic">
                          Latest: {incident.updates[0].message}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Resolved
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Timeline of Recent Status Changes */}
        {timeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity (Last 7 Days)
              </CardTitle>
              <CardDescription>Timeline of incidents and status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
                
                <div className="space-y-4">
                  {timeline.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="relative pl-10 pb-4">
                      {/* Timeline dot */}
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-background ${
                        entry.type === 'incident_created' ? 'bg-orange-500' :
                        entry.type === 'incident_resolved' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}></div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{entry.title}</p>
                          {entry.severity && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                entry.severity === 'minor' ? 'border-yellow-500 text-yellow-700' :
                                entry.severity === 'medium' ? 'border-orange-500 text-orange-700' :
                                'border-red-500 text-red-700'
                              }`}
                            >
                              {entry.severity}
                            </Badge>
                          )}
                          {entry.status && (
                            <Badge variant="outline" className="text-xs">
                              {entry.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{new Date(entry.timestamp).toLocaleString()}</span>
                          {entry.createdBy && <span>by {entry.createdBy}</span>}
                        </div>
                        {entry.affectedServices && entry.affectedServices.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {entry.affectedServices.map((serviceName: string) => (
                              <Badge key={serviceName} variant="secondary" className="text-xs">
                                {serviceName}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

