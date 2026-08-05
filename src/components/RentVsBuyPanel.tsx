import { Badge } from '@/components/ui/badge';
import {
  formatProcurementCurrency,
  formatProcurementDate,
  type ProcurementRentVsBuy,
} from '@/lib/procurement';

// Surfaces the rent-vs-buy comparison on a procurement request.
//
// Two events renting the same item used to be two unrelated approvals, so
// nobody could see the pair. This says whether buying would have been cheaper,
// and - just as importantly - when it would not, because one owned unit cannot
// cover two events happening on the same day.
//
// The system recommends; a person still decides. Nothing here changes a request.

const TONE = {
  buy: {
    wrapper: 'border-emerald-200 bg-emerald-50/70',
    badge: 'border-emerald-200 bg-emerald-100 text-emerald-900',
    label: 'Buying looks cheaper',
  },
  keep_renting: {
    wrapper: 'border-slate-200 bg-slate-50/70',
    badge: 'border-slate-200 bg-slate-100 text-slate-800',
    label: 'Renting stays cheaper',
  },
  compare_manually: {
    wrapper: 'border-amber-200 bg-amber-50/70',
    badge: 'border-amber-200 bg-amber-100 text-amber-900',
    label: 'Compare manually',
  },
} as const;

export default function RentVsBuyPanel({
  analysis,
  action,
}: {
  analysis?: ProcurementRentVsBuy;
  /** Screen-specific follow-through. Purchasing can raise the purchase itself;
   *  Accounting cannot create requests, so it recommends instead. */
  action?: React.ReactNode;
}) {
  if (!analysis || analysis.recommendation === 'none') {
    return null;
  }

  const tone = TONE[analysis.recommendation];
  // A purchase already raised for this item - the answer has been acted on.
  const existingPurchases = analysis.relatedRequests.filter((related) => related.requestType === 'purchase');

  return (
    <div className={`rounded-lg border p-4 ${tone.wrapper}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Same item requested elsewhere</p>
        <Badge variant="outline" className={tone.badge}>{tone.label}</Badge>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{analysis.summary}</p>

      {/* The numbers behind the recommendation, so a reviewer can disagree with
          it on the evidence rather than having to take it on trust. */}
      {analysis.comparable ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border bg-white/70 px-3 py-2 text-sm">
            <p className="text-muted-foreground">Rent all {analysis.rentalRequestCount}</p>
            <p className="mt-0.5 font-semibold">{formatProcurementCurrency(analysis.rentalCost)}</p>
          </div>
          <div className="rounded-md border bg-white/70 px-3 py-2 text-sm">
            <p className="text-muted-foreground">Buy {analysis.unitsNeeded} unit(s)</p>
            <p className="mt-0.5 font-semibold">{formatProcurementCurrency(analysis.purchaseCost)}</p>
          </div>
          <div className="rounded-md border bg-white/70 px-3 py-2 text-sm">
            <p className="text-muted-foreground">{analysis.savings > 0 ? 'Saved by buying' : 'Buying costs more'}</p>
            <p className="mt-0.5 font-semibold">
              {analysis.savings > 0
                ? formatProcurementCurrency(analysis.savings)
                : formatProcurementCurrency(analysis.purchaseCost - analysis.rentalCost)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Why one purchase may not be enough. This is the part that stops a
          same-day shortage being "solved" by buying a single unit. */}
      {analysis.overlapping ? (
        <p className="mt-3 text-sm text-amber-900">
          These requests overlap in time, so one purchased unit cannot cover them both -
          {' '}{analysis.unitsNeeded} would be needed.
        </p>
      ) : null}

      {analysis.estimated ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Part of this comparison is estimated from the inventory daily rate, not an agreed supplier quote.
        </p>
      ) : null}

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Also requested by
        </p>
        <ul className="mt-1 space-y-1 text-sm">
          {analysis.relatedRequests.map((related) => (
            <li key={related._id} className="text-muted-foreground">
              <span className="font-medium text-foreground">{related.requestNumber}</span>
              {' - '}
              {/* A purchase among the rentals is the one line that changes what
                  to do next, so it does not read like just another rental. */}
              {related.requestType === 'purchase' ? (
                <span className="font-medium text-sky-800">purchase of {related.requestedQuantity}</span>
              ) : (
                <>rental of {related.requestedQuantity}</>
              )}
              {related.contractNumber ? ` for ${related.contractNumber}` : ''}
              {related.clientName ? ` (${related.clientName})` : ''}
              {related.eventDate ? ` on ${formatProcurementDate(related.eventDate)}` : ''}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Advisory only - approving this request still rents it. Buying is a separate decision a person has to make.
      </p>

      {/* Once a purchase exists for this item, saying so matters more than
          offering the button again. Decided here rather than on each screen so
          Accounting and Purchasing cannot drift apart on the rule. */}
      {existingPurchases.length ? (
        <div className="mt-3 rounded-md border border-sky-200 bg-sky-50/80 px-3 py-2 text-sm text-sky-900">
          <p className="font-medium">
            A purchase has already been raised{existingPurchases.length > 1 ? ` (${existingPurchases.length})` : ''}
          </p>
          <p className="mt-0.5">
            {existingPurchases.map((purchase) => `${purchase.requestNumber} (${purchase.requestedQuantity} unit(s))`).join(', ')}
            {' - '}review that instead of raising another. These rentals stay open until someone returns them.
          </p>
        </div>
      ) : action ? (
        <div className="mt-3">{action}</div>
      ) : null}
    </div>
  );
}
