const COMPANY_NAME = 'Juan Carlos Catering Services';
const COMPANY_TAGLINE = 'Event Catering And Hospitality Services';
const REQUIRED_DOWN_PAYMENT_RATE = 0.6;

export interface SignedContractDocumentParty {
  signedName?: string;
  title?: string;
  imageUrl?: string;
}

export interface SignedContractDocumentData {
  contractNumber: string;
  status?: string;
  clientName: string;
  clientContact?: string;
  clientEmail?: string;
  clientType?: string;
  clientSignedAt?: string;
  eventDate: string;
  venue?: { name?: string; address?: string; capacity?: number };
  packageSelected?: string;
  totalPacks?: number;
  menuDetails?: Array<{ category?: string; item?: string; quantity?: number }>;
  preferredColor?: string;
  napkinType?: string;
  tableSetup?: string;
  backdropRequirements?: string;
  specialRequests?: string;
  totalContractValue?: number;
  downPaymentPercent?: number;
  finalPaymentPercent?: number;
  signatureAssets?: {
    client?: SignedContractDocumentParty;
    staff?: SignedContractDocumentParty;
  };
}

const escapeHtml = (value?: string | number) => String(value ?? '-')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatCurrency = (value?: number) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(value || 0);

const resolveDownPaymentPercent = (value?: number) => (
  Math.max(REQUIRED_DOWN_PAYMENT_RATE * 100, Number(value) || REQUIRED_DOWN_PAYMENT_RATE * 100)
);

const resolveFinalPaymentPercent = (downPaymentValue?: number, finalPaymentValue?: number) => {
  const downPaymentPercent = resolveDownPaymentPercent(downPaymentValue);
  const parsedFinalPaymentPercent = Number(finalPaymentValue);
  return Number.isFinite(parsedFinalPaymentPercent)
    ? Math.max(0, parsedFinalPaymentPercent)
    : Math.max(0, 100 - downPaymentPercent);
};

const getFinalPaymentDueDate = (eventDate: string) => {
  const dueDate = new Date(eventDate);
  dueDate.setMonth(dueDate.getMonth() - 1);
  return dueDate;
};

const documentStyles = `
  body{margin:0;padding:24px;background:#fff;color:#1f2937;font-family:"Times New Roman",Georgia,serif}
  .doc{max-width:960px;margin:0 auto;border-top:6px solid #491321;padding:18px 18px 28px}
  .head{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #491321;padding-bottom:18px}
  .brand{display:flex;gap:14px;align-items:center}.brand img{width:56px;height:56px;object-fit:contain}
  .brand h1{margin:0;color:#491321;font-size:28px}.brand p{margin:6px 0 0;color:#6b7280;font:11px Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase}
  .title{margin:18px 0 6px;font:700 20px Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase}.subtitle{margin:0;max-width:540px;color:#4b5563;font-size:13px;line-height:1.6}
  .meta{min-width:250px}.meta-row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid #e5e7eb}.meta-label{font:700 10px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6b7280}.meta-value{font-size:13px;font-weight:600;text-align:right}
  .summary,.grid{display:grid;gap:10px 28px}.summary{grid-template-columns:repeat(2,minmax(0,1fr));margin:18px 0;padding-bottom:10px;border-bottom:1px solid #d1d5db}.summary div{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px dotted #d1d5db}.summary label{font:10px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#6b7280}.summary strong{color:#491321}
  .section{margin-top:20px;padding-top:14px;border-top:1px solid #d1d5db}.section h3{margin:0 0 12px;color:#491321;font:700 12px Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase}
  .grid{grid-template-columns:repeat(2,minmax(0,1fr))}.details div{display:grid;grid-template-columns:160px 1fr;gap:14px;padding:6px 0;border-bottom:1px dotted #e5e7eb}.details label{font:10px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#6b7280}
  table{width:100%;border-collapse:collapse}th,td{padding:9px 6px;text-align:left;border-bottom:1px solid #d1d5db;font-size:13px}th{color:#491321;font:700 10px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase}
  .signatures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin-top:28px}.sig{min-height:140px;display:flex;flex-direction:column;justify-content:flex-end}.sig-img{min-height:76px;display:flex;align-items:flex-end;margin-bottom:10px}.sig-img img{max-width:220px;max-height:72px;object-fit:contain}.sig-placeholder{color:#9ca3af;font-size:11px;font-style:italic}.sig-line{border-top:1px solid #111827;padding-top:10px}.sig-line label{display:block;font:10px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#6b7280}.sig-line strong{display:block;margin-top:4px;font-size:14px}.sig-line span{display:block;margin-top:3px;color:#6b7280;font-size:11px}
  .note{margin-top:20px;color:#6b7280;font-size:11px;font-style:italic}
  @media (max-width:900px){.head,.summary,.grid,.signatures{grid-template-columns:1fr;display:grid}.details div{grid-template-columns:1fr;gap:4px}.meta{min-width:0}}
`;

