import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CalendarClock, ClipboardList, FileText, PackagePlus, ShoppingBag } from 'lucide-react';
import type {
  InventoryProcurementOption,
  ProcurementDepartment,
  ProcurementRequest,
  ProcurementRequestType,
} from '@/lib/procurement';
import {
  formatProcurementCurrency,
  formatProcurementDate,
  getProcurementStatusLabel,
  PROCUREMENT_DEPARTMENT_LABELS,
  PROCUREMENT_REQUEST_TYPE_LABELS,
  PROCUREMENT_SOURCE_LABELS,
  PROCUREMENT_STATUS_STYLES,
} from '@/lib/procurement';

interface DepartmentProcurementPanelProps {
  department: ProcurementDepartment;
  inventoryItems: InventoryProcurementOption[];
}

const getTodayValue = () => new Date().toISOString().slice(0, 10);

const getSuggestedQuantity = (item?: InventoryProcurementOption) => {
  if (!item) {
    return 1;
  }

  if (typeof item.minimumStock === 'number' && item.availableQuantity <= item.minimumStock) {
    return Math.max(1, item.minimumStock - item.availableQuantity);
  }

  return 1;
};

const getSuggestedReason = (item?: InventoryProcurementOption) => {
  if (!item) {
    return '';
  }

  if (typeof item.minimumStock === 'number' && item.availableQuantity <= item.minimumStock) {
    return `Restore ${item.name} to a safe stock level before the next event.`;
  }

  return `Acquire additional ${item.name} for upcoming department needs.`;
};

