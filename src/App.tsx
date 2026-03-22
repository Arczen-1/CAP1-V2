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
import StockroomDashboard from './pages/dashboards/StockroomDashboard';

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

function ContractEditorRoute({ children }: { children: React.ReactNode }) {
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

  return ['sales', 'admin', 'creative', 'linen', 'purchasing', 'stockroom'].includes(user.role)
    ? <>{children}</>
    : <Navigate to="/contracts" replace />;
}

function RoleRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
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

  return allowedRoles.includes(user.role)
    ? <>{children}</>
    : <Navigate to="/" replace />;
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
        <ContractEditorRoute>
          <NewContract />
        </ContractEditorRoute>
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
        <RoleRoute allowedRoles={['sales', 'admin']}>
          <SalesDashboard />
        </RoleRoute>
      } />
      
      <Route path="/accounting" element={
        <RoleRoute allowedRoles={['accounting', 'admin']}>
          <AccountingDashboard />
        </RoleRoute>
      } />
      
      <Route path="/logistics" element={
        <RoleRoute allowedRoles={['logistics', 'admin']}>
          <LogisticsDashboard />
        </RoleRoute>
      } />
      
      <Route path="/banquet" element={
        <RoleRoute allowedRoles={['banquet_supervisor', 'admin']}>
          <BanquetDashboard />
        </RoleRoute>
      } />
      
      <Route path="/kitchen" element={
        <RoleRoute allowedRoles={['kitchen', 'admin']}>
          <KitchenDashboard />
        </RoleRoute>
      } />
      
      <Route path="/purchasing" element={
        <RoleRoute allowedRoles={['purchasing', 'admin']}>
          <PurchasingDashboard />
        </RoleRoute>
      } />

      <Route path="/stockroom" element={
        <RoleRoute allowedRoles={['stockroom', 'admin']}>
          <StockroomDashboard />
        </RoleRoute>
      } />
      
      <Route path="/creative" element={
        <RoleRoute allowedRoles={['creative', 'admin']}>
          <CreativeDashboard />
        </RoleRoute>
      } />
      
      <Route path="/linen" element={
        <RoleRoute allowedRoles={['linen', 'admin']}>
          <LinenDashboard />
        </RoleRoute>
      } />
      
      {/* Department Management Modules */}
      <Route path="/creative/inventory" element={
        <RoleRoute allowedRoles={['creative', 'admin']}>
          <CreativeInventory />
        </RoleRoute>
      } />
      
      <Route path="/banquet/staff" element={
        <RoleRoute allowedRoles={['banquet_supervisor', 'admin']}>
          <BanquetStaff />
        </RoleRoute>
      } />
      
      <Route path="/logistics/management" element={
        <RoleRoute allowedRoles={['logistics', 'admin']}>
          <LogisticsManagement />
        </RoleRoute>
      } />
      
      <Route path="/linen/inventory" element={
        <RoleRoute allowedRoles={['linen', 'admin']}>
          <LinenInventory />
        </RoleRoute>
      } />
      
      <Route path="/stockroom/inventory" element={
        <RoleRoute allowedRoles={['logistics', 'stockroom', 'admin']}>
          <StockroomInventory />
        </RoleRoute>
      } />
      
      <Route path="/kitchen/inventory" element={
        <RoleRoute allowedRoles={['kitchen', 'admin']}>
          <KitchenInventory />
        </RoleRoute>
      } />
      
      <Route path="/admin/management" element={
        <RoleRoute allowedRoles={['admin']}>
          <AdminManagement />
        </RoleRoute>
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
