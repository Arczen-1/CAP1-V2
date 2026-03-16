import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Plus, Calendar, User, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Incident {
  _id: string;
  contract: {
    contractNumber: string;
    clientName: string;
  };
  incidentType: string;
  description: string;
  eventDate: string;
  reportedBy: { name: string };
  reportedAt: string;
  severity: string;
  status: string;
  resolution?: string;
}

const incidentTypes = [
  { value: 'burnt_cloth', label: 'Burnt Cloth' },
  { value: 'damaged_equipment', label: 'Damaged Equipment' },
  { value: 'missing_item', label: 'Missing Item' },
  { value: 'food_spoilage', label: 'Food Spoilage' },
  { value: 'vehicle_breakdown', label: 'Vehicle Breakdown' },
  { value: 'staff_issue', label: 'Staff Issue' },
  { value: 'client_complaint', label: 'Client Complaint' },
  { value: 'other', label: 'Other' }
];

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    contract: '',
    incidentType: '',
    description: '',
    eventDate: '',
    severity: 'low'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [incidentsData, contractsData] = await Promise.all([
        api.getIncidents(),
        api.getContracts()
      ]);
      setIncidents(incidentsData);
      setContracts(contractsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.createIncident(formData);
      toast.success('Incident reported successfully!');
      setDialogOpen(false);
      setFormData({
        contract: '',
        incidentType: '',
        description: '',
        eventDate: '',
        severity: 'low'
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to report incident');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.updateIncident(id, { 
        status: 'resolved',
        resolution: 'Resolved by supervisor'
      });
      toast.success('Incident resolved!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve incident');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_review': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openIncidents = incidents.filter(i => i.status === 'open');
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed');

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Incident Reports</h1>
            <p className="text-muted-foreground">
              Report and track post-event incidents
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Report Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Report New Incident</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Contract</Label>
                  <Select 
                    value={formData.contract} 
                    onValueChange={(v) => setFormData({...formData, contract: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contract" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.contractNumber} - {c.clientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Incident Type</Label>
                  <Select 
                    value={formData.incidentType} 
                    onValueChange={(v) => setFormData({...formData, incidentType: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {incidentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select 
                    value={formData.severity} 
                    onValueChange={(v) => setFormData({...formData, severity: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the incident..."
                    rows={3}
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Submit Report
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incidents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{openIncidents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resolvedIncidents.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Incidents Tabs */}
        <Tabs defaultValue="open" className="space-y-4">
          <TabsList>
            <TabsTrigger value="open">
              Open ({openIncidents.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedIncidents.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({incidents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-4">
            {openIncidents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No open incidents</p>
                </CardContent>
              </Card>
            ) : (
              openIncidents.map((incident) => (
                <Card key={incident._id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground capitalize">
                            {incident.incidentType.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium">
                          {incident.contract?.contractNumber} - {incident.contract?.clientName}
                        </h3>
                        <p className="text-sm">{incident.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(incident.eventDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {incident.reportedBy?.name}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResolve(incident._id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Resolve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {resolvedIncidents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No resolved incidents</p>
                </CardContent>
              </Card>
            ) : (
              resolvedIncidents.map((incident) => (
                <Card key={incident._id}>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground capitalize">
                          {incident.incidentType.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium">
                        {incident.contract?.contractNumber} - {incident.contract?.clientName}
                      </h3>
                      <p className="text-sm">{incident.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(incident.eventDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {incident.reportedBy?.name}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {incidents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No incidents reported</p>
                </CardContent>
              </Card>
            ) : (
              incidents.map((incident) => (
                <Card key={incident._id}>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground capitalize">
                          {incident.incidentType.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium">
                        {incident.contract?.contractNumber} - {incident.contract?.clientName}
                      </h3>
                      <p className="text-sm">{incident.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