const detailRowsHtml = (items: Array<{ label: string; value: string }>) => items.map((item) => `
  <div><label>${escapeHtml(item.label)}</label><span>${escapeHtml(item.value)}</span></div>
`).join('');

const signatureBoxHtml = (label: string, name: string, title: string, imageUrl?: string, placeholder?: string) => `
  <div class="sig">
    <div class="sig-img">
      ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(label)}" />` : `<div class="sig-placeholder">${escapeHtml(placeholder || `${label} not attached`)}</div>`}
    </div>
    <div class="sig-line">
      <label>${escapeHtml(label)}</label>
      <strong>${escapeHtml(name)}</strong>
      <span>${escapeHtml(title)}</span>
    </div>
  </div>
`;

export const buildSignedContractDocumentHtml = (
  contract: SignedContractDocumentData,
  options?: { documentTitle?: string; documentSubtitle?: string; signatureStatus?: string }
) => {
  const downPaymentPercent = resolveDownPaymentPercent(contract.downPaymentPercent);
  const finalPaymentPercent = resolveFinalPaymentPercent(contract.downPaymentPercent, contract.finalPaymentPercent);
  const fullPaymentPlan = downPaymentPercent >= 100 || finalPaymentPercent <= 0;
  const requiredDownPayment = Math.round((contract.totalContractValue || 0) * (downPaymentPercent / 100) * 100) / 100;
  const remainingBalance = Math.max(0, (contract.totalContractValue || 0) - requiredDownPayment);
  const finalBalanceDueDate = getFinalPaymentDueDate(contract.eventDate);
  const menuRows = contract.menuDetails?.length
    ? contract.menuDetails.map((item) => `<tr><td>${escapeHtml(item.category || '-')}</td><td>${escapeHtml(item.item || '-')}</td><td>${escapeHtml(item.quantity || 0)}</td></tr>`).join('')
    : '<tr><td colspan="3">Menu details will be finalized on the signed contract copy.</td></tr>';
  const logoUrl = `${window.location.origin}/logo.png`;

  return `<!DOCTYPE html><html><head><title>${escapeHtml(contract.contractNumber)} - Signed Contract Copy</title><style>${documentStyles}</style></head><body>
    <div class="doc">
      <div class="head">
        <div>
          <div class="brand">
            <img src="${logoUrl}" alt="${COMPANY_NAME}" />
            <div><h1>${COMPANY_NAME}</h1><p>${COMPANY_TAGLINE}</p></div>
          </div>
          <div class="title">${escapeHtml(options?.documentTitle || 'Signed Contract Copy')}</div>
          <p class="subtitle">${escapeHtml(options?.documentSubtitle || 'Archived contract view with the recorded signatures.')}</p>
        </div>
        <div class="meta">
          <div class="meta-row"><span class="meta-label">Contract Number</span><span class="meta-value">${escapeHtml(contract.contractNumber)}</span></div>
          <div class="meta-row"><span class="meta-label">Signature Status</span><span class="meta-value">${escapeHtml(options?.signatureStatus || 'Signed Contract')}</span></div>
          <div class="meta-row"><span class="meta-label">Signed On</span><span class="meta-value">${escapeHtml(contract.clientSignedAt ? new Date(contract.clientSignedAt).toLocaleString() : new Date().toLocaleString())}</span></div>
        </div>
      </div>

      <div class="summary">
        <div><label>Client</label><strong>${escapeHtml(contract.clientName)}</strong></div>
        <div><label>Event Date</label><strong>${escapeHtml(new Date(contract.eventDate).toLocaleDateString())}</strong></div>
        <div><label>Contract Value</label><strong>${escapeHtml(formatCurrency(contract.totalContractValue))}</strong></div>
        <div><label>${escapeHtml(fullPaymentPlan ? 'Payment Required' : 'Required Deposit')}</label><strong>${escapeHtml(formatCurrency(requiredDownPayment))}</strong></div>
      </div>

      <section class="section"><h3>Client And Event</h3><div class="grid">
        <div class="details">${detailRowsHtml([
          { label: 'Client Name', value: contract.clientName },
          { label: 'Contact', value: contract.clientContact || '-' },
          { label: 'Email', value: contract.clientEmail || '-' },
          { label: 'Client Type', value: contract.clientType || '-' },
        ])}</div>
        <div class="details">${detailRowsHtml([
          { label: 'Venue', value: contract.venue?.name || '-' },
          { label: 'Venue Address', value: contract.venue?.address || '-' },
          { label: 'Venue Capacity', value: contract.venue?.capacity ? `${contract.venue.capacity} pax` : '-' },
          { label: 'Package', value: contract.packageSelected || '-' },
          { label: 'Total Packs', value: String(contract.totalPacks || 0) },
        ])}</div>
      </div></section>

      <section class="section"><h3>Event Preferences</h3><div class="grid">
        <div class="details">${detailRowsHtml([
          { label: 'Preferred Color', value: contract.preferredColor || '-' },
          { label: 'Napkin Type', value: contract.napkinType || '-' },
          { label: 'Table Setup', value: contract.tableSetup || '-' },
        ])}</div>
        <div class="details">${detailRowsHtml([
          { label: 'Backdrop Requirements', value: contract.backdropRequirements || '-' },
          { label: 'Special Requests', value: contract.specialRequests || '-' },
          { label: fullPaymentPlan ? 'Payment Timing' : 'Final Due Date', value: fullPaymentPlan ? 'Due before preparation approval' : finalBalanceDueDate.toLocaleDateString() },
          { label: fullPaymentPlan ? 'Later Balance' : `${finalPaymentPercent}% Final Balance`, value: fullPaymentPlan ? formatCurrency(0) : formatCurrency(remainingBalance) },
        ])}</div>
      </div></section>

      <section class="section"><h3>Menu Summary</h3><table><thead><tr><th>Category</th><th>Item</th><th>Quantity</th></tr></thead><tbody>${menuRows}</tbody></table></section>

      <section class="section">
        <h3>Signature Acknowledgment</h3>
        <p>By signing this contract, the client confirms the event details, pricing, package selections, and payment schedule with ${COMPANY_NAME}.</p>
        <div class="signatures">
          ${signatureBoxHtml('Client Signature', contract.signatureAssets?.client?.signedName || contract.clientName, contract.signatureAssets?.client?.title || 'Client', contract.signatureAssets?.client?.imageUrl, 'Client signature is not attached to this archived copy.')}
          ${signatureBoxHtml('Authorized Representative', contract.signatureAssets?.staff?.signedName || COMPANY_NAME, contract.signatureAssets?.staff?.title || COMPANY_NAME, contract.signatureAssets?.staff?.imageUrl, 'Staff signature is not attached to this archived copy.')}
        </div>
      </section>

      <div class="note">This archived copy was generated from the signed contract record for ${COMPANY_NAME}.</div>
    </div>
  </body></html>`;
};
