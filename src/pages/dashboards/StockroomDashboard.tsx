import { useEffect, useState } from 'react';
import { Box, Calendar, ClipboardCheck, Package } from 'lucide-react';
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
  equipmentChecklist?: Array<{
    item: string;
    quantity: number;
    category?: string;
    status?: string;
  }>;
  sectionConfirmations?: {
    stockroom?: {
      confirmed?: boolean;
    };
  };
}

const STOCKROOM_PRE_SIGNATURE_STATUSES = [
  'draft',
  'pending_client_signature',
  'submitted',
  'accounting_review',
] as const;

const isStockroomDraftWorkflowStatus = (status: string) =>
  STOCKROOM_PRE_SIGNATURE_STATUSES.includes(status as (typeof STOCKROOM_PRE_SIGNATURE_STATUSES)[number]);

const isStockroomConfirmed = (contract: Contract) => Boolean(contract.sectionConfirmations?.stockroom?.confirmed);

const getEquipmentItemCount = (contract: Contract) => contract.equipmentChecklist?.length || 0;

const getEquipmentUnitCount = (contract: Contract) => (
  contract.equipmentChecklist || []
).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

const getPreparedEquipmentCount = (contract: Contract) => (
  contract.equipmentChecklist || []
).filter((item) => item.status === 'prepared').length;

const areAllEquipmentPrepared = (contract: Contract) => {
  const equipmentItems = contract.equipmentChecklist || [];
  return equipmentItems.length > 0 && equipmentItems.every((item) => item.status === 'prepared');
};

