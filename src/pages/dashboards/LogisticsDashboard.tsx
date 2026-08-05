import { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, Package, PackageCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import DepartmentWorklist, { type WorklistRow } from '@/components/DepartmentWorklist';
import { api } from '@/services/api';
import { formatLabel, getDaysUntilDate, getTimingMeta } from '@/lib/worklist';

interface ReadinessDepartment {
  key: string;
  label: string;
  applicable: boolean;
  total: number;
  prepared: number;
  pending: number;
  isReady: boolean;
  detail: string;
}

// Computed by the server (loadingReadiness.js) so the dashboard, the contract
// screen and the reminder sweep all read one definition of "ready to load".
interface LoadingReadiness {
  departments: ReadinessDepartment[];
  blockers: ReadinessDepartment[];
  readyCount: number;
  applicableCount: number;
  allReady: boolean;
  hasAnyRequirement: boolean;
  summary: string;
}

interface Contract {
  _id: string;
  contractNumber: string;
  createdAt?: string;
  clientName: string;
  eventDate: string;
  venue: { name: string; address: string };
  status: string;
  totalPacks: number;
  estimatedWaiters?: number;
  estimatedVehicles?: number;
  loadingReadiness?: LoadingReadiness;
  logisticsAssignment?: {
    truck?: string | null;
    driver?: string | null;
    assignmentStatus?: string;
  };
}

// Loading may begin the day before the event, so everything has to be prepared
// the day before that. Mirrors READINESS_DEADLINE_DAYS on the server.
const READINESS_DEADLINE_DAYS = 2;

const describeBlockers = (blockers: ReadinessDepartment[]) => {
  const labels = blockers.map((blocker) => blocker.label);
  if (labels.length <= 1) return labels[0] || '';
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
};

const calculateWaiters = (packs: number) => Math.max(2, Math.ceil(packs / 25));
const calculateVehicles = (packs: number) => Math.max(1, Math.ceil(packs / 100));

const getLogisticsStatusClassName = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'dispatched':
    case 'ready_for_dispatch':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'scheduled':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    default:
      return 'bg-amber-100 text-amber-900 border-amber-200';
  }
};

// The next step used to be derived from the date and the truck booking alone,
// so it read "confirm loading" on the eve of an event whose linen had not been
// washed. It now weighs preparation against the loading window, which is the
// call Logistics actually has to make: load, chase, or re-sequence.
const getNextStepMeta = (contract: Contract) => {
  const daysUntil = getDaysUntilDate(contract.eventDate);
  const assignmentStatus = contract.logisticsAssignment?.assignmentStatus || 'pending';
  const readiness = contract.loadingReadiness;
  const tracksReadiness = Boolean(readiness?.hasAnyRequirement);
  const blockers = readiness?.blockers || [];

  // No truck is the harder blocker, so it still leads. But inside the loading
  // window an event can be short a truck *and* short a department, and naming
  // only the truck would hide half the problem on the one line the user reads.
  if (!contract.logisticsAssignment?.truck) {
    const alsoBlocked = tracksReadiness && blockers.length > 0 && daysUntil <= READINESS_DEADLINE_DAYS;
    return {
      title: alsoBlocked
        ? `Book truck - and ${describeBlockers(blockers)} not ready`
        : 'Book truck and assign driver',
      note: alsoBlocked
        ? `No vehicle is assigned yet and loading is ${daysUntil <= 1 ? 'already due' : 'due tomorrow'}. ${describeBlockers(blockers)} still outstanding: ${blockers.map((blocker) => blocker.detail).join('; ')}.`
        : 'No vehicle is assigned yet. Open the logistics tab and reserve the event transport.',
      className: alsoBlocked && daysUntil <= 1 ? 'text-red-700' : 'text-amber-900',
    };
  }

  if (assignmentStatus === 'completed') {
    return {
      title: 'Logistics closeout completed',
      note: 'This event already has a finished logistics record.',
      className: 'text-green-800',
    };
  }

  // Inside the loading window with departments still outstanding: the decision
  // is who to chase, so name them rather than saying "confirm loading".
  if (tracksReadiness && blockers.length > 0 && daysUntil <= READINESS_DEADLINE_DAYS) {
    const names = describeBlockers(blockers);
    if (daysUntil <= 1) {
      return {
        title: `Event at risk - chase ${names}`,
        note: `Loading should be under way but ${readiness!.readyCount} of ${readiness!.applicableCount} department(s) are ready. Outstanding: ${blockers.map((blocker) => `${blocker.label} (${blocker.detail})`).join(', ')}.`,
        className: 'text-red-700',
      };
    }
    return {
      title: `Follow up with ${names} before loading`,
      note: `Loading starts tomorrow and ${names} ${blockers.length === 1 ? 'has' : 'have'} items outstanding: ${blockers.map((blocker) => blocker.detail).join('; ')}.`,
      className: 'text-amber-900',
    };
  }

  if (tracksReadiness && readiness!.allReady && daysUntil <= READINESS_DEADLINE_DAYS) {
    return {
      title: 'Cleared to load',
      note: `All ${readiness!.applicableCount} department(s) have marked their items prepared. Confirm travel timing and on-site arrival.`,
      className: 'text-green-800',
    };
  }

  if (daysUntil <= 1) {
    return {
      title: 'Dispatch and loading window',
      note: 'The event is immediate. Confirm loading, travel timing, and on-site arrival.',
      className: 'text-red-700',
    };
  }

  if (daysUntil <= 3) {
    return {
      title: 'Confirm staging and route',
      note: tracksReadiness && blockers.length > 0
        ? `Vehicle booking exists. ${describeBlockers(blockers)} still preparing - ${readiness!.summary}.`
        : 'Vehicle booking exists. Finalize crew, cargo flow, and dispatch schedule.',
      className: 'text-blue-800',
    };
  }

  return {
    title: 'Review logistics plan',
    note: 'The booking is on the calendar. Recheck the transport setup before the event window tightens.',
    className: 'text-slate-700',
  };
};

