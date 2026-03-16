import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import BookingCalendar from '@/components/BookingCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { mockApi } from '@/services/mockApi';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, User, Truck, Link2, CalendarIcon } from 'lucide-react';

const truckTypes = [
  { value: 'closed_van', label: 'Closed Van' },
  { value: 'open_truck', label: 'Open Truck' },
  { value: 'refrigerated', label: 'Refrigerated' },
  { value: 'wing_van', label: 'Wing Van' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'mini_truck', label: 'Mini Truck' },
  { value: 'lorry', label: 'Lorry' },
  { value: 'other', label: 'Other' }
];

const licenseTypes = [
  { value: '1', label: 'Type 1' },
  { value: '2', label: 'Type 2' },
  { value: '3', label: 'Type 3' },
  { value: 'professional', label: 'Professional' }
];

interface Driver {
  _id: string;
  driverId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry?: string;
  phone?: string;
  assignedTrucks: Truck[];
}

interface Truck {
  _id: string;
  truckId: string;
  plateNumber: string;
  truckType: string;
  capacity?: {
    weight?: number;
    volume?: number;
    dimensions?: { length?: number; width?: number; height?: number };
  };
  assignedDriver?: Driver;
  images: { url: string; caption: string; isPrimary: boolean }[];
}

interface LogisticsContract {
  _id: string;
  contractNumber: string;
  createdAt?: string;
  clientName: string;
  eventDate: string;
  status: string;
  totalPacks?: number;
  venue?: {
    name?: string;
    address?: string;
  };
  logisticsAssignment?: {
    driver?: {
      fullName?: string;
      driverId?: string;
    } | null;
    truck?: {
      plateNumber?: string;
      truckType?: string;
    } | null;
    assignmentStatus?: string;
    notes?: string;
  };
}

const formatAssignmentStatus = (status?: string) => {
  switch (status) {
    case 'scheduled':
      return 'Transport Booked';
    case 'ready_for_dispatch':
      return 'Ready For Dispatch';
    case 'dispatched':
      return 'Dispatched To Venue';
    case 'completed':
      return 'Event Logistics Completed';
    default:
      return 'Needs Booking';
  }
};