export default function DepartmentProcurementPanel({
  department,
  inventoryItems,
}: DepartmentProcurementPanelProps) {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    inventoryItemId: '',
    manualItemName: '',
    manualItemCode: '',
    manualItemCategory: '',
    requestType: 'purchase' as ProcurementRequestType,
    requestedQuantity: '1',
    neededBy: getTodayValue(),
    requestReason: '',
    requestNotes: '',
  });

  const sortedInventoryItems = useMemo(
    () => [...inventoryItems].sort((left, right) => left.name.localeCompare(right.name)),
    [inventoryItems]
  );

  const selectedInventoryItem = useMemo(
    () => sortedInventoryItems.find((item) => item._id === formData.inventoryItemId),
    [formData.inventoryItemId, sortedInventoryItems]
  );

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProcurementRequests({ department });
      setRequests(data as ProcurementRequest[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load purchasing reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [department]);

  const resetForm = () => {
    const firstItem = sortedInventoryItems[0];
    setFormData({
      inventoryItemId: firstItem?._id || '',
      manualItemName: '',
      manualItemCode: '',
      manualItemCategory: '',
      requestType: 'purchase',
      requestedQuantity: String(getSuggestedQuantity(firstItem)),
      neededBy: getTodayValue(),
      requestReason: getSuggestedReason(firstItem),
      requestNotes: '',
    });
  };

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    if (!formData.inventoryItemId && sortedInventoryItems[0]?._id) {
      resetForm();
    }
  }, [dialogOpen, formData.inventoryItemId, sortedInventoryItems]);

  const handleInventorySelection = (value: string) => {
    if (value === '__manual__') {
      setFormData((current) => ({
        ...current,
        inventoryItemId: value,
        manualItemName: '',
        manualItemCode: '',
        manualItemCategory: '',
        requestedQuantity: '1',
        requestReason: `Acquire a new ${PROCUREMENT_DEPARTMENT_LABELS[department].toLowerCase()} item for upcoming department needs.`,
      }));
      return;
    }

    const item = sortedInventoryItems.find((entry) => entry._id === value);
    setFormData((current) => ({
      ...current,
      inventoryItemId: value,
      manualItemName: '',
      manualItemCode: '',
      manualItemCategory: '',
      requestedQuantity: String(getSuggestedQuantity(item)),
      requestReason: getSuggestedReason(item),
    }));
  };

  const handleCreateRequest = async () => {
    const requestedQuantity = Number(formData.requestedQuantity);
    const isManualItem = formData.inventoryItemId === '__manual__';

    if (!formData.inventoryItemId) {
      toast.error('Select an inventory item or choose manual item request first');
      return;
    }

    if (isManualItem && !formData.manualItemName.trim()) {
      toast.error('Manual item name is required');
      return;
    }

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      toast.error('Requested quantity must be a whole number greater than 0');
      return;
    }

    if (!formData.neededBy) {
      toast.error('Needed-by date is required');
      return;
    }

    if (!formData.requestReason.trim()) {
      toast.error('Request reason is required');
      return;
    }

    try {
      await api.createProcurementRequest({
        department,
        requestType: formData.requestType,
        ...(isManualItem ? {} : { inventoryItemId: formData.inventoryItemId }),
        ...(isManualItem ? {
          itemName: formData.manualItemName.trim(),
          itemCode: formData.manualItemCode.trim(),
          itemCategory: formData.manualItemCategory.trim(),
        } : {}),
        requestedQuantity,
        neededBy: formData.neededBy,
        requestReason: formData.requestReason.trim(),
        requestNotes: formData.requestNotes.trim(),
        source: !isManualItem && selectedInventoryItem && typeof selectedInventoryItem.minimumStock === 'number' && selectedInventoryItem.availableQuantity <= selectedInventoryItem.minimumStock
          ? 'inventory_low_stock'
          : 'manual',
      });
      toast.success('Procurement request sent to purchasing');
      setDialogOpen(false);
      resetForm();
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create request');
    }
  };

  const openRequestDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openRequests = requests.filter((request) => ['requested', 'awaiting_accounting_approval', 'approved'].includes(request.status)).length;
  const waitingAccounting = requests.filter((request) => request.status === 'awaiting_accounting_approval').length;
  const approvedToAcquire = requests.filter((request) => request.status === 'approved').length;
  const completed = requests.filter((request) => request.status === 'fulfilled').length;

  return (
    <div className="space-y-4">
      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Purchasing Reports</h2>
            <p className="text-sm text-muted-foreground">
              {PROCUREMENT_DEPARTMENT_LABELS[department]} can request purchasing or rental for any saved inventory item here, then follow the quote, accounting approval, and fulfillment in one place.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openRequestDialog}>
                <PackagePlus className="mr-2 h-4 w-4" />
                New Purchase / Rental Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Create Purchasing Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="inventory-item">Inventory Item</Label>
                  <Select value={formData.inventoryItemId} onValueChange={handleInventorySelection}>
                    <SelectTrigger id="inventory-item">
                      <SelectValue placeholder="Select inventory item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__manual__">Manual item request</SelectItem>
                      {sortedInventoryItems.map((item) => (
                        <SelectItem key={item._id} value={item._id}>
                          {item.name} ({item.itemCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedInventoryItem ? (
                  <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className="font-medium">{selectedInventoryItem.availableQuantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Units</p>
                      <p className="font-medium">{selectedInventoryItem.quantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{selectedInventoryItem.category}</p>
                    </div>
                  </div>
                ) : formData.inventoryItemId === '__manual__' ? (
                  <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="manual-item-name">Manual Item Name</Label>
                      <Input
                        id="manual-item-name"
                        value={formData.manualItemName}
                        onChange={(event) => setFormData((current) => ({ ...current, manualItemName: event.target.value }))}
                        placeholder="Enter item name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-item-code">Item Code (optional)</Label>
                      <Input
                        id="manual-item-code"
                        value={formData.manualItemCode}
                        onChange={(event) => setFormData((current) => ({ ...current, manualItemCode: event.target.value }))}
                        placeholder="Optional item code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-item-category">Category (optional)</Label>
                      <Input
                        id="manual-item-category"
                        value={formData.manualItemCategory}
                        onChange={(event) => setFormData((current) => ({ ...current, manualItemCategory: event.target.value }))}
                        placeholder="Optional category"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="request-type">Request Type</Label>
                    <Select
                      value={formData.requestType}
                      onValueChange={(value: ProcurementRequestType) => setFormData((current) => ({ ...current, requestType: value }))}
                    >
                      <SelectTrigger id="request-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchase">Purchase</SelectItem>
                        <SelectItem value="rental">Rental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="request-quantity">Quantity Needed</Label>
                    <Input
                      id="request-quantity"
                      type="number"
                      min="1"
                      value={formData.requestedQuantity}
                      onChange={(event) => setFormData((current) => ({ ...current, requestedQuantity: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="needed-by">Needed By</Label>
                  <Input
                    id="needed-by"
                    type="date"
                    value={formData.neededBy}
                    onChange={(event) => setFormData((current) => ({ ...current, neededBy: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="request-reason">Reason</Label>
                  <Textarea
                    id="request-reason"
                    value={formData.requestReason}
                    onChange={(event) => setFormData((current) => ({ ...current, requestReason: event.target.value }))}
                    placeholder="Explain what is needed and why."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="request-notes">Notes</Label>
                  <Textarea
                    id="request-notes"
                    value={formData.requestNotes}
                    onChange={(event) => setFormData((current) => ({ ...current, requestNotes: event.target.value }))}
                    placeholder="Optional supplier notes, event context, or special handling."
                    rows={3}
                  />
                </div>

                <Button onClick={handleCreateRequest} className="w-full">
                  Send To Purchasing
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">Open Requests</p>
                <p className="text-2xl font-semibold">{openRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Waiting Accounting</p>
                <p className="text-2xl font-semibold">{waitingAccounting}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">Approved To Acquire</p>
                <p className="text-2xl font-semibold">{approvedToAcquire}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold">{completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-lg font-medium">No purchasing reports yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a request here whenever inventory needs to buy or rent additional stock, even before it becomes a shortage.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request._id}>
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{request.requestNumber}</CardTitle>
                      <Badge variant="outline" className={PROCUREMENT_STATUS_STYLES[request.status]}>
                        {getProcurementStatusLabel(request.status)}
                      </Badge>
                      <Badge variant="outline">
                        {PROCUREMENT_REQUEST_TYPE_LABELS[request.requestType]}
                      </Badge>
                      <Badge variant="outline">
                        {PROCUREMENT_SOURCE_LABELS[request.source]}
                      </Badge>
                    </div>
                    <p className="text-base font-medium">{request.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.itemCode || 'No item code'} | Needed by {formatProcurementDate(request.neededBy)}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[340px]">
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Requested</p>
                      <p className="mt-1 font-semibold">{request.requestedQuantity} units</p>
                    </div>
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Contract</p>
                      <p className="mt-1 font-semibold">{request.contract?.contractNumber || 'Inventory request'}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Created</p>
                      <p className="mt-1 font-semibold">{formatProcurementDate(request.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Request reason</p>
                  <p className="mt-1 font-medium">{request.requestReason}</p>
                  {request.requestNotes ? (
                    <p className="mt-2 text-sm text-muted-foreground">{request.requestNotes}</p>
                  ) : null}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Purchasing Report</p>
                    {request.quote?.submittedAt ? (
                      <div className="mt-3 space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Supplier:</span> {request.quote.supplierName || 'Not set'}</p>
                        <p><span className="text-muted-foreground">Quote:</span> {formatProcurementCurrency(request.quote.quotedTotal)}</p>
                        <p><span className="text-muted-foreground">Unit Price:</span> {formatProcurementCurrency(request.quote.quotedUnitPrice)}</p>
                        <p><span className="text-muted-foreground">Lead Time:</span> {request.quote.leadTimeDays ? `${request.quote.leadTimeDays} day(s)` : 'Not set'}</p>
                        <p><span className="text-muted-foreground">Expected Fulfillment:</span> {formatProcurementDate(request.quote.expectedFulfillmentDate)}</p>
                        {request.requestType === 'rental' ? (
                          <p><span className="text-muted-foreground">Rental Window:</span> {formatProcurementDate(request.quote.rentalStartDate)} to {formatProcurementDate(request.quote.rentalEndDate)}</p>
                        ) : null}
                        {request.quote.notes ? (
                          <p className="pt-1 text-muted-foreground">{request.quote.notes}</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">Purchasing has not submitted the quote report yet.</p>
                    )}
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Accounting Decision</p>
                    {request.accounting?.reviewedAt ? (
                      <div className="mt-3 space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Status:</span> {request.accounting.status === 'approved' ? 'Approved' : 'Needs revision'}</p>
                        <p><span className="text-muted-foreground">Reviewed:</span> {formatProcurementDate(request.accounting.reviewedAt)}</p>
                        <p><span className="text-muted-foreground">Reviewed By:</span> {request.accounting.reviewedBy?.name || 'Accounting'}</p>
                        <p className="pt-1 text-muted-foreground">{request.accounting.notes || 'No additional notes.'}</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">Waiting for the purchasing report before accounting can decide.</p>
                    )}
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Fulfillment</p>
                    {request.fulfillment?.fulfilledAt ? (
                      <div className="mt-3 space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Completed:</span> {formatProcurementDate(request.fulfillment.fulfilledAt)}</p>
                        <p><span className="text-muted-foreground">Received:</span> {request.fulfillment.receivedQuantity || request.requestedQuantity} units</p>
                        <p><span className="text-muted-foreground">Inventory Update:</span> {request.fulfillment.inventoryUpdated ? 'Done' : 'Pending'}</p>
                        {request.fulfillment.inventoryUpdateSummary ? (
                          <p className="pt-1 text-muted-foreground">{request.fulfillment.inventoryUpdateSummary}</p>
                        ) : null}
                        {request.fulfillment.notes ? (
                          <p className="pt-1 text-muted-foreground">{request.fulfillment.notes}</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">Purchasing still needs to complete the acquisition or rental.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