const toRow = (contract: Contract): WorklistRow => {
  const timing = getTimingMeta(contract.eventDate, { pastLabel: 'Past event' });
  const assignmentStatus = contract.logisticsAssignment?.assignmentStatus || 'pending';
  const nextStep = getNextStepMeta(contract);
  const needsUrgentAction = !contract.logisticsAssignment?.truck || getDaysUntilDate(contract.eventDate) <= 2;
  const readiness = contract.loadingReadiness;
  const tracksReadiness = Boolean(readiness?.hasAnyRequirement);

  // Readiness badge: green once every department has finished, otherwise the
  // count so the gap is visible without opening the contract.
  const readinessBadge = !tracksReadiness
    ? null
    : readiness!.allReady
      ? { label: 'Ready to load', className: 'border-green-200 bg-green-50 text-green-700' }
      : {
          label: `${readiness!.readyCount}/${readiness!.applicableCount} ready`,
          className: getDaysUntilDate(contract.eventDate) <= READINESS_DEADLINE_DAYS
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-amber-200 bg-amber-50 text-amber-900',
        };

  return {
    id: contract._id,
    eventDate: contract.eventDate,
    createdAt: contract.createdAt,
    timingLabel: timing.label,
    timingClassName: timing.className,
    title: contract.contractNumber,
    subtitle: contract.clientName,
    details: [
      `${contract.venue?.name || 'No venue saved'} | ${contract.totalPacks || 0} pax`,
      `${contract.estimatedWaiters || calculateWaiters(contract.totalPacks)} waiters | ${contract.estimatedVehicles || calculateVehicles(contract.totalPacks)} vehicle(s)`,
      ...(tracksReadiness
        ? [readiness!.allReady
            ? `Loading readiness: all ${readiness!.applicableCount} department(s) prepared`
            : `Loading readiness: waiting on ${describeBlockers(readiness!.blockers)}`]
        : []),
    ],
    statusLabel: formatLabel(assignmentStatus) || 'pending',
    statusClassName: getLogisticsStatusClassName(assignmentStatus),
    extraBadges: [
      ...(needsUrgentAction ? [{
        label: 'Action Required',
        className: 'border-red-200 bg-red-50 text-red-700',
      }] : []),
      ...(readinessBadge ? [readinessBadge] : []),
    ],
    nextStepTitle: nextStep.title,
    nextStepNote: nextStep.note,
    nextStepClassName: nextStep.className,
    primaryAction: {
      label: 'Open Logistics',
      href: `/contracts/${contract._id}?tab=logistics`,
      variant: 'outline',
    },
    secondaryAction: {
      label: 'View Contract',
      href: `/contracts/${contract._id}`,
      variant: 'default',
    },
    rowClassName: needsUrgentAction ? 'bg-red-50/20' : undefined,
    searchText: `${contract.venue?.name || ''} ${assignmentStatus} ${
      tracksReadiness ? (readiness!.allReady ? 'ready to load' : `not ready ${readiness!.blockers.map((blocker) => blocker.label).join(' ')}`) : ''
    }`,
  };
};

