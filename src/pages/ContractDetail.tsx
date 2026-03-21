import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { useAuth, useRole } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle,
  DollarSign,
  FileDown,
  Printer,
  AlertTriangle,
  Calendar,
  Users,
  MapPin,
  Package,
  Palette,
  Shirt,
  Box,
  Truck,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const SECTION_PRINT_LABELS: Record<string, string> = {
  details: 'Contract Details',
  menu: 'Menu Summary',
  inventory: 'Inventory Checklist',
  payments: 'Payment Summary',
  banquet: 'Banquet Staffing',
  logistics: 'Logistics Booking',
  preferences: 'Event Preferences',
  timeline: 'Timeline',
};

const COMPANY_NAME = 'Juan Carlos Catering Services';
const COMPANY_TAGLINE = 'Event Catering And Hospitality Services';
const REQUIRED_DOWN_PAYMENT_RATE = 0.6;
const PRINT_DOCUMENT_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Georgia, serif; background: #ffffff; color: #111827; margin: 0; padding: 24px; }
  .doc-shell { max-width: 960px; margin: 0 auto; background: #ffffff; }
  .doc-topbar { height: 6px; background: #491321; margin-bottom: 18px; }
  .doc-body { padding: 0 18px 24px; }
  .company-header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 2px solid #491321; }
  .company-ident { display: flex; gap: 16px; align-items: center; }
  .company-logo { width: 56px; height: 56px; object-fit: contain; }
  .company-name { margin: 0; font-size: 30px; line-height: 1.05; color: #491321; letter-spacing: 0.03em; }
  .company-tagline { margin: 6px 0 0; color: #6b7280; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; font-family: Arial, sans-serif; }
  .document-title { margin: 18px 0 4px; font-size: 20px; color: #1f2937; text-transform: uppercase; letter-spacing: 0.16em; font-family: Arial, sans-serif; }
  .document-subtitle { margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6; max-width: 560px; }
  .meta-stack { display: grid; gap: 6px; min-width: 240px; }
  .meta-line { display: flex; justify-content: space-between; gap: 16px; padding: 5px 0; border-bottom: 1px solid #e5e7eb; }
  .meta-label { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #6b7280; font-family: Arial, sans-serif; }
  .meta-value { font-size: 13px; font-weight: 600; color: #111827; text-align: right; }
  .summary-strip { display: grid; gap: 4px 28px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #d1d5db; }
  .summary-line { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; border-bottom: 1px dotted #d1d5db; font-size: 13px; }
  .summary-line:last-child { border-bottom: none; }
  .summary-label { color: #6b7280; text-transform: uppercase; letter-spacing: 0.12em; font-size: 10px; font-family: Arial, sans-serif; }
  .summary-value { font-weight: 700; color: #491321; }
  .document-section { margin-top: 18px; padding-top: 14px; border-top: 1px solid #d1d5db; }
  .section-heading { margin: 0 0 12px; font-size: 12px; color: #491321; text-transform: uppercase; letter-spacing: 0.18em; font-family: Arial, sans-serif; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 28px; }
  .detail-list { margin: 0; }
  .detail-row { display: grid; grid-template-columns: 160px 1fr; gap: 14px; padding: 6px 0; border-bottom: 1px dotted #e5e7eb; }
  .detail-row:last-child { border-bottom: none; }
  .detail-term { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.12em; font-family: Arial, sans-serif; }
  .detail-value { font-size: 14px; line-height: 1.55; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: none; border-bottom: 1px solid #d1d5db; padding: 9px 6px; text-align: left; font-size: 13px; vertical-align: top; }
  th { background: transparent; color: #491321; text-transform: uppercase; letter-spacing: 0.12em; font-size: 10px; font-family: Arial, sans-serif; }
  .amount-line { margin-top: 18px; padding-bottom: 8px; border-bottom: 2px solid #491321; display: flex; justify-content: space-between; gap: 16px; }
  .amount-label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #6b7280; font-family: Arial, sans-serif; }
  .amount-value { font-size: 28px; font-weight: 700; color: #491321; }
  .totals { margin-top: 18px; width: 100%; max-width: 360px; margin-left: auto; }
  .totals div { display: flex; justify-content: space-between; gap: 16px; padding: 7px 0; font-size: 13px; border-bottom: 1px dotted #d1d5db; }
  .totals .grand { font-weight: 700; font-size: 16px; color: #491321; border-top: 1px solid #491321; border-bottom: none; margin-top: 8px; padding-top: 12px; }
  .muted { color: #6b7280; }
  .signature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 36px; }
  .signature-box { min-height: 136px; display: flex; flex-direction: column; justify-content: flex-end; }
  .signature-image-wrap { min-height: 76px; display: flex; align-items: flex-end; margin-bottom: 10px; }
  .signature-image { max-width: 220px; max-height: 72px; object-fit: contain; }
  .signature-placeholder { color: #9ca3af; font-size: 11px; font-style: italic; }
  .signature-line { border-top: 1px solid #111827; padding-top: 10px; }
  .signature-role { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.12em; font-family: Arial, sans-serif; }
  .signature-name { display: block; margin-top: 4px; font-size: 14px; }
  .signature-title { margin-top: 3px; font-size: 11px; color: #6b7280; }
  .proof-image { margin-top: 18px; }
  .proof-image img { max-width: 100%; max-height: 320px; border: 1px solid #d1d5db; }
  .print-section { margin-top: 8px; }
  .document-note { margin-top: 18px; color: #6b7280; font-size: 11px; font-style: italic; }
  .print-section .rounded-lg.border.bg-card,
  .print-section .rounded-xl.border.bg-card,
  .print-section .rounded-md.border.bg-card {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  .print-section .shadow-sm,
  .print-section .shadow {
    box-shadow: none !important;
  }
  [data-print-hide="true"] { display: none !important; }
  @media (max-width: 900px) {
    .company-header, .signature-row, .summary-strip, .info-grid { grid-template-columns: 1fr; display: grid; }
    .meta-stack { min-width: 0; }
    .totals { width: 100%; }
    .detail-row { grid-template-columns: 1fr; gap: 4px; }
  }
  @media print {
    body { background: #ffffff; padding: 0; }
    .doc-shell { max-width: none; }
    .doc-body { padding: 0 16px 20px; }
  }
`;

interface Contract {
  _id: string;
  contractNumber: string;
  status: string;
  progress: number;
  clientName: string;
  clientContact: string;
  clientEmail: string;
  clientType: string;
  clientSigned?: boolean;
  clientSignedAt?: string;
  completedAt?: string;
  eventDate: string;
  bookingDate: string;
  venue: {
    name: string;
    address: string;
    contact: string;
    notes: string;
  };
  packageSelected: string;
  totalPacks: number;
  menuDetails: Array<{
    category: string;
    item: string;
    quantity: number;
    confirmed: boolean;
  }>;
  creativeAssets?: Array<{
    itemId?: string;
    item: string;
    itemCode?: string;
    category?: string;
    imageUrl?: string;
    quantity: number;
    status?: string;
    postEventStatus?: string;
    postEventNotes?: string;
    notes?: string;
    cost?: number;
    pricePerItem?: number;
  }>;
  linenRequirements?: Array<{
    itemId?: string;
    type: string;
    itemCode?: string;
    category?: string;
    imageUrl?: string;
    size?: string;
    material?: string;
    color?: string;
    quantity: number;
    unitPrice?: number;
    notes?: string;
    status?: string;
    postEventStatus?: string;
    postEventNotes?: string;
  }>;
  preferredColor: string;
  napkinType: string;
  tableSetup: string;
  backdropRequirements: string;
  specialRequests: string;
  packagePrice: number;
  totalContractValue: number;
  paymentStatus: string;
  downPaymentPercent?: number;
  finalPaymentPercent?: number;
  ingredientStatus?: string;
  payments: Array<{
    amount: number;
    date: string;
    method: string;
    reference?: string;
    receiptNumber?: string;
    receiptIssuedBy?: string;
    receiptGeneratedAt?: string;
    receiptImageUrl?: string;
    status: string;
  }>;
  equipmentChecklist?: Array<{
    itemId?: string;
    item: string;
    itemCode?: string;
    category?: string;
    imageUrl?: string;
    quantity: number;
    unitPrice?: number;
    notes?: string;
    status: string;
    postEventStatus?: string;
    postEventNotes?: string;
  }>;
  departmentProgress: Record<string, number>;
  slaWarning: boolean;
  finalDetailsDeadline: string;
  logisticsAssignment?: {
    driver?: {
      _id: string;
      driverId: string;
      fullName: string;
      phone?: string;
      status?: string;
    } | null;
    truck?: {
      _id: string;
      truckId: string;
      plateNumber: string;
      truckType: string;
      status?: string;
      capacity?: {
        volume?: number;
      };
    } | null;
    assignmentStatus?: string;
    notes?: string;
      checkedAt?: string;
  };
  assignedSupervisor?: {
    _id: string;
    name: string;
    email?: string;
  } | null;
  banquetAssignment?: {
    serviceGuestCount?: number;
    staffingPlan?: Partial<Record<BanquetAssignmentRole, number>>;
    assignments?: Array<{
      staff?: {
        _id: string;
        employeeId?: string;
        fullName: string;
        role: string;
        status?: string;
      } | null;
      assignmentRole: BanquetAssignmentRole;
    }>;
    updatedAt?: string;
    updatedBy?: {
      _id: string;
      name: string;
    } | null;
  };
  sectionConfirmations?: Partial<Record<ConfirmableSectionKey, {
    confirmed?: boolean;
    confirmedAt?: string;
  }>>;
  signatureAssets?: {
    client?: SignatureParty;
    staff?: SignatureParty;
  };
}

interface OperationsSummary {
  banquet: {
    planningGuestCount: number;
    suggestedPlan: Record<BanquetAssignmentRole, number>;
    savedPlan: Record<BanquetAssignmentRole, number>;
    activePlan: Record<BanquetAssignmentRole, number>;
    selectedSupervisorId: string;
    supervisorOptions: Array<{
      _id: string;
      name: string;
      email?: string;
    }>;
    availableByRole: Record<BanquetAssignmentRole, BanquetStaffSummary[]>;
    suggestedAssignments: BanquetAssignmentSummary[];
    selectedAssignments: BanquetAssignmentSummary[];
    blockers: string[];
    coverage: {
      assigned: number;
      planned: number;
      percent: number;
    };
    updatedAt?: string | null;
  };
  logistics: {
    eventDate: string;
    estimatedVolumeCubicMeters: number;
    assignmentStatus: string;
    notes: string;
    assignedDriverId: string;
    assignedTruckId: string;
    availableDrivers: Array<{
      _id: string;
      driverId: string;
      fullName: string;
      phone?: string;
      status: string;
    }>;
    availableTrucks: Array<{
      _id: string;
      truckId: string;
      plateNumber: string;
      truckType: string;
      status: string;
      capacityVolume: number;
      assignedDriver?: {
        _id: string;
        fullName: string;
        driverId: string;
      } | null;
    }>;
    recommendedTruck?: {
      _id: string;
      truckId: string;
      plateNumber: string;
      truckType: string;
      capacityVolume: number;
    } | null;
    recommendedDriver?: {
      _id: string;
      driverId: string;
      fullName: string;
      phone?: string;
    } | null;
    blockers: string[];
  };
  inventory: {
    creativeAssets: InventorySummaryItem[];
    linenRequirements: InventorySummaryItem[];
    equipmentChecklist: InventorySummaryItem[];
    allItemsReady: boolean;
    shortages: InventorySummaryItem[];
  };
}

interface InventorySummaryItem {
  sectionKey?: InventorySectionKey;
  itemId?: string | null;
  itemName: string;
  itemCode?: string;
  category?: string;
  requestedQuantity: number;
  availableQuantity: number | null;
  reservedOnDate: number;
  inventoryStatus: string;
  itemStatus: string;
  postEventStatus: string;
  postEventNotes?: string;
  enoughStock: boolean;
  shortageQuantity: number;
  sameDayConflict: boolean;
  requestAction?: string;
  readyForDispatch: boolean;
  imageUrl?: string;
  notes?: string;
  blockers: string[];
}

interface BanquetStaffSummary {
  _id: string;
  employeeId?: string;
  fullName: string;
  role: string;
  status: string;
  employmentType?: string;
  rating?: number;
  totalEventsWorked?: number;
  isAssigned?: boolean;
  isRecommended?: boolean;
}

interface BanquetAssignmentSummary {
  staffId: string;
  assignmentRole: BanquetAssignmentRole;
  staff: BanquetStaffSummary;
}

interface IncidentReportTarget {
  section: InventorySectionKey;
  index: number;
  itemName: string;
  departmentLabel: string;
  requestedQuantity: number;
}

interface ProcurementRequestTarget {
  section: InventorySectionKey;
  item: InventorySummaryItem;
}

interface SignatureParty {
  signedName?: string;
  title?: string;
  imageUrl?: string;
  uploadedAt?: string;
}

type ReadinessStatus = 'not_started' | 'blocked' | 'in_progress' | 'ready';
type ConfirmableSectionKey = 'details' | 'menu' | 'preferences' | 'payments' | 'creative' | 'linen' | 'stockroom' | 'logistics';
const BANQUET_ASSIGNMENT_ROLE_KEYS = ['head_captain', 'service_staff', 'food_runner', 'busser', 'bartender', 'setup_crew'] as const;
type BanquetAssignmentRole = typeof BANQUET_ASSIGNMENT_ROLE_KEYS[number];
type ContractTabKey = 'details' | 'menu' | 'inventory' | 'payments' | 'banquet' | 'logistics' | 'preferences' | 'timeline';
type SignaturePartyKey = 'client' | 'staff';
type InventorySectionKey = 'creativeAssets' | 'linenRequirements' | 'equipmentChecklist';

interface DepartmentReadiness {
  key: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
}

const READINESS_STATUS_META: Record<ReadinessStatus, { label: string; badgeClassName: string; cardClassName: string }> = {
  ready: {
    label: 'Ready',
    badgeClassName: 'border-green-200 bg-green-100 text-green-800',
    cardClassName: 'border-green-200 bg-green-50/70',
  },
  in_progress: {
    label: 'In Progress',
    badgeClassName: 'border-blue-200 bg-blue-100 text-blue-800',
    cardClassName: 'border-blue-200 bg-blue-50/70',
  },
  blocked: {
    label: 'Blocked',
    badgeClassName: 'border-amber-200 bg-amber-100 text-amber-900',
    cardClassName: 'border-amber-200 bg-amber-50/80',
  },
  not_started: {
    label: 'Not Started',
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700',
    cardClassName: 'border-slate-200 bg-slate-50/80',
  },
};

const ALL_CONTRACT_TABS: ContractTabKey[] = ['details', 'menu', 'inventory', 'payments', 'banquet', 'logistics', 'preferences', 'timeline'];
const INCIDENT_TYPE_OPTIONS = [
  { value: 'burnt_cloth', label: 'Burnt Cloth' },
  { value: 'damaged_equipment', label: 'Damaged Equipment' },
  { value: 'missing_item', label: 'Missing Item' },
  { value: 'food_spoilage', label: 'Food Spoilage' },
  { value: 'vehicle_breakdown', label: 'Vehicle Breakdown' },
  { value: 'staff_issue', label: 'Staff Issue' },
  { value: 'client_complaint', label: 'Client Complaint' },
  { value: 'other', label: 'Other' },
] as const;
const POST_EVENT_STATUS_OPTIONS = ['pending_check', 'checked_ok'] as const;
const INVENTORY_SECTION_LABELS: Record<InventorySectionKey, string> = {
  creativeAssets: 'Creative',
  linenRequirements: 'Linen',
  equipmentChecklist: 'Stockroom',
};
const INVENTORY_SECTION_TO_CONFIRMABLE_SECTION: Record<InventorySectionKey, ConfirmableSectionKey> = {
  creativeAssets: 'creative',
  linenRequirements: 'linen',
  equipmentChecklist: 'stockroom',
};
const INVENTORY_SECTION_TO_PROCUREMENT_DEPARTMENT: Record<InventorySectionKey, 'creative' | 'linen' | 'stockroom'> = {
  creativeAssets: 'creative',
  linenRequirements: 'linen',
  equipmentChecklist: 'stockroom',
};
const TAB_LABELS: Record<ContractTabKey, string> = {
  details: 'Details',
  menu: 'Menu',
  inventory: 'Inventory',
  payments: 'Payments',
  banquet: 'Banquet',
  logistics: 'Logistics',
  preferences: 'Preferences',
  timeline: 'Timeline',
};
const BANQUET_ROLE_LABELS: Record<BanquetAssignmentRole, string> = {
  head_captain: 'Head Captain',
  service_staff: 'Service Staff',
  food_runner: 'Food Runner',
  busser: 'Busser',
  bartender: 'Bartender',
  setup_crew: 'Setup Crew',
};
const BANQUET_ROLE_NOTES: Record<BanquetAssignmentRole, string> = {
  head_captain: 'Lead the floor and coordinate service pacing.',
  service_staff: 'Handles guest tables, plated service, and refills.',
  food_runner: 'Moves food from kitchen pass to the floor team.',
  busser: 'Clears used settings and keeps service stations ready.',
  bartender: 'Covers beverage station or bar service.',
  setup_crew: 'Prepares venue layout, stations, and service base.',
};

const pluralize = (count: number, singular: string, plural = `${singular}s`) => (
  count === 1 ? singular : plural
);

const formatEnumLabel = (value?: string) => (value || 'pending').replace(/_/g, ' ');
const formatStatusLabel = (value?: string) => (value || '').replace(/_/g, ' ');
const createEmptyBanquetPlan = (): Record<BanquetAssignmentRole, number> => ({
  head_captain: 0,
  service_staff: 0,
  food_runner: 0,
  busser: 0,
  bartender: 0,
  setup_crew: 0,
});
const getBanquetPlanTotal = (plan: Partial<Record<BanquetAssignmentRole, number>> | undefined) => (
  BANQUET_ASSIGNMENT_ROLE_KEYS.reduce((sum, role) => sum + (Number(plan?.[role]) || 0), 0)
);
const buildEmptyBanquetAssignments = (): Record<BanquetAssignmentRole, string[]> => ({
  head_captain: [],
  service_staff: [],
  food_runner: [],
  busser: [],
  bartender: [],
  setup_crew: [],
});
const buildEmptyBanquetPickers = (): Record<BanquetAssignmentRole, string> => ({
  head_captain: '',
  service_staff: '',
  food_runner: '',
  busser: '',
  bartender: '',
  setup_crew: '',
});
const formatBanquetStaffRole = (value?: string) => formatStatusLabel(value).replace(/\b\w/g, char => char.toUpperCase());
const resolvePostEventStatus = (value?: string, legacyStatus?: string) => {
  if (value === 'checked_ok' || value === 'incident_reported' || value === 'pending_check') {
    return value;
  }

  if (legacyStatus === 'returned') {
    return 'checked_ok';
  }

  return 'pending_check';
};
const isPostEventClosed = (value?: string, legacyStatus?: string) => (
  ['checked_ok', 'incident_reported'].includes(resolvePostEventStatus(value, legacyStatus))
);
const getPostEventStatusLabel = (value?: string, legacyStatus?: string) => {
  const status = resolvePostEventStatus(value, legacyStatus);

  switch (status) {
    case 'checked_ok':
      return 'Checked And Returned';
    case 'incident_reported':
      return 'Reported To Incidents';
    default:
      return 'Pending Post-Event Check';
  }
};
const getPostEventStatusClassName = (value?: string, legacyStatus?: string) => {
  const status = resolvePostEventStatus(value, legacyStatus);

  switch (status) {
    case 'checked_ok':
      return 'bg-green-100 text-green-800';
    case 'incident_reported':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};
const LOGISTICS_STATUS_OPTIONS = [
  { value: 'pending', label: 'Not Booked Yet' },
  { value: 'scheduled', label: 'Transport Booked' },
  { value: 'ready_for_dispatch', label: 'Ready For Dispatch' },
  { value: 'dispatched', label: 'Dispatched To Venue' },
  { value: 'completed', label: 'Event Logistics Completed' },
] as const;
const getLogisticsStatusLabel = (value?: string) => (
  LOGISTICS_STATUS_OPTIONS.find((option) => option.value === (value || 'pending'))?.label
  || formatEnumLabel(value)
);
const getLogisticsStatusClassName = (value?: string) => {
  switch (value) {
    case 'completed':
      return 'border-green-200 bg-green-50 text-green-800';
    case 'dispatched':
      return 'border-blue-200 bg-blue-50 text-blue-800';
    case 'ready_for_dispatch':
      return 'border-sky-200 bg-sky-50 text-sky-800';
    case 'scheduled':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-900';
  }
};
const resolveLogisticsAssignmentStatus = ({
  truckId,
  driverId,
  assignmentStatus,
}: {
  truckId?: string;
  driverId?: string;
  assignmentStatus?: string;
}) => {
  if (!truckId) {
    return 'pending';
  }

  if (assignmentStatus === 'completed' || assignmentStatus === 'dispatched') {
    return assignmentStatus;
  }

  return driverId ? 'ready_for_dispatch' : 'scheduled';
};
const resolveDownPaymentPercent = (value?: number) => (
  Math.max(REQUIRED_DOWN_PAYMENT_RATE * 100, Number(value) || REQUIRED_DOWN_PAYMENT_RATE * 100)
);
const resolveFinalPaymentPercent = (downPaymentValue?: number, finalPaymentValue?: number) => {
  const downPaymentPercent = resolveDownPaymentPercent(downPaymentValue);
  const parsedFinalPaymentPercent = Number(finalPaymentValue);

  return Number.isFinite(parsedFinalPaymentPercent)
    ? Math.max(0, parsedFinalPaymentPercent)
    : Math.max(0, 100 - downPaymentPercent);
};

const getFinalPaymentDueDate = (eventDate: string) => {
  const dueDate = new Date(eventDate);
  dueDate.setMonth(dueDate.getMonth() - 1);
  return dueDate;
};

const createSignatureDraft = (party?: SignatureParty, defaults?: { signedName: string; title: string }): SignatureParty => ({
  signedName: party?.signedName || defaults?.signedName || '',
  title: party?.title || defaults?.title || '',
  imageUrl: party?.imageUrl || '',
  uploadedAt: party?.uploadedAt,
});

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { isSales, isAccounting, isLogistics, isBanquet, isKitchen, isPurchasing, isStockroom, isCreative, isLinen, isAdmin, role } = useRole();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [esignDialogOpen, setEsignDialogOpen] = useState(false);
  const [isSendingForSignature, setIsSendingForSignature] = useState(false);
  const [isSavingEsignatures, setIsSavingEsignatures] = useState(false);
  const [isClosingContract, setIsClosingContract] = useState(false);
  const [isDeletingContract, setIsDeletingContract] = useState(false);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [pendingPaymentPlan, setPendingPaymentPlan] = useState<'split' | 'full'>('split');
  const [signatureForm, setSignatureForm] = useState<Record<SignaturePartyKey, SignatureParty>>({
    client: createSignatureDraft(undefined, { signedName: '', title: 'Client' }),
    staff: createSignatureDraft(undefined, { signedName: '', title: 'Authorized Representative' }),
  });
  const [operationsSummary, setOperationsSummary] = useState<OperationsSummary | null>(null);
  const [isOperationsLoading, setIsOperationsLoading] = useState(false);
  const [operationsErrorMessage, setOperationsErrorMessage] = useState('');
  const [logisticsAssignment, setLogisticsAssignment] = useState({
    driverId: '',
    truckId: '',
    assignmentStatus: 'pending',
    notes: ''
  });
  const [logisticsAutoSaveState, setLogisticsAutoSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [logisticsAutoSaveErrorMessage, setLogisticsAutoSaveErrorMessage] = useState('');
  const logisticsLastSavedSnapshotRef = useRef('');
  const [banquetAssignmentDraft, setBanquetAssignmentDraft] = useState({
    serviceGuestCount: 0,
    supervisorId: '',
    staffingPlan: createEmptyBanquetPlan(),
    assignments: buildEmptyBanquetAssignments(),
  });
  const [banquetPickers, setBanquetPickers] = useState<Record<BanquetAssignmentRole, string>>(buildEmptyBanquetPickers());
  const [isSavingBanquetAssignment, setIsSavingBanquetAssignment] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [incidentTarget, setIncidentTarget] = useState<IncidentReportTarget | null>(null);
  const [procurementRequestDialogOpen, setProcurementRequestDialogOpen] = useState(false);
  const [procurementRequestTarget, setProcurementRequestTarget] = useState<ProcurementRequestTarget | null>(null);
  const [incidentForm, setIncidentForm] = useState({
    incidentType: 'other',
    severity: 'medium',
    affectedQuantity: '',
    description: '',
    attachmentUrl: '',
  });
  const [procurementRequestForm, setProcurementRequestForm] = useState({
    requestType: 'purchase',
    requestedQuantity: '',
    neededBy: '',
    reason: '',
    notes: '',
  });
  const requestedTab = searchParams.get('tab');
  const rawActiveTab: ContractTabKey = ALL_CONTRACT_TABS.includes((requestedTab || '') as ContractTabKey)
    ? (requestedTab as ContractTabKey)
    : 'details';

  useEffect(() => {
    fetchContractData();
  }, [id]);

  const getSignatureFormState = (sourceContract: Contract) => ({
    client: createSignatureDraft(sourceContract.signatureAssets?.client, {
      signedName: sourceContract.clientName || '',
      title: 'Client',
    }),
    staff: createSignatureDraft(sourceContract.signatureAssets?.staff, {
      signedName: user?.name || COMPANY_NAME,
      title: 'Authorized Representative',
    }),
  });

  const getBanquetDraftState = (summary: OperationsSummary | null) => {
    const savedAssignments = buildEmptyBanquetAssignments();
    const source = summary?.banquet;

    source?.selectedAssignments.forEach((assignment) => {
      savedAssignments[assignment.assignmentRole] = [
        ...savedAssignments[assignment.assignmentRole],
        assignment.staffId
      ];
    });

    const savedPlanTotal = getBanquetPlanTotal(source?.savedPlan);
    const staffingPlan = savedPlanTotal > 0
      ? BANQUET_ASSIGNMENT_ROLE_KEYS.reduce((plan, role) => {
          plan[role] = Number(source?.savedPlan?.[role]) || 0;
          return plan;
        }, createEmptyBanquetPlan())
      : BANQUET_ASSIGNMENT_ROLE_KEYS.reduce((plan, role) => {
          plan[role] = Number(source?.suggestedPlan?.[role]) || 0;
          return plan;
        }, createEmptyBanquetPlan());

    return {
      serviceGuestCount: Number(source?.planningGuestCount) || 0,
      supervisorId: source?.selectedSupervisorId || (role === 'banquet_supervisor' ? user?.id || '' : ''),
      staffingPlan,
      assignments: savedAssignments
    };
  };

  const getDateInputValue = (value?: string | null) => (
    value ? new Date(value).toISOString().slice(0, 10) : ''
  );

  const buildLogisticsAssignmentSnapshot = (assignment: typeof logisticsAssignment) => JSON.stringify({
    driverId: assignment.driverId || '',
    truckId: assignment.truckId || '',
    assignmentStatus: resolveLogisticsAssignmentStatus(assignment),
    notes: assignment.notes || '',
  });

  const applySavedLogisticsAssignment = (
    contractData: Contract,
    operationsData: OperationsSummary | null = null,
  ) => {
    const nextAssignment = {
      driverId: operationsData?.logistics.assignedDriverId || contractData.logisticsAssignment?.driver?._id || '',
      truckId: operationsData?.logistics.assignedTruckId || contractData.logisticsAssignment?.truck?._id || '',
      assignmentStatus: operationsData?.logistics.assignmentStatus || contractData.logisticsAssignment?.assignmentStatus || 'pending',
      notes: operationsData?.logistics.notes || contractData.logisticsAssignment?.notes || '',
    };

    logisticsLastSavedSnapshotRef.current = buildLogisticsAssignmentSnapshot(nextAssignment);
    setLogisticsAssignment(nextAssignment);
    setLogisticsAutoSaveState(nextAssignment.truckId ? 'saved' : 'idle');
    setLogisticsAutoSaveErrorMessage('');
  };

  const fetchContractData = async () => {
    setIsLoading(true);

    try {
      setIsOperationsLoading(true);
      setOperationsErrorMessage('');
      const contractData = await api.getContract(id!);

      setContract(contractData);
      setPendingPaymentPlan(
        resolveDownPaymentPercent(contractData.downPaymentPercent) >= 100
          || resolveFinalPaymentPercent(contractData.downPaymentPercent, contractData.finalPaymentPercent) <= 0
          ? 'full'
          : 'split'
      );
      applySavedLogisticsAssignment(contractData);
      setSignatureForm(getSignatureFormState(contractData));

      try {
        const operationsData = await api.getContractOperationsSummary(id!);
        setOperationsSummary(operationsData);
        setOperationsErrorMessage('');
        applySavedLogisticsAssignment(contractData, operationsData);
        setBanquetAssignmentDraft(getBanquetDraftState(operationsData));
        setBanquetPickers(buildEmptyBanquetPickers());
      } catch (operationsError: any) {
        console.error('Failed to load operations summary:', operationsError);
        setOperationsSummary(null);
        setOperationsErrorMessage(operationsError?.detail || operationsError?.message || 'Automated operations checks could not be loaded.');
        applySavedLogisticsAssignment(contractData, null);
        setBanquetAssignmentDraft(getBanquetDraftState(null));
        setBanquetPickers(buildEmptyBanquetPickers());
      }
    } catch (error) {
      setContract(null);
      toast.error('Failed to load contract');
    } finally {
      setIsLoading(false);
      setIsOperationsLoading(false);
    }
  };

  const openEsignDialog = (sourceContract?: Contract) => {
    const targetContract = sourceContract || contract;
    if (!targetContract) {
      return;
    }

    setSignatureForm(getSignatureFormState(targetContract));
    setEsignDialogOpen(true);
  };

  const handleSignatureFieldChange = (party: SignaturePartyKey, field: keyof SignatureParty, value: string) => {
    setSignatureForm((current) => ({
      ...current,
      [party]: {
        ...current[party],
        [field]: value,
      },
    }));
  };

  const handleSignatureImageChange = (party: SignaturePartyKey, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      handleSignatureFieldChange(party, 'imageUrl', '');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Please upload a signature image smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleSignatureFieldChange(party, 'imageUrl', typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEsignaturesAndOpenPdf = async () => {
    if (!contract) {
      return;
    }

    const clientName = signatureForm.client.signedName?.trim();
    const staffName = signatureForm.staff.signedName?.trim();

    if (!clientName || !staffName) {
      toast.error('Add both signer names before generating the e-sign PDF.');
      return;
    }

    if (!signatureForm.client.imageUrl || !signatureForm.staff.imageUrl) {
      toast.error('Upload both the client and staff signatures before generating the e-sign PDF.');
      return;
    }

    setIsSavingEsignatures(true);

    try {
      const updatedContract = await api.updateContractSignatureAssets(id!, {
        client: {
          ...signatureForm.client,
          signedName: clientName,
        },
        staff: {
          ...signatureForm.staff,
          signedName: staffName,
        },
      });

      setContract(updatedContract);
      setSignatureForm(getSignatureFormState(updatedContract));
      setEsignDialogOpen(false);
      handleExportSignaturePacket('esign', formatStatusLabel(updatedContract.status) || 'Pending Client Signature', updatedContract.signatureAssets);
      toast.success(
        updatedContract.clientSigned
          ? 'Both signatures were saved. The contract is now marked signed and handed off to accounting.'
          : 'Signature images saved and added to the e-sign PDF.'
      );
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save signature images');
    } finally {
      setIsSavingEsignatures(false);
    }
  };

  const handleSendForSignature = async (nextStep: 'status_only' | 'print' | 'esign') => {
    setIsSendingForSignature(true);

    try {
      await api.submitContract(id!);
      setContract((current) => current ? {
        ...current,
        status: 'pending_client_signature',
      } : current);
      setSignatureDialogOpen(false);

      if (nextStep === 'print') {
        handleExportSignaturePacket('print', 'Pending Client Signature');
        toast.success('Contract sent for signature and the printable signature copy is ready.');
      } else if (nextStep === 'esign') {
        openEsignDialog(contract ? {
          ...contract,
          status: 'pending_client_signature',
        } : undefined);
        toast.success('Contract sent for signature. Upload both signatures to generate the e-sign PDF.');
      } else {
        toast.success('Contract is now waiting for the client signature.');
      }

      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit contract');
    } finally {
      setIsSendingForSignature(false);
    }
  };

  const handleMarkClientSigned = async () => {
    try {
      await api.markContractClientSigned(id!);
      toast.success('Client signature recorded. Contract is now ready for accounting approval.');
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record client signature');
    }
  };

  const openPaymentDialog = (amountNeeded: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'payments');
    setSearchParams(next, { replace: true });
    setPaymentAmount(amountNeeded > 0 ? amountNeeded.toFixed(2).replace(/\.00$/, '') : '');
    setPaymentMethod('cash');
    setPaymentReference('');
    setReceiptNumber('');
    setReceiptImageUrl('');
    setPaymentDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!contract) {
      return;
    }

    const totalPaid = contract.payments
      ?.filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0) || 0;
    const paymentRequirementPercent = resolveDownPaymentPercent(contract.downPaymentPercent);
    const finalPaymentPercent = resolveFinalPaymentPercent(contract.downPaymentPercent, contract.finalPaymentPercent);
    const fullPaymentRequired = paymentRequirementPercent >= 100 || finalPaymentPercent <= 0;
    const paymentRequired = Math.round((contract.totalContractValue || 0) * (paymentRequirementPercent / 100) * 100) / 100;
    const paymentBalance = Math.max(0, paymentRequired - totalPaid);
    const finalPaymentDueDate = getFinalPaymentDueDate(contract.eventDate);
    const finalPaymentDeadline = new Date(finalPaymentDueDate);
    finalPaymentDeadline.setHours(23, 59, 59, 999);
    const finalBalancePastDue = totalPaid < (contract.totalContractValue || 0) && new Date() > finalPaymentDeadline;

    if (finalBalancePastDue) {
      const remainingBalance = Math.max(0, (contract.totalContractValue || 0) - totalPaid);
      openPaymentDialog(remainingBalance);
      toast.info(`The remaining balance must be settled by ${finalPaymentDueDate.toLocaleDateString()} or the event cannot proceed.`);
      return;
    }

    if (paymentBalance > 0) {
      openPaymentDialog(paymentBalance);
      toast.info(
        fullPaymentRequired
          ? `Confirm the full payment of ${formatCurrency(paymentRequired)} before approving this contract for preparation.`
          : `Confirm the required ${paymentRequirementPercent}% payment of ${formatCurrency(paymentRequired)} before approving this contract for preparation.`
      );
      return;
    }

    try {
      await api.approveContract(id!);
      toast.success('Contract approved for preparation.');
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve contract');
      if (Array.isArray(error?.issues) && error.issues.length > 1) {
        toast.info(`There ${error.issues.length - 1 === 1 ? 'is' : 'are'} ${error.issues.length - 1} more approval blocker(s) to resolve.`);
      }
    }
  };

  const handleDeleteContract = async () => {
    if (!contract) {
      return;
    }

    try {
      setIsDeletingContract(true);
      await api.deleteContract(contract._id);
      toast.success('Contract deleted.');
      navigate('/contracts');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete contract');
    } finally {
      setIsDeletingContract(false);
    }
  };

  const handleCloseContract = async () => {
    if (!contract) {
      return;
    }

    setIsClosingContract(true);

    try {
      await api.completeContract(id!);
      toast.success('Contract closed successfully.');
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to close contract');
    } finally {
      setIsClosingContract(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }

    if (contract) {
      const completedPaymentsTotal = contract.payments
        ?.filter(payment => payment.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const balanceRemaining = Math.max(0, (contract.totalContractValue || 0) - completedPaymentsTotal);

      if (Number(paymentAmount) > balanceRemaining) {
        toast.error('Payment cannot be higher than the remaining contract balance');
        return;
      }
    }

    if (!receiptNumber.trim()) {
      toast.error('Official receipt number is required');
      return;
    }

    try {
      await api.addPayment(id!, {
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        reference: paymentReference || undefined,
        receiptNumber,
        receiptImageUrl: receiptImageUrl || undefined,
        date: new Date().toISOString(),
        status: 'completed'
      });
      toast.success('Payment added!');
      setPaymentDialogOpen(false);
      setPaymentAmount('');
      setPaymentReference('');
      setReceiptNumber('');
      setReceiptImageUrl('');
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add payment');
    }
  };

  const handleUpdatePaymentPlan = async (plan: 'split' | 'full') => {
    if (!contract) {
      return;
    }

    if (paymentTermConfirmationLocked) {
      toast.error(paymentTermLockMessage || 'Confirm the inventory sections first before confirming the payment arrangement.');
      return;
    }

    const nextDownPaymentPercent = plan === 'full' ? 100 : 60;
    const nextFinalPaymentPercent = plan === 'full' ? 0 : 40;
    const planChanged = (
      resolveDownPaymentPercent(contract.downPaymentPercent) !== nextDownPaymentPercent
      || resolveFinalPaymentPercent(contract.downPaymentPercent, contract.finalPaymentPercent) !== nextFinalPaymentPercent
    );

    try {
      if (planChanged) {
        await api.updateContract(id!, {
          downPaymentPercent: nextDownPaymentPercent,
          finalPaymentPercent: nextFinalPaymentPercent,
        });
      }
      await api.updateContractSectionConfirmation(id!, {
        section: 'payments',
        confirmed: true,
      });
      setPendingPaymentPlan(plan);
      toast.success(plan === 'full' ? 'Full payment term confirmed.' : '60 / 40 payment term confirmed.');
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment plan');
      fetchContractData();
    }
  };

  const handleUpdateSectionConfirmation = async (
    section: ConfirmableSectionKey,
    confirmed: boolean,
    successMessage: string,
  ) => {
    if (!contract) {
      return;
    }

    try {
      await api.updateContractSectionConfirmation(id!, {
        section,
        confirmed,
      });
      toast.success(successMessage);
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update section confirmation');
    }
  };

  const handleReceiptImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setReceiptImageUrl('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImageUrl(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateLogisticsAssignment = async (
    nextAssignment = logisticsAssignment,
    options?: { silent?: boolean },
  ) => {
    if (!contract || contract.status !== 'approved') {
      if (!options?.silent) {
        toast.error('Only approved contracts can update logistics booking');
      }
      return false;
    }

    const payload = {
      ...nextAssignment,
      assignmentStatus: resolveLogisticsAssignmentStatus(nextAssignment)
    };

    try {
      setLogisticsAutoSaveErrorMessage('');
      if (options?.silent) {
        setLogisticsAutoSaveState('saving');
      }

      const updatedContract = await api.updateLogisticsAssignment(id!, payload);
      setContract(updatedContract);

      try {
        const operationsData = await api.getContractOperationsSummary(id!);
        setOperationsSummary(operationsData);
        setOperationsErrorMessage('');
        applySavedLogisticsAssignment(updatedContract, operationsData);
      } catch (operationsError: any) {
        console.error('Failed to refresh operations summary after logistics save:', operationsError);
        setOperationsSummary(null);
        setOperationsErrorMessage(operationsError?.detail || operationsError?.message || 'Automated operations checks could not be loaded.');
        applySavedLogisticsAssignment(updatedContract, null);
      }

      if (!options?.silent) {
        toast.success('Logistics booking saved');
      }

      return true;
    } catch (error: any) {
      const failureMessage = error.message || 'Failed to save logistics booking';

      if (contract) {
        try {
          const operationsData = await api.getContractOperationsSummary(id!);
          setOperationsSummary(operationsData);
          setOperationsErrorMessage('');
          applySavedLogisticsAssignment(contract, operationsData);
        } catch (operationsError: any) {
          console.error('Failed to refresh operations summary after logistics save failure:', operationsError);
          applySavedLogisticsAssignment(contract, operationsSummary);
        }
      }

      if (options?.silent) {
        setLogisticsAutoSaveState('error');
      }
      setLogisticsAutoSaveErrorMessage(failureMessage);
      toast.error(failureMessage);
      return false;
    }
  };

  const handleUseSuggestedBanquetTeam = () => {
    if (!operationsSummary?.banquet) {
      return;
    }

    const nextAssignments = buildEmptyBanquetAssignments();
    operationsSummary.banquet.suggestedAssignments.forEach((assignment) => {
      nextAssignments[assignment.assignmentRole] = [
        ...nextAssignments[assignment.assignmentRole],
        assignment.staffId
      ];
    });

    setBanquetAssignmentDraft({
      serviceGuestCount: operationsSummary.banquet.planningGuestCount || 0,
      supervisorId: banquetAssignmentDraft.supervisorId || operationsSummary.banquet.selectedSupervisorId || (role === 'banquet_supervisor' ? user?.id || '' : ''),
      staffingPlan: { ...operationsSummary.banquet.suggestedPlan },
      assignments: nextAssignments
    });
    setBanquetPickers(buildEmptyBanquetPickers());
    toast.success('Suggested banquet team loaded. Review it, then save when ready.');
  };

  const handleBanquetPlanCountChange = (roleKey: BanquetAssignmentRole, value: string) => {
    const normalizedValue = Math.max(0, Math.floor(Number(value) || 0));
    setBanquetAssignmentDraft((current) => ({
      ...current,
      staffingPlan: {
        ...current.staffingPlan,
        [roleKey]: normalizedValue
      }
    }));
  };

  const handleAddBanquetStaff = (roleKey: BanquetAssignmentRole) => {
    const nextStaffId = banquetPickers[roleKey];

    if (!nextStaffId) {
      toast.error(`Select a ${BANQUET_ROLE_LABELS[roleKey].toLowerCase()} team member first.`);
      return;
    }

    const alreadyAssigned = BANQUET_ASSIGNMENT_ROLE_KEYS.some((key) => banquetAssignmentDraft.assignments[key].includes(nextStaffId));
    if (alreadyAssigned) {
      toast.error('That staff member is already assigned to this event.');
      return;
    }

    setBanquetAssignmentDraft((current) => ({
      ...current,
      assignments: {
        ...current.assignments,
        [roleKey]: [...current.assignments[roleKey], nextStaffId]
      }
    }));
    setBanquetPickers((current) => ({
      ...current,
      [roleKey]: ''
    }));
  };

  const handleRemoveBanquetStaff = (roleKey: BanquetAssignmentRole, staffId: string) => {
    setBanquetAssignmentDraft((current) => ({
      ...current,
      assignments: {
        ...current.assignments,
        [roleKey]: current.assignments[roleKey].filter((value) => value !== staffId)
      }
    }));
  };

  const handleSaveBanquetAssignment = async () => {
    if (!contract || !['approved', 'completed'].includes(contract.status)) {
      toast.error('Banquet staffing can be updated after the contract is approved.');
      return;
    }

    if (!banquetAssignmentDraft.supervisorId) {
      toast.error('Assign a banquet supervisor before saving the event team.');
      return;
    }

    if (banquetAssignmentDraft.serviceGuestCount <= 0) {
      toast.error('Enter the service guest count first.');
      return;
    }

    const assignments = BANQUET_ASSIGNMENT_ROLE_KEYS.flatMap((roleKey) => (
      banquetAssignmentDraft.assignments[roleKey].map((staffId) => ({
        staffId,
        assignmentRole: roleKey
      }))
    ));

    setIsSavingBanquetAssignment(true);

    try {
      await api.updateBanquetAssignment(id!, {
        serviceGuestCount: banquetAssignmentDraft.serviceGuestCount,
        supervisorId: banquetAssignmentDraft.supervisorId,
        staffingPlan: banquetAssignmentDraft.staffingPlan,
        assignments
      });
      toast.success('Banquet staffing saved');
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save banquet staffing');
    } finally {
      setIsSavingBanquetAssignment(false);
    }
  };

  const handleAdvanceLogisticsAssignment = async (nextStatus: 'dispatched' | 'completed') => {
    if (!contract || contract.status !== 'approved') {
      toast.error('Only approved contracts can update logistics booking');
      return;
    }

    if (nextStatus === 'completed') {
      const eventEnd = new Date(contract.eventDate);
      eventEnd.setHours(23, 59, 59, 999);

      if (new Date() <= eventEnd) {
        toast.error('Logistics can only be marked completed during post-event closeout.');
        return;
      }
    }

    if (!logisticsAssignment.truckId) {
      toast.error('Book the truck first before updating the event stage');
      return;
    }

    if (nextStatus === 'dispatched' && !logisticsAssignment.driverId) {
      toast.error('Assign the driver first before marking this event dispatched');
      return;
    }

    const payload = {
      ...logisticsAssignment,
      assignmentStatus: nextStatus,
    };

    try {
      await api.updateLogisticsAssignment(id!, payload);
      toast.success(nextStatus === 'dispatched' ? 'Logistics marked as dispatched' : 'Logistics marked as completed');
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update logistics stage');
    }
  };

  const handleUpdateInventoryItemStatus = async (section: InventorySectionKey, index: number, status: string) => {
    if (!contract || contract.status !== 'approved') {
      toast.error('Only approved contracts can update checklist statuses');
      return;
    }

    if (status === 'prepared') {
      const sectionItems: Record<InventorySectionKey, InventorySummaryItem[]> = {
        creativeAssets: creativeItems,
        linenRequirements: linenItems,
        equipmentChecklist: stockroomItems,
      };
      const targetItem = sectionItems[section]?.[index];

      if (targetItem?.shortageQuantity > 0) {
        toast.error(
          targetItem.requestAction
          || `Request purchasing/rental for ${targetItem.shortageQuantity} more ${targetItem.itemName} before marking this item prepared.`
        );
        return;
      }
    }

    try {
      await api.updateInventoryItemStatus(id!, { section, index, status });
      toast.success('Checklist updated');
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update checklist status');
    }
  };

  const handleUpdateInventoryPostEventStatus = async (
    section: InventorySectionKey,
    index: number,
    status: string,
  ) => {
    if (!contract) {
      return;
    }

    if (!eventHasPassed) {
      toast.error('Post-event checks are available only after the event date has passed.');
      return;
    }

    try {
      await api.updateInventoryPostEventStatus(id!, { section, index, status });
      toast.success('Post-event check updated');
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update post-event check');
    }
  };

  const openProcurementRequestDialog = (section: InventorySectionKey, item: InventorySummaryItem) => {
    if (!contract) {
      return;
    }

    setProcurementRequestTarget({ section, item });
    setProcurementRequestForm({
      requestType: item.sameDayConflict ? 'rental' : 'purchase',
      requestedQuantity: String(item.shortageQuantity || item.requestedQuantity || 1),
      neededBy: getDateInputValue(contract.eventDate),
      reason: item.requestAction
        || (item.shortageQuantity > 0
          ? `Need ${item.shortageQuantity || item.requestedQuantity} more ${item.itemName} for ${contract.contractNumber}.`
          : `Request ${item.itemName} for ${contract.contractNumber} to keep event inventory ready.`),
      notes: item.sameDayConflict
        ? `Same-day inventory is already committed to another event on ${new Date(contract.eventDate).toLocaleDateString()}.`
        : `Request linked to ${contract.contractNumber}.`,
    });
    setProcurementRequestDialogOpen(true);
  };

  const handleSubmitProcurementRequest = async () => {
    if (!contract || !procurementRequestTarget) {
      return;
    }

    const requestedQuantity = Number(procurementRequestForm.requestedQuantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      toast.error('Requested quantity must be a whole number greater than 0');
      return;
    }

    if (!procurementRequestForm.neededBy) {
      toast.error('Needed-by date is required');
      return;
    }

    if (!procurementRequestForm.reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    try {
      await api.createProcurementRequest({
        department: INVENTORY_SECTION_TO_PROCUREMENT_DEPARTMENT[procurementRequestTarget.section],
        requestType: procurementRequestForm.requestType,
        contractId: contract._id,
        ...(procurementRequestTarget.item.itemId ? { inventoryItemId: procurementRequestTarget.item.itemId } : {}),
        itemName: procurementRequestTarget.item.itemName,
        itemCode: procurementRequestTarget.item.itemCode,
        itemCategory: procurementRequestTarget.item.category,
        requestedQuantity,
        shortageQuantity: procurementRequestTarget.item.shortageQuantity || 0,
        neededBy: procurementRequestForm.neededBy,
        requestReason: procurementRequestForm.reason.trim(),
        requestNotes: procurementRequestForm.notes.trim(),
        source: procurementRequestTarget.item.shortageQuantity > 0 ? 'contract_shortage' : 'manual',
        sourceSection: procurementRequestTarget.section,
      });
      toast.success('Procurement request sent to purchasing');
      setProcurementRequestDialogOpen(false);
      setProcurementRequestTarget(null);
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send procurement request');
    }
  };

  const openIncidentReportDialog = (
    section: InventorySectionKey,
    index: number,
    itemName: string,
    requestedQuantity: number,
  ) => {
    setIncidentTarget({
      section,
      index,
      itemName,
      departmentLabel: INVENTORY_SECTION_LABELS[section],
      requestedQuantity,
    });
    setIncidentForm({
      incidentType: 'other',
      severity: 'medium',
      affectedQuantity: '',
      description: '',
      attachmentUrl: '',
    });
    setIncidentDialogOpen(true);
  };

  const handleIncidentAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setIncidentForm((current) => ({ ...current, attachmentUrl: '' }));
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Please upload a damage reference image smaller than 3 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setIncidentForm((current) => ({
        ...current,
        attachmentUrl: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitInventoryIncident = async () => {
    if (!contract || !incidentTarget) {
      return;
    }

    if (!incidentForm.description.trim()) {
      toast.error('Please describe the incident before submitting the report.');
      return;
    }

    const trimmedAffectedQuantity = incidentForm.affectedQuantity.trim();
    if (trimmedAffectedQuantity && (!/^\d+$/.test(trimmedAffectedQuantity) || Number(trimmedAffectedQuantity) <= 0)) {
      toast.error('Affected quantity must be a whole number greater than 0.');
      return;
    }

    try {
      await api.reportInventoryIncident(id!, {
        section: incidentTarget.section,
        index: incidentTarget.index,
        incidentType: incidentForm.incidentType,
        severity: incidentForm.severity,
        ...(trimmedAffectedQuantity ? { affectedQuantity: Number(trimmedAffectedQuantity) } : {}),
        description: incidentForm.description.trim(),
        ...(incidentForm.attachmentUrl ? { attachments: [incidentForm.attachmentUrl] } : {}),
      });
      toast.success(`Incident report sent to ${incidentTarget.departmentLabel} incidents.`);
      setIncidentDialogOpen(false);
      setIncidentTarget(null);
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit incident report');
    }
  };

  const formatCurrency = (value?: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const escapeHtml = (value?: string) => {
    return (value || '-')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const getPrintHeaderHtml = (
    title: string,
    subtitle: string,
    metaItems: Array<{ label: string; value: string }>
  ) => {
    const logoUrl = `${window.location.origin}/logo.png`;

    return `
      <div class="doc-shell">
        <div class="doc-topbar"></div>
        <div class="doc-body">
          <div class="company-header">
            <div>
              <div class="company-ident">
                <img src="${logoUrl}" alt="${COMPANY_NAME}" class="company-logo" />
                <div>
                  <h1 class="company-name">${COMPANY_NAME}</h1>
                  <p class="company-tagline">${COMPANY_TAGLINE}</p>
                </div>
              </div>
              <h2 class="document-title">${escapeHtml(title)}</h2>
              <p class="document-subtitle">${escapeHtml(subtitle)}</p>
            </div>
            <div class="meta-stack">
              ${metaItems.map((item) => `
                <div class="meta-line">
                  <span class="meta-label">${escapeHtml(item.label)}</span>
                  <div class="meta-value">${escapeHtml(item.value)}</div>
                </div>
              `).join('')}
            </div>
          </div>
    `;
  };

  const getDetailListHtml = (items: Array<{ label: string; value: string }>) => {
    return `
      <div class="detail-list">
        ${items.map((item) => `
          <div class="detail-row">
            <div class="detail-term">${escapeHtml(item.label)}</div>
            <div class="detail-value">${escapeHtml(item.value)}</div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const getSummaryLinesHtml = (items: Array<{ label: string; value: string }>) => {
    return items.map((item) => `
      <div class="summary-line">
        <span class="summary-label">${escapeHtml(item.label)}</span>
        <span class="summary-value">${escapeHtml(item.value)}</span>
      </div>
    `).join('');
  };

  const getSignatureBoxHtml = ({
    label,
    signedName,
    title,
    imageUrl,
    placeholder,
  }: {
    label: string;
    signedName: string;
    title?: string;
    imageUrl?: string;
    placeholder?: string;
  }) => `
    <div class="signature-box">
      <div class="signature-image-wrap">
        ${imageUrl
          ? `<img src="${imageUrl}" alt="${escapeHtml(label)}" class="signature-image" />`
          : `<div class="signature-placeholder">${escapeHtml(placeholder || `${label} not yet attached`)}</div>`}
      </div>
      <div class="signature-line">
        <div class="signature-role">${escapeHtml(label)}</div>
        <strong class="signature-name">${escapeHtml(signedName)}</strong>
        ${title ? `<div class="signature-title">${escapeHtml(title)}</div>` : ''}
      </div>
    </div>
  `;

  const handleExportPdf = () => {
    if (!contract) return;

    const paymentRows = contract.payments?.length
      ? contract.payments.map(payment => `
          <tr>
            <td>${escapeHtml(new Date(payment.date).toLocaleDateString())}</td>
            <td>${escapeHtml(payment.method.replace('_', ' '))}</td>
            <td>${formatCurrency(payment.amount)}</td>
            <td>${escapeHtml(payment.status)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="4">No payments recorded</td></tr>';

    const menuRows = contract.menuDetails?.length
      ? contract.menuDetails.map(item => `
          <tr>
            <td>${escapeHtml(item.category)}</td>
            <td>${escapeHtml(item.item)}</td>
            <td>${item.quantity}</td>
            <td>${item.confirmed ? 'Yes' : 'No'}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="4">No menu items recorded</td></tr>';

    const printWindow = window.open('', '_blank', 'width=960,height=1080');

    if (!printWindow) {
      toast.error('Please allow pop-ups to export the contract PDF');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(contract.contractNumber)} - Contract</title>
          <style>
            ${PRINT_DOCUMENT_STYLES}
          </style>
        </head>
        <body>
          ${getPrintHeaderHtml(
            'Contract Summary',
            'Comprehensive contract record for client, operations, and billing reference.',
            [
              { label: 'Contract Number', value: contract.contractNumber },
              { label: 'Status', value: contract.status.replace(/_/g, ' ') },
              { label: 'Generated', value: new Date().toLocaleString() },
            ]
          )}
          <div class="summary-strip">
            ${getSummaryLinesHtml([
              { label: 'Event Date', value: new Date(contract.eventDate).toLocaleDateString() },
              { label: 'Client Type', value: contract.clientType },
              { label: 'Total Packs', value: String(contract.totalPacks || 0) },
              { label: 'Remaining Balance', value: formatCurrency(remainingBalance) },
            ])}
          </div>

          <section class="document-section">
            <h3 class="section-heading">Client And Event</h3>
            <div class="info-grid">
              <div>
                ${getDetailListHtml([
                  { label: 'Client Name', value: contract.clientName },
                  { label: 'Contact', value: contract.clientContact },
                  { label: 'Email', value: contract.clientEmail },
                  { label: 'Client Type', value: contract.clientType },
                ])}
              </div>
              <div>
                ${getDetailListHtml([
                  { label: 'Event Date', value: new Date(contract.eventDate).toLocaleDateString() },
                  { label: 'Booking Date', value: new Date(contract.bookingDate).toLocaleDateString() },
                  { label: 'Venue', value: contract.venue?.name || '-' },
                  { label: 'Venue Address', value: contract.venue?.address || '-' },
                ])}
              </div>
            </div>
          </section>

          <section class="document-section">
            <h3 class="section-heading">Package And Preferences</h3>
            <div class="info-grid">
              <div>
                ${getDetailListHtml([
                  { label: 'Package', value: contract.packageSelected },
                  { label: 'Total Packs', value: String(contract.totalPacks || 0) },
                  { label: 'Preferred Color', value: contract.preferredColor },
                ])}
              </div>
              <div>
                ${getDetailListHtml([
                  { label: 'Napkin Type', value: contract.napkinType },
                  { label: 'Table Setup', value: contract.tableSetup },
                  { label: 'Backdrop Requirements', value: contract.backdropRequirements },
                ])}
              </div>
            </div>
          </section>

          <section class="document-section">
            <h3 class="section-heading">Menu Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Confirmed</th>
                </tr>
              </thead>
              <tbody>${menuRows}</tbody>
            </table>
          </section>

          <section class="document-section">
            <h3 class="section-heading">Payments</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${paymentRows}</tbody>
            </table>
            <div class="totals">
              <div><span class="muted">Package Price</span><span>${formatCurrency(contract.packagePrice)}</span></div>
              <div><span class="muted">Total Paid</span><span>${formatCurrency(totalPaid)}</span></div>
              <div class="grand"><span>Total Contract Value</span><span>${formatCurrency(contract.totalContractValue)}</span></div>
              <div><span class="muted">Remaining Balance</span><span>${formatCurrency(remainingBalance)}</span></div>
            </div>
          </section>

          <section class="document-section">
            <h3 class="section-heading">Notes</h3>
            <div class="info-grid">
              <div>
                ${getDetailListHtml([
                  { label: 'Special Requests', value: contract.specialRequests },
                ])}
              </div>
              <div>
                ${getDetailListHtml([
                  { label: 'Venue Notes', value: contract.venue?.notes || '-' },
                ])}
              </div>
            </div>
          </section>

          <div class="document-note">
            This document is formatted for department coordination under ${COMPANY_NAME}.
          </div>
        </div>
      </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleExportSignaturePacket = (
    mode: 'print' | 'esign',
    statusOverride?: string,
    signatureAssetsOverride?: Contract['signatureAssets']
  ) => {
    if (!contract) return;

    const menuRows = contract.menuDetails?.length
      ? contract.menuDetails.map(item => `
          <tr>
            <td>${escapeHtml(item.category)}</td>
            <td>${escapeHtml(item.item)}</td>
            <td>${item.quantity}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="3">Menu details will be finalized on the signed contract copy.</td></tr>';

    const printWindow = window.open('', '_blank', 'width=960,height=1080');
    if (!printWindow) {
      toast.error(mode === 'print'
        ? 'Please allow pop-ups to print the signature copy'
        : 'Please allow pop-ups to open the e-signature PDF');
      return;
    }

    const isEsign = mode === 'esign';
    const documentTitle = isEsign ? 'Signature Ready PDF' : 'Client Signature Copy';
    const documentSubtitle = isEsign
      ? 'Prepared for electronic signing and PDF sharing.'
      : 'Prepared for printing and handwritten client signature.';
    const signatureAssets = signatureAssetsOverride || contract.signatureAssets;
    const clientSignature = signatureAssets?.client;
    const staffSignature = signatureAssets?.staff;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(contract.contractNumber)} - ${escapeHtml(documentTitle)}</title>
          <style>
            ${PRINT_DOCUMENT_STYLES}
          </style>
        </head>
        <body>
          ${getPrintHeaderHtml(
            documentTitle,
            documentSubtitle,
            [
              { label: 'Contract Number', value: contract.contractNumber },
              { label: 'Signature Status', value: statusOverride || formatStatusLabel(contract.status) || 'Draft' },
              { label: 'Generated', value: new Date().toLocaleString() },
            ]
          )}
          <div class="summary-strip">
            ${getSummaryLinesHtml([
              { label: 'Client', value: contract.clientName },
              { label: 'Event Date', value: new Date(contract.eventDate).toLocaleDateString() },
              { label: 'Contract Value', value: formatCurrency(contract.totalContractValue) },
              { label: paymentSummaryLabel, value: formatCurrency(requiredDownPayment) },
            ])}
          </div>

          <section class="document-section">
            <h3 class="section-heading">Client And Event</h3>
            <div class="info-grid">
              <div>
                ${getDetailListHtml([
                  { label: 'Client Name', value: contract.clientName },
                  { label: 'Contact', value: contract.clientContact },
                  { label: 'Email', value: contract.clientEmail },
                  { label: 'Client Type', value: contract.clientType },
                ])}
              </div>
              <div>
                ${getDetailListHtml([
                  { label: 'Venue', value: contract.venue?.name || '-' },
                  { label: 'Venue Address', value: contract.venue?.address || '-' },
                  { label: 'Package', value: contract.packageSelected },
                  { label: 'Total Packs', value: String(contract.totalPacks || 0) },
                ])}
              </div>
            </div>
          </section>

          <section class="document-section">
            <h3 class="section-heading">Payment Schedule</h3>
            <div class="info-grid">
              <div>
                ${getDetailListHtml([
                  { label: paymentRequirementLabel, value: formatCurrency(requiredDownPayment) },
                  { label: fullPaymentPlan ? 'Payment Timing' : 'Deposit Timing', value: fullPaymentPlan ? 'Due before preparation approval' : 'Due upon signing unless client pays in full' },
                ])}
              </div>
              <div>
                ${getDetailListHtml([
                  { label: fullPaymentPlan ? 'Later Balance' : `${finalPaymentPercent}% Final Balance`, value: fullPaymentPlan ? formatCurrency(0) : formatCurrency(remainingBalance) },
                  { label: fullPaymentPlan ? 'Later Balance Timing' : 'Final Due Date', value: fullPaymentPlan ? 'No later balance scheduled' : finalBalanceDueDate.toLocaleDateString() },
                ])}
              </div>
            </div>
          </section>

          <section class="document-section">
            <h3 class="section-heading">Menu Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Item</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>${menuRows}</tbody>
            </table>
          </section>

          <section class="document-section">
            <h3 class="section-heading">Signature Acknowledgment</h3>
            <p class="detail-value">
              By signing this contract, the client confirms the event details, pricing, package selections, and payment schedule with ${COMPANY_NAME}.
            </p>
            <div class="signature-row">
              ${getSignatureBoxHtml({
                label: 'Client Signature',
                signedName: clientSignature?.signedName || contract.clientName,
                title: clientSignature?.title || 'Client',
                imageUrl: clientSignature?.imageUrl,
                placeholder: isEsign ? 'Upload the client signature to place it here.' : 'Client signs above this line on the printed copy.',
              })}
              ${getSignatureBoxHtml({
                label: 'Authorized Representative',
                signedName: staffSignature?.signedName || user?.name || COMPANY_NAME,
                title: staffSignature?.title || COMPANY_NAME,
                imageUrl: staffSignature?.imageUrl,
                placeholder: isEsign ? 'Upload the staff signature to place it here.' : 'Authorized staff signs above this line on the printed copy.',
              })}
            </div>
          </section>

          <div class="document-note">
            ${isEsign
              ? 'Use your browser print dialog to save this as PDF and send it through your preferred e-signature tool.'
              : `Printed signature copy prepared for ${COMPANY_NAME}.`}
          </div>
        </div>
      </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    if (isEsign) {
      return;
    }

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleExportOfficialReceipt = (payment: Contract['payments'][number]) => {
    if (!contract) return;

    const printWindow = window.open('', '_blank', 'width=820,height=960');
    if (!printWindow) {
      toast.error('Please allow pop-ups to generate the official receipt');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(payment.receiptNumber || 'Official Receipt')}</title>
          <style>
            ${PRINT_DOCUMENT_STYLES}
          </style>
        </head>
        <body>
          ${getPrintHeaderHtml(
            'Official Receipt',
            'Acknowledgment of payment for catering services and event contract billing.',
            [
              { label: 'Receipt Number', value: payment.receiptNumber || '-' },
              { label: 'Contract Number', value: contract.contractNumber },
              { label: 'Issued', value: new Date(payment.receiptGeneratedAt || payment.date).toLocaleString() },
            ]
          )}
          <div class="amount-line">
            <div class="amount-label">Amount Received</div>
            <div class="amount-value">${formatCurrency(payment.amount)}</div>
          </div>

          <section class="document-section">
            <h3 class="section-heading">Receipt Details</h3>
            <div class="info-grid">
              <div>
                ${getDetailListHtml([
                  { label: 'Client Name', value: contract.clientName },
                  { label: 'Payment Method', value: payment.method.replace(/_/g, ' ') },
                  { label: 'Reference', value: payment.reference || '-' },
                ])}
              </div>
              <div>
                ${getDetailListHtml([
                  { label: 'Payment Date', value: new Date(payment.date).toLocaleDateString() },
                  { label: 'Receipt Status', value: payment.status },
                  { label: 'Official Receipt No.', value: payment.receiptNumber || '-' },
                ])}
              </div>
            </div>
          </section>

          ${payment.receiptImageUrl ? `
            <section class="document-section proof-image">
              <h3 class="section-heading">Attached Payment Proof</h3>
              <img src="${payment.receiptImageUrl}" alt="Payment proof" />
            </section>
          ` : ''}

          <div class="signature-row">
            ${getSignatureBoxHtml({
              label: 'Received By',
              signedName: payment.receiptIssuedBy || COMPANY_NAME,
              title: COMPANY_NAME,
              placeholder: 'Accounting signs above this line.',
            })}
            ${getSignatureBoxHtml({
              label: 'Client Signature',
              signedName: contract.clientName,
              title: 'Client',
              placeholder: 'Client acknowledges receipt here.',
            })}
          </div>

          <div class="document-note">
            This receipt was generated by ${COMPANY_NAME} for accounting and client acknowledgment.
          </div>
        </div>
      </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handlePrintSection = (sectionKey: string) => {
    if (!contract) return;

    const sectionElement = document.querySelector(`[data-print-section="${sectionKey}"]`);
    if (!(sectionElement instanceof HTMLElement)) {
      toast.error('This section is not ready to print yet.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=960,height=1080');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print this section');
      return;
    }

    const sectionTitle = SECTION_PRINT_LABELS[sectionKey] || 'Section';
    const sharedStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');
    const sectionClone = sectionElement.cloneNode(true) as HTMLElement;

    sectionClone.querySelectorAll('[data-print-hide="true"]').forEach((node) => {
      node.remove();
    });

    sectionClone.querySelectorAll<HTMLElement>('*').forEach((node) => {
      node.classList.remove('rounded-lg', 'rounded-xl', 'rounded-md', 'border', 'bg-card', 'shadow-sm', 'shadow');
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(contract.contractNumber)} - ${escapeHtml(sectionTitle)}</title>
          ${sharedStyles}
          <style>
            ${PRINT_DOCUMENT_STYLES}
          </style>
        </head>
        <body>
          ${getPrintHeaderHtml(
            sectionTitle,
            `Department-focused print view for ${contract.clientName}.`,
            [
              { label: 'Contract Number', value: contract.contractNumber },
              { label: 'Client', value: contract.clientName },
              { label: 'Printed', value: new Date().toLocaleString() },
            ]
          )}
          <section class="document-section print-section">
            ${sectionClone.innerHTML}
          </section>
          <div class="document-note">
            Printed from the ${escapeHtml(sectionTitle.toLowerCase())} section for ${COMPANY_NAME}.
          </div>
        </div>
      </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handlePrintBanquetStaffPlan = () => {
    if (!contract) {
      return;
    }

    const roleSectionsHtml = BANQUET_ASSIGNMENT_ROLE_KEYS.map((roleKey) => {
      const assignedStaff = getBanquetDraftStaffForRole(roleKey);
      const plannedCount = banquetAssignmentDraft.staffingPlan[roleKey] || 0;
      const totalRows = Math.max(plannedCount, assignedStaff.length);

      if (totalRows === 0) {
        return '';
      }

      const rows = Array.from({ length: totalRows }, (_, index) => {
        const staff = assignedStaff[index] || null;
        const isOpenSlot = !staff;

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${isOpenSlot ? '<span class="muted">Open slot</span>' : escapeHtml(staff.fullName)}</td>
            <td>${isOpenSlot ? '-' : escapeHtml(staff.employeeId || '-')}</td>
            <td class="check-cell">&#9633;</td>
            <td>____________</td>
            <td>____________</td>
            <td>________________________________</td>
          </tr>
        `;
      }).join('');

      return `
        <section class="document-section">
          <h3 class="section-heading">${escapeHtml(BANQUET_ROLE_LABELS[roleKey])}</h3>
          <div class="summary-strip">
            ${getSummaryLinesHtml([
              { label: 'Planned', value: String(plannedCount) },
              { label: 'Assigned', value: String(assignedStaff.length) },
              { label: 'Open Slots', value: String(Math.max(0, plannedCount - assignedStaff.length)) },
              { label: 'Available Today', value: String(getBanquetAvailableStaffForRole(roleKey).length) },
            ])}
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Staff Member</th>
                <th>Employee ID</th>
                <th>Present</th>
                <th>Arrival</th>
                <th>Station</th>
                <th>Signature / Notes</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
      `;
    }).join('');

    if (!roleSectionsHtml) {
      toast.error('Add or plan banquet staff first before printing the check-in sheet.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1080,height=1180');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the banquet staff plan');
      return;
    }

    const assignedSupervisorName = banquetSummary?.supervisorOptions.find(
      (option) => option._id === banquetAssignmentDraft.supervisorId,
    )?.name || contract.assignedSupervisor?.name || 'Not assigned';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(contract.contractNumber)} - Banquet Staff Check-In</title>
          <style>
            ${PRINT_DOCUMENT_STYLES}
            .check-cell { text-align: center; width: 72px; }
          </style>
        </head>
        <body>
          ${getPrintHeaderHtml(
            'Banquet Staff Check-In Sheet',
            'Supervisor attendance sheet for confirming the assigned service team on event day.',
            [
              { label: 'Contract Number', value: contract.contractNumber },
              { label: 'Event Date', value: new Date(contract.eventDate).toLocaleDateString() },
              { label: 'Printed', value: new Date().toLocaleString() },
            ],
          )}
          <div class="summary-strip">
            ${getSummaryLinesHtml([
              { label: 'Client', value: contract.clientName },
              { label: 'Venue', value: contract.venue?.name || '-' },
              { label: 'Service Guests', value: String(banquetAssignmentDraft.serviceGuestCount || banquetSummary?.planningGuestCount || 0) },
              { label: 'Supervisor', value: assignedSupervisorName },
              { label: 'Planned Crew', value: String(banquetPlannedTotal) },
              { label: 'Assigned Crew', value: String(banquetAssignedTotal) },
            ])}
          </div>
          <section class="document-section">
            <h3 class="section-heading">Supervisor Notes</h3>
            <div class="detail-value">
              Use the Present column to check attendance, note each team member's arrival time, and capture any last-minute changes in the notes column.
            </div>
          </section>
          ${roleSectionsHtml}
          <section class="document-section">
            <h3 class="section-heading">Closeout Sign-Off</h3>
            <div class="info-grid">
              <div>
                ${getDetailListHtml([
                  { label: 'Supervisor', value: assignedSupervisorName },
                  { label: 'Prepared By', value: user?.name || COMPANY_NAME },
                ])}
              </div>
              <div>
                ${getDetailListHtml([
                  { label: 'Arrival Call Time', value: '____________________' },
                  { label: 'Final Notes', value: '____________________________________________________' },
                ])}
              </div>
            </div>
          </section>
          <div class="document-note">
            Printed from the banquet staffing section for ${COMPANY_NAME}.
          </div>
        </div>
      </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const inventoryStatusOptions = {
    creativeAssets: ['pending', 'prepared'],
    linenRequirements: ['pending', 'prepared'],
    equipmentChecklist: ['pending', 'prepared'],
  } as const;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'pending_client_signature': return 'bg-sky-100 text-sky-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'accounting_review': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const canUpdatePreparation = contract ? contract.status === 'approved' : false;
  const canConfirmFinalizationSections = contract ? ['draft', 'pending_client_signature'].includes(contract.status) : false;
  const canManageLogistics = canUpdatePreparation && (isLogistics() || isAdmin());
  const canManageCreative = canUpdatePreparation && (isCreative() || isAdmin());
  const canManageLinen = canUpdatePreparation && (isLinen() || isAdmin());
  const canManageStockroom = canUpdatePreparation && (isPurchasing() || isStockroom() || isAdmin());
  const isInventoryDepartmentViewer = isCreative() || isLinen() || isPurchasing() || isStockroom();
  const useInventoryFocusedContractView = isInventoryDepartmentViewer && !isAdmin() && !isSales();
  const useBanquetFocusedContractView = isBanquet() && !isAdmin() && !isSales();
  const useRestrictedDepartmentContractView = useInventoryFocusedContractView || useBanquetFocusedContractView;
  const canEditDraftSalesContract = contract ? contract.status === 'draft' && (isSales() || isAdmin()) : false;
  const canEditDraftCreativeInventory = contract ? contract.status === 'draft' && (isCreative() || isAdmin()) : false;
  const canEditDraftLinenInventory = contract ? contract.status === 'draft' && (isLinen() || isAdmin()) : false;
  const canEditDraftStockroomInventory = contract ? contract.status === 'draft' && (isPurchasing() || isStockroom() || isAdmin()) : false;
  const canEditDraftAnyInventorySection = (
    canEditDraftCreativeInventory
    || canEditDraftLinenInventory
    || canEditDraftStockroomInventory
  );
  const canConfirmCreativeSection = canConfirmFinalizationSections && (isCreative() || isAdmin());
  const canConfirmLinenSection = canConfirmFinalizationSections && (isLinen() || isAdmin());
  const canConfirmStockroomSection = canConfirmFinalizationSections && (isPurchasing() || isStockroom() || isAdmin());
  const openContractEditor = (editorTab: 'client' | 'event' | 'package' | 'addons' | 'summary') => {
    navigate(`/contracts/edit/${id}?tab=${editorTab}`);
  };
  const renderTabEditButton = (
    editorTab: 'client' | 'event' | 'package' | 'addons' | 'summary',
    label = 'Edit This Section',
    canEdit = canEditDraftSalesContract
  ) => (
    canEdit ? (
      <Button
        type="button"
        size="sm"
        variant="outline"
        data-print-hide="true"
        onClick={() => openContractEditor(editorTab)}
      >
        <Edit className="mr-2 h-4 w-4" />
        {label}
      </Button>
    ) : null
  );
  const renderReferenceBadge = (label = 'Reference Only') => (
    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
      {label}
    </Badge>
  );

  const getSectionConfirmation = (sectionKey: ConfirmableSectionKey) => contract?.sectionConfirmations?.[sectionKey];
  const isSectionConfirmed = (sectionKey: ConfirmableSectionKey) => Boolean(getSectionConfirmation(sectionKey)?.confirmed);

  const renderInventorySection = (
    title: string,
    icon: ReactNode,
    sectionKey: InventorySectionKey,
    items: InventorySummaryItem[],
    canEdit: boolean
  ) => {
    const canManagePostEvent = canEdit && eventHasPassed && !isContractClosed;
    const canCreateProcurementRequest = (
      sectionKey === 'creativeAssets'
        ? canCreateCreativeProcurementRequest
        : sectionKey === 'linenRequirements'
          ? canCreateLinenProcurementRequest
          : canCreateStockroomProcurementRequest
    );
    const confirmationSectionKey = INVENTORY_SECTION_TO_CONFIRMABLE_SECTION[sectionKey];
    const isInventorySectionConfirmed = isSectionConfirmed(confirmationSectionKey);
    const canConfirmInventorySection = confirmationSectionKey === 'creative'
      ? canConfirmCreativeSection
      : confirmationSectionKey === 'linen'
        ? canConfirmLinenSection
        : canConfirmStockroomSection;
    const canEditInventoryDraftSection = sectionKey === 'creativeAssets'
      ? canEditDraftCreativeInventory
      : sectionKey === 'linenRequirements'
        ? canEditDraftLinenInventory
        : canEditDraftStockroomInventory;
    const showPreSignatureInventoryValidation = canConfirmFinalizationSections && items.length > 0;

    if (!items.length) {
      return (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {canConfirmFinalizationSections ? renderReferenceBadge('Reference View') : null}
              {canEditInventoryDraftSection ? renderTabEditButton('addons', 'Edit Inventory Items', canEditInventoryDraftSection) : null}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No items saved in this section.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {showPreSignatureInventoryValidation ? (
              <Badge
                variant="outline"
                className={isInventorySectionConfirmed
                  ? READINESS_STATUS_META.ready.badgeClassName
                  : READINESS_STATUS_META.not_started.badgeClassName}
              >
                {isInventorySectionConfirmed ? 'Confirmed' : 'Pending Confirmation'}
              </Badge>
            ) : null}
            {canConfirmFinalizationSections ? renderReferenceBadge('Reference View') : null}
            {canEditInventoryDraftSection ? renderTabEditButton('addons', 'Edit Inventory Items', canEditInventoryDraftSection) : null}
            {showPreSignatureInventoryValidation && canConfirmInventorySection ? (
              <Button
                type="button"
                size="sm"
                variant={isInventorySectionConfirmed ? 'outline' : 'default'}
                onClick={() => handleUpdateSectionConfirmation(
                  confirmationSectionKey,
                  true,
                  `${title} confirmed for pre-signature review.`
                )}
                disabled={isInventorySectionConfirmed}
              >
                {isInventorySectionConfirmed ? `${title} Confirmed` : `Confirm ${title}`}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {showPreSignatureInventoryValidation ? (
            <div className="mb-4 rounded-lg border bg-muted/20 px-4 py-3 text-sm">
              {isInventorySectionConfirmed
                ? `${title} has already been reviewed for this draft contract. Any new item change will reset the confirmation automatically.`
                : `${title} still needs department confirmation before sales can send this contract for signature.`}
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item, index) => {
              const preEventBadgeClassName = item.readyForDispatch
                ? 'bg-green-100 text-green-800'
                : item.itemStatus === 'prepared'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800';
              const preEventBadgeLabel = item.readyForDispatch
                ? 'Dispatch ready'
                : formatEnumLabel(item.itemStatus);
              const stockBadgeClassName = item.enoughStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

              return (
                <div key={`${sectionKey}-${item.itemName}-${index}`} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      className={`h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted ${item.imageUrl ? 'cursor-zoom-in' : 'cursor-default'}`}
                      onClick={() => item.imageUrl && setPreviewImage({ url: item.imageUrl, title: item.itemName })}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.itemName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </button>

                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold">{item.itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            {[item.itemCode, item.category].filter(Boolean).join(' | ') || 'Inventory item'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">Need {item.requestedQuantity}</Badge>
                          <Badge className={stockBadgeClassName}>
                            {item.enoughStock ? 'Enough stock' : 'Stock shortage'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg border bg-slate-50 px-3 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Available</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{item.availableQuantity ?? '-'}</p>
                          <p className="text-xs text-muted-foreground">For this event date</p>
                        </div>
                        <div className="rounded-lg border bg-slate-50 px-3 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Reserved</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{item.reservedOnDate}</p>
                          <p className="text-xs text-muted-foreground">Same event date</p>
                        </div>
                        <div className="rounded-lg border bg-slate-50 px-3 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Inventory Status</p>
                          <p className="mt-1 text-sm font-semibold capitalize text-slate-900">{item.inventoryStatus.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">Current stock record</p>
                        </div>
                      </div>

                      {item.blockers.length > 0 ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          {item.blockers.join(' ')}
                        </div>
                      ) : null}

                      {eventHasPassed ? (
                        <div className="rounded-lg border bg-slate-50/80 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Post-Event Check</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Review the return, then report any missing, damaged, or wrong-quantity issue here.
                              </p>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              {item.postEventStatus === 'incident_reported' ? (
                                <Badge className="bg-red-100 text-red-800">Incident reported</Badge>
                              ) : null}
                              <Badge className={getPostEventStatusClassName(item.postEventStatus, item.itemStatus)}>
                                {getPostEventStatusLabel(item.postEventStatus, item.itemStatus)}
                              </Badge>
                            </div>
                          </div>

                          {item.postEventNotes ? (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                              {item.postEventNotes}
                            </div>
                          ) : null}

                          <div className="mt-3">
                            {canManagePostEvent ? (
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label>Post-Event Status</Label>
                                  <Select
                                    value={resolvePostEventStatus(item.postEventStatus, item.itemStatus)}
                                    onValueChange={(value) => handleUpdateInventoryPostEventStatus(sectionKey, index, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {POST_EVENT_STATUS_OPTIONS.map((statusOption) => (
                                        <SelectItem key={statusOption} value={statusOption}>
                                          {getPostEventStatusLabel(statusOption)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant={item.postEventStatus === 'incident_reported' ? 'outline' : 'destructive'}
                                  onClick={() => openIncidentReportDialog(sectionKey, index, item.itemName, item.requestedQuantity)}
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  {item.postEventStatus === 'incident_reported' ? 'Add Another Incident' : 'Report Incident'}
                                </Button>
                              </div>
                            ) : (
                              <p className="text-sm">
                                <span className="text-muted-foreground">Post-event status: </span>
                                <span className="font-medium">{getPostEventStatusLabel(item.postEventStatus, item.itemStatus)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border bg-slate-50/80 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Pre-Event Preparation</p>
                              <p className="mt-1 text-sm text-muted-foreground">Prepare the item, then mark it ready for release.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {item.sameDayConflict ? (
                                <Badge className="bg-red-100 text-red-800">Same-day conflict</Badge>
                              ) : null}
                              <Badge className={preEventBadgeClassName}>{preEventBadgeLabel}</Badge>
                            </div>
                          </div>
                          {item.requestAction ? (
                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                              {item.requestAction}
                            </div>
                          ) : null}
                          {canCreateProcurementRequest && item.itemId ? (
                            <div className="mt-3">
                              <Button
                                type="button"
                                size="sm"
                                variant={item.shortageQuantity > 0 ? 'default' : 'outline'}
                                onClick={() => openProcurementRequestDialog(sectionKey, item)}
                              >
                                {item.shortageQuantity > 0 ? 'Request Purchasing Or Rental' : 'Create Purchasing Request'}
                              </Button>
                            </div>
                          ) : null}
                          <div className="mt-3">
                            {canEdit ? (
                              <div className="space-y-2">
                                <Label>Preparation Status</Label>
                                <Select
                                  value={item.itemStatus}
                                  onValueChange={(value) => handleUpdateInventoryItemStatus(sectionKey, index, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {inventoryStatusOptions[sectionKey].map(statusOption => (
                                      <SelectItem key={statusOption} value={statusOption}>
                                        {formatEnumLabel(statusOption)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <p className="text-sm">
                                <span className="text-muted-foreground">Preparation status: </span>
                                <span className="font-medium">{formatEnumLabel(item.itemStatus)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const canViewDetailsTab = useBanquetFocusedContractView || !useInventoryFocusedContractView;
  const canViewMenuTab = !useRestrictedDepartmentContractView && (isAdmin() || isSales() || isKitchen() || isPurchasing() || isBanquet());
  const canViewInventoryTab = useBanquetFocusedContractView ? false : true;
  const canViewPaymentsTab = !useRestrictedDepartmentContractView && (isAdmin() || isAccounting() || isSales());
  const canViewBanquetTab = useBanquetFocusedContractView || (!useInventoryFocusedContractView && (isAdmin() || isBanquet() || isSales()));
  const canViewLogisticsTab = !useRestrictedDepartmentContractView && (isAdmin() || isLogistics() || isBanquet() || isSales());
  const canViewPreferencesTab = useBanquetFocusedContractView || (!useInventoryFocusedContractView && (isAdmin() || isSales() || isCreative() || isLinen() || isKitchen() || isPurchasing() || isBanquet()));
  const canViewTimelineTab = !useRestrictedDepartmentContractView && role !== 'accounting';
  const visibleTabs = ALL_CONTRACT_TABS.filter((tab) => {
    switch (tab) {
      case 'details':
        return canViewDetailsTab;
      case 'menu':
        return canViewMenuTab;
      case 'inventory':
        return canViewInventoryTab;
      case 'payments':
        return canViewPaymentsTab;
      case 'banquet':
        return canViewBanquetTab;
      case 'logistics':
        return canViewLogisticsTab;
      case 'preferences':
        return canViewPreferencesTab;
      case 'timeline':
        return canViewTimelineTab;
      default:
        return false;
    }
  });
  const activeTab = visibleTabs.includes(rawActiveTab) ? rawActiveTab : visibleTabs[0] || 'details';
  const canManageBanquet = (isAdmin() || isBanquet() || isSales()) && Boolean(contract && ['approved', 'completed'].includes(contract.status));
  const banquetSummary = operationsSummary?.banquet;
  const banquetSelectedAssignments = banquetSummary?.selectedAssignments || [];
  const banquetSuggestedAssignments = banquetSummary?.suggestedAssignments || [];
  const banquetAssignedTotal = BANQUET_ASSIGNMENT_ROLE_KEYS.reduce(
    (sum, roleKey) => sum + banquetAssignmentDraft.assignments[roleKey].length,
    0
  );
  const banquetPlannedTotal = getBanquetPlanTotal(banquetAssignmentDraft.staffingPlan);
  const banquetDraftCoveragePercent = (() => {
    const totalSteps = banquetPlannedTotal + 1;

    if (totalSteps === 0) {
      return 0;
    }

    const coveredAssignments = BANQUET_ASSIGNMENT_ROLE_KEYS.reduce((sum, roleKey) => (
      sum + Math.min(
        banquetAssignmentDraft.assignments[roleKey].length,
        Number(banquetAssignmentDraft.staffingPlan[roleKey]) || 0
      )
    ), 0);

    const completedSteps = coveredAssignments + (banquetAssignmentDraft.supervisorId ? 1 : 0);
    return Math.round((completedSteps / totalSteps) * 100);
  })();
  const getBanquetAvailableStaffForRole = (roleKey: BanquetAssignmentRole) => (
    banquetSummary?.availableByRole?.[roleKey] || []
  );
  const banquetStaffLookup = (() => {
    const entries = new Map<string, BanquetStaffSummary>();

    banquetSelectedAssignments.forEach((assignment) => {
      entries.set(assignment.staffId, assignment.staff);
    });

    banquetSuggestedAssignments.forEach((assignment) => {
      entries.set(assignment.staffId, assignment.staff);
    });

    BANQUET_ASSIGNMENT_ROLE_KEYS.forEach((roleKey) => {
      getBanquetAvailableStaffForRole(roleKey).forEach((staff) => {
        entries.set(staff._id, staff);
      });
    });

    return entries;
  })();
  const getBanquetDraftStaffForRole = (roleKey: BanquetAssignmentRole) => (
    banquetAssignmentDraft.assignments[roleKey]
      .map((staffId) => banquetStaffLookup.get(staffId))
      .filter((staff): staff is BanquetStaffSummary => Boolean(staff))
  );

  useEffect(() => {
    if (visibleTabs.includes(rawActiveTab)) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    if (activeTab === 'details') {
      next.delete('tab');
    } else {
      next.set('tab', activeTab);
    }
    setSearchParams(next, { replace: true });
  }, [activeTab, rawActiveTab, searchParams, setSearchParams, visibleTabs]);

  useEffect(() => {
    if (!contract || !canManageLogistics || contract.status !== 'approved' || isOperationsLoading) {
      return;
    }

    const currentSnapshot = buildLogisticsAssignmentSnapshot(logisticsAssignment);

    if (currentSnapshot === logisticsLastSavedSnapshotRef.current) {
      return;
    }

    setLogisticsAutoSaveErrorMessage('');
    setLogisticsAutoSaveState('saving');

    const timeoutId = window.setTimeout(() => {
      void handleUpdateLogisticsAssignment(logisticsAssignment, { silent: true });
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    contract,
    canManageLogistics,
    isOperationsLoading,
    logisticsAssignment.driverId,
    logisticsAssignment.notes,
    logisticsAssignment.truckId,
  ]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!contract) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-xl font-medium">Contract not found</h2>
          <Button className="mt-4" onClick={() => navigate('/contracts')}>
            Back to Contracts
          </Button>
        </div>
      </Layout>
    );
  }

  const totalPaid = contract.payments
    ?.filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  const downPaymentPercent = resolveDownPaymentPercent(contract.downPaymentPercent);
  const finalPaymentPercent = resolveFinalPaymentPercent(contract.downPaymentPercent, contract.finalPaymentPercent);
  const remainingBalance = Math.max(0, (contract.totalContractValue || 0) - totalPaid);
  const requiredDownPayment = Math.round((contract.totalContractValue || 0) * (downPaymentPercent / 100) * 100) / 100;
  const downPaymentBalance = Math.max(0, requiredDownPayment - totalPaid);
  const downPaymentSatisfied = totalPaid >= requiredDownPayment;
  const fullyPaid = remainingBalance <= 0;
  const fullPaymentPlan = downPaymentPercent >= 100 || finalPaymentPercent <= 0;
  const savedPaymentPlan: 'split' | 'full' = fullPaymentPlan ? 'full' : 'split';
  const finalBalanceDueDate = getFinalPaymentDueDate(contract.eventDate);
  const finalBalanceDeadline = new Date(finalBalanceDueDate);
  finalBalanceDeadline.setHours(23, 59, 59, 999);
  const finalBalancePastDue = !fullyPaid && new Date() > finalBalanceDeadline;
  const paymentHoldActive = contract.clientSigned && finalBalancePastDue && !fullyPaid;
  const paymentRequirementMet = fullPaymentPlan ? fullyPaid : finalBalancePastDue ? fullyPaid : downPaymentSatisfied;
  const paymentRequirementRemaining = fullPaymentPlan ? remainingBalance : finalBalancePastDue ? remainingBalance : downPaymentBalance;
  const paymentPlanLabel = fullPaymentPlan ? 'Full Payment' : `${downPaymentPercent}% / ${finalPaymentPercent}% Split`;
  const paymentRequirementLabel = fullPaymentPlan
    ? 'Full Payment Required'
    : finalBalancePastDue
      ? 'Full Balance Now Required'
      : `${downPaymentPercent}% Down Payment`;
  const paymentSummaryLabel = fullPaymentPlan ? 'Payment Required' : 'Required Deposit';
  const isPreSignatureStage = ['draft', 'pending_client_signature'].includes(contract.status);
  const paymentPlanSummary = fullPaymentPlan
    ? isPreSignatureStage
      ? 'This records the agreed full-payment arrangement before signature. Payment posting starts only after the client signs.'
      : `Full payment must be settled before preparation approval and no later than ${finalBalanceDueDate.toLocaleDateString()}.`
    : isPreSignatureStage
      ? `This records the agreed ${downPaymentPercent}% / ${finalPaymentPercent}% arrangement before signature. Payment posting starts only after the client signs.`
      : `${downPaymentPercent}% is collected after signature for preparation release, and the remaining ${finalPaymentPercent}% stays due one month before the event.`;
  const menuItemCount = contract.menuDetails?.length || 0;
  const confirmedMenuCount = contract.menuDetails?.filter(item => item.confirmed).length || 0;
  const creativeItemCount = contract.creativeAssets?.length || 0;
  const linenItemCount = contract.linenRequirements?.length || 0;
  const stockroomItemCount = contract.equipmentChecklist?.length || 0;
  const creativeSectionConfirmed = isSectionConfirmed('creative');
  const linenSectionConfirmed = isSectionConfirmed('linen');
  const stockroomSectionConfirmed = isSectionConfirmed('stockroom');
  const savedInventoryItemCount = (contract.creativeAssets?.length || 0)
    + (contract.linenRequirements?.length || 0)
    + (contract.equipmentChecklist?.length || 0);
  const buildFallbackInventoryItems = (
    sectionKey: InventorySectionKey,
    items: Array<any>,
    itemNameKey: 'item' | 'type',
  ): InventorySummaryItem[] => items.map((item) => ({
    sectionKey,
    itemId: item.itemId || null,
    itemName: item[itemNameKey] || 'Inventory item',
    itemCode: item.itemCode || '',
    category: item.category || '',
    requestedQuantity: Number(item.quantity) || 0,
    availableQuantity: null,
    reservedOnDate: 0,
    inventoryStatus: 'unavailable',
    itemStatus: item.status || 'pending',
    postEventStatus: item.postEventStatus || 'pending_check',
    postEventNotes: item.postEventNotes || '',
    enoughStock: false,
    shortageQuantity: 0,
    sameDayConflict: false,
    requestAction: '',
    readyForDispatch: item.status === 'prepared',
    imageUrl: item.imageUrl || '',
    notes: item.notes || '',
    blockers: operationsSummary ? [] : ['Automated inventory availability checks are unavailable right now.'],
  }));
  const creativeItems = (operationsSummary?.inventory.creativeAssets || buildFallbackInventoryItems('creativeAssets', contract.creativeAssets || [], 'item')).map((item) => ({
    ...item,
    sectionKey: 'creativeAssets' as const,
  }));
  const linenItems = (operationsSummary?.inventory.linenRequirements || buildFallbackInventoryItems('linenRequirements', contract.linenRequirements || [], 'type')).map((item) => ({
    ...item,
    sectionKey: 'linenRequirements' as const,
  }));
  const stockroomItems = (operationsSummary?.inventory.equipmentChecklist || buildFallbackInventoryItems('equipmentChecklist', contract.equipmentChecklist || [], 'item')).map((item) => ({
    ...item,
    sectionKey: 'equipmentChecklist' as const,
  }));
  const canViewCreativeInventorySection = isAdmin() || isCreative() || isSales() || isPurchasing();
  const canViewLinenInventorySection = isAdmin() || isLinen() || isSales() || isPurchasing();
  const canViewStockroomInventorySection = isAdmin() || isLogistics() || isSales() || isPurchasing() || isStockroom();
  const visibleInventoryItems = [
    ...(canViewCreativeInventorySection ? creativeItems : []),
    ...(canViewLinenInventorySection ? linenItems : []),
    ...(canViewStockroomInventorySection ? stockroomItems : []),
  ];
  const visibleInventoryShortages = visibleInventoryItems.filter((item) => item.shortageQuantity > 0);
  const hasVisibleInventoryItems = visibleInventoryItems.length > 0;
  const canRenderSavedInventorySections = Boolean(operationsSummary) || savedInventoryItemCount > 0;
  const visibleInventoryItemsReady = hasVisibleInventoryItems
    ? visibleInventoryItems.every((item) => item.enoughStock && item.readyForDispatch && item.blockers.length === 0)
    : false;
  const visiblePendingPostEventChecks = visibleInventoryItems.filter((item) => (
    !isPostEventClosed(item.postEventStatus, item.itemStatus)
  )).length;
  const inventoryValidationItems: DepartmentReadiness[] = [
    creativeItemCount > 0 ? {
      key: 'creative',
      label: 'Creative Validation',
      status: creativeSectionConfirmed ? 'ready' : 'not_started',
      detail: creativeSectionConfirmed
        ? `${creativeItemCount} creative ${pluralize(creativeItemCount, 'item')} confirmed for the draft contract.`
        : `Creative still needs to confirm ${creativeItemCount} assigned ${pluralize(creativeItemCount, 'item')} before signature release.`,
    } : null,
    linenItemCount > 0 ? {
      key: 'linen',
      label: 'Linen Validation',
      status: linenSectionConfirmed ? 'ready' : 'not_started',
      detail: linenSectionConfirmed
        ? `${linenItemCount} linen ${pluralize(linenItemCount, 'item')} confirmed for the draft contract.`
        : `Linen still needs to confirm ${linenItemCount} assigned ${pluralize(linenItemCount, 'item')} before signature release.`,
    } : null,
    stockroomItemCount > 0 ? {
      key: 'stockroom',
      label: 'Stockroom Validation',
      status: stockroomSectionConfirmed ? 'ready' : 'not_started',
      detail: stockroomSectionConfirmed
        ? `${stockroomItemCount} stockroom ${pluralize(stockroomItemCount, 'item')} confirmed for the draft contract.`
        : `Stockroom still needs to confirm ${stockroomItemCount} assigned ${pluralize(stockroomItemCount, 'item')} before signature release.`,
    } : null,
  ].filter(Boolean) as DepartmentReadiness[];
  const paymentTermConfirmed = isSectionConfirmed('payments');
  const pendingInventoryValidationLabels = inventoryValidationItems
    .filter((item) => item.status !== 'ready')
    .map((item) => item.label);
  const paymentTermConfirmationLocked = isPreSignatureStage && pendingInventoryValidationLabels.length > 0;
  const paymentTermNeedsConfirmation = isPreSignatureStage && (
    paymentTermConfirmationLocked
    || !paymentTermConfirmed
    || pendingPaymentPlan !== savedPaymentPlan
  );
  const paymentTermStatusLabel = paymentTermConfirmationLocked
    ? 'Waiting On Inventory'
    : !paymentTermNeedsConfirmation && paymentTermConfirmed
      ? 'Confirmed'
      : 'Pending Confirmation';
  const paymentTermStatusClassName = paymentTermConfirmationLocked
    ? READINESS_STATUS_META.blocked.badgeClassName
    : !paymentTermNeedsConfirmation && paymentTermConfirmed
      ? READINESS_STATUS_META.ready.badgeClassName
      : READINESS_STATUS_META.not_started.badgeClassName;
  const paymentTermLockMessage = paymentTermConfirmationLocked
    ? `Confirm ${pendingInventoryValidationLabels.join(', ')} first. Inventory changes can still affect the final contract value.`
    : '';
  const canManagePayments = isAccounting() || isAdmin();
  const canPostPayments = canManagePayments && contract.clientSigned && contract.status !== 'completed';
  const canConfigurePaymentPlan = (
    (contract.status === 'draft' && (isAdmin() || isSales()))
    || (contract.status === 'pending_client_signature' && isAdmin())
  );
  const showPaymentPlanning = !['approved', 'completed'].includes(contract.status);
  const isContractClosed = contract.status === 'completed';
  const eventEndDate = new Date(contract.eventDate);
  eventEndDate.setHours(23, 59, 59, 999);
  const eventHasPassed = new Date() > eventEndDate;
  const canCreateCreativeProcurementRequest = !eventHasPassed && !isContractClosed && (isCreative() || isSales() || isPurchasing() || isAdmin());
  const canCreateLinenProcurementRequest = !eventHasPassed && !isContractClosed && (isLinen() || isSales() || isPurchasing() || isAdmin());
  const canCreateStockroomProcurementRequest = !eventHasPassed && !isContractClosed && (isLogistics() || isSales() || isPurchasing() || isStockroom() || isAdmin());
  const logisticsBooked = Boolean(
    contract.logisticsAssignment?.truck
    || contract.logisticsAssignment?.driver
    || ((contract.logisticsAssignment?.assignmentStatus || 'pending') !== 'pending')
  );
  const logisticsClosedOut = !logisticsBooked || contract.logisticsAssignment?.assignmentStatus === 'completed';
  const creativeReturnsRemaining = (contract.creativeAssets || []).filter(item => !isPostEventClosed(item.postEventStatus, item.status)).length;
  const linenReturnsRemaining = (contract.linenRequirements || []).filter(item => !isPostEventClosed(item.postEventStatus, item.status)).length;
  const stockroomReturnsRemaining = (contract.equipmentChecklist || []).filter(item => !isPostEventClosed(item.postEventStatus, item.status)).length;
  const closureIssues: string[] = [];

  if (!eventHasPassed) {
    closureIssues.push('Available only after the event date has passed.');
  }

  if (!fullyPaid) {
    closureIssues.push(`Outstanding balance of ${formatCurrency(remainingBalance)} must be settled.`);
  }

  if (!logisticsClosedOut) {
    closureIssues.push('Logistics booking must be marked completed.');
  }

  if (creativeReturnsRemaining > 0) {
    closureIssues.push(`${creativeReturnsRemaining} creative item(s) still need post-event checking.`);
  }

  if (linenReturnsRemaining > 0) {
    closureIssues.push(`${linenReturnsRemaining} linen item(s) still need post-event checking.`);
  }

  if (stockroomReturnsRemaining > 0) {
    closureIssues.push(`${stockroomReturnsRemaining} stockroom item(s) still need post-event checking.`);
  }

  const canShowCloseContractAction = contract.status === 'approved' && canManagePayments;
  const canCloseContract = canShowCloseContractAction && closureIssues.length === 0;

  const buildInventoryReadiness = (
    key: string,
    label: string,
    items: InventorySummaryItem[],
    itemCount: number,
    fallbackProgress: number,
    emptyDetail: string
  ): DepartmentReadiness => {
    if (!itemCount) {
      return {
        key,
        label,
        status: 'ready',
        detail: emptyDetail,
      };
    }

    if (isOperationsLoading) {
      return {
        key,
        label,
        status: fallbackProgress > 0 ? 'in_progress' : 'not_started',
        detail: 'Loading automated stock and same-day conflict checks...',
      };
    }

    if (!operationsSummary) {
      if (fallbackProgress >= 100) {
        return {
          key,
          label,
          status: 'ready',
          detail: 'Manual checklist updates were already completed for this department.',
        };
      }

      if (itemCount > 0 || fallbackProgress > 0) {
        return {
          key,
          label,
          status: 'in_progress',
          detail: `Saved ${itemCount} ${pluralize(itemCount, 'item')}. Automated availability checks are unavailable right now.`,
        };
      }

      return {
        key,
        label,
        status: 'ready',
        detail: emptyDetail,
      };
    }

    if (!items.length) {
      return {
        key,
        label,
        status: 'ready',
        detail: emptyDetail,
      };
    }

    const readyCount = items.filter(item => item.readyForDispatch).length;
    const blockerCount = items.filter(item => item.blockers.length > 0).length;
    const shortageCount = items.filter(item => !item.enoughStock).length;
    const requestCount = items.filter(item => item.shortageQuantity > 0).length;

    if (readyCount === items.length) {
      return {
        key,
        label,
        status: 'ready',
        detail: `All ${items.length} ${pluralize(items.length, 'item')} are stocked and marked ready for dispatch.`,
      };
    }

    if (blockerCount > 0 || shortageCount > 0) {
      const issueParts = [];
      if (shortageCount > 0) {
        issueParts.push(`${shortageCount} stock ${pluralize(shortageCount, 'shortage')}`);
      }
      if (blockerCount > 0) {
        issueParts.push(`${blockerCount} ${pluralize(blockerCount, 'checklist blocker')}`);
      }

      return {
        key,
        label,
        status: 'blocked',
        detail: `${issueParts.join(' and ')} need attention before release.${requestCount > 0 ? ' Request purchasing or rental for the shortage items.' : ''}`,
      };
    }

    if (readyCount > 0 || fallbackProgress > 0) {
      return {
        key,
        label,
        status: 'in_progress',
        detail: `${readyCount} of ${items.length} ${pluralize(items.length, 'item')} are ready for dispatch.`,
      };
    }

    return {
      key,
      label,
      status: 'not_started',
      detail: `${items.length} ${pluralize(items.length, 'item')} are saved but still waiting for prep updates.`,
    };
  };

  const buildPostEventInventoryReadiness = (
    key: string,
    label: string,
    items: Array<{ postEventStatus?: string; itemStatus?: string; status?: string }>,
    emptyDetail: string
  ): DepartmentReadiness => {
    if (!items.length) {
      return {
        key,
        label,
        status: 'ready',
        detail: emptyDetail,
      };
    }

    const completedCount = items.filter((item) => (
      isPostEventClosed(item.postEventStatus, item.itemStatus || item.status)
    )).length;

    if (completedCount === items.length) {
      return {
        key,
        label,
        status: 'ready',
        detail: `All ${items.length} ${pluralize(items.length, 'item')} completed post-event checks.`,
      };
    }

    if (completedCount > 0) {
      return {
        key,
        label,
        status: 'in_progress',
        detail: `${completedCount} of ${items.length} ${pluralize(items.length, 'item')} completed post-event checks.`,
      };
    }

    return {
      key,
      label,
      status: 'not_started',
      detail: `${items.length} ${pluralize(items.length, 'item')} are still waiting for post-event checking.`,
    };
  };

  const kitchenReadiness: DepartmentReadiness = (() => {
    if (!menuItemCount) {
      return {
        key: 'kitchen',
        label: 'Kitchen',
        status: 'not_started',
        detail: 'No menu items are attached to this contract yet.',
      };
    }

    if (!['approved', 'completed'].includes(contract.status)) {
      return {
        key: 'kitchen',
        label: 'Kitchen',
        status: confirmedMenuCount > 0 ? 'in_progress' : 'not_started',
        detail: `${confirmedMenuCount} of ${menuItemCount} menu ${pluralize(menuItemCount, 'item')} confirmed. Kitchen prep starts after approval.`,
      };
    }

    if ((contract.ingredientStatus || 'pending') === 'prepared' && confirmedMenuCount === menuItemCount) {
      return {
        key: 'kitchen',
        label: 'Kitchen',
        status: 'ready',
        detail: `All menu items are confirmed and ingredient status is ${formatEnumLabel(contract.ingredientStatus)}.`,
      };
    }

    if ((contract.ingredientStatus || 'pending') === 'procured' || confirmedMenuCount > 0) {
      return {
        key: 'kitchen',
        label: 'Kitchen',
        status: 'in_progress',
        detail: `${confirmedMenuCount} of ${menuItemCount} menu ${pluralize(menuItemCount, 'item')} confirmed. Ingredient status is ${formatEnumLabel(contract.ingredientStatus)}.`,
      };
    }

    return {
      key: 'kitchen',
      label: 'Kitchen',
      status: 'not_started',
      detail: `Kitchen prep is still pending. Ingredient status is ${formatEnumLabel(contract.ingredientStatus)}.`,
    };
  })();

  const logisticsReadiness: DepartmentReadiness = (() => {
    const savedTruck = contract.logisticsAssignment?.truck;
    const savedDriver = contract.logisticsAssignment?.driver;
    const currentStatus = operationsSummary?.logistics.assignmentStatus
      || contract.logisticsAssignment?.assignmentStatus
      || 'pending';

    if (isOperationsLoading) {
      return {
        key: 'logistics',
        label: 'Logistics',
        status: contract.departmentProgress?.logistics > 0 ? 'in_progress' : 'not_started',
        detail: 'Loading driver, truck, and same-day dispatch availability...',
      };
    }

    if (!operationsSummary) {
      if (savedTruck || savedDriver || contract.departmentProgress?.logistics > 0) {
        return {
          key: 'logistics',
          label: 'Logistics',
          status: 'in_progress',
          detail: `Saved booking status is ${getLogisticsStatusLabel(currentStatus)}. Automated conflict checks are unavailable right now.`,
        };
      }

      return {
        key: 'logistics',
        label: 'Logistics',
        status: 'not_started',
        detail: 'No truck or driver booking has been saved yet.',
      };
    }

    if (operationsSummary.logistics.blockers.length > 0) {
      return {
        key: 'logistics',
        label: 'Logistics',
        status: 'blocked',
        detail: operationsSummary.logistics.blockers.join(' '),
      };
    }

    if (
      ['ready_for_dispatch', 'dispatched', 'completed'].includes(currentStatus)
      && contract.logisticsAssignment?.truck
    ) {
      return {
        key: 'logistics',
        label: 'Logistics',
        status: 'ready',
        detail: `Truck booking is ${getLogisticsStatusLabel(currentStatus)} for the event date.`,
      };
    }

    if (
      contract.logisticsAssignment?.truck
      || contract.logisticsAssignment?.driver
      || ['scheduled', 'ready_for_dispatch'].includes(currentStatus)
    ) {
      return {
        key: 'logistics',
        label: 'Logistics',
        status: 'in_progress',
        detail: `Booking status is ${getLogisticsStatusLabel(currentStatus)} with same-day conflict checks applied.`,
      };
    }

    return {
      key: 'logistics',
      label: 'Logistics',
      status: 'not_started',
      detail: 'No truck or driver booking has been saved yet.',
    };
  })();

  const banquetReadiness: DepartmentReadiness = (() => {
    const savedSupervisor = contract.assignedSupervisor?.name || '';
    const savedPlanTotal = getBanquetPlanTotal(contract.banquetAssignment?.staffingPlan);
    const savedAssignedCount = (contract.banquetAssignment?.assignments || []).length;

    if (isOperationsLoading) {
      return {
        key: 'banquet',
        label: 'Banquet',
        status: savedPlanTotal > 0 || savedAssignedCount > 0 || savedSupervisor ? 'in_progress' : 'not_started',
        detail: 'Loading banquet staffing coverage and same-day availability...',
      };
    }

    if (!banquetSummary) {
      if (savedPlanTotal > 0 || savedAssignedCount > 0 || savedSupervisor) {
        return {
          key: 'banquet',
          label: 'Banquet',
          status: 'in_progress',
          detail: 'A saved banquet team exists, but automated staffing coverage checks are unavailable right now.',
        };
      }

      return {
        key: 'banquet',
        label: 'Banquet',
        status: 'not_started',
        detail: 'No banquet supervisor or staffing plan has been saved yet.',
      };
    }

    if (banquetSummary.blockers.length > 0) {
      return {
        key: 'banquet',
        label: 'Banquet',
        status: 'blocked',
        detail: banquetSummary.blockers.join(' '),
      };
    }

    if (
      banquetSummary.selectedSupervisorId
      && banquetSummary.coverage.planned > 0
      && banquetSummary.coverage.assigned >= banquetSummary.coverage.planned
    ) {
      return {
        key: 'banquet',
        label: 'Banquet',
        status: 'ready',
        detail: `${banquetSummary.coverage.assigned} banquet staff assigned across ${banquetSummary.coverage.planned} planned positions.`,
      };
    }

    if (
      banquetSummary.selectedSupervisorId
      || banquetSummary.coverage.planned > 0
      || banquetSummary.selectedAssignments.length > 0
    ) {
      return {
        key: 'banquet',
        label: 'Banquet',
        status: 'in_progress',
        detail: `${banquetSummary.coverage.assigned} assigned of ${banquetSummary.coverage.planned} planned banquet position(s).`,
      };
    }

    return {
      key: 'banquet',
      label: 'Banquet',
      status: 'not_started',
      detail: 'No banquet supervisor or staffing plan has been saved yet.',
    };
  })();

  const creativeReadiness = buildInventoryReadiness(
    'creative',
    'Creative',
    creativeItems,
    contract.creativeAssets?.length || 0,
    contract.departmentProgress?.creative || 0,
    'No creative setup items are required for this contract.'
  );

  const linenReadiness = buildInventoryReadiness(
    'linen',
    'Linen',
    linenItems,
    contract.linenRequirements?.length || 0,
    contract.departmentProgress?.linen || 0,
    'No linen items are required for this contract.'
  );
  const stockroomReadiness = buildInventoryReadiness(
    'stockroom',
    'Stockroom',
    stockroomItems,
    contract.equipmentChecklist?.length || 0,
    0,
    'No stockroom items are required for this contract.'
  );
  const hasCreativeReadinessItems = (contract.creativeAssets?.length || 0) > 0;
  const hasLinenReadinessItems = (contract.linenRequirements?.length || 0) > 0;
  const hasStockroomReadinessItems = (contract.equipmentChecklist?.length || 0) > 0;

  const creativePostEventItems = creativeItems.length > 0
    ? creativeItems.map((item) => ({ postEventStatus: item.postEventStatus, itemStatus: item.itemStatus }))
    : (contract.creativeAssets || []).map((item) => ({ postEventStatus: item.postEventStatus, status: item.status }));
  const linenPostEventItems = linenItems.length > 0
    ? linenItems.map((item) => ({ postEventStatus: item.postEventStatus, itemStatus: item.itemStatus }))
    : (contract.linenRequirements || []).map((item) => ({ postEventStatus: item.postEventStatus, status: item.status }));
  const stockroomPostEventItems = stockroomItems.length > 0
    ? stockroomItems.map((item) => ({ postEventStatus: item.postEventStatus, itemStatus: item.itemStatus }))
    : (contract.equipmentChecklist || []).map((item) => ({ postEventStatus: item.postEventStatus, status: item.status }));

  const postEventCreativeReadiness = buildPostEventInventoryReadiness(
    'creative-post-event',
    'Creative',
    creativePostEventItems,
    'No creative items need post-event checking for this contract.'
  );
  const postEventLinenReadiness = buildPostEventInventoryReadiness(
    'linen-post-event',
    'Linen',
    linenPostEventItems,
    'No linen items need post-event checking for this contract.'
  );
  const postEventStockroomReadiness = buildPostEventInventoryReadiness(
    'stockroom-post-event',
    'Stockroom',
    stockroomPostEventItems,
    'No stockroom items need post-event checking for this contract.'
  );
  const postEventLogisticsReadiness: DepartmentReadiness = (() => {
    const currentStatus = operationsSummary?.logistics.assignmentStatus
      || contract.logisticsAssignment?.assignmentStatus
      || 'pending';

    if (!logisticsBooked) {
      return {
        key: 'logistics-post-event',
        label: 'Logistics',
        status: 'ready',
        detail: 'No logistics closeout is needed for this contract.',
      };
    }

    if (currentStatus === 'completed') {
      return {
        key: 'logistics-post-event',
        label: 'Logistics',
        status: 'ready',
        detail: 'Transport closeout is already completed.',
      };
    }

    if (currentStatus === 'dispatched') {
      return {
        key: 'logistics-post-event',
        label: 'Logistics',
        status: 'in_progress',
        detail: 'Dispatch was recorded. Mark logistics completed after the truck returns.',
      };
    }

    return {
      key: 'logistics-post-event',
      label: 'Logistics',
      status: 'blocked',
      detail: `Transport closeout is still open. Current status is ${getLogisticsStatusLabel(currentStatus)}.`,
    };
  })();

  const preparationReadinessItems: DepartmentReadiness[] = [
    kitchenReadiness,
    banquetReadiness,
    logisticsReadiness,
    ...(hasCreativeReadinessItems ? [creativeReadiness] : []),
    ...(hasLinenReadinessItems ? [linenReadiness] : []),
    ...(hasStockroomReadinessItems ? [stockroomReadiness] : []),
  ];
  const postEventProgressItems: DepartmentReadiness[] = [
    postEventLogisticsReadiness,
    postEventCreativeReadiness,
    postEventLinenReadiness,
    postEventStockroomReadiness,
  ];

  const readinessCounts = preparationReadinessItems.reduce<Record<ReadinessStatus, number>>((counts, item) => {
    counts[item.status] += 1;
    return counts;
  }, {
    ready: 0,
    in_progress: 0,
    blocked: 0,
    not_started: 0,
  });

  const overallReadinessStatus: ReadinessStatus = readinessCounts.blocked > 0
    ? 'blocked'
    : readinessCounts.ready === preparationReadinessItems.length
      ? 'ready'
      : readinessCounts.in_progress > 0 || readinessCounts.ready > 0
        ? 'in_progress'
        : 'not_started';

  const overallReadinessDetail = overallReadinessStatus === 'ready'
    ? 'All departments are currently event-ready.'
    : overallReadinessStatus === 'blocked'
      ? `${readinessCounts.blocked} department ${pluralize(readinessCounts.blocked, 'issue')} need attention before the event is fully ready.`
      : overallReadinessStatus === 'in_progress'
        ? `${readinessCounts.ready} ready, ${readinessCounts.in_progress} in progress, ${readinessCounts.not_started} not started.`
        : 'Department work has not started yet.';
  const readinessProgressValue = Math.round((readinessCounts.ready / preparationReadinessItems.length) * 100);
  const blockedDepartmentLabels = preparationReadinessItems.filter((item) => item.status === 'blocked').map((item) => item.label);
  const activeDepartmentLabels = preparationReadinessItems
    .filter((item) => item.status === 'in_progress' || item.status === 'not_started')
    .map((item) => item.label);
  const readinessSummary = blockedDepartmentLabels.length > 0
    ? `Needs attention: ${blockedDepartmentLabels.join(', ')}.`
    : activeDepartmentLabels.length > 0
      ? `Still working on: ${activeDepartmentLabels.join(', ')}.`
      : 'Everything is marked ready.';
  const showPreparationReadiness = ['approved', 'completed'].includes(contract.status);
  const showPostEventProgress = showPreparationReadiness && eventHasPassed;
  const postEventCounts = postEventProgressItems.reduce<Record<ReadinessStatus, number>>((counts, item) => {
    counts[item.status] += 1;
    return counts;
  }, {
    ready: 0,
    in_progress: 0,
    blocked: 0,
    not_started: 0,
  });
  const postEventOverallStatus: ReadinessStatus = postEventCounts.blocked > 0
    ? 'blocked'
    : postEventCounts.ready === postEventProgressItems.length
      ? 'ready'
      : postEventCounts.in_progress > 0 || postEventCounts.ready > 0
        ? 'in_progress'
        : 'not_started';
  const postEventOverallDetail = postEventOverallStatus === 'ready'
    ? 'All post-event department checks are complete.'
    : postEventOverallStatus === 'blocked'
      ? `${postEventCounts.blocked} department ${pluralize(postEventCounts.blocked, 'issue')} still need closeout attention.`
      : postEventOverallStatus === 'in_progress'
        ? `${postEventCounts.ready} ready, ${postEventCounts.in_progress} in progress, ${postEventCounts.not_started} not started.`
        : 'Post-event closeout has not started yet.';
  const postEventProgressValue = Math.round((postEventCounts.ready / postEventProgressItems.length) * 100);
  const blockedPostEventLabels = postEventProgressItems.filter((item) => item.status === 'blocked').map((item) => item.label);
  const activePostEventLabels = postEventProgressItems
    .filter((item) => item.status === 'in_progress' || item.status === 'not_started')
    .map((item) => item.label);
  const postEventSummary = blockedPostEventLabels.length > 0
    ? `Needs closeout: ${blockedPostEventLabels.join(', ')}.`
    : activePostEventLabels.length > 0
      ? `Still checking: ${activePostEventLabels.join(', ')}.`
      : 'All post-event checks are complete.';
  const detailsReady = Boolean(
    contract.clientName
    && contract.clientContact
    && contract.clientEmail
    && contract.eventDate
    && contract.venue?.name
    && contract.venue?.address
  );
  const menuReady = menuItemCount > 0;
  const finalizationItems: DepartmentReadiness[] = [
    {
      key: 'details',
      label: 'Details',
      status: detailsReady ? 'ready' : 'not_started',
      detail: detailsReady
        ? 'Client and event details are ready for the contract.'
        : 'Complete the client and event details before sending for signature.',
    },
    {
      key: 'menu',
      label: 'Menu',
      status: menuReady ? 'ready' : 'not_started',
      detail: menuReady
        ? `${menuItemCount} menu ${pluralize(menuItemCount, 'item')} included in the contract.`
        : 'Add the agreed menu items before sending for signature.',
    },
    ...inventoryValidationItems,
    {
      key: 'payments',
      label: isPreSignatureStage ? 'Payment Term' : 'Payment Received',
      status: isPreSignatureStage
        ? !paymentTermNeedsConfirmation && paymentTermConfirmed
          ? 'ready'
          : 'not_started'
        : paymentRequirementMet
          ? 'ready'
          : totalPaid > 0
            ? 'in_progress'
            : contract.clientSigned
              ? 'blocked'
              : 'not_started',
      detail: isPreSignatureStage
        ? paymentTermConfirmationLocked
          ? `${paymentTermLockMessage} Payment confirmation should happen after inventory validation is complete.`
          : !paymentTermNeedsConfirmation && paymentTermConfirmed
            ? `${paymentPlanLabel} confirmed for the contract.`
            : 'Sales still needs to confirm the agreed payment term.'
        : !contract.clientSigned
          ? 'Payment collection starts after the client signs the contract.'
          : fullyPaid
          ? `Fully paid at ${formatCurrency(totalPaid)}`
          : paymentHoldActive
            ? `${formatCurrency(remainingBalance)} is overdue since ${finalBalanceDueDate.toLocaleDateString()}. Full payment is now required.`
            : paymentRequirementMet
              ? fullPaymentPlan
                ? `${formatCurrency(totalPaid)} received. Full payment target met.`
                : `${formatCurrency(totalPaid)} received. Initial payment target met.`
              : fullPaymentPlan
                ? `${formatCurrency(paymentRequirementRemaining)} still needed to complete the full payment requirement.`
                : `${formatCurrency(paymentRequirementRemaining)} still needed to reach the ${downPaymentPercent}% payment requirement.`,
    },
    {
      key: 'signature',
      label: 'Client Signed',
      status: contract.clientSigned
        ? 'ready'
        : contract.status === 'pending_client_signature'
          ? 'in_progress'
          : 'not_started',
      detail: contract.clientSignedAt
        ? `Signed on ${new Date(contract.clientSignedAt).toLocaleDateString()}`
        : 'Waiting for signed contract',
    },
    {
      key: 'approval',
      label: 'Accounting Approved',
      status: ['approved', 'completed'].includes(contract.status)
        ? 'ready'
        : paymentHoldActive
          ? 'blocked'
          : contract.status === 'accounting_review' || (contract.status === 'submitted' && paymentRequirementMet)
          ? 'in_progress'
          : 'not_started',
      detail: ['approved', 'completed'].includes(contract.status)
        ? 'Contract is approved for preparation'
        : paymentHoldActive
          ? 'Full payment must be posted before the event can proceed.'
          : 'Waiting for accounting approval',
    },
  ];
  const completedFinalizationCount = finalizationItems.filter((item) => item.status === 'ready').length;
  const finalizationProgressValue = Math.round((completedFinalizationCount / finalizationItems.length) * 100);
  const preSignatureItems = finalizationItems.filter((item) => !['signature', 'approval'].includes(item.key));
  const pendingPreSignatureLabels = preSignatureItems
    .filter((item) => item.status !== 'ready')
    .map((item) => item.label);
  const allPreSignatureSectionsReady = pendingPreSignatureLabels.length === 0;
  const finalizationStatusLabel = contract.status === 'draft'
    ? allPreSignatureSectionsReady ? 'Ready To Send' : 'Draft'
    : contract.status === 'pending_client_signature'
      ? 'Awaiting Client Signature'
      : contract.status === 'submitted'
        ? paymentHoldActive ? 'Payment Hold' : paymentRequirementMet ? 'Awaiting Accounting Approval' : 'Awaiting Payment'
        : contract.status === 'accounting_review'
          ? paymentHoldActive ? 'Payment Hold' : 'In Accounting Review'
        : 'Finalized';
  const finalizationStatusClassName = contract.status === 'draft'
    ? allPreSignatureSectionsReady ? READINESS_STATUS_META.in_progress.badgeClassName : READINESS_STATUS_META.not_started.badgeClassName
    : contract.status === 'pending_client_signature'
      ? READINESS_STATUS_META.in_progress.badgeClassName
    : contract.status === 'submitted'
        ? paymentRequirementMet ? READINESS_STATUS_META.in_progress.badgeClassName : READINESS_STATUS_META.blocked.badgeClassName
      : contract.status === 'accounting_review'
        ? paymentHoldActive ? READINESS_STATUS_META.blocked.badgeClassName : READINESS_STATUS_META.in_progress.badgeClassName
        : READINESS_STATUS_META.ready.badgeClassName;
  const finalizationSummary = contract.status === 'draft'
    ? pendingPreSignatureLabels.length > 0
      ? `Confirm these sections before sending for signature: ${pendingPreSignatureLabels.join(', ')}.`
      : 'Every required section is confirmed and the contract is ready to send for signature.'
    : contract.status === 'pending_client_signature'
      ? 'The contract is finalized and waiting for the client signature before internal approval can continue.'
    : contract.status === 'submitted'
        ? paymentHoldActive
          ? `The remaining balance was due on ${finalBalanceDueDate.toLocaleDateString()}. The event is on payment hold until full payment is posted.`
          : paymentRequirementMet
          ? 'The client has signed and the payment requirement is met. Accounting can now approve this contract for preparation.'
          : fullPaymentPlan
            ? `The client has signed, but the full payment of ${formatCurrency(requiredDownPayment)} must be posted before preparation can be approved.`
            : `The client has signed, but at least the required ${downPaymentPercent}% payment (${formatCurrency(requiredDownPayment)}) must be posted before preparation can be approved.`
        : contract.status === 'accounting_review'
          ? paymentHoldActive
            ? `The remaining balance was due on ${finalBalanceDueDate.toLocaleDateString()}. The event is on payment hold until full payment is posted.`
            : 'Accounting is reviewing the signed contract before preparation can begin.'
        : 'The contract is finalized and approved for preparation.';
  const logisticsSummary = operationsSummary?.logistics || null;
  const savedLogisticsDriver = contract.logisticsAssignment?.driver || null;
  const savedLogisticsTruck = contract.logisticsAssignment?.truck || null;
  const logisticsDriverOptions = logisticsSummary
    ? [
        ...(
          savedLogisticsDriver
          && !logisticsSummary.availableDrivers.some((driver) => driver._id === savedLogisticsDriver._id)
            ? [{
                _id: savedLogisticsDriver._id,
                driverId: savedLogisticsDriver.driverId,
                fullName: savedLogisticsDriver.fullName,
                phone: savedLogisticsDriver.phone,
                status: savedLogisticsDriver.status || 'assigned_to_this_event',
              }]
            : []
        ),
        ...logisticsSummary.availableDrivers,
      ]
    : savedLogisticsDriver
      ? [{
          _id: savedLogisticsDriver._id,
          driverId: savedLogisticsDriver.driverId,
          fullName: savedLogisticsDriver.fullName,
          phone: savedLogisticsDriver.phone,
          status: savedLogisticsDriver.status || 'assigned_to_this_event',
        }]
      : [];
  const logisticsTruckOptions = logisticsSummary
    ? [
        ...(
          savedLogisticsTruck
          && !logisticsSummary.availableTrucks.some((truck) => truck._id === savedLogisticsTruck._id)
            ? [{
                _id: savedLogisticsTruck._id,
                truckId: savedLogisticsTruck.truckId,
                plateNumber: savedLogisticsTruck.plateNumber,
                truckType: savedLogisticsTruck.truckType,
                status: savedLogisticsTruck.status || 'assigned_to_this_event',
                capacityVolume: savedLogisticsTruck.capacity?.volume || 0,
                assignedDriver: savedLogisticsDriver
                  ? {
                      _id: savedLogisticsDriver._id,
                      fullName: savedLogisticsDriver.fullName,
                      driverId: savedLogisticsDriver.driverId,
                    }
                  : null,
              }]
            : []
        ),
        ...logisticsSummary.availableTrucks,
      ]
    : savedLogisticsTruck
      ? [{
          _id: savedLogisticsTruck._id,
          truckId: savedLogisticsTruck.truckId,
          plateNumber: savedLogisticsTruck.plateNumber,
          truckType: savedLogisticsTruck.truckType,
          status: savedLogisticsTruck.status || 'assigned_to_this_event',
          capacityVolume: savedLogisticsTruck.capacity?.volume || 0,
          assignedDriver: savedLogisticsDriver
            ? {
                _id: savedLogisticsDriver._id,
                fullName: savedLogisticsDriver.fullName,
                driverId: savedLogisticsDriver.driverId,
              }
            : null,
        }]
      : [];
  const selectedLogisticsDriver = logisticsDriverOptions.find((driver) => driver._id === logisticsAssignment.driverId)
    || (savedLogisticsDriver && savedLogisticsDriver._id === logisticsAssignment.driverId ? {
      _id: savedLogisticsDriver._id,
      driverId: savedLogisticsDriver.driverId,
      fullName: savedLogisticsDriver.fullName,
      phone: savedLogisticsDriver.phone,
      status: savedLogisticsDriver.status || 'assigned_to_this_event',
    } : null);
  const selectedLogisticsTruck = logisticsTruckOptions.find((truck) => truck._id === logisticsAssignment.truckId)
    || (savedLogisticsTruck && savedLogisticsTruck._id === logisticsAssignment.truckId ? {
      _id: savedLogisticsTruck._id,
      truckId: savedLogisticsTruck.truckId,
      plateNumber: savedLogisticsTruck.plateNumber,
      truckType: savedLogisticsTruck.truckType,
      status: savedLogisticsTruck.status || 'assigned_to_this_event',
      capacityVolume: savedLogisticsTruck.capacity?.volume || 0,
      assignedDriver: savedLogisticsDriver
        ? {
            _id: savedLogisticsDriver._id,
            fullName: savedLogisticsDriver.fullName,
            driverId: savedLogisticsDriver.driverId,
          }
        : null,
    } : null);
  const savedLogisticsStatus = logisticsSummary?.assignmentStatus
    || contract.logisticsAssignment?.assignmentStatus
    || 'pending';
  const logisticsStatusValue = resolveLogisticsAssignmentStatus(logisticsAssignment);
  const logisticsStatusWillChange = savedLogisticsStatus !== logisticsStatusValue;
  const canMarkLogisticsDispatched = !logisticsStatusWillChange && logisticsStatusValue === 'ready_for_dispatch';
  const logisticsCompletionWaitsForPostEvent = !logisticsStatusWillChange && logisticsStatusValue === 'dispatched' && !eventHasPassed;
  const canMarkLogisticsCompleted = !logisticsStatusWillChange && logisticsStatusValue === 'dispatched' && eventHasPassed;
  const logisticsAutoSaveMessage = !logisticsAssignment.truckId
    ? {
        label: 'No Truck Booked Yet',
        className: 'border-amber-200 bg-amber-50 text-amber-900',
        note: 'Choose a truck to create or update the logistics booking for this event.',
      }
    : logisticsAutoSaveState === 'saving'
      ? {
          label: 'Saving Changes...',
          className: 'border-blue-200 bg-blue-50 text-blue-800',
          note: 'Truck and driver changes are being saved automatically.',
        }
      : logisticsAutoSaveState === 'error'
        ? {
            label: 'Auto-Save Failed',
            className: 'border-red-200 bg-red-50 text-red-800',
            note: logisticsAutoSaveErrorMessage || 'The latest booking change did not save. Try changing the truck or driver again.',
          }
        : {
            label: 'All Changes Saved',
            className: 'border-green-200 bg-green-50 text-green-800',
            note: `${logisticsTruckOptions.length} truck option(s) and ${logisticsDriverOptions.length} driver option(s) are currently available for this event date.`,
          };

  const logisticsNextAction = canMarkLogisticsDispatched
    ? {
        label: 'Mark Dispatched',
        note: 'Use this once the booked truck and driver are already leaving for the event venue.',
        onClick: () => handleAdvanceLogisticsAssignment('dispatched'),
      }
    : canMarkLogisticsCompleted
      ? {
          label: 'Mark Completed',
          note: 'Use this after the truck returns and logistics closeout for the event is done.',
          onClick: () => handleAdvanceLogisticsAssignment('completed'),
        }
      : null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{contract.contractNumber}</h1>
                <Badge className={getStatusColor(contract.status)}>
                  {formatStatusLabel(contract.status)}
                </Badge>
                {contract.clientSigned && (
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
                    Client Signed
                  </Badge>
                )}
                {contract.completedAt && (
                  <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-800">
                    Closed {new Date(contract.completedAt).toLocaleDateString()}
                  </Badge>
                )}
                {contract.slaWarning && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    SLA Warning
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{contract.clientName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!useRestrictedDepartmentContractView ? (
              <>
                <Button variant="outline" onClick={handleExportPdf}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={() => handlePrintSection(activeTab)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print {SECTION_PRINT_LABELS[activeTab] || 'Section'}
                </Button>
              </>
            ) : null}
            
            {contract.status === 'draft' && (canEditDraftSalesContract || canEditDraftAnyInventorySection) && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate(
                    canEditDraftSalesContract
                      ? `/contracts/edit/${id}`
                      : `/contracts/edit/${id}?tab=addons`
                  )}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {canEditDraftSalesContract ? 'Edit' : 'Update Inventory'}
                </Button>
                {(isSales() || isAdmin()) && (
                  <Button
                    onClick={() => setSignatureDialogOpen(true)}
                    disabled={!allPreSignatureSectionsReady}
                    title={!allPreSignatureSectionsReady ? `Still waiting on: ${pendingPreSignatureLabels.join(', ')}` : undefined}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send For Signature
                  </Button>
                )}
              </>
            )}

            {contract.status === 'pending_client_signature' && (isSales() || isAdmin()) && (
              <>
                <Button variant="outline" onClick={() => handleExportSignaturePacket('print')}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Signature Copy
                </Button>
                <Button variant="outline" onClick={() => openEsignDialog()}>
                  <FileDown className="mr-2 h-4 w-4" />
                  E-Sign PDF
                </Button>
                <Button onClick={handleMarkClientSigned}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Client Signed
                </Button>
              </>
            )}

            {contract.status === 'submitted' && (isAccounting() || isAdmin()) && (
              <Button onClick={handleApprove}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve For Preparation
              </Button>
            )}

            {canShowCloseContractAction && (
              <Button
                variant="outline"
                onClick={handleCloseContract}
                disabled={!canCloseContract || isClosingContract}
                title={!canCloseContract ? closureIssues[0] : undefined}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isClosingContract ? 'Closing...' : 'Close Contract'}
              </Button>
            )}

            {isAdmin() && contract && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Contract
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this contract?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes {contract.contractNumber || 'this contract'} and its saved workflow data. Only delete it if you are sure it should no longer appear in your records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Contract</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteContract}
                      disabled={isDeletingContract}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletingContract ? 'Deleting...' : 'Delete Contract'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Readiness */}
        {!useRestrictedDepartmentContractView ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <CardTitle>
                    {showPreparationReadiness
                      ? showPostEventProgress ? 'Post-Event Progress' : 'Preparation Readiness'
                      : 'Contract Progress'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {showPreparationReadiness
                      ? showPostEventProgress
                        ? 'Tracks return checks, logistics closeout, and incident follow-up after the event date.'
                        : 'Based on the saved contract plus automated same-day inventory and logistics checks.'
                      : 'Finalize the contract, collect the client signature, and release it to accounting before preparation begins.'}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={showPreparationReadiness
                    ? READINESS_STATUS_META[showPostEventProgress ? postEventOverallStatus : overallReadinessStatus].badgeClassName
                    : finalizationStatusClassName}
                >
                  {showPreparationReadiness
                    ? READINESS_STATUS_META[showPostEventProgress ? postEventOverallStatus : overallReadinessStatus].label
                    : finalizationStatusLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showPreparationReadiness ? (
                <>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {showPostEventProgress
                          ? `${postEventCounts.ready} of ${postEventProgressItems.length} closeout areas done`
                          : `${readinessCounts.ready} of ${preparationReadinessItems.length} departments ready`}
                      </span>
                      <span className="text-muted-foreground">{showPostEventProgress ? postEventProgressValue : readinessProgressValue}%</span>
                    </div>
                    <Progress value={showPostEventProgress ? postEventProgressValue : readinessProgressValue} className="h-3" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      {showPostEventProgress
                        ? `${postEventOverallDetail} ${postEventSummary}`
                        : `${overallReadinessDetail} ${readinessSummary}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(showPostEventProgress ? postEventProgressItems : preparationReadinessItems).map((item) => {
                      const statusMeta = READINESS_STATUS_META[item.status];

                      return (
                        <Badge
                          key={item.key}
                          variant="outline"
                          className={statusMeta.badgeClassName}
                        >
                          {item.label}: {statusMeta.label}
                        </Badge>
                      );
                    })}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {showPostEventProgress
                      ? 'Incident-reported items count as checked here, while the issue itself stays visible in the Incidents page for follow-up.'
                      : 'Creative, linen, stockroom, and logistics already include same-day stock reservations plus driver and truck conflict checks.'}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">{completedFinalizationCount} of {finalizationItems.length} final steps complete</span>
                      <span className="text-muted-foreground">{finalizationProgressValue}%</span>
                    </div>
                    <Progress value={finalizationProgressValue} className="h-3" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      {finalizationSummary}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {finalizationItems.map((item) => {
                      const statusMeta = READINESS_STATUS_META[item.status];

                      return (
                        <Badge
                          key={item.key}
                          variant="outline"
                          className={statusMeta.badgeClassName}
                        >
                          {item.label}: {statusMeta.label}
                        </Badge>
                      );
                    })}
                  </div>

                  <div className={`rounded-lg border px-4 py-3 text-sm ${fullPaymentPlan ? (fullyPaid ? 'border-green-200 bg-green-50 text-green-900' : 'border-slate-200 bg-slate-50 text-slate-700') : finalBalancePastDue ? 'border-red-200 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    {fullPaymentPlan ? (
                      <>
                        Remaining balance: <strong>{formatCurrency(remainingBalance)}</strong>.{' '}
                        {fullyPaid
                          ? 'This contract is already fully paid.'
                          : `Full payment must be settled by ${finalBalanceDueDate.toLocaleDateString()}.`}
                      </>
                    ) : (
                      <>
                        Remaining {finalPaymentPercent}% balance: <strong>{formatCurrency(remainingBalance)}</strong>{' '}
                        due on <strong>{finalBalanceDueDate.toLocaleDateString()}</strong>.
                        {fullyPaid ? ' This contract is already fully paid.' : finalBalancePastDue ? ' The final balance due date has already passed and the event is on payment hold.' : ''}
                      </>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            const next = new URLSearchParams(searchParams);
            if (value === 'details') {
              next.delete('tab');
            } else {
              next.set('tab', value);
            }
            setSearchParams(next, { replace: true });
          }}
          className="space-y-4"
        >
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {visibleTabs.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="min-w-[120px] flex-1 sm:flex-none">
                {TAB_LABELS[tab]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div data-print-section="details" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>{useBanquetFocusedContractView ? 'Event Details' : 'Contract Details Review'}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {isPreSignatureStage ? renderReferenceBadge() : null}
                    {!useBanquetFocusedContractView ? renderTabEditButton('client') : null}
                  </div>
                </CardHeader>
              </Card>
              <div className={`grid gap-4 ${useBanquetFocusedContractView ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2'}`}>
              {!useBanquetFocusedContractView ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Client Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{contract.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">{contract.clientType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact</span>
                      <span className="font-medium">{contract.clientContact || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{contract.clientEmail || '-'}</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Event Snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Client</span>
                      <span className="font-medium text-right">{contract.clientName}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Event Type</span>
                      <span className="font-medium capitalize text-right">{contract.clientType}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Package</span>
                      <span className="font-medium capitalize text-right">{contract.packageSelected}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Guest Packs</span>
                      <span className="font-medium text-right">{contract.totalPacks}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event Date</span>
                    <span className="font-medium">
                      {new Date(contract.eventDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Date</span>
                    <span className="font-medium">
                      {new Date(contract.bookingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Package</span>
                    <span className="font-medium capitalize">{contract.packageSelected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Packs</span>
                    <span className="font-medium">{contract.totalPacks}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className={useBanquetFocusedContractView ? 'xl:col-span-1' : 'md:col-span-2'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Venue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{contract.venue?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium">{contract.venue?.address || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact</span>
                    <span className="font-medium">{contract.venue?.contact || '-'}</span>
                  </div>
                  {contract.venue?.notes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Notes</span>
                      <span className="font-medium">{contract.venue.notes}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
            <div data-print-section="menu" className="space-y-4">
              <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Menu Items
                </CardTitle>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {isPreSignatureStage ? renderReferenceBadge() : null}
                  {renderTabEditButton('package')}
                </div>
              </CardHeader>
              <CardContent>
                {contract.menuDetails?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No menu items added</p>
                ) : (
                  <div className="space-y-3">
                    {contract.menuDetails?.map((item, index) => {
                      return (
                        <div
                          key={index}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="font-medium">{item.item}</p>
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm">Qty: {item.quantity}</span>
                              <Badge variant="outline" className="bg-slate-100 text-slate-700">
                                Included In Contract
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div data-print-section="inventory" className="space-y-4">
              {useInventoryFocusedContractView ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Inventory Review Context</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      This view is limited to inventory validation so your department can review, adjust, and confirm assigned items without exposing the rest of the contract.
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Event Date</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(contract.eventDate).toLocaleDateString()}</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Venue</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{contract.venue?.name || 'Not set'}</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Contract Stage</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatStatusLabel(contract.status)}</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Guest Packs</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{contract.totalPacks || 0}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
              {isOperationsLoading ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Loading automated inventory checks...
                </CardContent>
              </Card>
            ) : canRenderSavedInventorySections ? (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{eventHasPassed ? 'Inventory Post-Event Overview' : 'Inventory Readiness Overview'}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={
                        isContractClosed
                          ? 'bg-purple-100 text-purple-800'
                          : !hasVisibleInventoryItems
                            ? 'bg-slate-100 text-slate-700'
                            : eventHasPassed
                              ? visiblePendingPostEventChecks === 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                              : !canUpdatePreparation
                                ? 'bg-slate-100 text-slate-700'
                                : visibleInventoryItemsReady
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                      }>
                        {isContractClosed
                          ? 'Closed contract'
                          : !hasVisibleInventoryItems
                            ? 'No assigned items'
                            : eventHasPassed
                              ? visiblePendingPostEventChecks === 0 ? 'Post-event complete' : 'Post-event action needed'
                              : !canUpdatePreparation
                                ? 'Locked until approval'
                                : visibleInventoryItemsReady
                                  ? 'All items ready'
                                  : 'Action needed'}
                      </Badge>
                      {renderTabEditButton('addons', 'Edit Inventory Items', canEditDraftAnyInventorySection)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!operationsSummary ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Automated inventory checks are unavailable right now, but the saved contract inventory is still shown below so departments can continue draft validation and checklist review.
                      </div>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      {eventHasPassed
                        ? 'Post-event checking is active now. Review returned items, confirm the check, and report any missing, damaged, or wrong-quantity issue to incidents.'
                        : 'Pre-event preparation is active now. Use this checklist to get every assigned item stocked and ready before the event date.'}
                    </p>
                  </CardContent>
                </Card>

                {!eventHasPassed && visibleInventoryShortages.length > 0 ? (
                  <Card className="border-red-200 bg-red-50/70">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-900">
                        <AlertTriangle className="h-5 w-5" />
                        Purchasing Or Rental Needed
                      </CardTitle>
                      <p className="text-sm text-red-900/80">
                        This contract can stay saved as draft, but approval and preparation should wait until purchasing or rental requests cover these shortages.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {visibleInventoryShortages.map((item, index) => (
                        <div key={`${item.itemName}-${index}`} className="rounded-lg border border-red-200 bg-white/80 p-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-medium text-red-950">{item.itemName}</p>
                              <p className="text-sm text-red-900/80">
                                Need {item.requestedQuantity} | Available for this date {item.availableQuantity ?? 0}
                                {item.reservedOnDate > 0 ? ` | Reserved on same day ${item.reservedOnDate}` : ''}
                              </p>
                            </div>
                            <Badge className="bg-red-100 text-red-800">
                              Short by {item.shortageQuantity}
                            </Badge>
                          </div>
                          {item.requestAction ? (
                            <div className="mt-2 space-y-3">
                              <p className="text-sm text-red-900">{item.requestAction}</p>
                              {item.sectionKey && item.itemId && (
                                ((item.sectionKey === 'creativeAssets' && canCreateCreativeProcurementRequest)
                                  || (item.sectionKey === 'linenRequirements' && canCreateLinenProcurementRequest)
                                  || (item.sectionKey === 'equipmentChecklist' && canCreateStockroomProcurementRequest))
                              ) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 bg-white text-red-900 hover:bg-red-100"
                                  onClick={() => openProcurementRequestDialog(item.sectionKey!, item)}
                                >
                                  Request Purchasing Or Rental
                                </Button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}

                {canViewCreativeInventorySection && renderInventorySection(
                  'Creative And Decor',
                  <Palette className="h-5 w-5" />,
                  'creativeAssets',
                  creativeItems,
                  canManageCreative
                )}

                {canViewLinenInventorySection && renderInventorySection(
                  'Linen Items',
                  <Shirt className="h-5 w-5" />,
                  'linenRequirements',
                  linenItems,
                  canManageLinen
                )}

                {canViewStockroomInventorySection && renderInventorySection(
                  'Stockroom And Equipment',
                  <Box className="h-5 w-5" />,
                  'equipmentChecklist',
                  stockroomItems,
                  canManageStockroom
                )}

                {!canViewCreativeInventorySection && !canViewLinenInventorySection && !canViewStockroomInventorySection && (
                  <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                      No inventory checklist sections are assigned to your department for this contract.
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="space-y-2 py-10 text-center">
                  <p className="text-muted-foreground">
                    Automated inventory checks are unavailable for this contract right now, but the saved contract details are still available.
                  </p>
                  {operationsErrorMessage ? (
                    <p className="text-sm text-red-700">
                      Error: {operationsErrorMessage}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div data-print-section="payments" className="space-y-4">
              <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Information
                </CardTitle>
                {canPostPayments && (
                  <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-print-hide="true">Record Payment</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Payment And Official Receipt</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="Enter amount"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Method</Label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="gcash">GCash</SelectItem>
                              <SelectItem value="ewallet">E-Wallet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Official Receipt Number</Label>
                          <Input
                            value={receiptNumber}
                            onChange={(e) => setReceiptNumber(e.target.value)}
                            placeholder="Enter official receipt number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Reference Number</Label>
                          <Input
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Enter transaction reference"
                          />
                        </div>
                        {(paymentMethod === 'gcash' || paymentMethod === 'ewallet') && (
                          <div className="space-y-2">
                            <Label>Receipt Image</Label>
                            <Input type="file" accept="image/*" onChange={handleReceiptImageChange} />
                            {receiptImageUrl ? (
                              <button
                                type="button"
                                className="h-28 w-28 overflow-hidden rounded-md border bg-muted"
                                onClick={() => setPreviewImage({ url: receiptImageUrl, title: 'Payment Proof' })}
                              >
                                <img src={receiptImageUrl} alt="Payment proof preview" className="h-full w-full object-cover" />
                              </button>
                            ) : null}
                          </div>
                        )}
                        <Button onClick={handleAddPayment} className="w-full">
                          Record Payment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {showPaymentPlanning && (
                  <div className="rounded-lg border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">Payment Arrangement</span>
                          <Badge variant="outline">{paymentPlanLabel}</Badge>
                          <Badge
                            variant="outline"
                            className={paymentTermStatusClassName}
                          >
                            {paymentTermStatusLabel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{paymentPlanSummary}</p>
                        {isPreSignatureStage && (
                          <p className="text-sm text-muted-foreground">
                            No payment receipt is needed yet. This only confirms the agreed payment term before the client signs.
                          </p>
                        )}
                        {paymentTermConfirmationLocked ? (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                            {paymentTermLockMessage}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2" data-print-hide="true">
                        {isPreSignatureStage && canConfigurePaymentPlan && (
                          <Button
                            type="button"
                            size="sm"
                            variant={!paymentTermConfirmationLocked && paymentTermNeedsConfirmation ? 'default' : 'outline'}
                            onClick={() => handleUpdatePaymentPlan(pendingPaymentPlan)}
                            disabled={!paymentTermNeedsConfirmation || paymentTermConfirmationLocked}
                            title={paymentTermConfirmationLocked ? paymentTermLockMessage : undefined}
                          >
                            {paymentTermConfirmationLocked
                              ? 'Confirm Inventory First'
                              : paymentTermNeedsConfirmation
                                ? 'Confirm Payment Term'
                                : 'Payment Term Confirmed'}
                          </Button>
                        )}
                      </div>
                    </div>
                    {isPreSignatureStage && (
                      <div className="mt-4 rounded-lg border border-dashed p-4">
                        <RadioGroup
                          value={pendingPaymentPlan}
                          onValueChange={(value) => setPendingPaymentPlan(value as 'split' | 'full')}
                          className="space-y-3"
                          disabled={!canConfigurePaymentPlan || paymentTermConfirmationLocked}
                        >
                          <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer">
                            <RadioGroupItem value="split" id="payment-plan-split" className="mt-1" />
                            <div className="space-y-1">
                              <Label htmlFor="payment-plan-split" className="cursor-pointer font-medium">60 / 40 Payment Term</Label>
                              <p className="text-sm text-muted-foreground">
                                Client pays 60% after signing for preparation release, then the remaining 40% one month before the event.
                              </p>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer">
                            <RadioGroupItem value="full" id="payment-plan-full" className="mt-1" />
                            <div className="space-y-1">
                              <Label htmlFor="payment-plan-full" className="cursor-pointer font-medium">Full Payment Term</Label>
                              <p className="text-sm text-muted-foreground">
                                Client agrees to settle the full contract amount after signing and before preparation approval.
                              </p>
                            </div>
                          </label>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-xl font-bold">{formatCurrency(contract.totalContractValue)}</p>
                  </div>
                  <div className={`${paymentRequirementMet || isPreSignatureStage ? 'bg-blue-50' : 'bg-amber-50'} rounded-lg p-4 text-center`}>
                    <p className={`text-sm ${paymentRequirementMet || isPreSignatureStage ? 'text-blue-700' : 'text-amber-700'}`}>{paymentRequirementLabel}</p>
                    <p className={`text-xl font-bold ${paymentRequirementMet || isPreSignatureStage ? 'text-blue-800' : 'text-amber-800'}`}>{formatCurrency(finalBalancePastDue && !fullPaymentPlan ? remainingBalance : requiredDownPayment)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-sm text-green-600">Paid</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <p className="text-sm text-orange-600">Balance</p>
                    <p className="text-xl font-bold text-orange-700">{formatCurrency(remainingBalance)}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className={`rounded-lg border px-4 py-3 text-sm ${isPreSignatureStage ? 'border-slate-200 bg-slate-50 text-slate-700' : paymentRequirementMet ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                    {isPreSignatureStage
                      ? 'No payment is collected before client signature. This section currently records only the agreed payment arrangement.'
                      : fullyPaid
                      ? 'Contract fully paid. The payment requirement for preparation is complete.'
                      : paymentHoldActive
                        ? `The remaining balance became due on ${finalBalanceDueDate.toLocaleDateString()}. The event is on payment hold until ${formatCurrency(remainingBalance)} is settled.`
                      : paymentRequirementMet
                        ? fullPaymentPlan
                          ? 'Full payment requirement met. Preparation can move forward once accounting approves.'
                          : `Initial payment requirement met. ${formatCurrency(remainingBalance)} remains for the final ${finalPaymentPercent}% balance.`
                        : fullPaymentPlan
                          ? `${formatCurrency(paymentRequirementRemaining)} is still needed to complete the full payment required before preparation.`
                          : `${formatCurrency(paymentRequirementRemaining)} is still needed to reach the required ${downPaymentPercent}% payment.`}
                  </div>
                  <div className={`rounded-lg border px-4 py-3 text-sm ${fullPaymentPlan ? (fullyPaid ? 'border-green-200 bg-green-50 text-green-900' : 'border-slate-200 bg-slate-50 text-slate-700') : finalBalancePastDue ? 'border-red-200 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    {fullPaymentPlan ? (
                      <>
                        Full payment target date: <strong>{finalBalanceDueDate.toLocaleDateString()}</strong>.
                        {isPreSignatureStage
                          ? ' This is only the agreed payment term before signing.'
                          : fullyPaid
                            ? ' Fully paid.'
                            : ' The full contract amount should be collected before preparation approval.'}
                      </>
                    ) : (
                      <>
                        Final {finalPaymentPercent}% due on <strong>{finalBalanceDueDate.toLocaleDateString()}</strong>.
                        {isPreSignatureStage
                          ? ' This schedule becomes collectible after the client signs.'
                          : fullyPaid
                            ? ' Fully paid.'
                            : finalBalancePastDue
                              ? ' This due date has already passed and the event is on payment hold until the balance is settled.'
                              : ''}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge className={getPaymentStatusColor(contract.paymentStatus)}>
                    {contract.paymentStatus.replace('_', ' ')}
                  </Badge>
                </div>

                {contract.payments?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Payment History</h4>
                    {contract.payments.map((payment, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">{payment.method.replace('_', ' ')}</p>
                          {payment.receiptNumber ? (
                            <p className="text-sm text-muted-foreground">OR No.: {payment.receiptNumber}</p>
                          ) : null}
                          {payment.reference ? (
                            <p className="text-sm text-muted-foreground">Reference: {payment.reference}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }>
                            {payment.status}
                          </Badge>
                          {payment.receiptImageUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewImage({ url: payment.receiptImageUrl!, title: payment.receiptNumber || 'Payment Proof' })}
                            >
                              View Proof
                            </Button>
                          ) : null}
                          <Button variant="outline" size="sm" data-print-hide="true" onClick={() => handleExportOfficialReceipt(payment)}>
                            Official Receipt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {contract.payments?.length === 0 && (
                  <p className="text-muted-foreground">No payments recorded yet.</p>
                )}
              </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="banquet" className="space-y-4">
            <div data-print-section="banquet" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Banquet Staffing Form
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {isPreSignatureStage ? renderReferenceBadge() : null}
                    <Button variant="outline" size="sm" data-print-hide="true" onClick={handlePrintBanquetStaffPlan}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Staff Check-In Sheet
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {isOperationsLoading ? (
                    <p className="text-muted-foreground">Loading banquet staffing recommendations...</p>
                  ) : banquetSummary ? (
                    <>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg border p-4">
                          <p className="text-sm text-muted-foreground">Event Guests</p>
                          <p className="mt-1 text-2xl font-semibold">{banquetAssignmentDraft.serviceGuestCount || banquetSummary.planningGuestCount || 0}</p>
                          <p className="text-xs text-muted-foreground">Guest base used for staffing</p>
                        </div>
                        <div className="rounded-lg border p-4">
                          <p className="text-sm text-muted-foreground">Assigned Supervisor</p>
                          <p className="mt-1 font-semibold">
                            {banquetSummary.supervisorOptions.find((option) => option._id === banquetAssignmentDraft.supervisorId)?.name
                              || contract.assignedSupervisor?.name
                              || 'Not assigned'}
                          </p>
                          <p className="text-xs text-muted-foreground">Main owner of the service team</p>
                        </div>
                        <div className="rounded-lg border p-4">
                          <p className="text-sm text-muted-foreground">Crew Assigned</p>
                          <p className="mt-1 text-2xl font-semibold">{banquetAssignedTotal}</p>
                          <p className="text-xs text-muted-foreground">
                            {banquetPlannedTotal > 0 ? `${Math.max(0, banquetPlannedTotal - banquetAssignedTotal)} slot(s) still open` : 'No staffing target saved yet'}
                          </p>
                        </div>
                        <div className="rounded-lg border p-4">
                          <p className="text-sm text-muted-foreground">Coverage</p>
                          <p className="mt-1 text-2xl font-semibold">{banquetDraftCoveragePercent}%</p>
                          <Progress value={banquetDraftCoveragePercent} className="mt-3 h-2" />
                        </div>
                      </div>

                      {!['approved', 'completed'].includes(contract.status) ? (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                          Banquet staffing becomes editable after accounting approval. You can still review the suggested headcount here ahead of time.
                        </div>
                      ) : null}

                      {banquetSummary.blockers.length > 0 ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          {banquetSummary.blockers.join(' ')}
                        </div>
                      ) : null}

                      <div className="rounded-xl border bg-slate-50/70 px-4 py-3 text-sm text-muted-foreground">
                        Fill out the banquet plan top to bottom: confirm the service guest count, set the supervisor and staffing targets, assign names, then save and print the check-in sheet.
                      </div>

                      <div className="space-y-4">
                        <Card className="border-slate-200 bg-slate-50/50">
                          <CardHeader className="pb-3">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <CardTitle className="text-base">Recommended Staffing</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Based on {banquetSummary.planningGuestCount.toLocaleString()} service guests and the banquet staff still free on {new Date(contract.eventDate).toLocaleDateString()}.
                                </p>
                              </div>
                              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                                {banquetSuggestedAssignments.length} recommended name(s)
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                              {BANQUET_ASSIGNMENT_ROLE_KEYS.map((roleKey) => (
                                <div key={roleKey} className="rounded-xl border bg-background p-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    {BANQUET_ROLE_LABELS[roleKey]}
                                  </p>
                                  <p className="mt-2 text-2xl font-semibold">{banquetSummary.suggestedPlan[roleKey] || 0}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{BANQUET_ROLE_NOTES[roleKey]}</p>
                                </div>
                              ))}
                            </div>
                            <div className="rounded-xl border bg-background p-4">
                              <p className="text-sm font-medium">Quick use</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Load the recommended plan first, then adjust guest count, role targets, or names if the event needs something different.
                              </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm text-muted-foreground">
                                This is the fastest path for near-term events: load the plan, review it, then save and print the check-in sheet.
                              </p>
                              <Button type="button" variant="outline" onClick={handleUseSuggestedBanquetTeam} disabled={!canManageBanquet}>
                                Load Recommended Plan
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <CardTitle className="text-base">Planning Form</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Complete the guest base, banquet supervisor, and planned headcount before assigning individual names below.
                                </p>
                              </div>
                              {banquetSummary.updatedAt ? (
                                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                  Updated {new Date(banquetSummary.updatedAt).toLocaleDateString()}
                                </Badge>
                              ) : null}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Service Guest Count</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  value={banquetAssignmentDraft.serviceGuestCount || ''}
                                  onChange={(event) => setBanquetAssignmentDraft((current) => ({
                                    ...current,
                                    serviceGuestCount: Math.max(0, Math.floor(Number(event.target.value) || 0))
                                  }))}
                                  disabled={!canManageBanquet}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Banquet Supervisor</Label>
                                <Select
                                  value={banquetAssignmentDraft.supervisorId || '__none__'}
                                  onValueChange={(value) => setBanquetAssignmentDraft((current) => ({
                                    ...current,
                                    supervisorId: value === '__none__' ? '' : value
                                  }))}
                                  disabled={!canManageBanquet}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Assign supervisor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">No supervisor assigned</SelectItem>
                                    {banquetSummary.supervisorOptions.map((option) => (
                                      <SelectItem key={option._id} value={option._id}>
                                        {option.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              {BANQUET_ASSIGNMENT_ROLE_KEYS.map((roleKey) => (
                                <div key={roleKey} className="rounded-xl border bg-slate-50/60 p-3">
                                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    {BANQUET_ROLE_LABELS[roleKey]}
                                  </Label>
                                  <Input
                                    className="mt-2"
                                    type="number"
                                    min={0}
                                    value={banquetAssignmentDraft.staffingPlan[roleKey] || ''}
                                    onChange={(event) => handleBanquetPlanCountChange(roleKey, event.target.value)}
                                    disabled={!canManageBanquet}
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="rounded-xl border bg-slate-50/70 p-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="text-sm font-medium">Current staffing coverage</p>
                                  <p className="text-sm text-muted-foreground">
                                    {banquetAssignedTotal} assigned of {banquetPlannedTotal} planned team positions.
                                  </p>
                                </div>
                                <Badge variant="outline" className="border-slate-200 bg-background text-slate-700">
                                  {banquetDraftCoveragePercent}% ready
                                </Badge>
                              </div>
                              <Progress value={banquetDraftCoveragePercent} className="mt-4 h-2" />
                            </div>

                            {canManageBanquet ? (
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-muted-foreground">
                                  Saving here also refreshes banquet visibility for the assigned supervisor and updates the staffing baseline used across operations.
                                </p>
                                <Button type="button" onClick={handleSaveBanquetAssignment} disabled={isSavingBanquetAssignment}>
                                  {isSavingBanquetAssignment ? 'Saving Banquet Form...' : 'Save Banquet Form'}
                                </Button>
                              </div>
                            ) : (
                              <div className="rounded-xl border bg-slate-50/70 p-4 text-sm text-muted-foreground">
                                Read-only for this account.
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      <div className="divide-y overflow-hidden rounded-2xl border">
                        {BANQUET_ASSIGNMENT_ROLE_KEYS.map((roleKey) => {
                          const assignedStaff = getBanquetDraftStaffForRole(roleKey);
                          const availableStaff = getBanquetAvailableStaffForRole(roleKey);
                          const missingCount = Math.max(0, (banquetAssignmentDraft.staffingPlan[roleKey] || 0) - assignedStaff.length);
                          const suggestedIds = new Set(
                            banquetSuggestedAssignments
                              .filter((assignment) => assignment.assignmentRole === roleKey)
                              .map((assignment) => assignment.staffId)
                          );

                          return (
                            <div key={roleKey} className="space-y-4 px-5 py-5">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <h4 className="text-base font-semibold">{BANQUET_ROLE_LABELS[roleKey]}</h4>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {BANQUET_ROLE_NOTES[roleKey]} {availableStaff.length > 0 ? `${availableStaff.length} available for this date.` : 'No one is currently free for this date.'}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                    {assignedStaff.length} assigned / {banquetAssignmentDraft.staffingPlan[roleKey] || 0} planned
                                  </Badge>
                                  {missingCount > 0 ? (
                                    <Badge className="bg-amber-100 text-amber-900">
                                      Need {missingCount} more
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>

                              {canManageBanquet ? (
                                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                  <Select
                                    value={banquetPickers[roleKey] || '__none__'}
                                    onValueChange={(value) => setBanquetPickers((current) => ({
                                      ...current,
                                      [roleKey]: value === '__none__' ? '' : value
                                    }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={`Select ${BANQUET_ROLE_LABELS[roleKey]}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">Choose staff member</SelectItem>
                                      {availableStaff.map((staff) => (
                                        <SelectItem key={staff._id} value={staff._id}>
                                          {staff.fullName}
                                          {suggestedIds.has(staff._id) ? ' - Suggested' : ''}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button type="button" variant="outline" onClick={() => handleAddBanquetStaff(roleKey)}>
                                    Add Staff
                                  </Button>
                                </div>
                              ) : null}

                              {assignedStaff.length > 0 ? (
                                <div className="overflow-hidden rounded-xl border">
                                  {assignedStaff.map((staff, index) => (
                                    <div
                                      key={`${roleKey}-${staff._id}`}
                                      className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${index !== assignedStaff.length - 1 ? 'border-b' : ''}`}
                                    >
                                      <div>
                                        <p className="font-medium">{staff.fullName}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {[staff.employeeId, formatBanquetStaffRole(staff.role)].filter(Boolean).join(' | ')}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        {suggestedIds.has(staff._id) ? (
                                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                                            Suggested
                                          </Badge>
                                        ) : null}
                                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                          {formatBanquetStaffRole(staff.status)}
                                        </Badge>
                                        {canManageBanquet ? (
                                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveBanquetStaff(roleKey, staff._id)}>
                                            Remove
                                          </Button>
                                        ) : null}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                                  No {BANQUET_ROLE_LABELS[roleKey].toLowerCase()} assigned yet.
                                </div>
                              )}

                              {availableStaff.length === 0 ? (
                                <p className="text-sm text-amber-700">
                                  No available {BANQUET_ROLE_LABELS[roleKey].toLowerCase()} staff for this event date.
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Banquet staffing recommendations are unavailable right now.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logistics" className="space-y-4">
            <div data-print-section="logistics" className="space-y-4">
              <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Logistics Booking Form
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {isPreSignatureStage ? renderReferenceBadge() : null}
                  {renderTabEditButton('event')}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isOperationsLoading ? (
                  <p className="text-muted-foreground">Loading driver and truck availability...</p>
                ) : operationsSummary ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Event Date</p>
                        <p className="mt-1 font-semibold">{new Date(contract.eventDate).toLocaleDateString()}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Venue</p>
                        <p className="mt-1 font-semibold">{contract.venue?.name || 'No venue saved'}</p>
                        <p className="text-sm text-muted-foreground">{contract.venue?.address || 'Venue address not saved yet'}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Estimated Load</p>
                        <p className="mt-1 font-semibold">{operationsSummary.logistics.estimatedVolumeCubicMeters} m3</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Current Stage</p>
                        <Badge className={`mt-2 ${getLogisticsStatusClassName(logisticsStatusValue)}`}>
                          {getLogisticsStatusLabel(logisticsStatusValue)}
                        </Badge>
                      </div>
                    </div>

                    {operationsSummary.logistics.blockers.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        {operationsSummary.logistics.blockers.join(' ')}
                      </div>
                    )}

                    <div className="space-y-4">
                      <Card className="border-slate-200 bg-slate-50/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Booking Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-xl border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Booked Truck</p>
                            <p className="mt-1 font-semibold">{savedLogisticsTruck?.plateNumber || selectedLogisticsTruck?.plateNumber || 'Not booked yet'}</p>
                            <p className="text-sm text-muted-foreground">
                              {savedLogisticsTruck?.truckType?.replace(/_/g, ' ') || selectedLogisticsTruck?.truckType?.replace(/_/g, ' ') || 'No truck assigned'}
                            </p>
                          </div>
                          <div className="rounded-xl border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Booked Driver</p>
                            <p className="mt-1 font-semibold">{savedLogisticsDriver?.fullName || selectedLogisticsDriver?.fullName || 'Not assigned yet'}</p>
                            <p className="text-sm text-muted-foreground">
                              {savedLogisticsDriver?.driverId || selectedLogisticsDriver?.driverId || 'No driver assigned'}
                            </p>
                          </div>
                          <div className="rounded-xl border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Saved Stage</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge className={getLogisticsStatusClassName(savedLogisticsStatus)}>
                                {getLogisticsStatusLabel(savedLogisticsStatus)}
                              </Badge>
                              {logisticsStatusWillChange ? (
                                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                                  After Save: {getLogisticsStatusLabel(logisticsStatusValue)}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                          <div className="rounded-xl border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Auto-Save</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={logisticsAutoSaveMessage.className}>
                                {logisticsAutoSaveMessage.label}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{logisticsAutoSaveMessage.note}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200 shadow-sm" data-print-hide="true">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Booking Form</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Choose the truck and driver for this event here. Changes save automatically, and the dispatch action only appears when the booking is already ready.
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          {canManageLogistics ? (
                            <>
                              {(operationsSummary.logistics.recommendedTruck || operationsSummary.logistics.recommendedDriver) ? (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Recommended Match</p>
                                  <div className="mt-2 space-y-1 text-sm text-emerald-950">
                                    <p>
                                      Truck: <strong>{operationsSummary.logistics.recommendedTruck?.plateNumber || 'Choose any available truck'}</strong>
                                    </p>
                                    <p>
                                      Driver: <strong>{operationsSummary.logistics.recommendedDriver?.fullName || 'Choose any available driver'}</strong>
                                    </p>
                                  </div>
                                  <p className="mt-2 text-sm text-emerald-900/80">
                                    This is just a starting suggestion. You can still choose any available option below.
                                  </p>
                                </div>
                              ) : null}

                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Truck</Label>
                                  <Select
                                    value={logisticsAssignment.truckId || '__none__'}
                                    onValueChange={(value) => setLogisticsAssignment(prev => ({ ...prev, truckId: value === '__none__' ? '' : value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select truck" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">No truck assigned yet</SelectItem>
                                      {logisticsTruckOptions.map((truck) => (
                                        <SelectItem key={truck._id} value={truck._id}>
                                          {truck.plateNumber} ({truck.truckType.replace(/_/g, ' ')}, {truck.capacityVolume || 0} m3)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {selectedLogisticsTruck ? (
                                    <div className="rounded-lg border bg-slate-50/70 px-3 py-2 text-sm text-muted-foreground">
                                      {selectedLogisticsTruck.truckType.replace(/_/g, ' ')} | {selectedLogisticsTruck.capacityVolume || 0} m3
                                      {operationsSummary.logistics.recommendedTruck?._id === selectedLogisticsTruck._id ? ' | Recommended' : ''}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="space-y-2">
                                  <Label>Driver</Label>
                                  <Select
                                    value={logisticsAssignment.driverId || '__none__'}
                                    onValueChange={(value) => setLogisticsAssignment(prev => ({ ...prev, driverId: value === '__none__' ? '' : value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select driver" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">No driver assigned yet</SelectItem>
                                      {logisticsDriverOptions.map((driver) => (
                                        <SelectItem key={driver._id} value={driver._id}>
                                          {driver.fullName} ({driver.driverId})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {selectedLogisticsDriver ? (
                                    <div className="rounded-lg border bg-slate-50/70 px-3 py-2 text-sm text-muted-foreground">
                                      {selectedLogisticsDriver.driverId}{selectedLogisticsDriver.phone ? ` | ${selectedLogisticsDriver.phone}` : ''}
                                      {operationsSummary.logistics.recommendedDriver?._id === selectedLogisticsDriver._id ? ' | Recommended' : ''}
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div className="rounded-xl border bg-slate-50/70 p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Booking Status</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                      <Badge className={getLogisticsStatusClassName(savedLogisticsStatus)}>
                                        {getLogisticsStatusLabel(savedLogisticsStatus)}
                                      </Badge>
                                      {logisticsStatusWillChange ? (
                                        <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                                          After Save: {getLogisticsStatusLabel(logisticsStatusValue)}
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <p className="mt-3 text-sm text-muted-foreground">
                                      {logisticsStatusWillChange
                                        ? 'Saving will update the logistics stage automatically based on the current truck and driver selection.'
                                        : logisticsNextAction
                                          ? logisticsNextAction.note
                                          : logisticsCompletionWaitsForPostEvent
                                            ? 'Dispatch is already recorded. Mark Completed will become available once the event date has passed.'
                                            : 'No day-of action is needed yet. Update the truck or driver here and the booking will save automatically.'}
                                    </p>
                                  </div>
                                  {logisticsNextAction ? (
                                    <Button type="button" onClick={logisticsNextAction.onClick}>
                                      {logisticsNextAction.label}
                                    </Button>
                                  ) : null}
                                </div>
                              </div>

                              {logisticsAutoSaveState === 'error' && logisticsAutoSaveErrorMessage ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                      <p className="font-semibold">Already booked for another same-day event</p>
                                      <p className="mt-1">{logisticsAutoSaveErrorMessage}</p>
                                    </div>
                                  </div>
                                </div>
                              ) : null}

                              <p className="text-sm text-muted-foreground">
                                Review the booking details above. This form saves automatically as you update the truck or driver selection.
                              </p>
                            </>
                          ) : (
                            <div className="rounded-xl border bg-slate-50/70 p-4 text-sm text-muted-foreground">
                              Read-only for this account.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="hidden">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Driver Booking</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {operationsSummary.logistics.recommendedDriver && (
                            <div className="rounded-md border bg-green-50 p-3 text-sm text-green-900">
                              Suggested driver for this event: <strong>{operationsSummary.logistics.recommendedDriver.fullName}</strong>
                            </div>
                          )}
                          {canManageLogistics && (
                            <div className="space-y-2">
                              <Label>Book Driver</Label>
                              <Select
                                value={logisticsAssignment.driverId || '__none__'}
                                onValueChange={(value) => setLogisticsAssignment(prev => ({ ...prev, driverId: value === '__none__' ? '' : value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select available driver" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">No driver assigned</SelectItem>
                                  {operationsSummary.logistics.availableDrivers.map(driver => (
                                    <SelectItem key={driver._id} value={driver._id}>
                                      {driver.fullName} ({driver.driverId})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <div className="space-y-2">
                            {operationsSummary.logistics.availableDrivers.length > 0 ? (
                              operationsSummary.logistics.availableDrivers.map(driver => (
                                <div key={driver._id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                                  <div>
                                    <p className="font-medium">{driver.fullName}</p>
                                    <p className="text-muted-foreground">{driver.driverId}</p>
                                  </div>
                                  <Badge variant="outline">{driver.status}</Badge>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No available drivers for this event date.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Truck Booking</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {operationsSummary.logistics.recommendedTruck && (
                            <div className="rounded-md border bg-green-50 p-3 text-sm text-green-900">
                              Suggested truck for this load: <strong>{operationsSummary.logistics.recommendedTruck.plateNumber}</strong>
                            </div>
                          )}
                          {canManageLogistics && (
                            <>
                              <div className="space-y-2">
                                <Label>Book Truck</Label>
                                <Select
                                  value={logisticsAssignment.truckId || '__none__'}
                                  onValueChange={(value) => setLogisticsAssignment(prev => ({ ...prev, truckId: value === '__none__' ? '' : value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select available truck" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">No truck assigned</SelectItem>
                                    {operationsSummary.logistics.availableTrucks.map(truck => (
                                      <SelectItem key={truck._id} value={truck._id}>
                                        {truck.plateNumber} ({truck.truckType.replace(/_/g, ' ')})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Booking Status</Label>
                                <Select
                                  value={!eventHasPassed && logisticsAssignment.assignmentStatus === 'completed'
                                    ? 'dispatched'
                                    : logisticsAssignment.assignmentStatus}
                                  onValueChange={(value) => setLogisticsAssignment(prev => ({ ...prev, assignmentStatus: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">pending</SelectItem>
                                      <SelectItem value="scheduled">scheduled</SelectItem>
                                      <SelectItem value="ready_for_dispatch">ready for dispatch</SelectItem>
                                      <SelectItem value="dispatched">dispatched</SelectItem>
                                      {eventHasPassed ? (
                                        <SelectItem value="completed">completed</SelectItem>
                                      ) : null}
                                    </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Logistics Notes</Label>
                                <Input
                                  value={logisticsAssignment.notes}
                                  onChange={(e) => setLogisticsAssignment(prev => ({ ...prev, notes: e.target.value }))}
                                  placeholder="Truck, loading plan, dispatch notes, or reminders"
                                />
                              </div>
                              <Button data-print-hide="true" onClick={() => void handleUpdateLogisticsAssignment()}>Save Truck Booking</Button>
                            </>
                          )}
                          <div className="space-y-2">
                            {operationsSummary.logistics.availableTrucks.length > 0 ? (
                              operationsSummary.logistics.availableTrucks.map(truck => (
                                <div key={truck._id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                                  <div>
                                    <p className="font-medium">{truck.plateNumber}</p>
                                    <p className="text-muted-foreground capitalize">
                                      {truck.truckType.replace(/_/g, ' ')} • {truck.capacityVolume || 0} m3
                                    </p>
                                  </div>
                                  <Badge variant="outline">{truck.status.replace(/_/g, ' ')}</Badge>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No available trucks for this event date.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Automated logistics checks are unavailable for this contract right now, but saved assignment details can still be reviewed here.
                  </p>
                )}
              </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <div data-print-section="preferences" className="space-y-4">
              <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Event Preferences
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {isPreSignatureStage ? renderReferenceBadge() : null}
                  {renderTabEditButton('event')}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Preferred Color</span>
                    <p className="font-medium">{contract.preferredColor || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Napkin Type</span>
                    <p className="font-medium">{contract.napkinType || '-'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Table Setup</span>
                  <p className="font-medium capitalize">{contract.tableSetup || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Backdrop Requirements</span>
                  <p className="font-medium">{contract.backdropRequirements || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Special Requests</span>
                  <p className="font-medium">{contract.specialRequests || '-'}</p>
                </div>
              </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <div data-print-section="timeline" className="space-y-4">
              <Card>
              <CardHeader>
                <CardTitle>Timeline & Deadlines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Details Deadline</span>
                  <span className="font-medium">
                    {contract.finalDetailsDeadline 
                      ? new Date(contract.finalDetailsDeadline).toLocaleDateString()
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Date</span>
                  <span className="font-medium">
                    {new Date(contract.eventDate).toLocaleDateString()}
                  </span>
                </div>
                {contract.slaWarning && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium">
                      <AlertTriangle className="inline h-4 w-4 mr-2" />
                      SLA Warning: Final details deadline has passed!
                    </p>
                  </div>
                )}
              </CardContent>
              </Card>

              <Card>
              <CardHeader>
                <CardTitle>Contract Closure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isContractClosed ? (
                  <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900">
                    This contract was closed on <strong>{contract.completedAt ? new Date(contract.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}</strong>.
                  </div>
                ) : (
                  <>
                    <div className={`rounded-lg border px-4 py-3 text-sm ${closureIssues.length === 0 ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                      {closureIssues.length === 0
                        ? 'This contract is ready to close.'
                        : 'Finish these post-event checks before closing the contract.'}
                    </div>
                    {closureIssues.length > 0 ? (
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {closureIssues.map((issue) => (
                          <p key={issue}>{issue}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Accounting or admin can now close this contract.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Send Contract For Signature</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Choose how you want to release this contract for signing. We can just move it to signature status, open a printable signature copy, or open a signature-ready PDF you can save and send for e-signing.
              </p>

              <div className="grid gap-3">
                <button
                  type="button"
                  className="rounded-lg border px-4 py-3 text-left transition hover:border-slate-400"
                  onClick={() => handleSendForSignature('print')}
                  disabled={isSendingForSignature}
                >
                  <div className="font-medium">Send And Print Signature Copy</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Marks the contract as pending client signature and opens a print-ready signing copy.
                  </div>
                </button>

                <button
                  type="button"
                  className="rounded-lg border px-4 py-3 text-left transition hover:border-slate-400"
                  onClick={() => handleSendForSignature('esign')}
                  disabled={isSendingForSignature}
                >
                  <div className="font-medium">Send And Open E-Sign PDF</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Opens a signature-ready PDF view that can be saved and shared through your preferred e-sign workflow.
                  </div>
                </button>

                <button
                  type="button"
                  className="rounded-lg border px-4 py-3 text-left transition hover:border-slate-400"
                  onClick={() => handleSendForSignature('status_only')}
                  disabled={isSendingForSignature}
                >
                  <div className="font-medium">Send Without Opening A Document</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Only updates the contract status so you can handle the signature step later.
                  </div>
                </button>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                The contract will still follow the same business flow after signature: payment first, then accounting approval for preparation.
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={esignDialogOpen} onOpenChange={setEsignDialogOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Upload E-Signatures</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Upload both signatures and they will be placed above each signer&apos;s name in the e-sign PDF. Once both are saved on a contract that is waiting for signature, the contract will automatically be marked signed and routed to accounting.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {(['client', 'staff'] as SignaturePartyKey[]).map((party) => {
                  const isClient = party === 'client';
                  const partyState = signatureForm[party];

                  return (
                    <div key={party} className="space-y-4 rounded-lg border p-4">
                      <div>
                        <h3 className="font-medium">{isClient ? 'Client Signature' : 'Staff Signature'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {isClient ? 'This will appear over the client name on the contract.' : 'This will appear over the authorized staff name on the contract.'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${party}-signed-name`}>Signer Name</Label>
                        <Input
                          id={`${party}-signed-name`}
                          value={partyState.signedName || ''}
                          onChange={(event) => handleSignatureFieldChange(party, 'signedName', event.target.value)}
                          placeholder={isClient ? contract?.clientName || 'Client name' : user?.name || 'Authorized representative'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${party}-title`}>Label / Title</Label>
                        <Input
                          id={`${party}-title`}
                          value={partyState.title || ''}
                          onChange={(event) => handleSignatureFieldChange(party, 'title', event.target.value)}
                          placeholder={isClient ? 'Client' : 'Authorized Representative'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${party}-upload`}>Signature Image</Label>
                        <Input
                          id={`${party}-upload`}
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleSignatureImageChange(party, event)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Use a transparent PNG or clean image under 2 MB for best results.
                        </p>
                      </div>

                      <div className="rounded-lg border bg-muted/20 p-3">
                        {partyState.imageUrl ? (
                          <button
                            type="button"
                            className="w-full overflow-hidden rounded-md border bg-background"
                            onClick={() => setPreviewImage({ url: partyState.imageUrl!, title: isClient ? 'Client Signature' : 'Staff Signature' })}
                          >
                            <img
                              src={partyState.imageUrl}
                              alt={isClient ? 'Client signature preview' : 'Staff signature preview'}
                              className="h-28 w-full object-contain"
                            />
                          </button>
                        ) : (
                          <div className="flex h-28 items-center justify-center rounded-md border border-dashed bg-background text-sm text-muted-foreground">
                            No signature image uploaded yet
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                The signatures are saved to this contract so you can reopen the e-sign PDF later without uploading them again. Saving both signatures also completes the client-signature step for the contract.
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEsignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveEsignaturesAndOpenPdf} disabled={isSavingEsignatures}>
                  {isSavingEsignatures ? 'Saving Signatures...' : 'Save Signatures And Open PDF'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Report Inventory Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{incidentTarget?.itemName || 'Inventory item'}</p>
                    <p className="text-muted-foreground">
                      Department: {incidentTarget?.departmentLabel || '-'}
                    </p>
                  </div>
                  <Badge variant="outline">Contract Qty {incidentTarget?.requestedQuantity ?? '-'}</Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Incident Type</Label>
                  <Select
                    value={incidentForm.incidentType}
                    onValueChange={(value) => setIncidentForm((current) => ({ ...current, incidentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={incidentForm.severity}
                    onValueChange={(value) => setIncidentForm((current) => ({ ...current, severity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Affected Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={incidentForm.affectedQuantity}
                  onChange={(event) => setIncidentForm((current) => ({ ...current, affectedQuantity: event.target.value }))}
                  placeholder="How many items were affected?"
                />
                <p className="text-xs text-muted-foreground">
                  Use this for missing, damaged, or wrong-quantity issues.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Damage Reference Image (optional)</Label>
                <Input type="file" accept="image/*" onChange={handleIncidentAttachmentChange} />
                {incidentForm.attachmentUrl ? (
                  <button
                    type="button"
                    className="h-28 w-28 overflow-hidden rounded-md border bg-muted"
                    onClick={() => setPreviewImage({ url: incidentForm.attachmentUrl, title: 'Incident Reference Image' })}
                  >
                    <img src={incidentForm.attachmentUrl} alt="Incident reference preview" className="h-full w-full object-cover" />
                  </button>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Upload a photo if the damage or missing item needs visual reference.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={incidentForm.description}
                  onChange={(event) => setIncidentForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe what was missing, damaged, or incorrect after the event..."
                  rows={4}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIncidentDialogOpen(false);
                    setIncidentTarget(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={handleSubmitInventoryIncident}>
                  Submit Incident Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={procurementRequestDialogOpen} onOpenChange={setProcurementRequestDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Procurement Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{procurementRequestTarget?.item.itemName || 'Inventory item'}</p>
                    <p className="text-muted-foreground">
                      {procurementRequestTarget ? INVENTORY_SECTION_LABELS[procurementRequestTarget.section] : '-'} | {contract?.contractNumber || '-'}
                    </p>
                    {procurementRequestTarget && !procurementRequestTarget.item.itemId ? (
                      <p className="mt-2 text-xs text-amber-700">
                        This item is not linked to a saved inventory record yet. Purchasing can still prepare the report, but it should be linked before fulfillment updates stock.
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="outline">
                    {procurementRequestTarget && procurementRequestTarget.item.shortageQuantity > 0
                      ? `Short by ${procurementRequestTarget.item.shortageQuantity}`
                      : `Suggested qty ${procurementRequestTarget?.item.requestedQuantity ?? '-'}`}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Request Type</Label>
                  <Select
                    value={procurementRequestForm.requestType}
                    onValueChange={(value) => setProcurementRequestForm((current) => ({ ...current, requestType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="rental">Rental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity Needed</Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={procurementRequestForm.requestedQuantity}
                    onChange={(event) => setProcurementRequestForm((current) => ({ ...current, requestedQuantity: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Needed By</Label>
                <Input
                  type="date"
                  value={procurementRequestForm.neededBy}
                  onChange={(event) => setProcurementRequestForm((current) => ({ ...current, neededBy: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={procurementRequestForm.reason}
                  onChange={(event) => setProcurementRequestForm((current) => ({ ...current, reason: event.target.value }))}
                  rows={3}
                  placeholder="Explain why purchasing or rental support is needed for this item."
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={procurementRequestForm.notes}
                  onChange={(event) => setProcurementRequestForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={3}
                  placeholder="Optional note for purchasing, supplier, or event handling."
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setProcurementRequestDialogOpen(false);
                    setProcurementRequestTarget(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleSubmitProcurementRequest}>
                  Send To Purchasing
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewImage?.title || 'Inventory Preview'}</DialogTitle>
            </DialogHeader>
            {previewImage?.url ? (
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
