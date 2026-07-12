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
}

export interface ContractStage {
  key: string;
  label: string;
  badgeClass?: string;
}

// While a contract is still a draft it moves through two working stages before
// it can be sent for signature: the inventory departments validating their
// sections, then sales confirming the payment term. Surfacing them as display
// statuses keeps the pipeline visible without changing the persisted status
// enum, so existing contracts, filters, and reports are unaffected.
export const getContractStage = (contract: ContractStageSource): ContractStage => {
  if (contract.status !== 'draft') {
    return { key: contract.status, label: contract.status.replace(/_/g, ' ') };
  }

  const confirmations = contract.sectionConfirmations || {};
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
