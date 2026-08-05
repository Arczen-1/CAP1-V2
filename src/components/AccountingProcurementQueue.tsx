import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import RentVsBuyPanel from '@/components/RentVsBuyPanel';
import { toast } from 'sonner';
import { CheckCircle2, Clock3, FileCheck2, ReceiptText, RotateCcw, XCircle } from 'lucide-react';
import type { ProcurementRequest, ProcurementReviewBasis, ProcurementSupplierSummary } from '@/lib/procurement';
import {
  formatProcurementCurrency,
  formatProcurementDate,
  getProcurementRequisitionTypeLabel,
  getProcurementReleaseLabel,
  getProcurementReviewBasis,
  getSupplierVerificationChecks,
  getSupplierMatchReasons,
  getRecommendedSuppliersForRequest,
  getProcurementSlaStatusLabel,
  PROCUREMENT_REQUEST_TYPE_LABELS,
  PROCUREMENT_SLA_STATUS_STYLES,
} from '@/lib/procurement';

// The evidence behind one checklist line, shown beside the box being ticked.
// Reviewers were confirming four statements with only the statements on screen;
// the data that answers them lived on the card behind the dialog.
function ChecklistEvidence({ field, request, suppliers }: {
  field: keyof ProcurementReviewBasis;
  request: ProcurementRequest;
  suppliers: ProcurementSupplierSummary[];
}) {
  const row = (label: string, value: ReactNode) => (
    <div className="flex gap-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  if (field === 'inventoryNeedValidated') {
    return (
      <div className="h-full space-y-1.5 rounded-md bg-muted/40 p-3 text-xs">
        {row('Item', `${request.itemName}${request.itemCategory ? ` (${request.itemCategory})` : ''}`)}
        {row('Quantity', `${request.requestedQuantity} unit(s)${request.shortageQuantity ? ` - short ${request.shortageQuantity}` : ''}`)}
        {request.contract
          ? row('For', `${request.contract.contractNumber} - ${request.contract.clientName}${request.contract.eventDate ? `, ${formatProcurementDate(request.contract.eventDate)}` : ''}`)
          : row('For', 'Stock replenishment (no contract)')}
        {request.requestReason ? <p className="pt-1 italic text-muted-foreground">{request.requestReason}</p> : null}
      </div>
    );
  }

  if (field === 'supplierVerified') {
    const checks = getSupplierVerificationChecks(request);
    const reasons = getSupplierMatchReasons(request);
    return (
      <div className="h-full space-y-2 rounded-md bg-muted/40 p-3 text-xs">
        <ul className="space-y-1">
          {checks.map((check) => (
            <li key={check.label} className="flex items-start gap-1.5">
              {check.passed
                ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                : <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />}
              <span className={check.passed ? '' : 'text-destructive'}>
                <span className="font-medium">{check.label}</span> — {check.detail}
              </span>
            </li>
          ))}
        </ul>
        {reasons.length ? (
          <div className="border-t pt-2">
            <p className="font-medium">Why this supplier</p>
            <p className="text-muted-foreground">{reasons.join(' · ')}</p>
          </div>
        ) : (
          <p className="border-t pt-2 text-muted-foreground">
            Nothing on the supplier record matches this request, so there is no recorded reason for choosing them.
          </p>
        )}
        {/* Who else could have supplied this. Read-only on purpose: Accounting
            reviews Purchasing's choice, it does not make it. If the choice looks
            wrong the request is returned with "Supplier issue" so Purchasing
            re-sources, which keeps the decision and the payment separate. */}
        {(() => {
          const chosenId = request.quote?.supplier?._id;
          const alternatives = getRecommendedSuppliersForRequest(request, suppliers, 4)
            .filter((entry) => entry.supplier._id !== chosenId)
            .slice(0, 3);
          if (!alternatives.length) {
            return null;
          }
          return (
            <div className="border-t pt-2">
              <p className="font-medium">Other suppliers that could have been used</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {alternatives.map((entry) => (
                  <li key={entry.supplier._id}>
                    {entry.supplier.name}
                    {entry.supplier.isPreferred ? ' (preferred)' : ''}
                  </li>
                ))}
              </ul>
              <p className="mt-1 italic">
                Purchasing selects the supplier. Return the request with &quot;Supplier issue&quot; if this choice should be reconsidered.
              </p>
            </div>
          );
        })()}
      </div>
    );
  }

  if (field === 'pricingReviewed') {
    return (
      <div className="h-full space-y-1.5 rounded-md bg-muted/40 p-3 text-xs">
        {row('Unit price', formatProcurementCurrency(request.quote?.quotedUnitPrice))}
        {row('Total', formatProcurementCurrency(request.quote?.quotedTotal))}
        {row('Quote ref', request.quote?.quoteReference || 'Not recorded')}
        {row('Quoted by', request.quote?.submittedBy?.name || request.quote?.supplierName || 'Not recorded')}
      </div>
    );
  }

  return (
    <div className="h-full space-y-1.5 rounded-md bg-muted/40 p-3 text-xs">
      {row('Needed by', formatProcurementDate(request.neededBy))}
      {row('Expected', formatProcurementDate(request.quote?.expectedFulfillmentDate))}
      {row('Lead time', request.quote?.leadTimeDays != null ? `${request.quote.leadTimeDays} day(s)` : 'Not recorded')}
      {row('SLA', `${getProcurementSlaStatusLabel(request.sla?.status)}${request.sla?.daysUntilNeeded != null ? ` - ${request.sla.daysUntilNeeded} day(s) until needed` : ''}`)}
    </div>
  );
}

