import { useEffect, useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Truck
} from 'lucide-react';
import { toast } from 'sonner';

const SECTION_PRINT_LABELS: Record<string, string> = {
  details: 'Contract Details',
  menu: 'Menu Summary',
  inventory: 'Inventory Checklist',
  payments: 'Payment Summary',
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
  itemId?: string | null;
  itemName: string;
  itemCode?: string;
  category?: string;
  requestedQuantity: number;
  availableQuantity: number | null;
  reservedOnDate: number;
  inventoryStatus: string;
  itemStatus: string;
  enoughStock: boolean;
  readyForDispatch: boolean;
  imageUrl?: string;
  notes?: string;
  blockers: string[];
}

interface SignatureParty {
  signedName?: string;
  title?: string;
  imageUrl?: string;
  uploadedAt?: string;
}

type ReadinessStatus = 'not_started' | 'blocked' | 'in_progress' | 'ready';
type ConfirmableSectionKey = 'details' | 'menu' | 'preferences' | 'payments' | 'creative' | 'linen' | 'stockroom' | 'logistics';
type ContractTabKey = 'details' | 'menu' | 'inventory' | 'payments' | 'logistics' | 'preferences' | 'timeline';
type SignaturePartyKey = 'client' | 'staff';

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

const ALL_CONTRACT_TABS: ContractTabKey[] = ['details', 'menu', 'inventory', 'payments', 'logistics', 'preferences', 'timeline'];
const TAB_LABELS: Record<ContractTabKey, string> = {
  details: 'Details',
  menu: 'Menu',
  inventory: 'Inventory',
  payments: 'Payments',
  logistics: 'Logistics',
  preferences: 'Preferences',
  timeline: 'Timeline',
};

const pluralize = (count: number, singular: string, plural = `${singular}s`) => (
  count === 1 ? singular : plural
);

