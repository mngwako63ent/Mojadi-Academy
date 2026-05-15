import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreVertical,
  ChevronRight,
  Loader2,
  Filter,
  DollarSign,
  User as UserIcon,
  Eye,
  Check,
  X
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, getDocs, setDoc } from 'firebase/firestore';
import { cn, formatPrice } from '../../lib/utils';

// Reusing component logic from current AdminPayments
const PdfViewer = ({ data, fileName }: { data: string, fileName?: string }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
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
      return () => URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to create blob for PDF preview", e);
    }
  }, [data]);

  if (!blobUrl) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-secondary" /></div>;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <iframe src={blobUrl} className="flex-grow w-full border-none rounded-t-[2.5rem]" title="PDF Receipt" />
      <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-white rounded-b-[2.5rem]">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-secondary" />
          <span className="text-xs font-bold text-slate-400 truncate">{fileName || 'receipt.pdf'}</span>
        </div>
        <a href={blobUrl} target="_blank" rel="noreferrer" className="px-6 py-2 bg-secondary text-white text-xs font-bold rounded-full shadow-lg shadow-secondary/30">
          Pop-out View
        </a>
      </div>
    </div>
  );
};

import { useFeedback } from '../../components/FeedbackContext';

const OrderManagement = () => {
  const { confirm, toast } = useFeedback();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'payment_receipts'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReceipts(docs.sort((a: any, b: any) => (b.uploadedAt?.toMillis() || 0) - (a.uploadedAt?.toMillis() || 0)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (receipt: any) => {
    setProcessingId(receipt.id);
    try {
      // Approve order
      await updateDoc(doc(db, 'orders', receipt.orderId), { status: 'activated' });
      
      // Update enrollment
      const enrollmentPath = `users/${receipt.userId}/enrollments/${receipt.courseId}`;
      await setDoc(doc(db, enrollmentPath), {
        courseId: receipt.courseId,
        courseTitle: receipt.courseTitle,
        activatedAt: serverTimestamp(),
        enrolledAt: receipt.uploadedAt || serverTimestamp(),
        accessStatus: 'active',
        progress: 0,
        completedModules: []
      }, { merge: true });

      // Approve receipt
      await updateDoc(doc(db, 'payment_receipts', receipt.id), {
        status: 'approved',
        processedAt: serverTimestamp()
      });
      
      toast("Receipt approved. Course activated.", "success");
      setSelectedReceipt(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `receipts/${receipt.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (receipt: any) => {
    const isConfirmed = await confirm("Are you sure you want to reject this payment receipt?");
    if (!isConfirmed) return;
    setProcessingId(receipt.id);
    try {
      await updateDoc(doc(db, 'orders', receipt.orderId), { status: 'pending' });
      await updateDoc(doc(db, 'payment_receipts', receipt.id), {
        status: 'rejected',
        processedAt: serverTimestamp()
      });
      toast("Receipt rejected.", "warning");
      setSelectedReceipt(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `receipts/${receipt.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = receipts.filter(r => {
    const matchesSearch = r.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-32">
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="px-1">
            <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 mb-2">Order & Payment Review</h1>
            <p className="text-slate-500 text-sm font-medium">Verify bank transfers and activate course access.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
             {['all', 'pending', 'approved', 'rejected'].map((s) => (
                <button 
                   key={s}
                   onClick={() => setFilterStatus(s as any)}
                   className={cn(
                     "flex-1 md:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold transition-all border uppercase tracking-tighter min-w-[80px]",
                     filterStatus === s 
                       ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                       : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                   )}
                >
                   {s}
                </button>
             ))}
          </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <AnimatePresence>
             {filtered.map((r) => (
                <motion.div
                   key={r.id}
                   layout
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all p-6 md:p-8 space-y-6 flex flex-col group"
                >
                   <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-secondary relative">
                         <CreditCard size={24} />
                         {r.status === 'pending' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white" />}
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        r.status === 'pending' ? "bg-orange-50 text-orange-600" : 
                        r.status === 'approved' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      )}>
                        {r.status}
                      </span>
                   </div>

                   <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-900 leading-tight group-hover:text-secondary transition-colors">{r.courseTitle}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <p className="text-[10px] font-bold text-secondary font-mono bg-secondary/5 px-2 py-0.5 rounded-md">{r.studentId}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Student ID</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                         <div className="flex items-center gap-2 text-slate-400">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold uppercase">{r.uploadedAt?.toDate()?.toLocaleDateString('en-GB') || 'Today'}</span>
                         </div>
                         <p className="text-xl font-display font-black text-slate-900">R{r.price}</p>
                      </div>
                   </div>

                   <div className="pt-4 flex gap-3">
                      <button 
                        onClick={() => setSelectedReceipt(r)}
                        className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                      >
                         <Eye size={16} /> View Proof
                      </button>
                      {r.status === 'pending' && (
                         <div className="flex gap-2">
                            <button 
                               onClick={() => handleApprove(r)}
                               disabled={processingId === r.id}
                               className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/10"
                            >
                               {processingId === r.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={20} />}
                            </button>
                            <button 
                               onClick={() => handleReject(r)}
                               disabled={processingId === r.id}
                               className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/10"
                            >
                               {processingId === r.id ? <Loader2 size={18} className="animate-spin" /> : <X size={20} />}
                            </button>
                         </div>
                      )}
                   </div>
                </motion.div>
             ))}
          </AnimatePresence>
       </div>

       {/* Receipt Modal */}
       <AnimatePresence>
          {selectedReceipt && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                <motion.div
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="w-full max-w-4xl h-[80vh] flex flex-col"
                >
                   <PdfViewer data={selectedReceipt.receiptFile} fileName={selectedReceipt.fileName} />
                   <button 
                      onClick={() => setSelectedReceipt(null)}
                      className="absolute -top-12 right-0 text-white flex items-center gap-2 font-bold hover:text-secondary transition-colors"
                   >
                      <XCircle /> Close Preview
                   </button>
                </motion.div>
             </div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default OrderManagement;
