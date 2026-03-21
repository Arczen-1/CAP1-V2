import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { ChefHat, Plus, Search, AlertTriangle, Utensils, Package, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface KitchenItem {
  _id: string;
  itemCode: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  minimumStock: number;
  unit: string;
  condition: string;
  status: string;
  brand?: string;
  model?: string;
  expiryDate?: string;
  purchasePrice?: number;
  images?: Array<{ url: string; caption: string; isPrimary: boolean }>;
  notes?: string;
}

const CATEGORIES = ['Utensil', 'Cookware', 'Serveware', 'Appliance', 'Tool', 'Container', 'Ingredient', 'Other'];
const CONDITIONS = ['excellent', 'good', 'fair', 'poor', 'damaged'];
const STATUSES = ['available', 'in_use', 'reserved', 'maintenance', 'retired'];
const UNITS = ['piece', 'set', 'dozen', 'kg', 'g', 'L', 'mL', 'box', 'pack'];

export default function KitchenInventory() {
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KitchenItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: 0,
    minimumStock: 5,
    unit: 'piece',
    condition: 'good',
    status: 'available',
    brand: '',
    model: '',
    expiryDate: '',
    purchasePrice: 0,
    notes: ''
  });

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, []);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const queryParams = showLowStock ? '?lowStock=true' : '';
      const data = await api.request(`/kitchen-inventory${queryParams}`);
      setItems(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.request('/kitchen-inventory/stats/overview');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(formData.purchasePrice) <= 0) {
      toast.error('Set a price per unit before saving');
      return;
    }

    try {
      const dataToSend: any = { ...formData };
      if (!dataToSend.expiryDate) delete dataToSend.expiryDate;

      if (editingItem) {
        await api.request(`/kitchen-inventory/${editingItem._id}`, {
          method: 'PUT',
          body: JSON.stringify(dataToSend)
        });
        toast.success('Item updated successfully');
      } else {
        await api.request('/kitchen-inventory', {
          method: 'POST',
          body: JSON.stringify(dataToSend)
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
      await api.request(`/kitchen-inventory/${id}`, { method: 'DELETE' });
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
      minimumStock: 5,
      unit: 'piece',
      condition: 'good',
      status: 'available',
      brand: '',
      model: '',
      expiryDate: '',
      purchasePrice: 0,
      notes: ''
    });
  };

  const openEditDialog = (item: KitchenItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      quantity: item.quantity,
      minimumStock: item.minimumStock,
      unit: item.unit,
      condition: item.condition,
      status: item.status,
      brand: item.brand || '',
      model: item.model || '',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      purchasePrice: item.purchasePrice || 0,
      notes: item.notes || ''
    });
    setIsDialogOpen(true);
  };

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
      return 'Not set';
    }

    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                         item.itemCode.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    const expiry = new Date(date);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return expiry <= thirtyDays && expiry >= new Date();
  };

  const isExpired = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ChefHat className="h-8 w-8" />
              Kitchen Inventory
            </h1>
            <p className="text-muted-foreground">
              Manage utensils, cookware, appliances, and ingredients
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingItem(null); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Item Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Stainless Steel Spoon"
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Min Stock</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.minimumStock}
                      onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(v) => setFormData({ ...formData, unit: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                      </Select>
                    </div>
                  </div>
                <div>
                  <Label>Price Per Unit (PHP) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    required
                  />
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
                          <SelectItem key={s} value={s}>{s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Brand</Label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g., KitchenAid"
                    />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <Input
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g., KSM150"
                    />
                  </div>
                </div>
                <div>
                  <Label>Expiry Date (for consumables)</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
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

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-blue-500" />
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
                  <Calendar className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expiring Soon</p>
                    <p className="text-2xl font-bold">{stats.expiringSoon || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <Button
            variant={showLowStock ? 'default' : 'outline'}
            onClick={() => { setShowLowStock(!showLowStock); fetchItems(); }}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Low Stock
          </Button>
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No items found
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item._id} className={item.availableQuantity <= item.minimumStock ? 'border-orange-300' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{item.itemCode}</p>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </div>
                    <Badge className={getStatusBadge(item.status)}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Available</span>
                    <span className={`font-medium ${item.availableQuantity <= item.minimumStock ? 'text-orange-600' : ''}`}>
                      {item.availableQuantity} {item.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price / Unit</span>
                    <span className="font-medium">{formatCurrency(item.purchasePrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Condition</span>
                    <Badge variant="outline" className={getConditionBadge(item.condition)}>
                      {item.condition}
                    </Badge>
                  </div>
                  {(item.brand || item.model) && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Brand/Model</span>
                      <span className="font-medium text-sm">
                        {[item.brand, item.model].filter(Boolean).join(' ')}
                      </span>
                    </div>
                  )}
                  {item.expiryDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Expires</span>
                      <span className={`font-medium text-sm ${isExpired(item.expiryDate) ? 'text-red-600' : isExpiringSoon(item.expiryDate) ? 'text-orange-600' : ''}`}>
                        {format(new Date(item.expiryDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  {item.availableQuantity <= item.minimumStock && (
                    <div className="flex items-center gap-2 text-orange-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Low stock warning
                    </div>
                  )}
                  {isExpired(item.expiryDate) && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Item expired!
                    </div>
                  )}
                  {isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate) && (
                    <div className="flex items-center gap-2 text-orange-600 text-sm">
                      <Calendar className="h-4 w-4" />
                      Expiring soon
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item._id)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
