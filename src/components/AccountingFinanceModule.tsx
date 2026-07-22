import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Banknote, RefreshCw, RotateCcw, Save, WalletCards } from 'lucide-react';
import { toast } from 'sonner';

type BudgetStatus = 'draft' | 'active' | 'closed';
type SourceOfFunds = 'client_collections' | 'monthly_allocation' | 'management_approved' | 'mixed';

interface FinanceBudgetCategory {
  key: string;
  label: string;
  allocatedAmount: number;
  pendingAmount?: number;
  committedAmount?: number;
  spentAmount?: number;
  usedAmount?: number;
  availableAmount?: number;
  utilizationPercent?: number;
  notes?: string;
}

interface FinanceBudget {
  _id?: string;
  periodMonth: string;
  status: BudgetStatus;
  totalBudget: number;
  sourceOfFunds: SourceOfFunds;
  notes?: string;
  categories: FinanceBudgetCategory[];
  approvedAt?: string;
  updatedAt?: string;
}

interface FinanceApprovalQueueRow {
  _id: string;
  requestNumber: string;
  department: string;
  requestType: string;
  itemName: string;
  neededBy: string;
  amount: number;
  canApprove: boolean;
  budgetMessage: string;
  availableBudget: number;
  remainingAfterApproval: number | null;
  contract?: {
    _id: string;
    contractNumber?: string;
    clientName?: string;
  } | null;
}

interface FinanceOverview {
  periodMonth: string;
  periodLabel: string;
  budget: FinanceBudget | null;
  budgetTemplate: {
    totalBudget: number;
    status: BudgetStatus;
    sourceOfFunds: SourceOfFunds;
    notes: string;
    categories: FinanceBudgetCategory[];
  };
  defaultCategories: Array<{ key: string; label: string }>;
  summary: {
    contractRevenue: number;
    totalCollected: number;
    accountsReceivable: number;
    collectionRate: number;
    totalBudget: number;
    allocatedBudget: number;
    unallocatedBudget: number;
    pendingBudgetRequests: number;
    openCommitments: number;
    confirmedExpenses: number;
    remainingAllocatedBudget: number;
    cashAfterExpensesAndCommitments: number;
  };
  departmentBudgets: FinanceBudgetCategory[];
  approvalQueue: FinanceApprovalQueueRow[];
  recentPayments: Array<{
    contractNumber: string;
    clientName: string;
    amount: number;
    method?: string;
    receiptNumber?: string;
    date: string;
  }>;
  recentExpenses: Array<{
    _id: string;
    requestNumber: string;
    department: string;
    itemName: string;
    amount: number;
    reference?: string;
    confirmedAt?: string;
    neededBy?: string;
  }>;
}

const SOURCE_LABELS: Record<SourceOfFunds, string> = {
  client_collections: 'Client Collections',
  monthly_allocation: 'Monthly Allocation',
  management_approved: 'Management Approved Budget',
  mixed: 'Mixed Sources',
};

const STATUS_LABELS: Record<BudgetStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  closed: 'Closed',
};

const getMonthValue = (value = new Date()) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

const formatCurrency = (value = 0) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

