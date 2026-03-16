import { useEffect, useState } from 'react';
import { Calendar, Package, Truck, Users } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import DepartmentWorklist, { type WorklistRow } from '@/components/DepartmentWorklist';
import { api } from '@/services/api';
import { formatLabel, getDaysUntilDate, getTimingMeta } from '@/lib/worklist';

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
  logisticsAssignment?: {
    truck?: string | null;
    driver?: string | null;
    assignmentStatus?: string;
  };
}

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

const getNextStepMeta = (contract: Contract) => {
  const daysUntil = getDaysUntilDate(contract.eventDate);
  const assignmentStatus = contract.logisticsAssignment?.assignmentStatus || 'pending';

  if (!contract.logisticsAssignment?.truck) {
    return {
      title: 'Book truck and assign driver',
      note: 'No vehicle is assigned yet. Open the logistics tab and reserve the event transport.',
      className: 'text-amber-900',
    };
  }

  if (assignmentStatus === 'completed') {
    return {
      title: 'Logistics closeout completed',
      note: 'This event already has a finished logistics record.',
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
      note: 'Vehicle booking exists. Finalize crew, cargo flow, and dispatch schedule.',
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

  return {
    id: contract._id,
    eventDate: contract.eventDate,
    createdAt: contract.createdAt,
    timingLabel: timing.label,
    timingClassName: timing.className,
    title: contract.contractNumber,
    subtitle: contract.clientName,
    details: [
      `${contract.venue?.name || 'No venue saved'} | ${contract.totalPacks || 0} packs`,
      `${contract.estimatedWaiters || calculateWaiters(contract.totalPacks)} waiters | ${contract.estimatedVehicles || calculateVehicles(contract.totalPacks)} vehicle(s)`,
    ],
    statusLabel: formatLabel(assignmentStatus) || 'pending',
    statusClassName: getLogisticsStatusClassName(assignmentStatus),
    extraBadges: needsUrgentAction ? [
      {
        label: 'Action Required',
        className: 'border-red-200 bg-red-50 text-red-700',
      },
    ] : undefined,
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
    searchText: `${contract.venue?.name || ''} ${assignmentStatus}`,
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
              title: 'Needs Truck',
              value: needsBookingContracts.length,
              note: 'Approved events without a saved logistics booking yet',
              icon: Truck,
            },
            {
              title: 'Estimated Waiters',
              value: approvedContracts.reduce((sum, contract) => sum + (contract.estimatedWaiters || calculateWaiters(contract.totalPacks)), 0),
              note: 'Current manpower estimate across approved events',
              icon: Users,
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
