import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CreditCard, Landmark, Receipt, CheckCircle, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../components/AuthContext';
import { cn, formatPrice } from '../lib/utils';

const Payment = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const orderSnap = await getDoc(doc(db, 'orders', orderId));
        if (orderSnap.exists()) {
          setOrder({ id: orderSnap.id, ...orderSnap.data() });
        } else {
          setError("Order not found");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleUploadReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !userProfile) return;

    setUploading(true);
    try {
      // Create payment receipt record
      await addDoc(collection(db, 'payment_receipts'), {
        orderId: order.id,
        studentId: userProfile.studentId,
        userId: user?.uid,
        courseId: order.courseId,
        courseTitle: order.courseTitle,
        studentName: userProfile.displayName || userProfile.email,
        price: order.price,
        receiptFile: "receipt_uploaded_placeholder.pdf", // Mock file
        status: 'pending',
        uploadedAt: serverTimestamp()
      });

      // Update order status to 'paid' (meaning receipt submitted)
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'paid'
      });

      setReceiptUploaded(true);
    } catch (err) {
      console.error("Error uploading receipt:", err);
      setError("Failed to submit receipt");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 flex justify-center">
        <Loader2 className="animate-spin text-secondary" size={48} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="pt-32 text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-500">{error || "Something went wrong"}</h2>
        <button onClick={() => navigate('/courses')} className="text-secondary hover:underline flex items-center justify-center gap-2 mx-auto">
          <ArrowLeft size={20} /> Back to Courses
        </button>
      </div>
    );
  }

  if (receiptUploaded) {
    return (
      <div className="pt-32 pb-32 max-w-2xl mx-auto px-6 text-center space-y-8">
        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-4xl font-display font-bold">Receipt Submitted!</h2>
        <p className="text-lg text-primary/70 dark:text-sage">
          Thank you for your payment. Your course will be activated once the payment is verified by the admin.
        </p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn-premium bg-primary text-white px-8 py-3 rounded-full"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 max-w-4xl mx-auto px-6">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Order Details */}
        <div className="space-y-8">
          <div className="space-y-2">
            <span className="text-secondary font-bold uppercase tracking-widest text-sm">Order Summary</span>
            <h1 className="text-3xl font-display font-bold">{order.courseTitle}</h1>
            <p className="text-4xl font-bold text-primary dark:text-sage">{formatPrice(order.price)}</p>
          </div>

          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Landmark size={20} className="text-secondary" /> Bank Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-black/5 pb-2">
                <span className="text-primary/60">Bank Name</span>
                <span className="font-bold">FNB</span>
              </div>
              <div className="flex justify-between border-b border-black/5 pb-2">
                <span className="text-primary/60">Account Name</span>
                <span className="font-bold">Mojadi Academy</span>
              </div>
              <div className="flex justify-between border-b border-black/5 pb-2">
                <span className="text-primary/60">Account Number</span>
                <span className="font-bold">62849510237</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-primary/60">Branch Code</span>
                <span className="font-bold">250655</span>
              </div>
            </div>
          </div>

          <div className="bg-secondary/10 p-6 rounded-2xl border border-secondary/20">
            <h3 className="font-bold text-secondary flex items-center gap-2 mb-2">
              <Receipt size={20} /> Payment Reference
            </h3>
            <p className="text-sm text-primary/70 dark:text-sage mb-4">
              Please use your **Student ID** as the payment reference to ensure faster verification.
            </p>
            <div className="bg-white dark:bg-neutral-dark p-4 rounded-xl border-2 border-dashed border-secondary/30 text-center">
              <span className="text-2xl font-mono font-black text-secondary tracking-wider">
                {userProfile?.studentId}
              </span>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-3xl space-y-6">
            <h2 className="text-2xl font-bold">Submit Proof of Payment</h2>
            <p className="text-sm text-primary/60 dark:text-sage">
              Once you have made the transfer, please upload your receipt below.
            </p>

            <form onSubmit={handleUploadReceipt} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold">Upload PDF or Image</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    className="hidden" 
                    id="receipt-upload"
                    accept="application/pdf,image/*"
                    required
                  />
                  <label 
                    htmlFor="receipt-upload"
                    className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl hover:border-secondary transition-all cursor-pointer group-hover:bg-black/5"
                  >
                    <Upload size={32} className="text-primary/40 group-hover:text-secondary mb-2 transition-colors" />
                    <span className="text-sm font-medium text-primary/60">Click to select file</span>
                  </label>
                </div>
              </div>

              <button 
                type="submit"
                disabled={uploading}
                className="w-full btn-premium bg-secondary text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Confirm Payment
                  </>
                )}
              </button>
            </form>

            <p className="text-[10px] text-center text-primary/40 italic">
              * Verification usually take 12-24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
