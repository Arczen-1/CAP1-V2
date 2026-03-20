import { useEffect, useState } from 'react';
import { Calendar, ClipboardCheck, Palette, Package } from 'lucide-react';
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
  sectionConfirmations?: {
    creative?: {
      confirmed?: boolean;
    };
  };
  creativeAssets?: Array<{
    item: string;
    quantity: number;
    assignedTo?: string;
    status?: string;
  }>;
  setupPerson?: string;
}

const CREATIVE_PRE_SIGNATURE_STATUSES = [
  'draft',
  'pending_client_signature',
  'submitted',
  'accounting_review',
] as const;

const isCreativeDraftWorkflowStatus = (status: string) =>
  CREATIVE_PRE_SIGNATURE_STATUSES.includes(status as (typeof CREATIVE_PRE_SIGNATURE_STATUSES)[number]);

const isCreativeConfirmed = (contract: Contract) => Boolean(contract.sectionConfirmations?.creative?.confirmed);

const getCreativeStatusMeta = (contract: Contract) => {
  if (isCreativeDraftWorkflowStatus(contract.status)) {
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

    if (!isCreativeConfirmed(contract)) {
      return {
        label: 'Needs confirmation',
        className: 'bg-amber-100 text-amber-900 border-amber-200',
      };
    }

    return {
      label: 'Validated',
      className: 'bg-green-100 text-green-800 border-green-200',
    };
  }

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
  if (isCreativeDraftWorkflowStatus(contract.status)) {
    if (!contract.setupPerson) {
      return {
        title: 'Assign creative lead',
        note: 'Set the setup owner first so the draft can move into creative validation.',
        className: 'text-amber-900',
      };
    }

    if (!(contract.creativeAssets?.length)) {
      return {
        title: 'Add creative inventory items',
        note: 'Open the draft and list the backdrop, table decor, lighting, and other setup items first.',
        className: 'text-sky-800',
      };
    }

    if (!isCreativeConfirmed(contract)) {
      return {
        title: 'Confirm creative inventory',
        note: 'Review the draft inventory tab and confirm the creative section so sales can continue to signature.',
        className: 'text-amber-900',
      };
    }

    return {
      title: 'Ready for signature handoff',
      note: 'Creative already confirmed the draft. Sales can continue the signature flow once the other sections are ready.',
      className: 'text-green-800',
    };
  }

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
  const needsPlanning = !contract.setupPerson || !(contract.creativeAssets?.length) || (
    isCreativeDraftWorkflowStatus(contract.status) && !isCreativeConfirmed(contract)
  );

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
        label: formatLabel(contract.status),
        className: isCreativeDraftWorkflowStatus(contract.status)
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-slate-200 bg-slate-50 text-slate-700',
      },
      {
        label: `${contract.creativeAssets?.length || 0} asset item(s)`,
        className: 'border-slate-200 bg-slate-50 text-slate-700',
      },
      ...(isCreativeDraftWorkflowStatus(contract.status) ? [{
        label: isCreativeConfirmed(contract) ? 'Creative confirmed' : 'Creative confirmation needed',
        className: isCreativeConfirmed(contract)
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-amber-200 bg-amber-50 text-amber-900',
      }] : []),
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
      label: isCreativeDraftWorkflowStatus(contract.status) ? 'Update Draft' : 'Open Preferences',
      href: isCreativeDraftWorkflowStatus(contract.status)
        ? `/contracts/edit/${contract._id}`
        : `/contracts/${contract._id}?tab=preferences`,
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

  const draftContracts = contracts.filter((contract) => isCreativeDraftWorkflowStatus(contract.status));
  const draftContractsNeedingValidation = draftContracts.filter((contract) => !isCreativeConfirmed(contract));
  const validatedDraftContracts = draftContracts.filter((contract) => isCreativeConfirmed(contract));
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
            Validate draft creative inventory before signature, then track setup direction and event readiness.
          </p>
        </div>

        <DepartmentWorklist
          summaryCards={[
            {
              title: 'Draft Reviews',
              value: draftContracts.length,
              note: 'Draft contracts currently waiting in the creative workflow',
              icon: ClipboardCheck,
            },
            {
              title: 'Needs Validation',
              value: draftContractsNeedingValidation.length,
              note: 'Drafts that still need creative confirmation before signature',
              icon: Package,
            },
            {
              title: 'Approved Events',
              value: approvedContracts.length,
              note: 'Contracts currently open to creative production and setup',
              icon: Palette,
            },
            {
              title: 'This Week',
              value: thisWeekContracts.length,
              note: 'Approved events happening in the next seven days',
              icon: Calendar,
            },
          ]}
          tabs={[
            {
              value: 'drafts',
              label: `Draft Validation (${draftContractsNeedingValidation.length})`,
              emptyTitle: 'No draft contracts need creative validation',
              emptyMessage: 'Draft contracts waiting on creative review will appear here before they move to signature.',
              rows: draftContractsNeedingValidation.map(toRow),
            },
            {
              value: 'validated',
              label: `Validated Drafts (${validatedDraftContracts.length})`,
              emptyTitle: 'No draft contracts are fully confirmed yet',
              emptyMessage: 'Once creative confirms a draft contract, it will stay visible here until the contract moves forward.',
              rows: validatedDraftContracts.map(toRow),
            },
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
          defaultTab={draftContracts.length > 0 ? 'drafts' : 'week'}
          searchPlaceholder="Search creative events by contract, client, theme, or setup notes..."
        />
      </div>
    </Layout>
  );
}
