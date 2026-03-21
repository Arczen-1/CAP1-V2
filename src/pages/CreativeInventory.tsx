import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import InventoryPagination from '@/components/InventoryPagination';
import DepartmentProcurementPanel from '@/components/DepartmentProcurementPanel';
import { buildGoogleImageSearchUrl } from '@/lib/photoSearch';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Package, Wrench, ExternalLink, ClipboardCheck, FilePenLine } from 'lucide-react';

const categories = ['Backdrop', 'Table Decor', 'Lighting', 'Floral', 'Signage', 'Props', 'Drapery', 'Centerpiece', 'Other'];
const conditions = ['excellent', 'good', 'fair', 'needs_repair', 'damaged'];
const statuses = ['available', 'in_use', 'maintenance', 'retired'];
const ITEMS_PER_PAGE = 12;

interface CreativeItem {
  _id: string;
  itemCode: string;
  name: string;
  category: string;
  images: { url: string; caption: string; isPrimary: boolean }[];
  referenceUrl?: string;
  quantity: number;
  availableQuantity: number;
  pricePerItem?: number;
  condition: string;
  status: string;
  acquisition?: {
    cost?: number;
  };
  dimensions?: { length?: number; width?: number; height?: number; weight?: number };
}

interface CreativeContract {
  _id: string;
  contractNumber: string;
  createdAt?: string;
  clientName: string;
  eventDate: string;
  status: string;
  preferredColor?: string;
  backdropRequirements?: string;
  tableSetup?: string;
  venue?: { name?: string; address?: string };
  creativeAssets?: Array<{
    item: string;
    quantity: number;
    status?: string;
  }>;
  sectionConfirmations?: {
    creative?: {
      confirmed?: boolean;
      confirmedAt?: string;
      confirmedBy?: string;
    };
  };
}

const CREATIVE_PRE_SIGNATURE_STATUSES = [
  'draft',
  'pending_client_signature',
  'submitted',
  'accounting_review',
] as const;

const isCreativeDraftWorkflowStatus = (status: string) =>
  CREATIVE_PRE_SIGNATURE_STATUSES.includes(status as (typeof CREATIVE_PRE_SIGNATURE_STATUSES)[number]);

