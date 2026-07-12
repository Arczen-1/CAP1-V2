import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  ArrowUpDown,
  Calendar,
  CircleAlert,
  Filter,
  FileSignature,
  MapPin,
  Plus,
  Search,
  Users,
  Wallet,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BookingCalendar, { type BookingSortMode } from '@/components/BookingCalendar';
import { useRole } from '@/contexts/AuthContext';
import { getSortTimestamp } from '@/lib/worklist';
import { cn } from '@/lib/utils';

interface Contract {
  _id: string;
  contractNumber: string;
  createdAt?: string;
  clientName: string;
  clientType: string;
  eventDate: string;
  venue?: { name?: string };
  status: string;
  progress: number;
  totalPacks: number;
  packageSelected: string;
  paymentStatus?: string;
}

type SortOrder = BookingSortMode;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_client_signature', label: 'Pending Client Signature' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'accounting_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatStatusLabel = (value?: string) => (value || 'pending').replace(/_/g, ' ');
const formatClientTypeLabel = (type: string) => type.replace(/_/g, ' ');
const formatEventDate = (value: string) => new Date(value).toLocaleDateString(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'pending_client_signature':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'submitted':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'accounting_review':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'completed':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'partially_paid':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export default function Contracts() {
  const { isSales } = useRole();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('created_desc');
  const [isLoading, setIsLoading] = useState(true);
  const canCreateContracts = isSales();

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchQuery, statusFilter, sortOrder]);

  const fetchContracts = async () => {
    try {
      const data = await api.getContracts();
      setContracts(data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterContracts = () => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    let filtered = [...contracts];

    if (normalizedSearch) {
      filtered = filtered.filter((contract) =>
        contract.clientName.toLowerCase().includes(normalizedSearch)
        || contract.contractNumber.toLowerCase().includes(normalizedSearch)
        || (contract.venue?.name || '').toLowerCase().includes(normalizedSearch)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((contract) => contract.status === statusFilter);
    }

    filtered.sort((left, right) => {
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

    setFilteredContracts(filtered);
  };

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysUntilEvent = (eventDate: string) => {
    const eventDay = new Date(eventDate);
    eventDay.setHours(0, 0, 0, 0);
    return Math.round((eventDay.getTime() - today.getTime()) / MS_PER_DAY);
  };

  const getEventTimingMeta = (contract: Contract) => {
    const daysUntilEvent = getDaysUntilEvent(contract.eventDate);
    const isClosed = ['completed', 'cancelled'].includes(contract.status);

    if (!isClosed && daysUntilEvent < 0) {
      return {
        label: 'Past event',
        className: 'border-red-200 bg-red-50 text-red-700',
      };
    }

    if (daysUntilEvent === 0) {
      return {
        label: 'Event today',
        className: 'border-amber-200 bg-amber-50 text-amber-900',
      };
    }

    if (daysUntilEvent === 1) {
      return {
        label: 'Event tomorrow',
        className: 'border-amber-200 bg-amber-50 text-amber-900',
      };
    }

    if (daysUntilEvent > 1 && daysUntilEvent <= 7) {
      return {
        label: `In ${daysUntilEvent} days`,
        className: 'border-blue-200 bg-blue-50 text-blue-800',
      };
    }

    if (daysUntilEvent < 0) {
      return {
        label: `${Math.abs(daysUntilEvent)} day${Math.abs(daysUntilEvent) === 1 ? '' : 's'} ago`,
        className: 'border-slate-200 bg-slate-50 text-slate-700',
      };
    }

    return {
      label: `In ${daysUntilEvent} days`,
      className: 'border-slate-200 bg-slate-50 text-slate-700',
    };
  };

  const getNextStepMeta = (contract: Contract) => {
    const daysUntilEvent = getDaysUntilEvent(contract.eventDate);

    switch (contract.status) {
      case 'draft':
        return {
          title: 'Finalize and send for signature',
          note: 'Sales should finish the contract tabs before sending it out.',
          className: 'text-yellow-800',
        };
      case 'pending_client_signature':
        return {
          title: 'Follow up on signed copy',
          note: 'Contract terms are ready and waiting for the client signature.',
          className: 'text-sky-800',
        };
      case 'submitted':
      case 'accounting_review':
        return {
          title: 'Record payment and approve',
          note: 'Accounting should settle the required payment before preparation starts.',
          className: 'text-blue-800',
        };
      case 'approved':
        if (daysUntilEvent < 0) {
          return {
            title: 'Close contract',
            note: 'Event date has passed. Complete returns, final checks, and closeout.',
            className: 'text-amber-900',
          };
        }

        if (daysUntilEvent <= 7) {
          return {
            title: 'Preparation should be active',
            note: 'Inventory, logistics, and kitchen work should already be in motion.',
            className: 'text-green-800',
          };
        }

        return {
          title: 'Preparation window approaching',
          note: 'Contract is approved and ready for department scheduling.',
          className: 'text-slate-800',
        };
      case 'completed':
        return {
          title: 'Closed',
          note: 'This contract is already completed and archived for reference.',
          className: 'text-slate-700',
        };
      case 'cancelled':
        return {
          title: 'Cancelled',
          note: 'No further action is needed unless the booking is reopened.',
          className: 'text-slate-700',
        };
      default:
        return {
          title: 'Review contract',
          note: 'Check the contract status and continue the next department action.',
          className: 'text-slate-700',
        };
    }
  };

  const getRowClassName = (contract: Contract) => {
    const daysUntilEvent = getDaysUntilEvent(contract.eventDate);

    if (!['completed', 'cancelled'].includes(contract.status) && daysUntilEvent < 0) {
      return 'bg-red-50/40';
    }

    if (contract.status === 'pending_client_signature') {
      return 'bg-sky-50/40';
    }

    if (['submitted', 'accounting_review'].includes(contract.status)) {
      return 'bg-blue-50/40';
    }

    return '';
  };

  const needsSignatureCount = filteredContracts.filter((contract) => contract.status === 'pending_client_signature').length;
  const needsAccountingCount = filteredContracts.filter((contract) => ['submitted', 'accounting_review'].includes(contract.status)).length;
  const thisWeekCount = filteredContracts.filter((contract) => {
    const daysUntilEvent = getDaysUntilEvent(contract.eventDate);
    return !['completed', 'cancelled'].includes(contract.status) && daysUntilEvent >= 0 && daysUntilEvent <= 7;
  }).length;
  const postEventOpenCount = filteredContracts.filter((contract) => {
    const daysUntilEvent = getDaysUntilEvent(contract.eventDate);
    return !['completed', 'cancelled'].includes(contract.status) && daysUntilEvent < 0;
  }).length;

  const summaryCards = [
    {
      title: 'Pending Signature',
      value: needsSignatureCount,
      note: 'Contracts waiting on the client-signed copy',
      icon: FileSignature,
    },
    {
      title: 'Needs Accounting',
      value: needsAccountingCount,
      note: 'Signed contracts that still need payment release or approval',
      icon: Wallet,
    },
    {
      title: 'Events This Week',
      value: thisWeekCount,
      note: 'Active contracts with event dates in the next seven days',
      icon: Calendar,
    },
    {
      title: 'Past Event, Still Open',
      value: postEventOpenCount,
      note: 'Contracts that should be reviewed for closeout',
      icon: CircleAlert,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
            <p className="text-muted-foreground">
              Review contract status, event timing, and the next action needed per booking.
            </p>
          </div>
          {canCreateContracts && (
            <Button asChild>
              <Link to="/contracts/new">
                <Plus className="mr-2 h-4 w-4" />
                New Contract
              </Link>
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by client, contract number, or venue..."
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
            {!isLoading && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <Card key={card.title}>
                      <CardContent className="flex items-start justify-between gap-4 p-5">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                          <p className="text-3xl font-semibold tracking-tight">{card.value}</p>
                          <p className="text-sm text-muted-foreground">{card.note}</p>
                        </div>
                        <div className="rounded-full border bg-background p-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
              </div>
            ) : filteredContracts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">No contracts found</h3>
                  <p className="mb-4 max-w-md text-center text-muted-foreground">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or current status filter.'
                      : 'Get started by creating your first contract.'}
                  </p>
                  {!searchQuery && statusFilter === 'all' && canCreateContracts && (
                    <Button asChild>
                      <Link to="/contracts/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Contract
                      </Link>
                    </Button>
                  )}
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
                          <TableHead>Venue</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead className="w-[320px]">Next Step</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContracts.map((contract) => {
                          const eventTiming = getEventTimingMeta(contract);
                          const nextStep = getNextStepMeta(contract);

                          return (
                            <TableRow key={contract._id} className={cn(getRowClassName(contract))}>
                              <TableCell className="align-top">
                                <div className="space-y-2">
                                  <div className="font-medium">{formatEventDate(contract.eventDate)}</div>
                                  <Badge variant="outline" className={eventTiming.className}>
                                    {eventTiming.label}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="space-y-1">
                                  <div className="font-semibold">{contract.contractNumber}</div>
                                  <div className="text-sm text-foreground">{contract.clientName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatClientTypeLabel(contract.clientType)} | {contract.totalPacks || 0} packs | {(contract.packageSelected || 'custom').replace(/_/g, ' ')}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                  <span>{contract.venue?.name || 'No venue saved'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <Badge variant="outline" className={getStatusColor(contract.status)}>
                                  {formatStatusLabel(contract.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top">
                                <Badge variant="outline" className={getPaymentStatusColor(contract.paymentStatus || 'unpaid')}>
                                  {formatStatusLabel(contract.paymentStatus || 'unpaid')}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="space-y-1">
                                  <p className={cn('font-medium', nextStep.className)}>{nextStep.title}</p>
                                  <p className="text-sm text-muted-foreground">{nextStep.note}</p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top text-right">
                                <Button asChild variant="outline">
                                  <Link to={`/contracts/${contract._id}`}>View Details</Link>
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
                      const eventTiming = getEventTimingMeta(contract);
                      const nextStep = getNextStepMeta(contract);

                      return (
                        <div key={contract._id} className={cn('rounded-lg border p-4', getRowClassName(contract))}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">{contract.contractNumber}</span>
                                <Badge variant="outline" className={getStatusColor(contract.status)}>
                                  {formatStatusLabel(contract.status)}
                                </Badge>
                              </div>
                              <div>
                                <p className="font-medium">{contract.clientName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatClientTypeLabel(contract.clientType)} | {contract.totalPacks || 0} packs
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className={eventTiming.className}>
                              {eventTiming.label}
                            </Badge>
                          </div>

                          <div className="mt-4 grid gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{formatEventDate(contract.eventDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{contract.venue?.name || 'No venue saved'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{(contract.packageSelected || 'custom').replace(/_/g, ' ')} | {contract.totalPacks || 0} packs</span>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Badge variant="outline" className={getPaymentStatusColor(contract.paymentStatus || 'unpaid')}>
                              {formatStatusLabel(contract.paymentStatus || 'unpaid')}
                            </Badge>
                          </div>

                          <div className="mt-4 space-y-1">
                            <p className={cn('text-sm font-medium', nextStep.className)}>{nextStep.title}</p>
                            <p className="text-sm text-muted-foreground">{nextStep.note}</p>
                          </div>

                          <div className="mt-4">
                            <Button asChild variant="outline" className="w-full">
                              <Link to={`/contracts/${contract._id}`}>View Details</Link>
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
              title="Contract Calendar"
              sortMode={sortOrder}
              bookings={filteredContracts.map((contract) => ({
                _id: contract._id,
                date: contract.eventDate,
                createdAt: contract.createdAt,
                type: 'contract' as const,
                clientName: contract.clientName,
                status: formatStatusLabel(contract.status),
                venue: contract.venue?.name,
                totalGuests: contract.totalPacks,
              }))}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
