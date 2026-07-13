import type { ProcurementRequest } from '@/lib/procurement';

const BRAND = '#491321';
const COMPANY_NAME = 'Juan Carlos Catering Services';
const COMPANY_TAGLINE = 'Event Catering And Hospitality Services';

const REQUISITION_FORM_TITLES: Record<string, string> = {
  item_requisition: 'Item Requisition Form',
  purchase_requisition: 'Purchase Requisition Form',
  emergency_requisition: 'Emergency Requisition Form',
};

const REQUISITION_FORM_RULES: Record<string, string> = {
  item_requisition: 'For stockable items already carried in the stockroom. Requires the strict 7-day lead time before the needed date; same-day or next-day standard requests are not allowed.',
  purchase_requisition: 'For non-stockable items bought or rented from outside suppliers. Requires the 7-day lead time; procurement must gather supplier pricing and quotations before approval.',
  emergency_requisition: 'Only when the standard 7-day lead time has already lapsed. Processed within 1-3 days and requires approval from the Material Control Manager.',
};

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const formatDate = (value?: string | Date | null) => (
  value ? new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
);

const formatAmount = (value?: number | null) => (
  typeof value === 'number'
    ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value)
    : '-'
);

const detailRow = (label: string, value: string) => `
  <div class="detail-row">
    <div class="detail-term">${escapeHtml(label)}</div>
    <div class="detail-value">${value || '-'}</div>
  </div>
`;

const signatureBox = (role: string, name: string, hint = 'Signature over printed name / date') => `
  <div class="signature-box">
    <div class="signature-line">
      <span class="signature-role">${escapeHtml(role)}</span>
      <span class="signature-name">${escapeHtml(name)}</span>
      <div class="signature-title">${escapeHtml(hint)}</div>
    </div>
  </div>
`;

const STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Georgia, serif; background: #ffffff; color: #111827; margin: 0; padding: 24px; }
  .doc-shell { max-width: 900px; margin: 0 auto; }
  .doc-topbar { height: 6px; background: ${BRAND}; margin-bottom: 18px; }
  .company-header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 2px solid ${BRAND}; }
  .company-name { margin: 0; font-size: 28px; line-height: 1.05; color: ${BRAND}; letter-spacing: 0.03em; }
  .company-tagline { margin: 6px 0 0; color: #6b7280; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; font-family: Arial, sans-serif; }
  .document-title { margin: 16px 0 4px; font-size: 20px; color: #1f2937; text-transform: uppercase; letter-spacing: 0.16em; font-family: Arial, sans-serif; }
  .document-subtitle { margin: 0; color: #4b5563; font-size: 12.5px; line-height: 1.6; max-width: 540px; }
  .meta-stack { display: grid; gap: 6px; min-width: 240px; }
  .meta-line { display: flex; justify-content: space-between; gap: 16px; padding: 5px 0; border-bottom: 1px solid #e5e7eb; }
  .meta-label { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #6b7280; font-family: Arial, sans-serif; }
  .meta-value { font-size: 13px; font-weight: 600; color: #111827; text-align: right; }
  .document-section { margin-top: 18px; padding-top: 14px; border-top: 1px solid #d1d5db; }
  .section-heading { margin: 0 0 12px; font-size: 12px; color: ${BRAND}; text-transform: uppercase; letter-spacing: 0.18em; font-family: Arial, sans-serif; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 28px; }
  .detail-row { display: grid; grid-template-columns: 170px 1fr; gap: 14px; padding: 6px 0; border-bottom: 1px dotted #e5e7eb; }
  .detail-term { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.12em; font-family: Arial, sans-serif; }
  .detail-value { font-size: 14px; line-height: 1.55; }
  .rule-note { margin-top: 10px; padding: 10px 14px; border-left: 3px solid ${BRAND}; background: #faf5f7; font-size: 12.5px; line-height: 1.6; }
  .sla-chip { display: inline-block; padding: 2px 10px; border-radius: 999px; font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  .sla-on_track { background: #eaf3de; color: #27500a; }
  .sla-rush { background: #faeeda; color: #633806; }
  .sla-blocked { background: #fcebeb; color: #791f1f; }
  .check-row { font-size: 13.5px; margin-top: 8px; }
  .signature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
  .signature-box { min-height: 110px; display: flex; flex-direction: column; justify-content: flex-end; }
  .signature-line { border-top: 1px solid #111827; padding-top: 10px; }
  .signature-role { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.12em; font-family: Arial, sans-serif; }
  .signature-name { display: block; margin-top: 4px; font-size: 14px; min-height: 18px; }
  .signature-title { margin-top: 3px; font-size: 11px; color: #6b7280; }
  .document-note { margin-top: 18px; color: #6b7280; font-size: 11px; font-style: italic; }
`;

// Prints one of the three official requisition forms with the full approval
// chain. Per policy: no signature, no request, no release - Accounting cannot
// release cash, checks, or budget without an approved request and signatory.
export const printRequisitionForm = (request: ProcurementRequest, printedBy?: string) => {
  const requisitionType = request.requisitionType || 'purchase_requisition';
  const formTitle = REQUISITION_FORM_TITLES[requisitionType] || 'Requisition Form';
  const isEmergency = requisitionType === 'emergency_requisition';
  const slaStatus = request.sla?.status || 'on_track';
  const quote = request.quote;

  const printWindow = window.open('', '_blank', 'width=1080,height=1180');
  if (!printWindow) {
    return false;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(request.requestNumber)} - ${escapeHtml(formTitle)}</title>
        <style>${STYLES}</style>
      </head>
      <body>
        <div class="doc-shell">
          <div class="doc-topbar"></div>
          <div class="company-header">
            <div>
              <h1 class="company-name">${COMPANY_NAME}</h1>
              <p class="company-tagline">${COMPANY_TAGLINE}</p>
              <h2 class="document-title">${escapeHtml(formTitle)}</h2>
              <p class="document-subtitle">${escapeHtml(REQUISITION_FORM_RULES[requisitionType] || '')}</p>
            </div>
            <div class="meta-stack">
              <div class="meta-line"><span class="meta-label">Request No.</span><span class="meta-value">${escapeHtml(request.requestNumber)}</span></div>
              <div class="meta-line"><span class="meta-label">Date Filed</span><span class="meta-value">${escapeHtml(formatDate(request.createdAt))}</span></div>
              <div class="meta-line"><span class="meta-label">Needed By</span><span class="meta-value">${escapeHtml(formatDate(request.neededBy))}</span></div>
              <div class="meta-line"><span class="meta-label">SLA</span><span class="meta-value"><span class="sla-chip sla-${escapeHtml(slaStatus)}">${escapeHtml(slaStatus.replace(/_/g, ' '))}</span></span></div>
            </div>
          </div>

          <section class="document-section">
            <h3 class="section-heading">Requested Item</h3>
            <div class="info-grid">
              <div>
                ${detailRow('Item', escapeHtml(request.itemName))}
                ${detailRow('Item Code', escapeHtml(request.itemCode || '-'))}
                ${detailRow('Category', escapeHtml(request.itemCategory || '-'))}
                ${detailRow('Quantity Requested', String(request.requestedQuantity || 0))}
                ${detailRow('Shortage Covered', String(request.shortageQuantity ?? '-'))}
              </div>
              <div>
                ${detailRow('Department', escapeHtml(request.department))}
                ${detailRow('Request Type', escapeHtml(request.requestType === 'rental' ? 'Rental' : 'Purchase'))}
                ${detailRow('Contract', escapeHtml(request.contract ? `${request.contract.contractNumber} - ${request.contract.clientName}` : 'Not linked'))}
                ${detailRow('Event Date', escapeHtml(formatDate(request.contract?.eventDate || request.eventDate)))}
                ${detailRow('Reason', escapeHtml(request.requestReason || '-'))}
              </div>
            </div>
            <div class="rule-note">
              ${escapeHtml(request.sla?.reviewNote || REQUISITION_FORM_RULES[requisitionType] || '')}
              ${typeof request.sla?.daysUntilNeeded === 'number' ? ` Lead time at filing: ${request.sla.daysUntilNeeded} day(s) before the needed date.` : ''}
            </div>
          </section>

          <section class="document-section">
            <h3 class="section-heading">Supplier Quotation & Budget</h3>
            <div class="info-grid">
              <div>
                ${detailRow('Supplier', escapeHtml(quote?.supplier?.name || quote?.supplierName || '____________________'))}
                ${detailRow('Contact', escapeHtml(quote?.supplierContact || quote?.supplier?.phone || '____________________'))}
                ${detailRow('Quote Reference', escapeHtml(quote?.quoteReference || '____________________'))}
                ${detailRow('Supplier Lead Time', quote?.leadTimeDays != null ? `${quote.leadTimeDays} day(s)` : '____________________')}
              </div>
              <div>
                ${detailRow('Unit Price', escapeHtml(formatAmount(quote?.quotedUnitPrice)))}
                ${detailRow('Total Budget', escapeHtml(formatAmount(quote?.quotedTotal)))}
                ${detailRow('Expected Fulfillment', escapeHtml(formatDate(quote?.expectedFulfillmentDate)))}
                ${request.requestType === 'rental' ? detailRow('Rental Period', `${escapeHtml(formatDate(quote?.rentalStartDate))} - ${escapeHtml(formatDate(quote?.rentalEndDate))}`) : ''}
              </div>
            </div>
            <p class="check-row">Payment arrangement: &#9633; Cash budget &nbsp;&nbsp; &#9633; Purchase order - 30-day supplier credit terms</p>
          </section>

          <section class="document-section">
            <h3 class="section-heading">Approval Chain - No Signature, No Request, No Release</h3>
            <div class="signature-row">
              ${signatureBox('Requested By (Department)', request.createdBy?.name || '')}
              ${signatureBox('Purchasing Officer', request.quote?.submittedBy?.name || '')}
            </div>
            <div class="signature-row">
              ${isEmergency
                ? signatureBox('Material Control Manager (Emergency Approval)', '')
                : signatureBox('Accounting / Execom Approval', request.accounting?.reviewedBy?.name || '')}
              ${signatureBox('Budget Released By (Accounting)', request.releaseAuthorization?.authorizedBy?.name || '')}
            </div>
            <div class="signature-row">
              ${signatureBox('Received By (Requesting Department)', '')}
              ${signatureBox('Proof Of Purchase Confirmed By', request.fulfillment?.confirmedBy?.name || '')}
            </div>
          </section>

          <div class="document-note">
            ${escapeHtml(formTitle)} printed from the ${COMPANY_NAME} purchasing module${printedBy ? ` by ${escapeHtml(printedBy)}` : ''} on ${new Date().toLocaleString()}.
          </div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);

  return true;
};
