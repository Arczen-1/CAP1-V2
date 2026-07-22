import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import AccountingProcurementQueue from '@/components/AccountingProcurementQueue';
import AccountingFinanceModule from '@/components/AccountingFinanceModule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpDown,
  Calculator,
  CheckCircle,
  PhilippinePeso,
  FileText,
  Filter,
  Receipt,
  Search,
  TrendingUp,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getSortTimestamp } from '@/lib/worklist';
import { toast } from 'sonner';

interface Payment {
  amount: number;
  date: string;
  method: string;
  reference?: string;
  receiptNumber?: string;
  receiptImageUrl?: string;
  status: string;
}

interface Contract {
  _id: string;
  contractNumber: string;
  createdAt?: string;
  bookingDate?: string;
  clientName: string;
  clientType: string;
  eventDate: string;
  finalDetailsDeadline?: string;
  status: string;
  totalPacks: number;
  packagePrice: number;
  totalContractValue: number;
  paymentStatus: string;
  payments: Payment[];
  clientSigned?: boolean;
  clientSignedAt?: string;
  downPaymentPercent?: number;
  finalPaymentPercent?: number;
  reservationFeeAmount?: number;
  battableSales?: boolean;
  governmentSales?: boolean;
}

type SortOrder = 'created_desc' | 'created_asc' | 'balance_desc';
type AccountingStatusFilter = 'all' | 'reservation_fee_due' | 'forty_percent_due' | 'aging_30_days' | 'uncollectible' | 'final_balance_due' | 'released' | 'fully_paid';

const RESERVATION_FEE_AMOUNT = 30000;
const DEFAULT_DOWN_PAYMENT_PERCENT = 40;
const DEFAULT_FINAL_PAYMENT_PERCENT = 60;
const PAYMENT_AGING_WINDOW_DAYS = 30;

const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'gcash', label: 'GCash' },
  { value: 'ewallet', label: 'E-Wallet' },
];

const ACCOUNTING_STATUS_OPTIONS: Array<{ value: AccountingStatusFilter; label: string }> = [
  { value: 'all', label: 'All Accounting Status' },
  { value: 'reservation_fee_due', label: 'Reservation Fee Due' },
  { value: 'forty_percent_due', label: '40% Due' },
  { value: 'aging_30_days', label: 'Aging 30 Days' },
  { value: 'uncollectible', label: 'Uncollectible' },
  { value: 'final_balance_due', label: 'Final Balance Due' },
  { value: 'released', label: 'Released' },
  { value: 'fully_paid', label: 'Fully Paid' },
];

const formatCurrency = (value = 0) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

const formatStatusLabel = (value?: string) => (value || '').replace(/_/g, ' ');
const formatPaymentMethod = (value?: string) => (value || '').replace(/_/g, ' ');
const formatDate = (value?: string | Date) => {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(typeof value === 'string' ? new Date(value) : value);
};

const getMonthValue = (value = new Date()) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

const getDownPaymentPercent = (contract: Contract) => {
  const parsed = Number(contract.downPaymentPercent);
  const parsedFinal = Number(contract.finalPaymentPercent);

  if (parsed === 60 && parsedFinal === 40) {
    return DEFAULT_DOWN_PAYMENT_PERCENT;
  }

  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DOWN_PAYMENT_PERCENT;
};

const getFinalPaymentPercent = (contract: Contract) => {
  const parsedDownPaymentPercent = Number(contract.downPaymentPercent);
  const parsedFinalPaymentPercent = Number(contract.finalPaymentPercent);

  if (parsedDownPaymentPercent === 60 && parsedFinalPaymentPercent === 40) {
    return DEFAULT_FINAL_PAYMENT_PERCENT;
  }

  return Number.isFinite(parsedFinalPaymentPercent)
    ? Math.max(0, parsedFinalPaymentPercent)
    : Math.max(0, DEFAULT_FINAL_PAYMENT_PERCENT);
};

const isFullPaymentPlan = (downPaymentPercent: number, finalPaymentPercent: number) => (
  downPaymentPercent >= 100 || finalPaymentPercent <= 0
);

const addDays = (value: string | Date, days: number) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const addMonths = (value: string | Date, months: number) => {
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date;
};

