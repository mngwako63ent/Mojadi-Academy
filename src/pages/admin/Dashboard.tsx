import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  CreditCard, 
  Award, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { cn, formatPrice } from '../../lib/utils';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    activeLearners: 0
  });
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time stats listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(d => d.data());
      const totalRev = users.reduce((acc, u) => acc + (u.totalSpent || 0), 0);
      const active = users.filter(u => u.isOnline).length;
      
      setStats(prev => ({
        ...prev,
        totalStudents: snapshot.size,
        totalRevenue: totalRev,
        activeLearners: active
      }));

      // Generate activity from users
      const userActivity = snapshot.docs
        .filter(d => d.data().lastSeen)
        .map(d => ({
           id: `user-${d.id}`,
           type: 'enrollment',
           user: d.data().displayName || d.data().email,
           action: d.data().isOnline ? 'is exploring' : 'was active',
           time: d.data().lastSeen?.toDate() || new Date(),
           status: 'success'
        }));
      
      setRecentActions(prev => {
        const otherActions = prev.filter(a => !a.id.startsWith('user-'));
        return [...otherActions, ...userActivity].sort((a, b) => b.time - a.time).slice(0, 8);
      });
    });

    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      setStats(prev => ({ ...prev, totalCourses: snapshot.size }));
    });

    const unsubPayments = onSnapshot(collection(db, 'payment_receipts'), (snapshot) => {
      const pending = snapshot.docs.filter(d => d.data().status === 'pending').length;
      setStats(prev => ({ ...prev, pendingPayments: pending }));

      const paymentActivity = snapshot.docs.map(d => ({
        id: `pay-${d.id}`,
        type: 'payment',
        user: d.data().userName || 'Student',
        action: `Uploaded proof for ${d.data().courseTitle}`,
        time: d.data().createdAt?.toDate() || new Date(),
        status: d.data().status
      }));

      setRecentActions(prev => {
        const otherActions = prev.filter(a => !a.id.startsWith('pay-'));
        return [...otherActions, ...paymentActivity].sort((a, b) => b.time - a.time).slice(0, 8);
      });
    });

    setLoading(false);
    return () => {
      unsubUsers();
      unsubCourses();
      unsubPayments();
    };
  }, []);

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'blue', change: '+12%', positive: true },
    { label: 'Courses', value: stats.totalCourses, icon: BookOpen, color: 'purple', change: '+2', positive: true },
    { label: 'Revenue', value: formatPrice(stats.totalRevenue), icon: CreditCard, color: 'green', change: '+R2.4k', positive: true },
    { label: 'Pending Verification', value: stats.pendingPayments, icon: AlertCircle, color: 'orange', change: '-5', positive: true },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="px-1">
        <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 mb-2">Morning, Administrator</h1>
        <p className="text-slate-500 text-sm font-medium">Here's what's happening across the academy today.</p>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-default group"
          >
            <div className="flex items-center justify-between">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                stat.color === 'blue' && "bg-blue-50 text-blue-600",
                stat.color === 'purple' && "bg-purple-50 text-purple-600",
                stat.color === 'green' && "bg-green-50 text-green-600",
                stat.color === 'orange' && "bg-orange-50 text-orange-600",
              )}>
                <stat.icon size={24} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-black uppercase tracking-tighter",
                stat.positive ? "text-green-500" : "text-red-500"
              )}>
                {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-display font-black text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-display font-bold">Recent Activity</h3>
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {recentActions.map((action) => (
                <div key={action.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      {action.type === 'payment' ? <CreditCard size={20} /> : action.type === 'enrollment' ? <TrendingUp size={20} /> : <BookOpen size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{action.user} <span className="text-slate-400 font-medium">{action.action}</span></p>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Clock size={12} /> {format(action.time, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest outline outline-1",
                    action.status === 'pending' ? "bg-orange-50 text-orange-600 outline-orange-200" : "bg-green-50 text-green-600 outline-green-200"
                  )}>
                    {action.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="space-y-6">
          <h3 className="text-xl font-display font-bold px-2">Academy Health</h3>
          <div className="p-8 bg-primary rounded-[2.5rem] text-white space-y-8 relative overflow-hidden shadow-xl shadow-primary/20">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp size={120} />
            </div>
            
            <div className="space-y-2 relative z-10">
              <p className="text-secondary font-bold uppercase tracking-[0.2em] text-[10px]">Real-time Engagement</p>
              <h4 className="text-4xl font-display font-black text-white">{stats.activeLearners}</h4>
              <p className="text-white/60 text-sm font-medium">Learners currently active</p>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span>Monthly Target</span>
                <span>72%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '72%' }}
                  className="h-full bg-secondary"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
