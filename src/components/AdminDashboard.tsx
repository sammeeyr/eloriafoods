import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, RefreshCw, Check, Truck, Store, Calendar, Clock, 
  ArrowLeft, LogOut, Plus, Trash2, Edit3, Lock, AlertTriangle, ChefHat, 
  FileText, DollarSign, Settings as SettingsIcon, PackageCheck, AlertCircle,
  Users, UserPlus, Key, Eye, EyeOff, Phone, Mail, Search, Copy
} from 'lucide-react';
import { Order, DailyMenu, RestaurantSettings, OrderStatus, Product, AuthUser, UserRole, Permission, StaffMember, StaffDepartment } from '../types';
import { 
  adminLogin, 
  adminFetchOrders, 
  adminCreateOrder,
  adminDeleteOrder,
  adminUpdateOrderStatus, 
  adminVerifyOfflinePayment, 
  adminFetchMenuItems,
  adminCreateDish,
  adminUpdateDish,
  adminDeleteDish,
  adminPublishMenu, 
  adminToggleItemAvailability, 
  adminUpdateSettings, 
  adminFetchReports,
  adminFetchStaffs,
  adminCreateStaff,
  adminUpdateStaff,
  adminToggleStaffStatus,
  adminDeleteStaff,
  fetchTodayMenu,
  fetchSettings
} from '../services/api';