const endOfDay = (value: string | Date) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const getPaymentMilestones = (contract: Contract) => {
  const totalPaid = contract.payments
    ?.filter(payment => payment.status === 'completed')
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
  const downPaymentPercent = getDownPaymentPercent(contract);
  const finalPaymentPercent = getFinalPaymentPercent(contract);
  const fullPaymentPlan = isFullPaymentPlan(downPaymentPercent, finalPaymentPercent);
  const reservationFee = Number(contract.reservationFeeAmount) || RESERVATION_FEE_AMOUNT;
  const requiredDownPayment = Math.round((contract.totalContractValue || 0) * (downPaymentPercent / 100) * 100) / 100;
  const remainingBalance = Math.max(0, (contract.totalContractValue || 0) - totalPaid);
  const bookingDate = contract.bookingDate || contract.createdAt || new Date().toISOString();
  const fortyPercentDueDate = addMonths(bookingDate, 2);
  const fortyPercentFollowUpDate = addMonths(fortyPercentDueDate, -1);
  const finalBalanceDueDate = getFinalBalanceDueDate(contract);
  const agingEndsAt = addDays(fortyPercentDueDate, PAYMENT_AGING_WINDOW_DAYS);
  const fullyPaid = totalPaid >= (contract.totalContractValue || 0);
  const reservationFeePaid = totalPaid >= Math.min(reservationFee, contract.totalContractValue || 0);
  const downPaymentSatisfied = fullPaymentPlan ? fullyPaid : totalPaid >= requiredDownPayment;
  const fortyPercentPastDue = !downPaymentSatisfied && new Date() > endOfDay(fortyPercentDueDate);
  const finalBalancePastDue = !fullyPaid && new Date() > endOfDay(finalBalanceDueDate);
  const uncollectible = !downPaymentSatisfied && new Date() > endOfDay(agingEndsAt);
  const paymentRequirementMet = fullPaymentPlan ? fullyPaid : finalBalancePastDue ? fullyPaid : downPaymentSatisfied;

  return {
    totalPaid,
    downPaymentPercent,
    finalPaymentPercent,
    fullPaymentPlan,
    reservationFee,
    reservationFeePaid,
    requiredDownPayment,
    remainingReservationFee: Math.max(0, Math.min(reservationFee, contract.totalContractValue || 0) - totalPaid),
    remainingDeposit: Math.max(0, requiredDownPayment - totalPaid),
    remainingBalance,
    downPaymentSatisfied,
    fullyPaid,
    bookingDate,
    fortyPercentDueDate,
    fortyPercentFollowUpDate,
    finalBalanceDueDate,
    agingEndsAt,
    fortyPercentPastDue,
    finalBalancePastDue,
    uncollectible,
    paymentRequirementMet,
    paymentRequirementRemaining: fullPaymentPlan ? remainingBalance : finalBalancePastDue ? remainingBalance : Math.max(0, requiredDownPayment - totalPaid),
    paymentHoldActive: (fortyPercentPastDue || finalBalancePastDue) && !fullyPaid,
  };
};

const getFinalBalanceDueDate = (contract: Contract) => {
  const dueDate = new Date(contract.eventDate);
  dueDate.setMonth(dueDate.getMonth() - 2);
  return dueDate;
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'partially_paid':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-red-100 text-red-800';
  }
};

const getContractStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'accounting_review':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

const getAccountingStage = (contract: Contract): Exclude<AccountingStatusFilter, 'all'> => {
  const milestones = getPaymentMilestones(contract);

  if (milestones.fullyPaid) {
    return 'fully_paid';
  }

  if (milestones.uncollectible) {
    return 'uncollectible';
  }

  if (milestones.fortyPercentPastDue) {
    return 'aging_30_days';
  }

  if (milestones.finalBalancePastDue) {
    return 'final_balance_due';
  }

  if (!milestones.reservationFeePaid) {
    return 'reservation_fee_due';
  }

  if (!milestones.downPaymentSatisfied) {
    return 'forty_percent_due';
  }

  return 'released';
};

const getAccountingStageMeta = (contract: Contract) => {
  const stage = getAccountingStage(contract);

  switch (stage) {
    case 'reservation_fee_due':
      return {
        label: 'Reservation Fee Due',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
      };
    case 'forty_percent_due':
      return {
        label: '40% Due',
        className: 'border-blue-200 bg-blue-50 text-blue-800',
      };
    case 'aging_30_days':
      return {
        label: 'Aging 30 Days',
        className: 'border-orange-200 bg-orange-50 text-orange-800',
      };
    case 'uncollectible':
      return {
        label: 'Uncollectible Review',
        className: 'border-red-200 bg-red-50 text-red-800',
      };
    case 'final_balance_due':
      return {
        label: 'Final Balance Due',
        className: 'border-red-200 bg-red-50 text-red-800',
      };
    case 'fully_paid':
      return {
        label: 'Fully Paid',
        className: 'border-green-200 bg-green-50 text-green-800',
      };
    case 'released':
      return {
        label: 'Released',
        className: 'border-blue-200 bg-blue-50 text-blue-800',
      };
    default:
      return {
        label: 'Released',
        className: 'border-blue-200 bg-blue-50 text-blue-800',
      };
  }
};

