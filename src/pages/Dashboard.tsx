import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useCoursePricing } from '../hooks/useCoursePricing';
import { BookOpen, Clock, Award, ChevronRight, PlayCircle, CreditCard, Receipt, AlertCircle, CheckCircle2, X, FileText, CheckCircle, Download, ExternalLink, Info } from 'lucide-react';
import { cn, formatPrice } from '../lib/utils';
import Certificate from '../components/Certificate';

// Internal components for better organization
const PdfViewer = ({ data, fileName }: { data: string, fileName?: string }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Extract base64 part
      const base64Data = data.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      console.error("Failed to create blob for PDF preview", e);
    }
  }, [data]);

  if (!blobUrl) return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      <p className="text-primary/60 font-medium text-sm">Preparing document preview...</p>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <iframe 
        src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        className="flex-grow w-full border-none rounded-b-none"
        title="PDF Receipt"
      />
      <div className="p-4 bg-white border-t border-black/5 flex justify-between items-center shrink-0">
        <span className="text-[10px] font-bold text-primary/40 truncate flex-1 mr-4">
          {fileName || 'receipt.pdf'}
        </span>
        <a 
          href={blobUrl} 
          target="_blank" 
          rel="noreferrer"
          className="px-4 py-1.5 bg-secondary text-white text-[10px] font-bold rounded-full shadow-lg shadow-secondary/20 whitespace-nowrap"
        >
          Open in New Tab
        </a>
      </div>
    </div>
  );
};