export default function LogisticsDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
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

  const approvedContracts = contracts.filter((contract) => contract.status === 'approved');
  const thisWeekContracts = approvedContracts.filter((contract) => {
    const daysUntil = getDaysUntilDate(contract.eventDate);
    return daysUntil >= 0 && daysUntil <= 7;
  });
  const needsBookingContracts = approvedContracts.filter((contract) => !contract.logisticsAssignment?.truck);
  const scheduledContracts = approvedContracts.filter((contract) => Boolean(contract.logisticsAssignment?.truck));

  // Events inside the loading window that cannot be loaded yet. This is the
  // queue the panel's question was really about: not "what do we bring", but
  // "which of tomorrow's events is going to hold up a truck".
  const notReadyContracts = approvedContracts.filter((contract) => {
    const daysUntil = getDaysUntilDate(contract.eventDate);
    return daysUntil >= 0
      && daysUntil <= READINESS_DEADLINE_DAYS
      && Boolean(contract.loadingReadiness?.hasAnyRequirement)
      && !contract.loadingReadiness!.allReady;
  });
  const readyToLoadContracts = thisWeekContracts.filter(
    (contract) => contract.loadingReadiness?.allReady
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Logistics Dashboard</h1>
          <p className="text-muted-foreground">
            Review transport bookings, dispatch readiness, and upcoming event logistics in one place.
          </p>
        </div>

        <DepartmentWorklist
          summaryCards={[
            {
              title: 'Approved Events',
              value: approvedContracts.length,
              note: 'Contracts already released for operations',
              icon: Package,
            },
            {
              title: 'This Week',
              value: thisWeekContracts.length,
              note: 'Upcoming events inside the next seven days',
              icon: Calendar,
            },
            {
              title: 'Ready To Load',
              value: readyToLoadContracts.length,
              note: `Of ${thisWeekContracts.length} event(s) this week, every department has finished`,
              icon: PackageCheck,
            },
            {
              title: 'Not Ready',
              value: notReadyContracts.length,
              note: 'Loading starts within two days but a department is still preparing',
              icon: AlertTriangle,
            },
            {
              title: 'Needs Truck',
              value: needsBookingContracts.length,
              note: 'Approved events without a saved logistics booking yet',
              icon: Truck,
            },
          ]}
          tabs={[
            {
              value: 'week',
              label: `This Week (${thisWeekContracts.length})`,
              emptyTitle: 'No logistics work scheduled this week',
              emptyMessage: 'Approved events in the next seven days will appear here automatically.',
              rows: thisWeekContracts.map(toRow),
            },
            {
              value: 'not-ready',
              label: `Not Ready (${notReadyContracts.length})`,
              emptyTitle: 'Every event in the loading window is ready',
              emptyMessage: 'Events loading within the next two days appear here while any department is still preparing.',
              rows: notReadyContracts.map(toRow),
            },
            {
              value: 'needs-booking',
              label: `Needs Booking (${needsBookingContracts.length})`,
              emptyTitle: 'All approved events already have a truck booked',
              emptyMessage: 'Any unassigned event transport will show up here.',
              rows: needsBookingContracts.map(toRow),
            },
            {
              value: 'scheduled',
              label: `Scheduled (${scheduledContracts.length})`,
              emptyTitle: 'No scheduled logistics records yet',
              emptyMessage: 'Once a truck is assigned, it will appear here for monitoring.',
              rows: scheduledContracts.map(toRow),
            },
          ]}
          defaultTab="week"
          searchPlaceholder="Search logistics bookings by contract, client, venue, or status..."
        />
      </div>
    </Layout>
  );
}
