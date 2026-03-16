import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import { addMonths, format, isSameDay, isSameMonth, startOfMonth } from 'date-fns';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSortTimestamp } from '@/lib/worklist';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  Users,
  Utensils,
} from 'lucide-react';

interface Booking {
  _id: string;
  date: string;
  createdAt?: string;
  type: 'tasting' | 'contract';
  clientName: string;
  status?: string;
  venue?: string;
  totalGuests?: number;
}

export type BookingSortMode = 'created_desc' | 'created_asc' | 'date_desc' | 'date_asc';

interface BookingCalendarProps {
  bookings: Booking[];
  title?: string;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  sortMode?: BookingSortMode;
  getBookingHref?: (booking: Booking) => string;
  getBookingActionLabel?: (booking: Booking) => string;
}

const dateKey = (value: Date) => format(value, 'yyyy-MM-dd');
const formatStatusLabel = (value?: string) => (value || 'pending').replace(/_/g, ' ');
const formatTypeLabel = (value: Booking['type']) => (value === 'tasting' ? 'Menu Tasting' : 'Contract');
const SORT_MODE_META: Record<BookingSortMode, { label: string; selectedDateCopy: string }> = {
  created_desc: {
    label: 'Latest Made',
    selectedDateCopy: 'Inside this date, newest-made bookings appear first.',
  },
  created_asc: {
    label: 'Oldest Made',
    selectedDateCopy: 'Inside this date, earliest-made bookings appear first.',
  },
  date_desc: {
    label: 'Latest Event Date',
    selectedDateCopy: 'Inside this date, later scheduled entries are shown first.',
  },
  date_asc: {
    label: 'Nearest Event Date',
    selectedDateCopy: 'Inside this date, earlier scheduled entries are shown first.',
  },
};

const getBookingLink = (booking: Booking) => (
  booking.type === 'tasting' ? `/menu-tastings/${booking._id}` : `/contracts/${booking._id}`
);

