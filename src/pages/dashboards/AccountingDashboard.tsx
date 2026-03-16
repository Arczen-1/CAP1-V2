import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
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
  DollarSign,
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
  battableSales?: boolean;
  governmentSales?: boolean;
}

type SortOrder = 'created_desc' | 'created_asc' | 'balance_desc';
type AccountingStatusFilter = 'all' | 'for_release' | 'payment_hold' | 'released' | 'fully_paid';

const DEFAULT_DOWN_PAYMENT_PERCENT = 60;

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
  { value: 'for_release', label: 'For Release' },
  { value: 'payment_hold', label: 'Payment Hold' },
  { value: 'released', label: 'Released' },
  { value: 'fully_paid', label: 'Fully Paid' },
];

const formatCurrency = (value = 0) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
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
  return Math.max(DEFAULT_DOWN_PAYMENT_PERCENT, Number(contract.downPaymentPercent) || DEFAULT_DOWN_PAYMENT_PERCENT);
};

const getFinalPaymentPercent = (contract: Contract) => {
  const parsedFinalPaymentPercent = Number(contract.finalPaymentPercent);

  return Number.isFinite(parsedFinalPaymentPercent)
    ? Math.max(0, parsedFinalPaymentPercent)
    : Math.max(0, 100 - getDownPaymentPercent(contract));
};

const isFullPaymentPlan = (downPaymentPercent: number, finalPaymentPercent: number) => (
  downPaymentPercent >= 100 || finalPaymentPercent <= 0
);

const getPaymentMilestones = (contract: Contract) => {
  const totalPaid = contract.payments
    ?.filter(payment => payment.status === 'completed')
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
  const downPaymentPercent = getDownPaymentPercent(contract);
  const finalPaymentPercent = getFinalPaymentPercent(contract);
  const requiredDownPayment = Math.round((contract.totalContractValue || 0) * (downPaymentPercent / 100) * 100) / 100;
  const remainingBalance = Math.max(0, (contract.totalContractValue || 0) - totalPaid);
  const finalBalanceDueDate = getFinalBalanceDueDate(contract);
  const finalBalanceDeadline = new Date(finalBalanceDueDate);
  finalBalanceDeadline.setHours(23, 59, 59, 999);
  const fullyPaid = totalPaid >= (contract.totalContractValue || 0);
  const fullPaymentPlan = isFullPaymentPlan(downPaymentPercent, finalPaymentPercent);
  const finalBalancePastDue = !fullyPaid && new Date() > finalBalanceDeadline;
  const paymentRequirementMet = fullPaymentPlan ? fullyPaid : finalBalancePastDue ? fullyPaid : totalPaid >= requiredDownPayment;

  return {
    totalPaid,
    downPaymentPercent,
    finalPaymentPercent,
    requiredDownPayment,
    remainingDeposit: Math.max(0, requiredDownPayment - totalPaid),
    remainingBalance,
    downPaymentSatisfied: totalPaid >= requiredDownPayment,
    fullyPaid,
    finalBalanceDueDate,
    finalBalancePastDue,
    paymentRequirementMet,
    paymentRequirementRemaining: fullPaymentPlan ? remainingBalance : finalBalancePastDue ? remainingBalance : Math.max(0, requiredDownPayment - totalPaid),
    paymentHoldActive: finalBalancePastDue && !fullyPaid,
  };
};

const getFinalBalanceDueDate = (contract: Contract) => {
  const dueDate = new Date(contract.eventDate);
  dueDate.setMonth(dueDate.getMonth() - 1);
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

  if (milestones.paymentHoldActive) {
    return 'payment_hold';
  }

  if (milestones.fullyPaid) {
    return 'fully_paid';
  }

  if (['approved', 'completed'].includes(contract.status)) {
    return 'released';
  }

  return 'for_release';
};

const getAccountingStageMeta = (contract: Contract) => {
  const stage = getAccountingStage(contract);

  switch (stage) {
    case 'payment_hold':
      return {
        label: 'Payment Hold',
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
        label: 'For Release',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
      };
  }
};

