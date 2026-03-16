import { useEffect, useState } from 'react';
import { Calendar, Palette, Package, Users } from 'lucide-react';
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
  clientType: string;
  venue: { name: string; address: string };
  status: string;
  preferredColor: string;
  backdropRequirements: string;
  tableSetup: string;
  creativeAssets?: Array<{
    item: string;
    quantity: number;
    assignedTo?: string;
    status?: string;
  }>;
  setupPerson?: string;
}

const getCreativeStatusMeta = (contract: Contract) => {
  if (!contract.setupPerson) {
    return {
      label: 'Needs lead',
      className: 'bg-amber-100 text-amber-900 border-amber-200',
    };
  }

  if (!(contract.creativeAssets?.length)) {
    return {
      label: 'Needs assets',
      className: 'bg-sky-100 text-sky-800 border-sky-200',
    };
  }

  return {
    label: 'Planned',
    className: 'bg-green-100 text-green-800 border-green-200',
  };
};

const getNextStepMeta = (contract: Contract) => {
  if (!contract.setupPerson) {
    return {
      title: 'Assign creative lead',
      note: 'Set the setup owner first so creative planning has a clear point person.',
      className: 'text-amber-900',
    };
  }

  if (!(contract.creativeAssets?.length)) {
    return {
      title: 'Review required creative assets',
      note: 'Open the inventory tab and confirm the backdrop, table decor, and other setup items.',
      className: 'text-sky-800',
    };
  }

  return {
    title: 'Track setup readiness',
    note: 'Creative assets are already listed. Use the contract inventory section to update their readiness.',
    className: 'text-green-800',
  };
};

const toRow = (contract: Contract): WorklistRow => {
  const timing = getTimingMeta(contract.eventDate, { pastLabel: 'Past event' });
  const creativeStatus = getCreativeStatusMeta(contract);
  const nextStep = getNextStepMeta(contract);
  const needsPlanning = !contract.setupPerson || !(contract.creativeAssets?.length);

  return {
    id: contract._id,
    eventDate: contract.eventDate,
    createdAt: contract.createdAt,
    timingLabel: timing.label,
    timingClassName: timing.className,
    title: contract.contractNumber,
    subtitle: contract.clientName,
    details: [
      `${contract.venue?.name || 'No venue saved'} | ${formatLabel(contract.clientType)}`,
      `Color: ${contract.preferredColor || 'Not set'} | Setup: ${contract.tableSetup || 'Not set'}`,
      `Backdrop: ${contract.backdropRequirements || 'Not specified'}`,
    ],
    statusLabel: creativeStatus.label,
    statusClassName: creativeStatus.className,
    extraBadges: [
      {
        label: `${contract.creativeAssets?.length || 0} asset item(s)`,
        className: 'border-slate-200 bg-slate-50 text-slate-700',
      },
      ...(contract.setupPerson ? [{
        label: `Lead: ${contract.setupPerson}`,
        className: 'border-green-200 bg-green-50 text-green-800',
      }] : []),
    ],
    nextStepTitle: nextStep.title,
    nextStepNote: nextStep.note,
    nextStepClassName: nextStep.className,
    primaryAction: {
      label: 'Open Inventory',
      href: `/contracts/${contract._id}?tab=inventory`,
      variant: 'outline',
    },
    secondaryAction: {
      label: 'Open Preferences',
      href: `/contracts/${contract._id}?tab=preferences`,
      variant: 'default',
    },
    rowClassName: needsPlanning ? 'bg-amber-50/20' : undefined,
    searchText: `${contract.clientType} ${contract.preferredColor} ${contract.tableSetup} ${contract.backdropRequirements}`,
  };
};

export default function CreativeDashboard() {
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
  const needsPlanningContracts = approvedContracts.filter((contract) => !contract.setupPerson || !(contract.creativeAssets?.length));
  const plannedContracts = approvedContracts.filter((contract) => contract.setupPerson && (contract.creativeAssets?.length || 0) > 0);

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
          <h1 className="text-3xl font-bold tracking-tight">Creative Dashboard</h1>
          <p className="text-muted-foreground">
            Track setup direction, aesthetic planning, and creative asset readiness per event.
          </p>
        </div>

        <DepartmentWorklist
          summaryCards={[
            {
              title: 'Approved Events',
              value: approvedContracts.length,
              note: 'Contracts currently open to creative planning',
              icon: Palette,
            },
            {
              title: 'This Week',
              value: thisWeekContracts.length,
              note: 'Events happening in the next seven days',
              icon: Calendar,
            },
            {
              title: 'Needs Planning',
              value: needsPlanningContracts.length,
              note: 'Contracts still missing a lead or saved creative asset list',
              icon: Package,
            },
            {
              title: 'Wedding Events',
              value: approvedContracts.filter((contract) => contract.clientType === 'wedding').length,
              note: 'Approved wedding setups currently on the board',
              icon: Users,
            },
          ]}
          tabs={[
            {
              value: 'week',
              label: `This Week (${thisWeekContracts.length})`,
              emptyTitle: 'No creative events this week',
              emptyMessage: 'Upcoming approved events will appear here as they enter the creative work window.',
              rows: thisWeekContracts.map(toRow),
            },
            {
              value: 'planning',
              label: `Needs Planning (${needsPlanningContracts.length})`,
              emptyTitle: 'All creative events already have a lead and asset list',
              emptyMessage: 'Any approved event missing planning details will show up here.',
              rows: needsPlanningContracts.map(toRow),
            },
            {
              value: 'planned',
              label: `Planned (${plannedContracts.length})`,
              emptyTitle: 'No fully planned creative events yet',
              emptyMessage: 'Once both a lead and creative assets are saved, the event will appear here.',
              rows: plannedContracts.map(toRow),
            },
          ]}
          defaultTab="week"
          searchPlaceholder="Search creative events by contract, client, theme, or setup notes..."
        />
      </div>
    </Layout>
  );
}
