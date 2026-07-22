export type ProcurementDepartment = 'creative' | 'linen' | 'stockroom';
export type ProcurementRequestType = 'purchase' | 'rental';
export type ProcurementRequisitionType = 'item_requisition' | 'purchase_requisition' | 'emergency_requisition';
export type ProcurementSlaStatus = 'on_track' | 'rush' | 'blocked';
export type ProcurementStatus =
  | 'requested'
  | 'awaiting_accounting_approval'
  | 'approved'
  | 'proof_submitted'
  | 'proof_needs_revision'
  | 'rejected'
  | 'fulfilled'
  | 'cancelled';

export interface ProcurementUserSummary {
  _id: string;
  name: string;
  role: string;
  department?: string;
}

export interface ProcurementInventorySummary {
  _id: string;
  itemCode?: string;
  name?: string;
  category?: string;
}

export interface ProcurementContractSummary {
  _id: string;
  contractNumber: string;
  clientName: string;
  eventDate?: string;
  venue?: {
    name?: string;
    address?: string;
  };
}

export interface ProcurementSupplierSummary {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  serviceAreas?: string[];
  departments?: ProcurementDepartment[];
  requestTypes?: ProcurementRequestType[];
  supportedCategories?: string[];
  supportedKeywords?: string[];
  isPreferred?: boolean;
  priority?: number;
  notes?: string;
  isActive?: boolean;
}

export interface ProcurementRequest {
  _id: string;
  requestNumber: string;
  status: ProcurementStatus;
  department: ProcurementDepartment;
  requestType: ProcurementRequestType;
  requisitionType?: ProcurementRequisitionType;
  source: 'contract_shortage' | 'inventory_low_stock' | 'manual';
  sourceSection?: string;
  contract?: ProcurementContractSummary | null;
  eventDate?: string;
  neededBy: string;
  inventoryModel: string;
  inventoryItem?: ProcurementInventorySummary | null;
  itemName: string;
  itemCode?: string;
  itemCategory?: string;
  requestedQuantity: number;
  shortageQuantity?: number;
  requestReason: string;
  requestNotes?: string;
  sla?: {
    requiredLeadDays?: number;
    daysUntilNeeded?: number;
    status?: ProcurementSlaStatus;
    reviewNote?: string;
    computedAt?: string;
  };
  quote?: {
    supplier?: ProcurementSupplierSummary | null;
    supplierName?: string;
    supplierContact?: string;
    supplierEmail?: string;
    quotedUnitPrice?: number;
    quotedTotal?: number;
    leadTimeDays?: number;
    quoteReference?: string;
    expectedFulfillmentDate?: string;
    rentalStartDate?: string;
    rentalEndDate?: string;
    notes?: string;
    submittedAt?: string;
    submittedBy?: ProcurementUserSummary | null;
  };
  accounting?: {
    status?: 'pending' | 'approved' | 'rejected';
    reviewedAt?: string;
    reviewedBy?: ProcurementUserSummary | null;
    notes?: string;
    rejectionReason?: string;
    reviewChecklist?: {
      inventoryNeedValidated?: boolean;
      supplierVerified?: boolean;
      pricingReviewed?: boolean;
      timelineConfirmed?: boolean;
    };
  };
  releaseAuthorization?: {
    status?: 'locked' | 'authorized' | 'rejected' | 'released';
    authorizedAt?: string;
    authorizedBy?: ProcurementUserSummary | null;
    signatureLabel?: string;
    notes?: string;
  };
  fulfillment?: {
    receivedQuantity?: number;
    invoiceReference?: string;
    rentalStartDate?: string;
    rentalEndDate?: string;
    notes?: string;
    attachments?: string[];
    confirmationStatus?: 'pending' | 'confirmed' | 'needs_revision';
    confirmedAt?: string;
    confirmedBy?: ProcurementUserSummary | null;
    confirmationNotes?: string;
    fulfilledAt?: string;
    fulfilledBy?: ProcurementUserSummary | null;
    inventoryUpdated?: boolean;
    inventoryUpdateSummary?: string;
  };
  createdBy?: ProcurementUserSummary | null;
  updatedBy?: ProcurementUserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryProcurementOption {
  _id: string;
  itemCode: string;
  name: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  minimumStock?: number;
  status?: string;
}

export interface ProcurementReviewBasis {
  inventoryNeedValidated: boolean;
  supplierVerified: boolean;
  pricingReviewed: boolean;
  timelineConfirmed: boolean;
}

export const PROCUREMENT_STATUS_LABELS: Record<ProcurementStatus, string> = {
  requested: 'Needs Purchasing Report',
  awaiting_accounting_approval: 'Waiting Budget Approval',
  approved: 'Budget Approved',
  proof_submitted: 'Waiting Expense Confirmation',
  proof_needs_revision: 'Proof Needs Revision',
  rejected: 'Needs Budget Revision',
  fulfilled: 'Completed',
  cancelled: 'Cancelled',
};

export const PROCUREMENT_STATUS_STYLES: Record<ProcurementStatus, string> = {
  requested: 'border-amber-200 bg-amber-50 text-amber-900',
  awaiting_accounting_approval: 'border-blue-200 bg-blue-50 text-blue-900',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  proof_submitted: 'border-violet-200 bg-violet-50 text-violet-900',
  proof_needs_revision: 'border-orange-200 bg-orange-50 text-orange-900',
  rejected: 'border-red-200 bg-red-50 text-red-900',
  fulfilled: 'border-slate-200 bg-slate-100 text-slate-900',
  cancelled: 'border-slate-200 bg-slate-50 text-slate-600',
};

export const PROCUREMENT_DEPARTMENT_LABELS: Record<ProcurementDepartment, string> = {
  creative: 'Creative',
  linen: 'Linen',
  stockroom: 'Stockroom',
};

export const PROCUREMENT_REQUEST_TYPE_LABELS: Record<ProcurementRequestType, string> = {
  purchase: 'Purchase',
  rental: 'Rental',
};

export const PROCUREMENT_REQUISITION_TYPE_LABELS: Record<ProcurementRequisitionType, string> = {
  item_requisition: 'Item Requisition',
  purchase_requisition: 'Purchase Requisition',
  emergency_requisition: 'Emergency Requisition',
};

export const PROCUREMENT_SLA_STATUS_LABELS: Record<ProcurementSlaStatus, string> = {
  on_track: 'SLA On Track',
  rush: 'Emergency Rush',
  blocked: 'Lead Time Blocked',
};

export const PROCUREMENT_SLA_STATUS_STYLES: Record<ProcurementSlaStatus, string> = {
  on_track: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  rush: 'border-orange-200 bg-orange-50 text-orange-900',
  blocked: 'border-red-200 bg-red-50 text-red-900',
};

export const PROCUREMENT_SOURCE_LABELS: Record<ProcurementRequest['source'], string> = {
  contract_shortage: 'Contract Shortage',
  inventory_low_stock: 'Low Stock',
  manual: 'Manual Request',
};

export const formatProcurementDate = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

export const formatProcurementCurrency = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'Not set';
  }

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const getProcurementStatusLabel = (status?: ProcurementStatus | null) => (
  status ? PROCUREMENT_STATUS_LABELS[status] || status : 'Unknown'
);