const REVIEW_FIELDS: Array<{
  key: keyof ProcurementReviewBasis;
  label: string;
  description: string;
}> = [
  {
    key: 'inventoryNeedValidated',
    label: 'Need validated',
    description: 'The request clearly states the item, quantity, and why it is needed.',
  },
  {
    key: 'supplierVerified',
    label: 'Supplier verified',
    // Purchasing checks the supplier can deliver; Accounting checks the
    // supplier is payable. Same separation of duties as anywhere else money
    // moves - whoever chooses the vendor does not also release the funds.
    description: 'The quoted supplier is an accredited directory supplier, still active, and cleared for this department and request type. See the checks below.',
  },
  {
    key: 'pricingReviewed',
    label: 'Pricing reviewed',
    description: 'The supplier pricing is documented and acceptable.',
  },
  {
    key: 'timelineConfirmed',
    label: 'Timeline confirmed',
    description: 'The expected fulfillment date still supports the needed-by date.',
  },
];

const REJECTION_REASONS = [
  { value: 'missing_quote_details', label: 'Missing quote details' },
  { value: 'price_too_high', label: 'Price too high' },
  { value: 'timeline_risk', label: 'Timeline risk' },
  { value: 'supplier_issue', label: 'Supplier issue' },
  { value: 'need_not_justified', label: 'Need not justified' },
  { value: 'budget_hold', label: 'Budget hold' },
  { value: 'other', label: 'Other' },
];

type ReviewMode = 'budget' | 'expense';
type ReviewDecision = 'approved' | 'rejected' | 'confirmed' | 'needs_revision';

const createEmptyChecklist = (): ProcurementReviewBasis => ({
  inventoryNeedValidated: false,
  supplierVerified: false,
  pricingReviewed: false,
  timelineConfirmed: false,
});