const getNextStepMeta = (contract: Contract) => {
  const milestones = getPaymentMilestones(contract);
  if (!contract.clientSigned) {
    return {
      title: 'Waiting for client signature',
      note: 'Sales needs to complete contract signing before accounting records payment.',
      className: 'text-slate-700',
    };
  }

  if (contract.status === 'completed') {
    return {
      title: 'Contract closed',
      note: 'No further finance action is needed unless a report or receipt review is requested.',
      className: 'text-green-700',
    };
  }

  if (milestones.paymentHoldActive) {
    if (milestones.uncollectible) {
      return {
        title: 'Review uncollectible account',
        note: `The 40% milestone passed the aging window on ${formatDate(milestones.agingEndsAt)}.`,
        className: 'text-red-700',
      };
    }

    if (milestones.fortyPercentPastDue) {
      return {
        title: 'Aging follow-up',
        note: `Collect ${formatCurrency(milestones.remainingDeposit)} before aging ends on ${formatDate(milestones.agingEndsAt)}.`,
        className: 'text-orange-700',
      };
    }

    return {
      title: 'Collect final 60% balance',
      note: `${formatCurrency(milestones.remainingBalance)} is overdue since ${formatDate(milestones.finalBalanceDueDate)}.`,
      className: 'text-red-700',
    };
  }

  if (!milestones.reservationFeePaid) {
    return {
      title: 'Post reservation fee',
      note: `${formatCurrency(milestones.remainingReservationFee)} remains from the non-refundable reservation fee.`,
      className: 'text-amber-700',
    };
  }

  if (!milestones.paymentRequirementMet) {
    return {
      title: milestones.fullPaymentPlan ? 'Record full payment' : 'Collect 40% milestone',
      note: `${formatCurrency(milestones.paymentRequirementRemaining)} is still needed by ${formatDate(milestones.fortyPercentDueDate)} before preparation release.`,
      className: 'text-amber-700',
    };
  }

  if (['submitted', 'accounting_review'].includes(contract.status)) {
    return {
      title: 'Approve for preparation',
      note: 'Payment requirement is met. Accounting can release this contract to operations.',
      className: 'text-green-700',
    };
  }

  if (!milestones.fullyPaid) {
    return {
      title: 'Track final 60% balance',
      note: `${formatCurrency(milestones.remainingBalance)} remains due by ${formatDate(milestones.finalBalanceDueDate)}.`,
      className: 'text-blue-700',
    };
  }

  return {
    title: 'Financially settled',
    note: 'All required payments have been posted for this contract.',
    className: 'text-green-700',
  };
};