const formatStatusLabel = (value?: string) => {
  if (!value) {
    return 'Not set';
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatShortDate = (value?: string) => {
  if (!value) {
    return 'No date';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function CreativeInventory() {
  const [items, setItems] = useState<CreativeItem[]>([]);
  const [contracts, setContracts] = useState<CreativeContract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CreativeItem | null>(null);
  const [stats, setStats] = useState({ total: 0, available: 0, inUse: 0, maintenance: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    pricePerItem: '',
    condition: 'good',
    status: 'available',
    imageUrl: '',
    length: '',
    width: '',
    height: '',
    weight: ''
  });

  useEffect(() => {
    fetchItems();
    fetchStats();
    fetchContracts();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await api.request('/creative-inventory');
      setItems(data as CreativeItem[]);
    } catch (error) {
      toast.error('Failed to fetch inventory items');
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.request('/creative-inventory/stats/overview');
      setStats({
        total: data.total || 0,
        available: data.available || 0,
        inUse: data.inUse || 0,
        maintenance: data.maintenance || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchContracts = async () => {
    try {
      const data = await api.getContracts();
      setContracts(data as CreativeContract[]);
    } catch (error) {
      toast.error('Failed to fetch draft contracts');
    }
  };

  const handleAddItem = async () => {
    const pricePerItem = parseFloat(formData.pricePerItem);
    if (!Number.isFinite(pricePerItem) || pricePerItem <= 0) {
      toast.error('Set a price per item before adding this item');
      return;
    }

    try {
      await api.request('/creative-inventory', {
        method: 'POST',
        body: JSON.stringify({
        name: formData.name,
        category: formData.category,
        quantity: parseInt(formData.quantity.toString()),
        pricePerItem,
        condition: formData.condition,
        status: formData.status,
        images: formData.imageUrl ? [{ url: formData.imageUrl, caption: 'Primary image', isPrimary: true }] : [],
        dimensions: {
          length: formData.length ? parseFloat(formData.length) : undefined,
          width: formData.width ? parseFloat(formData.width) : undefined,
          height: formData.height ? parseFloat(formData.height) : undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined
        }
      })
      });
      toast.success('Item added successfully');
      setIsAddDialogOpen(false);
      resetForm();
      fetchItems();
      fetchStats();
    } catch (error: any) {
      toast.error(error?.errors?.[0]?.msg || error?.errors?.[0]?.message || error.message || 'Failed to add item');
    }
  };

  const handleEditItem = async () => {
    if (!selectedItem) return;

    const pricePerItem = parseFloat(formData.pricePerItem);
    if (!Number.isFinite(pricePerItem) || pricePerItem <= 0) {
      toast.error('Set a price per item before saving');
      return;
    }

    try {
      await api.request(`/creative-inventory/${selectedItem._id}`, {
        method: 'PUT',
        body: JSON.stringify({
        name: formData.name,
        category: formData.category,
        quantity: parseInt(formData.quantity.toString()),
        pricePerItem,
        condition: formData.condition,
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
    } catch (error: any) {
      toast.error(error?.errors?.[0]?.msg || error?.errors?.[0]?.message || error.message || 'Failed to update item');
    }
  };

  const getCreativeItemPrice = (item: CreativeItem) => item.pricePerItem ?? item.acquisition?.cost;

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.request(`/creative-inventory/${itemId}`, { method: 'DELETE' });
      toast.success('Item deleted successfully');
      fetchItems();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const openEditDialog = (item: CreativeItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      pricePerItem: getCreativeItemPrice(item)?.toString() || '',
      condition: item.condition,
      status: item.status,
      imageUrl: item.images[0]?.url || '',
      length: item.dimensions?.length?.toString() || '',
      width: item.dimensions?.width?.toString() || '',
      height: item.dimensions?.height?.toString() || '',
      weight: item.dimensions?.weight?.toString() || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: 1,
      pricePerItem: '',
      condition: 'good',
      status: 'available',
      imageUrl: '',
      length: '',
      width: '',
      height: '',
      weight: ''
    });
  };

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      needs_repair: 'bg-orange-100 text-orange-800',
      damaged: 'bg-red-100 text-red-800'
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-gray-100 text-gray-800'
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
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const procurementItems = items.map((item) => ({
    _id: item._id,
    itemCode: item.itemCode,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    availableQuantity: item.availableQuantity,
    status: item.status,
  }));

  const draftContracts = [...contracts]
    .filter((contract) => isCreativeDraftWorkflowStatus(contract.status))
    .sort((left, right) => {
      const leftTime = new Date(left.createdAt || left.eventDate).getTime();
      const rightTime = new Date(right.createdAt || right.eventDate).getTime();
      return rightTime - leftTime;
    });
  const contractsNeedingConfirmation = draftContracts.filter(
    (contract) => !contract.sectionConfirmations?.creative?.confirmed,
  );
  const confirmedContracts = draftContracts.filter(
    (contract) => contract.sectionConfirmations?.creative?.confirmed,
  );
  const totalCreativeUnitsRequested = draftContracts.reduce((sum, contract) => (
    sum + (contract.creativeAssets?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0)
  ), 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Creative Inventory</h1>
            <p className="text-muted-foreground">Manage creative department assets and decorations</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter item name"
                  />
                </div>
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
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price Per Item (PHP) *</Label>
                  <Input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={formData.pricePerItem}
                    onChange={(e) => setFormData({ ...formData, pricePerItem: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map(cond => (
                          <SelectItem key={cond} value={cond}>{cond.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(status => (
                          <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dimensions (optional)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Length (cm)"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    />
                    <Input
                      placeholder="Width (cm)"
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    />
                    <Input
                      placeholder="Height (cm)"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    />
                    <Input
                      placeholder="Weight (kg)"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="contracts">Draft Contracts</TabsTrigger>
            <TabsTrigger value="reports">Purchasing Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
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
                  <Package className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Use</CardTitle>
                  <Package className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.inUse}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                  <Wrench className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items by name or code..."
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
                        <TableHead className="min-w-[280px]">Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Price / Item</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="align-top">
                            <div className="flex min-w-[260px] items-start gap-3">
                              <a
                                href={item.referenceUrl || buildGoogleImageSearchUrl(item.name, item.category)}
                                target="_blank"
                                rel="noreferrer"
                                className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted shadow-sm transition hover:opacity-95 hover:shadow-md"
                              >
                                {item.images[0]?.url ? (
                                  <img
                                    src={item.images[0].url}
                                    alt={item.name}
                                    className="h-full w-full object-cover object-center"
                                  />
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
                                <Badge className={getConditionColor(item.condition)}>
                                  {item.condition.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-1 text-sm">
                              <p className="font-medium">{item.availableQuantity} available</p>
                              <p className="text-muted-foreground">{item.quantity} total units</p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-top text-right font-medium">
                            {formatCurrency(getCreativeItemPrice(item))}
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
                <InventoryPagination
                  currentPage={currentPage}
                  pageSize={ITEMS_PER_PAGE}
                  totalItems={filteredItems.length}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </CardContent>
            </Card>

            {filteredItems.length === 0 && (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No items found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Draft Contracts</CardTitle>
                  <FilePenLine className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{draftContracts.length}</div>
                  <p className="text-xs text-muted-foreground">Creative can review and edit these before signature</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Needs Confirmation</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{contractsNeedingConfirmation.length}</div>
                  <p className="text-xs text-muted-foreground">Drafts still waiting on creative inventory confirmation</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{confirmedContracts.length}</div>
                  <p className="text-xs text-muted-foreground">Drafts already confirmed by the creative department</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Requested Units</CardTitle>
                  <Package className="h-4 w-4 text-sky-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-sky-600">{totalCreativeUnitsRequested}</div>
                  <p className="text-xs text-muted-foreground">Total creative item quantity currently requested in drafts</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Draft Contract Validation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review draft contracts here, add or adjust creative items, then confirm the creative section from the contract inventory tab.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {draftContracts.length === 0 ? (
                  <div className="py-12 text-center">
                    <ClipboardCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No draft contracts for creative right now</h3>
                    <p className="text-muted-foreground">
                      Draft contracts assigned to the creative workflow will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[220px]">Contract</TableHead>
                          <TableHead className="min-w-[180px]">Event</TableHead>
                          <TableHead className="min-w-[220px]">Creative Plan</TableHead>
                          <TableHead>Confirmation</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {draftContracts.map((contract) => {
                          const creativeItemCount = contract.creativeAssets?.length || 0;
                          const creativeQuantity = contract.creativeAssets?.reduce(
                            (sum, item) => sum + (item.quantity || 0),
                            0,
                          ) || 0;
                          const isConfirmed = Boolean(contract.sectionConfirmations?.creative?.confirmed);

                          return (
                            <TableRow key={contract._id}>
                              <TableCell className="align-top">
                                <div className="space-y-1">
                                  <p className="font-medium">{contract.contractNumber}</p>
                                  <p className="text-sm text-muted-foreground">{contract.clientName}</p>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">{formatStatusLabel(contract.status)}</Badge>
                                    {contract.venue?.name ? (
                                      <Badge variant="secondary">{contract.venue.name}</Badge>
                                    ) : null}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="space-y-1 text-sm">
                                  <p className="font-medium">{formatShortDate(contract.eventDate)}</p>
                                  <p className="text-muted-foreground">Created {formatShortDate(contract.createdAt)}</p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="space-y-1 text-sm">
                                  <p className="font-medium">{creativeItemCount} item(s) | {creativeQuantity} unit(s)</p>
                                  <p className="text-muted-foreground">Color: {contract.preferredColor || 'Not set'}</p>
                                  <p className="text-muted-foreground">Setup: {contract.tableSetup || 'Not set'}</p>
                                  <p className="text-muted-foreground">Backdrop: {contract.backdropRequirements || 'Not specified'}</p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="space-y-2">
                                  <Badge className={isConfirmed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}>
                                    {isConfirmed ? 'Confirmed' : 'Pending confirmation'}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">
                                    {isConfirmed
                                      ? 'Creative already validated this draft.'
                                      : 'Creative still needs to review items before sales can send it forward.'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top text-right">
                                <div className="flex justify-end gap-2">
                                  <Button asChild variant="outline" size="sm">
                                    <Link to={`/contracts/${contract._id}?tab=inventory`}>Open Inventory</Link>
                                  </Button>
                                  <Button asChild size="sm">
                                    <Link to={`/contracts/edit/${contract._id}`}>Update Draft</Link>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <DepartmentProcurementPanel department="creative" inventoryItems={procurementItems} />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
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
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price Per Item (PHP) *</Label>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={formData.pricePerItem}
                  onChange={(e) => setFormData({ ...formData, pricePerItem: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map(cond => (
                        <SelectItem key={cond} value={cond}>{cond.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditItem}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
