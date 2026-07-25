import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { api } from '@/services/api';

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
  UserCog,
  BarChart3
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionLabel?: string;
  department?: string;
  createdAt: string;
  contract?: {
    _id: string;
    contractNumber?: string;
    clientName?: string;
    status?: string;
  };
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home, roles: ['all'] },
  { label: 'Menu Tastings', href: '/menu-tastings', icon: Utensils, roles: ['sales', 'admin'] },
  { label: 'Contracts', href: '/contracts', icon: FileText, roles: ['sales', 'accounting', 'stockroom', 'creative', 'linen', 'admin'] },
  { label: 'Signed Contracts', href: '/signed-contracts', icon: FileText, roles: ['sales', 'admin'] },
  { label: 'Sales', href: '/sales', icon: Briefcase, roles: ['sales', 'admin'] },
  { label: 'Accounting', href: '/accounting', icon: Calculator, roles: ['accounting', 'admin'] },
  { label: 'Logistics', href: '/logistics', icon: Truck, roles: ['logistics', 'admin'] },
  { label: 'Banquet', href: '/banquet', icon: Users, roles: ['banquet_supervisor', 'admin'] },
  { label: 'Kitchen', href: '/kitchen', icon: ChefHat, roles: ['kitchen', 'admin'] },
  { label: 'Purchasing', href: '/purchasing', icon: ShoppingCart, roles: ['purchasing', 'admin'] },
  { label: 'Stockroom', href: '/stockroom', icon: Package, roles: ['stockroom', 'admin'] },
  { label: 'Creative', href: '/creative', icon: Palette, roles: ['creative', 'admin'] },
  { label: 'Linen', href: '/linen', icon: Shirt, roles: ['linen', 'admin'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['all'] },
  { label: 'Incidents', href: '/incidents', icon: AlertTriangle, roles: ['all'] },
];

const managementNavItems: NavItem[] = [
  { label: 'Creative Inventory', href: '/creative/inventory', icon: Package, roles: ['creative', 'admin'] },
  { label: 'Banquet Staff', href: '/banquet/staff', icon: UserCog, roles: ['banquet_supervisor', 'admin'] },
  { label: 'Drivers & Trucks', href: '/logistics/management', icon: Truck, roles: ['logistics', 'admin'] },
  { label: 'Linen Inventory', href: '/linen/inventory', icon: Package, roles: ['linen', 'admin'] },
  { label: 'Stockroom Inventory', href: '/stockroom/inventory', icon: Package, roles: ['stockroom', 'admin'] },
  { label: 'Kitchen Inventory', href: '/kitchen/inventory', icon: ChefHat, roles: ['kitchen', 'admin'] },
  { label: 'Admin Management', href: '/admin/management', icon: Shield, roles: ['admin'] },
];

const notificationDepartmentByRole: Record<string, string> = {
  sales: 'sales',
  accounting: 'accounting',
  logistics: 'logistics',
  banquet_supervisor: 'banquet',
  kitchen: 'kitchen',
  purchasing: 'purchasing',
  stockroom: 'stockroom',
  creative: 'creative',
  linen: 'linen',
};

const isLegacyProcurementNotification = (notification: AppNotification) => {
  const text = `${notification.title} ${notification.message}`.toLowerCase();
  return [
    'procurement',
    'purchasing',
    'budget request',
    'budget approval',
    'proof of purchase',
    'expense confirmation',
  ].some((keyword) => text.includes(keyword));
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const { user, logout } = useAuth();
  const { role } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const currentNotificationDepartment = role ? notificationDepartmentByRole[role] : null;
  const visibleNotifications = role === 'admin'
    ? notifications
    : notifications.filter((notification) => {
      if (notification.department) {
        return notification.department === currentNotificationDepartment;
      }

      return role !== 'sales' || !isLegacyProcurementNotification(notification);
    });
  const unreadCount = visibleNotifications.filter((notification) => !notification.isRead).length;

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      setIsNotificationsLoading(true);
      const data = await api.getNotifications();
      setNotifications((data as AppNotification[]) || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) {
      return;
    }

    const intervalId = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(intervalId);
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenNotification = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await api.markNotificationRead(notification._id);
        setNotifications((current) => current.map((entry) => (
          entry._id === notification._id ? { ...entry, isRead: true } : entry
        )));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    navigate(notification.actionUrl || (notification.contract?._id ? `/contracts/${notification.contract._id}` : '/'));
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const formatNotificationTime = (value: string) => {
    const timestamp = new Date(value).getTime();
    const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return new Date(value).toLocaleDateString();
  };

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes('all') || item.roles.includes(role || '')
  );

  const filteredManagementItems = managementNavItems.filter(item => 
    item.roles.includes(role || '')
  );

  const NotificationMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)]">
        <div className="flex items-center justify-between gap-3 px-2 py-1.5">
          <div>
            <DropdownMenuLabel className="p-0">Department Notifications</DropdownMenuLabel>
            <p className="text-xs text-muted-foreground">Updates and tasks for your department.</p>
          </div>
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={handleMarkAllNotificationsRead}>
              Mark all read
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {isNotificationsLoading && visibleNotifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : visibleNotifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
          ) : (
            visibleNotifications.slice(0, 10).map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => handleOpenNotification(notification)}
                className={`w-full border-b px-3 py-3 text-left transition hover:bg-muted/70 ${
                  notification.isRead ? 'bg-background' : 'bg-primary/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{notification.title}</p>
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{notification.message}</p>
                  </div>
                  {!notification.isRead ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {notification.department ? (
                    <Badge variant="outline" className="capitalize">
                      {notification.department}
                    </Badge>
                  ) : null}
                  {notification.priority === 'high' ? (
                    <Badge variant="destructive">High</Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground">{formatNotificationTime(notification.createdAt)}</span>
                  <span className="text-xs font-medium text-primary">{notification.actionLabel || 'Open'}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
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

      <ScrollArea className="flex-1 min-h-0 py-4">
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
        <div className="mb-3 flex items-center justify-between rounded-xl border bg-muted/40 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          <NotificationMenu />
        </div>
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
    <div className="h-screen flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-card">
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
          <NotificationMenu />
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
