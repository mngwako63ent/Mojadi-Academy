import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Printer, Shield, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

interface CertificateProps {
  learnerName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  onClose?: () => void;
}

const Certificate: React.FC<CertificateProps> = ({
  learnerName,
  courseName,
  completionDate,
  certificateId,
  onClose
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const [isDownloading, setIsDownloading] = React.useState(false);

  const downloadPDF = async () => {
    if (!certificateRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const element = certificateRef.current;
      
      // High quality capture
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Force sRGB for the cloned document to avoid oklab/oklch issues in html2canvas
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * { 
              color-scheme: light !important;
            }
            /* Force basic colors for common components if oklab is still present */
            [style*="okl"], [class*="primary"], [class*="secondary"] {
              /* Add fallback colors if necessary, but manual rgba should handle most */
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate aspect ratio to fit A4 perfectly
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
      const FinalWidth = imgProps.width * ratio;
      const FinalHeight = imgProps.height * ratio;
      
      // Center on page
      const x = (pdfWidth - FinalWidth) / 2;
      const y = (pdfHeight - FinalHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, FinalWidth, FinalHeight);
      pdf.save(`Mojadi-Certificate-${learnerName.split(' ')[0]}.pdf`);
    } catch (error) {
      console.error("Certificate download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header Actions */}
        <div className="absolute top-6 right-6 z-20 flex gap-3 print:hidden">
          <button 
            onClick={downloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7C5E3C] text-white rounded-full font-bold shadow-lg shadow-[#7C5E3C]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> 
                Download PDF
              </>
            )}
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2.5 bg-[rgba(12,62,47,0.1)] text-[#0C3E2F] rounded-full font-bold hover:bg-[rgba(12,62,47,0.2)] transition-all"
          >
            <Printer size={18} /> Print
          </button>
          <button 
            onClick={onClose}
            className="p-2.5 bg-black/5 hover:bg-black/10 rounded-full text-[#0C3E2F]/40 transition-all"
          >
            <Shield size={24} className="rotate-45" /> {/* Using Shield as a stylized close or similar */}
            <span className="sr-only">Close</span>
            <div className="w-6 h-6 flex items-center justify-center text-xl font-bold">×</div>
          </button>
        </div>

        {/* Certificate Content - This is what gets captured for PDF */}
        <div ref={certificateRef} className="relative p-12 bg-white aspect-[1.414/1] flex flex-col items-center justify-center text-center overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 border-[20px]" style={{ borderColor: 'rgba(124, 94, 60, 0.05)' }} />
          <div className="absolute inset-8 border" style={{ borderColor: 'rgba(124, 94, 60, 0.2)' }} />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" style={{ backgroundColor: 'rgba(124, 94, 60, 0.05)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" style={{ backgroundColor: 'rgba(12, 62, 47, 0.05)' }} />
          
          {/* Logo Section */}
          <div className="relative z-10 mb-8 flex flex-col items-center">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-4 transition-shadow" style={{ backgroundColor: '#0C3E2F', color: '#B2AC88', boxShadow: '0 20px 25px -5px rgba(12, 62, 47, 0.2)' }}>
              <Award size={48} />
            </div>
            <h3 className="text-2xl font-display font-black tracking-tighter" style={{ color: '#0C3E2F' }}>MOJADI ACADEMY</h3>
            <div className="w-12 h-1 mt-2" style={{ backgroundColor: '#7C5E3C' }} />
          </div>

          {/* Main Text */}
          <div className="relative z-10 space-y-4 mb-8">
            <p className="font-bold uppercase tracking-[0.4em] text-sm" style={{ color: '#7C5E3C' }}>Certificate of Completion</p>
            <p className="font-medium" style={{ color: 'rgba(12, 62, 47, 0.6)' }}>This is to certify that</p>
            <h2 className="text-5xl md:text-6xl font-display font-black py-4 px-8 italic border-b-2 inline-block" style={{ color: '#0C3E2F', borderColor: 'rgba(12, 62, 47, 0.1)' }}>
              {learnerName}
            </h2>
            <p className="font-medium max-w-lg mx-auto" style={{ color: 'rgba(12, 62, 47, 0.6)' }}>
              has successfully completed all requirements for the professional course:
            </p>
            <h4 className="text-3xl font-display font-bold" style={{ color: '#7C5E3C' }}>{courseName}</h4>
          </div>

          {/* Details & Signature */}
          <div className="relative z-10 grid grid-cols-3 gap-12 w-full mt-8 pt-12 items-end">
            <div className="text-left space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(12, 62, 47, 0.4)' }}>Date Issued</p>
              <p className="text-lg font-bold" style={{ color: '#0C3E2F' }}>{completionDate}</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 border-2 rounded-full flex items-center justify-center mb-2" style={{ borderColor: 'rgba(124, 94, 60, 0.3)' }}>
                <CheckCircle style={{ color: '#7C5E3C' }} size={40} />
              </div>
              <p className="text-[10px] font-bold uppercase" style={{ color: 'rgba(12, 62, 47, 0.3)' }}>Authenticated</p>
            </div>

            <div className="text-right space-y-4">
              <div className="inline-block border-b pb-1 px-8 text-center italic font-display font-bold text-xl" style={{ color: '#0C3E2F', borderColor: 'rgba(12, 62, 47, 0.2)' }}>
                M. Ngwako
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(12, 62, 47, 0.4)' }}>Authorized Signature</p>
            </div>
          </div>

          {/* Footer ID */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-30">
            <Shield size={12} />
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">ID: {certificateId}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Certificate;
