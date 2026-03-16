import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contracts from './pages/Contracts';
import ContractDetail from './pages/ContractDetail';
import NewContract from './pages/NewContract';
import MenuTastings from './pages/MenuTastings';
import MenuTastingDetail from './pages/MenuTastingDetail';
import NewMenuTasting from './pages/NewMenuTasting';
import Incidents from './pages/Incidents';
import Settings from './pages/Settings';

// Department Dashboards
import SalesDashboard from './pages/dashboards/SalesDashboard';
import AccountingDashboard from './pages/dashboards/AccountingDashboard';
import LogisticsDashboard from './pages/dashboards/LogisticsDashboard';
import BanquetDashboard from './pages/dashboards/BanquetDashboard';
import KitchenDashboard from './pages/dashboards/KitchenDashboard';
import PurchasingDashboard from './pages/dashboards/PurchasingDashboard';
import CreativeDashboard from './pages/dashboards/CreativeDashboard';
import LinenDashboard from './pages/dashboards/LinenDashboard';

// Department Management Modules
import CreativeInventory from './pages/CreativeInventory';
import BanquetStaff from './pages/BanquetStaff';
import LogisticsManagement from './pages/LogisticsManagement';
import LinenInventory from './pages/LinenInventory';
import StockroomInventory from './pages/StockroomInventory';
import KitchenInventory from './pages/KitchenInventory';
import AdminManagement from './pages/AdminManagement';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function SalesOrAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return user.role === 'sales' || user.role === 'admin'
    ? <>{children}</>
    : <Navigate to="/contracts" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      <Route path="/contracts" element={
        <PrivateRoute>
          <Contracts />
        </PrivateRoute>
      } />
      
      <Route path="/contracts/new" element={
        <SalesOrAdminRoute>
          <NewContract />
        </SalesOrAdminRoute>
      } />

      <Route path="/contracts/edit/:id" element={
        <SalesOrAdminRoute>
          <NewContract />
        </SalesOrAdminRoute>
      } />
      
      <Route path="/contracts/:id" element={
        <PrivateRoute>
          <ContractDetail />
        </PrivateRoute>
      } />
      
      <Route path="/menu-tastings" element={
        <PrivateRoute>
          <MenuTastings />
        </PrivateRoute>
      } />
      
      <Route path="/menu-tastings/new" element={
        <PrivateRoute>
          <NewMenuTasting />
        </PrivateRoute>
      } />
      
      <Route path="/menu-tastings/:id" element={
        <PrivateRoute>
          <MenuTastingDetail />
        </PrivateRoute>
      } />
      
      <Route path="/incidents" element={
        <PrivateRoute>
          <Incidents />
        </PrivateRoute>
      } />
      
      <Route path="/sales" element={
        <PrivateRoute>
          <SalesDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/accounting" element={
        <PrivateRoute>
          <AccountingDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/logistics" element={
        <PrivateRoute>
          <LogisticsDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/banquet" element={
        <PrivateRoute>
          <BanquetDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/kitchen" element={
        <PrivateRoute>
          <KitchenDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/purchasing" element={
        <PrivateRoute>
          <PurchasingDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/creative" element={
        <PrivateRoute>
          <CreativeDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/linen" element={
        <PrivateRoute>
          <LinenDashboard />
        </PrivateRoute>
      } />
      
      {/* Department Management Modules */}
      <Route path="/creative/inventory" element={
        <PrivateRoute>
          <CreativeInventory />
        </PrivateRoute>
      } />
      
      <Route path="/banquet/staff" element={
        <PrivateRoute>
          <BanquetStaff />
        </PrivateRoute>
      } />
      
      <Route path="/logistics/management" element={
        <PrivateRoute>
          <LogisticsManagement />
        </PrivateRoute>
      } />
      
      <Route path="/linen/inventory" element={
        <PrivateRoute>
          <LinenInventory />
        </PrivateRoute>
      } />
      
      <Route path="/stockroom/inventory" element={
        <PrivateRoute>
          <StockroomInventory />
        </PrivateRoute>
      } />
      
      <Route path="/kitchen/inventory" element={
        <PrivateRoute>
          <KitchenInventory />
        </PrivateRoute>
      } />
      
      <Route path="/admin/management" element={
        <PrivateRoute>
          <AdminManagement />
        </PrivateRoute>
      } />
      
      <Route path="/settings" element={
        <PrivateRoute>
          <Settings />
        </PrivateRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-center" />
      </Router>
    </AuthProvider>
  );
}

export default App;
