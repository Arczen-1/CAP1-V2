import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Calendar, CheckCircle, Package } from 'lucide-react';
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
  }>;
  ingredientStatus: string;
}

interface PurchaseItem {
  item: string;
  category: string;
  totalQuantity: number;
  contracts: string[];
}

export default function PurchasingDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const contractsData = await api.getContracts();
      setContracts(contractsData);
      generatePurchaseList(contractsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePurchaseList = (contracts: Contract[]) => {
    const itemMap = new Map<string, PurchaseItem>();

    contracts
      .filter(c => c.status === 'approved' && c.ingredientStatus !== 'prepared')
      .forEach(contract => {
        contract.menuDetails?.forEach(menuItem => {
          const key = `${menuItem.category}-${menuItem.item}`;
          if (itemMap.has(key)) {
            const existing = itemMap.get(key)!;
            existing.totalQuantity += menuItem.quantity * contract.totalPacks;
            existing.contracts.push(contract.contractNumber);
          } else {
            itemMap.set(key, {
              item: menuItem.item,
              category: menuItem.category,
              totalQuantity: menuItem.quantity * contract.totalPacks,
              contracts: [contract.contractNumber]
            });
          }
        });
      });

    setPurchaseList(Array.from(itemMap.values()));
  };

  const getEventDaysAway = (eventDate: string) => {
    const event = new Date(eventDate);
    const today = new Date();
    const diffTime = event.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const approvedContracts = [...contracts]
    .filter(c => c.status === 'approved')
    .sort((left, right) => getSortTimestamp(right.createdAt, right.eventDate) - getSortTimestamp(left.createdAt, left.eventDate));
  
  const thisWeekContracts = approvedContracts.filter(c => {
    const days = getEventDaysAway(c.eventDate);
    return days <= 7 && days >= 0;
  });

  const pendingProcurement = approvedContracts.filter(c => 
    c.ingredientStatus === 'pending'
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchasing Dashboard</h1>
          <p className="text-muted-foreground">
            Ingredient procurement and purchase planning
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Package className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingProcurement.length}</div>
              <p className="text-xs text-muted-foreground">Need procurement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Items to Buy</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{purchaseList.length}</div>
              <p className="text-xs text-muted-foreground">Unique items</p>
            </CardContent>
          </Card>
        </div>

        {/* Purchase List */}
        <Tabs defaultValue="purchase" className="space-y-4">
          <TabsList>
            <TabsTrigger value="purchase">
              Purchase List ({purchaseList.length})
            </TabsTrigger>
            <TabsTrigger value="events">
              Events ({approvedContracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase" className="space-y-4">
            {purchaseList.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No items to purchase</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Consolidated Purchase List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {purchaseList.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox />
                          <div>
                            <p className="font-medium">{item.item}</p>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.totalQuantity.toLocaleString()} units</p>
                          <p className="text-xs text-muted-foreground">
                            For: {item.contracts.join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            {approvedContracts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No approved contracts</p>
                </CardContent>
              </Card>
            ) : (
              approvedContracts.map((contract) => {
                const daysAway = getEventDaysAway(contract.eventDate);
                
                return (
                  <Card key={contract._id} className={daysAway <= 3 ? 'border-red-300' : ''}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{contract.contractNumber}</span>
                            <Badge className={daysAway <= 3 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                              {daysAway === 0 ? 'Today' : `${daysAway} days`}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {contract.ingredientStatus || 'pending'}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-medium">{contract.clientName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(contract.eventDate).toLocaleDateString()} • {contract.totalPacks} packs
                          </p>
                          {contract.menuDetails && (
                            <p className="text-sm text-muted-foreground">
                              {contract.menuDetails.length} menu items
                            </p>
                          )}
                        </div>
                        <Button variant="outline" asChild>
                          <Link to={`/contracts/${contract._id}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
