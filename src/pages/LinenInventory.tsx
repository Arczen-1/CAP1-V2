import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Shirt, AlertTriangle, Package, WashingMachine } from 'lucide-react';

const categories = ['Tablecloth', 'Napkin', 'Runner', 'Overlay', 'Chair Cover', 'Sash', 'Skirting', 'Other'];
const sizes = ['small', 'medium', 'large', 'extra_large', 'round_60', 'round_72', 'round_90', 'banquet', 'custom'];
const materials = ['Polyester', 'Satin', 'Cotton', 'Linen', 'Spandex', 'Taffeta', 'Organza', 'Velvet', 'Other'];
const statuses = ['available', 'in_use', 'laundry', 'maintenance', 'retired'];

interface LinenItem {
  _id: string;
  itemCode: string;
  name: string;
  category: string;
  size: string;
  material: string;
  color: string;
  images: { url: string; caption: string; isPrimary: boolean }[];
  quantity: number;
  availableQuantity: number;
  minimumStock: number;
  washCount: number;
  status: string;
  acquisition?: {
    cost?: number;
  };
}

export default function LinenInventory() {
  const [items, setItems] = useState<LinenItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LinenItem | null>(null);
  const [stats, setStats] = useState({ total: 0, available: 0, inLaundry: 0, lowStock: 0 });
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    size: '',
    material: '',
    color: '',
    quantity: 1,
    minimumStock: 10,
    status: 'available',
    imageUrl: ''
  });

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await api.request('/linen-inventory');
      setItems(data as LinenItem[]);
    } catch (error) {
      toast.error('Failed to fetch linen items');
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.request('/linen-inventory/stats/overview');
      setStats({
        total: data.total || 0,
        available: data.available || 0,
        inLaundry: data.laundry || 0,
        lowStock: Array.isArray(data.lowStock) ? data.lowStock.length : data.lowStock || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleAddItem = async () => {
    try {
      await api.request('/linen-inventory', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          size: formData.size,
          material: formData.material,
          color: formData.color,
          quantity: parseInt(formData.quantity.toString(), 10),
          minimumStock: parseInt(formData.minimumStock.toString(), 10),
          status: formData.status,
          images: formData.imageUrl ? [{ url: formData.imageUrl, caption: 'Primary image', isPrimary: true }] : []
        })
      });
      toast.success('Item added successfully');
      setIsAddDialogOpen(false);
      resetForm();
      fetchItems();
      fetchStats();
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleEditItem = async () => {
    if (!selectedItem) return;

    try {
      await api.request(`/linen-inventory/${selectedItem._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          size: formData.size,
          material: formData.material,
          color: formData.color,
          quantity: parseInt(formData.quantity.toString(), 10),
          minimumStock: parseInt(formData.minimumStock.toString(), 10),
          status: formData.status,
          images: formData.imageUrl ? [{ url: formData.imageUrl, caption: 'Primary image', isPrimary: true }] : selectedItem.images
        })
      });
      toast.success('Item updated successfully');
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      fetchItems();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.request(`/linen-inventory/${itemId}`, { method: 'DELETE' });
      toast.success('Item deleted successfully');
      fetchItems();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const openEditDialog = (item: LinenItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      size: item.size,
      material: item.material,
      color: item.color,
      quantity: item.quantity,
      minimumStock: item.minimumStock,
      status: item.status,
      imageUrl: item.images[0]?.url || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      size: '',
      material: '',
      color: '',
      quantity: 1,
      minimumStock: 10,
      status: 'available',
      imageUrl: ''
    });
  };

  const isLowStock = (item: LinenItem) => item.availableQuantity <= item.minimumStock;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      laundry: 'bg-sky-100 text-sky-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-slate-100 text-slate-700'
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
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

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      || item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
      || item.color.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Linen Inventory</h1>
            <p className="text-muted-foreground">Manage table linens, napkins, and accessories</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Linen Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., White Polyester Tablecloth"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizes.map(size => (
                          <SelectItem key={size} value={size}>{size.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Select value={formData.material} onValueChange={(value) => setFormData({ ...formData, material: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map(mat => (
                          <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="e.g., White, Navy Blue"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Stock</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.minimumStock}
                      onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value, 10) || 10 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <Shirt className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Laundry</CardTitle>
              <WashingMachine className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inLaundry}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items by name, code, or color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">Item</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Price / Item</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="align-top">
                        <div className="flex min-w-[280px] items-start gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                            {item.images[0]?.url ? (
                              <img
                                src={item.images[0].url}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Shirt className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.itemCode}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-normal">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{item.category}</Badge>
                            <Badge variant="outline">{item.size.replace(/_/g, ' ')}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.material} | {item.color}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1 text-sm">
                          <p className={`font-medium ${isLowStock(item) ? 'text-red-600' : ''}`}>
                            {item.availableQuantity} available
                          </p>
                          <p className="text-muted-foreground">{item.quantity} total units</p>
                          {isLowStock(item) ? (
                            <div className="flex items-center gap-1 text-xs text-red-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Low stock
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top text-right font-medium">
                        {formatCurrency(item.acquisition?.cost)}
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteItem(item._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {filteredItems.length === 0 && (
          <div className="py-12 text-center">
            <Shirt className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Linen Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map(size => (
                        <SelectItem key={size} value={size}>{size.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select value={formData.material} onValueChange={(value) => setFormData({ ...formData, material: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map(mat => (
                        <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" min={1} value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })} />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Stock</Label>
                  <Input type="number" min={1} value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value, 10) || 10 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditItem}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
