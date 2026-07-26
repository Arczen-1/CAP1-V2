interface SectionConfirmation {
  confirmed?: boolean;
}

interface PostEventItem {
  postEventStatus?: string;
  status?: string;
}

export interface ContractStageSource {
  status: string;
  creativeAssets?: PostEventItem[];
  linenRequirements?: PostEventItem[];
  equipmentChecklist?: PostEventItem[];
  logisticsAssignment?: {
    truck?: unknown;
    driver?: unknown;
    assignmentStatus?: string;
  };
  sectionConfirmations?: {
    payments?: SectionConfirmation;
    creative?: SectionConfirmation;
    linen?: SectionConfirmation;
    stockroom?: SectionConfirmation;
  };
  paymentHold?: {
    active?: boolean;
    reason?: string;
    managementOverride?: boolean;
  };
  eventDate?: string | Date;
  paymentStatus?: string;
  payments?: Array<{ amount: number; status?: string }>;
  totalContractValue?: number;
  downPaymentPercent?: number;
  finalPaymentPercent?: number;
}

export interface ContractStage {
  key: string;
  label: string;
  badgeClass?: string;
  // Which side of the workflow currently holds the ball for this contract.
  owner?: string;
}

const INVENTORY_ROLE_SECTIONS: Record<string, {
  confirmationKey: 'creative' | 'linen' | 'stockroom';
  itemsKey: 'creativeAssets' | 'linenRequirements' | 'equipmentChecklist';
}> = {
  creative: { confirmationKey: 'creative', itemsKey: 'creativeAssets' },
  linen: { confirmationKey: 'linen', itemsKey: 'linenRequirements' },
  stockroom: { confirmationKey: 'stockroom', itemsKey: 'equipmentChecklist' },
};

// While a contract is still a draft it moves through two working stages before
// it can be sent for signature: the inventory departments validating their
// sections, then sales confirming the payment term. Surfacing them as display
// statuses keeps the pipeline visible without changing the persisted status
// enum, so existing contracts, filters, and reports are unaffected.
// When a viewer role is provided and that department already confirmed its own
// section, the draft shows as "Validated" for them — their part is done even
// while other departments are still working.
export const getContractStage = (contract: ContractStageSource, viewerRole?: string | null): ContractStage => {
  // An overdue final balance overrides every other stage until it is settled
  // or management releases the hold.
  if (contract.paymentHold?.active && !['completed', 'cancelled'].includes(contract.status)) {
    return {
      key: 'final_balance_hold',
      label: 'Final Balance Overdue / On Hold',
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
      owner: 'Accounting',
    };
  }

  if (contract.status !== 'draft') {
    return getPostDraftStage(contract, viewerRole);
  }

  const confirmations = contract.sectionConfirmations || {};

  const viewerSection = viewerRole ? INVENTORY_ROLE_SECTIONS[viewerRole] : undefined;
  if (viewerSection) {
    const viewerItems = contract[viewerSection.itemsKey] || [];
    if (viewerItems.length > 0 && confirmations[viewerSection.confirmationKey]?.confirmed) {
      return {
        key: 'validated',
        label: 'Validated',
        badgeClass: 'bg-green-100 text-green-800 border-green-200',
      };
    }
  }

  const inventorySections: Array<[SectionConfirmation | undefined, unknown[] | undefined]> = [
    [confirmations.creative, contract.creativeAssets],
    [confirmations.linen, contract.linenRequirements],
    [confirmations.stockroom, contract.equipmentChecklist],
  ];
  const awaitingDepartments = inventorySections.some(([confirmation, items]) => (
    (items || []).length > 0 && !confirmation?.confirmed
  ));

  if (awaitingDepartments) {
    return {
      key: 'awaiting_department_validation',
      label: 'Awaiting Department Validation',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
    };
  }

  if (!confirmations.payments?.confirmed) {
    return {
      key: 'confirm_payment_term',
      label: 'Confirm Payment Term',
      badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
    };
  }

  return {
    key: 'ready_for_signature',
    label: 'Ready For Signature',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
    owner: 'Sales',
  };
};

