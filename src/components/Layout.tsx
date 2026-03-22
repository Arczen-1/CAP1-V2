import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  Home,
  FileText,
  AlertTriangle,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Briefcase,
  Calculator,
  Truck,
  Users,
  ChefHat,
  ShoppingCart,
  Palette,
  Shirt,
  Bell,
  Utensils,
  Package,
  Shield,
  UserCog
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home, roles: ['all'] },
  { label: 'Menu Tastings', href: '/menu-tastings', icon: Utensils, roles: ['sales', 'admin'] },
  { label: 'Contracts', href: '/contracts', icon: FileText, roles: ['sales', 'accounting', 'purchasing', 'stockroom', 'creative', 'linen', 'admin'] },
  { label: 'Sales', href: '/sales', icon: Briefcase, roles: ['sales', 'admin'] },
  { label: 'Accounting', href: '/accounting', icon: Calculator, roles: ['accounting', 'admin'] },
  { label: 'Logistics', href: '/logistics', icon: Truck, roles: ['logistics', 'admin'] },
  { label: 'Banquet', href: '/banquet', icon: Users, roles: ['banquet_supervisor', 'admin'] },
  { label: 'Kitchen', href: '/kitchen', icon: ChefHat, roles: ['kitchen', 'admin'] },
  { label: 'Purchasing', href: '/purchasing', icon: ShoppingCart, roles: ['purchasing', 'admin'] },
  { label: 'Stockroom', href: '/stockroom', icon: Package, roles: ['stockroom', 'admin'] },
  { label: 'Creative', href: '/creative', icon: Palette, roles: ['creative', 'admin'] },
  { label: 'Linen', href: '/linen', icon: Shirt, roles: ['linen', 'admin'] },
  { label: 'Incidents', href: '/incidents', icon: AlertTriangle, roles: ['all'] },
];

const managementNavItems: NavItem[] = [
  { label: 'Creative Inventory', href: '/creative/inventory', icon: Package, roles: ['creative', 'admin'] },
  { label: 'Banquet Staff', href: '/banquet/staff', icon: UserCog, roles: ['banquet_supervisor', 'admin'] },
  { label: 'Drivers & Trucks', href: '/logistics/management', icon: Truck, roles: ['logistics', 'admin'] },
  { label: 'Linen Inventory', href: '/linen/inventory', icon: Package, roles: ['linen', 'admin'] },
  { label: 'Stockroom Inventory', href: '/stockroom/inventory', icon: Package, roles: ['logistics', 'stockroom', 'admin'] },
  { label: 'Kitchen Inventory', href: '/kitchen/inventory', icon: ChefHat, roles: ['kitchen', 'admin'] },
  { label: 'Admin Management', href: '/admin/management', icon: Shield, roles: ['admin'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { role } = useRole();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes('all') || item.roles.includes(role || '')
  );

  const filteredManagementItems = managementNavItems.filter(item => 
    item.roles.includes(role || '')
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-5">
        <Link to="/" className="flex items-center justify-center">
          <div className="h-10 w-44 max-w-full overflow-hidden">
            <img
              src="/logo.png"
              alt="Juan Carlos"
              className="h-full w-full object-cover object-center"
            />
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          
          {filteredManagementItems.length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Management
                </p>
              </div>
              {filteredManagementItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.department}</p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-3 ml-12">
            <div className="h-8 w-32 max-w-full overflow-hidden">
              <img
                src="/logo.png"
                alt="Juan Carlos"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