interface AdminDashboardProps {
  isOpen?: boolean;
  isStandalonePage?: boolean;
  onClose?: () => void;
  onReturnToHome?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  isOpen = true, 
  isStandalonePage = false,
  onClose = () => {},
  onReturnToHome
}) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem('dbl_admin_user');
    if (raw) {
      try { return JSON.parse(raw); } catch { return null; }
    }
    const token = sessionStorage.getItem('dbl_admin_token');
    const role = (sessionStorage.getItem('dbl_admin_role') || 'admin') as UserRole;
    if (token) {
      return {
        id: role === 'staff' ? 'stf-01' : 'adm-01',
        fullName: role === 'staff' ? 'Abuja Kitchen Staff & Dispatch' : 'Executive Administrator (COO)',
        role,
        permissions: role === 'staff' 
          ? ['orders:read', 'orders:status', 'menu:read', 'menu:availability']
          : ['orders:read', 'orders:write', 'orders:status', 'orders:delete', 'menu:read', 'menu:write', 'menu:availability', 'menu:delete', 'finance:verify', 'settings:read', 'settings:write', 'reports:read', 'staff:read', 'staff:write', 'staff:delete']
      };
    }
    return null;
  });

  const isAuthenticated = Boolean(currentUser);
  const userRole: UserRole = currentUser?.role || 'admin';
  const isAdmin = userRole === 'admin';
  const isStaff = userRole === 'staff';

  const hasPermission = (permission: Permission): boolean => {
    if (isAdmin) return true;
    return Boolean(currentUser?.permissions?.includes(permission));
  };

  // Login form state
  const [loginRole, setLoginRole] = useState<'admin' | 'staff'>('admin');
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'staffs' | 'reports' | 'settings'>('orders');

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null);
  const [reports, setReports] = useState<any>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [staffs, setStaffs] = useState<StaffMember[]>([]);
  const [staffDeptFilter, setStaffDeptFilter] = useState<'all' | StaffDepartment>('all');
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [visiblePasscodes, setVisiblePasscodes] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CRUD Modal States
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderType, setNewOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [newOrderAddress, setNewOrderAddress] = useState('');
  const [newOrderDishName, setNewOrderDishName] = useState('Smokey Jollof + Plantain + Chicken');
  const [newOrderAmount, setNewOrderAmount] = useState<number>(4000);

  const [isNewDishModalOpen, setIsNewDishModalOpen] = useState<boolean>(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState<number>(4500);
  const [newDishMealType, setNewDishMealType] = useState<string>('soups');
  const [newDishDescription, setNewDishDescription] = useState('');
  const [newDishPortions, setNewDishPortions] = useState<number>(25);

  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editDishName, setEditDishName] = useState('');
  const [editDishPrice, setEditDishPrice] = useState<number>(0);
  const [editDishPortions, setEditDishPortions] = useState<number>(0);

  // Staff CRUD Modal States
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState<boolean>(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('staff');
  const [newStaffDept, setNewStaffDept] = useState<StaffDepartment>('Kitchen');
  const [newStaffPasscode, setNewStaffPasscode] = useState('');

  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffRole, setEditStaffRole] = useState<UserRole>('staff');
  const [editStaffDept, setEditStaffDept] = useState<StaffDepartment>('Kitchen');
  const [editStaffPasscode, setEditStaffPasscode] = useState('');
  const [editStaffActive, setEditStaffActive] = useState<boolean>(true);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadData();
    }
  }, [isAuthenticated, isOpen, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (activeTab === 'orders') {
        const ords = await adminFetchOrders();
        setOrders(ords);
      } else if (activeTab === 'menu') {
        const menu = await fetchTodayMenu();
        setDailyMenu(menu);
      } else if (activeTab === 'staffs') {
        if (hasPermission('staff:read')) {
          const list = await adminFetchStaffs();
          setStaffs(list);
        }
      } else if (activeTab === 'reports') {
        if (hasPermission('reports:read')) {
          const rep = await adminFetchReports();
          setReports(rep);
        }
      } else if (activeTab === 'settings') {
        const sett = await fetchSettings();
        setSettings(sett);
      }

      // Proactively populate staff count for sidebar badge if admin
      if (isAdmin && activeTab !== 'staffs' && staffs.length === 0) {
        try {
          const list = await adminFetchStaffs();
          setStaffs(list);
        } catch {
          // ignore background fetch error
        }
      }
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setErrorMessage(err.message || 'Network error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await adminLogin({ passcode });
      if (res.success) {
        sessionStorage.setItem('dbl_admin_token', res.token);
        sessionStorage.setItem('dbl_admin_role', res.user.role);
        sessionStorage.setItem('dbl_admin_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid passcode for selected role.');
    }
  };

  const handleQuickRoleLogin = async (targetRole: 'admin' | 'staff') => {
    setLoginError(null);
    const targetPasscode = targetRole === 'admin' ? 'DeraBuzor2026!Admin' : 'DeraBuzorStaff2026!';
    try {
      const res = await adminLogin({ passcode: targetPasscode });
      if (res.success) {
        sessionStorage.setItem('dbl_admin_token', res.token);
        sessionStorage.setItem('dbl_admin_role', res.user.role);
        sessionStorage.setItem('dbl_admin_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Quick demo login failed.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dbl_admin_token');
    sessionStorage.removeItem('dbl_admin_role');
    sessionStorage.removeItem('dbl_admin_user');
    setCurrentUser(null);
  };

  // Orders CRUD
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateOrder({
        customerName: newOrderCustomer,
        customerPhone: newOrderPhone,
        fulfilmentType: newOrderType,
        deliveryAddress: newOrderAddress,
        totalAmount: Number(newOrderAmount),
        paymentMethod: 'cash_on_pickup',
        paymentStatus: 'paid',
        items: [
          {
            productNameSnapshot: newOrderDishName,
            unitPrice: Number(newOrderAmount),
            quantity: 1,
            lineTotal: Number(newOrderAmount),
          }
        ]
      });
      setIsNewOrderModalOpen(false);
      setNewOrderCustomer('');
      setNewOrderPhone('');
      setNewOrderAddress('');
      setActionMessage('Manual lounge order created successfully.');
      setTimeout(() => setActionMessage(null), 3500);
      loadData();
    } catch (err: any) {
      alert(`Failed to create manual order: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (orderNumber: string) => {
    if (!window.confirm(`Permanently purge order ${orderNumber}? This action is restricted to Administrator role.`)) {
      return;
    }
    try {
      await adminDeleteOrder(orderNumber);
      setActionMessage(`Order ${orderNumber} permanently purged.`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Order deletion failed (RLS): ${err.message}`);
    }
  };

  const handleUpdateStatus = async (orderNumber: string, newStatus: OrderStatus) => {
    try {
      await adminUpdateOrderStatus(orderNumber, newStatus, undefined, currentUser?.fullName || 'Staff');
      setActionMessage(`Order ${orderNumber} updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleVerifyBankPayment = async (orderNumber: string) => {
    try {
      await adminVerifyOfflinePayment(orderNumber, currentUser?.fullName || 'Finance Ops', 'Confirmed bank transfer in GTBank statement');
      setActionMessage(`Payment for ${orderNumber} verified successfully!`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Payment verification failed: ${err.message}`);
    }
  };

  // Menu Items CRUD
  const handleCreateNewDish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateDish({
        name: newDishName,
        displayPrice: Number(newDishPrice),
        mealType: newDishMealType,
        description: newDishDescription,
        availableQuantity: Number(newDishPortions),
        imagePath: '/assets/aistudio/jollof-plate_ea4269ad.png',
      });
      setIsNewDishModalOpen(false);
      setNewDishName('');
      setNewDishDescription('');
      setActionMessage('New chef delicacy published to today’s menu!');
      setTimeout(() => setActionMessage(null), 3500);
      loadData();
    } catch (err: any) {
      alert(`Failed to create dish: ${err.message}`);
    }
  };

  const handleOpenEditDish = (item: any) => {
    setEditingItem(item);
    setEditDishName(item.product?.name || '');
    setEditDishPrice(item.displayPrice || 0);
    setEditDishPortions(item.availableQuantity || 0);
  };

  const handleSaveEditDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await adminUpdateDish(editingItem.id, {
        name: editDishName,
        displayPrice: Number(editDishPrice),
        availableQuantity: Number(editDishPortions),
      });
      setEditingItem(null);
      setActionMessage(`Dish '${editDishName}' updated successfully.`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Failed to update dish: ${err.message}`);
    }
  };

  const handleDeleteDish = async (itemId: string, dishName: string) => {
    if (!window.confirm(`Delete dish '${dishName}' from the active menu? This action is enforced by Admin RLS.`)) {
      return;
    }
    try {
      await adminDeleteDish(itemId);
      setActionMessage(`Dish '${dishName}' deleted from daily menu.`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Dish deletion failed (RLS): ${err.message}`);
    }
  };

  const handleToggleAvailability = async (itemId: string, current: boolean) => {
    try {
      await adminToggleItemAvailability(itemId, !current);
      loadData();
    } catch (err: any) {
      alert(`Failed to update item availability: ${err.message}`);
    }
  };

  const handleToggleAcceptingOrders = async () => {
    if (!settings) return;
    if (!hasPermission('settings:write')) {
      alert('Permission Denied (RLS): Staff role cannot alter kitchen intake switches.');
      return;
    }
    try {
      const nextVal = !settings.isAcceptingOrders;
      const res = await adminUpdateSettings({ isAcceptingOrders: nextVal });
      setSettings(res.settings);
    } catch (err: any) {
      alert(`Failed to update settings: ${err.message}`);
    }
  };

  const handleToggleDelivery = async () => {
    if (!settings) return;
    if (!hasPermission('settings:write')) {
      alert('Permission Denied (RLS): Staff role cannot alter dispatch settings.');
      return;
    }
    try {
      const nextVal = !settings.isDeliveryEnabled;
      const res = await adminUpdateSettings({ isDeliveryEnabled: nextVal });
      setSettings(res.settings);
    } catch (err: any) {
      alert(`Failed to update delivery settings: ${err.message}`);
    }
  };

  // Staff & Crew Management CRUD Handlers
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('staff:write')) {
      alert('Permission Denied (RLS): Only Executive Administrators can register new staff.');
      return;
    }
    try {
      const res = await adminCreateStaff({
        fullName: newStaffName,
        email: newStaffEmail,
        phone: newStaffPhone,
        role: newStaffRole,
        department: newStaffDept,
        passcode: newStaffPasscode,
      });
      setIsNewStaffModalOpen(false);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPhone('');
      setNewStaffPasscode('');
      setActionMessage(`Staff member "${res.staff.fullName}" registered successfully.`);
      setTimeout(() => setActionMessage(null), 3500);
      loadData();
    } catch (err: any) {
      alert(`Failed to create staff member: ${err.message}`);
    }
  };

  const handleOpenEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditStaffName(staff.fullName);
    setEditStaffEmail(staff.email);
    setEditStaffPhone(staff.phone);
    setEditStaffRole(staff.role);
    setEditStaffDept(staff.department);
    setEditStaffPasscode(staff.passcode);
    setEditStaffActive(staff.isActive);
    setIsEditStaffModalOpen(true);
  };

  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!hasPermission('staff:write')) {
      alert('Permission Denied (RLS): Only Executive Administrators can edit staff.');
      return;
    }
    try {
      const res = await adminUpdateStaff(editingStaff.id, {
        fullName: editStaffName,
        email: editStaffEmail,
        phone: editStaffPhone,
        role: editStaffRole,
        department: editStaffDept,
        passcode: editStaffPasscode,
        isActive: editStaffActive,
      });
      setIsEditStaffModalOpen(false);
      setEditingStaff(null);
      setActionMessage(`Staff profile for "${res.staff.fullName}" updated.`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Failed to update staff member: ${err.message}`);
    }
  };

  const handleToggleStaffStatus = async (staffId: string) => {
    if (!hasPermission('staff:write')) {
      alert('Permission Denied (RLS): Only Executive Administrators can toggle staff status.');
      return;
    }
    try {
      const res = await adminToggleStaffStatus(staffId);
      setActionMessage(`Staff status changed to ${res.staff.isActive ? 'Active' : 'Inactive'}.`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Failed to toggle staff status: ${err.message}`);
    }
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!hasPermission('staff:delete')) {
      alert('Permission Denied (RLS): Only Executive Administrators can delete staff records.');
      return;
    }
    if (!window.confirm(`Permanently remove staff member "${staffName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await adminDeleteStaff(staffId);
      setActionMessage(`Staff member "${staffName}" removed from operations.`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Staff deletion failed (RLS): ${err.message}`);
    }
  };

  const togglePasscodeVisibility = (staffId: string) => {
    setVisiblePasscodes(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  // Render Login Card
  const renderLoginCard = () => (
    <div className="p-8 max-w-md mx-auto my-auto w-full text-center bg-white rounded-3xl border border-[#EFE4BF] shadow-lg">
      <div className="w-14 h-14 rounded-2xl bg-[#FFF6D9] border border-[#EFE4BF] flex items-center justify-center mx-auto mb-4 shadow-xs">
        <ShieldCheck className="w-7 h-7 text-[#07552B]" />
      </div>

      <h3 className="font-display font-extrabold text-2xl text-[#07552B] mb-1">
        Operations Portal
      </h3>
      <p className="text-xs text-[#536353] mb-5">
        Select your authorization role to enter the Abuja management center.
      </p>

      {/* Role Picker Selector */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FFF6D9] rounded-2xl mb-5 border border-[#EFE4BF]">
        <button
          type="button"
          onClick={() => { setLoginRole('admin'); setPasscode(''); setLoginError(null); }}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            loginRole === 'admin'
              ? 'bg-[#07552B] text-white shadow-xs'
              : 'text-[#07552B] hover:text-[#F28C00]'
          }`}
        >
          Administrator
        </button>
        <button
          type="button"
          onClick={() => { setLoginRole('staff'); setPasscode(''); setLoginError(null); }}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            loginRole === 'staff'
              ? 'bg-[#07552B] text-white shadow-xs'
              : 'text-[#07552B] hover:text-[#F28C00]'
          }`}
        >
          Kitchen Staff
        </button>
      </div>

      {loginError && (
        <div className="p-3 mb-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loginError}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="password"
          required
          value={passcode}
          onChange={e => setPasscode(e.target.value)}
          placeholder={loginRole === 'admin' ? "Enter administrator passcode" : "Enter kitchen staff passcode"}
          className="w-full bg-white border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-3.5 text-xs text-[#202820] outline-none font-medium shadow-2xs"
        />

        <button
          type="submit"
          className="w-full py-3.5 bg-[#F28C00] hover:bg-[#D97D00] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors shadow-xs"
        >
          Authenticate & Enter as {loginRole === 'admin' ? 'Administrator' : 'Kitchen Staff'}
        </button>
      </form>

      {/* Quick Demo Credentials */}
      <div className="mt-6 pt-4 border-t border-[#EFE4BF] flex flex-col gap-2 text-xs">
        <span className="text-[11px] text-[#8A908A] font-mono">Quick Access Credentials:</span>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handleQuickRoleLogin('admin')}
            className="px-3 py-1.5 rounded-lg bg-[#07552B]/10 hover:bg-[#07552B]/20 text-[#07552B] font-bold text-[11px] transition-colors"
          >
            Admin Demo Login
          </button>
          <button
            type="button"
            onClick={() => handleQuickRoleLogin('staff')}
            className="px-3 py-1.5 rounded-lg bg-[#58A846]/10 hover:bg-[#58A846]/20 text-[#07552B] font-bold text-[11px] transition-colors"
          >
            Staff Demo Login
          </button>
        </div>
      </div>
    </div>
  );

  // Render Dashboard Body
  const renderDashboardBody = () => (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
      {/* DESKTOP SIDEBAR NAVIGATION (md: and up) */}
      <aside className="hidden md:flex md:w-64 flex-col bg-[#07552B] text-white shrink-0 border-r border-[#053F20] select-none justify-between">
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Sidebar Top Branding */}
          <div className="p-5 border-b border-[#053F20] flex items-center gap-3 bg-[#053F20]/40">
            <img
              src="/assets/aistudio/03-icon-logo_fd2dfbae.svg"
              alt="Dera Buzor Lounge"
              className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1 border border-white/20 shadow-xs"
            />
            <div className="min-w-0">
              <h3 className="font-display font-black text-sm text-white tracking-wide truncate">
                DERA BUZOR
              </h3>
              <span className="text-[10px] text-[#A7F3D0] font-mono tracking-wider uppercase block truncate">
                Abuja Operations
              </span>
            </div>
          </div>

          {/* User Clearance Card */}
          <div className="p-4 border-b border-[#053F20] bg-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                isAdmin ? 'bg-[#F28C00] text-white' : 'bg-[#58A846] text-white'
              }`}>
                {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                <span>{userRole.toUpperCase()}</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-[#58A846] animate-pulse" title="System Live" />
            </div>
            <p className="text-xs font-bold text-white truncate" title={currentUser?.fullName}>
              {currentUser?.fullName}
            </p>
            <span className="text-[10px] text-[#EFE4BF]/80 block font-mono mt-0.5">
              {isAdmin ? 'Full CRUD Security' : 'Kitchen & Dispatch'}
            </span>
          </div>

          {/* Vertical Navigation Links */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#F28C00] text-white shadow-xs'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PackageCheck className="w-4 h-4 shrink-0" />
                <span>Live Orders</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-black/20 text-[#A7F3D0]'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'menu'
                  ? 'bg-[#F28C00] text-white shadow-xs'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ChefHat className="w-4 h-4 shrink-0" />
                <span>Daily Menu Control</span>
              </div>
              <span className="text-[10px] font-mono text-[#A7F3D0]">
                {dailyMenu?.items?.length || 0}
              </span>
            </button>

            {/* Staff Management Tab (NEW) */}
            <button
              onClick={() => setActiveTab('staffs')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'staffs'
                  ? 'bg-[#F28C00] text-white shadow-xs'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0" />
                <span>Staff Management</span>
              </div>
              {isAdmin ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'staffs' ? 'bg-white/20 text-white' : 'bg-black/20 text-[#A7F3D0]'
                }`}>
                  {staffs.length}
                </span>
              ) : (
                <Lock className="w-3 h-3 text-[#FDE68A]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'reports'
                  ? 'bg-[#F28C00] text-white shadow-xs'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 shrink-0" />
                <span>Revenue & Reports</span>
              </div>
              {!isAdmin && <Lock className="w-3 h-3 text-[#FDE68A]" />}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#F28C00] text-white shadow-xs'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SettingsIcon className="w-4 h-4 shrink-0" />
                <span>Kitchen Switches</span>
              </div>
              {!isAdmin && <Lock className="w-3 h-3 text-[#FDE68A]" />}
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Controls */}
        <div className="p-3 border-t border-[#053F20] space-y-2 bg-[#053F20]/40">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-[#A7F3D0] block mb-1 font-mono uppercase tracking-wider">
              Role Switcher (Demo):
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => handleQuickRoleLogin('admin')}
                className={`py-1 rounded-lg transition-colors ${
                  isAdmin ? 'bg-white text-[#07552B]' : 'bg-black/20 text-white/70 hover:text-white'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleLogin('staff')}
                className={`py-1 rounded-lg transition-colors ${
                  isStaff ? 'bg-white text-[#07552B]' : 'bg-black/20 text-white/70 hover:text-white'
                }`}
              >
                Staff
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F28C00]' : ''}`} />
              <span>Sync</span>
            </button>
            {onReturnToHome && (
              <button
                onClick={onReturnToHome}
                title="Return to Public Website"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Action Flash Notifications */}
        {actionMessage && (
          <div className="bg-[#58A846] text-white text-xs font-bold px-4 py-2.5 text-center animate-in fade-in flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            <span>{actionMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="bg-[#B91C1C] text-white text-xs font-bold px-4 py-2.5 text-center animate-in fade-in flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MOBILE NAVIGATION BAR (< md) - Preserved exactly for mobile devices */}
        <div className="md:hidden flex flex-col border-b border-[#EFE4BF] bg-white">
          <div className="px-4 py-2.5 bg-[#FFFBF0] border-b border-[#EFE4BF] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono text-[10px] ${
                isAdmin ? 'bg-[#07552B] text-white' : 'bg-[#58A846] text-white'
              }`}>
                {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                <span>{userRole.toUpperCase()}</span>
              </span>
              <span className="text-[#536353] font-medium text-[11px] truncate max-w-[140px]">
                {currentUser?.fullName}
              </span>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh dashboard"
              className="p-1.5 text-[#536353] hover:text-[#07552B] hover:bg-[#FFF6D9] rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F28C00]' : ''}`} />
            </button>
          </div>

          <div className="px-4 border-b border-[#EFE4BF] flex items-center gap-2 overflow-x-auto py-2 scrollbar-none shadow-2xs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'orders' ? 'bg-[#07552B] text-white shadow-xs' : 'text-[#07552B] hover:bg-[#FFF6D9]'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'menu' ? 'bg-[#07552B] text-white shadow-xs' : 'text-[#07552B] hover:bg-[#FFF6D9]'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Menu</span>
            </button>

            <button
              onClick={() => setActiveTab('staffs')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'staffs' ? 'bg-[#07552B] text-white shadow-xs' : 'text-[#07552B] hover:bg-[#FFF6D9]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staffs</span>
              {!isAdmin && <Lock className="w-3 h-3 text-[#B45309]" />}
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'reports' ? 'bg-[#07552B] text-white shadow-xs' : 'text-[#07552B] hover:bg-[#FFF6D9]'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Reports</span>
              {!isAdmin && <Lock className="w-3 h-3 text-[#B45309]" />}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'settings' ? 'bg-[#07552B] text-white shadow-xs' : 'text-[#07552B] hover:bg-[#FFF6D9]'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Switches</span>
              {!isAdmin && <Lock className="w-3 h-3 text-[#B45309]" />}
            </button>
          </div>
        </div>

        {/* Tab Views */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FFFDF7]">
        {/* TAB 1: LIVE ORDERS CRUD */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Header & Create Order Trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {['all', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl uppercase font-bold whitespace-nowrap transition-colors ${
                      statusFilter === st
                        ? 'bg-[#07552B] text-white shadow-xs'
                        : 'bg-white text-[#536353] hover:bg-[#FFFDF2] border border-[#EFE4BF]'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              {/* Admin Create Manual Order Action */}
              {isAdmin ? (
                <button
                  onClick={() => setIsNewOrderModalOpen(true)}
                  className="px-4 py-2 bg-[#F28C00] hover:bg-[#D97D00] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manual Lounge Order</span>
                </button>
              ) : (
                <div className="text-[11px] text-[#536353] font-mono flex items-center gap-1 bg-[#FFF6D9] px-3 py-1 rounded-lg border border-[#EFE4BF]">
                  <Lock className="w-3 h-3 text-[#B45309]" />
                  <span>Order Creation Locked to Admin (RLS)</span>
                </div>
              )}
            </div>

            {/* Orders List */}
            <div className="space-y-3.5">
              {orders
                .filter(o => statusFilter === 'all' || o.orderStatus === statusFilter)
                .map(order => (
                  <div
                    key={order.id}
                    className="p-5 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F4EAC4] pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-sm text-[#07552B]">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-[#536353] font-bold">
                          {order.customerName} ({order.customerPhone})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono ${
                          order.paymentStatus === 'paid'
                            ? 'bg-[#E7F6EA] text-[#07552B] border border-[#BFE3C7]'
                            : 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                        }`}>
                          Payment: {order.paymentStatus} ({order.paymentMethod})
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono bg-[#FFF6D9] text-[#07552B] border border-[#EFE4BF]">
                          Status: {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Items and Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="md:col-span-2 space-y-1">
                        <span className="text-[#8A908A] block text-[11px] font-bold font-mono">Dishes:</span>
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="text-[#202820]">
                            • <span className="font-bold text-[#07552B]">{item.quantity}x</span> {item.productNameSnapshot}
                            {item.itemNotes && <span className="text-[#536353] italic ml-1">("{item.itemNotes}")</span>}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[#07552B] font-bold">
                          {order.fulfilmentType === 'delivery' ? (
                            <Truck className="w-3.5 h-3.5 text-[#58A846]" />
                          ) : (
                            <Store className="w-3.5 h-3.5 text-[#58A846]" />
                          )}
                          <span className="capitalize">{order.fulfilmentType}</span>
                        </div>
                        {order.deliveryAddress && (
                          <p className="text-[11px] text-[#536353] leading-tight">
                            {order.deliveryAddress}
                          </p>
                        )}
                        {order.scheduledFor ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#07552B] bg-[#FFF6D9] border border-[#EFE4BF] px-2.5 py-1 rounded-lg font-mono font-bold mt-1">
                            <Calendar className="w-3.5 h-3.5 text-[#F28C00] shrink-0" />
                            <span>Sched: {order.scheduledFor}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8A908A] font-mono block mt-0.5">Immediate (ASAP)</span>
                        )}
                        <p className="font-mono font-black text-sm text-[#07552B] pt-1">
                          Total: ₦{order.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons for Kitchen Workflow & CRUD */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F4EAC4]">
                      <div className="flex flex-wrap items-center gap-2">
                        {order.orderStatus === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(order.orderNumber, 'confirmed')}
                            className="px-3 py-1.5 bg-[#07552B] hover:bg-[#054020] text-xs font-bold rounded-xl text-white shadow-2xs"
                          >
                            Confirm Order
                          </button>
                        )}
                        {(order.orderStatus === 'confirmed' || order.orderStatus === 'pending') && (
                          <button
                            onClick={() => handleUpdateStatus(order.orderNumber, 'preparing')}
                            className="px-3 py-1.5 bg-[#F28C00] hover:bg-[#D97D00] text-xs font-bold rounded-xl text-white shadow-2xs"
                          >
                            Start Kitchen Prep
                          </button>
                        )}
                        {order.orderStatus === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(
                              order.orderNumber,
                              order.fulfilmentType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup'
                            )}
                            className="px-3 py-1.5 bg-[#58A846] hover:bg-[#468637] text-xs font-bold rounded-xl text-white shadow-2xs"
                          >
                            {order.fulfilmentType === 'delivery' ? 'Dispatch Rider' : 'Mark Ready at Bar'}
                          </button>
                        )}
                        {(order.orderStatus === 'ready_for_pickup' || order.orderStatus === 'out_for_delivery') && (
                          <button
                            onClick={() => handleUpdateStatus(order.orderNumber, 'completed')}
                            className="px-3 py-1.5 bg-[#07552B] hover:bg-[#054020] text-xs font-bold rounded-xl text-white shadow-2xs"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Bank Transfer Offline Verification (Admin Only) */}
                        {order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending' && (
                          isAdmin ? (
                            <button
                              onClick={() => handleVerifyBankPayment(order.orderNumber)}
                              className="px-3.5 py-1.5 bg-[#58A846] hover:bg-[#468637] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Verify Bank Transfer</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#B45309] font-mono bg-[#FEF3C7] px-2.5 py-1 rounded-lg border border-[#FDE68A]">
                              Bank Verification (Admin Only)
                            </span>
                          )
                        )}

                        {/* Order Deletion (Admin Only - RLS Enforced) */}
                        {isAdmin ? (
                          <button
                            onClick={() => handleDeleteOrder(order.orderNumber)}
                            title="Delete order permanently"
                            className="p-1.5 text-[#B91C1C] hover:bg-[#FEF2F2] rounded-lg transition-colors border border-transparent hover:border-[#FECACA]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span title="Order Deletion restricted to Admin (RLS)">
                            <Trash2 className="w-4 h-4 text-gray-300 cursor-not-allowed" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 2: DAILY MENU CONTROL & DISHES CRUD */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs">
              <div>
                <h4 className="font-display font-extrabold text-base text-[#07552B]">Daily Menu Status</h4>
                <p className="text-xs text-[#536353]">
                  Active Business Date: {dailyMenu?.menuDate} · Status: <span className="text-[#58A846] font-bold uppercase">{dailyMenu?.status}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button
                    onClick={() => setIsNewDishModalOpen(true)}
                    className="px-4 py-2.5 bg-[#07552B] hover:bg-[#054020] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Dish</span>
                  </button>
                )}

                {isAdmin ? (
                  <button
                    onClick={async () => {
                      const newStatus = dailyMenu?.status === 'published' ? 'draft' : 'published';
                      await adminPublishMenu({ status: newStatus });
                      loadData();
                    }}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                      dailyMenu?.status === 'published'
                        ? 'bg-white border border-[#B91C1C] text-[#B91C1C] hover:bg-[#FEF2F2]'
                        : 'bg-[#F28C00] text-white hover:bg-[#D97D00]'
                    }`}
                  >
                    {dailyMenu?.status === 'published' ? 'Unpublish Menu' : "Publish Today's Menu"}
                  </button>
                ) : (
                  <span className="text-xs font-mono text-[#536353] bg-[#FFF6D9] px-3 py-1.5 rounded-xl border border-[#EFE4BF]">
                    Menu Publishing (Admin Only)
                  </span>
                )}
              </div>
            </div>

            {/* Dishes Stock Toggle & CRUD List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase font-bold text-[#07552B] tracking-wider font-mono">
                  Dishes & Portions Control ({dailyMenu?.items?.length || 0})
                </h4>
                <span className="text-[11px] text-[#536353] font-mono">
                  Staff & Admin: Real-Time Availability · Admin: Full CRUD
                </span>
              </div>

              {(dailyMenu?.items || []).map(item => (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product?.imagePath}
                      alt=""
                      className="w-12 h-12 object-contain rounded-xl bg-[#FFFBF0] p-1 border border-[#EFE4BF]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-sm text-[#07552B]">{item.product?.name}</h5>
                        {item.product?.mealType && (
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-[#FFF6D9] text-[#07552B] font-bold border border-[#EFE4BF]">
                            {item.product.mealType}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-[#536353] tabular-nums font-semibold">
                        ₦{item.displayPrice.toLocaleString()} · Remaining: {item.availableQuantity} portions
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* In-Stock / Sold-Out Toggle (Staff & Admin) */}
                    <button
                      onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        item.isAvailable
                          ? 'bg-[#E7F6EA] text-[#07552B] border border-[#BFE3C7] hover:bg-[#D4EED7]'
                          : 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] hover:bg-[#FEE2E2]'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : 'Marked Sold Out'}
                    </button>

                    {/* Admin Edit Dish Modal */}
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenEditDish(item)}
                        title="Edit dish details"
                        className="p-2 text-[#07552B] hover:bg-[#FFF6D9] rounded-xl border border-[#EFE4BF]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Admin Delete Dish (RLS) */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteDish(item.id, item.product?.name || 'Dish')}
                        title="Delete dish from menu"
                        className="p-2 text-[#B91C1C] hover:bg-[#FEF2F2] rounded-xl border border-[#FECACA]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: REPORTS (Admin Only - RLS Enforced) */}
        {activeTab === 'reports' && (
          !hasPermission('reports:read') ? (
            <div className="p-12 bg-white rounded-3xl border border-[#EFE4BF] text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto text-[#B91C1C]">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="font-display font-extrabold text-lg text-[#07552B]">
                Financial Reports Restricted
              </h4>
              <p className="text-xs text-[#536353] leading-relaxed">
                Row Level Security (RLS) restricts access to daily revenue, sales analytics, and accounting reports to Executive Administrator and Manager roles.
              </p>
            </div>
          ) : reports && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs">
                  <span className="text-xs text-[#8A908A] block font-semibold font-mono">Today's Revenue</span>
                  <span className="font-mono text-2xl font-black text-[#07552B] tabular-nums">
                    ₦{reports.todayRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="p-5 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs">
                  <span className="text-xs text-[#8A908A] block font-semibold font-mono">Today's Orders</span>
                  <span className="font-mono text-2xl font-black text-[#F28C00] tabular-nums">
                    {reports.todayOrdersCount}
                  </span>
                </div>
                <div className="p-5 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs">
                  <span className="text-xs text-[#8A908A] block font-semibold font-mono">In Kitchen / Preparing</span>
                  <span className="font-mono text-2xl font-black text-[#07552B] tabular-nums">
                    {reports.countsByStatus.preparing}
                  </span>
                </div>
                <div className="p-5 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs">
                  <span className="text-xs text-[#8A908A] block font-semibold font-mono">Total Orders All-Time</span>
                  <span className="font-mono text-2xl font-black text-[#202820] tabular-nums">
                    {reports.totalAllTimeOrders}
                  </span>
                </div>
              </div>

              {/* Top Selling Dishes */}
              <div className="p-6 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs">
                <h4 className="font-display font-extrabold text-base text-[#07552B] mb-3">Top Selling Delicacies Today</h4>
                <div className="space-y-2">
                  {reports.topSellingItems.map((dish: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-2.5 border-b border-[#F4EAC4] last:border-0">
                      <span className="text-[#202820] font-bold">{dish.name}</span>
                      <span className="font-mono text-[#07552B] font-extrabold">
                        {dish.quantity} orders · ₦{dish.revenue.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            {!isAdmin && (
              <div className="p-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl text-xs text-[#B45309] font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Read-Only Mode: Settings adjustments and bank details modification require Administrator privileges.</span>
              </div>
            )}

            {settings && (
              <>
                <div className="p-6 bg-white rounded-2xl border border-[#EFE4BF] space-y-4 shadow-xs">
                  <h4 className="font-display font-extrabold text-base text-[#07552B]">Kitchen Operations Switches</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#202820] block">Accept New Orders</span>
                      <span className="text-[11px] text-[#536353]">Allows customers to submit checkout online</span>
                    </div>
                    <button
                      onClick={handleToggleAcceptingOrders}
                      disabled={!isAdmin}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        settings.isAcceptingOrders ? 'bg-[#58A846] text-white' : 'bg-[#B91C1C] text-white'
                      } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {settings.isAcceptingOrders ? 'Active (Open)' : 'Paused (Closed)'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#F4EAC4]">
                    <div>
                      <span className="text-xs font-bold text-[#202820] block">Abuja Delivery Fulfilment</span>
                      <span className="text-[11px] text-[#536353]">Toggle rider delivery service</span>
                    </div>
                    <button
                      onClick={handleToggleDelivery}
                      disabled={!isAdmin}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        settings.isDeliveryEnabled ? 'bg-[#58A846] text-white' : 'bg-[#B91C1C] text-white'
                      } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {settings.isDeliveryEnabled ? 'Active' : 'Suspended'}
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-[#EFE4BF] text-xs space-y-2 shadow-xs">
                  <h4 className="font-display font-extrabold text-base text-[#07552B] mb-2">Registered Bank Details</h4>
                  <p><span className="text-[#536353] font-medium">Bank:</span> {settings.bankName}</p>
                  <p><span className="text-[#536353] font-medium">Account Name:</span> {settings.bankAccountName}</p>
                  <p className="font-mono text-sm font-bold text-[#07552B]"><span className="text-[#536353] font-normal text-xs font-sans">Account No:</span> {settings.bankAccountNumber}</p>
                  <p><span className="text-[#536353] font-medium">WhatsApp Business:</span> {settings.whatsappNumber}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 5: STAFF & CREW MANAGEMENT CRUD (ADMIN ONLY) */}
        {activeTab === 'staffs' && (
          <div className="space-y-6">
            {!isAdmin ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-[#EFE4BF] shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto text-[#B91C1C]">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-display font-black text-lg text-[#07552B]">
                  Access Denied (Row Level Security Enforced)
                </h3>
                <p className="text-xs text-[#536353] max-w-md mx-auto">
                  Staff Management is strictly restricted to Executive Administrators. Kitchen staff roles cannot create, view, or alter staff access credentials.
                </p>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-4 py-2 bg-[#07552B] text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Return to Live Orders
                </button>
              </div>
            ) : (
              <>
                {/* Header & Add Staff Trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#EFE4BF] shadow-xs">
                  <div>
                    <h3 className="font-display font-black text-lg text-[#07552B]">
                      Staff & Kitchen Crew Management
                    </h3>
                    <p className="text-xs text-[#536353]">
                      Register, assign departments, and configure security passcodes for Abuja operations teams.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setNewStaffName('');
                      setNewStaffEmail('');
                      setNewStaffPhone('');
                      setNewStaffRole('staff');
                      setNewStaffDept('Kitchen');
                      setNewStaffPasscode(`Dera${Math.floor(1000 + Math.random() * 9000)}!`);
                      setIsNewStaffModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-[#F28C00] hover:bg-[#D97D00] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap self-start sm:self-auto shrink-0 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add New Staff Member</span>
                  </button>
                </div>

                {/* Operational Staff Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs">
                    <span className="text-[11px] font-mono text-[#536353] block uppercase tracking-wider">
                      Total Staff
                    </span>
                    <span className="text-2xl font-black font-display text-[#07552B] mt-1 block">
                      {staffs.length}
                    </span>
                    <span className="text-[10px] text-[#58A846] font-medium flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#58A846]" />
                      Full Operations Team
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs">
                    <span className="text-[11px] font-mono text-[#536353] block uppercase tracking-wider">
                      Kitchen Crew
                    </span>
                    <span className="text-2xl font-black font-display text-[#F28C00] mt-1 block">
                      {staffs.filter(s => s.department === 'Kitchen').length}
                    </span>
                    <span className="text-[10px] text-[#536353] font-medium mt-1 block">
                      Chefs & Prep Line
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs">
                    <span className="text-[11px] font-mono text-[#536353] block uppercase tracking-wider">
                      Central Dispatch
                    </span>
                    <span className="text-2xl font-black font-display text-[#07552B] mt-1 block">
                      {staffs.filter(s => s.department === 'Dispatch').length}
                    </span>
                    <span className="text-[10px] text-[#536353] font-medium mt-1 block">
                      Abuja Delivery Logistics
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs">
                    <span className="text-[11px] font-mono text-[#536353] block uppercase tracking-wider">
                      Active On Duty
                    </span>
                    <span className="text-2xl font-black font-display text-[#58A846] mt-1 block">
                      {staffs.filter(s => s.isActive).length}
                    </span>
                    <span className="text-[10px] text-[#58A846] font-medium flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#58A846] animate-pulse" />
                      Ready to take orders
                    </span>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EFE4BF]">
                  {/* Department Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                    {(['all', 'Kitchen', 'Dispatch', 'Bar & Lounge', 'Floor & Counter'] as const).map(dept => (
                      <button
                        key={dept}
                        onClick={() => setStaffDeptFilter(dept)}
                        className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                          staffDeptFilter === dept
                            ? 'bg-[#07552B] text-white shadow-xs'
                            : 'bg-[#FFF6D9] text-[#07552B] hover:bg-[#FDEBA6] border border-[#EFE4BF]'
                        }`}
                      >
                        {dept === 'all' ? 'All Departments' : dept}
                        <span className="ml-1.5 text-[10px] opacity-80 font-mono">
                          ({dept === 'all' ? staffs.length : staffs.filter(s => s.department === dept).length})
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A908A]" />
                    <input
                      type="text"
                      value={staffSearchQuery}
                      onChange={e => setStaffSearchQuery(e.target.value)}
                      placeholder="Search name, phone, email..."
                      className="w-full bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Staff Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staffs
                    .filter(s => staffDeptFilter === 'all' || s.department === staffDeptFilter)
                    .filter(s => {
                      if (!staffSearchQuery.trim()) return true;
                      const q = staffSearchQuery.toLowerCase();
                      return (
                        s.fullName.toLowerCase().includes(q) ||
                        s.email.toLowerCase().includes(q) ||
                        s.phone.includes(q) ||
                        s.department.toLowerCase().includes(q)
                      );
                    })
                    .map(staff => {
                      const isPasscodeShown = Boolean(visiblePasscodes[staff.id]);
                      return (
                        <div
                          key={staff.id}
                          className={`p-5 rounded-2xl border transition-all bg-white shadow-xs space-y-4 ${
                            staff.isActive ? 'border-[#EFE4BF]' : 'border-[#FECACA] bg-[#FEF2F2]/30 opacity-80'
                          }`}
                        >
                          {/* Staff Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-sm shrink-0 border ${
                                staff.department === 'Kitchen'
                                  ? 'bg-[#FFF6D9] text-[#F28C00] border-[#FDE68A]'
                                  : staff.department === 'Dispatch'
                                  ? 'bg-[#E7F6EA] text-[#07552B] border-[#BFE3C7]'
                                  : staff.department === 'Bar & Lounge'
                                  ? 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]'
                                  : 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                              }`}>
                                {staff.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-display font-black text-sm text-[#07552B] truncate">
                                  {staff.fullName}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono ${
                                    staff.role === 'manager'
                                      ? 'bg-[#07552B] text-white'
                                      : 'bg-[#FFF6D9] text-[#07552B] border border-[#EFE4BF]'
                                  }`}>
                                    {staff.role}
                                  </span>
                                  <span className="text-[10px] font-semibold text-[#536353]">
                                    {staff.department}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status Pill */}
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-mono flex items-center gap-1 shrink-0 ${
                              staff.isActive
                                ? 'bg-[#E7F6EA] text-[#07552B] border border-[#BFE3C7]'
                                : 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${staff.isActive ? 'bg-[#58A846]' : 'bg-[#9CA3AF]'}`} />
                              <span>{staff.isActive ? 'Active' : 'Inactive'}</span>
                            </span>
                          </div>

                          {/* Contact & Passcode Info */}
                          <div className="p-3 bg-[#FFFBF0] rounded-xl border border-[#EFE4BF] space-y-2 text-xs">
                            <div className="flex items-center justify-between text-[#536353]">
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[#07552B]" />
                                <span>{staff.phone}</span>
                              </span>
                              <span className="flex items-center gap-1.5 truncate max-w-[160px]" title={staff.email}>
                                <Mail className="w-3.5 h-3.5 text-[#07552B]" />
                                <span className="truncate">{staff.email}</span>
                              </span>
                            </div>

                            {/* Passcode Row */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#EFE4BF]/80">
                              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                                <Key className="w-3.5 h-3.5 text-[#F28C00]" />
                                <span className="text-[#8A908A]">PIN:</span>
                                <span className="font-bold text-[#07552B]">
                                  {isPasscodeShown ? staff.passcode : '••••••••'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => togglePasscodeVisibility(staff.id)}
                                  className="p-1 text-[#536353] hover:text-[#07552B] hover:bg-white rounded transition-colors"
                                  title={isPasscodeShown ? 'Hide Passcode' : 'Show Passcode'}
                                >
                                  {isPasscodeShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(staff.passcode);
                                    setActionMessage(`Copied passcode for ${staff.fullName}`);
                                    setTimeout(() => setActionMessage(null), 2500);
                                  }}
                                  className="p-1 text-[#536353] hover:text-[#07552B] hover:bg-white rounded transition-colors"
                                  title="Copy Passcode"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F4EAC4]">
                            <button
                              type="button"
                              onClick={() => handleToggleStaffStatus(staff.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                staff.isActive
                                  ? 'bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C]'
                                  : 'bg-[#E7F6EA] hover:bg-[#D1F2D9] text-[#07552B]'
                              }`}
                            >
                              {staff.isActive ? 'Deactivate' : 'Activate'}
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditStaff(staff)}
                                className="px-3 py-1.5 rounded-lg bg-[#FFF6D9] hover:bg-[#FDEBA6] text-[#07552B] font-bold text-xs flex items-center gap-1 border border-[#EFE4BF] transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(staff.id, staff.fullName)}
                                className="p-1.5 rounded-lg bg-white hover:bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] transition-colors"
                                title="Remove staff member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* CREATE MANUAL ORDER MODAL (ADMIN ONLY) */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#EFE4BF] p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE4BF] pb-3">
              <h3 className="font-display font-extrabold text-lg text-[#07552B]">
                Create Manual Lounge Order
              </h3>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1 rounded-full text-[#536353] hover:bg-[#FFF6D9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#536353] font-bold mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newOrderCustomer}
                  onChange={e => setNewOrderCustomer(e.target.value)}
                  placeholder="e.g. Chief Emeka Adeleke"
                  className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[#536353] font-bold mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newOrderPhone}
                  onChange={e => setNewOrderPhone(e.target.value)}
                  placeholder="e.g. 0803 123 4567"
                  className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#536353] font-bold mb-1">Fulfilment Type</label>
                  <select
                    value={newOrderType}
                    onChange={e => setNewOrderType(e.target.value as any)}
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                  >
                    <option value="pickup">Dine-In / Bar Pickup</option>
                    <option value="delivery">Abuja Dispatch Rider</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#536353] font-bold mb-1">Total Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    value={newOrderAmount}
                    onChange={e => setNewOrderAmount(Number(e.target.value))}
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>
              </div>

              {newOrderType === 'delivery' && (
                <div>
                  <label className="block text-[#536353] font-bold mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    required
                    value={newOrderAddress}
                    onChange={e => setNewOrderAddress(e.target.value)}
                    placeholder="e.g. Plot 12 Adetokunbo Ademola Crescent, Wuse 2"
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#536353] font-bold mb-1">Dish / Delicacy Description</label>
                <input
                  type="text"
                  value={newOrderDishName}
                  onChange={e => setNewOrderDishName(e.target.value)}
                  placeholder="e.g. 2x Smokey Jollof + Plantain + Chicken"
                  className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE4BF]">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#536353] hover:bg-[#FFF6D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F28C00] hover:bg-[#D97D00] text-white font-bold rounded-xl shadow-xs"
                >
                  Record Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW DISH MODAL (ADMIN ONLY) */}
      {isNewDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#EFE4BF] p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE4BF] pb-3">
              <h3 className="font-display font-extrabold text-lg text-[#07552B]">
                Add New Dish to Today’s Menu
              </h3>
              <button
                onClick={() => setIsNewDishModalOpen(false)}
                className="p-1 rounded-full text-[#536353] hover:bg-[#FFF6D9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewDish} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#536353] font-bold mb-1">Delicacy Name *</label>
                <input
                  type="text"
                  required
                  value={newDishName}
                  onChange={e => setNewDishName(e.target.value)}
                  placeholder="e.g. Native Fisherman Soup & Catfish"
                  className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#536353] font-bold mb-1">Price in NGN (₦) *</label>
                  <input
                    type="number"
                    required
                    value={newDishPrice}
                    onChange={e => setNewDishPrice(Number(e.target.value))}
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[#536353] font-bold mb-1">Category / Meal Type</label>
                  <select
                    value={newDishMealType}
                    onChange={e => setNewDishMealType(e.target.value)}
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                  >
                    <option value="soups">Soups</option>
                    <option value="swallows">Swallows</option>
                    <option value="rice-mains">Rice & Mains</option>
                    <option value="small-chops">Small Chops & Grills</option>
                    <option value="drinks">Drinks & Chillers</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#536353] font-bold mb-1">Portions Prepared *</label>
                <input
                  type="number"
                  required
                  value={newDishPortions}
                  onChange={e => setNewDishPortions(Number(e.target.value))}
                  className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[#536353] font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDishDescription}
                  onChange={e => setNewDishDescription(e.target.value)}
                  placeholder="Aromatic native spices, slow simmered with river catfish and fresh herbs..."
                  className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE4BF]">
                <button
                  type="button"
                  onClick={() => setIsNewDishModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#536353] hover:bg-[#FFF6D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#07552B] hover:bg-[#054020] text-white font-bold rounded-xl shadow-xs"
                >
                  Publish Delicacy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DISH MODAL (ADMIN ONLY) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#EFE4BF] p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE4BF] pb-3">
              <h3 className="font-display font-extrabold text-lg text-[#07552B]">
                Edit Menu Item
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-full text-[#536353] hover:bg-[#FFF6D9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDish} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#536353] font-bold mb-1">Delicacy Title</label>
                <input
                  type="text"
                  required
                  value={editDishName}
                  onChange={e => setEditDishName(e.target.value)}
                  className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#536353] font-bold mb-1">Display Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={editDishPrice}
                    onChange={e => setEditDishPrice(Number(e.target.value))}
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[#536353] font-bold mb-1">Available Portions</label>
                  <input
                    type="number"
                    required
                    value={editDishPortions}
                    onChange={e => setEditDishPortions(Number(e.target.value))}
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE4BF]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-[#536353] hover:bg-[#FFF6D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#07552B] hover:bg-[#054020] text-white font-bold rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER NEW STAFF MODAL (ADMIN ONLY) */}
      {isNewStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#EFE4BF] p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE4BF] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF6D9] text-[#F28C00] flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-display font-extrabold text-lg text-[#07552B]">
                  Register New Staff Member
                </h3>
              </div>
              <button
                onClick={() => setIsNewStaffModalOpen(false)}
                className="p-1 rounded-full text-[#536353] hover:bg-[#FFF6D9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#536353] font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                  placeholder="e.g. Chef Chukwuma Okafor"
                  className="w-full bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#536353] font-bold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newStaffPhone}
                    onChange={e => setNewStaffPhone(e.target.value)}
                    placeholder="e.g. 0802 345 6789"
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[#536353] font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={e => setNewStaffEmail(e.target.value)}
                    placeholder="e.g. chukwuma@derabuzorlounge.com"
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#536353] font-bold mb-1">Department *</label>
                  <select
                    value={newStaffDept}
                    onChange={e => setNewStaffDept(e.target.value as StaffDepartment)}
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-2.5 outline-none font-medium"
                  >
                    <option value="Kitchen">Kitchen & Prep</option>
                    <option value="Dispatch">Central Dispatch & Logistics</option>
                    <option value="Bar & Lounge">Bar & Lounge</option>
                    <option value="Floor & Counter">Floor & Cashier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#536353] font-bold mb-1">Authorization Role *</label>
                  <select
                    value={newStaffRole}
                    onChange={e => setNewStaffRole(e.target.value as UserRole)}
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-2.5 outline-none font-medium"
                  >
                    <option value="staff">Staff (Orders & Menu Availability)</option>
                    <option value="manager">Manager (Advanced Operations)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#536353] font-bold mb-1">Security Access Passcode / PIN *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newStaffPasscode}
                    onChange={e => setNewStaffPasscode(e.target.value)}
                    placeholder="e.g. DeraStaff2026!"
                    className="flex-1 bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-2.5 outline-none font-mono font-bold text-[#07552B]"
                  />
                  <button
                    type="button"
                    onClick={() => setNewStaffPasscode(`Dera${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="px-3 py-2 bg-[#FFF6D9] text-[#07552B] font-bold text-xs rounded-xl border border-[#EFE4BF] hover:bg-[#FDEBA6] transition-colors"
                  >
                    Generate
                  </button>
                </div>
                <span className="text-[10px] text-[#8A908A] mt-1 block">
                  Staff member will enter this code on the /staff login screen to authenticate.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE4BF]">
                <button
                  type="button"
                  onClick={() => setIsNewStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#536353] hover:bg-[#FFF6D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F28C00] hover:bg-[#D97D00] text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL (ADMIN ONLY) */}
      {isEditStaffModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#EFE4BF] p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE4BF] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF6D9] text-[#07552B] flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-display font-extrabold text-lg text-[#07552B]">
                  Edit Staff Profile
                </h3>
              </div>
              <button
                onClick={() => { setIsEditStaffModalOpen(false); setEditingStaff(null); }}
                className="p-1 rounded-full text-[#536353] hover:bg-[#FFF6D9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#536353] font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editStaffName}
                  onChange={e => setEditStaffName(e.target.value)}
                  className="w-full bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#536353] font-bold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editStaffPhone}
                    onChange={e => setEditStaffPhone(e.target.value)}
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[#536353] font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editStaffEmail}
                    onChange={e => setEditStaffEmail(e.target.value)}
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#536353] font-bold mb-1">Department</label>
                  <select
                    value={editStaffDept}
                    onChange={e => setEditStaffDept(e.target.value as StaffDepartment)}
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-2.5 outline-none font-medium"
                  >
                    <option value="Kitchen">Kitchen & Prep</option>
                    <option value="Dispatch">Central Dispatch & Logistics</option>
                    <option value="Bar & Lounge">Bar & Lounge</option>
                    <option value="Floor & Counter">Floor & Cashier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#536353] font-bold mb-1">Authorization Role</label>
                  <select
                    value={editStaffRole}
                    onChange={e => setEditStaffRole(e.target.value as UserRole)}
                    className="w-full bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-2.5 outline-none font-medium"
                  >
                    <option value="staff">Staff (Orders & Menu)</option>
                    <option value="manager">Manager (Advanced)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#536353] font-bold mb-1">Security Access Passcode</label>
                <input
                  type="text"
                  required
                  value={editStaffPasscode}
                  onChange={e => setEditStaffPasscode(e.target.value)}
                  className="w-full bg-[#FFFBF0] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-2.5 outline-none font-mono font-bold text-[#07552B]"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#FFFBF0] rounded-xl border border-[#EFE4BF]">
                <div>
                  <span className="text-xs font-bold text-[#202820] block">Account Status</span>
                  <span className="text-[10px] text-[#536353]">Active accounts can authenticate at the kitchen console</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditStaffActive(!editStaffActive)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    editStaffActive ? 'bg-[#58A846] text-white' : 'bg-[#B91C1C] text-white'
                  }`}
                >
                  {editStaffActive ? 'Active' : 'Deactivated'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE4BF]">
                <button
                  type="button"
                  onClick={() => { setIsEditStaffModalOpen(false); setEditingStaff(null); }}
                  className="px-4 py-2 rounded-xl text-[#536353] hover:bg-[#FFF6D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#07552B] hover:bg-[#054020] text-white font-bold rounded-xl shadow-xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );

  // Standalone Full-Page Portal (for /admin or /staff)
  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-[#FFF6D9] text-[#202820] flex flex-col font-sans selection:bg-[#F28C00] selection:text-white animate-page-enter">
        <header className="sticky top-0 z-40 bg-white border-b border-[#EFE4BF] shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/01-primary-logo_acba5e67.svg"
                alt="Dera Buzor Lounge"
                className="h-10 sm:h-11 w-auto object-contain"
              />
              <div className="hidden sm:block border-l border-[#EFE4BF] pl-3 ml-1">
                <span className="text-xs font-bold text-[#07552B] tracking-wide block uppercase font-mono">
                  {isAuthenticated ? (isAdmin ? 'Executive Administration Portal' : 'Kitchen Staff Operations Portal') : 'Staff & Operations Access'}
                </span>
                <span className="text-[11px] text-[#536353]">
                  Abuja Lounge & Kitchen · West Africa Time (WAT)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onReturnToHome && (
                <button
                  onClick={onReturnToHome}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFF6D9] hover:bg-[#FDEBA6] text-[#07552B] text-xs font-bold transition-colors border border-[#EFE4BF]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Public Website</span>
                </button>
              )}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  title="Sign out of operations"
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] text-xs font-bold transition-colors border border-[#FECACA]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          {!isAuthenticated ? (
            <div className="my-auto py-12">
              {renderLoginCard()}
            </div>
          ) : (
            <div className="flex-1 flex flex-col bg-white rounded-3xl border border-[#EFE4BF] shadow-md overflow-hidden min-h-[600px]">
              {renderDashboardBody()}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (!isOpen) return null;

  // Modal Container Fallback
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-[#FFF6D9] border border-[#EFE4BF] rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col text-[#202820]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 bg-white border-b border-[#EFE4BF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/03-icon-logo_fd2dfbae.svg"
              alt="Dera Buzor Lounge"
              className="w-10 h-10 rounded-xl object-contain shadow-xs"
            />
            <div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#07552B]">
                Restaurant Administration & Kitchen Hub
              </h2>
              <span className="text-[11px] text-[#536353] font-mono">
                West Africa Time (WAT) · Dera Buzor Lounge Abuja Operations
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FFF6D9] hover:bg-[#FDEBA6] text-[#202820] flex items-center justify-center border border-[#EFE4BF]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto my-auto w-full text-center">
            {renderLoginCard()}
          </div>
        ) : (
          renderDashboardBody()
        )}
      </div>
    </div>
  );
};
