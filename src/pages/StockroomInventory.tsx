import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import InventoryPagination from '@/components/InventoryPagination';
import DepartmentProcurementPanel from '@/components/DepartmentProcurementPanel';
import { buildGoogleImageSearchUrl } from '@/lib/photoSearch';
import { Package, Plus, Search, AlertTriangle, Box, Warehouse, Wrench, Image as ImageIcon, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface StockroomItem {
  _id: string;
  itemCode: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  minimumStock: number;
  condition: string;
  status: string;
  images?: Array<{ url: string; caption: string; isPrimary: boolean }>;
  referenceUrl?: string;
  storageLocation?: {
    warehouse: string;
    section: string;
    shelf: string;
    bin: string;
  };
  rentalPricePerDay?: number;
  purchasePrice?: number;
  notes?: string;
}

const CATEGORIES = ['Chair', 'Table', 'Tent', 'Equipment', 'Tool', 'Decor', 'Other'];
const CONDITIONS = ['excellent', 'good', 'fair', 'poor', 'damaged'];
const STATUSES = ['available', 'in_use', 'reserved', 'maintenance', 'retired'];
const ITEMS_PER_PAGE = 12;

export default function StockroomInventory() {
  const [items, setItems] = useState<StockroomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stats, setStats] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockroomItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: 0,
    minimumStock: 10,
    condition: 'good',
    status: 'available',
    rentalPricePerDay: 0,
    notes: ''
  });

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, []);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const data = await api.request('/stockroom-inventory');
      setItems(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.request('/stockroom-inventory/stats/overview');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.request(`/stockroom-inventory/${editingItem._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        toast.success('Item updated successfully');
      } else {
        await api.request('/stockroom-inventory', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast.success('Item created successfully');
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
      fetchItems();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.request(`/stockroom-inventory/${id}`, { method: 'DELETE' });
      toast.success('Item deleted successfully');
      fetchItems();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      quantity: 0,
      minimumStock: 10,
      condition: 'good',
      status: 'available',
      rentalPricePerDay: 0,
      notes: ''
    });
  };

  const openEditDialog = (item: StockroomItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      quantity: item.quantity,
      minimumStock: item.minimumStock,
      condition: item.condition,
      status: item.status,
      rentalPricePerDay: item.rentalPricePerDay || 0,
      notes: item.notes || ''
    });
    setIsDialogOpen(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
      || item.itemCode.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      reserved: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-orange-100 text-orange-800',
      retired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getConditionBadge = (condition: string) => {
    const colors: Record<string, string> = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-orange-100 text-orange-800',
      damaged: 'bg-red-100 text-red-800'
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
      return 'Not set';
    }

    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(value);
  };

  const procurementItems = items.map((item) => ({
    _id: item._id,
    itemCode: item.itemCode,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    availableQuantity: item.availableQuantity,
    minimumStock: item.minimumStock,
    status: item.status,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              <Warehouse className="h-8 w-8" />
              Stockroom Inventory
            </h1>
            <p className="text-muted-foreground">
              Manage chairs, tables, tents, and equipment
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingItem(null); resetForm(); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Item Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Round Table 6ft"
                    required
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Item description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Minimum Stock</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.minimumStock}
                      onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Condition</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(v) => setFormData({ ...formData, condition: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITIONS.map(c => (
                          <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/^\w/, char => char.toUpperCase())}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Rental Price Per Day (PHP)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.rentalPricePerDay}
                    onChange={(e) => setFormData({ ...formData, rentalPricePerDay: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingItem ? 'Update Item' : 'Create Item'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="reports">Purchasing Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            {stats && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Box className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Items</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Available</p>
                        <p className="text-2xl font-bold">{stats.availableQuantity || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Low Stock</p>
                        <p className="text-2xl font-bold">{stats.lowStock || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">In Maintenance</p>
                        <p className="text-2xl font-bold">{stats.inMaintenance || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No items found
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[300px]">Item</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedItems.map((item) => (
                          <TableRow key={item._id} className={item.availableQuantity <= item.minimumStock ? 'bg-orange-50/40' : ''}>
                            <TableCell className="align-top">
                              <div className="flex min-w-[280px] items-start gap-3">
                                <a
                                  href={item.referenceUrl || buildGoogleImageSearchUrl(item.name, item.category)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted shadow-sm transition hover:opacity-95 hover:shadow-md"
                                >
                                  {item.images?.[0]?.url ? (
                                    <img src={item.images[0].url} alt={item.name} className="h-full w-full object-cover object-center" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </a>
                                <div className="space-y-1">
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">{item.itemCode}</p>
                                  <a
                                    href={item.referenceUrl || buildGoogleImageSearchUrl(item.name, item.category)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Photo references
                                  </a>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top whitespace-normal">
                              <div className="space-y-2">
                                <Badge variant="outline">{item.category}</Badge>
                                <div>
                                  <Badge variant="outline" className={getConditionBadge(item.condition)}>
                                    {item.condition}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="space-y-1 text-sm">
                                <p className={`font-medium ${item.availableQuantity <= item.minimumStock ? 'text-orange-700' : ''}`}>
                                  {item.availableQuantity} available
                                </p>
                                <p className="text-muted-foreground">{item.quantity} total units</p>
                                {item.availableQuantity <= item.minimumStock ? (
                                  <div className="flex items-center gap-1 text-xs text-orange-700">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Low stock
                                  </div>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <Badge className={getStatusBadge(item.status)}>
                                {item.status.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top text-right font-medium">
                              {formatCurrency(item.rentalPricePerDay || item.purchasePrice)}
                            </TableCell>
                            <TableCell className="align-top text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item._id)}>
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
                    totalItems={filteredItems.length}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports">
            <DepartmentProcurementPanel department="stockroom" inventoryItems={procurementItems} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
