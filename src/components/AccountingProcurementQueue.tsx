import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle2, Clock3, FileCheck2, XCircle } from 'lucide-react';
import type { ProcurementRequest, ProcurementReviewBasis } from '@/lib/procurement';
import {
  formatProcurementCurrency,
  formatProcurementDate,
  getProcurementReviewBasis,
  PROCUREMENT_REQUEST_TYPE_LABELS,
} from '@/lib/procurement';

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
    description: 'The supplier details are complete and appropriate for the request.',
  },
  {
    key: 'pricingReviewed',
    label: 'Pricing reviewed',
    description: 'The unit price or total quote is documented and acceptable.',
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

const createEmptyChecklist = (): ProcurementReviewBasis => ({
  inventoryNeedValidated: false,
  supplierVerified: false,
  pricingReviewed: false,
  timelineConfirmed: false,
});

export default function AccountingProcurementQueue() {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewChecklist, setReviewChecklist] = useState<ProcurementReviewBasis>(createEmptyChecklist());

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProcurementRequests({ status: 'awaiting_accounting_approval' });
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

  const pendingReviewCount = requests.length;
  const onTimeCount = useMemo(
    () => requests.filter((request) => getProcurementReviewBasis(request).timelineConfirmed).length,
    [requests]
  );
  const withSupplierProfileCount = useMemo(
    () => requests.filter((request) => getProcurementReviewBasis(request).supplierVerified).length,
    [requests]
  );

  const openDecisionDialog = (request: ProcurementRequest, nextDecision: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setDecision(nextDecision);
    setNotes('');
    setRejectionReason('');
    setReviewChecklist(getProcurementReviewBasis(request));
    setDialogOpen(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedRequest) {
      return;
    }

    if (decision === 'approved' && !Object.values(reviewChecklist).every(Boolean)) {
      toast.error('Confirm every accounting review item before approving this request');
      return;
    }

    if (decision === 'rejected' && !rejectionReason && !notes.trim()) {
      toast.error('Select a rejection reason or add notes for purchasing');
      return;
    }

    try {
      await api.reviewProcurementRequest(selectedRequest._id, {
        decision,
        notes: notes.trim(),
        rejectionReason,
        reviewChecklist,
      });
      toast.success(decision === 'approved' ? 'Procurement request approved' : 'Procurement request sent back for revision');
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
            Purchasing reports will appear here after the supplier quote is submitted.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <p className="mt-2 text-2xl font-semibold">{pendingReviewCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">On-Time Quotes</p>
            <p className="mt-2 text-2xl font-semibold">{onTimeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">With Supplier Match</p>
            <p className="mt-2 text-2xl font-semibold">{withSupplierProfileCount}</p>
          </CardContent>
        </Card>
      </div>

      {requests.map((request) => {
        const reviewBasis = getProcurementReviewBasis(request);
        const supplierProfile = request.quote?.supplier;

        return (
          <Card key={request._id}>
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{request.requestNumber}</CardTitle>
                    <Badge variant="outline">{PROCUREMENT_REQUEST_TYPE_LABELS[request.requestType]}</Badge>
                    <Badge variant="outline" className={reviewBasis.timelineConfirmed ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}>
                      {reviewBasis.timelineConfirmed ? 'On time' : 'Timing risk'}
                    </Badge>
                  </div>
                  <p className="font-medium">{request.itemName}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.requestedQuantity} units | Needed by {formatProcurementDate(request.neededBy)}
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
                  <p className="text-sm font-medium">Supplier And Quote</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Supplier:</span> {request.quote?.supplierName || 'Not set'}</p>
                    <p><span className="text-muted-foreground">Total Quote:</span> {formatProcurementCurrency(request.quote?.quotedTotal)}</p>
                    <p><span className="text-muted-foreground">Unit Price:</span> {formatProcurementCurrency(request.quote?.quotedUnitPrice)}</p>
                    <p><span className="text-muted-foreground">Expected:</span> {formatProcurementDate(request.quote?.expectedFulfillmentDate)}</p>
                    {supplierProfile ? (
                      <p className="pt-1 text-muted-foreground">
                        Directory match: {[supplierProfile.city, supplierProfile.province].filter(Boolean).join(', ') || 'Supplier profile linked'}
                      </p>
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
                  <p className="text-sm font-medium">Why Approve Or Return</p>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>Approve when the supplier is verified, the quote is documented, and the timeline still supports the need date.</p>
                    <p>Return when the price, timing, or supplier fit still needs revision from purchasing.</p>
                    {request.requestType === 'rental' ? (
                      <p>For rentals, also confirm the rental start and return dates make sense for the event.</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => openDecisionDialog(request, 'approved')}>
                  <FileCheck2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button variant="outline" onClick={() => openDecisionDialog(request, 'rejected')}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Return To Purchasing
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {decision === 'approved' ? 'Approve Procurement Request' : 'Return Procurement Request'}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest ? (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="font-medium">{selectedRequest.requestNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.itemName} | {formatProcurementCurrency(selectedRequest.quote?.quotedTotal)} | Needed by {formatProcurementDate(selectedRequest.neededBy)}
                </p>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <p className="font-medium">Accounting Review Checklist</p>
                {REVIEW_FIELDS.map((field) => (
                  <label key={field.key} className="flex items-start gap-3 rounded-lg border p-3">
                    <Checkbox
                      checked={reviewChecklist[field.key]}
                      onCheckedChange={(checked) => setReviewChecklist((current) => ({
                        ...current,
                        [field.key]: Boolean(checked),
                      }))}
                    />
                    <div>
                      <p className="font-medium">{field.label}</p>
                      <p className="text-sm text-muted-foreground">{field.description}</p>
                    </div>
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

              <div className="space-y-2">
                <Label htmlFor="accounting-notes">Accounting Notes</Label>
                <Textarea
                  id="accounting-notes"
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={decision === 'approved' ? 'Optional approval note for purchasing.' : 'Tell purchasing what needs to be revised.'}
                />
              </div>

              <Button onClick={handleSubmitDecision} className="w-full">
                {decision === 'approved' ? 'Confirm Approval' : 'Send Back To Purchasing'}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
