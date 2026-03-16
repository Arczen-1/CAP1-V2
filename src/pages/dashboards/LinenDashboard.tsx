import { useEffect, useState } from 'react';
import { Calendar, CheckCircle, Package, Shirt } from 'lucide-react';
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
  tableSetup: string;
  napkinType: string;
  linenStatus?: string;
}

const normalizeLinenStatus = (status?: string) => {
  if (status === 'dispatched') {
    return 'prepared';
  }

  return status || 'pending';
};

const getLinenStatusClassName = (status: string) => {
  switch (status) {
    case 'prepared':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'returned':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-amber-100 text-amber-900 border-amber-200';
  }
};

const calculateLinenNeeded = (contract: Contract) => ({
  tablecloths: contract.totalPacks,
  napkins: contract.totalPacks,
});

const getNextStepMeta = (contract: Contract) => {
  const linenStatus = normalizeLinenStatus(contract.linenStatus);

  if (linenStatus === 'prepared') {
    return {
      title: 'Prepared for event',
      note: 'The linen set is already prepared. Keep it aligned with the event schedule and return plan.',
      className: 'text-green-800',
    };
  }

  return {
    title: 'Prepare linen set',
    note: 'Open the inventory tab and update the linen items once the set is ready.',
    className: 'text-amber-900',
  };
};

const toRow = (contract: Contract): WorklistRow => {
  const timing = getTimingMeta(contract.eventDate, { pastLabel: 'Past event' });
  const linenStatus = normalizeLinenStatus(contract.linenStatus);
  const linenNeeded = calculateLinenNeeded(contract);
  const nextStep = getNextStepMeta(contract);

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
      `${linenNeeded.tablecloths} tablecloths | ${linenNeeded.napkins} napkins`,
      `Setup: ${contract.tableSetup || 'Not set'} | Napkin: ${contract.napkinType || 'Not set'}`,
    ],
    statusLabel: formatLabel(linenStatus) || 'pending',
    statusClassName: getLinenStatusClassName(linenStatus),
    extraBadges: linenStatus === 'pending' ? [
      {
        label: 'Needs prep',
        className: 'border-amber-200 bg-amber-50 text-amber-900',
      },
    ] : undefined,
    nextStepTitle: nextStep.title,
    nextStepNote: nextStep.note,
    nextStepClassName: nextStep.className,
    primaryAction: {
      label: 'Open Inventory',
      href: `/contracts/${contract._id}?tab=inventory`,
      variant: 'outline',
    },
    secondaryAction: {
      label: 'View Contract',
      href: `/contracts/${contract._id}`,
      variant: 'default',
    },
    rowClassName: linenStatus === 'pending' ? 'bg-amber-50/20' : undefined,
    searchText: `${contract.tableSetup} ${contract.napkinType} ${linenStatus}`,
  };
};

export default function LinenDashboard() {
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
  const pendingLinen = approvedContracts.filter((contract) => normalizeLinenStatus(contract.linenStatus) !== 'prepared');

  const totalLinen = approvedContracts.reduce((accumulator, contract) => {
    const needed = calculateLinenNeeded(contract);
    return {
      tablecloths: accumulator.tablecloths + needed.tablecloths,
      napkins: accumulator.napkins + needed.napkins,
    };
  }, { tablecloths: 0, napkins: 0 });

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
          <h1 className="text-3xl font-bold tracking-tight">Linen Dashboard</h1>
          <p className="text-muted-foreground">
            Review linen preparation, event demand, and return readiness across approved contracts.
          </p>
        </div>

        <DepartmentWorklist
          summaryCards={[
            {
              title: 'Approved Events',
              value: approvedContracts.length,
              note: 'Contracts currently open to linen preparation',
              icon: Shirt,
            },
            {
              title: 'This Week',
              value: thisWeekContracts.length,
              note: 'Events happening in the next seven days',
              icon: Calendar,
            },
            {
              title: 'Pending Prep',
              value: pendingLinen.length,
              note: 'Approved events whose linen sets are not yet prepared',
              icon: Package,
            },
            {
              title: 'Tablecloths Needed',
              value: totalLinen.tablecloths,
              note: 'Current total tablecloth demand across approved contracts',
              icon: CheckCircle,
            },
          ]}
          tabs={[
            {
              value: 'week',
              label: `This Week (${thisWeekContracts.length})`,
              emptyTitle: 'No linen work scheduled this week',
              emptyMessage: 'Upcoming approved events will appear here for short-term preparation.',
              rows: thisWeekContracts.map(toRow),
            },
            {
              value: 'pending',
              label: `Pending (${pendingLinen.length})`,
              emptyTitle: 'All linen sets are already prepared',
              emptyMessage: 'Any approved event still waiting on linen prep will show up here.',
              rows: pendingLinen.map(toRow),
            },
            {
              value: 'all',
              label: `All Events (${approvedContracts.length})`,
              emptyTitle: 'No approved contracts for linen yet',
              emptyMessage: 'Approved contracts will appear here once they enter the linen workflow.',
              rows: approvedContracts.map(toRow),
            },
          ]}
          defaultTab="week"
          searchPlaceholder="Search linen work by contract, client, venue, setup, or napkin type..."
        />
      </div>
    </Layout>
  );
}
