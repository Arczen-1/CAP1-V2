import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpDown,
  Calendar,
  CheckCircle,
  FileText,
  Filter,
  Plus,
  Search,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import BookingCalendar, { type BookingSortMode } from '@/components/BookingCalendar';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatLabel, getSortTimestamp, getTimingMeta } from '@/lib/worklist';

interface Contract {
  _id: string;
  contractNumber: string;
  createdAt?: string;
  clientName: string;
  clientType: string;
  eventDate: string;
  status: string;
  totalPacks: number;
  slaWarning: boolean;
}

type SortOrder = BookingSortMode;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_client_signature', label: 'For Signature' },
  { value: 'submitted', label: 'For Approval' },
  { value: 'approved', label: 'Approved' },
];

const getStatusClassName = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'pending_client_signature':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'submitted':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getNextStepMeta = (contract: Contract) => {
  switch (contract.status) {
    case 'draft':
      return {
        title: 'Finish and send the contract',
        note: 'Complete the contract tabs, then send it into the signature flow.',
        className: 'text-yellow-800',
      };
    case 'pending_client_signature':
      return {
        title: 'Follow up on the signed copy',
        note: 'The contract is already out for signature and needs client follow-up.',
        className: 'text-sky-800',
      };
    case 'submitted':
      return {
        title: 'Waiting for accounting release',
        note: 'Accounting should record payment and approve this contract for preparation.',
        className: 'text-blue-800',
      };
    case 'approved':
      return {
        title: 'Preparation already released',
        note: 'Sales can monitor the event while operations departments handle preparation.',
        className: 'text-green-800',
      };
    default:
      return {
        title: 'Review contract status',
        note: 'Open the contract and continue the next sales action.',
        className: 'text-slate-700',
      };
  }
};