const Dashboard = () => {

  const { user, userProfile, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const { courses, loading: pricingLoading } = useCoursePricing();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [viewingCertificate, setViewingCertificate] = useState<any>(null);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [confirmingChange, setConfirmingChange] = useState<string | null>(null);

  const handleChangeReceipt = async (orderId: string) => {
    if (!user) return;
    setConfirmingChange(null);
    setProcessingOrder(orderId);
    try {
      // 1. Find the receipt for this order
      const q = query(
        collection(db, 'payment_receipts'), 
        where('orderId', '==', orderId)
      );
      const snapshot = await getDocs(q);
      
      // 2. Delete the receipt(s) regardless of status so they can re-upload
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, 'payment_receipts', d.id));
      }

      // 3. Reset order status to pending
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'pending'
      });

      // 4. Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'pending' } : o));
      setReceipts(prev => prev.filter(r => r.orderId !== orderId));
      
      // 5. Navigate to payment page
      navigate(`/payment/${orderId}`);
      
    } catch (error) {
      console.error("Error changing receipt:", error);
    } finally {
      setProcessingOrder(null);
    }
  };

  useEffect(() => {
    if (isAuthReady && !user) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    if (pricingLoading) return;

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

          // Fetch Receipts
          const rq = query(collection(db, 'payment_receipts'), where('userId', '==', user.uid));
          const receiptSnapshot = await getDocs(rq);
          const receiptData = receiptSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setReceipts(receiptData);

        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [user, isAuthReady, navigate, pricingLoading, courses]);

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
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 md:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight">Welcome back, {user?.displayName || 'Farmer'}!</h1>
          <p className="text-primary/60 dark:text-sage text-base sm:text-lg">Continue your journey to agricultural excellence.</p>
        </div>
        
        <div className="glass p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-secondary/20 bg-secondary/5 w-full lg:min-w-[320px] lg:w-auto space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Student ID Card</p>
            <div className="flex items-center gap-3">
              <span className="text-lg sm:text-xl font-mono font-black text-primary dark:text-sage">{userProfile?.studentId || '...'}</span>
              <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold rounded-md">Verified</span>
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
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-bold text-yellow-600 italic">Verifying Receipt...</span>
                          <div className="flex items-center gap-3">
                            {receipts.find(r => r.orderId === order.id) && (
                              <button 
                                onClick={() => setSelectedReceipt(receipts.find(r => r.orderId === order.id))}
                                className="text-[10px] font-bold text-secondary hover:underline flex items-center gap-1"
                              >
                                <FileText size={10} /> View
                              </button>
                            )}
                            {confirmingChange === order.id ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleChangeReceipt(order.id)}
                                  className="text-[10px] font-bold text-red-500 hover:underline"
                                >
                                  Yes, Change
                                </button>
                                <button 
                                  onClick={() => setConfirmingChange(null)}
                                  className="text-[10px] font-bold text-primary/40 hover:underline"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setConfirmingChange(order.id)}
                                disabled={processingOrder === order.id}
                                className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1 disabled:opacity-50"
                              >
                                {processingOrder === order.id ? 'Processing...' : 'Change Receipt'}
                              </button>
                            )}
                          </div>
                        </div>
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
                  const isActive = isAdmin || course.accessStatus === 'active';
                  const isCompleted = course.progress === 100;
                  
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className={cn(
                        "glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row gap-4 sm:gap-6 hover:shadow-xl transition-all group relative overflow-hidden",
                        !isActive && "opacity-75 grayscale-[0.5]"
                      )}
                    >
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 z-10 w-20 h-20 sm:w-24 sm:h-24 overflow-hidden">
                           <div className="absolute top-0 right-0 w-[150%] h-6 sm:h-8 bg-secondary text-white text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center rotate-45 translate-x-[30%] translate-y-[50%] shadow-lg">
                              Certified
                           </div>
                        </div>
                      )}
                      {!isActive && (
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                          <span className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold uppercase rounded-full shadow-md">
                            <AlertCircle size={10} className="sm:size-3" /> Access Locked
                          </span>
                        </div>
                      )}

                      <div className="w-full sm:w-40 md:w-48 aspect-video sm:aspect-square md:aspect-video rounded-xl sm:rounded-2xl overflow-hidden shrink-0">
                        <img 
                          src={course.image || course.thumbnail || undefined} 
                          alt={course.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-grow space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg sm:text-xl font-bold truncate sm:whitespace-normal">{course.title}</h3>
                            <p className="text-xs sm:text-sm text-primary/60 dark:text-sage truncate sm:whitespace-normal">{course.category}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xl sm:text-2xl font-bold text-secondary">{course.progress}%</span>
                            <p className="text-[10px] text-primary/40 dark:text-sage uppercase font-bold tracking-wider">Progress</p>
                          </div>
                        </div>
                        
                        <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 sm:h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress}%` }}
                            className="h-full bg-secondary"
                          />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-primary/60 dark:text-sage">
                            <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                            <span className="flex items-center gap-1"><Award size={12} /> {course.completedModules.length} / {course.modules.length} Modules</span>
                          </div>
                          {isActive ? (
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
                              {isCompleted && (
                                <button 
                                  onClick={() => setViewingCertificate(course)}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-secondary text-white rounded-full text-[10px] sm:text-xs font-bold shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                  <Award size={12} /> View Certificate
                                </button>
                              )}
                              <Link 
                                to={`/learning/${course.id}/${course.modules?.[0]?.id || ''}`}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 text-[11px] sm:text-sm text-primary font-bold hover:text-secondary transition-colors whitespace-nowrap"
                              >
                                {isCompleted ? 'Review Content' : 'Continue Learning'} <ChevronRight size={16} />
                              </Link>
                            </div>
                          ) : (
                            <div className="text-right w-full sm:w-auto">
                              <p className="text-[9px] font-black text-primary/40 uppercase tracking-tighter">Locked: Enrollment Pending Verification</p>
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

        <div className="space-y-6 md:space-y-8">
          <section className="glass p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] space-y-6">
            <h3 className="text-lg sm:text-xl font-bold border-b border-black/5 pb-2">Your Learning Stats</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center p-4 bg-black/5 dark:bg-white/5 rounded-xl sm:rounded-2xl border border-black/5">
                <span className="text-sm font-medium text-primary/60 dark:text-sage">Courses Enrolled</span>
                <span className="text-xl sm:text-2xl font-black">{enrolledCourses.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-black/5 dark:bg-white/5 rounded-xl sm:rounded-2xl border border-black/5">
                <span className="text-sm font-medium text-primary/60 dark:text-sage">Modules Finished</span>
                <span className="text-xl sm:text-2xl font-black">
                  {enrolledCourses.reduce((acc, c) => acc + c.completedModules.length, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-black/5 dark:bg-white/5 rounded-xl sm:rounded-2xl border border-black/5">
                <span className="text-sm font-medium text-primary/60 dark:text-sage">Average Mastery</span>
                <span className="text-xl sm:text-2xl font-black">
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

      {/* Certificate Modal */}
      <AnimatePresence>
        {viewingCertificate && (
          <Certificate 
            learnerName={user?.displayName || 'Farmer'}
            courseName={viewingCertificate.title}
            completionDate={new Date().toLocaleDateString()}
            certificateId={`ACAD-${viewingCertificate.id.substring(0, 4)}-${user?.uid.substring(0, 4)}`.toUpperCase()}
            onClose={() => setViewingCertificate(null)}
          />
        )}
      </AnimatePresence>

      {/* Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedReceipt(null)}
            className="absolute inset-0 bg-primary/20 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-primary/20 overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-8 border-b border-black/5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-2xl font-bold">Your Proof of Payment</h3>
                <p className="text-primary/60">{selectedReceipt.courseTitle}</p>
              </div>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="w-10 h-10 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-auto p-8 flex flex-col items-center justify-center bg-black/5">
              <div className="w-full aspect-[3/4] max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-black/5 relative group">
                {typeof selectedReceipt.receiptFile === 'string' && selectedReceipt.receiptFile.startsWith('data:image/') ? (
                  <div className="w-full h-full p-2">
                    <img 
                      src={selectedReceipt.receiptFile || undefined} 
                      alt="Receipt" 
                      className="w-full h-full object-contain rounded-xl"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={selectedReceipt.receiptFile} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-white text-xs font-bold hover:underline"
                      >
                        Preview Original Image
                      </a>
                    </div>
                  </div>
                ) : typeof selectedReceipt.receiptFile === 'string' && selectedReceipt.receiptFile.startsWith('data:application/pdf') ? (
                  <PdfViewer data={selectedReceipt.receiptFile} fileName={selectedReceipt.fileName} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center">
                      <FileText size={40} className="text-primary/20" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary">{selectedReceipt.fileName || 'Receipt File'}</h4>
                      <p className="text-xs text-primary/40 mt-1">
                        {selectedReceipt.fileType || 'Document'}
                      </p>
                    </div>
                    {typeof selectedReceipt.receiptFile === 'string' && selectedReceipt.receiptFile.startsWith('data:') && (
                      <div className="flex flex-col gap-2 w-full max-w-[200px]">
                        <a 
                          href={selectedReceipt.receiptFile} 
                          download={selectedReceipt.fileName || 'receipt.pdf'}
                          className="w-full py-2.5 bg-secondary text-white rounded-full font-bold text-sm shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-all"
                        >
                          Download to View
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-black/5 flex justify-center bg-white dark:bg-slate-900 shrink-0">
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="px-12 py-3 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                Close Preview
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
