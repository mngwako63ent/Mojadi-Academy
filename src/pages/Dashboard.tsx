import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { courses } from '../data/courses';
import { BookOpen, Clock, Award, ChevronRight, PlayCircle, CreditCard, Receipt, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn, formatPrice } from '../lib/utils';

const Dashboard = () => {
  const { user, userProfile, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthReady && !user) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    const fetchData = async () => {
      if (user) {
        try {
          // Fetch Enrollments
          const enrollmentsRef = collection(db, 'users', user.uid, 'enrollments');
          const querySnapshot = await getDocs(enrollmentsRef);
          const enrollmentsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as any)
          }));
          
          const enrichedCourses = enrollmentsData.map(enrollment => {
            const course = courses.find(c => c.id === enrollment.id);
            if (!course) return null;
            return {
              ...course,
              progress: enrollment.progress || 0,
              completedModules: enrollment.completedModules || [],
              accessStatus: enrollment.accessStatus || 'active'
            };
          }).filter((c): c is any => c !== null);

          setEnrolledCourses(enrichedCourses);

          // Fetch Orders
          const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
          const orderSnapshot = await getDocs(q);
          const orderData = orderSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOrders(orderData);

        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [user, isAuthReady, navigate]);

  if (loading) {
    return (
      <div className="pt-32 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const email = user?.email?.toLowerCase();
  const isAdmin = userProfile?.role === 'admin' || (email === 'm.ngwako63@gmail.com' || email === 'admin@mojadiacademy.com');

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-display font-bold">Welcome back, {user?.displayName || 'Farmer'}!</h1>
          <p className="text-primary/60 dark:text-sage text-lg">Continue your journey to agricultural excellence.</p>
        </div>
        
        <div className="glass p-6 rounded-3xl border-secondary/20 bg-secondary/5 min-w-[280px] space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Student ID</p>
            <div className="flex items-center gap-3">
              <span className="text-xl font-mono font-black text-primary dark:text-sage">{userProfile?.studentId || '...'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-0.5">Joined</p>
              <p className="text-xs font-bold text-primary/60">
                {userProfile?.createdAt?.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) || '...'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-0.5">Status</p>
              <div className="flex items-center gap-1.5 justify-end">
                <div className={cn("w-2 h-2 rounded-full", userProfile?.isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-400")} />
                <span className="text-xs font-bold text-primary/60">{userProfile?.isOnline ? 'Online now' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-12">
          {/* Admin Quick Actions */}
          {isAdmin && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Award className="text-secondary" /> Administrative Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link 
                  to="/admin/payments" 
                  className="glass p-6 rounded-3xl border-secondary/20 bg-secondary/5 hover:bg-secondary/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold">Verify Payments</h4>
                      <p className="text-xs text-primary/60">Review submitted receipts</p>
                    </div>
                  </div>
                </Link>
                {/* Future admin actions can go here */}
              </div>
            </section>
          )}

          {/* Ongoing Orders */}
          {orders.filter(o => o.status !== 'activated').length > 0 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CreditCard className="text-secondary" /> Pending Payments
              </h2>
              <div className="grid gap-4">
                {orders.filter(o => o.status !== 'activated').map((order) => (
                  <div key={order.id} className="glass p-6 rounded-2xl flex items-center justify-between gap-6 border-yellow-500/20 bg-yellow-500/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-500/10 text-yellow-600 rounded-full flex items-center justify-center">
                        <Receipt size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold">{order.courseTitle}</h4>
                        <p className="text-xs text-primary/60">Status: <span className="font-bold capitalize">{order.status}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">{formatPrice(order.price)}</span>
                      {order.status === 'pending' ? (
                        <Link 
                          to={`/payment/${order.id}`}
                          className="px-4 py-2 bg-secondary text-white text-sm font-bold rounded-full hover:bg-secondary/90 transition-colors"
                        >
                          Finish Payment
                        </Link>
                      ) : (
                        <span className="text-xs font-bold text-yellow-600 italic">Verifying Receipt...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="text-secondary" /> Enrolled Courses
            </h2>
            
            {enrolledCourses.length > 0 ? (
              <div className="grid gap-6">
                {enrolledCourses.map((course) => {
                  const isActive = course.accessStatus === 'active';
                  
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "glass p-6 rounded-3xl flex flex-col md:flex-row gap-6 hover:shadow-xl transition-all group relative overflow-hidden",
                        !isActive && "opacity-75 grayscale-[0.5]"
                      )}
                    >
                      {!isActive && (
                        <div className="absolute top-4 right-4 z-10">
                          <span className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase rounded-full">
                            <AlertCircle size={12} /> Access Locked
                          </span>
                        </div>
                      )}

                      <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0">
                        <img 
                          src={course.image} 
                          alt={course.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-grow space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold">{course.title}</h3>
                            <p className="text-sm text-primary/60 dark:text-sage">{course.category}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-secondary">{course.progress}%</span>
                            <p className="text-xs text-primary/40 dark:text-sage uppercase font-bold tracking-wider">Progress</p>
                          </div>
                        </div>
                        
                        <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress}%` }}
                            className="h-full bg-secondary"
                          />
                        </div>
                        
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex gap-4 text-sm text-primary/60 dark:text-sage">
                            <span className="flex items-center gap-1"><Clock size={14} /> {course.duration}</span>
                            <span className="flex items-center gap-1"><Award size={14} /> {course.completedModules.length} / {course.modules.length} Modules</span>
                          </div>
                          {isActive ? (
                            <Link 
                              to={`/learning/${course.id}/${course.modules[0].id}`}
                              className="flex items-center gap-2 text-primary font-bold hover:text-secondary transition-colors"
                            >
                              Continue Learning <ChevronRight size={18} />
                            </Link>
                          ) : (
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-primary/40 uppercase">Payment Required</p>
                              <p className="text-[10px] text-secondary italic">Check pending payments</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="glass p-12 rounded-[2.5rem] text-center space-y-6">
                <div className="w-20 h-20 bg-primary/5 text-primary/40 rounded-full flex items-center justify-center mx-auto">
                  <PlayCircle size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">No courses enrolled yet</h3>
                  <p className="text-primary/60 dark:text-sage">Start your learning journey by exploring our available courses.</p>
                </div>
                <Link to="/courses" className="btn-premium bg-primary text-white inline-block">
                  Browse Courses
                </Link>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-bold">Learning Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                <span className="text-primary/60 dark:text-sage">Courses Enrolled</span>
                <span className="text-2xl font-bold">{enrolledCourses.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                <span className="text-primary/60 dark:text-sage">Modules Completed</span>
                <span className="text-2xl font-bold">
                  {enrolledCourses.reduce((acc, c) => acc + c.completedModules.length, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                <span className="text-primary/60 dark:text-sage">Average Progress</span>
                <span className="text-2xl font-bold">
                  {enrolledCourses.length > 0 
                    ? Math.round(enrolledCourses.reduce((acc, c) => acc + c.progress, 0) / enrolledCourses.length) 
                    : 0}%
                </span>
              </div>
            </div>
          </section>

          <section className="glass p-8 rounded-[2.5rem] space-y-6 bg-secondary/5 border-secondary/20">
            <h3 className="text-xl font-bold text-secondary">Academy News</h3>
            <p className="text-sm text-primary/60 dark:text-sage">Stay updated with the latest from Mojadi Academy.</p>
            <div className="space-y-4">
              <div className="p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-secondary/10">
                <p className="font-bold text-sm">Level 2 Modules Live</p>
                <p className="text-xs text-secondary">Intermediate Crop Production is now fully available.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