const getStockroomStatusMeta = (contract: Contract) => {
  const equipmentItemCount = getEquipmentItemCount(contract);
  const preparedCount = getPreparedEquipmentCount(contract);

  if (isStockroomDraftWorkflowStatus(contract.status)) {
    if (!equipmentItemCount) {
      return {
        label: 'Needs items',
        className: 'bg-sky-100 text-sky-800 border-sky-200',
      };
    }

    if (!isStockroomConfirmed(contract)) {
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

  if (!equipmentItemCount) {
    return {
      label: 'Not required',
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }

  if (areAllEquipmentPrepared(contract)) {
    return {
      label: 'Prepared',
      className: 'bg-green-100 text-green-800 border-green-200',
    };
  }

  if (preparedCount > 0) {
    return {
      label: 'In progress',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    };
  }

  return {
    label: 'Pending prep',
    className: 'bg-amber-100 text-amber-900 border-amber-200',
  };
};

const getNextStepMeta = (contract: Contract) => {
  const equipmentItemCount = getEquipmentItemCount(contract);
  const preparedCount = getPreparedEquipmentCount(contract);

  if (isStockroomDraftWorkflowStatus(contract.status)) {
    if (!equipmentItemCount) {
      return {
        title: 'Add stockroom equipment',
        note: 'Review the draft inventory tab and list the tables, chairs, utensils, and other equipment needed for this contract.',
        className: 'text-sky-800',
      };
    }

    if (!isStockroomConfirmed(contract)) {
      return {
        title: 'Confirm stockroom inventory',
        note: 'Review the draft equipment list and confirm the stockroom section so sales can continue the contract flow.',
        className: 'text-amber-900',
      };
    }

    return {
      title: 'Ready for sales handoff',
      note: 'The stockroom draft validation is already complete. Sales can continue once the other required sections are ready.',
      className: 'text-green-800',
    };
  }

  if (areAllEquipmentPrepared(contract)) {
    return {
      title: 'Prepared for event',
      note: 'All listed stockroom equipment is marked ready for the event schedule.',
      className: 'text-green-800',
    };
  }

  if (preparedCount > 0) {
    return {
      title: 'Finish remaining preparation',
      note: 'Some stockroom equipment is already prepared. Complete the rest in the inventory tab before the event date.',
      className: 'text-blue-800',
    };
  }

  return {
    title: 'Prepare stockroom equipment',
    note: 'Open the inventory tab and update the stockroom items once tables, chairs, utensils, and other equipment are ready.',
    className: 'text-amber-900',
  };
};

const toRow = (contract: Contract): WorklistRow => {
  const timing = getTimingMeta(contract.eventDate, { pastLabel: 'Past event' });
  const stockroomStatus = getStockroomStatusMeta(contract);
  const nextStep = getNextStepMeta(contract);
  const equipmentItemCount = getEquipmentItemCount(contract);
  const equipmentUnitCount = getEquipmentUnitCount(contract);
  const preparedCount = getPreparedEquipmentCount(contract);
  const needsAction = isStockroomDraftWorkflowStatus(contract.status)
    ? !equipmentItemCount || !isStockroomConfirmed(contract)
    : equipmentItemCount > 0 && !areAllEquipmentPrepared(contract);

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
      `${equipmentItemCount} equipment item(s) | ${equipmentUnitCount} total unit(s)`,
      isStockroomDraftWorkflowStatus(contract.status)
        ? `Draft status: ${formatLabel(contract.status)}`
        : `${preparedCount} of ${equipmentItemCount} item(s) prepared`,
    ],
    statusLabel: stockroomStatus.label,
    statusClassName: stockroomStatus.className,
    extraBadges: [
      {
        label: formatLabel(contract.status),
        className: isStockroomDraftWorkflowStatus(contract.status)
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-slate-200 bg-slate-50 text-slate-700',
      },
      ...(isStockroomDraftWorkflowStatus(contract.status)
        ? [{
            label: isStockroomConfirmed(contract) ? 'Stockroom confirmed' : 'Stockroom confirmation needed',
            className: isStockroomConfirmed(contract)
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-amber-200 bg-amber-50 text-amber-900',
          }]
        : []),
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
      label: isStockroomDraftWorkflowStatus(contract.status) ? 'Update Draft' : 'View Contract',
      href: isStockroomDraftWorkflowStatus(contract.status)
        ? `/contracts/edit/${contract._id}`
        : `/contracts/${contract._id}`,
      variant: 'default',
    },
    rowClassName: needsAction ? 'bg-amber-50/20' : undefined,
    searchText: [
      contract.venue?.name || '',
      ...(contract.equipmentChecklist || []).map((item) => `${item.item} ${item.category || ''}`),
    ].join(' '),
  };
};

export default function StockroomDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const contractsData = await api.getContracts();
      setContracts(contractsData as Contract[]);
    } catch (error) {
      toast.error('Failed to load stockroom data');
    } finally {
      setIsLoading(false);
    }
  };

  const draftContracts = contracts.filter((contract) => isStockroomDraftWorkflowStatus(contract.status));
  const draftContractsNeedingValidation = draftContracts.filter((contract) => (
    !getEquipmentItemCount(contract) || !isStockroomConfirmed(contract)
  ));
  const validatedDraftContracts = draftContracts.filter((contract) => (
    getEquipmentItemCount(contract) > 0 && isStockroomConfirmed(contract)
  ));
  const approvedContracts = contracts.filter((contract) => (
    contract.status === 'approved' && getEquipmentItemCount(contract) > 0
  ));
  const thisWeekContracts = approvedContracts.filter((contract) => {
    const daysUntil = getDaysUntilDate(contract.eventDate);
    return daysUntil >= 0 && daysUntil <= 7;
  });
  const pendingPreparationContracts = approvedContracts.filter((contract) => !areAllEquipmentPrepared(contract));
  const totalEquipmentUnits = approvedContracts.reduce((sum, contract) => sum + getEquipmentUnitCount(contract), 0);

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
          <h1 className="text-3xl font-bold tracking-tight">Stockroom Dashboard</h1>
          <p className="text-muted-foreground">
            Validate draft equipment needs, then track stockroom preparation across approved events.
          </p>
        </div>

        <DepartmentWorklist
          summaryCards={[
            {
              title: 'Draft Reviews',
              value: draftContracts.length,
              note: 'Draft contracts currently in the stockroom workflow',
              icon: ClipboardCheck,
            },
            {
              title: 'Needs Validation',
              value: draftContractsNeedingValidation.length,
              note: 'Drafts still waiting on equipment listing or stockroom confirmation',
              icon: Box,
            },
            {
              title: 'This Week',
              value: thisWeekContracts.length,
              note: 'Approved events with stockroom work in the next seven days',
              icon: Calendar,
            },
            {
              title: 'Equipment Units',
              value: totalEquipmentUnits,
              note: 'Current total stockroom unit demand across approved contracts',
              icon: Package,
            },
          ]}
          tabs={[
            {
              value: 'drafts',
              label: `Draft Contracts (${draftContractsNeedingValidation.length})`,
              emptyTitle: 'No draft contracts need stockroom review',
              emptyMessage: 'Draft contracts waiting on equipment setup or stockroom confirmation will appear here.',
              rows: draftContractsNeedingValidation.map(toRow),
            },
            {
              value: 'validated',
              label: `Validated Drafts (${validatedDraftContracts.length})`,
              emptyTitle: 'No validated stockroom drafts yet',
              emptyMessage: 'Draft contracts with completed stockroom validation will appear here.',
              rows: validatedDraftContracts.map(toRow),
            },
            {
              value: 'week',
              label: `This Week (${thisWeekContracts.length})`,
              emptyTitle: 'No stockroom work scheduled this week',
              emptyMessage: 'Approved events with stockroom requirements in the next seven days will appear here.',
              rows: thisWeekContracts.map(toRow),
            },
            {
              value: 'pending',
              label: `Pending Prep (${pendingPreparationContracts.length})`,
              emptyTitle: 'All listed stockroom equipment is already prepared',
              emptyMessage: 'Approved contracts still waiting on stockroom preparation will appear here.',
              rows: pendingPreparationContracts.map(toRow),
            },
          ]}
          defaultTab="drafts"
          searchPlaceholder="Search stockroom work by contract, client, venue, or equipment item..."
        />
      </div>
    </Layout>
  );
}
