import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, Calendar, AlertTriangle, CheckCircle, Flame, Printer } from 'lucide-react';
import { getSortTimestamp } from '@/lib/worklist';
import { toast } from 'sonner';

interface Contract {
  _id: string;
  contractNumber: string;
  createdAt?: string;
  clientName: string;
  eventDate: string;
  status: string;
  totalPacks: number;
  menuDetails: Array<{
    category: string;
    item: string;
    quantity: number;
    notes?: string;
    confirmed: boolean;
  }>;
  cookingLocation: string;
  ingredientStatus: string;
  finalDetailsDeadline: string;
  slaWarning: boolean;
}

interface MenuTasting {
  _id: string;
  contract?: string | { _id: string } | null;
  menuItems?: Array<{ category?: string; itemName?: string; selected?: boolean; notes?: string }>;
  clientNotes?: string;
  feedback?: {
    rating?: number;
    comments?: string;
    itemsLiked?: string[];
    itemsToChange?: string[];
  };
}

export default function KitchenDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tastings, setTastings] = useState<MenuTasting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contractsData, tastingsData] = await Promise.all([
        api.getContracts(),
        api.getMenuTastings().catch(() => []),
      ]);
      setContracts(contractsData);
      setTastings(Array.isArray(tastingsData) ? tastingsData : []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const getTastingForContract = (contractId: string) =>
    tastings.find((tasting) => {
      const linked = typeof tasting.contract === 'object' ? tasting.contract?._id : tasting.contract;
      return linked && String(linked) === String(contractId);
    }) || null;

  const escapeHtml = (value?: string | number) =>
    String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const handlePrintKitchenChecklist = (contract: Contract) => {
    const tasting = getTastingForContract(contract._id);
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the kitchen checklist');
      return;
    }

    const chosenItems = contract.menuDetails || [];
    // Only dishes actually on the contract matter to the kitchen. Tasting notes
    // are matched by dish name so comments about dishes the client did NOT order
    // never reach the checklist.
    const normalize = (value?: string) => String(value || '').trim().toLowerCase();
    const chosenNames = new Set(chosenItems.map((item) => normalize(item.item)));
    const tastingNoteFor = (itemName?: string) => (tasting?.menuItems || [])
      .find((dish) => normalize(dish.itemName) === normalize(itemName) && dish.notes?.trim())?.notes || '';

    const menuRows = chosenItems.map((item) => {
      // The contract's own comment wins; otherwise fall back to the tasting note
      // recorded for that same dish.
      const note = (item.notes || '').trim() || tastingNoteFor(item.item);
      return `
      <tr>
        <td style="text-align:center">${item.confirmed ? '☑' : '☐'}</td>
        <td>${escapeHtml(item.item)}</td>
        <td>${escapeHtml(item.category)}</td>
        <td style="text-align:center">${escapeHtml(item.quantity)}</td>
        <td>${note ? `<span class="note">${escapeHtml(note)}</span>` : ''}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:#888">No menu items saved.</td></tr>';

    // General tasting feedback is filtered to the chosen dishes for the same reason.
    const likes = (tasting?.feedback?.itemsLiked || []).filter((name) => chosenNames.has(normalize(name)));
    const changes = (tasting?.feedback?.itemsToChange || []).filter((name) => chosenNames.has(normalize(name)));

    const preferencesHtml = tasting ? `
      <section>
        <h2>Client Preferences (from Menu Tasting)</h2>
        <p class="hint">Only covers dishes selected for this event. Per-dish comments appear in the Prep notes column above.</p>
        ${tasting.feedback?.rating ? `<p><strong>Tasting rating:</strong> ${tasting.feedback.rating} / 5</p>` : ''}
        ${tasting.feedback?.comments ? `<p><strong>Comments:</strong> ${escapeHtml(tasting.feedback.comments)}</p>` : ''}
        ${likes.length ? `<p><strong>Liked:</strong> ${likes.map(escapeHtml).join(', ')}</p>` : ''}
        ${changes.length ? `<p><strong>Requested changes:</strong> ${changes.map(escapeHtml).join(', ')}</p>` : ''}
        ${tasting.clientNotes ? `<p><strong>Client notes:</strong> ${escapeHtml(tasting.clientNotes)}</p>` : ''}
        ${(!tasting.feedback?.comments && !likes.length && !changes.length && !tasting.clientNotes)
          ? '<p style="color:#888">No general preferences were recorded for the selected dishes.</p>' : ''}
      </section>` : `
      <section>
        <h2>Client Preferences (from Menu Tasting)</h2>
        <p style="color:#888">No menu tasting is linked to this contract.</p>
      </section>`;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Kitchen Checklist - ${escapeHtml(contract.contractNumber)}</title>
      <style>
        body { font: 12pt/1.5 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 28px 34px; }
        h1 { font-size: 18pt; color: #7a1f2b; margin: 0 0 2px; }
        h2 { font-size: 13pt; color: #7a1f2b; border-bottom: 1px solid #d9c6ca; padding-bottom: 3px; margin: 22px 0 10px; }
        .meta { color: #555; margin: 0 0 4px; font-size: 10.5pt; }
        table { border-collapse: collapse; width: 100%; margin-top: 8px; font-size: 11pt; }
        th { background: #7a1f2b; color: #fff; text-align: left; padding: 6px 9px; font-size: 9.5pt; }
        td { border: 1px solid #ddd; padding: 6px 9px; }
        ul { margin: 4px 0 0 18px; }
        .note { font-size: 10pt; color: #7a1f2b; }
        .hint { font-size: 9.5pt; color: #777; margin: 0 0 8px; }
        @media print { button { display: none; } }
      </style></head><body>
      <h1>Kitchen Preparation Checklist</h1>
      <p class="meta">${escapeHtml(contract.contractNumber)} · ${escapeHtml(contract.clientName)}</p>
      <p class="meta">Event: ${new Date(contract.eventDate).toLocaleDateString()} · ${escapeHtml(contract.totalPacks)} pax · ${contract.cookingLocation === 'on_site' ? 'On-site' : 'Commissary'}</p>
      <section>
        <h2>Food Items To Prepare</h2>
        <table>
          <thead><tr><th style="width:36px">Done</th><th>Item</th><th>Category</th><th style="width:60px">Qty</th><th style="width:150px">Prep notes</th></tr></thead>
          <tbody>${menuRows}</tbody>
        </table>
      </section>
      ${preferencesHtml}
      <p style="margin-top:28px;color:#888;font-size:9pt">Printed ${new Date().toLocaleString()} · Juan Carlos Catering</p>
      </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const getEventDaysAway = (eventDate: string) => {
    const event = new Date(eventDate);
    const today = new Date();
    const diffTime = event.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getEventDistanceLabel = (eventDate: string) => {
    const daysAway = getEventDaysAway(eventDate);

    if (daysAway < 0) {
      return `${Math.abs(daysAway)} days ago`;
    }

    if (daysAway === 0) {
      return 'Today';
    }

    if (daysAway === 1) {
      return '1 day';
    }

    return `${daysAway} days`;
  };

  const handleUpdateMenuItem = async (contractId: string, itemIndex: number, confirmed: boolean) => {
    try {
      await api.updateKitchenMenuItem(contractId, { index: itemIndex, confirmed });
      toast.success('Menu item updated!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const handleUpdateIngredientStatus = async (contractId: string, status: string) => {
    try {
      await api.updateKitchenIngredientStatus(contractId, { status: status as 'pending' | 'procured' | 'prepared' });
      toast.success('Ingredient status updated!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const approvedContracts = [...contracts]
    .filter(c => c.status === 'approved')
    .sort((left, right) => getSortTimestamp(right.createdAt, right.eventDate) - getSortTimestamp(left.createdAt, left.eventDate));

  const sortByUpcomingDate = (items: Contract[]) => [...items].sort(
    (left, right) => new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime()
  );

  const getChecklistSummary = (contract: Contract) => {
    const totalItems = contract.menuDetails?.length || 0;
    const confirmedItems = contract.menuDetails?.filter(item => item.confirmed).length || 0;

    return {
      totalItems,
      confirmedItems,
      isComplete: totalItems === 0 || confirmedItems === totalItems,
    };
  };

  const thisWeekContracts = sortByUpcomingDate(approvedContracts.filter(c => {
    const days = getEventDaysAway(c.eventDate);
    return days <= 7 && days >= 0;
  }));

  const renderKitchenWorkflowCard = (contract: Contract) => {
    const daysAway = getEventDaysAway(contract.eventDate);
    const { totalItems, confirmedItems, isComplete } = getChecklistSummary(contract);
    const isPrepared = contract.ingredientStatus === 'prepared';
    const needsUrgentPrep = !isPrepared && daysAway <= 2 && daysAway >= 0;

    return (
      <Card key={contract._id} className={needsUrgentPrep ? 'border-red-300' : ''}>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{contract.contractNumber}</span>
                <Badge className={daysAway <= 2 && daysAway >= 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                  {getEventDistanceLabel(contract.eventDate)}
                </Badge>
                {contract.slaWarning && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    SLA
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-medium">{contract.clientName}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(contract.eventDate).toLocaleDateString()} | {contract.totalPacks} pax
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize">
                  <Flame className="h-3 w-3 mr-1" />
                  {contract.cookingLocation === 'on_site' ? 'On-site' : 'Commissary'}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {contract.ingredientStatus || 'pending'}
                </Badge>
                <Badge variant="outline">
                  {totalItems > 0 ? `Checklist ${confirmedItems}/${totalItems}` : 'No checklist'}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
              {isPrepared ? (
                <Badge className="justify-center bg-green-100 text-green-800 hover:bg-green-100">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Kitchen Ready
                </Badge>
              ) : (
                <Button
                  size="sm"
                  disabled={!isComplete}
                  onClick={() => handleUpdateIngredientStatus(contract._id, 'prepared')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Ready
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={() => handlePrintKitchenChecklist(contract)}>
                <Printer className="mr-2 h-4 w-4" />
                Print Checklist
              </Button>

              <Button variant="outline" size="sm" asChild>
                <Link to={`/contracts/${contract._id}`}>View Contract</Link>
              </Button>
            </div>
          </div>

          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="preparation-checklist" className="overflow-hidden rounded-xl border bg-slate-50/50 px-4">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex flex-1 flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-foreground">Preparation Checklist</p>
                  <Badge variant="outline" className="w-fit">
                    {totalItems > 0 ? `${confirmedItems}/${totalItems} confirmed` : 'No checklist'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {contract.menuDetails && contract.menuDetails.length > 0 ? (
                  <div className="space-y-2">
                    {contract.menuDetails.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Checkbox
                          checked={item.confirmed}
                          onCheckedChange={(checked) =>
                            handleUpdateMenuItem(contract._id, index, Boolean(checked))
                          }
                        />
                        <span className={item.confirmed ? 'line-through text-muted-foreground' : ''}>
                          {item.item} ({item.category}) x {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No menu checklist saved for this contract.</p>
                )}

                {!isPrepared && !isComplete && totalItems > 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Complete the checklist before marking this event ready.
                  </p>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  const renderKitchenOverviewCard = (contract: Contract) => {
    const { totalItems, confirmedItems } = getChecklistSummary(contract);

    return (
      <Card key={contract._id}>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{contract.contractNumber}</span>
                <Badge variant="outline" className="capitalize">
                  {contract.ingredientStatus || 'pending'}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {contract.cookingLocation === 'on_site' ? 'On-site' : 'Commissary'}
                </Badge>
                <Badge variant="outline">
                  {totalItems > 0 ? `Checklist ${confirmedItems}/${totalItems}` : 'No checklist'}
                </Badge>
              </div>
              <h3 className="text-lg font-medium">{contract.clientName}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(contract.eventDate).toLocaleDateString()} | {contract.totalPacks} pax | {getEventDistanceLabel(contract.eventDate)}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/contracts/${contract._id}`}>View Contract</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Kitchen Dashboard</h1>
          <p className="text-muted-foreground">
            Food preparation and ingredient readiness
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedContracts.length}</div>
              <p className="text-xs text-muted-foreground">Approved contracts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{thisWeekContracts.length}</div>
              <p className="text-xs text-muted-foreground">Upcoming events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ready</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {approvedContracts.filter(c => c.ingredientStatus === 'prepared').length}
              </div>
              <p className="text-xs text-muted-foreground">Ingredients ready</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="thisweek" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="thisweek">
              This Week ({thisWeekContracts.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Events ({approvedContracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="thisweek" className="space-y-4">
            {thisWeekContracts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No events this week</p>
                </CardContent>
              </Card>
            ) : (
              thisWeekContracts.map((contract) => renderKitchenWorkflowCard(contract))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {approvedContracts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No approved contracts</p>
                </CardContent>
              </Card>
            ) : (
              approvedContracts.map((contract) => renderKitchenOverviewCard(contract))
            )}
          </TabsContent>

        </Tabs>
      </div>
    </Layout>
  );
}