const getNextStepMeta = (contract: Contract) => {
  const milestones = getPaymentMilestones(contract);
  const fullPaymentRequired = isFullPaymentPlan(milestones.downPaymentPercent, milestones.finalPaymentPercent);

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
    return {
      title: 'Collect remaining balance',
      note: `${formatCurrency(milestones.remainingBalance)} is overdue since ${formatDate(milestones.finalBalanceDueDate)}.`,
      className: 'text-red-700',
    };
  }

  if (!milestones.paymentRequirementMet) {
    return {
      title: fullPaymentRequired ? 'Record full payment' : `Record ${milestones.downPaymentPercent}% deposit`,
      note: `${formatCurrency(milestones.paymentRequirementRemaining)} is still needed before preparation release.`,
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
      title: 'Track final balance',
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
      const pendingApproval = contractsData.filter((contract: Contract) => getAccountingStage(contract) === 'for_release').length;

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
    const fullPaymentRequired = isFullPaymentPlan(milestones.downPaymentPercent, milestones.finalPaymentPercent);

    if (!milestones.paymentRequirementMet) {
      openDepositPaymentDialog(contract, milestones.paymentHoldActive ? milestones.remainingBalance : milestones.paymentRequirementRemaining);
      toast.info(
        milestones.paymentHoldActive
          ? `The remaining balance must be settled by ${milestones.finalBalanceDueDate.toLocaleDateString()} or the event cannot proceed.`
          : fullPaymentRequired
            ? `Confirm the full payment of ${formatCurrency(milestones.requiredDownPayment)} before approving this contract for preparation.`
            : `Confirm the required ${milestones.downPaymentPercent}% payment of ${formatCurrency(milestones.requiredDownPayment)} before approving this contract for preparation.`
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
      toast.error('Official receipt number is required');
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
    for_release: 0,
    payment_hold: 0,
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
              <CardTitle className="text-sm font-medium">Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</div>
              <p className="text-xs text-muted-foreground">Completed payments posted</p>
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
            <TabsTrigger value="reports">Monthly Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">For Release</p>
                  <p className="mt-2 text-2xl font-semibold">{filteredStageCounts.for_release}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Signed contracts waiting for accounting clearance</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Payment Hold</p>
                  <p className="mt-2 text-2xl font-semibold text-red-700">{filteredStageCounts.payment_hold}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Events blocked by overdue balance</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Released</p>
                  <p className="mt-2 text-2xl font-semibold text-blue-700">{filteredStageCounts.released}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Operational contracts still carrying a balance</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Fully Paid</p>
                  <p className="mt-2 text-2xl font-semibold text-green-700">{filteredStageCounts.fully_paid}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Contracts with all receipts already posted</p>
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
                                  <div className="text-xs text-muted-foreground">{contract.totalPacks || 0} packs</div>
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
                                      ? `Full payment plan. Due by ${formatDate(milestones.finalBalanceDueDate)}`
                                      : `${milestones.downPaymentPercent}% / ${milestones.finalPaymentPercent}% plan. Final due ${formatDate(milestones.finalBalanceDueDate)}`}
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
                                      <DollarSign className="mr-2 h-4 w-4" />
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
                              <p className="text-xs text-muted-foreground">Final due {formatDate(milestones.finalBalanceDueDate)}</p>
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

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Receipt Reports</h2>
                  <p className="text-sm text-muted-foreground">
                    Review posted receipts for {reportMonthLabel}. Open a contract only when you need the full payment breakdown.
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
                  <p className="text-sm text-muted-foreground">Receipts Posted</p>
                  <p className="mt-2 text-2xl font-semibold">{reportSummary.receipts}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Completed payments in {reportMonthLabel}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Collected</p>
                  <p className="mt-2 text-2xl font-semibold text-green-700">{formatCurrency(reportSummary.totalCollected)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Total receipts posted this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Cash / Check</p>
                  <p className="mt-2 text-2xl font-semibold">{formatCurrency(reportSummary.overTheCounterCollected)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Counter and check collections</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Digital / Banked</p>
                  <p className="mt-2 text-2xl font-semibold">{formatCurrency(reportSummary.digitalCollected)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Transfer, card, and e-wallet collections</p>
                </CardContent>
              </Card>
            </div>

            {monthlyReceipts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">No receipts posted for {reportMonthLabel}</h3>
                  <p className="max-w-md text-muted-foreground">
                    Once accounting records payments with official receipt numbers, they will appear in this monthly report.
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
                            <TableCell className="font-medium">{payment.receiptNumber || 'Pending OR'}</TableCell>
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
                            <p className="font-semibold">{payment.receiptNumber || 'Pending OR'}</p>
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

                <div className={`rounded-lg border px-4 py-3 text-sm ${selectedContractMilestones.paymentRequirementMet ? 'border-green-200 bg-green-50 text-green-900' : selectedContractMilestones.paymentHoldActive ? 'border-red-200 bg-red-50 text-red-900' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
                  {selectedContractMilestones.fullyPaid
                    ? 'This contract is already fully paid.'
                    : selectedContractMilestones.paymentHoldActive
                      ? `The remaining balance was due on ${selectedContractMilestones.finalBalanceDueDate.toLocaleDateString()}. Full payment is now required before the event can proceed.`
                      : isFullPaymentPlan(selectedContractMilestones.downPaymentPercent, selectedContractMilestones.finalPaymentPercent)
                      ? selectedContractMilestones.paymentRequirementMet
                        ? 'Full payment requirement is already met.'
                        : `The full contract payment of ${formatCurrency(selectedContractMilestones.requiredDownPayment)} must be posted before preparation approval.`
                      : selectedContractMilestones.paymentRequirementMet
                        ? `Preparation release requirement is already met. ${formatCurrency(selectedContractMilestones.remainingBalance)} remains for the final ${selectedContractMilestones.finalPaymentPercent}% balance.`
                        : `At least ${selectedContractMilestones.downPaymentPercent}% (${formatCurrency(selectedContractMilestones.requiredDownPayment)}) must be posted before preparation approval.`}
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
                  <Label htmlFor="receipt-number">Official Receipt Number</Label>
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