const formatEventDate = (value: string) => new Date(value).toLocaleDateString(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default function SalesDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('created_desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const contractsData = await api.getContracts();
      setContracts(contractsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredContracts = [...contracts]
    .filter((contract) => {
      const matchesSearch = !normalizedSearch
        || contract.clientName.toLowerCase().includes(normalizedSearch)
        || contract.contractNumber.toLowerCase().includes(normalizedSearch)
        || contract.clientType.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((left, right) => {
      const leftCreatedTime = getSortTimestamp(left.createdAt, left.eventDate);
      const rightCreatedTime = getSortTimestamp(right.createdAt, right.eventDate);
      const leftEventTime = new Date(left.eventDate).getTime();
      const rightEventTime = new Date(right.eventDate).getTime();
      const timeDelta = sortOrder === 'created_desc'
        ? rightCreatedTime - leftCreatedTime
        : sortOrder === 'created_asc'
          ? leftCreatedTime - rightCreatedTime
          : sortOrder === 'date_desc'
            ? rightEventTime - leftEventTime
            : leftEventTime - rightEventTime;

      if (timeDelta !== 0) {
        return timeDelta;
      }

      return sortOrder === 'created_asc' || sortOrder === 'date_asc'
        ? left.contractNumber.localeCompare(right.contractNumber)
        : right.contractNumber.localeCompare(left.contractNumber);
    });

  const getSortSummary = () => {
    switch (sortOrder) {
      case 'created_desc':
        return 'Sorted by latest made';
      case 'created_asc':
        return 'Sorted by oldest made';
      case 'date_desc':
        return 'Sorted by latest event date';
      default:
        return 'Sorted by nearest event date';
    }
  };

  const draftContracts = contracts.filter((contract) => contract.status === 'draft');
  const signatureContracts = contracts.filter((contract) => contract.status === 'pending_client_signature');
  const pendingApprovalContracts = contracts.filter((contract) => contract.status === 'submitted');
  const approvedContracts = contracts.filter((contract) => contract.status === 'approved');

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
            <p className="text-muted-foreground">
              Track contract finalization, signature follow-up, and handoff to accounting.
            </p>
          </div>
          <Button asChild>
            <Link to="/contracts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Contract
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Draft</p>
                <p className="text-3xl font-semibold tracking-tight">{draftContracts.length}</p>
                <p className="text-sm text-muted-foreground">Contracts still being finalized</p>
              </div>
              <div className="rounded-full border bg-background p-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">For Signature</p>
                <p className="text-3xl font-semibold tracking-tight">{signatureContracts.length}</p>
                <p className="text-sm text-muted-foreground">Contracts already sent to the client</p>
              </div>
              <div className="rounded-full border bg-background p-2">
                <Send className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">For Approval</p>
                <p className="text-3xl font-semibold tracking-tight">{pendingApprovalContracts.length}</p>
                <p className="text-sm text-muted-foreground">Signed contracts awaiting accounting release</p>
              </div>
              <div className="rounded-full border bg-background p-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-3xl font-semibold tracking-tight">{approvedContracts.length}</p>
                <p className="text-sm text-muted-foreground">Contracts already released for preparation</p>
              </div>
              <div className="rounded-full border bg-background p-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
              </div>
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-56">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                  <SelectTrigger className="w-full sm:w-56">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort contracts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_desc">Latest Made</SelectItem>
                    <SelectItem value="created_asc">Oldest Made</SelectItem>
                    <SelectItem value="date_desc">Latest Event Date</SelectItem>
                    <SelectItem value="date_asc">Nearest Event Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {filteredContracts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">No sales contracts found</h3>
                  <p className="mb-4 max-w-md text-muted-foreground">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or status filter.'
                      : 'Create a new contract to start the sales workflow.'}
                  </p>
                  {!searchQuery && statusFilter === 'all' ? (
                    <Button asChild>
                      <Link to="/contracts/new">Create Contract</Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="flex flex-col gap-2 border-b px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>Showing {filteredContracts.length} of {contracts.length} contracts</span>
                    <span>{getSortSummary()}</span>
                  </div>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Contract</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[320px]">Next Step</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContracts.map((contract) => {
                          const timing = getTimingMeta(contract.eventDate, { pastLabel: 'Past event' });
                          const nextStep = getNextStepMeta(contract);

                          return (
                            <TableRow key={contract._id} className={contract.slaWarning ? 'bg-red-50/20' : ''}>
                              <TableCell className="align-top">
                                <div className="space-y-2">
                                  <div className="font-medium">{formatEventDate(contract.eventDate)}</div>
                                  <Badge variant="outline" className={timing.className}>
                                    {timing.label}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold">{contract.contractNumber}</span>
                                    {contract.slaWarning ? (
                                      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                                        SLA Warning
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <div className="text-sm text-foreground">{contract.clientName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatLabel(contract.clientType)} | {contract.totalPacks || 0} packs
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <Badge variant="outline" className={getStatusClassName(contract.status)}>
                                  {formatLabel(contract.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="space-y-1">
                                  <p className={nextStep.className}>{nextStep.title}</p>
                                  <p className="text-sm text-muted-foreground">{nextStep.note}</p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top text-right">
                                <Button asChild variant="outline">
                                  <Link to={`/contracts/${contract._id}`}>View Contract</Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid gap-3 p-4 md:hidden">
                    {filteredContracts.map((contract) => {
                      const timing = getTimingMeta(contract.eventDate, { pastLabel: 'Past event' });
                      const nextStep = getNextStepMeta(contract);

                      return (
                        <div key={contract._id} className={`rounded-lg border p-4 ${contract.slaWarning ? 'bg-red-50/20' : ''}`}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">{contract.contractNumber}</span>
                                <Badge variant="outline" className={getStatusClassName(contract.status)}>
                                  {formatLabel(contract.status)}
                                </Badge>
                              </div>
                              <div>
                                <p className="font-medium">{contract.clientName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatLabel(contract.clientType)} | {contract.totalPacks || 0} packs
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className={timing.className}>
                              {timing.label}
                            </Badge>
                          </div>

                          {contract.slaWarning ? (
                            <div className="mt-4">
                              <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                                SLA Warning
                              </Badge>
                            </div>
                          ) : null}

                          <div className="mt-4 space-y-1">
                            <p className={nextStep.className}>{nextStep.title}</p>
                            <p className="text-sm text-muted-foreground">{nextStep.note}</p>
                          </div>

                          <div className="mt-4">
                            <Button asChild variant="outline" className="w-full">
                              <Link to={`/contracts/${contract._id}`}>View Contract</Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <BookingCalendar
              title="Sales Contract Calendar"
              sortMode={sortOrder}
              bookings={filteredContracts.map((contract) => ({
                _id: contract._id,
                date: contract.eventDate,
                createdAt: contract.createdAt,
                type: 'contract' as const,
                clientName: contract.clientName,
                status: formatLabel(contract.status),
                totalGuests: contract.totalPacks,
              }))}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
