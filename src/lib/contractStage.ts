interface SectionConfirmation {
  confirmed?: boolean;
}

export interface ContractStageSource {
  status: string;
  creativeAssets?: unknown[];
  linenRequirements?: unknown[];
  equipmentChecklist?: unknown[];
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
}

export interface ContractStage {
  key: string;
  label: string;
  badgeClass?: string;
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
    };
  }

  if (contract.status !== 'draft') {
    return { key: contract.status, label: contract.status.replace(/_/g, ' ') };
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
  };
};