export default function LogisticsManagement() {
  const navigate = useNavigate();
  const { useMock } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [contracts, setContracts] = useState<LogisticsContract[]>([]);
  const [driverSearch, setDriverSearch] = useState('');
  const [truckSearch, setTruckSearch] = useState('');
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [isAddTruckOpen, setIsAddTruckOpen] = useState(false);
  const [isEditDriverOpen, setIsEditDriverOpen] = useState(false);
  const [isEditTruckOpen, setIsEditTruckOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [stats, setStats] = useState({ totalDrivers: 0, totalTrucks: 0, availableTrucks: 0, assignedTrucks: 0 });
  const logisticsService = useMock ? mockApi : api;
  
  const [driverForm, setDriverForm] = useState({
    firstName: '',
    lastName: '',
    licenseNumber: '',
    licenseType: 'professional',
    licenseExpiry: '',
    phone: ''
  });
  
  const [truckForm, setTruckForm] = useState({
    plateNumber: '',
    truckType: '',
    weight: '',
    volume: '',
    length: '',
    width: '',
    height: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchDrivers();
    fetchTrucks();
    fetchStats();
    fetchContracts();
  }, [useMock]);

  const fetchDrivers = async () => {
    try {
      const data = await logisticsService.getDrivers();
      if (Array.isArray(data)) {
        setDrivers(data as unknown as Driver[]);
      }
    } catch (error) {
      toast.error('Failed to fetch drivers');
    }
  };

  const fetchTrucks = async () => {
    try {
      const data = await logisticsService.getTrucks();
      if (Array.isArray(data)) {
        setTrucks(data as unknown as Truck[]);
      }
    } catch (error) {
      toast.error('Failed to fetch trucks');
    }
  };

  const fetchStats = async () => {
    try {
      const data = await logisticsService.getLogisticsStats();
      if (data) {
        setStats(data as { totalDrivers: number; totalTrucks: number; availableTrucks: number; assignedTrucks: number });
      }
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchContracts = async () => {
    try {
      const data = await logisticsService.getContracts();
      if (Array.isArray(data)) {
        setContracts(data as unknown as LogisticsContract[]);
      }
    } catch (error) {
      toast.error('Failed to fetch contract schedule');
    }
  };

  const handleAddDriver = async () => {
    try {
      await logisticsService.createDriver({
        firstName: driverForm.firstName,
        lastName: driverForm.lastName,
        licenseNumber: driverForm.licenseNumber,
        licenseType: driverForm.licenseType,
        licenseExpiry: driverForm.licenseExpiry || undefined,
        phone: driverForm.phone
      });
      toast.success('Driver added successfully');
      setIsAddDriverOpen(false);
      resetDriverForm();
      fetchDrivers();
      fetchStats();
    } catch (error) {
      toast.error('Failed to add driver');
    }
  };

  const handleAddTruck = async () => {
    try {
      await logisticsService.createTruck({
        plateNumber: truckForm.plateNumber,
        truckType: truckForm.truckType,
        capacity: {
          weight: truckForm.weight ? parseFloat(truckForm.weight) : undefined,
          volume: truckForm.volume ? parseFloat(truckForm.volume) : undefined,
          dimensions: {
            length: truckForm.length ? parseFloat(truckForm.length) : undefined,
            width: truckForm.width ? parseFloat(truckForm.width) : undefined,
            height: truckForm.height ? parseFloat(truckForm.height) : undefined
          }
        },
        images: truckForm.imageUrl ? [{ url: truckForm.imageUrl, caption: 'Primary', isPrimary: true }] : []
      });
      toast.success('Truck added successfully');
      setIsAddTruckOpen(false);
      resetTruckForm();
      fetchTrucks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to add truck');
    }
  };

  const handleEditDriver = async () => {
    if (!selectedDriver) return;
    try {
      await logisticsService.updateDriver(selectedDriver._id, {
        firstName: driverForm.firstName,
        lastName: driverForm.lastName,
        licenseNumber: driverForm.licenseNumber,
        licenseType: driverForm.licenseType,
        licenseExpiry: driverForm.licenseExpiry || undefined,
        phone: driverForm.phone
      });
      toast.success('Driver updated successfully');
      setIsEditDriverOpen(false);
      setSelectedDriver(null);
      resetDriverForm();
      fetchDrivers();
    } catch (error) {
      toast.error('Failed to update driver');
    }
  };

  const handleEditTruck = async () => {
    if (!selectedTruck) return;
    try {
      await logisticsService.updateTruck(selectedTruck._id, {
        plateNumber: truckForm.plateNumber,
        truckType: truckForm.truckType,
        capacity: {
          weight: truckForm.weight ? parseFloat(truckForm.weight) : undefined,
          volume: truckForm.volume ? parseFloat(truckForm.volume) : undefined,
          dimensions: {
            length: truckForm.length ? parseFloat(truckForm.length) : undefined,
            width: truckForm.width ? parseFloat(truckForm.width) : undefined,
            height: truckForm.height ? parseFloat(truckForm.height) : undefined
          }
        }
      });
      toast.success('Truck updated successfully');
      setIsEditTruckOpen(false);
      setSelectedTruck(null);
      resetTruckForm();
      fetchTrucks();
    } catch (error) {
      toast.error('Failed to update truck');
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    try {
      await logisticsService.deleteDriver(driverId);
      toast.success('Driver deleted successfully');
      fetchDrivers();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete driver');
    }
  };

  const handleDeleteTruck = async (truckId: string) => {
    if (!confirm('Are you sure you want to delete this truck?')) return;
    try {
      await logisticsService.deleteTruck(truckId);
      toast.success('Truck deleted successfully');
      fetchTrucks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete truck');
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedTruck || !selectedDriver) return;
    try {
      await logisticsService.assignDriverToTruck(selectedTruck._id, selectedDriver._id);
      toast.success('Driver assigned successfully');
      setIsAssignDialogOpen(false);
      setSelectedTruck(null);
      setSelectedDriver(null);
      fetchTrucks();
      fetchDrivers();
    } catch (error) {
      toast.error('Failed to assign driver');
    }
  };

  const openEditDriverDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setDriverForm({
      firstName: driver.firstName,
      lastName: driver.lastName,
      licenseNumber: driver.licenseNumber,
      licenseType: driver.licenseType,
      licenseExpiry: driver.licenseExpiry ? driver.licenseExpiry.split('T')[0] : '',
      phone: driver.phone || ''
    });
    setIsEditDriverOpen(true);
  };

  const openEditTruckDialog = (truck: Truck) => {
    setSelectedTruck(truck);
    setTruckForm({
      plateNumber: truck.plateNumber,
      truckType: truck.truckType,
      weight: truck.capacity?.weight?.toString() || '',
      volume: truck.capacity?.volume?.toString() || '',
      length: truck.capacity?.dimensions?.length?.toString() || '',
      width: truck.capacity?.dimensions?.width?.toString() || '',
      height: truck.capacity?.dimensions?.height?.toString() || '',
      imageUrl: truck.images[0]?.url || ''
    });
    setIsEditTruckOpen(true);
  };

  const openAssignDialog = (truck: Truck) => {
    setSelectedTruck(truck);
    setIsAssignDialogOpen(true);
  };

  const resetDriverForm = () => {
    setDriverForm({
      firstName: '',
      lastName: '',
      licenseNumber: '',
      licenseType: 'professional',
      licenseExpiry: '',
      phone: ''
    });
  };

  const resetTruckForm = () => {
    setTruckForm({
      plateNumber: '',
      truckType: '',
      weight: '',
      volume: '',
      length: '',
      width: '',
      height: '',
      imageUrl: ''
    });
  };

  const getTruckTypeLabel = (type: string) => {
    return truckTypes.find(t => t.value === type)?.label || type;
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.fullName.toLowerCase().includes(driverSearch.toLowerCase()) ||
    driver.driverId.toLowerCase().includes(driverSearch.toLowerCase()) ||
    driver.licenseNumber.toLowerCase().includes(driverSearch.toLowerCase())
  );

  const filteredTrucks = trucks.filter(truck =>
    truck.plateNumber.toLowerCase().includes(truckSearch.toLowerCase()) ||
    truck.truckId.toLowerCase().includes(truckSearch.toLowerCase())
  );

  const approvedContracts = contracts
    .filter((contract) => contract.status === 'approved' || contract.status === 'completed')
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  const bookedContracts = approvedContracts.filter((contract) => Boolean(contract.logisticsAssignment?.truck));
  const needsBookingContracts = approvedContracts.filter((contract) => !contract.logisticsAssignment?.truck);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Drivers And Trucks</h1>
            <p className="text-muted-foreground">Manage logistics resources and review the contract-linked transport schedule in one place.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/logistics')}>Open Logistics Dashboard</Button>
        </div>

        <Card className="border-slate-200 bg-slate-50/80">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">How booking works now</h2>
                <p className="text-sm text-muted-foreground">
                  Drivers and trucks are managed here, but event booking is saved on each approved contract so the same flow shows up in the logistics dashboard and contract detail page.
                </p>
              </div>
              <Button onClick={() => navigate('/logistics')}>Open Needs Booking Board</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm font-semibold">1. Open the approved contract</p>
                <p className="mt-1 text-sm text-muted-foreground">Use the logistics dashboard to find events that still need transport booked.</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm font-semibold">2. Book the truck first</p>
                <p className="mt-1 text-sm text-muted-foreground">Choose the best truck for the event load inside the contract logistics tab.</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm font-semibold">3. Add the driver and save</p>
                <p className="mt-1 text-sm text-muted-foreground">The contract now updates early booking stages automatically after you save the truck and driver.</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm font-semibold">4. Use the schedule as reference</p>
                <p className="mt-1 text-sm text-muted-foreground">The calendar below is now a view of contract bookings, not a separate place to book them.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDrivers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trucks</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrucks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Booked Events</CardTitle>
              <Link2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{bookedContracts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Booking</CardTitle>
              <CalendarIcon className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{needsBookingContracts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="trucks">Trucks</TabsTrigger>
            <TabsTrigger value="calendar">Contract Schedule</TabsTrigger>
          </TabsList>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search drivers by name, ID, or license..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isAddDriverOpen} onOpenChange={setIsAddDriverOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Driver
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Driver</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          value={driverForm.firstName}
                          onChange={(e) => setDriverForm({ ...driverForm, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          value={driverForm.lastName}
                          onChange={(e) => setDriverForm({ ...driverForm, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>License Number</Label>
                      <Input
                        value={driverForm.licenseNumber}
                        onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                        placeholder="e.g., D12345678"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>License Type</Label>
                        <Select value={driverForm.licenseType} onValueChange={(value) => setDriverForm({ ...driverForm, licenseType: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {licenseTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>License Expiry</Label>
                        <Input
                          type="date"
                          value={driverForm.licenseExpiry}
                          onChange={(e) => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={driverForm.phone}
                        onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                        placeholder="+1 234 567 890"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDriverOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddDriver}>Add Driver</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Driver</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">License</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Assigned Trucks</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredDrivers.map((driver) => (
                        <tr key={driver._id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 p-2 rounded-full">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{driver.fullName}</p>
                                <p className="text-xs text-muted-foreground">{driver.driverId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <p>{driver.licenseNumber}</p>
                              <p className="text-xs text-muted-foreground">{licenseTypes.find(t => t.value === driver.licenseType)?.label}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {driver.assignedTrucks?.length > 0 ? (
                                driver.assignedTrucks.map((truck) => (
                                  <Badge key={truck._id} variant="outline">{truck.plateNumber}</Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">None</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDriverDialog(driver)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteDriver(driver._id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trucks Tab */}
          <TabsContent value="trucks" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trucks by plate number or ID..."
                  value={truckSearch}
                  onChange={(e) => setTruckSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isAddTruckOpen} onOpenChange={setIsAddTruckOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Truck
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Truck</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Plate Number</Label>
                      <Input
                        value={truckForm.plateNumber}
                        onChange={(e) => setTruckForm({ ...truckForm, plateNumber: e.target.value.toUpperCase() })}
                        placeholder="e.g., ABC-1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Truck Type</Label>
                      <Select value={truckForm.truckType} onValueChange={(value) => setTruckForm({ ...truckForm, truckType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {truckTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Weight Capacity (kg)</Label>
                        <Input
                          type="number"
                          value={truckForm.weight}
                          onChange={(e) => setTruckForm({ ...truckForm, weight: e.target.value })}
                          placeholder="5000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Volume (m³)</Label>
                        <Input
                          type="number"
                          value={truckForm.volume}
                          onChange={(e) => setTruckForm({ ...truckForm, volume: e.target.value })}
                          placeholder="20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Dimensions (m)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Length"
                          value={truckForm.length}
                          onChange={(e) => setTruckForm({ ...truckForm, length: e.target.value })}
                        />
                        <Input
                          placeholder="Width"
                          value={truckForm.width}
                          onChange={(e) => setTruckForm({ ...truckForm, width: e.target.value })}
                        />
                        <Input
                          placeholder="Height"
                          value={truckForm.height}
                          onChange={(e) => setTruckForm({ ...truckForm, height: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input
                        value={truckForm.imageUrl}
                        onChange={(e) => setTruckForm({ ...truckForm, imageUrl: e.target.value })}
                        placeholder="https://example.com/truck.jpg"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddTruckOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddTruck}>Add Truck</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrucks.map((truck) => (
                <Card key={truck._id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {truck.images[0]?.url ? (
                      <img src={truck.images[0].url} alt={truck.plateNumber} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Truck className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={truck.assignedDriver ? 'default' : 'secondary'}>
                        {truck.assignedDriver ? 'Assigned' : 'Available'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{truck.plateNumber}</h3>
                        <p className="text-xs text-muted-foreground">{truck.truckId}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="mb-3">{getTruckTypeLabel(truck.truckType)}</Badge>
                    {truck.assignedDriver && (
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{truck.assignedDriver.fullName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {truck.capacity?.weight && <span>{truck.capacity.weight}kg</span>}
                      </div>
                      <div className="flex gap-1">
                        {!truck.assignedDriver && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openAssignDialog(truck)}>
                            <Link2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditTruckDialog(truck)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteTruck(truck._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <Card className="border-slate-200 bg-slate-50/80">
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Logistics Calendar View</h2>
                    <p className="text-sm text-muted-foreground">
                      This now uses the same calendar UI as the other department booking views, but opens each contract straight to its logistics tab.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                      Booked {bookedContracts.length}
                    </Badge>
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
                      Needs Booking {needsBookingContracts.length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <BookingCalendar
              title="Logistics Contract Calendar"
              bookings={approvedContracts.map((contract) => ({
                _id: contract._id,
                date: contract.eventDate,
                createdAt: contract.createdAt,
                type: 'contract' as const,
                clientName: contract.clientName,
                status: contract.logisticsAssignment?.truck
                  ? formatAssignmentStatus(contract.logisticsAssignment.assignmentStatus || 'scheduled')
                  : 'needs_booking',
                venue: contract.venue?.name,
                totalGuests: contract.totalPacks,
              }))}
              getBookingHref={(booking) => `/contracts/${booking._id}?tab=logistics`}
              getBookingActionLabel={() => 'Open Logistics'}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Driver Dialog */}
        <Dialog open={isEditDriverOpen} onOpenChange={setIsEditDriverOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Driver</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={driverForm.firstName} onChange={(e) => setDriverForm({ ...driverForm, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={driverForm.lastName} onChange={(e) => setDriverForm({ ...driverForm, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input value={driverForm.licenseNumber} onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>License Type</Label>
                  <Select value={driverForm.licenseType} onValueChange={(value) => setDriverForm({ ...driverForm, licenseType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {licenseTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>License Expiry</Label>
                  <Input type="date" value={driverForm.licenseExpiry} onChange={(e) => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={driverForm.phone} onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDriverOpen(false)}>Cancel</Button>
              <Button onClick={handleEditDriver}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Truck Dialog */}
        <Dialog open={isEditTruckOpen} onOpenChange={setIsEditTruckOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Truck</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plate Number</Label>
                <Input value={truckForm.plateNumber} onChange={(e) => setTruckForm({ ...truckForm, plateNumber: e.target.value.toUpperCase() })} />
              </div>
              <div className="space-y-2">
                <Label>Truck Type</Label>
                <Select value={truckForm.truckType} onValueChange={(value) => setTruckForm({ ...truckForm, truckType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {truckTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Weight Capacity (kg)</Label>
                  <Input type="number" value={truckForm.weight} onChange={(e) => setTruckForm({ ...truckForm, weight: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Volume (m³)</Label>
                  <Input type="number" value={truckForm.volume} onChange={(e) => setTruckForm({ ...truckForm, volume: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditTruckOpen(false)}>Cancel</Button>
              <Button onClick={handleEditTruck}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Driver Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Driver</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Assign a driver to <strong>{selectedTruck?.plateNumber}</strong>
              </p>
              <div className="space-y-2">
                <Label>Select Driver</Label>
                <Select value={selectedDriver?._id} onValueChange={(value) => setSelectedDriver(drivers.find(d => d._id === value) || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map(driver => (
                      <SelectItem key={driver._id} value={driver._id}>{driver.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignDriver} disabled={!selectedDriver}>Assign Driver</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}