const formatDate = (value?: string) => {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

const formatPercent = (value = 0) => `${Math.round((Number(value) || 0) * 100)}%`;

const getBudgetHealthClass = (availableAmount = 0, allocatedAmount = 0) => {
  if (allocatedAmount <= 0) {
    return 'border-slate-200 bg-slate-50 text-slate-700';
  }

  if (availableAmount < 0) {
    return 'border-red-200 bg-red-50 text-red-800';
  }

  if (availableAmount <= allocatedAmount * 0.2) {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-800';
};

const createCategoryForm = (categories: FinanceBudgetCategory[]) => categories.map((category) => ({
  key: category.key,
  label: category.label,
  allocatedAmount: String(Number(category.allocatedAmount) || 0),
  notes: category.notes || '',
}));

const getTemplateCategoryForm = (overview: FinanceOverview) => (
  overview.budgetTemplate?.categories?.length
    ? createCategoryForm(overview.budgetTemplate.categories)
    : createCategoryForm(overview.defaultCategories.map((category) => ({
      ...category,
      allocatedAmount: 0,
      notes: '',
    })))
);

export default function AccountingFinanceModule() {
  const [month, setMonth] = useState(getMonthValue());
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [totalBudget, setTotalBudget] = useState('0');
  const [status, setStatus] = useState<BudgetStatus>('active');
  const [sourceOfFunds, setSourceOfFunds] = useState<SourceOfFunds>('monthly_allocation');
  const [notes, setNotes] = useState('');
  const [templateNotice, setTemplateNotice] = useState('');
  const [categoryForm, setCategoryForm] = useState<Array<{
    key: string;
    label: string;
    allocatedAmount: string;
    notes: string;
  }>>([]);

  const loadFinanceOverview = async () => {
    try {
      setIsLoading(true);
      const data = await api.getFinanceOverview({ month });
      const nextOverview = data as FinanceOverview;
      const budget = nextOverview.budget;
      const categories = budget?.categories?.length
        ? budget.categories
        : nextOverview.budgetTemplate?.categories?.length
          ? nextOverview.budgetTemplate.categories
          : nextOverview.defaultCategories.map((category) => ({
            ...category,
            allocatedAmount: 0,
            notes: '',
          }));

      setOverview(nextOverview);
      setTotalBudget(String(Number(budget?.totalBudget ?? nextOverview.budgetTemplate?.totalBudget) || 0));
      setStatus(budget?.status || nextOverview.budgetTemplate?.status || 'active');
      setSourceOfFunds(budget?.sourceOfFunds || nextOverview.budgetTemplate?.sourceOfFunds || 'monthly_allocation');
      setNotes(budget?.notes || nextOverview.budgetTemplate?.notes || '');
      setCategoryForm(createCategoryForm(categories));
      setTemplateNotice('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to load accounting finance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceOverview();
  }, [month]);

  const allocatedFormTotal = useMemo(() => (
    categoryForm.reduce((sum, category) => sum + (Number(category.allocatedAmount) || 0), 0)
  ), [categoryForm]);

  const overAllocatedAmount = Math.max(0, allocatedFormTotal - (Number(totalBudget) || 0));

  const handleCategoryAmountChange = (key: string, value: string) => {
    setCategoryForm((current) => current.map((category) => (
      category.key === key ? { ...category, allocatedAmount: value } : category
    )));
  };

  const handleCategoryNotesChange = (key: string, value: string) => {
    setCategoryForm((current) => current.map((category) => (
      category.key === key ? { ...category, notes: value } : category
    )));
  };

  const handleSaveBudget = async () => {
    const parsedTotalBudget = Number(totalBudget);

    if (!Number.isFinite(parsedTotalBudget) || parsedTotalBudget < 0) {
      toast.error('Enter a valid monthly budget amount');
      return;
    }

    if (allocatedFormTotal > parsedTotalBudget) {
      toast.error(`Allocations exceed the total budget by ${formatCurrency(overAllocatedAmount)}`);
      return;
    }

    try {
      setIsSaving(true);
      await api.saveFinanceBudget(month, {
        totalBudget: parsedTotalBudget,
        status,
        sourceOfFunds,
        notes: notes.trim(),
        categories: categoryForm.map((category) => ({
          key: category.key,
          allocatedAmount: Number(category.allocatedAmount) || 0,
          notes: category.notes.trim(),
        })),
      });
      toast.success('Monthly finance budget saved');
      await loadFinanceOverview();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save monthly finance budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyTemplate = () => {
    if (!overview) {
      return;
    }

    setTotalBudget(String(Number(overview.budgetTemplate?.totalBudget) || 0));
    setStatus(overview.budgetTemplate?.status || 'active');
    setSourceOfFunds(overview.budgetTemplate?.sourceOfFunds || 'monthly_allocation');
    setNotes(overview.budgetTemplate?.notes || '');
    setCategoryForm(getTemplateCategoryForm(overview));
    setTemplateNotice('Standard amounts were copied into the form. Review the values, then click Save Monthly Budget to make them official.');
    toast.info('Standard amounts applied. Save the budget to make it official.');
  };

  if (isLoading && !overview) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const summary = overview?.summary;
  const budgetStatusClass = overview?.budget?.status === 'active'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : overview?.budget?.status === 'closed'
      ? 'border-slate-200 bg-slate-100 text-slate-800'
      : 'border-amber-200 bg-amber-50 text-amber-900';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Finance Control Center</h2>
              <Badge variant="outline" className={budgetStatusClass}>
                {overview?.budget ? STATUS_LABELS[overview.budget.status] : 'No Budget Set'}
              </Badge>
            </div>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Set the monthly operating budget, allocate funds by department, then use the remaining budget as the basis for procurement approval.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="w-full sm:w-48">
              <Label htmlFor="finance-month">Finance Month</Label>
              <Input
                id="finance-month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value || getMonthValue())}
                className="mt-2"
              />
            </div>
            <Button type="button" variant="outline" onClick={loadFinanceOverview} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Monthly Budget</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary?.totalBudget)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(summary?.unallocatedBudget)} unallocated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Month Cash Collected</p>
            <p className="mt-2 text-2xl font-semibold text-green-700">{formatCurrency(summary?.totalCollected)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Payments posted in {overview?.periodLabel || 'selected month'} | {formatPercent(summary?.collectionRate)} collection rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Receivables</p>
            <p className="mt-2 text-2xl font-semibold text-orange-700">{formatCurrency(summary?.accountsReceivable)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Uncollected contract balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Committed + Spent</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency((summary?.openCommitments || 0) + (summary?.confirmedExpenses || 0))}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(summary?.pendingBudgetRequests)} pending approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Available Budget</p>
            <p className={`mt-2 text-2xl font-semibold ${(summary?.remainingAllocatedBudget || 0) < 0 ? 'text-red-700' : 'text-blue-700'}`}>
              {formatCurrency(summary?.remainingAllocatedBudget)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Allocated budget remaining</p>
          </CardContent>
        </Card>
      </div>

      {!overview?.budget ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex gap-3 p-4 text-amber-900">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">No saved budget exists for {overview?.periodLabel || month}.</p>
              <p className="text-sm">
                The standard monthly template has been pre-filled below. Accounting can adjust it, then save it as the active monthly budget before approving purchasing requests.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-primary" />
              Monthly Budget Setup
            </CardTitle>
            <CardDescription>
              This starts from the standard monthly template, then Accounting can adjust the amounts before saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Standard Monthly Budget Amounts</p>
                <p className="text-muted-foreground">
                  This resets the fields below to the normal department budget amounts. It does not save until Accounting clicks Save Monthly Budget.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={handleApplyTemplate}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset To Standard Amounts
              </Button>
            </div>
            {templateNotice ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                {templateNotice}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="total-budget">Total Monthly Budget</Label>
                <Input
                  id="total-budget"
                  type="number"
                  min="0"
                  value={totalBudget}
                  onChange={(event) => setTotalBudget(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-status">Budget Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as BudgetStatus)}>
                  <SelectTrigger id="budget-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source-of-funds">Source Of Funds</Label>
                <Select value={sourceOfFunds} onValueChange={(value) => setSourceOfFunds(value as SourceOfFunds)}>
                  <SelectTrigger id="source-of-funds">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department / Category</TableHead>
                    <TableHead className="w-44">Allocated Budget</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryForm.map((category) => (
                    <TableRow key={category.key}>
                      <TableCell className="font-medium">{category.label}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={category.allocatedAmount}
                          onChange={(event) => handleCategoryAmountChange(category.key, event.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={category.notes}
                          onChange={(event) => handleCategoryNotesChange(category.key, event.target.value)}
                          placeholder="Optional basis or remarks"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className={`rounded-lg border p-3 text-sm ${overAllocatedAmount ? 'border-red-200 bg-red-50 text-red-900' : 'bg-muted/30'}`}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span>Allocated total: {formatCurrency(allocatedFormTotal)}</span>
                <span>Unallocated: {formatCurrency(Math.max(0, (Number(totalBudget) || 0) - allocatedFormTotal))}</span>
              </div>
              {overAllocatedAmount ? (
                <p className="mt-1">Allocations exceed total budget by {formatCurrency(overAllocatedAmount)}.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-notes">Budget Notes / Approval Basis</Label>
              <Textarea
                id="budget-notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Example: Based on projected June collections, confirmed event load, and approved management allocation."
              />
            </div>

            <Button onClick={handleSaveBudget} disabled={isSaving || Boolean(overAllocatedAmount)} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving Budget...' : 'Save Monthly Budget'}
            </Button>
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Department Budget Utilization
          </CardTitle>
          <CardDescription>
            Remaining budget excludes pending requests until Accounting approves them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Committed</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Use</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(overview?.departmentBudgets || []).map((department) => (
                  <TableRow key={department.key}>
                    <TableCell className="font-medium">{department.label}</TableCell>
                    <TableCell>{formatCurrency(department.allocatedAmount)}</TableCell>
                    <TableCell>{formatCurrency(department.pendingAmount)}</TableCell>
                    <TableCell>{formatCurrency(department.committedAmount)}</TableCell>
                    <TableCell>{formatCurrency(department.spentAmount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getBudgetHealthClass(department.availableAmount, department.allocatedAmount)}>
                        {formatCurrency(department.availableAmount)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-32">
                        <div className="flex items-center justify-between text-xs">
                          <span>{department.utilizationPercent || 0}%</span>
                          <span className="text-muted-foreground">{formatCurrency(department.usedAmount)}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${(department.availableAmount || 0) < 0 ? 'bg-red-600' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, Math.max(0, department.utilizationPercent || 0))}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Budget Requests</CardTitle>
          <CardDescription>
            These are the purchasing requests waiting for Accounting. The status tells you if the active budget can support approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview?.approvalQueue.length ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Budget Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.approvalQueue.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-medium">{request.requestNumber}</TableCell>
                      <TableCell className="capitalize">{request.department}</TableCell>
                      <TableCell className="whitespace-normal">
                        <div>{request.itemName}</div>
                        <div className="text-xs text-muted-foreground">Needed {formatDate(request.neededBy)}</div>
                      </TableCell>
                      <TableCell>{formatCurrency(request.amount)}</TableCell>
                      <TableCell>{formatCurrency(request.availableBudget)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={request.canApprove ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'}>
                          {request.canApprove ? 'Within Budget' : 'Blocked'}
                        </Badge>
                        <p className="mt-1 max-w-xs text-xs text-muted-foreground">{request.budgetMessage}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No budget requests are waiting for approval this month.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Collections</CardTitle>
            <CardDescription>Client payments posted within the selected month.</CardDescription>
          </CardHeader>
          <CardContent>
            {overview?.recentPayments.length ? (
              <div className="space-y-3">
                {overview.recentPayments.map((payment) => (
                  <div key={`${payment.contractNumber}-${payment.receiptNumber}-${payment.date}`} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{payment.contractNumber}</p>
                      <p className="text-sm text-muted-foreground">{payment.clientName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(payment.date)} | {payment.receiptNumber || 'Pending PR'}</p>
                    </div>
                    <p className="font-semibold text-green-700">{formatCurrency(payment.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No collections posted this month.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confirmed Procurement Expenses</CardTitle>
            <CardDescription>Purchasing expenses confirmed by Accounting.</CardDescription>
          </CardHeader>
          <CardContent>
            {overview?.recentExpenses.length ? (
              <div className="space-y-3">
                {overview.recentExpenses.map((expense) => (
                  <div key={expense._id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{expense.requestNumber}</p>
                      <p className="text-sm text-muted-foreground">{expense.itemName}</p>
                      <p className="text-xs capitalize text-muted-foreground">{expense.department} | {expense.reference || 'No reference'}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No procurement expenses confirmed this month.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