// Post-draft statuses previously surfaced only the raw enum value, which made
// it hard to tell which team owns the contract or what phase the event is in.
// Every stage now carries an owner and a distinct color.
const getPostDraftStage = (contract: ContractStageSource, viewerRole?: string | null): ContractStage => {
  switch (contract.status) {
    case 'pending_client_signature':
      return {
        key: 'pending_client_signature',
        label: 'Awaiting Client Signature',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
        owner: 'Sales',
      };
    case 'submitted':
    case 'accounting_review': {
      return isDownPaymentMilestoneMet(contract)
        ? {
          key: 'ready_for_preparation_approval',
          label: 'Ready For Preparation Approval',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          owner: 'Accounting',
        }
        : {
          key: 'collecting_down_payment',
          label: 'Collecting Down Payment',
          badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
          owner: 'Accounting',
        };
    }
    case 'approved': {
      const eventDate = contract.eventDate ? new Date(contract.eventDate) : null;
      if (eventDate) {
        const endOfEventDay = new Date(eventDate);
        endOfEventDay.setHours(23, 59, 59, 999);
        const daysUntilEvent = Math.ceil((eventDate.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);

        if (new Date() > endOfEventDay) {
          // Once every department has completed its post-event checks (and the
          // logistics booking is closed out), the contract is only waiting on
          // Accounting to formally close it.
          if (arePostEventChecksComplete(contract)) {
            return {
              key: 'awaiting_contract_close',
              label: 'Awaiting Contract Close',
              badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              owner: 'Accounting',
            };
          }

          return {
            key: 'post_event_checks',
            label: 'Post-Event Checks',
            badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
            owner: 'Departments & Accounting',
          };
        }

        if (daysUntilEvent >= 0 && daysUntilEvent <= 7) {
          return {
            key: 'event_week_freeze',
            // The material freeze is not relevant to Kitchen, so they just see "Event Week".
            label: viewerRole === 'kitchen' ? 'Event Week' : 'Event Week - Materials Frozen',
            badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            owner: 'Departments',
          };
        }
      }

      return {
        key: 'in_preparation',
        label: 'In Preparation',
        badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
        owner: 'Departments',
      };
    }
    case 'completed':
      return {
        key: 'completed',
        label: 'Closed',
        badgeClass: 'bg-green-100 text-green-800 border-green-200',
      };
    case 'cancelled':
      return {
        key: 'cancelled',
        label: 'Cancelled',
        badgeClass: 'bg-gray-200 text-gray-700 border-gray-300',
      };
    case 'rejected':
      return {
        key: 'rejected',
        label: 'Rejected',
        badgeClass: 'bg-red-100 text-red-800 border-red-200',
        owner: 'Sales',
      };
    default:
      return { key: contract.status, label: contract.status.replace(/_/g, ' ') };
  }
};

// Mirrors ContractDetail's isPostEventClosed: an item's post-event check is done
// when it is checked_ok / incident_reported (or the legacy "returned" status).
const isItemPostEventClosed = (item: PostEventItem): boolean => {
  const value = item?.postEventStatus;
  if (value === 'checked_ok' || value === 'incident_reported') {
    return true;
  }
  if (value === 'pending_check') {
    return false;
  }
  return item?.status === 'returned';
};

// True when every department's post-event checks are complete and the logistics
// booking (if any) is closed out — i.e. the contract is ready for Accounting to
// close. Payment settlement is handled separately by the closure action.
const arePostEventChecksComplete = (contract: ContractStageSource): boolean => {
  const sections = [
    contract.creativeAssets || [],
    contract.linenRequirements || [],
    contract.equipmentChecklist || [],
  ];
  const allItemsChecked = sections.every((items) => items.every(isItemPostEventClosed));

  const logistics = contract.logisticsAssignment;
  const hasLogisticsBooking = Boolean(
    logistics?.truck
    || logistics?.driver
    || (logistics?.assignmentStatus && logistics.assignmentStatus !== 'pending')
  );
  const logisticsClosedOut = !hasLogisticsBooking || logistics?.assignmentStatus === 'completed';

  return allItemsChecked && logisticsClosedOut;
};

// Mirrors the backend milestone rule: the down payment (40% by default, full
// payment on 100/0 corporate terms) is met when completed payments cover it,
// with a half-centavo tolerance for floating-point drift.
const isDownPaymentMilestoneMet = (contract: ContractStageSource): boolean => {
  const total = Number(contract.totalContractValue) || 0;
  if (!total || !Array.isArray(contract.payments)) {
    return contract.paymentStatus === 'paid';
  }

  const paid = Math.round(contract.payments
    .filter((payment) => (payment.status || 'completed') === 'completed')
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) * 100) / 100;

  const rawDown = Number(contract.downPaymentPercent);
  const rawFinal = Number(contract.finalPaymentPercent);
  const fullPaymentPlan = rawDown >= 100 || rawFinal <= 0;
  const downPercent = fullPaymentPlan
    ? 100
    : (Number.isFinite(rawDown) && rawDown > 0 && rawDown < 100 ? rawDown : 40);
  const required = Math.round(total * downPercent) / 100;

  return paid + 0.005 >= required;
};
