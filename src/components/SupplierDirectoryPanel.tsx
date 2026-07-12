import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import InventoryPagination from '@/components/InventoryPagination';
import { toast } from 'sonner';
import { Building2, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { ProcurementDepartment, ProcurementRequestType, ProcurementSupplierSummary } from '@/lib/procurement';
import { PROCUREMENT_DEPARTMENT_LABELS, PROCUREMENT_REQUEST_TYPE_LABELS } from '@/lib/procurement';

const DEPARTMENT_OPTIONS: ProcurementDepartment[] = ['creative', 'linen', 'stockroom'];
const REQUEST_TYPE_OPTIONS: ProcurementRequestType[] = ['purchase', 'rental'];
const ITEMS_PER_PAGE = 12;

const buildSupplierForm = (supplier?: ProcurementSupplierSummary | null) => ({
  name: supplier?.name || '',
  contactPerson: supplier?.contactPerson || '',
  phone: supplier?.phone || '',
  email: supplier?.email || '',
  address: supplier?.address || '',
  city: supplier?.city || '',
  province: supplier?.province || '',
  serviceAreas: (supplier?.serviceAreas || []).join(', '),
  departments: supplier?.departments || [],
  requestTypes: supplier?.requestTypes || [],
  supportedCategories: (supplier?.supportedCategories || []).join(', '),
  supportedKeywords: (supplier?.supportedKeywords || []).join(', '),
  isPreferred: Boolean(supplier?.isPreferred),
  priority: String(supplier?.priority ?? 0),
  notes: supplier?.notes || '',
  isActive: supplier?.isActive ?? true,
});

interface SupplierDirectoryPanelProps {
  suppliers: ProcurementSupplierSummary[];
  onRefresh: () => Promise<void> | void;
}

const normalizeText = (value?: string | null) => String(value || '').trim().toLowerCase();

export default function SupplierDirectoryPanel({
  suppliers,
  onRefresh,
}: SupplierDirectoryPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ProcurementSupplierSummary | null>(null);
  const [formData, setFormData] = useState(buildSupplierForm());
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | ProcurementDepartment>('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState<'all' | ProcurementRequestType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'preferred'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const supplierStats = useMemo(() => ({
    total: suppliers.length,
    active: suppliers.filter((supplier) => supplier.isActive !== false).length,
    preferred: suppliers.filter((supplier) => supplier.isPreferred).length,
    inactive: suppliers.filter((supplier) => supplier.isActive === false).length,
  }), [suppliers]);

  const sortedSuppliers = useMemo(
    () => [...suppliers].sort((left, right) => (
      Number(right.isPreferred) - Number(left.isPreferred)
      || Number(right.priority || 0) - Number(left.priority || 0)
      || left.name.localeCompare(right.name)
    )),
    [suppliers]
  );

  const filteredSuppliers = useMemo(() => (
    sortedSuppliers.filter((supplier) => {
      const matchesSearch = !search.trim() || [
        supplier.name,
        supplier.contactPerson,
        supplier.phone,
        supplier.email,
        supplier.address,
        supplier.city,
        supplier.province,
        ...(supplier.serviceAreas || []),
        ...(supplier.supportedCategories || []),
        ...(supplier.supportedKeywords || []),
      ].some((value) => normalizeText(value).includes(normalizeText(search)));

      const matchesDepartment = departmentFilter === 'all'
        || (supplier.departments || []).includes(departmentFilter);

      const matchesRequestType = requestTypeFilter === 'all'
        || (supplier.requestTypes || []).includes(requestTypeFilter);

      const matchesStatus = (
        statusFilter === 'all'
        || (statusFilter === 'active' && supplier.isActive !== false)
        || (statusFilter === 'inactive' && supplier.isActive === false)
        || (statusFilter === 'preferred' && supplier.isPreferred)
      );

      return matchesSearch && matchesDepartment && matchesRequestType && matchesStatus;
    })
  ), [sortedSuppliers, search, departmentFilter, requestTypeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE));
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, departmentFilter, requestTypeFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const openCreateDialog = () => {
    setEditingSupplier(null);
    setFormData(buildSupplierForm());
    setDialogOpen(true);
  };

  const openEditDialog = (supplier: ProcurementSupplierSummary) => {
    setEditingSupplier(supplier);
    setFormData(buildSupplierForm(supplier));
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingSupplier(null);
      setFormData(buildSupplierForm());
    }
  };

  const toggleSelection = <T extends string>(list: T[], value: T) => (
    list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]
  );

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    if (formData.departments.length === 0) {
      toast.error('Select at least one department');
      return;
    }

    if (formData.requestTypes.length === 0) {
      toast.error('Select at least one request type');
      return;
    }

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        province: formData.province.trim(),
        serviceAreas: formData.serviceAreas,
        supportedCategories: formData.supportedCategories,
        supportedKeywords: formData.supportedKeywords,
        priority: Number(formData.priority || 0),
        notes: formData.notes.trim(),
      };

      if (editingSupplier) {
        await api.updateSupplier(editingSupplier._id, payload);
        toast.success('Supplier updated');
      } else {
        await api.createSupplier(payload);
        toast.success('Supplier added');
      }

      handleDialogOpenChange(false);
      await onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save supplier');
    }
  };

  const handleDelete = async (supplier: ProcurementSupplierSummary) => {
    if (!confirm(`Delete supplier "${supplier.name}"?`)) {
      return;
    }

    try {
      await api.deleteSupplier(supplier._id);
      toast.success('Supplier deleted');
      await onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete supplier');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Supplier Database</h2>
          <p className="text-sm text-muted-foreground">
            Manage supplier coverage in one place so purchasing reports can recommend the right vendor by department, request type, item category, and service area.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Supplier Name *</Label>
                  <Input value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input value={formData.contactPerson} onChange={(event) => setFormData((current) => ({ ...current, contactPerson: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={formData.city} onChange={(event) => setFormData((current) => ({ ...current, city: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Province</Label>
                  <Input value={formData.province} onChange={(event) => setFormData((current) => ({ ...current, province: event.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formData.address} onChange={(event) => setFormData((current) => ({ ...current, address: event.target.value }))} />
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">Supports Departments *</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {DEPARTMENT_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-3 rounded-lg border p-3">
                      <Checkbox
                        checked={formData.departments.includes(option)}
                        onCheckedChange={() => setFormData((current) => ({
                          ...current,
                          departments: toggleSelection(current.departments, option),
                        }))}
                      />
                      <span className="text-sm">{PROCUREMENT_DEPARTMENT_LABELS[option]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">Supports Request Types *</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {REQUEST_TYPE_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-3 rounded-lg border p-3">
                      <Checkbox
                        checked={formData.requestTypes.includes(option)}
                        onCheckedChange={() => setFormData((current) => ({
                          ...current,
                          requestTypes: toggleSelection(current.requestTypes, option),
                        }))}
                      />
                      <span className="text-sm">{PROCUREMENT_REQUEST_TYPE_LABELS[option]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Service Areas</Label>
                  <Textarea
                    rows={3}
                    value={formData.serviceAreas}
                    onChange={(event) => setFormData((current) => ({ ...current, serviceAreas: event.target.value }))}
                    placeholder="Batangas City, Lipa City, Santo Tomas"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supported Categories</Label>
                  <Textarea
                    rows={3}
                    value={formData.supportedCategories}
                    onChange={(event) => setFormData((current) => ({ ...current, supportedCategories: event.target.value }))}
                    placeholder="tables, chairs, utensils"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Keyword Matches</Label>
                  <Textarea
                    rows={3}
                    value={formData.supportedKeywords}
                    onChange={(event) => setFormData((current) => ({ ...current, supportedKeywords: event.target.value }))}
                    placeholder="table, chair, glass, backdrop"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.priority}
                    onChange={(event) => setFormData((current) => ({ ...current, priority: event.target.value }))}
                  />
                  <label className="flex items-center gap-3 rounded-lg border p-3">
                    <Checkbox
                      checked={formData.isPreferred}
                      onCheckedChange={(checked) => setFormData((current) => ({ ...current, isPreferred: Boolean(checked) }))}
                    />
                    <span className="text-sm">Preferred supplier</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border p-3">
                    <Checkbox
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData((current) => ({ ...current, isActive: Boolean(checked) }))}
                    />
                    <span className="text-sm">Active for new requests</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Price notes, delivery reminders, or supplier limitations."
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                {editingSupplier ? 'Save Supplier Changes' : 'Add Supplier'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplierStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{supplierStats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Preferred</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{supplierStats.preferred}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{supplierStats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search supplier, contact, area, or item keyword..."
            className="pl-10"
          />
        </div>
        <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value as 'all' | ProcurementDepartment)}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENT_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {PROCUREMENT_DEPARTMENT_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={requestTypeFilter} onValueChange={(value) => setRequestTypeFilter(value as 'all' | ProcurementRequestType)}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Request Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {REQUEST_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {PROCUREMENT_REQUEST_TYPE_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive' | 'preferred')}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="preferred">Preferred</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-lg font-medium">No suppliers saved yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add supplier entries here so purchasing can auto-fill reports with the best vendor match.
            </p>
          </CardContent>
        </Card>
      ) : filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-lg font-medium">No suppliers match the current filters</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try clearing the search or changing the department, request type, or status filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[240px]">Supplier</TableHead>
                    <TableHead className="min-w-[220px]">Coverage</TableHead>
                    <TableHead className="min-w-[220px]">Service Area</TableHead>
                    <TableHead className="min-w-[220px]">Contact</TableHead>
                    <TableHead className="min-w-[160px]">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSuppliers.map((supplier) => (
                    <TableRow key={supplier._id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{supplier.name}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {supplier.address || 'No address saved'}
                          </p>
                          {supplier.notes ? (
                            <p className="text-xs text-muted-foreground">
                              {supplier.notes}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {(supplier.departments || []).map((department) => (
                              <Badge key={department} variant="outline">
                                {PROCUREMENT_DEPARTMENT_LABELS[department]}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(supplier.requestTypes || []).map((requestType) => (
                              <Badge key={requestType} variant="outline">
                                {PROCUREMENT_REQUEST_TYPE_LABELS[requestType]}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(supplier.supportedCategories || []).join(', ') || 'No categories saved'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{[supplier.city, supplier.province].filter(Boolean).join(', ') || 'No city or province saved'}</span>
                          </div>
                          <p className="text-muted-foreground">
                            {(supplier.serviceAreas || []).join(', ') || 'No service areas saved'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{supplier.contactPerson || 'No contact person saved'}</p>
                          <p className="text-muted-foreground">{supplier.phone || 'No phone saved'}</p>
                          <p className="text-muted-foreground">{supplier.email || 'No email saved'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant="outline"
                              className={supplier.isActive === false ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}
                            >
                              {supplier.isActive === false ? 'Inactive' : 'Active'}
                            </Badge>
                            {supplier.isPreferred ? (
                              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-900">
                                Preferred
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Priority {supplier.priority || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(supplier.supportedKeywords || []).join(', ') || 'No keywords saved'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(supplier)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(supplier)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <InventoryPagination
              currentPage={currentPage}
              pageSize={ITEMS_PER_PAGE}
              totalItems={filteredSuppliers.length}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
