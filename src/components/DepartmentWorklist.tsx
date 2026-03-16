import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpDown, Search } from 'lucide-react';
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
import { getSortTimestamp } from '@/lib/worklist';
import { cn } from '@/lib/utils';

type SortOrder = 'created_desc' | 'created_asc';

interface SummaryCard {
  title: string;
  value: number | string;
  note: string;
  icon: LucideIcon;
}

interface WorklistBadge {
  label: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface WorklistAction {
  label: string;
  href: string;
  variant?: 'default' | 'outline' | 'secondary';
}

interface WorklistFilterOption {
  value: string;
  label: string;
}

export interface WorklistRow {
  id: string;
  eventDate: string;
  createdAt?: string;
  timingLabel: string;
  timingClassName: string;
  title: string;
  subtitle: string;
  details: string[];
  statusLabel: string;
  statusClassName: string;
  statusVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  extraBadges?: WorklistBadge[];
  nextStepTitle: string;
  nextStepNote: string;
  nextStepClassName?: string;
  primaryAction: WorklistAction;
  secondaryAction?: WorklistAction;
  rowClassName?: string;
  searchText?: string;
  filterValue?: string;
}

interface WorklistTab {
  value: string;
  label: string;
  emptyTitle: string;
  emptyMessage: string;
  rows: WorklistRow[];
}

interface DepartmentWorklistProps {
  summaryCards: SummaryCard[];
  tabs: WorklistTab[];
  defaultTab?: string;
  searchPlaceholder?: string;
  filterOptions?: WorklistFilterOption[];
  filterPlaceholder?: string;
  emptyAction?: WorklistAction;
  emptyActionLabel?: string;
}

const formatDate = (value: string) => new Date(value).toLocaleDateString(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default function DepartmentWorklist({
  summaryCards,
  tabs,
  defaultTab,
  searchPlaceholder = 'Search by contract, client, or notes...',
  filterOptions,
  filterPlaceholder = 'Filter records',
  emptyAction,
  emptyActionLabel,
}: DepartmentWorklistProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('created_desc');
  const fallbackTab = tabs[0]?.value || 'overview';
  const activeDefaultTab = defaultTab || fallbackTab;
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const getVisibleRows = (rows: WorklistRow[]) => {
    const filteredRows = rows.filter((row) => {
      if (filterOptions?.length && filterValue !== 'all' && row.filterValue !== filterValue) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        row.title,
        row.subtitle,
        row.statusLabel,
        row.nextStepTitle,
        row.nextStepNote,
        ...(row.details || []),
        row.searchText || '',
      ].join(' ').toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    return filteredRows.sort((left, right) => {
      const leftTime = getSortTimestamp(left.createdAt, left.eventDate);
      const rightTime = getSortTimestamp(right.createdAt, right.eventDate);
      const timeDelta = sortOrder === 'created_desc' ? rightTime - leftTime : leftTime - rightTime;

      if (timeDelta !== 0) {
        return timeDelta;
      }

      return sortOrder === 'created_desc'
        ? right.title.localeCompare(left.title)
        : left.title.localeCompare(right.title);
    });
  };

  return (
    <div className="space-y-4">
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

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>
            {filterOptions?.length ? (
              <Select value={filterValue} onValueChange={setFilterValue}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder={filterPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
              <SelectTrigger className="w-full sm:w-56">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by created date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Newest Contract First</SelectItem>
                <SelectItem value="created_asc">Oldest Contract First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={activeDefaultTab} className="space-y-4">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => {
          const visibleRows = getVisibleRows(tab.rows);

          return (
            <TabsContent key={tab.value} value={tab.value} className="space-y-4">
              {visibleRows.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 rounded-full bg-muted p-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium">{tab.emptyTitle}</h3>
                    <p className="mb-4 max-w-md text-muted-foreground">
                      {normalizedSearch ? 'Try adjusting your search to find the records you need.' : tab.emptyMessage}
                    </p>
                    {normalizedSearch ? null : emptyAction && emptyActionLabel ? (
                      <Button asChild variant={emptyAction.variant || 'default'}>
                        <Link to={emptyAction.href}>{emptyActionLabel}</Link>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="flex flex-col gap-2 border-b px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                      <span>Showing {visibleRows.length} record{visibleRows.length === 1 ? '' : 's'}</span>
                      <span>{sortOrder === 'created_desc' ? 'Sorted by newest contracts first' : 'Sorted by oldest contracts first'}</span>
                    </div>

                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Booking</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[320px]">Next Step</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visibleRows.map((row) => (
                            <TableRow key={row.id} className={cn(row.rowClassName)}>
                              <TableCell className="align-top">
                                <div className="space-y-2">
                                  <div className="font-medium">{formatDate(row.eventDate)}</div>
                                  <Badge variant="outline" className={row.timingClassName}>
                                    {row.timingLabel}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold">{row.title}</span>
                                    {row.extraBadges?.map((badge) => (
                                      <Badge
                                        key={`${row.id}-${badge.label}`}
                                        variant={badge.variant || 'outline'}
                                        className={badge.className}
                                      >
                                        {badge.label}
                                      </Badge>
                                    ))}
                                  </div>
                                  <div className="text-sm text-foreground">{row.subtitle}</div>
                                  {row.details.map((detail) => (
                                    <div key={`${row.id}-${detail}`} className="text-xs text-muted-foreground">
                                      {detail}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <Badge variant={row.statusVariant || 'outline'} className={row.statusClassName}>
                                  {row.statusLabel}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="space-y-1">
                                  <p className={cn('font-medium', row.nextStepClassName)}>{row.nextStepTitle}</p>
                                  <p className="text-sm text-muted-foreground">{row.nextStepNote}</p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top text-right">
                                <div className="flex flex-col items-end gap-2">
                                  <Button asChild size="sm" variant={row.primaryAction.variant || 'outline'}>
                                    <Link to={row.primaryAction.href}>{row.primaryAction.label}</Link>
                                  </Button>
                                  {row.secondaryAction ? (
                                    <Button asChild size="sm" variant={row.secondaryAction.variant || 'default'}>
                                      <Link to={row.secondaryAction.href}>{row.secondaryAction.label}</Link>
                                    </Button>
                                  ) : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="grid gap-3 p-4 md:hidden">
                      {visibleRows.map((row) => (
                        <div key={row.id} className={cn('rounded-lg border p-4', row.rowClassName)}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">{row.title}</span>
                                <Badge variant={row.statusVariant || 'outline'} className={row.statusClassName}>
                                  {row.statusLabel}
                                </Badge>
                              </div>
                              <div>
                                <p className="font-medium">{row.subtitle}</p>
                                {row.details.map((detail) => (
                                  <p key={`${row.id}-${detail}`} className="text-sm text-muted-foreground">
                                    {detail}
                                  </p>
                                ))}
                              </div>
                            </div>
                            <Badge variant="outline" className={row.timingClassName}>
                              {row.timingLabel}
                            </Badge>
                          </div>

                          {row.extraBadges?.length ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {row.extraBadges.map((badge) => (
                                <Badge
                                  key={`${row.id}-mobile-${badge.label}`}
                                  variant={badge.variant || 'outline'}
                                  className={badge.className}
                                >
                                  {badge.label}
                                </Badge>
                              ))}
                            </div>
                          ) : null}

                          <div className="mt-4 space-y-1">
                            <p className={cn('text-sm font-medium', row.nextStepClassName)}>{row.nextStepTitle}</p>
                            <p className="text-sm text-muted-foreground">{row.nextStepNote}</p>
                          </div>

                          <div className="mt-4 grid gap-2">
                            <Button asChild variant={row.primaryAction.variant || 'outline'} className="w-full">
                              <Link to={row.primaryAction.href}>{row.primaryAction.label}</Link>
                            </Button>
                            {row.secondaryAction ? (
                              <Button asChild variant={row.secondaryAction.variant || 'default'} className="w-full">
                                <Link to={row.secondaryAction.href}>{row.secondaryAction.label}</Link>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
