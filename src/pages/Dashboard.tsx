import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth, useRole } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  ArrowRight
} from 'lucide-react';

interface DashboardStats {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  completed: number;
  thisWeek: number;
  thisMonth: number;
}

interface Contract {
  _id: string;
  contractNumber: string;
  clientName: string;
  eventDate: string;
  status: string;
  progress: number;
  clientType: string;
  totalPacks: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { role } = useRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, contractsData] = await Promise.all([
        api.getDashboardStats(),
        api.getContracts()
      ]);
      setStats(statsData);
      setRecentContracts(contractsData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'pending_client_signature': return 'bg-sky-100 text-sky-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentDashboard = () => {
    switch (role) {
      case 'sales':
        return { label: 'Sales Dashboard', href: '/sales', color: 'bg-blue-500' };
      case 'accounting':
        return { label: 'Accounting Dashboard', href: '/accounting', color: 'bg-green-500' };
      case 'logistics':
        return { label: 'Logistics Dashboard', href: '/logistics', color: 'bg-orange-500' };
      case 'banquet_supervisor':
        return { label: 'Banquet Dashboard', href: '/banquet', color: 'bg-purple-500' };
      case 'kitchen':
        return { label: 'Kitchen Dashboard', href: '/kitchen', color: 'bg-red-500' };
      case 'purchasing':
        return { label: 'Purchasing Dashboard', href: '/purchasing', color: 'bg-teal-500' };
      case 'stockroom':
        return { label: 'Stockroom Inventory', href: '/stockroom/inventory', color: 'bg-amber-600' };
      case 'creative':
        return { label: 'Creative Dashboard', href: '/creative', color: 'bg-pink-500' };
      case 'linen':
        return { label: 'Linen Dashboard', href: '/linen', color: 'bg-indigo-500' };
      case 'admin':
        return { label: 'Admin Management', href: '/admin/management', color: 'bg-slate-700' };
      default:
        return null;
    }
  };

  const deptDashboard = getDepartmentDashboard();

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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}! Here's what's happening today.
            </p>
          </div>
          {deptDashboard && (
            <Button variant="outline" asChild>
              <Link to={deptDashboard.href}>
                Go to {deptDashboard.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                All time contracts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.thisWeek || 0}</div>
              <p className="text-xs text-muted-foreground">
                Events in next 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.approved || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ready for execution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.submitted || 0}</div>
              <p className="text-xs text-muted-foreground">
                For signature or approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Contracts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Contracts</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/contracts">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContracts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No contracts yet. Create your first contract!
                </p>
              ) : (
                recentContracts.map((contract) => (
                  <div
                    key={contract._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{contract.contractNumber}</span>
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {contract.clientName} • {contract.clientType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(contract.eventDate).toLocaleDateString()} • {contract.totalPacks} packs
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{contract.progress}%</p>
                        <Progress value={contract.progress} className="w-24 h-2" />
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/contracts/${contract._id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
