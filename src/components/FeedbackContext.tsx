import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

type ModalType = 'alert' | 'confirm';
type ModalStyle = 'info' | 'success' | 'danger' | 'warning';

interface ModalOptions {
  title: string;
  message: string;
  type?: ModalType;
  style?: ModalStyle;
  confirmText?: string;
  cancelText?: string;
}

interface FeedbackContextType {
  alert: (options: Omit<ModalOptions, 'type'> | string) => Promise<void>;
  confirm: (options: Omit<ModalOptions, 'type'> | string) => Promise<boolean>;
  toast: (message: string, style?: ModalStyle) => void;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used within FeedbackProvider');
  return context;
};

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ModalOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const [toasts, setToasts] = useState<{ id: string; message: string; style: ModalStyle }[]>([]);

  const showAlert = async (options: Omit<ModalOptions, 'type'> | string): Promise<void> => {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { title: 'Notification', message: options, style: 'info' as ModalStyle } : options;
      setModalState({
        isOpen: true,
        options: { ...opts, type: 'alert' },
        resolve: (val) => resolve()
      });
    });
  };

  const showConfirm = async (options: Omit<ModalOptions, 'type'> | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { title: 'Confirm Action', message: options, style: 'danger' as ModalStyle } : options;
      setModalState({
        isOpen: true,
        options: { ...opts, type: 'confirm' },
        resolve
      });
    });
  };

  const showToast = (message: string, style: ModalStyle = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, style }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleCloseModal = (value: boolean) => {
    if (modalState) {
      modalState.resolve(value);
      setModalState(null);
    }
  };

  return (
    <FeedbackContext.Provider value={{ alert: showAlert, confirm: showConfirm, toast: showToast }}>
      {children}

      <AnimatePresence>
        {modalState?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {modalState.options.style === 'danger' ? (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                      <AlertCircle size={20} />
                    </div>
                  ) : modalState.options.style === 'success' ? (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                      <Info size={20} />
                    </div>
                  )}
                  <div className="pt-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {modalState.options.title || (modalState.options.type === 'confirm' ? 'Confirm Action' : 'Notification')}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      {modalState.options.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-3xl">
                {modalState.options.type === 'confirm' && (
                  <button
                    onClick={() => handleCloseModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {modalState.options.cancelText || 'Cancel'}
                  </button>
                )}
                <button
                  onClick={() => handleCloseModal(true)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-md",
                    modalState.options.style === 'danger' 
                      ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
                      : modalState.options.style === 'success'
                        ? "bg-green-500 hover:bg-green-600 shadow-green-500/20"
                        : "bg-primary hover:bg-primary/90 shadow-primary/20"
                  )}
                >
                  {modalState.options.confirmText || (modalState.options.type === 'confirm' ? 'Confirm' : 'OK')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold pointer-events-auto",
                toast.style === 'danger' ? "bg-red-500 text-white" :
                toast.style === 'success' ? "bg-green-500 text-white" :
                toast.style === 'warning' ? "bg-orange-500 text-white" :
                "bg-slate-800 text-white"
              )}
            >
              {toast.style === 'danger' && <AlertCircle size={16} />}
              {toast.style === 'success' && <CheckCircle2 size={16} />}
              {toast.style === 'warning' && <AlertCircle size={16} />}
              {toast.style === 'info' && <Info size={16} />}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </FeedbackContext.Provider>
  );
};
