import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, User, Briefcase, UserPlus } from 'lucide-react';

const staffRoles = [
  { value: 'waiter', label: 'Waiter' },
  { value: 'waitress', label: 'Waitress' },
  { value: 'event_manager', label: 'Event Manager' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'head_captain', label: 'Head Captain' },
  { value: 'bartender', label: 'Bartender' },
  { value: 'food_runner', label: 'Food Runner' },
  { value: 'busser', label: 'Busser' },
  { value: 'setup_crew', label: 'Setup Crew' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'other', label: 'Other' }
];

const employmentTypes = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contractual', label: 'Contractual' },
  { value: 'on_call', label: 'On Call' }
];

interface BanquetStaffMember {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  employmentType: string;
  phone?: string;
  hasAccount: boolean;
  accountEmail?: string;
  ratePerDay: number;
  ratePerHour: number;
  totalEventsWorked: number;
  joinDate?: string;
}

export default function BanquetStaff() {
  const [staff, setStaff] = useState<BanquetStaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<BanquetStaffMember | null>(null);
  const [stats, setStats] = useState({ total: 0, byRole: [] as any[] });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    employmentType: 'full_time',
    ratePerDay: '',
    ratePerHour: ''
  });
  const [accountData, setAccountData] = useState({
    password: '',
    department: 'banquet'
  });

  useEffect(() => {
    fetchStaff();
    fetchStats();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await api.request('/banquet-staff');
      setStaff(response as BanquetStaffMember[]);
    } catch (error) {
      toast.error('Failed to fetch staff members');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.request('/banquet-staff/stats/overview');
      setStats(response as { total: number; byRole: any[] });
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleAddStaff = async () => {
    try {
      await api.request('/banquet-staff', {
        method: 'POST',
        body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        employmentType: formData.employmentType,
        ratePerDay: parseFloat(formData.ratePerDay) || 0,
        ratePerHour: parseFloat(formData.ratePerHour) || 0
      }),
      });
      toast.success('Staff member added successfully');
      setIsAddDialogOpen(false);
      resetForm();
      fetchStaff();
      fetchStats();
    } catch (error) {
      toast.error('Failed to add staff member');
    }
  };

  const handleEditStaff = async () => {
    if (!selectedStaff) return;
    try {
      await api.request(`/banquet-staff/${selectedStaff._id}`, {
        method: 'PUT',
        body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        employmentType: formData.employmentType,
        ratePerDay: parseFloat(formData.ratePerDay) || 0,
        ratePerHour: parseFloat(formData.ratePerHour) || 0
      }),
      });
      toast.success('Staff member updated successfully');
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
      resetForm();
      fetchStaff();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update staff member');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await api.request(`/banquet-staff/${staffId}`, { method: 'DELETE' });
      toast.success('Staff member deleted successfully');
      fetchStaff();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete staff member');
    }
  };

  const handleCreateAccount = async () => {
    if (!selectedStaff) return;
    try {
      await api.request(`/banquet-staff/${selectedStaff._id}/create-account`, {
        method: 'POST',
        body: JSON.stringify({
          password: accountData.password,
          department: accountData.department
        })
      });
      toast.success('Account created successfully');
      setIsAccountDialogOpen(false);
      setSelectedStaff(null);
      setAccountData({ password: '', department: 'banquet' });
      fetchStaff();
    } catch (error) {
      toast.error('Failed to create account');
    }
  };

  const openEditDialog = (staff: BanquetStaffMember) => {
    setSelectedStaff(staff);
    setFormData({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role,
      employmentType: staff.employmentType,
      ratePerDay: staff.ratePerDay?.toString() || '',
      ratePerHour: staff.ratePerHour?.toString() || ''
    });
    setIsEditDialogOpen(true);
  };

  const openAccountDialog = (staff: BanquetStaffMember) => {
    setSelectedStaff(staff);
    setIsAccountDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      employmentType: 'full_time',
      ratePerDay: '',
      ratePerHour: ''
    });
  };

  const getRoleLabel = (role: string) => {
    return staffRoles.find(r => r.value === role)?.label || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      event_manager: 'bg-purple-100 text-purple-800',
      supervisor: 'bg-blue-100 text-blue-800',
      head_captain: 'bg-green-100 text-green-800',
      bartender: 'bg-yellow-100 text-yellow-800',
      waiter: 'bg-gray-100 text-gray-800',
      waitress: 'bg-gray-100 text-gray-800',
      food_runner: 'bg-orange-100 text-orange-800',
      busser: 'bg-pink-100 text-pink-800',
      setup_crew: 'bg-cyan-100 text-cyan-800',
      coordinator: 'bg-indigo-100 text-indigo-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Banquet Staff</h1>
            <p className="text-muted-foreground">Manage banquet staff members and their accounts</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffRoles.map(role => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select value={formData.employmentType} onValueChange={(value) => setFormData({ ...formData, employmentType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rate per Day ($)</Label>
                    <Input
                      type="number"
                      value={formData.ratePerDay}
                      onChange={(e) => setFormData({ ...formData, ratePerDay: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rate per Hour ($)</Label>
                    <Input
                      type="number"
                      value={formData.ratePerHour}
                      onChange={(e) => setFormData({ ...formData, ratePerHour: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddStaff}>Add Staff</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          {stats.byRole?.slice(0, 3).map((roleStat: any) => (
            <Card key={roleStat._id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{getRoleLabel(roleStat._id)}</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roleStat.count}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {staffRoles.map(role => (
                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Staff Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Staff Member</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Employment</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Rates</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Account</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStaff.map((member) => (
                    <tr key={member._id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{member.fullName}</p>
                            <p className="text-xs text-muted-foreground">{member.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getRoleColor(member.role)}>
                          {getRoleLabel(member.role)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm capitalize">{member.employmentType.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p>${member.ratePerDay}/day</p>
                          <p className="text-muted-foreground">${member.ratePerHour}/hr</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {member.hasAccount ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <User className="h-3 w-3 mr-1" />
                            Has Account
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAccountDialog(member)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Create
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(member)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteStaff(member._id)}>
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

        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No staff members found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={formData.employmentType} onValueChange={(value) => setFormData({ ...formData, employmentType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rate per Day ($)</Label>
                  <Input type="number" value={formData.ratePerDay} onChange={(e) => setFormData({ ...formData, ratePerDay: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Rate per Hour ($)</Label>
                  <Input type="number" value={formData.ratePerHour} onChange={(e) => setFormData({ ...formData, ratePerHour: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditStaff}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Account Dialog */}
        <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create User Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Create a login account for <strong>{selectedStaff?.fullName}</strong>
              </p>
              <div className="space-y-2">
                <Label>Email (Username)</Label>
                <Input value={selectedStaff?.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={accountData.password}
                  onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="space-y-2">
                <Label>Department Access</Label>
                <Select value={accountData.department} onValueChange={(value) => setAccountData({ ...accountData, department: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banquet">Banquet</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="accounting">Accounting</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="linen">Linen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAccount}>Create Account</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
