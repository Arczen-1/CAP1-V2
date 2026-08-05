import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { CalendarClock, ClipboardList, FileText, PackageCheck, Printer, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { printRequisitionForm } from '@/lib/requisitionPrint';
import RentVsBuyPanel from '@/components/RentVsBuyPanel';
import type { ProcurementRequest, ProcurementSupplierSummary } from '@/lib/procurement';
import {
  formatProcurementCurrency,
  formatProcurementDate,
  getProcurementRequisitionTypeLabel,
  getProcurementReleaseLabel,
  getProcurementReviewBasis,
  getRecommendedSuppliersForRequest,
  getProcurementSlaStatusLabel,
  getProcurementStatusLabel,
  PROCUREMENT_REQUEST_TYPE_LABELS,
  PROCUREMENT_SLA_STATUS_STYLES,
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

const PURCHASING_TABS = ['queue', 'approval', 'approved', 'proof', 'completed', 'suppliers'];

export default function PurchasingDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [suppliers, setSuppliers] = useState<ProcurementSupplierSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);
  const [quoteForm, setQuoteForm] = useState(buildEmptyQuoteForm());
  const [fulfillmentForm, setFulfillmentForm] = useState(buildEmptyFulfillmentForm());
  const [buyInsteadDialogOpen, setBuyInsteadDialogOpen] = useState(false);
  const [buyInsteadForm, setBuyInsteadForm] = useState({
    quantity: '', neededBy: '', requestReason: '', requestNotes: '',
    replacesIds: [] as string[], replacedNumbers: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [requisitionTypeFilter, setRequisitionTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'needed_asc' | 'needed_desc' | 'created_desc' | 'created_asc'>('needed_asc');
  const [searchParams, setSearchParams] = useSearchParams();
  // Notifications deep-link to a specific tab and request (?tab=approved&request=...).
  const requestedTab = searchParams.get('tab') || '';
  const activeTab = PURCHASING_TABS.includes(requestedTab) ? requestedTab : 'queue';
  const highlightRequestId = searchParams.get('request') || '';

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    next.delete('request');
    setSearchParams(next, { replace: true });
  };

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

  // Scroll a notification's deep-linked request into view once the list renders.
  useEffect(() => {
    if (!highlightRequestId || requests.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      document
        .querySelector(`[data-request-id="${highlightRequestId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [highlightRequestId, requests, activeTab]);

  const sortedRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = requests.filter((request) => {
      if (departmentFilter !== 'all' && request.department !== departmentFilter) {
        return false;
      }
      if (requisitionTypeFilter !== 'all' && request.requisitionType !== requisitionTypeFilter) {
        return false;
      }
      if (term) {
        const haystack = [
          request.requestNumber,
          request.itemName,
          request.itemCode,
          request.department,
          request.contract?.contractNumber,
          request.contract?.clientName,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(term)) {
          return false;
        }
      }
      return true;
    });

    const neededTime = (request: ProcurementRequest) => new Date(request.neededBy || request.createdAt).getTime();
    const createdTime = (request: ProcurementRequest) => new Date(request.createdAt).getTime();

    return filtered.sort((left, right) => {
      switch (sortOrder) {
        case 'needed_desc':
          return neededTime(right) - neededTime(left);
        case 'created_desc':
          return createdTime(right) - createdTime(left);
        case 'created_asc':
          return createdTime(left) - createdTime(right);
        case 'needed_asc':
        default: {
          const diff = neededTime(left) - neededTime(right);
          return diff !== 0 ? diff : createdTime(right) - createdTime(left);
        }
      }
    });
  }, [requests, searchTerm, departmentFilter, requisitionTypeFilter, sortOrder]);

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.isActive !== false),
    [suppliers]
  );

  const queueRequests = sortedRequests.filter((request) => ['requested', 'rejected'].includes(request.status));
  const waitingAccounting = sortedRequests.filter((request) => request.status === 'awaiting_accounting_approval');
  const proofReadyRequests = sortedRequests.filter((request) => ['approved', 'proof_needs_revision'].includes(request.status));
  const waitingExpenseConfirmation = sortedRequests.filter((request) => request.status === 'proof_submitted');
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

  // Raising a purchase in place of the rentals the comparison flagged.
  //
  // Pre-filled rather than automatic: the quantity comes from the peak units the
  // analysis computed (which is the number a person retyping this would most
  // easily get wrong), but Purchasing still reviews and submits it. Buying is a
  // capital decision and stays with a person.
  const openBuyInsteadDialog = (request: ProcurementRequest) => {
    const analysis = request.rentVsBuy;
    if (!analysis) return;

    const replaced = [request, ...analysis.relatedRequests.filter((r) => r.requestType === 'rental')];
    const eventList = analysis.relatedRequests
      .filter((r) => r.requestType === 'rental')
      .map((r) => r.contractNumber || r.requestNumber)
      .concat(request.contract?.contractNumber || request.requestNumber);

    setSelectedRequest(request);
    setBuyInsteadForm({
      quantity: String(analysis.unitsNeeded || request.requestedQuantity || 1),
      // Earliest date any of the rentals needed it - buying later than that
      // would leave the first event uncovered.
      neededBy: [request.neededBy, ...analysis.relatedRequests.map((r) => r.neededBy)]
        .filter(Boolean)
        .map((d) => String(d).slice(0, 10))
        .sort()[0] || getTodayValue(),
      requestReason: `Buying instead of renting: the same item is needed for ${eventList.length} events (${eventList.join(', ')}). ${analysis.summary}`,
      requestNotes: '',
      replacesIds: replaced.map((r) => r._id),
      replacedNumbers: replaced.map((r) => r.requestNumber).join(', '),
    });
    setBuyInsteadDialogOpen(true);
  };

  const handleRaisePurchase = async () => {
    if (!selectedRequest) return;

    const quantity = Number(buyInsteadForm.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      toast.error('Enter how many units to buy.');
      return;
    }
    if (!buyInsteadForm.neededBy) {
      toast.error('Set the needed-by date.');
      return;
    }

    try {
      await api.createProcurementRequest({
        department: selectedRequest.department,
        requestType: 'purchase',
        ...(selectedRequest.inventoryItem?._id
          ? { inventoryItemId: selectedRequest.inventoryItem._id }
          : {
              itemName: selectedRequest.itemName,
              itemCode: selectedRequest.itemCode,
              itemCategory: selectedRequest.itemCategory,
            }),
        requestedQuantity: quantity,
        neededBy: buyInsteadForm.neededBy,
        requestReason: buyInsteadForm.requestReason,
        requestNotes: buyInsteadForm.requestNotes,
        source: 'manual',
        replacesRequests: buyInsteadForm.replacesIds,
      });
      toast.success('Purchase request raised. The rental requests stay open until you return them.');
      setBuyInsteadDialogOpen(false);
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to raise the purchase request');
    }
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
      toast.success('Budget request sent to accounting');
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
      toast.success('Proof submitted to accounting and inventory updated');
      setFulfillmentDialogOpen(false);
      setSelectedRequest(null);
      setFulfillmentForm(buildEmptyFulfillmentForm());
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete procurement');
    }
  };

  const handleReturnRental = async (request: ProcurementRequest) => {
    if (!window.confirm(`Mark ${request.requestNumber} (${request.itemName}) as returned to the supplier? This removes the rented units from inventory.`)) {
      return;
    }

    try {
      await api.returnRentalProcurementRequest(request._id);
      toast.success('Rental returned and inventory reduced');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark rental as returned');
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
            <Card
              key={request._id}
              data-request-id={request._id}
              className={`${daysAway !== null && daysAway <= 3 ? 'border-orange-300' : ''} ${request._id === highlightRequestId ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
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
                      <Badge variant="outline">
                        {getProcurementRequisitionTypeLabel(request.requisitionType)}
                      </Badge>
                      {request.sla?.status ? (
                        <Badge variant="outline" className={PROCUREMENT_SLA_STATUS_STYLES[request.sla.status]}>
                          {getProcurementSlaStatusLabel(request.sla.status)}
                        </Badge>
                      ) : null}
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
                        {typeof request.sla?.daysUntilNeeded === 'number' ? ` | ${request.sla.daysUntilNeeded} day(s) lead` : ''}
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

                {/* Caught here, before the request reaches Accounting, so the
                    buy-instead question can be settled while the quote is
                    still being sourced. */}
                <RentVsBuyPanel
                  analysis={request.rentVsBuy}
                  action={request.rentVsBuy?.recommendation === 'buy' ? (
                    <Button size="sm" variant="outline" onClick={() => openBuyInsteadDialog(request)}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Raise purchase instead
                    </Button>
                  ) : null}
                />

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Request Details</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Department:</span> {request.department}</p>
                      <p><span className="text-muted-foreground">Source:</span> {request.source.replace(/_/g, ' ')}</p>
                      <p><span className="text-muted-foreground">Shortage:</span> {request.shortageQuantity || request.requestedQuantity} units</p>
                      {request.contract ? (
                        <p className="pt-1 text-muted-foreground">
                          Linked contract: <span className="font-medium text-foreground">{request.contract.contractNumber}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Budget Request</p>
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
                    <p className="text-sm font-medium">Approval / Proof Status</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Budget:</span> {request.accounting?.status === 'approved' ? 'Approved' : request.accounting?.status === 'rejected' ? 'Needs revision' : 'Pending'}</p>
                      <p><span className="text-muted-foreground">Release:</span> {getProcurementReleaseLabel(request)}</p>
                      <p><span className="text-muted-foreground">Proof:</span> {
                        request.status === 'proof_submitted'
                          ? 'Waiting for accounting confirmation'
                          : request.status === 'proof_needs_revision'
                            ? 'Needs updated proof'
                            : request.fulfillment?.confirmedAt
                              ? `Confirmed ${formatProcurementDate(request.fulfillment.confirmedAt)}`
                              : request.fulfillment?.fulfilledAt
                                ? `Submitted ${formatProcurementDate(request.fulfillment.fulfilledAt)}`
                                : 'Not submitted yet'
                      }</p>
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
                      {request.fulfillment?.confirmationNotes ? (
                        <p className="text-muted-foreground">{request.fulfillment.confirmationNotes}</p>
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

                <div className="flex flex-wrap gap-2">
                  {action ? action(request) : null}
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!printRequisitionForm(request, user?.name)) {
                        toast.error('Please allow pop-ups to print the requisition form');
                      }
                    }}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Requisition Form
                  </Button>
                </div>
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
            Handle department requests, submit the budget request, wait for accounting approval, submit proof of purchase, then wait for accounting expense confirmation.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Needs Budget Request</CardTitle>
              <ClipboardList className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">{queueRequests.length}</div>
              <p className="text-xs text-muted-foreground">Requests waiting for supplier and budget details</p>
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
              <p className="text-xs text-muted-foreground">Reports waiting for budget approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Budget Approved</CardTitle>
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{proofReadyRequests.length}</div>
              <p className="text-xs text-muted-foreground">Ready to buy or update proof</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Waiting Expense Confirmation</CardTitle>
              <PackageCheck className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-700">{waitingExpenseConfirmation.length}</div>
              <p className="text-xs text-muted-foreground">Proof already sent to accounting</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label className="text-xs">Search</Label>
              <Input
                placeholder="Request #, item, code, or client..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="w-full space-y-1 lg:w-44">
              <Label className="text-xs">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="linen">Linen</SelectItem>
                  <SelectItem value="stockroom">Stockroom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full space-y-1 lg:w-48">
              <Label className="text-xs">Requisition type</Label>
              <Select value={requisitionTypeFilter} onValueChange={setRequisitionTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="item_requisition">Item requisition</SelectItem>
                  <SelectItem value="purchase_requisition">Purchase requisition</SelectItem>
                  <SelectItem value="emergency_requisition">Emergency requisition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full space-y-1 lg:w-52">
              <Label className="text-xs">Sort by</Label>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as typeof sortOrder)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="needed_asc">Needed by (soonest first)</SelectItem>
                  <SelectItem value="needed_desc">Needed by (latest first)</SelectItem>
                  <SelectItem value="created_desc">Newest first</SelectItem>
                  <SelectItem value="created_asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || departmentFilter !== 'all' || requisitionTypeFilter !== 'all' || sortOrder !== 'needed_asc') ? (
              <Button
                variant="ghost"
                onClick={() => { setSearchTerm(''); setDepartmentFilter('all'); setRequisitionTypeFilter('all'); setSortOrder('needed_asc'); }}
              >
                Reset
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="queue">Needs Budget Request ({queueRequests.length})</TabsTrigger>
            <TabsTrigger value="approval">Waiting Budget Approval ({waitingAccounting.length})</TabsTrigger>
            <TabsTrigger value="approved">Budget Approved ({proofReadyRequests.length})</TabsTrigger>
            <TabsTrigger value="proof">Waiting Expense Confirmation ({waitingExpenseConfirmation.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
            <TabsTrigger value="suppliers">Supplier Database ({suppliers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4">
            {renderRequestCards(
              queueRequests,
              'No budget requests to prepare',
              'Requests from inventory or contract shortages will land here.',
              (request) => (
                <Button onClick={() => openQuoteDialog(request)}>
                  <FileText className="mr-2 h-4 w-4" />
                  {request.status === 'rejected' ? 'Revise Budget Request' : 'Create Budget Request'}
                </Button>
              )
            )}
          </TabsContent>

          <TabsContent value="approval" className="space-y-4">
            {renderRequestCards(
              waitingAccounting,
              'Nothing is waiting for budget approval',
              'Once you submit the purchasing report, the request moves here until accounting decides on the budget.'
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {renderRequestCards(
              proofReadyRequests,
              'No budget-approved requests yet',
              'Accounting-approved requests will appear here so purchasing can buy the item and submit the proof of purchase.',
              (request) => (
                <Button onClick={() => openFulfillmentDialog(request)}>
                  <PackageCheck className="mr-2 h-4 w-4" />
                  {request.status === 'approved' ? 'Submit Proof Of Purchase' : 'Update Proof'}
                </Button>
              )
            )}
          </TabsContent>

          <TabsContent value="proof" className="space-y-4">
            {renderRequestCards(
              waitingExpenseConfirmation,
              'No proof is waiting for accounting yet',
              'Proof of purchase submissions will stay here until accounting confirms the expense.',
              (request) => (
                <Button variant="outline" onClick={() => openFulfillmentDialog(request)}>
                  <PackageCheck className="mr-2 h-4 w-4" />
                  Update Proof
                </Button>
              )
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {renderRequestCards(
              completedRequests,
              'No completed procurement yet',
              'Finished requests will appear here after accounting confirms the expense.',
              (request) => (
                request.status === 'fulfilled'
                && request.requestType === 'rental'
                && request.fulfillment?.inventoryUpdated
                && !request.fulfillment?.rentalReturned
                  ? (
                    <Button variant="outline" onClick={() => handleReturnRental(request)}>
                      <PackageCheck className="mr-2 h-4 w-4" />
                      Mark Rental Returned
                    </Button>
                  )
                  : request.fulfillment?.rentalReturned
                    ? (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        Rental returned{request.fulfillment.rentalReturnedAt ? ` ${formatProcurementDate(request.fulfillment.rentalReturnedAt)}` : ''}
                      </Badge>
                    )
                    : null
              )
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
                {selectedRequest ? `Budget Request - ${selectedRequest.requestNumber}` : 'Budget Request'}
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
                          <Label htmlFor="quote-notes">Budget Request Notes</Label>
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
                      Submit Budget Request
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
                {selectedRequest
                  ? `${selectedRequest.status === 'approved' ? 'Submit Proof Of Purchase' : 'Update Proof Of Purchase'} - ${selectedRequest.requestNumber}`
                  : 'Submit Proof Of Purchase'}
              </DialogTitle>
            </DialogHeader>
            {selectedRequest ? (
              <>
                <div className="overflow-y-auto px-6 py-4">
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="font-medium">{selectedRequest.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        Budget approved for {selectedRequest.requestedQuantity} units | Needed by {formatProcurementDate(selectedRequest.neededBy)}
                      </p>
                      {selectedRequest.fulfillment?.confirmationNotes ? (
                        <p className="mt-2 text-sm text-amber-700">{selectedRequest.fulfillment.confirmationNotes}</p>
                      ) : null}
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
                        Upload the receipt, OR, invoice, or other proof of purchase for accounting confirmation.
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
                      Submit Proof To Accounting
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Raise a purchase in place of the flagged rentals. Pre-filled from the
            comparison, but submitted by a person. */}
        <Dialog open={buyInsteadDialogOpen} onOpenChange={setBuyInsteadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Raise a purchase instead of renting</DialogTitle>
            </DialogHeader>
            {selectedRequest ? (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">{selectedRequest.itemName}</p>
                  <p className="mt-1 text-muted-foreground">
                    {selectedRequest.rentVsBuy?.summary}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="buy-qty">Quantity to buy</Label>
                    <Input
                      id="buy-qty" type="number" min={1}
                      value={buyInsteadForm.quantity}
                      onChange={(event) => setBuyInsteadForm((current) => ({ ...current, quantity: event.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pre-filled with the peak units needed at any one time, not the number of requests.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buy-needed">Needed by</Label>
                    <Input
                      id="buy-needed" type="date"
                      value={buyInsteadForm.neededBy}
                      onChange={(event) => setBuyInsteadForm((current) => ({ ...current, neededBy: event.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Earliest date any of the rentals needed it.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buy-reason">Reason</Label>
                  <Textarea
                    id="buy-reason" rows={3}
                    value={buyInsteadForm.requestReason}
                    onChange={(event) => setBuyInsteadForm((current) => ({ ...current, requestReason: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buy-notes">Notes for accounting (optional)</Label>
                  <Textarea
                    id="buy-notes" rows={2}
                    value={buyInsteadForm.requestNotes}
                    onChange={(event) => setBuyInsteadForm((current) => ({ ...current, requestNotes: event.target.value }))}
                  />
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-900">
                  <p className="font-medium">The rentals stay open</p>
                  <p className="mt-1">
                    {buyInsteadForm.replacedNumbers} will be linked to this purchase but not closed. If the
                    purchase is refused on budget, the rental fallback is still there. Return them once the
                    purchase is approved.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setBuyInsteadDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleRaisePurchase}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Raise Purchase Request
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