export const getProcurementRequisitionTypeLabel = (type?: ProcurementRequisitionType | null) => (
  type ? PROCUREMENT_REQUISITION_TYPE_LABELS[type] || type.replace(/_/g, ' ') : 'Purchase Requisition'
);

export const getProcurementSlaStatusLabel = (status?: ProcurementSlaStatus | null) => (
  status ? PROCUREMENT_SLA_STATUS_LABELS[status] || status.replace(/_/g, ' ') : 'SLA Not Set'
);

export const getProcurementReleaseLabel = (request: ProcurementRequest) => {
  if (request.releaseAuthorization?.status === 'authorized') {
    return 'Release Authorized';
  }

  if (request.releaseAuthorization?.status === 'released') {
    return 'Released';
  }

  if (request.releaseAuthorization?.status === 'rejected') {
    return 'Release Rejected';
  }

  return 'No Signature, No Release';
};

const normalizeText = (value?: string | null) => String(value || '').trim().toLowerCase();

const textIncludes = (source: string, value: string) => Boolean(value) && source.includes(value);

export const getProcurementLocationText = (request: ProcurementRequest) => [
  request.contract?.venue?.name,
  request.contract?.venue?.address,
  request.requestNotes,
  request.requestReason,
].filter(Boolean).join(' ').toLowerCase();

export const scoreSupplierForRequest = (
  request: ProcurementRequest,
  supplier: ProcurementSupplierSummary,
) => {
  if (supplier.isActive === false) {
    return -Infinity;
  }

  let score = Number(supplier.priority || 0);
  const itemName = normalizeText(request.itemName);
  const itemCategory = normalizeText(request.itemCategory);
  const locationText = getProcurementLocationText(request);

  if ((supplier.departments || []).includes(request.department)) {
    score += 35;
  }

  if ((supplier.requestTypes || []).includes(request.requestType)) {
    score += 25;
  }

  if ((supplier.supportedCategories || []).some((category) => normalizeText(category) === itemCategory)) {
    score += 25;
  }

  if ((supplier.supportedKeywords || []).some((keyword) => textIncludes(itemName, normalizeText(keyword)))) {
    score += 20;
  }

  if ((supplier.serviceAreas || []).some((area) => textIncludes(locationText, normalizeText(area)))) {
    score += 15;
  }

  if (supplier.isPreferred) {
    score += 10;
  }

  return score;
};

export const getRecommendedSuppliersForRequest = (
  request: ProcurementRequest,
  suppliers: ProcurementSupplierSummary[],
  limit = 3,
) => (
  [...suppliers]
    .map((supplier) => ({
      supplier,
      score: scoreSupplierForRequest(request, supplier),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.supplier.name.localeCompare(right.supplier.name))
    .slice(0, limit)
);

export const getProcurementReviewBasis = (request: ProcurementRequest): ProcurementReviewBasis => {
  const quoteTotal = Number(request.quote?.quotedTotal || 0);
  const unitPrice = Number(request.quote?.quotedUnitPrice || 0);
  const expectedFulfillmentDate = request.quote?.expectedFulfillmentDate
    ? new Date(request.quote.expectedFulfillmentDate)
    : null;
  const neededByDate = request.neededBy ? new Date(request.neededBy) : null;

  return {
    inventoryNeedValidated: Boolean(request.itemName && request.requestReason && request.requestedQuantity > 0),
    supplierVerified: Boolean(request.quote?.supplier || request.quote?.supplierName),
    pricingReviewed: quoteTotal > 0 || unitPrice > 0,
    timelineConfirmed: Boolean(
      expectedFulfillmentDate
      && neededByDate
      && expectedFulfillmentDate.getTime() <= neededByDate.getTime()
    ),
  };
};
