import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, Calendar, AlertTriangle, CheckCircle, Package, Flame } from 'lucide-react';
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
    confirmed: boolean;
  }>;
  cookingLocation: string;
  ingredientStatus: string;
  finalDetailsDeadline: string;
  slaWarning: boolean;
}

export default function KitchenDashboard() {
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

  const getEventDaysAway = (eventDate: string) => {
    const event = new Date(eventDate);
    const today = new Date();
    const diffTime = event.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleUpdateMenuItem = async (contractId: string, itemIndex: number, confirmed: boolean) => {
    try {
      const contract = contracts.find(c => c._id === contractId);
      if (!contract) return;

      const updatedMenu = [...contract.menuDetails];
      updatedMenu[itemIndex] = { ...updatedMenu[itemIndex], confirmed };

      await api.updateContract(contractId, { menuDetails: updatedMenu });
      toast.success('Menu item updated!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const handleUpdateCookingLocation = async (contractId: string, location: string) => {
    try {
      await api.updateContract(contractId, { cookingLocation: location });
      toast.success('Cooking location updated!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const handleUpdateIngredientStatus = async (contractId: string, status: string) => {
    try {
      await api.updateContract(contractId, { ingredientStatus: status });
      toast.success('Ingredient status updated!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const approvedContracts = [...contracts]
    .filter(c => c.status === 'approved')
    .sort((left, right) => getSortTimestamp(right.createdAt, right.eventDate) - getSortTimestamp(left.createdAt, left.eventDate));
  
  const thisWeekContracts = approvedContracts.filter(c => {
    const days = getEventDaysAway(c.eventDate);
    return days <= 7 && days >= 0;
  });

  const pendingPrep = approvedContracts.filter(c => 
    c.ingredientStatus !== 'prepared'
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
          <h1 className="text-3xl font-bold tracking-tight">Kitchen Dashboard</h1>
          <p className="text-muted-foreground">
            Food preparation and ingredient readiness
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
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
              <CardTitle className="text-sm font-medium">Pending Prep</CardTitle>
              <Package className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingPrep.length}</div>
              <p className="text-xs text-muted-foreground">Need preparation</p>
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

        {/* Events Tabs */}
        <Tabs defaultValue="thisweek" className="space-y-4">
          <TabsList>
            <TabsTrigger value="thisweek">
              This Week ({thisWeekContracts.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Events ({approvedContracts.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Prep ({pendingPrep.length})
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
              thisWeekContracts.map((contract) => {
                const daysAway = getEventDaysAway(contract.eventDate);
                
                return (
                  <Card key={contract._id} className={daysAway <= 2 ? 'border-red-300' : ''}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{contract.contractNumber}</span>
                            <Badge className={daysAway <= 2 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                              {daysAway === 0 ? 'Today' : `${daysAway} days`}
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
                            {new Date(contract.eventDate).toLocaleDateString()} • {contract.totalPacks} packs
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              <Flame className="h-3 w-3 mr-1" />
                              {contract.cookingLocation === 'on_site' ? 'On-site' : 'Commissary'}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {contract.ingredientStatus || 'pending'}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/contracts/${contract._id}`}>View Contract</Link>
                          </Button>
                        </div>
                      </div>

                      {/* Menu Items */}
                      {contract.menuDetails && contract.menuDetails.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="font-medium mb-2">Menu Items:</p>
                          <div className="space-y-2">
                            {contract.menuDetails.map((item, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <Checkbox
                                  checked={item.confirmed}
                                  onCheckedChange={(checked) => 
                                    handleUpdateMenuItem(contract._id, index, checked as boolean)
                                  }
                                />
                                <span className={item.confirmed ? 'line-through text-muted-foreground' : ''}>
                                  {item.item} ({item.category}) × {item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
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
              approvedContracts.map((contract) => (
                <Card key={contract._id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{contract.contractNumber}</span>
                          <Badge variant="outline" className="capitalize">
                            {contract.ingredientStatus || 'pending'}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-medium">{contract.clientName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(contract.eventDate).toLocaleDateString()} • {contract.totalPacks} packs
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={contract.ingredientStatus || 'pending'}
                          onChange={(e) => handleUpdateIngredientStatus(contract._id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="procured">Procured</option>
                          <option value="prepared">Prepared</option>
                        </select>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/contracts/${contract._id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingPrep.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">All preparations complete!</p>
                </CardContent>
              </Card>
            ) : (
              pendingPrep.map((contract) => (
                <Card key={contract._id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{contract.contractNumber}</span>
                          <Badge variant="outline" className="capitalize">
                            {contract.ingredientStatus || 'pending'}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-medium">{contract.clientName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(contract.eventDate).toLocaleDateString()} • {contract.totalPacks} packs
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={contract.cookingLocation || 'commissary'}
                          onChange={(e) => handleUpdateCookingLocation(contract._id, e.target.value)}
                        >
                          <option value="commissary">Commissary</option>
                          <option value="on_site">On-site</option>
                        </select>
                        <Button 
                          size="sm"
                          onClick={() => handleUpdateIngredientStatus(contract._id, 'prepared')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Ready
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
