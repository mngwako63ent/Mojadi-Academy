import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Plus, 
  Search,
  FileImage,
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { useFeedback } from '../../components/FeedbackContext';

const MediaLibrary = () => {
  const { confirm, toast } = useFeedback();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newAsset, setNewAsset] = useState({ key: '', url: '', type: 'image' });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'media_assets'), (snapshot) => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddAsset = async () => {
    if (!newAsset.key || !newAsset.url) return;
    try {
      await addDoc(collection(db, 'media_assets'), {
        ...newAsset,
        updatedAt: serverTimestamp()
      });
      setNewAsset({ key: '', url: '', type: 'image' });
      setIsUploading(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'media_assets');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm("Are you sure you want to remove this asset?");
    if (!isConfirmed) return;
    try {
      await deleteDoc(doc(db, 'media_assets', id));
      toast("Asset removed.", "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `media_assets/${id}`);
    }
  };

  const categories = [
    { key: 'HERO', label: 'Home Heroes' },
    { key: 'ABOUT', label: 'About Visuals' },
    { key: 'COURSES', label: 'Course Thumbnails' },
    { key: 'BRAND', label: 'Logos & Icons' },
  ];

  return (
    <div className="space-y-8 pb-32">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-display font-black text-slate-900 mb-2">Media Library</h1>
            <p className="text-slate-500 font-medium">Manage and override website visuals dynamically.</p>
          </div>
          <button 
            onClick={() => setIsUploading(true)}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all text-sm"
          >
            <Plus size={20} /> Add New Asset
          </button>
       </div>

       <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 shrink-0">
             <Info size={20} />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 text-sm">Visual Overrides</h4>
            <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
              Use this library to override static images across the site. Simply copy the URL of an asset and paste it into the "Visual Management" sections of the pages. For advanced theme control, use the reserved keys (e.g., `HERO_BANNER`).
            </p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
             {assets.map((asset) => (
                <motion.div
                   key={asset.id}
                   layout
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col"
                >
                   <div className="aspect-video relative overflow-hidden bg-slate-100">
                      <img src={asset.url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt={asset.key} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                         <button 
                           onClick={() => window.open(asset.url, '_blank')}
                           className="p-3 bg-white rounded-full text-primary hover:bg-secondary hover:text-white transition-all shadow-xl"
                         >
                            <Eye size={20} />
                         </button>
                         <button 
                           onClick={() => handleDelete(asset.id)}
                           className="p-3 bg-white rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl"
                         >
                            <Trash2 size={20} />
                         </button>
                      </div>
                      <div className="absolute top-4 left-4">
                         <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-full border border-white/20">
                            {asset.type}
                         </span>
                      </div>
                   </div>
                   <div className="p-6 space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis">{asset.key}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Key Reference</p>
                      </div>
                      <button 
                        onClick={() => handleCopy(asset.url, asset.id)}
                        className={cn(
                          "w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border",
                          copiedId === asset.id 
                            ? "bg-green-50 text-green-600 border-green-200" 
                            : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                        )}
                      >
                         {copiedId === asset.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy URL</>}
                      </button>
                   </div>
                </motion.div>
             ))}
          </AnimatePresence>

          {assets.length === 0 && !loading && (
             <div className="lg:col-span-4 p-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50">
                <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
                <h4 className="text-xl font-display font-bold text-slate-400">Library Empty</h4>
                <p className="text-xs text-slate-400 font-medium mt-1">Upload your first asset to start managing visuals.</p>
             </div>
          )}
       </div>

       {/* Upload Modal */}
       <AnimatePresence>
          {isUploading && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden"
                >
                   <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                      <h2 className="text-2xl font-display font-bold">Add Library Asset</h2>
                   </div>
                   <div className="p-8 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Reference Key</label>
                        <input 
                           type="text"
                           value={newAsset.key}
                           onChange={(e) => setNewAsset({...newAsset, key: e.target.value.toUpperCase().replace(/\s+/g, '_')})}
                           placeholder="e.g. ABOUT_PAGE_HERO"
                           className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Image/Video URL</label>
                        <input 
                           type="text"
                           value={newAsset.url}
                           onChange={(e) => setNewAsset({...newAsset, url: e.target.value})}
                           placeholder="https://..."
                           className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <button 
                           onClick={() => setNewAsset({...newAsset, type: 'image'})}
                           className={cn(
                             "py-4 rounded-2xl font-bold text-xs transition-all border flex items-center justify-center gap-2",
                             newAsset.type === 'image' ? "bg-primary text-white border-primary" : "bg-white text-slate-400 border-slate-200"
                           )}
                         >
                            <FileImage size={16} /> Image
                         </button>
                         <button 
                           onClick={() => setNewAsset({...newAsset, type: 'video'})}
                           className={cn(
                             "py-4 rounded-2xl font-bold text-xs transition-all border flex items-center justify-center gap-2",
                             newAsset.type === 'video' ? "bg-primary text-white border-primary" : "bg-white text-slate-400 border-slate-200"
                           )}
                         >
                            <RefreshCw size={16} /> Video
                         </button>
                      </div>
                   </div>
                   <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                      <button onClick={() => setIsUploading(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 border-slate-200">Cancel</button>
                      <button onClick={handleAddAsset} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20">Add to Library</button>
                   </div>
                </motion.div>
             </div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default MediaLibrary;