const formatEnumLabel = (value?: string) => (value || 'pending').replace(/_/g, ' ');
const formatStatusLabel = (value?: string) => (value || '').replace(/_/g, ' ');
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
  const { isSales, isAccounting, isLogistics, isBanquet, isKitchen, isPurchasing, isCreative, isLinen, isAdmin, role } = useRole();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [esignDialogOpen, setEsignDialogOpen] = useState(false);
  const [isSendingForSignature, setIsSendingForSignature] = useState(false);
  const [isSavingEsignatures, setIsSavingEsignatures] = useState(false);
  const [isClosingContract, setIsClosingContract] = useState(false);
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
  const [logisticsAssignment, setLogisticsAssignment] = useState({
    driverId: '',
    truckId: '',
    assignmentStatus: 'pending',
    notes: ''
  });
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
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

  const fetchContractData = async () => {
    setIsLoading(true);

    try {
      setIsOperationsLoading(true);
      const contractData = await api.getContract(id!);

      setContract(contractData);
      setPendingPaymentPlan(
        resolveDownPaymentPercent(contractData.downPaymentPercent) >= 100
          || resolveFinalPaymentPercent(contractData.downPaymentPercent, contractData.finalPaymentPercent) <= 0
          ? 'full'
          : 'split'
      );
      setLogisticsAssignment({
        driverId: contractData.logisticsAssignment?.driver?._id || '',
        truckId: contractData.logisticsAssignment?.truck?._id || '',
        assignmentStatus: contractData.logisticsAssignment?.assignmentStatus || 'pending',
        notes: contractData.logisticsAssignment?.notes || ''
      });
      setSignatureForm(getSignatureFormState(contractData));

      try {
        const operationsData = await api.getContractOperationsSummary(id!);
        setOperationsSummary(operationsData);
        setLogisticsAssignment({
          driverId: operationsData.logistics.assignedDriverId || contractData.logisticsAssignment?.driver?._id || '',
          truckId: operationsData.logistics.assignedTruckId || contractData.logisticsAssignment?.truck?._id || '',
          assignmentStatus: operationsData.logistics.assignmentStatus || contractData.logisticsAssignment?.assignmentStatus || 'pending',
          notes: operationsData.logistics.notes || contractData.logisticsAssignment?.notes || ''
        });
      } catch (operationsError) {
        console.error('Failed to load operations summary:', operationsError);
        setOperationsSummary(null);
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

  const handleUpdateLogisticsAssignment = async () => {
    if (!contract || contract.status !== 'approved') {
      toast.error('Only approved contracts can update logistics booking');
      return;
    }

    const payload = {
      ...logisticsAssignment,
      assignmentStatus: resolveLogisticsAssignmentStatus(logisticsAssignment)
    };

    if (!payload.truckId) {
      toast.error('Select a truck to book this event');
      return;
    }

    try {
      await api.updateLogisticsAssignment(id!, payload);
      toast.success('Logistics booking saved');
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save logistics booking');
    }
  };

  const handleAdvanceLogisticsAssignment = async (nextStatus: 'dispatched' | 'completed') => {
    if (!contract || contract.status !== 'approved') {
      toast.error('Only approved contracts can update logistics booking');
      return;
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

  const handleUpdateInventoryItemStatus = async (section: 'creativeAssets' | 'linenRequirements' | 'equipmentChecklist', index: number, status: string) => {
    if (!contract || contract.status !== 'approved') {
      toast.error('Only approved contracts can update checklist statuses');
      return;
    }

    try {
      await api.updateInventoryItemStatus(id!, { section, index, status });
      toast.success('Checklist updated');
      fetchContractData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update checklist status');
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

  const inventoryStatusOptions = {
    creativeAssets: ['pending', 'prepared', 'returned'],
    linenRequirements: ['pending', 'prepared', 'returned'],
    equipmentChecklist: ['pending', 'prepared', 'returned'],
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
  const canEditDraftContract = contract ? contract.status === 'draft' && (isSales() || isAdmin()) : false;
  const openContractEditor = (editorTab: 'client' | 'event' | 'package' | 'addons' | 'summary') => {
    navigate(`/contracts/edit/${id}?tab=${editorTab}`);
  };
  const renderTabEditButton = (editorTab: 'client' | 'event' | 'package' | 'addons' | 'summary', label = 'Edit This Section') => (
    canEditDraftContract ? (
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
    sectionKey: 'creativeAssets' | 'linenRequirements' | 'equipmentChecklist',
    items: InventorySummaryItem[],
    canEdit: boolean
  ) => {
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
              {canEditDraftContract ? renderTabEditButton('addons') : null}
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
            {canConfirmFinalizationSections ? renderReferenceBadge('Reference View') : null}
            {canEditDraftContract ? renderTabEditButton('addons') : null}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item, index) => (
              <div key={`${sectionKey}-${item.itemName}-${index}`} className="flex gap-4 rounded-lg border p-4">
                <button
                  type="button"
                  className={`h-28 w-28 shrink-0 overflow-hidden rounded-md bg-muted ${item.imageUrl ? 'cursor-zoom-in' : 'cursor-default'}`}
                  onClick={() => item.imageUrl && setPreviewImage({ url: item.imageUrl, title: item.itemName })}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.itemName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
                      No image saved
                    </div>
                  )}
                </button>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[item.itemCode, item.category].filter(Boolean).join(' | ') || 'Inventory item'}
                      </p>
                    </div>
                    <Badge variant="outline">Qty {item.requestedQuantity}</Badge>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div className="flex justify-between gap-4">
                      <span>Available for event date</span>
                      <span className="font-medium text-foreground">{item.availableQuantity ?? '-'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Reserved on same date</span>
                      <span className="font-medium text-foreground">{item.reservedOnDate}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Inventory status</span>
                      <span className="font-medium text-foreground">{item.inventoryStatus.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={item.enoughStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {item.enoughStock ? 'Enough stock' : 'Stock shortage'}
                    </Badge>
                    <Badge className={item.readyForDispatch ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                      {item.readyForDispatch ? 'Ready for dispatch' : 'Not ready for dispatch'}
                    </Badge>
                  </div>

                  {item.blockers.length > 0 ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      {item.blockers.join(' ')}
                    </div>
                  ) : null}

                  {canEdit ? (
                    <div className="space-y-2">
                      <Label>Checklist Status</Label>
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
                              {statusOption.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Checklist Status: </span>
                      <span className="font-medium">{item.itemStatus.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const canViewDetailsTab = true;
  const canViewMenuTab = isAdmin() || isSales() || isKitchen() || isPurchasing() || isBanquet();
  const canViewInventoryTab = isAdmin() || isCreative() || isLinen() || isLogistics() || isSales();
  const canViewPaymentsTab = isAdmin() || isAccounting() || isSales();
  const canViewLogisticsTab = isAdmin() || isLogistics() || isBanquet() || isSales();
  const canViewPreferencesTab = isAdmin() || isSales() || isCreative() || isLinen() || isKitchen() || isPurchasing() || isBanquet();
  const canViewTimelineTab = role !== 'accounting';
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
  const paymentTermConfirmed = isSectionConfirmed('payments');
  const paymentTermNeedsConfirmation = isPreSignatureStage && (
    !paymentTermConfirmed || pendingPaymentPlan !== savedPaymentPlan
  );
  const paymentPlanSummary = fullPaymentPlan
    ? isPreSignatureStage
      ? 'This records the agreed full-payment arrangement before signature. Payment posting starts only after the client signs.'
      : `Full payment must be settled before preparation approval and no later than ${finalBalanceDueDate.toLocaleDateString()}.`
    : isPreSignatureStage
      ? `This records the agreed ${downPaymentPercent}% / ${finalPaymentPercent}% arrangement before signature. Payment posting starts only after the client signs.`
      : `${downPaymentPercent}% is collected after signature for preparation release, and the remaining ${finalPaymentPercent}% stays due one month before the event.`;
  const menuItemCount = contract.menuDetails?.length || 0;
  const confirmedMenuCount = contract.menuDetails?.filter(item => item.confirmed).length || 0;
  const savedInventoryItemCount = (contract.creativeAssets?.length || 0)
    + (contract.linenRequirements?.length || 0)
    + (contract.equipmentChecklist?.length || 0);
  const creativeItems = operationsSummary?.inventory.creativeAssets || [];
  const linenItems = operationsSummary?.inventory.linenRequirements || [];
  const stockroomItems = operationsSummary?.inventory.equipmentChecklist || [];
  const allInventoryItems = [...creativeItems, ...linenItems, ...stockroomItems];
  const canViewCreativeInventorySection = isAdmin() || isCreative() || isSales();
  const canViewLinenInventorySection = isAdmin() || isLinen() || isSales();
  const canViewStockroomInventorySection = isAdmin() || isLogistics() || isSales();
  const visibleInventoryItems = [
    ...(canViewCreativeInventorySection ? creativeItems : []),
    ...(canViewLinenInventorySection ? linenItems : []),
    ...(canViewStockroomInventorySection ? stockroomItems : []),
  ];
  const hasVisibleInventoryItems = visibleInventoryItems.length > 0;
  const visibleInventoryItemsReady = hasVisibleInventoryItems
    ? visibleInventoryItems.every((item) => item.enoughStock && item.readyForDispatch && item.blockers.length === 0)
    : false;
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
  const logisticsBooked = Boolean(
    contract.logisticsAssignment?.truck
    || contract.logisticsAssignment?.driver
    || ((contract.logisticsAssignment?.assignmentStatus || 'pending') !== 'pending')
  );
  const logisticsClosedOut = !logisticsBooked || contract.logisticsAssignment?.assignmentStatus === 'completed';
  const creativeReturnsRemaining = (contract.creativeAssets || []).filter(item => item.status !== 'returned').length;
  const linenReturnsRemaining = (contract.linenRequirements || []).filter(item => item.status !== 'returned').length;
  const stockroomReturnsRemaining = (contract.equipmentChecklist || []).filter(item => item.status !== 'returned').length;
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
    closureIssues.push(`${creativeReturnsRemaining} creative item(s) still need return updates.`);
  }

  if (linenReturnsRemaining > 0) {
    closureIssues.push(`${linenReturnsRemaining} linen item(s) still need return updates.`);
  }

  if (stockroomReturnsRemaining > 0) {
    closureIssues.push(`${stockroomReturnsRemaining} stockroom item(s) still need return updates.`);
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
        detail: `${issueParts.join(' and ')} need attention before release.`,
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

  const inventoryReadiness: DepartmentReadiness = (() => {
    if (!savedInventoryItemCount) {
      return {
        key: 'inventory',
        label: 'Inventory',
        status: 'ready',
        detail: 'No inventory items are required for this contract.',
      };
    }

    if (isOperationsLoading) {
      return {
        key: 'inventory',
        label: 'Inventory',
        status: 'in_progress',
        detail: 'Loading same-day stock reservations and dispatch readiness...',
      };
    }

    if (!operationsSummary) {
      return {
        key: 'inventory',
        label: 'Inventory',
        status: 'in_progress',
        detail: `Saved ${savedInventoryItemCount} inventory ${pluralize(savedInventoryItemCount, 'item')}. Automated reservation checks are unavailable right now.`,
      };
    }

    if (!allInventoryItems.length) {
      return {
        key: 'inventory',
        label: 'Inventory',
        status: 'ready',
        detail: 'No inventory items are required for this contract.',
      };
    }

    const inventorySummary = operationsSummary.inventory;
    const readyCount = allInventoryItems.filter(item => item.readyForDispatch).length;
    const blockerCount = allInventoryItems.filter(item => item.blockers.length > 0).length;
    const shortageCount = inventorySummary.shortages.length;

    if (inventorySummary.allItemsReady) {
      return {
        key: 'inventory',
        label: 'Inventory',
        status: 'ready',
        detail: `All ${allInventoryItems.length} inventory ${pluralize(allInventoryItems.length, 'item')} are stocked and dispatch-ready.`,
      };
    }

    if (shortageCount > 0 || blockerCount > 0) {
      const issueParts = [];
      if (shortageCount > 0) {
        issueParts.push(`${shortageCount} same-day ${pluralize(shortageCount, 'shortage')}`);
      }
      if (blockerCount > 0) {
        issueParts.push(`${blockerCount} readiness ${pluralize(blockerCount, 'issue')}`);
      }

      return {
        key: 'inventory',
        label: 'Inventory',
        status: 'blocked',
        detail: `${issueParts.join(' and ')} are blocking release.`,
      };
    }

    if (readyCount > 0) {
      return {
        key: 'inventory',
        label: 'Inventory',
        status: 'in_progress',
        detail: `${readyCount} of ${allInventoryItems.length} inventory ${pluralize(allInventoryItems.length, 'item')} are dispatch-ready.`,
      };
    }

    return {
      key: 'inventory',
      label: 'Inventory',
      status: 'not_started',
      detail: `${allInventoryItems.length} inventory ${pluralize(allInventoryItems.length, 'item')} are saved but still pending prep updates.`,
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

  const preparationReadinessItems: DepartmentReadiness[] = [
    kitchenReadiness,
    inventoryReadiness,
    logisticsReadiness,
    creativeReadiness,
    linenReadiness,
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
        ? !paymentTermNeedsConfirmation && paymentTermConfirmed
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
  const preSignatureItems = finalizationItems.filter((item) => ['details', 'menu', 'payments'].includes(item.key));
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
      ? `Confirm these tabs before sending for signature: ${pendingPreSignatureLabels.join(', ')}.`
      : 'Every required tab is confirmed and the contract is ready to send for signature.'
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
  const canMarkLogisticsCompleted = !logisticsStatusWillChange && logisticsStatusValue === 'dispatched';
  const canSaveLogisticsBooking = Boolean(logisticsAssignment.truckId);

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
            <Button variant="outline" onClick={handleExportPdf}>
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => handlePrintSection(activeTab)}>
              <Printer className="mr-2 h-4 w-4" />
              Print {SECTION_PRINT_LABELS[activeTab] || 'Section'}
            </Button>
            
            {contract.status === 'draft' && (isSales() || isAdmin()) && (
              <>
                <Button variant="outline" onClick={() => navigate(`/contracts/edit/${id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  onClick={() => setSignatureDialogOpen(true)}
                  disabled={!allPreSignatureSectionsReady}
                  title={!allPreSignatureSectionsReady ? `Still waiting on: ${pendingPreSignatureLabels.join(', ')}` : undefined}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send For Signature
                </Button>
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
          </div>
        </div>

        {/* Readiness */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <CardTitle>{showPreparationReadiness ? 'Preparation Readiness' : 'Contract Progress'}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {showPreparationReadiness
                    ? 'Based on the saved contract plus automated same-day inventory and logistics checks.'
                    : 'Finalize the contract, collect the client signature, and release it to accounting before preparation begins.'}
                </p>
              </div>
              <Badge
                variant="outline"
                className={showPreparationReadiness ? READINESS_STATUS_META[overallReadinessStatus].badgeClassName : finalizationStatusClassName}
              >
                {showPreparationReadiness ? READINESS_STATUS_META[overallReadinessStatus].label : finalizationStatusLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showPreparationReadiness ? (
              <>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{readinessCounts.ready} of {preparationReadinessItems.length} departments ready</span>
                    <span className="text-muted-foreground">{readinessProgressValue}%</span>
                  </div>
                  <Progress value={readinessProgressValue} className="h-3" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {overallReadinessDetail} {readinessSummary}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {preparationReadinessItems.map((item) => {
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
                  Inventory and logistics already include same-day stock reservations plus driver and truck conflict checks.
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
                  <CardTitle>Contract Details Review</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {isPreSignatureStage ? renderReferenceBadge() : null}
                    {renderTabEditButton('client')}
                  </div>
                </CardHeader>
              </Card>
              <div className="grid gap-4 md:grid-cols-2">
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

              <Card className="md:col-span-2">
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
              {isOperationsLoading ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Loading automated inventory checks...
                </CardContent>
              </Card>
            ) : operationsSummary ? (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Inventory Readiness Overview</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={isContractClosed ? 'bg-purple-100 text-purple-800' : !canUpdatePreparation ? 'bg-slate-100 text-slate-700' : !hasVisibleInventoryItems ? 'bg-slate-100 text-slate-700' : visibleInventoryItemsReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {isContractClosed ? 'Closed contract' : !canUpdatePreparation ? 'Locked until approval' : !hasVisibleInventoryItems ? 'No assigned items' : visibleInventoryItemsReady ? 'All items ready' : 'Action needed'}
                      </Badge>
                      {renderTabEditButton('addons')}
                    </div>
                  </CardHeader>
                </Card>

                {canViewCreativeInventorySection && renderInventorySection(
                  'Creative And Decor',
                  <Palette className="h-5 w-5" />,
                  'creativeAssets',
                  operationsSummary?.inventory.creativeAssets || [],
                  canManageCreative
                )}

                {canViewLinenInventorySection && renderInventorySection(
                  'Linen Items',
                  <Shirt className="h-5 w-5" />,
                  'linenRequirements',
                  operationsSummary?.inventory.linenRequirements || [],
                  canManageLinen
                )}

                {canViewStockroomInventorySection && renderInventorySection(
                  'Stockroom And Equipment',
                  <Box className="h-5 w-5" />,
                  'equipmentChecklist',
                  operationsSummary?.inventory.equipmentChecklist || [],
                  canManageLogistics
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
                <CardContent className="py-10 text-center text-muted-foreground">
                  Automated inventory checks are unavailable for this contract right now, but the saved contract details are still available.
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
                            className={!paymentTermNeedsConfirmation && paymentTermConfirmed
                              ? READINESS_STATUS_META.ready.badgeClassName
                              : READINESS_STATUS_META.not_started.badgeClassName}
                          >
                            {!paymentTermNeedsConfirmation && paymentTermConfirmed ? 'Confirmed' : 'Pending Confirmation'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{paymentPlanSummary}</p>
                        {isPreSignatureStage && (
                          <p className="text-sm text-muted-foreground">
                            No payment receipt is needed yet. This only confirms the agreed payment term before the client signs.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2" data-print-hide="true">
                        {isPreSignatureStage && canConfigurePaymentPlan && (
                          <Button
                            type="button"
                            size="sm"
                            variant={paymentTermNeedsConfirmation ? 'default' : 'outline'}
                            onClick={() => handleUpdatePaymentPlan(pendingPaymentPlan)}
                            disabled={!paymentTermNeedsConfirmation}
                          >
                            {paymentTermNeedsConfirmation ? 'Confirm Payment Term' : 'Payment Term Confirmed'}
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
                          disabled={!canConfigurePaymentPlan}
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

          <TabsContent value="logistics" className="space-y-4">
            <div data-print-section="logistics" className="space-y-4">
              <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Logistics Booking
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

                    <div className="grid gap-4 xl:grid-cols-[0.95fr,1.35fr]">
                      <Card className="h-full border-slate-200 bg-slate-50/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Current Assignment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="rounded-xl border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Truck</p>
                            <p className="mt-1 font-semibold">{savedLogisticsTruck?.plateNumber || selectedLogisticsTruck?.plateNumber || 'Not booked yet'}</p>
                            <p className="text-sm text-muted-foreground">
                              {savedLogisticsTruck?.truckType?.replace(/_/g, ' ') || selectedLogisticsTruck?.truckType?.replace(/_/g, ' ') || 'No truck assigned'}
                            </p>
                          </div>
                          <div className="rounded-xl border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Driver</p>
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
                        </CardContent>
                      </Card>

                      <Card className="h-full border-slate-200 shadow-sm" data-print-hide="true">
                        <CardHeader className="pb-3">
                          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                            <CardTitle className="text-base">Manage Booking</CardTitle>
                            <div className="flex flex-wrap gap-2">
                              {operationsSummary.logistics.recommendedTruck && (
                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                                  Suggested Truck: {operationsSummary.logistics.recommendedTruck.plateNumber}
                                </Badge>
                              )}
                              {operationsSummary.logistics.recommendedDriver && (
                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                                  Suggested Driver: {operationsSummary.logistics.recommendedDriver.fullName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          {canManageLogistics ? (
                            <>
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
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr),minmax(0,1.1fr)]">
                                <div className="rounded-xl border bg-slate-50/70 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dispatch Status</p>
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
                                </div>

                                <div className="rounded-xl border p-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Day-Of Actions</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      variant={canMarkLogisticsDispatched ? 'default' : 'outline'}
                                      size="sm"
                                      disabled={!canMarkLogisticsDispatched}
                                      onClick={() => handleAdvanceLogisticsAssignment('dispatched')}
                                    >
                                      Mark Dispatched
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={canMarkLogisticsCompleted ? 'default' : 'outline'}
                                      size="sm"
                                      disabled={!canMarkLogisticsCompleted}
                                      onClick={() => handleAdvanceLogisticsAssignment('completed')}
                                    >
                                      Mark Completed
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={canSaveLogisticsBooking
                                      ? 'border-slate-200 bg-slate-50 text-slate-700'
                                      : 'border-amber-200 bg-amber-50 text-amber-900'}
                                  >
                                    {canSaveLogisticsBooking ? 'Ready To Save' : 'Truck Required'}
                                  </Badge>
                                  {logisticsStatusWillChange ? (
                                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
                                      Stage Updates On Save
                                    </Badge>
                                  ) : null}
                                </div>
                                <Button onClick={handleUpdateLogisticsAssignment} disabled={!canSaveLogisticsBooking}>Save Booking</Button>
                              </div>
                            </>
                          ) : (
                            <div className="rounded-xl border bg-slate-50/70 p-4 text-sm text-muted-foreground">
                              Read-only for this account.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2" data-print-hide="true">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Available Trucks For This Event</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {logisticsTruckOptions.length > 0 ? (
                            logisticsTruckOptions.map((truck) => {
                              const isRecommended = operationsSummary.logistics.recommendedTruck?._id === truck._id;
                              const isSelected = logisticsAssignment.truckId === truck._id;

                              return (
                                <div
                                  key={truck._id}
                                  className={`rounded-lg border p-4 ${isSelected ? 'border-blue-200 bg-blue-50/60' : ''}`}
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="font-medium">{truck.plateNumber}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {truck.truckType.replace(/_/g, ' ')} | {truck.capacityVolume || 0} m3
                                      </p>
                                      {truck.assignedDriver && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                          Assigned driver: {truck.assignedDriver.fullName}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {isRecommended && (
                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
                                          Best Match
                                        </Badge>
                                      )}
                                      {isSelected && (
                                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
                                          Selected
                                        </Badge>
                                      )}
                                      <Badge variant="outline">{formatStatusLabel(truck.status)}</Badge>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground">No available trucks for this event date.</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Available Drivers For This Event</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {logisticsDriverOptions.length > 0 ? (
                            logisticsDriverOptions.map((driver) => {
                              const isRecommended = operationsSummary.logistics.recommendedDriver?._id === driver._id;
                              const isSelected = logisticsAssignment.driverId === driver._id;

                              return (
                                <div
                                  key={driver._id}
                                  className={`rounded-lg border p-4 ${isSelected ? 'border-blue-200 bg-blue-50/60' : ''}`}
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="font-medium">{driver.fullName}</p>
                                      <p className="text-sm text-muted-foreground">{driver.driverId}</p>
                                      {driver.phone && (
                                        <p className="mt-1 text-sm text-muted-foreground">{driver.phone}</p>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {isRecommended && (
                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
                                          Best Match
                                        </Badge>
                                      )}
                                      {isSelected && (
                                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
                                          Selected
                                        </Badge>
                                      )}
                                      <Badge variant="outline">{formatStatusLabel(driver.status)}</Badge>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground">No available drivers for this event date.</p>
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
                                  value={logisticsAssignment.assignmentStatus}
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
                                    <SelectItem value="completed">completed</SelectItem>
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
                              <Button data-print-hide="true" onClick={handleUpdateLogisticsAssignment}>Save Truck Booking</Button>
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