export default function BookingCalendar({
  bookings,
  title = 'Booking Calendar',
  onDateSelect,
  selectedDate,
  sortMode = 'created_desc',
  getBookingHref = getBookingLink,
  getBookingActionLabel = (booking) => (booking.type === 'tasting' ? 'Open Tasting' : 'Open Contract'),
}: BookingCalendarProps) {
  const initialDate = selectedDate || new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate));
  const [viewDate, setViewDate] = useState(initialDate);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    setViewDate(selectedDate);
    setCurrentMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const chronologicalBookings = [...bookings].sort((left, right) => {
    const leftTime = new Date(left.date).getTime();
    const rightTime = new Date(right.date).getTime();

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    if (left.type !== right.type) {
      return left.type.localeCompare(right.type);
    }

    return left.clientName.localeCompare(right.clientName);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortBookingsForDisplay = (items: Booking[]) => [...items].sort((left, right) => {
    const leftDate = new Date(left.date);
    const rightDate = new Date(right.date);
    leftDate.setHours(0, 0, 0, 0);
    rightDate.setHours(0, 0, 0, 0);

    if (sortMode === 'date_asc' || sortMode === 'date_desc') {
      const dateDelta = sortMode === 'date_asc'
        ? leftDate.getTime() - rightDate.getTime()
        : rightDate.getTime() - leftDate.getTime();

      if (dateDelta !== 0) {
        return dateDelta;
      }
    } else {
      const createdDelta = sortMode === 'created_desc'
        ? getSortTimestamp(right.createdAt, right.date) - getSortTimestamp(left.createdAt, left.date)
        : getSortTimestamp(left.createdAt, left.date) - getSortTimestamp(right.createdAt, right.date);

      if (createdDelta !== 0) {
        return createdDelta;
      }
    }

    const leftIsUpcoming = leftDate.getTime() >= today.getTime();
    const rightIsUpcoming = rightDate.getTime() >= today.getTime();

    if (leftIsUpcoming !== rightIsUpcoming) {
      return leftIsUpcoming ? -1 : 1;
    }

    if (left.type !== right.type) {
      return left.type.localeCompare(right.type);
    }

    return left.clientName.localeCompare(right.clientName);
  });

  const bookingsByDate = chronologicalBookings.reduce<Record<string, Booking[]>>((accumulator, booking) => {
    const key = dateKey(new Date(booking.date));
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(booking);
    return accumulator;
  }, {});

  const currentMonthBookings = chronologicalBookings.filter((booking) => isSameMonth(new Date(booking.date), currentMonth));
  const selectedDateBookings = sortBookingsForDisplay(bookingsByDate[dateKey(viewDate)] || []);
  const selectedDateContracts = selectedDateBookings.filter((booking) => booking.type === 'contract');
  const selectedDateTastings = selectedDateBookings.filter((booking) => booking.type === 'tasting');
  const selectedDateGuestCount = selectedDateBookings.reduce((sum, booking) => sum + (booking.totalGuests || 0), 0);
  const referenceDate = new Date(viewDate);
  referenceDate.setHours(0, 0, 0, 0);
  const chronologicalUpcomingMonthBookings = currentMonthBookings.filter((booking) => {
    const bookingDate = new Date(booking.date);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate.getTime() >= referenceDate.getTime();
  });
  const upcomingMonthTimeline = chronologicalUpcomingMonthBookings.reduce<Array<{ date: Date; bookings: Booking[] }>>((groups, booking) => {
    const bookingDate = new Date(booking.date);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && isSameDay(lastGroup.date, bookingDate)) {
      lastGroup.bookings.push(booking);
      return groups;
    }

    groups.push({
      date: bookingDate,
      bookings: [booking],
    });

    return groups;
  }, []);
  const nextBookedDateInMonth = selectedDateBookings.length === 0 ? upcomingMonthTimeline[0]?.date : null;

  const tastingDates = chronologicalBookings.filter((booking) => booking.type === 'tasting').map((booking) => new Date(booking.date));
  const contractDates = chronologicalBookings.filter((booking) => booking.type === 'contract').map((booking) => new Date(booking.date));
  const bookedDates = Object.keys(bookingsByDate).map((key) => new Date(key));

  const monthTastingsCount = currentMonthBookings.filter((booking) => booking.type === 'tasting').length;
  const monthContractsCount = currentMonthBookings.filter((booking) => booking.type === 'contract').length;
  const monthBookedDaysCount = new Set(currentMonthBookings.map((booking) => dateKey(new Date(booking.date)))).size;
  const monthGuestsCount = currentMonthBookings.reduce((sum, booking) => sum + (booking.totalGuests || 0), 0);
  const sortModeMeta = SORT_MODE_META[sortMode];

  const getMonthFocusDate = (month: Date) => {
    const normalizedMonth = startOfMonth(month);

    if (isSameMonth(viewDate, normalizedMonth)) {
      return viewDate;
    }

    const monthDates = chronologicalBookings
      .filter((booking) => isSameMonth(new Date(booking.date), normalizedMonth))
      .map((booking) => new Date(booking.date))
      .sort((left, right) => left.getTime() - right.getTime());

    if (monthDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isSameMonth(today, normalizedMonth)) {
        return monthDates.find((date) => {
          const comparable = new Date(date);
          comparable.setHours(0, 0, 0, 0);
          return comparable.getTime() >= today.getTime();
        }) || monthDates[monthDates.length - 1];
      }

      return monthDates[0];
    }

    const today = new Date();
    return isSameMonth(today, normalizedMonth) ? today : normalizedMonth;
  };

  const handleMonthChange = (nextMonth: Date) => {
    const normalizedMonth = startOfMonth(nextMonth);
    setCurrentMonth(normalizedMonth);
    setViewDate(getMonthFocusDate(normalizedMonth));
  };

  const BookingDayButton = ({
    day,
    modifiers,
    className,
    ...props
  }: ComponentProps<typeof CalendarDayButton>) => {
    const dayBookings = bookingsByDate[dateKey(day.date)] || [];
    const tastingCount = dayBookings.filter((booking) => booking.type === 'tasting').length;
    const contractCount = dayBookings.filter((booking) => booking.type === 'contract').length;

    return (
      <CalendarDayButton
        day={day}
        modifiers={modifiers}
        className={cn(
          'min-h-[82px] items-start justify-start rounded-xl px-2 py-1.5 text-left',
          dayBookings.length > 0 && !modifiers.selected && 'border border-border/70 bg-muted/30 hover:bg-muted/60',
          className,
        )}
        {...props}
      >
        <div className="flex w-full items-start justify-between">
          <span className="text-sm font-medium leading-none">{format(day.date, 'd')}</span>
          {dayBookings.length > 1 ? (
            <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground shadow-sm">
              {dayBookings.length}
            </span>
          ) : null}
        </div>
        {dayBookings.length > 0 ? (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-1">
              {contractCount > 0 ? (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {contractCount}C
                </span>
              ) : null}
              {tastingCount > 0 ? (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                  {tastingCount}T
                </span>
              ) : null}
            </div>
            <span className="block text-[10px] font-medium text-muted-foreground">
              {dayBookings.length} item{dayBookings.length === 1 ? '' : 's'}
            </span>
          </div>
        ) : null}
      </CalendarDayButton>
    );
  };

  const handleSelectDate = (date?: Date) => {
    if (!date) {
      return;
    }

    setCurrentMonth(startOfMonth(date));
    setViewDate(date);
    onDateSelect?.(date);
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    setViewDate(today);
    onDateSelect?.(today);
  };

  const goToPreviousMonth = () => handleMonthChange(addMonths(currentMonth, -1));
  const goToNextMonth = () => handleMonthChange(addMonths(currentMonth, 1));
  const renderBookingCard = (booking: Booking) => (
    <div key={booking._id} className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-full p-2',
                booking.type === 'tasting' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary',
              )}
            >
              {booking.type === 'tasting' ? <Utensils className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </span>
            <div>
              <p className="font-medium">{booking.clientName}</p>
              <p className="text-xs text-muted-foreground">{formatTypeLabel(booking.type)}</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={booking.type === 'tasting' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-blue-200 bg-blue-50 text-blue-800'}>
          {booking.type === 'tasting' ? 'Tasting' : 'Contract'}
        </Badge>
      </div>

      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
        {booking.venue ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{booking.venue}</span>
          </div>
        ) : null}
        {booking.totalGuests ? (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{booking.totalGuests} guests</span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {formatStatusLabel(booking.status)}
        </Badge>
        {booking.createdAt ? (
          <Badge variant="outline" className="text-xs">
            Made {format(new Date(booking.createdAt), 'MMM d, yyyy')}
          </Badge>
        ) : null}
      </div>

      <div className="mt-3 flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link to={getBookingHref(booking)}>
            {getBookingActionLabel(booking)}
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
        <Card>
          <CardHeader className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5" />
                {title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Select a date to review its bookings and use the month view to spot busy days quickly.
              </p>
            </div>
            <div className="space-y-3 sm:space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Booked days {monthBookedDaysCount}</Badge>
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                  Tastings {monthTastingsCount}
                </Badge>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
                  Contracts {monthContractsCount}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Button type="button" variant="outline" size="icon" onClick={goToPreviousMonth} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[170px] rounded-md border bg-background px-3 py-2 text-center text-sm font-medium">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <Button type="button" variant="outline" size="icon" onClick={goToNextMonth} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={jumpToToday}>
                  Today
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <Calendar
              mode="single"
              selected={viewDate}
              onSelect={handleSelectDate}
              month={currentMonth}
              onMonthChange={handleMonthChange}
              hideNavigation
              className="w-full rounded-xl border bg-background p-4"
              classNames={{
                root: 'w-full',
                months: 'w-full',
                month: 'w-full gap-3',
                month_caption: 'hidden',
                table: 'w-full',
                weekdays: 'grid grid-cols-7 gap-2',
                weekday: 'text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground',
                week: 'mt-2 grid grid-cols-7 gap-2',
                day: 'aspect-auto min-h-[72px]',
              }}
              modifiers={{
                booked: bookedDates,
                hasTasting: tastingDates,
                hasContract: contractDates,
              }}
              components={{
                DayButton: BookingDayButton,
              }}
            />

            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Menu Tasting</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>Contract</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </span>
                <span>Mixed day</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">{format(viewDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {sortModeMeta.selectedDateCopy}
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Total</p>
                  <p className="mt-1 text-2xl font-semibold">{selectedDateBookings.length}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Contracts</p>
                  <p className="mt-1 text-2xl font-semibold text-blue-800">{selectedDateContracts.length}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Tastings</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-800">{selectedDateTastings.length}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Guests</p>
                  <p className="mt-1 text-2xl font-semibold">{selectedDateGuestCount}</p>
                </div>
              </div>

              <ScrollArea className="h-[420px] pr-2">
                <div className="space-y-4">
                  {selectedDateBookings.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      <p>No bookings are scheduled for this date.</p>
                      {nextBookedDateInMonth ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => handleSelectDate(nextBookedDateInMonth)}
                        >
                          Jump To Next Booked Date
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDateContracts.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-800">Contracts</h3>
                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
                              {selectedDateContracts.length}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            {selectedDateContracts.map(renderBookingCard)}
                          </div>
                        </div>
                      ) : null}

                      {selectedDateTastings.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-800">Menu Tastings</h3>
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                              {selectedDateTastings.length}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            {selectedDateTastings.map(renderBookingCard)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Month Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upcoming dates stay in calendar order, while the selected day follows the current sort option: {sortModeMeta.label}.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[320px]">
                <div className="space-y-4 p-4">
                  {upcomingMonthTimeline.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No more bookings are scheduled in this month.
                    </div>
                  ) : (
                    upcomingMonthTimeline.slice(0, 8).map((group) => {
                      const groupContracts = group.bookings.filter((booking) => booking.type === 'contract').length;
                      const groupTastings = group.bookings.filter((booking) => booking.type === 'tasting').length;

                      return (
                        <button
                          key={dateKey(group.date)}
                          type="button"
                          className={cn(
                            'w-full rounded-xl border p-4 text-left transition-colors hover:bg-muted/30',
                            isSameDay(group.date, viewDate) && 'border-primary bg-primary/5',
                          )}
                          onClick={() => handleSelectDate(group.date)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{format(group.date, 'EEEE, MMM d')}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.bookings.length} booking{group.bookings.length === 1 ? '' : 's'}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {groupContracts > 0 ? (
                                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
                                  {groupContracts} Contract{groupContracts === 1 ? '' : 's'}
                                </Badge>
                              ) : null}
                              {groupTastings > 0 ? (
                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                                  {groupTastings} Tasting{groupTastings === 1 ? '' : 's'}
                                </Badge>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-3 space-y-1">
                            {group.bookings.slice(0, 3).map((booking) => (
                              <div key={`${booking._id}-${booking.date}`} className="flex items-center justify-between gap-3 text-sm">
                                <span className="truncate font-medium">{booking.clientName}</span>
                                <span className="text-xs text-muted-foreground">{formatTypeLabel(booking.type)}</span>
                              </div>
                            ))}
                            {group.bookings.length > 3 ? (
                              <p className="text-xs text-muted-foreground">
                                +{group.bookings.length - 3} more on this day
                              </p>
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Booked Days</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{monthBookedDaysCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Days in {format(currentMonth, 'MMMM yyyy')} with at least one booking</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Menu Tastings</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-700">{monthTastingsCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Tasting schedules booked in the current month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Contracts</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-blue-700">{monthContractsCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Event contracts scheduled in the current month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Guest Volume</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{monthGuestsCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Combined guest count for the month&apos;s loaded bookings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
