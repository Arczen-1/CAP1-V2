import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import SupplierDirectoryPanel from '@/components/SupplierDirectoryPanel';
import { toast } from 'sonner';
import { CalendarClock, ClipboardList, FileText, PackageCheck, ShoppingCart } from 'lucide-react';
import type { ProcurementRequest, ProcurementSupplierSummary } from '@/lib/procurement';
import {
  formatProcurementCurrency,
  formatProcurementDate,
  getProcurementReviewBasis,
  getRecommendedSuppliersForRequest,
  getProcurementStatusLabel,
  PROCUREMENT_REQUEST_TYPE_LABELS,
  PROCUREMENT_STATUS_STYLES,
} from '@/lib/procurement';

const getTodayValue = () => new Date().toISOString().slice(0, 10);

const getDaysAway = (value?: string) => {
  if (!value) {
    return null;
  }

  const target = new Date(value);
  const today = new Date();
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const buildEmptyQuoteForm = () => ({
  supplierId: '',
  supplierName: '',
  supplierContact: '',
  supplierEmail: '',
  quotedUnitPrice: '',
  expectedFulfillmentDate: '',
  rentalStartDate: '',
  rentalEndDate: '',
  notes: '',
});

const getSupplierContactLine = (supplier?: ProcurementSupplierSummary | null) => (
  [supplier?.contactPerson || '', supplier?.phone || ''].filter(Boolean).join(' | ')
);

const buildEmptyFulfillmentForm = () => ({
  receivedQuantity: '',
  invoiceReference: '',
  rentalStartDate: '',
  rentalEndDate: '',
  notes: '',
  attachmentUrl: '',
});

export default function PurchasingDashboard() {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [suppliers, setSuppliers] = useState<ProcurementSupplierSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);
  const [quoteForm, setQuoteForm] = useState(buildEmptyQuoteForm());
  const [fulfillmentForm, setFulfillmentForm] = useState(buildEmptyFulfillmentForm());

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const [requestData, supplierData] = await Promise.all([
        api.getProcurementRequests(),
        api.getSuppliers(),
      ]);
      setRequests(requestData as ProcurementRequest[]);
      setSuppliers(supplierData as ProcurementSupplierSummary[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load procurement requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const sortedRequests = useMemo(() => (
    [...requests].sort((left, right) => {
      const leftTime = new Date(left.neededBy || left.createdAt).getTime();
      const rightTime = new Date(right.neededBy || right.createdAt).getTime();
      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    })
  ), [requests]);

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.isActive !== false),
    [suppliers]
  );

  const queueRequests = sortedRequests.filter((request) => ['requested', 'rejected'].includes(request.status));
  const waitingAccounting = sortedRequests.filter((request) => request.status === 'awaiting_accounting_approval');
  const approvedRequests = sortedRequests.filter((request) => request.status === 'approved');
  const completedRequests = sortedRequests.filter((request) => ['fulfilled', 'cancelled'].includes(request.status));

  const dueThisWeek = sortedRequests.filter((request) => {
    const daysAway = getDaysAway(request.neededBy);
    return typeof daysAway === 'number' && daysAway >= 0 && daysAway <= 7;
  }).length;

  const recommendedSuppliers = useMemo(() => (
    selectedRequest ? getRecommendedSuppliersForRequest(selectedRequest, activeSuppliers) : []
  ), [selectedRequest, activeSuppliers]);

  const applySupplierToQuoteForm = (supplierId: string) => {
    const supplier = activeSuppliers.find((entry) => entry._id === supplierId);

    if (!supplier) {
      setQuoteForm((current) => ({
        ...current,
        supplierId: '',
        supplierName: '',
        supplierContact: '',
        supplierEmail: '',
      }));
      return;
    }

    setQuoteForm((current) => ({
      ...current,
      supplierId,
      supplierName: supplier.name,
      supplierContact: getSupplierContactLine(supplier),
      supplierEmail: supplier.email || '',
      notes: current.notes || supplier.notes || '',
    }));
  };

  const openQuoteDialog = (request: ProcurementRequest) => {
    const defaultSupplier = request.quote?.supplier?._id
      || getRecommendedSuppliersForRequest(request, activeSuppliers, 1)[0]?.supplier._id
      || '';
    const matchedSupplier = activeSuppliers.find((supplier) => supplier._id === defaultSupplier);

    setSelectedRequest(request);
    setQuoteForm({
      supplierId: defaultSupplier,
      supplierName: request.quote?.supplierName || matchedSupplier?.name || '',
      supplierContact: request.quote?.supplierContact || getSupplierContactLine(matchedSupplier),
      supplierEmail: request.quote?.supplierEmail || matchedSupplier?.email || '',
      quotedUnitPrice: request.quote?.quotedUnitPrice ? String(request.quote.quotedUnitPrice) : '',
      expectedFulfillmentDate: request.quote?.expectedFulfillmentDate?.slice(0, 10) || request.neededBy?.slice(0, 10) || getTodayValue(),
      rentalStartDate: request.quote?.rentalStartDate?.slice(0, 10) || request.eventDate?.slice(0, 10) || '',
      rentalEndDate: request.quote?.rentalEndDate?.slice(0, 10) || '',
      notes: request.quote?.notes || matchedSupplier?.notes || '',
    });
    setQuoteDialogOpen(true);
  };

  const openFulfillmentDialog = (request: ProcurementRequest) => {
    setSelectedRequest(request);
    setFulfillmentForm({
      receivedQuantity: String(request.requestedQuantity || ''),
      invoiceReference: '',
      rentalStartDate: request.quote?.rentalStartDate?.slice(0, 10) || request.eventDate?.slice(0, 10) || '',
      rentalEndDate: request.quote?.rentalEndDate?.slice(0, 10) || '',
      notes: '',
      attachmentUrl: '',
    });
    setFulfillmentDialogOpen(true);
  };

  const handleFulfillmentAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFulfillmentForm((current) => ({ ...current, attachmentUrl: '' }));
      return;
    }

    const isAllowedFile = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!isAllowedFile) {
      toast.error('Please upload an image or PDF file only.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please upload a completion file smaller than 5 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFulfillmentForm((current) => ({
        ...current,
        attachmentUrl: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitQuote = async () => {
    if (!selectedRequest) {
      return;
    }

    if (!quoteForm.supplierName.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    if (!quoteForm.quotedUnitPrice) {
      toast.error('Enter the supplier unit price');
      return;
    }

    try {
      await api.updateProcurementQuote(selectedRequest._id, {
        supplierId: quoteForm.supplierId || undefined,
        supplierName: quoteForm.supplierName.trim(),
        supplierContact: quoteForm.supplierContact.trim(),
        supplierEmail: quoteForm.supplierEmail.trim(),
        quotedUnitPrice: quoteForm.quotedUnitPrice ? Number(quoteForm.quotedUnitPrice) : undefined,
        expectedFulfillmentDate: quoteForm.expectedFulfillmentDate || undefined,
        rentalStartDate: quoteForm.rentalStartDate || undefined,
        rentalEndDate: quoteForm.rentalEndDate || undefined,
        notes: quoteForm.notes.trim(),
      });
      toast.success('Purchasing report sent to accounting');
      setQuoteDialogOpen(false);
      setSelectedRequest(null);
      setQuoteForm(buildEmptyQuoteForm());
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit purchasing report');
    }
  };

  const handleCompleteRequest = async () => {
    if (!selectedRequest) {
      return;
    }

    const receivedQuantity = Number(fulfillmentForm.receivedQuantity);
    if (!Number.isInteger(receivedQuantity) || receivedQuantity <= 0) {
      toast.error('Received quantity must be a whole number greater than 0');
      return;
    }

    try {
      await api.fulfillProcurementRequest(selectedRequest._id, {
        receivedQuantity,
        invoiceReference: fulfillmentForm.invoiceReference.trim(),
        rentalStartDate: fulfillmentForm.rentalStartDate || undefined,
        rentalEndDate: fulfillmentForm.rentalEndDate || undefined,
        notes: fulfillmentForm.notes.trim(),
        ...(fulfillmentForm.attachmentUrl ? { attachments: [fulfillmentForm.attachmentUrl] } : {}),
      });
      toast.success('Procurement completed and inventory updated');
      setFulfillmentDialogOpen(false);
      setSelectedRequest(null);
      setFulfillmentForm(buildEmptyFulfillmentForm());
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete procurement');
    }
  };

  const renderRequestCards = (
    requestList: ProcurementRequest[],
    emptyTitle: string,
    emptyNote: string,
    action?: (request: ProcurementRequest) => React.ReactNode
  ) => {
    if (requestList.length === 0) {
      return (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-lg font-medium">{emptyTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">{emptyNote}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {requestList.map((request) => {
          const daysAway = getDaysAway(request.neededBy);
          const reviewBasis = getProcurementReviewBasis(request);

          return (
            <Card key={request._id} className={daysAway !== null && daysAway <= 3 ? 'border-orange-300' : ''}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold">{request.requestNumber}</span>
                      <Badge variant="outline" className={PROCUREMENT_STATUS_STYLES[request.status]}>
                        {getProcurementStatusLabel(request.status)}
                      </Badge>
                      <Badge variant="outline">
                        {PROCUREMENT_REQUEST_TYPE_LABELS[request.requestType]}
                      </Badge>
                      {daysAway !== null ? (
                        <Badge variant="outline" className={daysAway <= 3 ? 'border-orange-300 bg-orange-50 text-orange-900' : ''}>
                          {daysAway === 0 ? 'Needed today' : `${daysAway} day(s) left`}
                        </Badge>
                      ) : null}
                    </div>
                    <div>
                      <p className="font-medium">{request.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.itemCode || 'No item code'} | {request.itemCategory || 'Uncategorized'} | {request.requestedQuantity} units
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.requestReason}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Needed By</p>
                      <p className="mt-1 font-semibold">{formatProcurementDate(request.neededBy)}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Contract</p>
                      <p className="mt-1 font-semibold">{request.contract?.contractNumber || 'Inventory request'}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Requested By</p>
                      <p className="mt-1 font-semibold">{request.createdBy?.name || 'Staff'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Request Details</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Department:</span> {request.department}</p>
                      <p><span className="text-muted-foreground">Source:</span> {request.source.replace(/_/g, ' ')}</p>
                      <p><span className="text-muted-foreground">Shortage:</span> {request.shortageQuantity || request.requestedQuantity} units</p>
                      {request.contract ? (
                        <Link to={`/contracts/${request.contract._id}`} className="inline-flex text-primary hover:underline">
                          Open linked contract
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Purchasing Report</p>
                    {request.quote?.submittedAt ? (
                      <div className="mt-3 space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Supplier:</span> {request.quote.supplierName}</p>
                        <p><span className="text-muted-foreground">Estimated Total:</span> {formatProcurementCurrency(request.quote.quotedTotal)}</p>
                        <p><span className="text-muted-foreground">Expected:</span> {formatProcurementDate(request.quote.expectedFulfillmentDate)}</p>
                        <p><span className="text-muted-foreground">Timeline:</span> {reviewBasis.timelineConfirmed ? 'On schedule' : 'Needs review'}</p>
                        {request.quote.notes ? (
                          <p className="pt-1 text-muted-foreground">{request.quote.notes}</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">Quote and supplier details still need to be prepared.</p>
                    )}
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Approval / Fulfillment</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Accounting:</span> {request.accounting?.status === 'approved' ? 'Approved' : request.accounting?.status === 'rejected' ? 'Needs revision' : 'Pending'}</p>
                      <p><span className="text-muted-foreground">Fulfillment:</span> {request.fulfillment?.fulfilledAt ? formatProcurementDate(request.fulfillment.fulfilledAt) : 'Not completed yet'}</p>
                      {request.fulfillment?.attachments?.[0] ? (
                        <p>
                          <span className="text-muted-foreground">Completion File:</span>{' '}
                          <a
                            href={request.fulfillment.attachments[0]}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            View attachment
                          </a>
                        </p>
                      ) : null}
                      {request.accounting?.rejectionReason ? (
                        <p><span className="text-muted-foreground">Return reason:</span> {request.accounting.rejectionReason.replace(/_/g, ' ')}</p>
                      ) : null}
                      {request.accounting?.notes ? (
                        <p className="text-muted-foreground">{request.accounting.notes}</p>
                      ) : null}
                      {request.fulfillment?.inventoryUpdateSummary ? (
                        <p className="pt-1 text-muted-foreground">{request.fulfillment.inventoryUpdateSummary}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {action ? (
                  <div className="flex flex-wrap gap-2">
                    {action(request)}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchasing Dashboard</h1>
          <p className="text-muted-foreground">
            Handle department requests, submit the purchasing report, wait for accounting approval, then complete the acquisition or rental and update inventory.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Needs Report</CardTitle>
              <ClipboardList className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">{queueRequests.length}</div>
              <p className="text-xs text-muted-foreground">Requests waiting for a quote</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
              <CalendarClock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{dueThisWeek}</div>
              <p className="text-xs text-muted-foreground">Needed soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Waiting Accounting</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{waitingAccounting.length}</div>
              <p className="text-xs text-muted-foreground">Reports ready for approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ready To Acquire</CardTitle>
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{approvedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Approved purchase or rental</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="queue">Needs Report ({queueRequests.length})</TabsTrigger>
            <TabsTrigger value="approval">Waiting Accounting ({waitingAccounting.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved To Acquire ({approvedRequests.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
            <TabsTrigger value="suppliers">Supplier Database ({suppliers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4">
            {renderRequestCards(
              queueRequests,
              'No purchasing reports to prepare',
              'Requests from inventory or contract shortages will land here.',
              (request) => (
                <Button onClick={() => openQuoteDialog(request)}>
                  <FileText className="mr-2 h-4 w-4" />
                  {request.status === 'rejected' ? 'Revise Report' : 'Create Report'}
                </Button>
              )
            )}
          </TabsContent>

          <TabsContent value="approval" className="space-y-4">
            {renderRequestCards(
              waitingAccounting,
              'Nothing is waiting for accounting',
              'Once you submit the purchasing report, the request moves here until accounting decides.'
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {renderRequestCards(
              approvedRequests,
              'No approved requests to fulfill',
              'Accounting-approved requests will appear here so purchasing can finish the acquisition or rental.',
              (request) => (
                <Button onClick={() => openFulfillmentDialog(request)}>
                  <PackageCheck className="mr-2 h-4 w-4" />
                  Mark Completed
                </Button>
              )
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {renderRequestCards(
              completedRequests,
              'No completed procurement yet',
              'Finished requests will appear here together with the inventory update summary.'
            )}
          </TabsContent>

          <TabsContent value="suppliers">
            <SupplierDirectoryPanel suppliers={suppliers} onRefresh={fetchRequests} />
          </TabsContent>
        </Tabs>

        <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
          <DialogContent className="flex max-h-[90vh] w-[min(96vw,88rem)] !max-w-[min(96vw,88rem)] flex-col overflow-hidden p-0">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>
                {selectedRequest ? `Purchasing Report - ${selectedRequest.requestNumber}` : 'Purchasing Report'}
              </DialogTitle>
            </DialogHeader>
            {selectedRequest ? (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="space-y-4">
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="font-medium">{selectedRequest.itemName}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRequest.requestedQuantity} units needed by {formatProcurementDate(selectedRequest.neededBy)}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">{selectedRequest.requestReason}</p>
                      </div>

                      <div className="space-y-3 rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">Recommended Suppliers</p>
                            <p className="text-sm text-muted-foreground">
                              Matched using department, request type, item category, and saved service areas.
                            </p>
                          </div>
                          <Badge variant="outline">{recommendedSuppliers.length} match(es)</Badge>
                        </div>
                        {recommendedSuppliers.length > 0 ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            {recommendedSuppliers.map(({ supplier, score }) => (
                              <button
                                key={supplier._id}
                                type="button"
                                className={`flex h-full flex-col rounded-xl border p-4 text-left transition hover:border-primary ${quoteForm.supplierId === supplier._id ? 'border-primary bg-primary/5' : ''}`}
                                onClick={() => applySupplierToQuoteForm(supplier._id)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium">{supplier.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {[supplier.city, supplier.province].filter(Boolean).join(', ') || 'Supplier profile'}
                                    </p>
                                  </div>
                                  <Badge variant="outline">Score {score}</Badge>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                  {(supplier.supportedCategories || []).join(', ') || 'No categories saved'}
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {(supplier.serviceAreas || []).join(', ') || 'No service areas saved'}
                                </p>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No supplier directory match yet. You can still complete the report manually or add suppliers in the Suppliers tab.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-4 rounded-lg border p-4">
                        <div className="space-y-2">
                          <Label htmlFor="supplier-directory">Supplier From Directory</Label>
                          <Select
                            value={quoteForm.supplierId || '__manual__'}
                            onValueChange={(value) => {
                              if (value === '__manual__') {
                                setQuoteForm((current) => ({ ...current, supplierId: '' }));
                                return;
                              }
                              applySupplierToQuoteForm(value);
                            }}
                          >
                            <SelectTrigger id="supplier-directory">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__manual__">Manual supplier entry</SelectItem>
                              {activeSuppliers.map((supplier) => (
                                <SelectItem key={supplier._id} value={supplier._id}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="supplier-name">Supplier Name</Label>
                            <Input
                              id="supplier-name"
                              value={quoteForm.supplierName}
                              onChange={(event) => setQuoteForm((current) => ({ ...current, supplierName: event.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="supplier-contact">Supplier Contact</Label>
                            <Input
                              id="supplier-contact"
                              value={quoteForm.supplierContact}
                              onChange={(event) => setQuoteForm((current) => ({ ...current, supplierContact: event.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="supplier-email">Supplier Email</Label>
                            <Input
                              id="supplier-email"
                              value={quoteForm.supplierEmail}
                              onChange={(event) => setQuoteForm((current) => ({ ...current, supplierEmail: event.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expected-date">Expected Fulfillment Date</Label>
                            <Input
                              id="expected-date"
                              type="date"
                              value={quoteForm.expectedFulfillmentDate}
                              onChange={(event) => setQuoteForm((current) => ({ ...current, expectedFulfillmentDate: event.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="quoted-unit-price">Unit Price</Label>
                            <Input
                              id="quoted-unit-price"
                              type="number"
                              min="0"
                              value={quoteForm.quotedUnitPrice}
                              onChange={(event) => setQuoteForm((current) => ({ ...current, quotedUnitPrice: event.target.value }))}
                            />
                          </div>
                          <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                            Estimated total for {selectedRequest.requestedQuantity} unit(s):{' '}
                            <span className="font-semibold text-foreground">
                              {formatProcurementCurrency(
                                quoteForm.quotedUnitPrice ? Number(quoteForm.quotedUnitPrice) * selectedRequest.requestedQuantity : 0
                              )}
                            </span>
                          </div>
                        </div>

                        {selectedRequest.requestType === 'rental' ? (
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="rental-start">Rental Start</Label>
                              <Input
                                id="rental-start"
                                type="date"
                                value={quoteForm.rentalStartDate}
                                onChange={(event) => setQuoteForm((current) => ({ ...current, rentalStartDate: event.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="rental-end">Rental Return Date</Label>
                              <Input
                                id="rental-end"
                                type="date"
                                value={quoteForm.rentalEndDate}
                                onChange={(event) => setQuoteForm((current) => ({ ...current, rentalEndDate: event.target.value }))}
                              />
                            </div>
                          </div>
                        ) : null}

                        <div className="space-y-2">
                          <Label htmlFor="quote-notes">Report Notes</Label>
                          <Textarea
                            id="quote-notes"
                            value={quoteForm.notes}
                            onChange={(event) => setQuoteForm((current) => ({ ...current, notes: event.target.value }))}
                            rows={5}
                            placeholder="Add supplier terms, delivery notes, rental details, or anything accounting should review."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t bg-background px-6 py-4">
                  <div className="flex justify-end">
                    <Button onClick={handleSubmitQuote} className="w-full sm:w-auto sm:min-w-[220px]">
                      Submit To Accounting
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={fulfillmentDialogOpen} onOpenChange={setFulfillmentDialogOpen}>
          <DialogContent className="max-h-[85vh] max-w-xl overflow-hidden p-0">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>
                {selectedRequest ? `Complete Procurement - ${selectedRequest.requestNumber}` : 'Complete Procurement'}
              </DialogTitle>
            </DialogHeader>
            {selectedRequest ? (
              <>
                <div className="overflow-y-auto px-6 py-4">
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="font-medium">{selectedRequest.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        Approved for {selectedRequest.requestedQuantity} units | Needed by {formatProcurementDate(selectedRequest.neededBy)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="received-quantity">Received Quantity</Label>
                      <Input
                        id="received-quantity"
                        type="number"
                        min="1"
                        value={fulfillmentForm.receivedQuantity}
                        onChange={(event) => setFulfillmentForm((current) => ({ ...current, receivedQuantity: event.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoice-reference">Invoice / OR / Rental Reference</Label>
                      <Input
                        id="invoice-reference"
                        value={fulfillmentForm.invoiceReference}
                        onChange={(event) => setFulfillmentForm((current) => ({ ...current, invoiceReference: event.target.value }))}
                      />
                    </div>

                    {selectedRequest.requestType === 'rental' ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="fulfillment-rental-start">Rental Start</Label>
                          <Input
                            id="fulfillment-rental-start"
                            type="date"
                            value={fulfillmentForm.rentalStartDate}
                            onChange={(event) => setFulfillmentForm((current) => ({ ...current, rentalStartDate: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fulfillment-rental-end">Rental Return Date</Label>
                          <Input
                            id="fulfillment-rental-end"
                            type="date"
                            value={fulfillmentForm.rentalEndDate}
                            onChange={(event) => setFulfillmentForm((current) => ({ ...current, rentalEndDate: event.target.value }))}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="fulfillment-notes">Completion Notes</Label>
                      <Textarea
                        id="fulfillment-notes"
                        value={fulfillmentForm.notes}
                        onChange={(event) => setFulfillmentForm((current) => ({ ...current, notes: event.target.value }))}
                        rows={4}
                        placeholder="Add delivery, pickup, or inventory handoff notes."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fulfillment-attachment">Completion Attachment (image or PDF)</Label>
                      <Input
                        id="fulfillment-attachment"
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        onChange={handleFulfillmentAttachmentChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload proof of completion such as a receipt, signed acknowledgment, or delivery photo.
                      </p>
                      {fulfillmentForm.attachmentUrl ? (
                        <button
                          type="button"
                          className="text-sm text-primary hover:underline"
                          onClick={() => setFulfillmentForm((current) => ({ ...current, attachmentUrl: '' }))}
                        >
                          Remove attached file
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="border-t bg-background px-6 py-4">
                  <div className="flex justify-end">
                    <Button onClick={handleCompleteRequest} className="w-full sm:w-auto sm:min-w-[240px]">
                      Complete And Update Inventory
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