export default function AccountingDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPaid: 0,
    totalPending: 0,
    pendingApproval: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountingStatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('created_desc');
  const [reportMonth, setReportMonth] = useState(getMonthValue());
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentReference('');
    setReceiptNumber('');
    setReceiptImageUrl('');
  };

  const fetchData = async () => {
    try {
      const contractsData = await api.getContracts();
      setContracts(contractsData);

      const totalRevenue = contractsData.reduce((sum: number, contract: Contract) => sum + (contract.totalContractValue || 0), 0);
      const totalPaid = contractsData.reduce((sum: number, contract: Contract) => {
        return sum + getPaymentMilestones(contract).totalPaid;
      }, 0);
      const pendingApproval = contractsData.filter((contract: Contract) => (
        ['submitted', 'accounting_review'].includes(contract.status)
        && getPaymentMilestones(contract).paymentRequirementMet
      )).length;

      setStats({
        totalRevenue,
        totalPaid,
        totalPending: Math.max(0, totalRevenue - totalPaid),
        pendingApproval,
      });
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const openDepositPaymentDialog = (contract: Contract, amountNeeded: number) => {
    setSelectedContract(contract);
    resetPaymentForm();
    setPaymentAmount(amountNeeded > 0 ? amountNeeded.toFixed(2).replace(/\.00$/, '') : '');
    setPaymentDialogOpen(true);
  };

  const handleApprove = async (contract: Contract) => {
    const milestones = getPaymentMilestones(contract);

    if (!milestones.paymentRequirementMet) {
      const amountNeeded = milestones.finalBalancePastDue
        ? milestones.remainingBalance
        : !milestones.reservationFeePaid
          ? milestones.remainingReservationFee
          : milestones.paymentRequirementRemaining;
      openDepositPaymentDialog(contract, amountNeeded);
      toast.info(
        milestones.uncollectible
          ? `The 40% collection passed the aging window on ${milestones.agingEndsAt.toLocaleDateString()}. Resolve this account before preparation release.`
          : milestones.fortyPercentPastDue
            ? `The 40% collection was due on ${milestones.fortyPercentDueDate.toLocaleDateString()}. Post the remaining ${formatCurrency(milestones.remainingDeposit)} before approval.`
          : milestones.finalBalancePastDue
            ? `The final 60% balance must be settled by ${milestones.finalBalanceDueDate.toLocaleDateString()} or the event cannot proceed.`
          : milestones.fullPaymentPlan
            ? `Confirm the full payment of ${formatCurrency(milestones.requiredDownPayment)} before approving this contract for preparation.`
            : !milestones.reservationFeePaid
              ? `Post the non-refundable reservation fee of ${formatCurrency(milestones.reservationFee)} before continuing collection.`
              : `Confirm the required ${milestones.downPaymentPercent}% collection of ${formatCurrency(milestones.requiredDownPayment)} before approving this contract for preparation.`
      );
      return;
    }

    try {
      await api.approveContract(contract._id);
      toast.success('Contract approved for preparation!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve contract');
    }
  };

  const handleOpenPaymentDialog = (contract: Contract) => {
    setSelectedContract(contract);
    resetPaymentForm();
    setPaymentDialogOpen(true);
  };

  const handlePaymentDialogChange = (open: boolean) => {
    setPaymentDialogOpen(open);
    if (!open) {
      setSelectedContract(null);
      resetPaymentForm();
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

  const handleAddPayment = async () => {
    if (!selectedContract) {
      return;
    }

    const amount = Number(paymentAmount);
    const { remainingBalance } = getPaymentMilestones(selectedContract);

    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }

    if (amount > remainingBalance) {
      toast.error('Payment cannot be higher than the remaining contract balance');
      return;
    }

    if (!receiptNumber.trim()) {
      toast.error('Provisional receipt number is required');
      return;
    }

    try {
      await api.addPayment(selectedContract._id, {
        amount,
        method: paymentMethod,
        reference: paymentReference.trim() || undefined,
        receiptNumber: receiptNumber.trim(),
        receiptImageUrl: receiptImageUrl || undefined,
        date: new Date().toISOString(),
        status: 'completed',
      });
      toast.success('Payment posted successfully');
      handlePaymentDialogChange(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add payment');
    }
  };

  const accountingContracts = contracts.filter((contract) => (
    contract.clientSigned
    || ['submitted', 'accounting_review', 'approved', 'completed'].includes(contract.status)
    || (contract.payments?.length ?? 0) > 0
  ));
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredContracts = [...accountingContracts]
    .filter((contract) => {
      const stage = getAccountingStage(contract);
      const matchesSearch = !normalizedSearch
        || contract.clientName.toLowerCase().includes(normalizedSearch)
        || contract.contractNumber.toLowerCase().includes(normalizedSearch)
        || contract.clientType.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || stage === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((left, right) => {
      if (sortOrder === 'balance_desc') {
        return getPaymentMilestones(right).remainingBalance - getPaymentMilestones(left).remainingBalance;
      }

      const leftTime = getSortTimestamp(left.createdAt, left.eventDate);
      const rightTime = getSortTimestamp(right.createdAt, right.eventDate);
      const timeDelta = sortOrder === 'created_desc' ? rightTime - leftTime : leftTime - rightTime;

      if (timeDelta !== 0) {
        return timeDelta;
      }

      return sortOrder === 'created_desc'
        ? right.contractNumber.localeCompare(left.contractNumber)
        : left.contractNumber.localeCompare(right.contractNumber);
    });
  const filteredStageCounts = filteredContracts.reduce((summary, contract) => {
    const stage = getAccountingStage(contract);
    summary[stage] += 1;
    return summary;
  }, {
    reservation_fee_due: 0,
    forty_percent_due: 0,
    aging_30_days: 0,
    uncollectible: 0,
    final_balance_due: 0,
    released: 0,
    fully_paid: 0,
  });
  const monthlyReceipts = accountingContracts
    .flatMap((contract) => (
      contract.payments
        ?.filter((payment) => payment.status === 'completed')
        .map((payment) => ({
          ...payment,
          contractId: contract._id,
          contractNumber: contract.contractNumber,
          clientName: contract.clientName,
          eventDate: contract.eventDate,
        })) || []
    ))
    .filter((payment) => getMonthValue(new Date(payment.date)) === reportMonth)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  const reportSummary = monthlyReceipts.reduce((summary, payment) => {
    const amount = Number(payment.amount) || 0;
    const method = payment.method || '';
    const isDigital = ['bank_transfer', 'credit_card', 'gcash', 'ewallet'].includes(method);

    summary.receipts += 1;
    summary.totalCollected += amount;

    if (isDigital) {
      summary.digitalCollected += amount;
    } else {
      summary.overTheCounterCollected += amount;
    }

    return summary;
  }, {
    receipts: 0,
    totalCollected: 0,
    digitalCollected: 0,
    overTheCounterCollected: 0,
  });
  const accountsReceivableSummary = accountingContracts.reduce((summary, contract) => {
    const milestones = getPaymentMilestones(contract);
    const stage = getAccountingStage(contract);

    summary.outstanding += milestones.remainingBalance;

    if (stage === 'reservation_fee_due') {
      summary.reservationFeeDue += milestones.remainingReservationFee;
      summary.reservationFeeAccounts += 1;
    }

    if (stage === 'forty_percent_due') {
      summary.fortyPercentDue += milestones.paymentRequirementRemaining;
      summary.fortyPercentAccounts += 1;
    }

    if (stage === 'aging_30_days') {
      summary.agingAmount += milestones.remainingDeposit;
      summary.agingAccounts += 1;
    }

    if (stage === 'uncollectible') {
      summary.uncollectibleAmount += milestones.remainingDeposit;
      summary.uncollectibleAccounts += 1;
    }

    if (stage === 'final_balance_due') {
      summary.finalBalanceDue += milestones.remainingBalance;
      summary.finalBalanceAccounts += 1;
    }

    return summary;
  }, {
    outstanding: 0,
    reservationFeeDue: 0,
    reservationFeeAccounts: 0,
    fortyPercentDue: 0,
    fortyPercentAccounts: 0,
    agingAmount: 0,
    agingAccounts: 0,
    uncollectibleAmount: 0,
    uncollectibleAccounts: 0,
    finalBalanceDue: 0,
    finalBalanceAccounts: 0,
  });
  const upcomingCollectionRows = accountingContracts
    .filter((contract) => !getPaymentMilestones(contract).fullyPaid)
    .map((contract) => {
      const milestones = getPaymentMilestones(contract);
      const stage = getAccountingStage(contract);
      const nextDueDate = !milestones.reservationFeePaid
        ? new Date(milestones.bookingDate)
        : !milestones.downPaymentSatisfied
          ? milestones.fortyPercentDueDate
          : milestones.finalBalanceDueDate;
      const amountDue = !milestones.reservationFeePaid
        ? milestones.remainingReservationFee
        : !milestones.downPaymentSatisfied
          ? milestones.paymentRequirementRemaining
          : milestones.remainingBalance;

      return {
        contract,
        milestones,
        stage,
        nextDueDate,
        amountDue,
      };
    })
    .sort((left, right) => new Date(left.nextDueDate).getTime() - new Date(right.nextDueDate).getTime())
    .slice(0, 8);
  const reportMonthLabel = new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${reportMonth}-01T12:00:00`));
  const selectedContractMilestones = selectedContract ? getPaymentMilestones(selectedContract) : null;

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
          <h1 className="text-3xl font-bold tracking-tight">Accounting Dashboard</h1>
          <p className="text-muted-foreground">
            Release signed contracts after payment validation and keep the final balance on schedule.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Contract Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">All active contract value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <PhilippinePeso className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</div>
              <p className="text-xs text-muted-foreground">All completed payments across contracts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <Calculator className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalPending)}</div>
              <p className="text-xs text-muted-foreground">Remaining balance across contracts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Release</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApproval}</div>
              <p className="text-xs text-muted-foreground">Signed contracts not yet released to prep</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by client, contract number, or event type..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row xl:w-auto">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AccountingStatusFilter)}>
                  <SelectTrigger className="w-full sm:w-56">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by accounting status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNTING_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                  <SelectTrigger className="w-full sm:w-56">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by created date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_desc">Newest Contract First</SelectItem>
                    <SelectItem value="created_asc">Oldest Contract First</SelectItem>
                    <SelectItem value="balance_desc">Outstanding Balance: Highest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="procurement">Procurement Approval</TabsTrigger>
            <TabsTrigger value="reports">Monthly Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Reservation Fee Due</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-700">{filteredStageCounts.reservation_fee_due}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Signed contracts missing the PHP 30,000 booking validation</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">40% Due</p>
                  <p className="mt-2 text-2xl font-semibold text-blue-700">{filteredStageCounts.forty_percent_due}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Accounts before the 2-month collection due date</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Aging / Uncollectible</p>
                  <p className="mt-2 text-2xl font-semibold text-orange-700">{filteredStageCounts.aging_30_days + filteredStageCounts.uncollectible}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Overdue 40% collections needing follow-up</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Final Balance Due</p>
                  <p className="mt-2 text-2xl font-semibold text-red-700">{filteredStageCounts.final_balance_due}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Final 60% balances past due before event execution</p>
                </CardContent>
              </Card>
            </div>

            {filteredContracts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">No accounting contracts found</h3>
                  <p className="max-w-md text-muted-foreground">
                    Try adjusting the search or filter to find a contract that needs payment handling.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="hidden md:block">
                  <Card className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Contract</TableHead>
                          <TableHead>Financials</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[280px]">Next Step</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContracts.map((contract) => {
                          const milestones = getPaymentMilestones(contract);
                          const nextStep = getNextStepMeta(contract);
                          const stageMeta = getAccountingStageMeta(contract);
                          const fullPaymentPlan = isFullPaymentPlan(milestones.downPaymentPercent, milestones.finalPaymentPercent);

                          return (
                            <TableRow key={contract._id}>
                              <TableCell className="align-top">
                                <div className="space-y-1">
                                  <div className="font-medium">{formatDate(contract.eventDate)}</div>
                                  <div className="text-xs text-muted-foreground">{contract.clientType}</div>
                                  <div className="text-xs text-muted-foreground">{contract.totalPacks || 0} pax</div>
                                </div>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="space-y-1">
                                  <div className="font-semibold">{contract.contractNumber}</div>
                                  <div className="text-sm text-foreground">{contract.clientName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {contract.clientSignedAt ? `Signed ${formatDate(contract.clientSignedAt)}` : 'Signature still pending'}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="space-y-1 text-sm">
                                  <div>Total: <span className="font-medium">{formatCurrency(contract.totalContractValue)}</span></div>
                                  <div>Paid: <span className="font-medium text-green-700">{formatCurrency(milestones.totalPaid)}</span></div>
                                  <div>Balance: <span className="font-medium text-orange-700">{formatCurrency(milestones.remainingBalance)}</span></div>
                                  <div className="text-xs text-muted-foreground">
                                    {fullPaymentPlan
                                      ? `Full payment plan. Target ${formatDate(milestones.fortyPercentDueDate)}`
                                      : `${milestones.downPaymentPercent}% due ${formatDate(milestones.fortyPercentDueDate)} | Final ${milestones.finalPaymentPercent}% due ${formatDate(milestones.finalBalanceDueDate)}`}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="flex flex-col gap-2">
                                  <Badge variant="outline" className={stageMeta.className}>
                                    {stageMeta.label}
                                  </Badge>
                                  <Badge className={getContractStatusColor(contract.status)}>
                                    {formatStatusLabel(contract.status)}
                                  </Badge>
                                  <Badge className={getPaymentStatusColor(contract.paymentStatus || 'unpaid')}>
                                    {formatStatusLabel(contract.paymentStatus || 'unpaid')}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="space-y-1">
                                  <p className={`font-medium ${nextStep.className}`}>{nextStep.title}</p>
                                  <p className="text-sm text-muted-foreground">{nextStep.note}</p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top text-right">
                                <div className="flex flex-col items-end gap-2">
                                  <Button variant="outline" asChild>
                                    <Link to={`/contracts/${contract._id}?tab=payments`}>View Payments</Link>
                                  </Button>
                                  {contract.clientSigned && !milestones.fullyPaid ? (
                                    <Button variant="secondary" onClick={() => handleOpenPaymentDialog(contract)}>
                                      <PhilippinePeso className="mr-2 h-4 w-4" />
                                      Record Payment
                                    </Button>
                                  ) : null}
                                  {['submitted', 'accounting_review'].includes(contract.status) ? (
                                    <Button onClick={() => handleApprove(contract)}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </Button>
                                  ) : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                </div>

                <div className="grid gap-3 md:hidden">
                  {filteredContracts.map((contract) => {
                    const milestones = getPaymentMilestones(contract);
                    const nextStep = getNextStepMeta(contract);
                    const stageMeta = getAccountingStageMeta(contract);
                    const fullPaymentPlan = isFullPaymentPlan(milestones.downPaymentPercent, milestones.finalPaymentPercent);

                    return (
                      <Card key={contract._id}>
                        <CardContent className="space-y-4 p-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold">{contract.contractNumber}</span>
                              <Badge variant="outline" className={stageMeta.className}>
                                {stageMeta.label}
                              </Badge>
                            </div>
                            <div>
                              <div className="font-medium">{contract.clientName}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(contract.eventDate)} | {contract.clientType}
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border p-3 text-sm">
                              <p className="text-muted-foreground">Financials</p>
                              <p className="mt-1 font-medium">{formatCurrency(contract.totalContractValue)}</p>
                              <p className="text-xs text-green-700">Paid: {formatCurrency(milestones.totalPaid)}</p>
                              <p className="text-xs text-orange-700">Balance: {formatCurrency(milestones.remainingBalance)}</p>
                            </div>
                            <div className="rounded-lg border p-3 text-sm">
                              <p className="text-muted-foreground">Payment Plan</p>
                              <p className="mt-1 font-medium">
                                {fullPaymentPlan ? 'Full payment' : `${milestones.downPaymentPercent}% / ${milestones.finalPaymentPercent}%`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {fullPaymentPlan
                                  ? `Target ${formatDate(milestones.fortyPercentDueDate)}`
                                  : `40% due ${formatDate(milestones.fortyPercentDueDate)} | Final due ${formatDate(milestones.finalBalanceDueDate)}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge className={getContractStatusColor(contract.status)}>
                              {formatStatusLabel(contract.status)}
                            </Badge>
                            <Badge className={getPaymentStatusColor(contract.paymentStatus || 'unpaid')}>
                              {formatStatusLabel(contract.paymentStatus || 'unpaid')}
                            </Badge>
                          </div>

                          <div>
                            <p className={`font-medium ${nextStep.className}`}>{nextStep.title}</p>
                            <p className="text-sm text-muted-foreground">{nextStep.note}</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                              <Link to={`/contracts/${contract._id}?tab=payments`}>View Payments</Link>
                            </Button>
                            {contract.clientSigned && !milestones.fullyPaid ? (
                              <Button variant="secondary" onClick={() => handleOpenPaymentDialog(contract)}>
                                Record Payment
                              </Button>
                            ) : null}
                            {['submitted', 'accounting_review'].includes(contract.status) ? (
                              <Button onClick={() => handleApprove(contract)}>Approve</Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
            <AccountingFinanceModule />
          </TabsContent>

          <TabsContent value="procurement" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Procurement Approval Queue</h2>
                  <p className="text-sm text-muted-foreground">
                    Review budget requests first, then confirm the proof of purchase after Purchasing submits the receipt or invoice.
                  </p>
                </div>
              </CardContent>
            </Card>

            <AccountingProcurementQueue />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Accounting Reports</h2>
                  <p className="text-sm text-muted-foreground">
                    Monitor collections, aging accounts, outstanding balances, and posted receipts for {reportMonthLabel}.
                  </p>
                </div>
                <div className="w-full md:w-56">
                  <Label htmlFor="report-month">Report Month</Label>
                  <Input
                    id="report-month"
                    type="month"
                    value={reportMonth}
                    onChange={(event) => setReportMonth(event.target.value || getMonthValue())}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total AR Outstanding</p>
                  <p className="mt-2 text-2xl font-semibold text-orange-700">{formatCurrency(accountsReceivableSummary.outstanding)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">All open receivables across active accounting contracts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Month Collected</p>
                  <p className="mt-2 text-2xl font-semibold text-green-700">{formatCurrency(reportSummary.totalCollected)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Receipts posted in {reportMonthLabel}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Aging Exposure</p>
                  <p className="mt-2 text-2xl font-semibold text-red-700">{formatCurrency(accountsReceivableSummary.agingAmount + accountsReceivableSummary.uncollectibleAmount)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{accountsReceivableSummary.agingAccounts + accountsReceivableSummary.uncollectibleAccounts} account(s) past the 40% due date</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Final Balance Risk</p>
                  <p className="mt-2 text-2xl font-semibold text-red-700">{formatCurrency(accountsReceivableSummary.finalBalanceDue)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{accountsReceivableSummary.finalBalanceAccounts} event(s) past the final 60% due date</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>AR Aging Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">Reservation Fee Due</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(accountsReceivableSummary.reservationFeeDue)}</p>
                      <p className="text-xs text-muted-foreground">{accountsReceivableSummary.reservationFeeAccounts} account(s)</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">40% Collection Due</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(accountsReceivableSummary.fortyPercentDue)}</p>
                      <p className="text-xs text-muted-foreground">{accountsReceivableSummary.fortyPercentAccounts} account(s)</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">Aging 30 Days</p>
                      <p className="mt-1 text-lg font-semibold text-orange-700">{formatCurrency(accountsReceivableSummary.agingAmount)}</p>
                      <p className="text-xs text-muted-foreground">{accountsReceivableSummary.agingAccounts} account(s)</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">Uncollectible Review</p>
                      <p className="mt-1 text-lg font-semibold text-red-700">{formatCurrency(accountsReceivableSummary.uncollectibleAmount)}</p>
                      <p className="text-xs text-muted-foreground">{accountsReceivableSummary.uncollectibleAccounts} account(s)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Collection Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingCollectionRows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No open collection tasks right now.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingCollectionRows.map(({ contract, stage, nextDueDate, amountDue }) => {
                        const stageMeta = getAccountingStageMeta(contract);

                        return (
                          <div key={contract._id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">{contract.contractNumber}</p>
                                <Badge variant="outline" className={stageMeta.className}>{stageMeta.label}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{contract.clientName} | Due {formatDate(nextDueDate)}</p>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="font-semibold">{formatCurrency(amountDue)}</p>
                              <p className="text-xs text-muted-foreground">{formatStatusLabel(stage)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Receipt Register</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Receipts Posted</p>
                  <p className="mt-1 text-2xl font-semibold">{reportSummary.receipts}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cash / Check</p>
                  <p className="mt-1 text-2xl font-semibold">{formatCurrency(reportSummary.overTheCounterCollected)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Digital / Banked</p>
                  <p className="mt-1 text-2xl font-semibold">{formatCurrency(reportSummary.digitalCollected)}</p>
                </div>
              </CardContent>
            </Card>

            {monthlyReceipts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">No receipts posted for {reportMonthLabel}</h3>
                  <p className="max-w-md text-muted-foreground">
                    Once accounting records payments with provisional receipt numbers, they will appear in this monthly report.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="hidden md:block">
                  <Card className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Receipt</TableHead>
                          <TableHead>Contract</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyReceipts.map((payment) => (
                          <TableRow key={`${payment.contractId}-${payment.receiptNumber}-${payment.date}`}>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell className="font-medium">{payment.receiptNumber || 'Pending PR'}</TableCell>
                            <TableCell className="whitespace-normal">
                              <div className="space-y-1">
                                <div className="font-medium">{payment.contractNumber}</div>
                                <div className="text-sm text-muted-foreground">{payment.clientName}</div>
                              </div>
                            </TableCell>
                            <TableCell>{formatPaymentMethod(payment.method)}</TableCell>
                            <TableCell className="font-medium text-green-700">{formatCurrency(payment.amount)}</TableCell>
                            <TableCell className="whitespace-normal text-sm text-muted-foreground">
                              {payment.reference || 'No reference'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" asChild>
                                <Link to={`/contracts/${payment.contractId}?tab=payments`}>View Contract</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>

                <div className="grid gap-3 md:hidden">
                  {monthlyReceipts.map((payment) => (
                    <Card key={`${payment.contractId}-${payment.receiptNumber}-${payment.date}`}>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{payment.receiptNumber || 'Pending PR'}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(payment.date)}</p>
                          </div>
                          <p className="font-semibold text-green-700">{formatCurrency(payment.amount)}</p>
                        </div>
                        <div>
                          <p className="font-medium">{payment.contractNumber}</p>
                          <p className="text-sm text-muted-foreground">{payment.clientName}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatPaymentMethod(payment.method)} | {payment.reference || 'No reference'}
                        </div>
                        <Button variant="outline" asChild className="w-full">
                          <Link to={`/contracts/${payment.contractId}?tab=payments`}>View Contract</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={paymentDialogOpen} onOpenChange={handlePaymentDialogChange}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {selectedContract ? `Record Payment - ${selectedContract.contractNumber}` : 'Record Payment'}
              </DialogTitle>
            </DialogHeader>

            {selectedContract && selectedContractMilestones ? (
              <div className="space-y-4 pt-2">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                    <p className="mt-1 font-semibold">{formatCurrency(selectedContract.totalContractValue)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Paid</p>
                    <p className="mt-1 font-semibold text-green-700">{formatCurrency(selectedContractMilestones.totalPaid)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Remaining</p>
                    <p className="mt-1 font-semibold text-orange-700">{formatCurrency(selectedContractMilestones.remainingBalance)}</p>
                  </div>
                </div>

                <div className={`rounded-lg border px-4 py-3 text-sm ${selectedContractMilestones.paymentRequirementMet ? 'border-green-200 bg-green-50 text-green-900' : selectedContractMilestones.uncollectible || selectedContractMilestones.finalBalancePastDue ? 'border-red-200 bg-red-50 text-red-900' : selectedContractMilestones.fortyPercentPastDue ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
                  {selectedContractMilestones.fullyPaid
                    ? 'This contract is already fully paid.'
                    : selectedContractMilestones.uncollectible
                      ? `The 40% collection passed the aging window on ${selectedContractMilestones.agingEndsAt.toLocaleDateString()}. Resolve this account before preparation release.`
                    : selectedContractMilestones.fortyPercentPastDue
                      ? `The 40% collection was due on ${selectedContractMilestones.fortyPercentDueDate.toLocaleDateString()} and is aging until ${selectedContractMilestones.agingEndsAt.toLocaleDateString()}.`
                    : selectedContractMilestones.finalBalancePastDue
                      ? `The final 60% balance was due on ${selectedContractMilestones.finalBalanceDueDate.toLocaleDateString()}. Full payment is required before the event can proceed.`
                      : isFullPaymentPlan(selectedContractMilestones.downPaymentPercent, selectedContractMilestones.finalPaymentPercent)
                      ? selectedContractMilestones.paymentRequirementMet
                        ? 'Full payment requirement is already met.'
                        : `The full contract payment of ${formatCurrency(selectedContractMilestones.requiredDownPayment)} must be posted before preparation approval.`
                      : !selectedContractMilestones.reservationFeePaid
                        ? `Post the non-refundable reservation fee of ${formatCurrency(selectedContractMilestones.reservationFee)} before continuing collection.`
                      : selectedContractMilestones.paymentRequirementMet
                        ? `Preparation release requirement is already met. ${formatCurrency(selectedContractMilestones.remainingBalance)} remains for the final ${selectedContractMilestones.finalPaymentPercent}% balance due ${selectedContractMilestones.finalBalanceDueDate.toLocaleDateString()}.`
                        : `The required ${selectedContractMilestones.downPaymentPercent}% collection (${formatCurrency(selectedContractMilestones.requiredDownPayment)}) must be posted by ${selectedContractMilestones.fortyPercentDueDate.toLocaleDateString()} before preparation approval.`}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Amount</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder="Enter payment amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt-number">Provisional Receipt Number</Label>
                  <Input
                    id="receipt-number"
                    value={receiptNumber}
                    onChange={(event) => setReceiptNumber(event.target.value)}
                    placeholder="Required for accounting records"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-reference">Reference / Check / Transaction No.</Label>
                  <Input
                    id="payment-reference"
                    value={paymentReference}
                    onChange={(event) => setPaymentReference(event.target.value)}
                    placeholder={`Optional ${formatPaymentMethod(paymentMethod)} reference`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt-proof">Receipt Proof Image</Label>
                  <Input
                    id="receipt-proof"
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptImageChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional image proof for the payment record.
                  </p>
                </div>

                <Button onClick={handleAddPayment} className="w-full">
                  Record Payment
                </Button>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
