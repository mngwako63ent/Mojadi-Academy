import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, getDocs, getDoc, doc, updateDoc, setDoc, serverTimestamp, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../components/AuthContext';
import { Check, X, FileText, User, BookOpen, CreditCard, Search, Loader2, AlertCircle, Tag, DollarSign } from 'lucide-react';
import { cn, formatPrice } from '../lib/utils';
import { courses } from '../data/courses';

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
      <Loader2 className="animate-spin text-secondary" size={40} />
      <p className="text-primary/60 font-medium">Preparing document preview...</p>
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

const AdminPayments = () => {

  const { userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'payments' | 'users' | 'courses'>('payments');
  const [users, setUsers] = useState<any[]>([]);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, { price: number, isFree: boolean }>>({});
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);
  const [pendingPaidCourseId, setPendingPaidCourseId] = useState<string | null>(null);
  const [newPriceInput, setNewPriceInput] = useState<string>('');

  useEffect(() => {
    if (!authLoading && (!userProfile || userProfile.role !== 'admin')) {
      navigate('/');
    }
  }, [userProfile, authLoading, navigate]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const q = query(
          collection(db, 'payment_receipts')
        );
        const querySnapshot = await getDocs(q);
        const paymentData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort by uploadedAt desc
        paymentData.sort((a: any, b: any) => 
          (b.uploadedAt?.toMillis() || 0) - (a.uploadedAt?.toMillis() || 0)
        );
        setPayments(paymentData);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile?.role === 'admin') {
      fetchPayments();
    }
  }, [userProfile]);

  // Fetch dynamic prices
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'course_overrides'), (snapshot) => {
      const newPrices: Record<string, { price: number, isFree: boolean }> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        newPrices[doc.id] = {
          price: data.price,
          isFree: data.price === 0
        };
      });
      setDynamicPrices(newPrices);
    });
    return () => unsub();
  }, []);

  const handleUpdatePrice = async (courseId: string, updates: any) => {
    setSavingPriceId(courseId);
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;

      const currentOverride = dynamicPrices[courseId] || { price: course.price, isFree: course.price === 0 };
      
      let newPrice: number;
      
      if (updates.isFree === true) {
        newPrice = 0;
      } else if (updates.price !== undefined) {
        newPrice = Number(updates.price);
      } else {
        // Switching to paid or keeping paid status
        newPrice = updates.isFree === false ? (Number(newPriceInput) || course.price) : currentOverride.price;
      }
      
      const docRef = doc(db, 'course_overrides', courseId);
      await setDoc(docRef, {
        price: newPrice,
        updatedAt: serverTimestamp()
      });
      
      setPendingPaidCourseId(null);
      setNewPriceInput('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `course_overrides/${courseId}`);
    } finally {
      setSavingPriceId(null);
    }
  };

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(userData);
      }, (error) => {
        console.error("Error listening to users:", error);
      });
      return () => unsubscribe();
    }
  }, [userProfile]);

  const handleApprove = async (payment: any) => {
    if (!payment) return;
    setProcessingId(payment.id);
    try {
      // 1. Update order status to 'activated'
      await updateDoc(doc(db, 'orders', payment.orderId), {
        status: 'activated'
      });

      // 2. Create/update enrollment as 'active'
      const enrollmentPath = `users/${payment.userId}/enrollments/${payment.courseId}`;
      const enrollmentRef = doc(db, enrollmentPath);
      await setDoc(enrollmentRef, {
        courseId: payment.courseId,
        courseTitle: payment.courseTitle,
        enrolledAt: payment.uploadedAt || serverTimestamp(),
        activatedAt: serverTimestamp(),
        progress: 0,
        completedModules: [],
        accessStatus: 'active'
      }, { merge: true });

      // 3. Mark receipt as approved
      await updateDoc(doc(db, 'payment_receipts', payment.id), {
        status: 'approved',
        processedAt: serverTimestamp(),
        processedBy: userProfile?.uid
      });
      
      setPayments(payments.map(p => p.id === payment.id ? { ...p, status: 'approved' } : p));
      setSelectedReceipt(null);
    } catch (error) {
      console.error("Approval error:", error);
      handleFirestoreError(error, OperationType.WRITE, `payment_receipts/${payment.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);

  const handleReject = async (payment: any) => {
    if (!payment) return;
    setConfirmRejectId(null);
    setProcessingId(payment.id);
    try {
      // Revert order to pending
      await updateDoc(doc(db, 'orders', payment.orderId), {
        status: 'pending'
      });
      // Mark receipt as rejected
      await updateDoc(doc(db, 'payment_receipts', payment.id), {
        status: 'rejected',
        processedAt: serverTimestamp(),
        processedBy: userProfile?.uid
      });

      setPayments(payments.map(p => p.id === payment.id ? { ...p, status: 'rejected' } : p));
      setSelectedReceipt(null);
    } catch (error) {
      console.error("Rejection error:", error);
      handleFirestoreError(error, OperationType.WRITE, `payment_receipts/${payment.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // In "Pending Payments" tab, we usually only want to see pending ones
    // unless we add a toggle for history. For now let's just filter for UI.
    return matchesSearch && p.status === 'pending';
  });

  const filteredUsers = users.filter(u => 
    u.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [manualEnrollmentUser, setManualEnrollmentUser] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const fetchStudentEnrollments = async (studentId: string) => {
    setLoadingEnrollments(true);
    try {
      const q = query(collection(db, 'users', studentId, 'enrollments'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data());
      setStudentEnrollments(data);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const [confirmRoleModal, setConfirmRoleModal] = useState<{ isOpen: boolean, user: any, newRole: string }>({ isOpen: false, user: null, newRole: '' });

  const initiateChangeRole = (u: any) => {
    const newRole = u.role === 'admin' ? 'student' : 'admin';
    setConfirmRoleModal({ isOpen: true, user: u, newRole });
  };

  const executeChangeRole = async () => {
    const { user: u, newRole } = confirmRoleModal;
    if (!u) return;

    setConfirmRoleModal({ isOpen: false, user: null, newRole: '' });
    setProcessingId(u.id);
    try {
      console.log(`Attempting to change role for ${u.id} to ${newRole}`);
      await updateDoc(doc(db, 'users', u.id), { 
        role: newRole,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUsers(prevUsers => prevUsers.map(user => user.id === u.id ? { ...user, role: newRole } : user));
      if (selectedStudent && selectedStudent.id === u.id) {
        setSelectedStudent({ ...selectedStudent, role: newRole });
      }
      
      alert(`Role updated successfully to ${newRole}.`);
    } catch (error: any) {
      console.error("Role update error details:", error);
      const errorMessage = error.message || String(error);
      alert(`Role update failed: ${errorMessage}\n\nIf this persists, please ensure you are logged in as a primary administrator.`);
      handleFirestoreError(error, OperationType.UPDATE, `users/${u.id}/role`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenDetails = (u: any) => {
    setSelectedStudent(u);
    fetchStudentEnrollments(u.id);
  };

  const stats = {
    totalStudents: users.length,
    pendingPayments: payments.length,
    totalRevenue: users.reduce((acc, u) => acc + (u.totalSpent || 0), 0),
  };

  const handleSystemMaintenance = async () => {
    if (!confirm("Are you sure you want to run system maintenance to initialize admin roles and student IDs?")) return;
    
    setLoading(true);
    try {
      const admins = ['m.ngwako63@gmail.com', 'admin@mojadiacademy.com'];
      const students = [
        'yinace6964@pertok.com', 
        'ladamo1093@availors.com', 
        'molebatsidikgang014@gmail.com', 
        'jacobdikgang22@gmail.com'
      ];

      // Refresh users list first
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const allUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      let updatedCount = 0;

      for (const u of allUsers) {
        const email = u.email?.toLowerCase();
        let updates: any = {};

        if (admins.includes(email)) {
          if (u.role !== 'admin') updates.role = 'admin';
          if (!u.studentId || !u.studentId.startsWith('ADMIN-')) {
            const randomPart = Math.floor(1000 + Math.random() * 9000);
            updates.studentId = `ADMIN-${randomPart}`;
          }
        } else if (students.includes(email)) {
          if (!u.studentId || !u.studentId.startsWith('STU-')) {
            const year = new Date().getFullYear();
            const randomPart = Math.floor(100000 + Math.random() * 900000);
            updates.studentId = `STU-${year}-${randomPart}`;
          }
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'users', u.id), updates);
          updatedCount++;
        }
      }

      alert(`Maintenance complete. Updated ${updatedCount} users.`);
      // Refresh local users list
      const updatedQuerySnapshot = await getDocs(q);
      setUsers(updatedQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'system_maintenance');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEnroll = async () => {
    if (!manualEnrollmentUser || !selectedCourseId) return;
    setProcessingId(manualEnrollmentUser.id);
    try {
      const course = courses.find(c => c.id === selectedCourseId);
      const enrollmentPath = `users/${manualEnrollmentUser.id}/enrollments/${selectedCourseId}`;
      const enrollmentRef = doc(db, enrollmentPath);
      await setDoc(enrollmentRef, {
        courseId: selectedCourseId,
        courseTitle: course?.title || 'Manual Enrollment',
        enrolledAt: serverTimestamp(),
        activatedAt: serverTimestamp(),
        progress: 0,
        completedModules: [],
        accessStatus: 'active'
      }, { merge: true });
      
      alert(`Course ${course?.title} activated for ${manualEnrollmentUser.displayName}`);
      setManualEnrollmentUser(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${manualEnrollmentUser.id}/enrollments/${selectedCourseId}`);
    } finally {
      setProcessingId(null);
    }
  };

  const formatLastSeen = (timestamp: any, isOnline: boolean) => {
    if (isOnline) return "Online now";
    if (!timestamp) return "Never";
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60) ;
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return `Yesterday at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const formatJoinedDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Joined today";
    if (diffDays === 1) return "Joined yesterday";
    if (diffDays < 7) return `Joined ${diffDays} days ago`;
    
    return `Joined on ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  const handleGenerateId = async (userId: string, role: string) => {
    setProcessingId(userId);
    try {
      const year = new Date().getFullYear();
      let studentId = '';
      
      if (role === 'admin') {
        const randomPart = Math.floor(1000 + Math.random() * 9000); // 4 digits
        studentId = `ADMIN-${randomPart}`;
      } else {
        const randomPart = Math.floor(100000 + Math.random() * 900000);
        studentId = `STU-${year}-${randomPart}`;
      }
      
      await updateDoc(doc(db, 'users', userId), {
        studentId
      });
      
      setUsers(users.map(u => u.id === userId ? { ...u, studentId } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || (loading && !payments.length && !users.length)) {
    return (
      <div className="pt-32 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-secondary" size={48} />
        <p className="text-primary/60">Loading administrative data...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold">Admin Panel</h1>
          <p className="text-primary/60">Manage students, payments, and course access.</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleSystemMaintenance}
            className="flex items-center gap-2 px-4 py-2 bg-primary/5 hover:bg-primary/10 text-primary dark:text-sage text-sm font-bold rounded-xl transition-all border border-black/5 dark:border-white/5"
            title="Initialize admin roles and student IDs"
          >
            <AlertCircle size={18} /> Maintenance
          </button>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-secondary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white dark:bg-neutral-dark rounded-full border border-black/5 dark:border-white/5 focus:border-secondary outline-none w-full md:w-64 shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="glass p-6 rounded-3xl border-secondary/20 bg-secondary/5">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">Total Students</p>
          <p className="text-3xl font-black text-primary dark:text-sage">{stats.totalStudents}</p>
        </div>
        <div className="glass p-6 rounded-3xl border-yellow-500/20 bg-yellow-500/5">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-600 mb-2">Pending Payments</p>
          <p className="text-3xl font-black text-primary dark:text-sage">{stats.pendingPayments}</p>
        </div>
        <div className="glass p-6 rounded-3xl border-green-500/20 bg-green-500/5">
          <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">Academy Status</p>
          <p className="text-lg font-bold text-green-600 flex items-center gap-2">
            <Check size={20} /> Operational
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('payments')}
          className={cn(
            "px-6 py-2 rounded-full font-bold transition-all",
            activeTab === 'payments' ? "bg-secondary text-white" : "bg-black/5 dark:bg-white/5 hover:bg-black/10"
          )}
        >
          Pending Payments ({payments.length})
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-6 py-2 rounded-full font-bold transition-all",
            activeTab === 'users' ? "bg-secondary text-white" : "bg-black/5 dark:bg-white/5 hover:bg-black/10"
          )}
        >
          Student Directory
        </button>
        <button 
          onClick={() => setActiveTab('courses')}
          className={cn(
            "px-6 py-2 rounded-full font-bold transition-all",
            activeTab === 'courses' ? "bg-secondary text-white" : "bg-black/5 dark:bg-white/5 hover:bg-black/10"
          )}
        >
          Manage Courses
        </button>
      </div>

      {activeTab === 'payments' ? (
        payments.length === 0 ? (
          <div className="glass p-20 text-center rounded-[3rem] space-y-4">
            <div className="w-20 h-20 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={40} />
            </div>
            <h2 className="text-2xl font-bold">All clear!</h2>
            <p className="text-primary/60">No pending payments for verification.</p>
          </div>
        ) : (
          <div className="glass rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/5 dark:bg-white/5 text-primary/40 text-xs font-bold uppercase tracking-widest">
                    <th className="px-8 py-6">Student</th>
                    <th className="px-8 py-6">Course</th>
                    <th className="px-8 py-6">Price</th>
                    <th className="px-8 py-6">Receipt</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  <AnimatePresence>
                    {filteredPayments.map((payment) => (
                      <motion.tr 
                        key={payment.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center font-bold">
                              {(payment.studentName || 'U')[0]}
                            </div>
                            <div>
                              <p className="font-bold whitespace-nowrap">{payment.studentName || 'Unknown User'}</p>
                              <p className="text-xs text-secondary font-mono">{payment.studentId || 'No ID'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <BookOpen size={16} className="text-primary/40" />
                            <span className="font-medium whitespace-nowrap">{payment.courseTitle}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="font-bold">{formatPrice(payment.price)}</span>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => setSelectedReceipt(payment)}
                            className="flex items-center gap-2 text-secondary hover:underline font-medium"
                          >
                            <FileText size={18} /> View Receipt
                          </button>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 text-[10px] font-bold uppercase rounded-full">
                            Pending
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-end gap-3">
                            {processingId === payment.id ? (
                              <Loader2 className="animate-spin text-secondary" size={20} />
                            ) : confirmRejectId === payment.id ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleReject(payment)}
                                  className="text-[10px] font-bold text-red-500 border border-red-500 px-2 py-1 rounded hover:bg-red-50"
                                >
                                  Confirm Reject
                                </button>
                                <button 
                                  onClick={() => setConfirmRejectId(null)}
                                  className="text-[10px] font-bold text-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleApprove(payment)}
                                  className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                                  title="Approve"
                                >
                                  <Check size={20} />
                                </button>
                                <button 
                                  onClick={() => setConfirmRejectId(payment.id)}
                                  className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                  title="Reject"
                                >
                                  <X size={20} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : activeTab === 'users' ? (
        <div className="glass rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/5 dark:bg-white/5 text-primary/40 text-xs font-bold uppercase tracking-widest">
                  <th className="px-8 py-6">Student</th>
                  <th className="px-8 py-6">ID & Joined</th>
                  <th className="px-8 py-6">Activity</th>
                  <th className="px-8 py-6">Role</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                            {(u.displayName || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div className={cn(
                            "absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-neutral-dark rounded-full",
                            u.isOnline ? "bg-green-500" : "bg-gray-400"
                          )} />
                        </div>
                        <div>
                          <p className="font-bold whitespace-nowrap">{u.displayName || 'Unnamed'}</p>
                          <p className="text-xs text-primary/40">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {u.studentId ? (
                        <>
                          <p className="font-mono text-secondary text-xs font-bold">{u.studentId}</p>
                          <p className="text-[10px] text-primary/40 uppercase font-bold">
                            {formatJoinedDate(u.createdAt)}
                          </p>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-[10px] text-primary/40 uppercase font-bold">
                            {formatJoinedDate(u.createdAt)}
                          </p>
                          <button 
                            onClick={() => handleGenerateId(u.id, u.role)}
                            disabled={processingId === u.id}
                            className="text-[10px] font-bold text-secondary uppercase hover:underline border border-secondary/20 px-2 py-1 rounded"
                          >
                            {processingId === u.id ? '...' : u.role === 'admin' ? 'Generate Admin ID' : 'Generate Student ID'}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          u.isOnline ? "bg-green-500" : "bg-gray-400"
                        )} />
                        <span className="text-xs font-medium text-primary/60">
                          {formatLastSeen(u.lastSeen, u.isOnline)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "px-3 py-1 text-[10px] font-bold uppercase rounded-full w-fit",
                          u.role === 'admin' ? "bg-purple-500/10 text-purple-600 border border-purple-500/20" : "bg-primary/10 text-primary border border-primary/10"
                        )}>
                          {u.role}
                        </span>
                        <button 
                          onClick={() => initiateChangeRole(u)}
                          disabled={processingId === u.id}
                          className="text-[10px] font-bold text-secondary hover:text-secondary/80 uppercase tracking-tighter text-left bg-secondary/5 px-2 py-0.5 rounded-md border border-secondary/10 transition-all"
                        >
                          {processingId === u.id ? '...' : 'Change Role'}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <button 
                          onClick={() => handleOpenDetails(u)}
                          className="text-xs font-bold text-primary hover:text-secondary flex items-center gap-1 transition-colors"
                        >
                          <FileText size={14} /> Details
                        </button>
                        <button 
                          onClick={() => setManualEnrollmentUser(u)}
                          className="text-xs font-bold text-secondary hover:underline"
                        >
                          Enroll
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const dynamic = dynamicPrices[course.id] || { price: course.price, isFree: course.price === 0 };
            
            return (
              <div key={course.id} className="glass p-6 rounded-[2rem] space-y-4 border-black/5 dark:border-white/5 hover:border-secondary/20 transition-all">
                <div className="flex gap-4">
                  <img src={course.image || course.thumbnail || undefined} className="w-20 h-20 rounded-2xl object-cover" alt={course.title} referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm leading-tight line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-primary/40 mt-1">{course.category}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn(
                        "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full",
                        dynamic.isFree ? "bg-green-500/10 text-green-600" : "bg-secondary/10 text-secondary"
                      )}>
                        {dynamic.isFree ? 'Free' : 'Paid'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-4 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/40">Status</label>
                    <div className="flex items-center gap-2">
                      {pendingPaidCourseId === course.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            placeholder="Price (R)"
                            value={newPriceInput}
                            onChange={(e) => setNewPriceInput(e.target.value)}
                            className="w-24 px-3 py-1 text-xs bg-black/5 dark:bg-white/5 border border-secondary/20 rounded-lg outline-none focus:ring-1 ring-secondary"
                            autoFocus
                          />
                          <button 
                            onClick={() => handleUpdatePrice(course.id, { isFree: false })}
                            disabled={savingPriceId === course.id}
                            className="p-1 px-2 bg-secondary text-white text-[10px] font-bold rounded-lg hover:bg-secondary/80 transition-all disabled:opacity-50"
                          >
                            {savingPriceId === course.id ? '...' : 'Confirm'}
                          </button>
                          <button 
                            onClick={() => { setPendingPaidCourseId(null); setNewPriceInput(''); }}
                            className="p-1 px-2 bg-black/5 dark:bg-white/5 text-[10px] font-bold rounded-lg hover:bg-black/10 transition-all border border-black/5 dark:border-white/10"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            if (dynamic.isFree) {
                              setPendingPaidCourseId(course.id);
                              setNewPriceInput(course.price.toString());
                            } else {
                              handleUpdatePrice(course.id, { isFree: true });
                            }
                          }}
                          disabled={savingPriceId === course.id}
                          className={cn(
                            "text-[10px] font-bold px-3 py-1 rounded-lg transition-all",
                            savingPriceId === course.id ? "opacity-50 cursor-not-allowed" : "",
                            dynamic.isFree 
                              ? "bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600" 
                              : "bg-primary/5 text-primary dark:text-white hover:bg-primary/10"
                          )}
                        >
                          {savingPriceId === course.id ? 'Updating...' : dynamic.isFree ? 'Switch to Paid' : 'Switch to Free'}
                        </button>
                      )}
                    </div>
                  </div>

                  {!dynamic.isFree && pendingPaidCourseId !== course.id && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-primary/40">Custom Price (R)</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          key={dynamic.price}
                          defaultValue={dynamic.price}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val !== dynamic.price && val >= 0) {
                              handleUpdatePrice(course.id, { price: val });
                            }
                          }}
                          className="flex-grow px-4 py-2 bg-black/5 dark:bg-white/5 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-secondary/20"
                        />
                        <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center shrink-0">
                          <CreditCard size={18} />
                        </div>
                      </div>
                      <p className="text-[10px] text-primary/40">Base Price: {formatPrice(course.price)}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Details Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-dark rounded-[2.5rem] p-8 md:p-10 space-y-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl font-bold">
                    {(selectedStudent.displayName || selectedStudent.email || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedStudent.displayName || 'No Name Set'}</h3>
                    <p className="text-primary/60">{selectedStudent.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full",
                        selectedStudent.role === 'admin' ? "bg-purple-500/10 text-purple-600" : "bg-primary/10 text-primary"
                      )}>
                        {selectedStudent.role}
                      </span>
                      <span className="text-[10px] font-mono text-secondary font-bold">{selectedStudent.studentId}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 dark:text-white/40 mb-1">Joined</p>
                  <p className="font-bold">{selectedStudent.createdAt?.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 dark:text-white/40 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", selectedStudent.isOnline ? "bg-green-500" : "bg-gray-400")} />
                    <p className="font-bold">{selectedStudent.isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen size={20} className="text-secondary" /> Course Enrollments
                </h4>
                
                {loadingEnrollments ? (
                  <div className="flex items-center gap-2 text-primary/40 py-8 italic">
                    <Loader2 className="animate-spin" size={16} /> Loading progress data...
                  </div>
                ) : studentEnrollments.length === 0 ? (
                  <div className="p-8 text-center bg-black/5 dark:bg-white/5 rounded-3xl text-primary/40">
                    No courses enrolled yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentEnrollments.map((en: any) => (
                      <div key={en.courseId} className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-between group">
                        <div className="space-y-1">
                          <p className="font-bold group-hover:text-secondary transition-colors">{en.courseTitle}</p>
                          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                            <span className={cn(
                              en.accessStatus === 'active' ? "text-green-600" : "text-yellow-600"
                            )}>
                              {en.accessStatus === 'active' ? 'Paid / Active' : 'Pending Payment'}
                            </span>
                            <span className="text-primary/40">•</span>
                            <span className="text-secondary">{en.progress || 0}% Complete ({en.completedModules?.length || 0}/{courses.find(c => c.id === en.courseId)?.modules?.length || 0} Modules)</span>
                          </div>
                        </div>
                        <div className="w-24 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-secondary transition-all" 
                            style={{ width: `${en.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => initiateChangeRole(selectedStudent)}
                  disabled={processingId === selectedStudent.id}
                  className="flex-grow py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 dark:text-purple-300 text-sm font-bold border border-purple-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === selectedStudent.id ? (
                    <><Loader2 className="animate-spin" size={16} /> Processing...</>
                  ) : (
                    'Change User Role'
                  )}
                </button>
                <button 
                  onClick={() => { setManualEnrollmentUser(selectedStudent); setSelectedStudent(null); }}
                  className="flex-grow py-3 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary text-sm font-bold border border-secondary/10"
                >
                  Manual Enrollment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal for Role Change */}
      <AnimatePresence>
        {confirmRoleModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmRoleModal({ isOpen: false, user: null, newRole: '' })}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-neutral-dark rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center gap-4 text-orange-500">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-xl font-bold">Confirm Role Change</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-primary/60 dark:text-white/60">
                  {confirmRoleModal.newRole === 'admin' 
                    ? `Are you sure you want to PROMOTE ${confirmRoleModal.user?.displayName || confirmRoleModal.user?.email} to ADMIN?`
                    : `Are you sure you want to REVOKE admin access from ${confirmRoleModal.user?.displayName || confirmRoleModal.user?.email} and make them a student?`
                  }
                </p>
                {confirmRoleModal.newRole === 'admin' && (
                  <p className="text-xs font-bold text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    Warning: Admins have FULL access to manage all users, course enrollments, and platform payments.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setConfirmRoleModal({ isOpen: false, user: null, newRole: '' })}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary/5 hover:bg-primary/10 text-primary dark:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeChangeRole}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-secondary hover:bg-secondary/90 text-white shadow-lg transition-colors"
                >
                  Confirm Change
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Enrollment Modal */}
      <AnimatePresence>
        {manualEnrollmentUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManualEnrollmentUser(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white dark:bg-neutral-dark rounded-[2rem] p-8 space-y-6"
            >
              <h3 className="text-2xl font-bold">Manual Enrollment</h3>
              <p className="text-primary/60">
                Activate a course for <span className="font-bold text-primary">{manualEnrollmentUser.displayName || manualEnrollmentUser.email}</span>
              </p>

              <div className="space-y-4">
                <label className="block text-sm font-bold">Select Course</label>
                <select 
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 px-4 outline-none focus:border-secondary transition-all"
                >
                  <option value="">Choose a course...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title} ({formatPrice(course.price)})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setManualEnrollmentUser(null)}
                  className="flex-grow py-3 rounded-full font-bold hover:bg-black/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleManualEnroll}
                  disabled={!selectedCourseId || processingId === manualEnrollmentUser.id}
                  className="flex-grow btn-premium bg-secondary text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === manualEnrollmentUser.id ? <Loader2 className="animate-spin" size={20} /> : 'Activate Access'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt View Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceipt(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-dark rounded-[2rem] p-8 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">Proof of Payment</h3>
                  <p className="text-primary/60">{selectedReceipt.courseTitle} - {selectedReceipt.studentName}</p>
                </div>
                <button 
                  onClick={() => setSelectedReceipt(null)}
                  className="p-2 hover:bg-black/5 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="aspect-[3/4] bg-black/5 rounded-2xl overflow-hidden border-2 border-dashed border-black/10 relative group">
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
                        Open Original Image
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
                        {selectedReceipt.receiptFile === 'receipt_uploaded_placeholder.pdf' 
                          ? 'Example receipt (no actual data)' 
                          : (selectedReceipt.fileType || 'Unknown file type')}
                      </p>
                    </div>
                    {typeof selectedReceipt.receiptFile === 'string' && selectedReceipt.receiptFile.startsWith('data:') && (
                      <div className="flex flex-col gap-2 w-full max-w-[200px]">
                        <a 
                          href={selectedReceipt.receiptFile} 
                          download={selectedReceipt.fileName || 'receipt.pdf'}
                          className="w-full py-2.5 bg-secondary text-white rounded-full font-bold text-sm shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          Download Receipt
                        </a>
                        <a 
                          href={selectedReceipt.receiptFile} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] font-bold text-primary/40 hover:text-secondary transition-colors"
                        >
                          Try opening in Browser
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => handleApprove(selectedReceipt)}
                  disabled={processingId === selectedReceipt.id}
                  className="flex-grow btn-premium bg-green-500 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === selectedReceipt.id ? <Loader2 className="animate-spin" size={20} /> : <><Check size={20} /> Approve Payment</>}
                </button>
                <button 
                  onClick={() => handleReject(selectedReceipt)}
                  disabled={processingId === selectedReceipt.id}
                  className="flex-grow btn-premium bg-red-500 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === selectedReceipt.id ? <Loader2 className="animate-spin" size={20} /> : <><X size={20} /> Reject</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPayments;
