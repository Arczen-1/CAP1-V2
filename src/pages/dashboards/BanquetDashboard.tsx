import { useEffect, useState } from 'react';
import { Calendar, CheckCircle, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import DepartmentWorklist, { type WorklistRow } from '@/components/DepartmentWorklist';
import { useAuth } from '@/contexts/AuthContext';
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
  progress: number;
  totalPacks: number;
  clientType: string;
  currentDepartment: string;
  assignedSupervisor?: { _id: string; name: string };
}

const getBanquetStatusClassName = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'completed':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

const getNextStepMeta = (contract: Contract) => {
  const daysUntil = getDaysUntilDate(contract.eventDate);

  if (daysUntil < 0) {
    return {
      title: 'Review event closeout',
      note: 'The event date has passed. Confirm final team wrap-up and any remaining follow-up.',
      className: 'text-amber-900',
    };
  }

  if (daysUntil <= 1) {
    return {
      title: 'Event-day coordination',
      note: 'Banquet oversight should be active now, including arrival times, venue setup, and service flow.',
      className: 'text-red-700',
    };
  }

  if (daysUntil <= 7) {
    return {
      title: 'Finalize day-of staffing',
      note: 'Use this window to recheck assignments, sequencing, and event execution readiness.',
      className: 'text-orange-800',
    };
  }

  return {
    title: 'Monitor event preparation',
    note: 'The contract is already active. Banquet should stay aligned with operations as the date approaches.',
    className: 'text-slate-700',
  };
};

const toRow = (contract: Contract): WorklistRow => {
  const timing = getTimingMeta(contract.eventDate, { pastLabel: 'Past event' });
  const nextStep = getNextStepMeta(contract);
  const needsUrgentAttention = getDaysUntilDate(contract.eventDate) <= 1;

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
      `${formatLabel(contract.clientType)} | Current department: ${formatLabel(contract.currentDepartment) || 'operations'}`,
    ],
    statusLabel: formatLabel(contract.status),
    statusClassName: getBanquetStatusClassName(contract.status),
    extraBadges: [
      {
        label: `${contract.progress || 0}% ready`,
        className: 'border-slate-200 bg-slate-50 text-slate-700',
      },
      ...(needsUrgentAttention ? [{
        label: 'Urgent',
        className: 'border-red-200 bg-red-50 text-red-700',
      }] : []),
    ],
    nextStepTitle: nextStep.title,
    nextStepNote: nextStep.note,
    nextStepClassName: nextStep.className,
    primaryAction: {
      label: 'Open Banquet Plan',
      href: `/contracts/${contract._id}?tab=banquet`,
      variant: 'outline',
    },
    secondaryAction: {
      label: 'View Event Details',
      href: `/contracts/${contract._id}`,
      variant: 'default',
    },
    rowClassName: needsUrgentAttention ? 'bg-red-50/20' : undefined,
    searchText: `${contract.venue?.name || ''} ${contract.currentDepartment} ${contract.clientType}`,
  };
};

export default function BanquetDashboard() {
  const { user } = useAuth();
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

  const visibleContracts = contracts.filter((contract) =>
    contract.assignedSupervisor?._id === user?.id || contract.status === 'approved'
  );
  const upcomingEvents = visibleContracts.filter((contract) => {
    const daysUntil = getDaysUntilDate(contract.eventDate);
    return daysUntil >= 0 && daysUntil <= 7;
  });
  const pendingTasks = visibleContracts.filter((contract) => contract.progress < 100);
  const completedEvents = visibleContracts.filter((contract) => contract.progress >= 100 || contract.status === 'completed');

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
          <h1 className="text-3xl font-bold tracking-tight">Banquet Operations</h1>
          <p className="text-muted-foreground">
            Oversee the service team, execution timeline, and event-day follow-through.
          </p>
        </div>

        <DepartmentWorklist
          summaryCards={[
            {
              title: 'Banquet Queue',
              value: visibleContracts.length,
              note: 'Approved or assigned events currently visible to banquet',
              icon: Users,
            },
            {
              title: 'This Week',
              value: upcomingEvents.length,
              note: 'Event dates happening inside the next seven days',
              icon: Calendar,
            },
            {
              title: 'Pending Work',
              value: pendingTasks.length,
              note: 'Events that are not yet fully progressed or closed out',
              icon: Clock,
            },
            {
              title: 'Completed',
              value: completedEvents.length,
              note: 'Events already marked done or fully progressed',
              icon: CheckCircle,
            },
          ]}
          tabs={[
            {
              value: 'upcoming',
              label: `This Week (${upcomingEvents.length})`,
              emptyTitle: 'No banquet events this week',
              emptyMessage: 'Upcoming banquet assignments will appear here as event dates get closer.',
              rows: upcomingEvents.map(toRow),
            },
            {
              value: 'assigned',
              label: `All Visible (${visibleContracts.length})`,
              emptyTitle: 'No banquet events available',
              emptyMessage: 'Approved or assigned contracts will show up here for banquet oversight.',
              rows: visibleContracts.map(toRow),
            },
            {
              value: 'pending',
              label: `Pending (${pendingTasks.length})`,
              emptyTitle: 'No banquet follow-ups pending',
              emptyMessage: 'Any incomplete events or coordination tasks will appear here.',
              rows: pendingTasks.map(toRow),
            },
          ]}
          defaultTab="upcoming"
          searchPlaceholder="Search banquet events by contract, client, venue, or department..."
        />
      </div>
    </Layout>
  );
}
