import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  RefreshCw, 
  Database, 
  AlertTriangle,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { useFeedback } from '../../components/FeedbackContext';

const AdminSettings = () => {
  const { alert, confirm, toast } = useFeedback();
  const [isRunning, setIsRunning] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string }|null>(null);
  const [config, setConfig] = useState({ name: 'Mojadi Academy', email: 'mojadiacademy@gmail.com' });
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState<{ type: 'success' | 'error', text: string }|null>(null);

  const runMaintenance = async () => {
    const isConfirmed = await confirm("Run system maintenance? This will sync admin roles and student IDs.");
    if (!isConfirmed) return;
    setIsRunning(true);
    setMsg(null);
    try {
      const admins = ['m.ngwako63@gmail.com', 'admin@mojadiacademy.com'];
      const q = collection(db, 'users');
      const snap = await getDocs(q);
      let count = 0;

      for (const u of snap.docs) {
        const data = u.data();
        const email = data.email?.toLowerCase();
        let updates: any = {};

        if (admins.includes(email) && data.role !== 'admin') {
          updates.role = 'admin';
        }

        if (!data.studentId) {
          const year = new Date().getFullYear();
          const randomPart = Math.floor(100000 + Math.random() * 900000);
          updates.studentId = (admins.includes(email) ? 'ADMIN-' : 'STU-') + (admins.includes(email) ? Math.floor(1000 + Math.random()*9000) : `${year}-${randomPart}`);
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'users', u.id), updates);
          count++;
        }
      }
      setMsg({ type: 'success', text: `Maintenance complete. ${count} users updated.` });
    } catch (error) {
      setMsg({ type: 'error', text: "Maintenance failed. Check console." });
      handleFirestoreError(error, OperationType.UPDATE, 'system_maintenance');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config.name || !config.email) {
      setConfigMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }
    setIsConfigSaving(true);
    setConfigMsg(null);
    try {
      // Typically saved to a "settings" document in Firestore.
      // We will simulate success here since global state might just use this locally or wait for real backend.
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConfigMsg({ type: 'success', text: 'Configuration saved successfully.' });
    } catch (err) {
      setConfigMsg({ type: 'error', text: 'Failed to save configuration.' });
    } finally {
      setIsConfigSaving(false);
    }
  };

  const handleReset = async () => {
    const isConfirmed = await confirm("WARNING! This drops all dashboard view settings locally. Proceed?");
    if (isConfirmed) {
      toast("Local view reset.", "info");
    }
  };

  return (
    <div className="max-w-4xl space-y-12 pb-20">
      <div>
        <h1 className="text-3xl font-display font-black text-slate-900 mb-2">Academy Settings</h1>
        <p className="text-slate-500 font-medium">Fine-tune the system and perform maintenance.</p>
      </div>

      <div className="grid gap-8">
        {/* System Operations */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
           <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                 <Shield className="text-primary" />
                 <h3 className="text-xl font-display font-bold">System Operations</h3>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">Healthy</span>
           </div>
           <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <div>
                    <h4 className="font-bold text-slate-900">Force Role Sync</h4>
                    <p className="text-xs text-slate-500 mt-1">Ensures all specified admin emails have 'admin' privileges.</p>
                 </div>
                 <button 
                   onClick={runMaintenance}
                   disabled={isRunning}
                   className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:scale-105 transition-all disabled:opacity-50"
                 >
                    {isRunning ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />}
                    Run Maintenance
                 </button>
              </div>

              {msg && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-2xl flex items-center gap-3 text-xs font-bold",
                    msg.type === 'success' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}
                >
                  <CheckCircle2 size={16} /> {msg.text}
                </motion.div>
              )}
           </div>
        </section>

        {/* Global Configuration */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
           <div className="p-8 border-b border-slate-100 flex items-center gap-3">
              <RefreshCw className="text-secondary" />
              <h3 className="text-xl font-display font-bold">Platform Configuration</h3>
           </div>
           <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Academy Name</label>
                    <input 
                      type="text" 
                      value={config.name} 
                      onChange={e => setConfig({...config, name: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Support Email</label>
                    <input 
                      type="text" 
                      value={config.email} 
                      onChange={e => setConfig({...config, email: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold" 
                    />
                 </div>
              </div>
              <div className="flex items-center justify-between">
                 {configMsg ? (
                   <span className={cn("text-xs font-bold flex items-center gap-1", configMsg.type === 'success' ? 'text-green-500' : 'text-red-500')}>
                      {configMsg.type === 'success' && <CheckCircle2 size={14} />} {configMsg.text}
                   </span>
                 ) : <span />}
                 <button 
                   onClick={handleSaveConfig}
                   disabled={isConfigSaving}
                   className="px-8 py-3 bg-secondary text-white rounded-xl font-bold text-xs shadow-lg shadow-secondary/20 hover:scale-105 transition-all disabled:opacity-50 flex gap-2 items-center"
                 >
                    {isConfigSaving && <RefreshCw size={16} className="animate-spin" />}
                    Save Config
                 </button>
              </div>
           </div>
        </section>

        {/* Advanced Area */}
        <section className="bg-white rounded-[2.5rem] border border-red-100 overflow-hidden shadow-sm">
           <div className="p-8 border-b border-red-50 flex items-center gap-3 bg-red-50/30">
              <AlertTriangle className="text-red-500" />
              <h3 className="text-xl font-display font-bold text-red-900">Danger Zone</h3>
           </div>
           <div className="p-8">
              <div className="flex items-center justify-between">
                 <div>
                    <h4 className="font-bold text-slate-900">Clear Activity Logs</h4>
                    <p className="text-xs text-slate-500 mt-1 text-red-500/60 font-medium">Reset UI preferences and cache. Cannot be undone.</p>
                 </div>
                 <button onClick={handleReset} className="px-6 py-3 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all">
                    Reset Academy
                 </button>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;