export default function AccountingProcurementQueue() {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  // Read-only. Used to show which other suppliers the request could have gone
  // to, so Accounting can see Purchasing's choice was considered rather than
  // arbitrary. Accounting cannot change the supplier from here - if the choice
  // looks wrong the request is returned with "Supplier issue".
  const [suppliers, setSuppliers] = useState<ProcurementSupplierSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>('budget');
  const [decision, setDecision] = useState<ReviewDecision>('approved');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewChecklist, setReviewChecklist] = useState<ProcurementReviewBasis>(createEmptyChecklist());
  const [sortOrder, setSortOrder] = useState<'created_desc' | 'created_asc' | 'event_asc' | 'needed_asc'>('created_desc');
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeQueue, setActiveQueue] = useState<'budget' | 'expense'>(
    searchParams.get('queue') === 'expense' ? 'expense' : 'budget'
  );
  // Deep-linked request from a notification: scroll to it and highlight it briefly.
  const highlightRequestId = searchParams.get('request') || '';

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProcurementRequests({ status: 'awaiting_accounting_approval,proof_submitted' });
      setRequests(data as ProcurementRequest[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load procurement approvals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // The alternatives panel is supporting context, so a failure here must not
  // block the queue from loading - it just means no alternatives are shown.
  useEffect(() => {
    api.getSuppliers()
      .then((data) => setSuppliers(data as ProcurementSupplierSummary[]))
      .catch(() => setSuppliers([]));
  }, []);

  const sortRequests = useMemo(() => {
    const created = (request: ProcurementRequest) => new Date(request.createdAt).getTime();
    const eventTime = (request: ProcurementRequest) => (request.contract?.eventDate || request.eventDate ? new Date(request.contract?.eventDate || request.eventDate || 0).getTime() : Number.POSITIVE_INFINITY);
    const neededTime = (request: ProcurementRequest) => new Date(request.neededBy || request.createdAt).getTime();

    return (list: ProcurementRequest[]) => [...list].sort((left, right) => {
      switch (sortOrder) {
        case 'created_asc':
          return created(left) - created(right);
        case 'event_asc':
          return eventTime(left) - eventTime(right);
        case 'needed_asc':
          return neededTime(left) - neededTime(right);
        case 'created_desc':
        default:
          return created(right) - created(left);
      }
    });
  }, [sortOrder]);

  const budgetRequests = useMemo(
    () => sortRequests(requests.filter((request) => request.status === 'awaiting_accounting_approval')),
    [requests, sortRequests]
  );
  const expenseRequests = useMemo(
    () => sortRequests(requests.filter((request) => request.status === 'proof_submitted')),
    [requests, sortRequests]
  );
  const withSupplierProfileCount = useMemo(
    () => requests.filter((request) => getProcurementReviewBasis(request).supplierVerified).length,
    [requests]
  );
  const rushSlaCount = useMemo(
    () => requests.filter((request) => request.sla?.status === 'rush' || request.sla?.status === 'blocked').length,
    [requests]
  );

  // When arriving from a notification, open the queue that actually holds the
  // request and scroll it into view.
  useEffect(() => {
    if (!highlightRequestId || requests.length === 0) {
      return;
    }

    const target = requests.find((request) => request._id === highlightRequestId);
    if (target) {
      setActiveQueue(target.status === 'proof_submitted' ? 'expense' : 'budget');
    }

    const timer = window.setTimeout(() => {
      document
        .querySelector(`[data-request-id="${highlightRequestId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [highlightRequestId, requests, activeQueue]);

  const handleQueueChange = (value: string) => {
    const nextQueue = value === 'expense' ? 'expense' : 'budget';
    setActiveQueue(nextQueue);
    const next = new URLSearchParams(searchParams);
    next.set('queue', nextQueue);
    next.delete('request');
    setSearchParams(next, { replace: true });
  };

  const renderSortControl = () => (
    <div className="space-y-1">
      <Label className="text-xs">Sort by</Label>
      <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as typeof sortOrder)}>
        <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="created_desc">Newest first</SelectItem>
          <SelectItem value="created_asc">Oldest first</SelectItem>
          <SelectItem value="event_asc">Event date (soonest)</SelectItem>
          <SelectItem value="needed_asc">Needed by (soonest)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // Shared card props so a deep-linked request stands out when scrolled to.
  const getCardProps = (requestId: string) => ({
    'data-request-id': requestId,
    ...(requestId === highlightRequestId ? { className: 'ring-2 ring-primary ring-offset-2' } : {}),
  });

  const openBudgetDialog = (request: ProcurementRequest, nextDecision: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setReviewMode('budget');
    setDecision(nextDecision);
    setNotes('');
    setRejectionReason('');
    setReviewChecklist(getProcurementReviewBasis(request));
    setDialogOpen(true);
  };

  // Accounting cannot raise procurement requests - only Purchasing and the
  // owning departments can. So the follow-through here is to return the request
  // with the comparison already written out, rather than making someone retype
  // the numbers into a note.
  const openRecommendPurchaseDialog = (request: ProcurementRequest) => {
    const analysis = request.rentVsBuy;
    if (!analysis) return;

    setSelectedRequest(request);
    setReviewMode('budget');
    setDecision('rejected');
    setRejectionReason('');
    setNotes(
      `Returning this rental: buying looks cheaper. ${analysis.summary} `
      + `Please raise a purchase request for ${analysis.unitsNeeded} unit(s) instead, `
      + `or reply explaining why renting is still the better option.`
    );
    setReviewChecklist(getProcurementReviewBasis(request));
    setDialogOpen(true);
  };

  const openExpenseDialog = (request: ProcurementRequest, nextDecision: 'confirmed' | 'needs_revision') => {
    setSelectedRequest(request);
    setReviewMode('expense');
    setDecision(nextDecision);
    setNotes('');
    setRejectionReason('');
    setReviewChecklist(createEmptyChecklist());
    setDialogOpen(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedRequest) {
      return;
    }

    try {
      if (reviewMode === 'budget') {
        if (!['approved', 'rejected'].includes(decision)) {
          toast.error('Choose whether to approve or return the budget request.');
          return;
        }

        if (decision === 'approved' && !Object.values(reviewChecklist).every(Boolean)) {
          toast.error('Confirm every accounting review item before approving this budget request.');
          return;
        }

        if (decision === 'rejected' && !rejectionReason && !notes.trim()) {
          toast.error('Select a return reason or add notes for purchasing.');
          return;
        }

        await api.reviewProcurementRequest(selectedRequest._id, {
          decision,
          notes: notes.trim(),
          rejectionReason,
          reviewChecklist,
        });
        toast.success(decision === 'approved' ? 'Budget approved for purchasing' : 'Budget request returned to purchasing');
      } else {
        if (!['confirmed', 'needs_revision'].includes(decision)) {
          toast.error('Choose whether to confirm the expense or request updated proof.');
          return;
        }

        if (decision === 'needs_revision' && !notes.trim()) {
          toast.error('Add notes so purchasing knows what proof needs to be updated.');
          return;
        }

        await api.reviewProcurementExpense(selectedRequest._id, {
          decision,
          notes: notes.trim(),
        });
        toast.success(decision === 'confirmed' ? 'Expense confirmed and request completed' : 'Proof returned to purchasing');
      }

      setDialogOpen(false);
      setSelectedRequest(null);
      setNotes('');
      setRejectionReason('');
      setReviewChecklist(createEmptyChecklist());
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update procurement approval');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-lg font-medium">No procurement approvals waiting</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Budget requests and proof-of-purchase confirmations will appear here for accounting review.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Budget Reviews</p>
            <p className="mt-2 text-2xl font-semibold">{budgetRequests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Expense Confirmations</p>
            <p className="mt-2 text-2xl font-semibold">{expenseRequests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Supplier Matched</p>
            <p className="mt-2 text-2xl font-semibold">{withSupplierProfileCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">SLA Rush / Blocked</p>
            <p className="mt-2 text-2xl font-semibold">{rushSlaCount}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeQueue} onValueChange={handleQueueChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="budget">Budget Approval Queue ({budgetRequests.length})</TabsTrigger>
          <TabsTrigger value="expense">Expense Confirmation Queue ({expenseRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Budget Approval Queue</h2>
            <p className="text-sm text-muted-foreground">
              Review the supplier, amount, and timeline before releasing budget to purchasing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {renderSortControl()}
            <Badge variant="outline">{budgetRequests.length} waiting</Badge>
          </div>
        </CardContent>
      </Card>

      {budgetRequests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No budget requests are waiting for accounting approval right now.
          </CardContent>
        </Card>
      ) : (
        budgetRequests.map((request) => {
          const reviewBasis = getProcurementReviewBasis(request);
          const supplierProfile = request.quote?.supplier;

          return (
            <Card key={request._id} {...getCardProps(request._id)}>
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{request.requestNumber}</CardTitle>
                      <Badge variant="outline">{PROCUREMENT_REQUEST_TYPE_LABELS[request.requestType]}</Badge>
                      <Badge variant="outline">{getProcurementRequisitionTypeLabel(request.requisitionType)}</Badge>
                      {request.sla?.status ? (
                        <Badge variant="outline" className={PROCUREMENT_SLA_STATUS_STYLES[request.sla.status]}>
                          {getProcurementSlaStatusLabel(request.sla.status)}
                        </Badge>
                      ) : null}
                      <Badge variant="outline" className={reviewBasis.timelineConfirmed ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}>
                        {reviewBasis.timelineConfirmed ? 'On time' : 'Timing risk'}
                      </Badge>
                    </div>
                    <p className="font-medium">{request.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.requestedQuantity} units | Needed by {formatProcurementDate(request.neededBy)}
                      {typeof request.sla?.daysUntilNeeded === 'number' ? ` | ${request.sla.daysUntilNeeded} day(s) lead` : ''}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Department</p>
                      <p className="mt-1 font-semibold capitalize">{request.department}</p>
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
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Need Summary</p>
                    <p className="mt-3 text-sm text-muted-foreground">{request.requestReason}</p>
                    {request.contract ? (
                      <Link to={`/contracts/${request.contract._id}`} className="mt-3 inline-flex text-sm text-primary hover:underline">
                        Open linked contract
                      </Link>
                    ) : null}
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Supplier And Amount</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Supplier:</span> {request.quote?.supplierName || 'Not set'}</p>
                      <p><span className="text-muted-foreground">Unit Price:</span> {formatProcurementCurrency(request.quote?.quotedUnitPrice)}</p>
                      <p><span className="text-muted-foreground">Estimated Total:</span> {formatProcurementCurrency(request.quote?.quotedTotal)}</p>
                      <p><span className="text-muted-foreground">Expected:</span> {formatProcurementDate(request.quote?.expectedFulfillmentDate)}</p>
                      {supplierProfile ? (
                        <p className="pt-1 text-muted-foreground">
                          Directory match: {[supplierProfile.city, supplierProfile.province].filter(Boolean).join(', ') || 'Supplier profile linked'}
                        </p>
                      ) : null}
                    </div>

                    {/* The basis for the "Supplier verified" tick. Purchasing
                        confirms the supplier can deliver; these are the
                        separate checks Accounting is answering before it
                        releases money. */}
                    <div className="mt-4 border-t pt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Basis for supplier verification
                      </p>
                      <ul className="mt-2 space-y-2">
                        {getSupplierVerificationChecks(request).map((check) => (
                          <li key={check.label} className="flex items-start gap-2 text-sm">
                            {check.passed
                              ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                            <span>
                              <span className={check.passed ? 'font-medium' : 'font-medium text-destructive'}>{check.label}</span>
                              <span className="block text-xs text-muted-foreground">{check.detail}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      {/* The supplier directory itself sits inside the
                          Purchasing dashboard, which Accounting cannot open,
                          so the record is shown here rather than linked. */}
                      {supplierProfile ? (
                        <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                          <p className="font-medium text-foreground">{supplierProfile.name}</p>
                          {[supplierProfile.address, supplierProfile.city, supplierProfile.province]
                            .filter(Boolean).length ? (
                            <p>{[supplierProfile.address, supplierProfile.city, supplierProfile.province].filter(Boolean).join(', ')}</p>
                          ) : null}
                          {supplierProfile.supportedCategories?.length ? (
                            <p className="mt-1">Supplies: {supplierProfile.supportedCategories.join(', ')}</p>
                          ) : null}
                          {supplierProfile.notes ? <p className="mt-1 italic">{supplierProfile.notes}</p> : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Accounting Basis</p>
                    <div className="mt-3 space-y-2 text-sm">
                      {REVIEW_FIELDS.map((field) => (
                        <div key={field.key} className="flex items-start gap-2">
                          {reviewBasis[field.key] ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                          ) : (
                            <Clock3 className="mt-0.5 h-4 w-4 text-amber-600" />
                          )}
                          <div>
                            <p className="font-medium">{field.label}</p>
                            <p className="text-muted-foreground">{field.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Accounting Action</p>
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <p>Approve when the supplier, amount, and needed-by date are all acceptable for budget release.</p>
                      <p>{getProcurementReleaseLabel(request)} until this request is approved by accounting.</p>
                      <p>Return when the price, supplier, or timing still needs revision from purchasing.</p>
                    </div>
                  </div>
                </div>

                {/* Another event wants this same item. Shown before the approve
                    buttons, because it is the one thing that might change the
                    decision about to be made. */}
                <RentVsBuyPanel
                  analysis={request.rentVsBuy}
                  action={request.rentVsBuy?.recommendation === 'buy' ? (
                    <Button size="sm" variant="outline" onClick={() => openRecommendPurchaseDialog(request)}>
                      Recommend purchase to Purchasing
                    </Button>
                  ) : null}
                />

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => openBudgetDialog(request, 'approved')}>
                    <FileCheck2 className="mr-2 h-4 w-4" />
                    Approve Budget
                  </Button>
                  <Button variant="outline" onClick={() => openBudgetDialog(request, 'rejected')}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Return To Purchasing
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

        </TabsContent>

        <TabsContent value="expense" className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Expense Confirmation Queue</h2>
            <p className="text-sm text-muted-foreground">
              Confirm the uploaded receipt or purchase proof after Purchasing records the completed acquisition.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {renderSortControl()}
            <Badge variant="outline">{expenseRequests.length} waiting</Badge>
          </div>
        </CardContent>
      </Card>

      {expenseRequests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No proof-of-purchase submissions are waiting for accounting confirmation right now.
          </CardContent>
        </Card>
      ) : (
        expenseRequests.map((request) => (
          <Card key={request._id} {...getCardProps(request._id)}>
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{request.requestNumber}</CardTitle>
                    <Badge variant="outline">{PROCUREMENT_REQUEST_TYPE_LABELS[request.requestType]}</Badge>
                    <Badge variant="outline">{getProcurementRequisitionTypeLabel(request.requisitionType)}</Badge>
                    <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-900">
                      Waiting expense confirmation
                    </Badge>
                  </div>
                  <p className="font-medium">{request.itemName}</p>
                  <p className="text-sm text-muted-foreground">
                    Proof submitted {formatProcurementDate(request.fulfillment?.fulfilledAt)} | {request.fulfillment?.receivedQuantity || request.requestedQuantity} unit(s) received
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="text-muted-foreground">Supplier</p>
                    <p className="mt-1 font-semibold">{request.quote?.supplierName || 'Not set'}</p>
                  </div>
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="text-muted-foreground">Reference</p>
                    <p className="mt-1 font-semibold">{request.fulfillment?.invoiceReference || 'Not set'}</p>
                  </div>
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="text-muted-foreground">Estimated Total</p>
                    <p className="mt-1 font-semibold">{formatProcurementCurrency(request.quote?.quotedTotal)}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Budget Summary</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Budget Status:</span> Approved</p>
                    <p><span className="text-muted-foreground">Release:</span> {getProcurementReleaseLabel(request)}</p>
                    <p><span className="text-muted-foreground">Unit Price:</span> {formatProcurementCurrency(request.quote?.quotedUnitPrice)}</p>
                    <p><span className="text-muted-foreground">Estimated Total:</span> {formatProcurementCurrency(request.quote?.quotedTotal)}</p>
                    <p><span className="text-muted-foreground">Expected Date:</span> {formatProcurementDate(request.quote?.expectedFulfillmentDate)}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Proof Submitted</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Submitted:</span> {formatProcurementDate(request.fulfillment?.fulfilledAt)}</p>
                    <p><span className="text-muted-foreground">Received Qty:</span> {request.fulfillment?.receivedQuantity || request.requestedQuantity}</p>
                    <p><span className="text-muted-foreground">Reference:</span> {request.fulfillment?.invoiceReference || 'Not set'}</p>
                    {request.fulfillment?.attachments?.[0] ? (
                      <p>
                        <span className="text-muted-foreground">Attachment:</span>{' '}
                        <a
                          href={request.fulfillment.attachments[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          View proof file
                        </a>
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Inventory Update</p>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>{request.fulfillment?.inventoryUpdateSummary || 'Inventory update summary not available.'}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Accounting Action</p>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>Confirm the expense when the proof, OR/receipt reference, and submitted details are acceptable.</p>
                    <p>Request an update when Purchasing needs to upload clearer or corrected proof.</p>
                  </div>
                </div>
              </div>

              {request.fulfillment?.notes ? (
                <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                  {request.fulfillment.notes}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => openExpenseDialog(request, 'confirmed')}>
                  <ReceiptText className="mr-2 h-4 w-4" />
                  Confirm Expense
                </Button>
                <Button variant="outline" onClick={() => openExpenseDialog(request, 'needs_revision')}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Request Updated Proof
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[88vh] w-[95vw] sm:max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {reviewMode === 'budget'
                ? decision === 'approved'
                  ? 'Approve Budget Request'
                  : 'Return Budget Request'
                : decision === 'confirmed'
                  ? 'Confirm Expense'
                  : 'Request Updated Proof'}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest ? (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="font-medium">{selectedRequest.requestNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.itemName} | {selectedRequest.requestedQuantity} unit(s) | Needed by {formatProcurementDate(selectedRequest.neededBy)}
                </p>
              </div>

              {/* Money is committed on this screen, so the rent-vs-buy overlap
                  has to be said here and not only on the queue card behind the
                  dialog. Warned, never blocked: if the purchase is refused on
                  budget, approving the rental is the correct call. */}
              {reviewMode === 'budget' && decision === 'approved' ? (() => {
                const openPurchases = (selectedRequest.rentVsBuy?.relatedRequests || [])
                  .filter((related) => related.requestType === 'purchase');
                const openRentals = (selectedRequest.replacesRequests || [])
                  .filter((replaced) => !['rejected', 'cancelled', 'fulfilled'].includes(replaced.status));

                if (selectedRequest.requestType === 'rental' && openPurchases.length) {
                  return (
                    <div className="rounded-lg border border-red-200 bg-red-50/80 p-4 text-sm text-red-900">
                      <p className="font-medium">A purchase is already open for this item</p>
                      <p className="mt-1">
                        {openPurchases.map((purchase) => purchase.requestNumber).join(', ')} was raised to buy this
                        item instead of renting it. Approving this rental as well would pay for the same need twice.
                      </p>
                      <p className="mt-2">
                        Approve only if the purchase is being refused. Otherwise return this rental and approve the purchase.
                      </p>
                    </div>
                  );
                }

                if (selectedRequest.requestType === 'purchase' && openRentals.length) {
                  return (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                      <p className="font-medium">Rental requests for this item are still open</p>
                      <p className="mt-1">
                        This purchase replaces {openRentals.map((rental) => rental.requestNumber).join(', ')}, which
                        are still in the queue. Approving this does not close them.
                      </p>
                      <p className="mt-2">Return those rentals after approving, or the item may be rented as well.</p>
                    </div>
                  );
                }

                return null;
              })() : null}

              {reviewMode === 'budget' ? (
                <>
                  <div className="space-y-3 rounded-lg border p-4">
                    <p className="font-medium">Accounting Review Checklist</p>
                    {decision === 'approved' ? (
                      <p className="text-sm text-muted-foreground">
                        Confirming this checklist creates the digital accounting release authorization for purchasing.
                      </p>
                    ) : null}
                    {REVIEW_FIELDS.map((field) => (
                      // Statement on the left, the evidence for it on the right,
                      // so each line reads across instead of stacking into a
                      // narrow column. Falls back to stacked on small screens.
                      <label
                        key={field.key}
                        className="grid items-start gap-3 rounded-lg border p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-5"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            className="mt-0.5"
                            checked={reviewChecklist[field.key]}
                            onCheckedChange={(checked) => setReviewChecklist((current) => ({
                              ...current,
                              [field.key]: Boolean(checked),
                            }))}
                          />
                          <div className="min-w-0">
                            <p className="font-medium">{field.label}</p>
                            <p className="text-sm text-muted-foreground">{field.description}</p>
                          </div>
                        </div>
                        <ChecklistEvidence field={field.key} request={selectedRequest} suppliers={suppliers} />
                      </label>
                    ))}
                  </div>

                  {decision === 'rejected' ? (
                    <div className="space-y-2">
                      <Label htmlFor="rejection-reason">Return Reason</Label>
                      <Select value={rejectionReason} onValueChange={setRejectionReason}>
                        <SelectTrigger id="rejection-reason">
                          <SelectValue placeholder="Select a reason for purchasing" />
                        </SelectTrigger>
                        <SelectContent>
                          {REJECTION_REASONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="space-y-3 rounded-lg border p-4 text-sm">
                  <p><span className="text-muted-foreground">Supplier:</span> {selectedRequest.quote?.supplierName || 'Not set'}</p>
                  <p><span className="text-muted-foreground">Reference:</span> {selectedRequest.fulfillment?.invoiceReference || 'Not set'}</p>
                  <p><span className="text-muted-foreground">Attachment:</span> {selectedRequest.fulfillment?.attachments?.[0] ? 'Proof file uploaded' : 'No file uploaded'}</p>
                  {selectedRequest.fulfillment?.attachments?.[0] ? (
                    <a
                      href={selectedRequest.fulfillment.attachments[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-primary hover:underline"
                    >
                      Open uploaded proof
                    </a>
                  ) : null}
                  {selectedRequest.fulfillment?.notes ? (
                    <p className="text-muted-foreground">{selectedRequest.fulfillment.notes}</p>
                  ) : null}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="accounting-notes">
                  {reviewMode === 'budget' ? 'Accounting Notes' : 'Accounting Confirmation Notes'}
                </Label>
                <Textarea
                  id="accounting-notes"
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={
                    reviewMode === 'budget'
                      ? decision === 'approved'
                        ? 'Optional note for the approved budget request.'
                        : 'Tell purchasing what needs to be revised before budget approval.'
                      : decision === 'confirmed'
                        ? 'Optional note confirming the proof of purchase.'
                        : 'Tell purchasing what proof or receipt details need to be updated.'
                  }
                />
              </div>

              <Button onClick={handleSubmitDecision} className="w-full">
                {reviewMode === 'budget'
                  ? decision === 'approved'
                    ? 'Confirm Budget Approval'
                    : 'Send Back To Purchasing'
                  : decision === 'confirmed'
                    ? 'Confirm Expense'
                    : 'Request Updated Proof'}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
