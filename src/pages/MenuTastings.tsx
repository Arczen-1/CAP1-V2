import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  ArrowUpDown,
  Calendar,
  CheckCircle,
  FileText,
  Plus,
  Search,
  Users,
  Utensils,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import BookingCalendar, { type BookingSortMode } from '@/components/BookingCalendar';
import { getSortTimestamp } from '@/lib/worklist';

interface MenuTasting {
  _id: string;
  tastingNumber: string;
  createdAt?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: string;
  expectedGuests: number;
  preferredEventDate: string;
  tastingDate: string;
  tastingTime: string;
  numberOfPax: number;
  status: string;
  contractCreated: boolean;
  contract?: {
    _id?: string;
    contractNumber: string;
    status: string;
  };
}

type SortOrder = BookingSortMode;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'booked', label: 'Booked' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatStatusLabel = (value?: string) => (value || 'pending').replace(/_/g, ' ');
const formatEventTypeLabel = (type: string) => type.replace(/_/g, ' ');
const formatDate = (value: string) => new Date(value).toLocaleDateString(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'booked':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'completed':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'no_show':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getContractBadgeClassName = (hasContract: boolean) => (
  hasContract
    ? 'border-green-200 bg-green-50 text-green-800'
    : 'border-slate-200 bg-slate-50 text-slate-700'
);

export default function MenuTastings() {
  const [tastings, setTastings] = useState<MenuTasting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('created_desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const tastingsData = await api.getMenuTastings();
      setTastings(tastingsData);
    } catch (error) {
      toast.error('Failed to load menu tastings');
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredTastings = [...tastings]
    .filter((tasting) => {
      const matchesSearch = !normalizedSearch
        || tasting.clientName.toLowerCase().includes(normalizedSearch)
        || tasting.tastingNumber.toLowerCase().includes(normalizedSearch)
        || tasting.clientEmail.toLowerCase().includes(normalizedSearch)
        || tasting.clientPhone.toLowerCase().includes(normalizedSearch)
        || tasting.eventType.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || tasting.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((left, right) => {
      const leftCreatedTime = getSortTimestamp(left.createdAt, left.tastingDate);
      const rightCreatedTime = getSortTimestamp(right.createdAt, right.tastingDate);
      const leftTastingTime = new Date(left.tastingDate).getTime();
      const rightTastingTime = new Date(right.tastingDate).getTime();
      const timeDelta = sortOrder === 'created_desc'
        ? rightCreatedTime - leftCreatedTime
        : sortOrder === 'created_asc'
          ? leftCreatedTime - rightCreatedTime
          : sortOrder === 'date_desc'
            ? rightTastingTime - leftTastingTime
            : leftTastingTime - rightTastingTime;

      if (timeDelta !== 0) {
        return timeDelta;
      }

      return sortOrder === 'created_asc' || sortOrder === 'date_asc'
        ? left.tastingNumber.localeCompare(right.tastingNumber)
        : right.tastingNumber.localeCompare(left.tastingNumber);
    });

  const getSortSummary = () => {
    switch (sortOrder) {
      case 'created_desc':
        return 'Sorted by latest made';
      case 'created_asc':
        return 'Sorted by oldest made';
      case 'date_desc':
        return 'Sorted by latest tasting date';
      default:
        return 'Sorted by nearest tasting date';
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysUntilTasting = (tastingDate: string) => {
    const date = new Date(tastingDate);
    date.setHours(0, 0, 0, 0);
    return Math.round((date.getTime() - today.getTime()) / MS_PER_DAY);
  };

  const getTimingMeta = (tasting: MenuTasting) => {
    const daysUntil = getDaysUntilTasting(tasting.tastingDate);
    const isClosed = ['completed', 'cancelled', 'no_show'].includes(tasting.status);

    if (!isClosed && daysUntil < 0) {
      return {
        label: 'Past tasting date',
        className: 'border-red-200 bg-red-50 text-red-700',
      };
    }

    if (daysUntil === 0) {
      return {
        label: 'Today',
        className: 'border-amber-200 bg-amber-50 text-amber-900',
      };
    }

    if (daysUntil === 1) {
      return {
        label: 'Tomorrow',
        className: 'border-amber-200 bg-amber-50 text-amber-900',
      };
    }

    if (daysUntil > 1 && daysUntil <= 7) {
      return {
        label: `In ${daysUntil} days`,
        className: 'border-blue-200 bg-blue-50 text-blue-800',
      };
    }

    if (daysUntil < 0) {
      return {
        label: `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} ago`,
        className: 'border-slate-200 bg-slate-50 text-slate-700',
      };
    }

    return {
      label: `In ${daysUntil} days`,
      className: 'border-slate-200 bg-slate-50 text-slate-700',
    };
  };

  const getNextStepMeta = (tasting: MenuTasting) => {
    switch (tasting.status) {
      case 'booked':
        return {
          title: 'Confirm tasting schedule',
          note: 'Reach out to the client and finalize attendance details for the tasting slot.',
          className: 'text-blue-800',
        };
      case 'confirmed':
        return tasting.contractCreated
          ? {
              title: 'Open linked contract',
              note: 'The tasting is confirmed and already converted into a contract record.',
              className: 'text-green-800',
            }
          : {
              title: 'Prepare tasting or create contract',
              note: 'This booking is confirmed and ready for menu presentation or contract creation.',
              className: 'text-green-800',
            };
      case 'completed':
        return tasting.contractCreated
          ? {
              title: 'Converted to contract',
              note: 'Use the linked contract for the rest of the sales and operations flow.',
              className: 'text-slate-700',
            }
          : {
              title: 'Follow up after tasting',
              note: 'Record the client decision and create the contract if the event will proceed.',
              className: 'text-amber-900',
            };
      case 'cancelled':
        return {
          title: 'Cancelled booking',
          note: 'No further action is needed unless the client reschedules.',
          className: 'text-slate-700',
        };
      case 'no_show':
        return {
          title: 'Client did not attend',
          note: 'Follow up if the tasting should be rebooked or formally closed.',
          className: 'text-amber-900',
        };
      default:
        return {
          title: 'Review tasting booking',
          note: 'Open the booking to continue the next sales action.',
          className: 'text-slate-700',
        };
    }
  };

  const getRowClassName = (tasting: MenuTasting) => {
    const daysUntil = getDaysUntilTasting(tasting.tastingDate);

    if (!['completed', 'cancelled', 'no_show'].includes(tasting.status) && daysUntil < 0) {
      return 'bg-red-50/40';
    }

    if (tasting.status === 'confirmed' && !tasting.contractCreated) {
      return 'bg-green-50/30';
    }

    if (tasting.status === 'completed' && !tasting.contractCreated) {
      return 'bg-amber-50/30';
    }

    return '';
  };

  const upcomingCount = filteredTastings.filter((tasting) => {
    const daysUntil = getDaysUntilTasting(tasting.tastingDate);
    return ['booked', 'confirmed'].includes(tasting.status) && daysUntil >= 0;
  }).length;
  const todayCount = filteredTastings.filter((tasting) => {
    const daysUntil = getDaysUntilTasting(tasting.tastingDate);
    return daysUntil === 0 && !['cancelled', 'no_show'].includes(tasting.status);
  }).length;
  const followUpCount = filteredTastings.filter((tasting) => tasting.status === 'completed' && !tasting.contractCreated).length;
  const convertedCount = filteredTastings.filter((tasting) => tasting.contractCreated).length;

  const summaryCards = [
    {
      title: 'Upcoming Tastings',
      value: upcomingCount,
      note: 'Booked or confirmed tasting sessions that are still ahead',
      icon: Calendar,
    },
    {
      title: 'Tastings Today',
      value: todayCount,
      note: 'Bookings scheduled to happen today',
      icon: Utensils,
    },
    {
      title: 'Needs Follow-Up',
      value: followUpCount,
      note: 'Completed tastings that do not yet have a contract',
      icon: CheckCircle,
    },
    {
      title: 'Converted',
      value: convertedCount,
      note: 'Tastings already linked to a contract',
      icon: FileText,
    },
  ];

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
            <h1 className="text-3xl font-bold tracking-tight">Menu Tastings</h1>
            <p className="text-muted-foreground">
              Review tasting bookings, follow-ups, and contract conversion readiness.
            </p>
          </div>
          <Button asChild>
            <Link to="/menu-tastings/new">
              <Plus className="mr-2 h-4 w-4" />
              Book Tasting
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by client, email, phone, or tasting number..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row xl:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-56">
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
                    <SelectValue placeholder="Sort bookings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_desc">Latest Made</SelectItem>
                    <SelectItem value="created_asc">Oldest Made</SelectItem>
                    <SelectItem value="date_desc">Latest Tasting Date</SelectItem>
                    <SelectItem value="date_asc">Nearest Tasting Date</SelectItem>
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

            {filteredTastings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">No tasting bookings found</h3>
                  <p className="mb-4 max-w-md text-center text-muted-foreground">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or current status filter.'
                      : 'Start by booking your first menu tasting.'}
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Button asChild>
                      <Link to="/menu-tastings/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Book Tasting
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="flex flex-col gap-2 border-b px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>Showing {filteredTastings.length} of {tastings.length} tasting bookings</span>
                    <span>{getSortSummary()}</span>
                  </div>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tasting</TableHead>
                          <TableHead>Booking</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Contract</TableHead>
                          <TableHead className="w-[320px]">Next Step</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTastings.map((tasting) => {
                          const timing = getTimingMeta(tasting);
                          const nextStep = getNextStepMeta(tasting);

                          return (
                            <TableRow key={tasting._id} className={cn(getRowClassName(tasting))}>
                              <TableCell className="align-top">
                                <div className="space-y-2">
                                  <div className="font-medium">{formatDate(tasting.tastingDate)}</div>
                                  <div className="text-sm text-muted-foreground">{tasting.tastingTime}</div>
                                  <Badge variant="outline" className={timing.className}>
                                    {timing.label}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="space-y-1">
                                  <div className="font-semibold">{tasting.tastingNumber}</div>
                                  <div className="text-sm text-foreground">{tasting.clientName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {tasting.clientEmail} | {tasting.clientPhone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="space-y-1 text-sm">
                                  <p className="font-medium capitalize">{formatEventTypeLabel(tasting.eventType)}</p>
                                  <p className="text-muted-foreground">Preferred event: {formatDate(tasting.preferredEventDate)}</p>
                                  <p className="text-muted-foreground">
                                    {tasting.expectedGuests || 0} expected guests | {tasting.numberOfPax || 0} tasting pax
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <Badge variant="outline" className={getStatusColor(tasting.status)}>
                                  {formatStatusLabel(tasting.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                {tasting.contractCreated && tasting.contract ? (
                                  <div className="space-y-1">
                                    <Badge variant="outline" className={getContractBadgeClassName(true)}>
                                      Contract Linked
                                    </Badge>
                                    <p className="text-sm font-medium">{tasting.contract.contractNumber}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                      {formatStatusLabel(tasting.contract.status)}
                                    </p>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className={getContractBadgeClassName(false)}>
                                    Not yet created
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="space-y-1">
                                  <p className={cn('font-medium', nextStep.className)}>{nextStep.title}</p>
                                  <p className="text-sm text-muted-foreground">{nextStep.note}</p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top text-right">
                                <div className="flex flex-col items-end gap-2">
                                  <Button asChild variant="outline" size="sm">
                                    <Link to={`/menu-tastings/${tasting._id}`}>View Details</Link>
                                  </Button>
                                  {tasting.contractCreated && tasting.contract?._id ? (
                                    <Button asChild size="sm">
                                      <Link to={`/contracts/${tasting.contract._id}`}>View Contract</Link>
                                    </Button>
                                  ) : tasting.status === 'confirmed' || tasting.status === 'completed' ? (
                                    <Button asChild size="sm">
                                      <Link to={`/contracts/new?tasting=${tasting._id}`}>Create Contract</Link>
                                    </Button>
                                  ) : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid gap-3 p-4 md:hidden">
                    {filteredTastings.map((tasting) => {
                      const timing = getTimingMeta(tasting);
                      const nextStep = getNextStepMeta(tasting);

                      return (
                        <div key={tasting._id} className={cn('rounded-lg border p-4', getRowClassName(tasting))}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">{tasting.tastingNumber}</span>
                                <Badge variant="outline" className={getStatusColor(tasting.status)}>
                                  {formatStatusLabel(tasting.status)}
                                </Badge>
                              </div>
                              <div>
                                <p className="font-medium">{tasting.clientName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatEventTypeLabel(tasting.eventType)} | {tasting.expectedGuests || 0} guests
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className={timing.className}>
                              {timing.label}
                            </Badge>
                          </div>

                          <div className="mt-4 grid gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(tasting.tastingDate)} at {tasting.tastingTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{tasting.numberOfPax || 0} tasting pax | {tasting.expectedGuests || 0} expected guests</span>
                            </div>
                            <div className="text-muted-foreground">
                              Preferred event: {formatDate(tasting.preferredEventDate)}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Badge variant="outline" className={getContractBadgeClassName(Boolean(tasting.contractCreated))}>
                              {tasting.contractCreated ? `Contract ${tasting.contract?.contractNumber || 'linked'}` : 'No contract yet'}
                            </Badge>
                          </div>

                          <div className="mt-4 space-y-1">
                            <p className={cn('text-sm font-medium', nextStep.className)}>{nextStep.title}</p>
                            <p className="text-sm text-muted-foreground">{nextStep.note}</p>
                          </div>

                          <div className="mt-4 grid gap-2">
                            <Button asChild variant="outline" className="w-full">
                              <Link to={`/menu-tastings/${tasting._id}`}>View Details</Link>
                            </Button>
                            {tasting.contractCreated && tasting.contract?._id ? (
                              <Button asChild className="w-full">
                                <Link to={`/contracts/${tasting.contract._id}`}>View Contract</Link>
                              </Button>
                            ) : tasting.status === 'confirmed' || tasting.status === 'completed' ? (
                              <Button asChild className="w-full">
                                <Link to={`/contracts/new?tasting=${tasting._id}`}>Create Contract</Link>
                              </Button>
                            ) : null}
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
              title="Menu Tasting Calendar"
              sortMode={sortOrder}
              bookings={filteredTastings.map((tasting) => ({
                _id: tasting._id,
                date: tasting.tastingDate,
                createdAt: tasting.createdAt,
                type: 'tasting' as const,
                clientName: tasting.clientName,
                status: tasting.status,
                totalGuests: tasting.numberOfPax,
              }))}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
