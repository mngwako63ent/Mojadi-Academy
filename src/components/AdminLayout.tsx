import React from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  CreditCard, 
  Image as ImageIcon, 
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Bell,
  Globe,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useFeedback } from './FeedbackContext';
import { cn } from '../lib/utils';

const AdminLayout = () => {
  const { userProfile, signOut } = useAuth();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Close sidebar on navigation (mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: BookOpen, label: 'Courses', path: '/admin/courses' },
    { icon: Users, label: 'Students', path: '/admin/students' },
    { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
    { icon: ImageIcon, label: 'Media Library', path: '/admin/media' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans relative overflow-x-hidden">
      {/* Sidebar Backdrop (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 flex flex-col z-50 transition-transform duration-300 lg:sticky lg:translate-x-0 h-screen",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h1 className="font-display font-black text-primary tracking-tighter">MOJADI</h1>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest leading-none">Admin CMS</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                to="/" 
                className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-white rounded-xl transition-all group lg:block"
                title="View Website"
              >
                <Globe size={18} />
              </Link>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all lg:hidden"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-grow px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => cn(
                "flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </div>
              <ChevronRight size={16} className={cn("transition-transform", "group-hover:translate-x-1")} />
            </NavLink>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="p-6 rounded-[2rem] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {userProfile?.displayName?.[0] || 'A'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{userProfile?.displayName || 'Admin'}</p>
                <p className="text-[10px] text-slate-500 truncate">{userProfile?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto w-full">
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-500 transition-all"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg md:text-xl font-display font-bold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-none">
              {navItems.find(i => location.pathname === i.path)?.label || 'Overview'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Link 
               to="/" 
               className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-white dark:hover:text-white rounded-xl transition-all group font-bold text-xs text-slate-600 dark:text-slate-300"
            >
               <Globe size={16} />
               <span>View Website</span>
            </Link>
            <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-white/10 mx-1" />
            <button onClick={() => toast('No new notifications', 'info')} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 relative hover:bg-slate-200 transition-all">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-white dark:border-slate-900" />
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold">Status</p>
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest leading-none mt-0.5">Healthy</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
