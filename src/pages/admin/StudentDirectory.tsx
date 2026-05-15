import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  User, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Award, 
  ArrowRight,
  Filter,
  MoreHorizontal,
  Mail,
  ShieldAlert,
  Loader2,
  FileText
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { courses } from '../../data/courses';
import { useFeedback } from '../../components/FeedbackContext';

const StudentDirectory = () => {
  const { confirm, toast } = useFeedback();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(docs);
      setLoading(false);
    });

    const fetchCourses = async () => {
      const q = query(collection(db, 'courses'));
      const snap = await getDocs(q);
      setAvailableCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCourses();

    return () => unsub();
  }, []);

  const fetchStudentDetails = async (student: any) => {
    setSelectedStudent(student);
    try {
      const q = query(collection(db, 'users', student.id, 'enrollments'));
      const snap = await getDocs(q);
      setEnrollments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualEnroll = async () => {
    if (!selectedStudent || !enrollingCourseId) return;
    const course = availableCourses.find(c => c.id === enrollingCourseId);
    if (!course) return;

    try {
      const enrollmentData = {
        courseId: course.id,
        courseTitle: course.title,
        enrolledAt: serverTimestamp(),
        progress: 0,
        completedLessons: [],
        accessStatus: 'Active',
        paymentStatus: 'Manual Approval'
      };

      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', selectedStudent.id, 'enrollments', course.id), enrollmentData);
      
      // Update local state
      setEnrollments(prev => [...prev, enrollmentData]);
      setIsEnrolling(false);
      setEnrollingCourseId('');
      toast(`Student successfully enrolled in ${course.title}`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${selectedStudent.id}/enrollments`);
    }
  };

  const handleToggleRole = async () => {
    if (!selectedStudent) return;
    const newRole = selectedStudent.role === 'admin' ? 'student' : 'admin';
    const isConfirmed = await confirm(`Change ${selectedStudent.displayName}'s role to ${newRole}?`);
    if (!isConfirmed) return;

    try {
      await updateDoc(doc(db, 'users', selectedStudent.id), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      setSelectedStudent({ ...selectedStudent, role: newRole });
      toast("Role updated successfully.", 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${selectedStudent.id}`);
    }
  };

  const formatLastSeen = (timestamp: any, isOnline: boolean) => {
    if (isOnline) return "Active Now";
    if (!timestamp) return "Never seen";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredStudents = students.filter(s => 
    s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
       <div>
          <h1 className="text-3xl font-display font-black text-slate-900 mb-2">Student Directory</h1>
          <p className="text-slate-500 font-medium">Monitor learner progress, certificates, and engagement.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Directory List */}
           <div className="lg:col-span-3 space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by name, ID or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-3.5 bg-white rounded-2xl border border-slate-200 outline-none focus:border-secondary transition-all text-sm font-medium shadow-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <Filter size={16} /> Filters
                  </button>
                  <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <th className="px-8 py-6">Student</th>
                             <th className="px-8 py-6">Status</th>
                             <th className="px-8 py-6">Progress</th>
                             <th className="px-8 py-6">Certificates</th>
                             <th className="px-8 py-6 text-right">Activity</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {filteredStudents.map((s) => (
                            <tr 
                              key={s.id} 
                              onClick={() => fetchStudentDetails(s)}
                              className={cn(
                                "hover:bg-slate-50/80 transition-all cursor-pointer group",
                                selectedStudent?.id === s.id && "bg-slate-50"
                              )}
                            >
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-display font-black text-slate-400 group-hover:text-secondary group-hover:bg-secondary/10 transition-all">
                                        {s.displayName?.[0] || 'S'}
                                     </div>
                                     <div>
                                        <p className="font-bold text-slate-900 leading-tight">{s.displayName || 'Unnamed student'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{s.studentId || 'No ID'}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-2">
                                     <div className={cn(
                                       "w-2 h-2 rounded-full",
                                       s.isOnline ? "bg-green-500 animate-pulse" : "bg-slate-300"
                                     )} />
                                     <span className={cn(
                                       "text-xs font-bold",
                                       s.isOnline ? "text-green-600" : "text-slate-400"
                                     )}>{s.isOnline ? 'Online' : 'Offline'}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="w-24">
                                     <div className="flex justify-between text-[8px] font-bold uppercase mb-1">
                                        <span className="text-secondary">Progress</span>
                                        <span className="text-slate-400">0%</span>
                                     </div>
                                     <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-secondary rounded-full" style={{ width: '0%' }} />
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-2 text-slate-300">
                                     <Award size={18} />
                                     <span className="text-xs font-bold">0</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <p className="text-xs font-bold text-slate-900">{formatLastSeen(s.lastSeen, s.isOnline)}</p>
                                  <p className="text-[10px] text-slate-400 font-medium mt-1">Last activity</p>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>

           {/* Details Sidebar */}
           <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                 {selectedStudent ? (
                    <motion.div
                      key={selectedStudent.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col sticky top-24"
                    >
                       <div className="p-8 bg-slate-50 border-b border-slate-100 text-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5">
                             <User size={120} />
                          </div>
                          <div className="relative z-10">
                            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-slate-200 mx-auto flex items-center justify-center font-display font-black text-4xl text-primary border border-slate-100 mb-4">
                               {selectedStudent.displayName?.[0] || 'S'}
                            </div>
                            <h3 className="text-2xl font-display font-bold text-slate-900">{selectedStudent.displayName}</h3>
                            <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1 font-mono">{selectedStudent.studentId}</p>
                          </div>
                       </div>

                       <div className="p-8 space-y-8 flex-grow overflow-y-auto max-h-[500px]">
                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Mail size={12} /> Contact Information
                             </h4>
                             <p className="text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 break-all">
                                {selectedStudent.email}
                             </p>
                          </div>

                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enrollments</h4>
                                <span className={cn(
                                   "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-secondary/10 text-secondary"
                                )}>{enrollments.length} Active</span>
                             </div>
                             
                             <div className="space-y-3">
                                {enrollments.length === 0 ? (
                                   <div className="p-6 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                                      <p className="text-xs text-slate-400 font-medium">No active enrollments</p>
                                   </div>
                                ) : (
                                  enrollments.map((en, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-secondary/30 transition-all">
                                       <div className="flex items-center justify-between gap-4">
                                          <div className="min-w-0">
                                             <p className="text-xs font-bold text-slate-900 truncate">{en.courseTitle}</p>
                                             <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                                               {en.accessStatus || 'Active'}
                                             </p>
                                          </div>
                                          <button className="p-2 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all text-secondary">
                                             <ArrowRight size={14} />
                                          </button>
                                       </div>
                                    </div>
                                  ))
                                )}
                             </div>
                          </div>
                       </div>

                       <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                          {!isEnrolling ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                  onClick={() => setIsEnrolling(true)}
                                  className="py-3.5 bg-secondary text-white rounded-2xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-secondary/20"
                                >
                                   Enroll
                                </button>
                                <button 
                                  onClick={handleToggleRole}
                                  className="py-3.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-xs font-bold hover:bg-primary/20 transition-all font-mono"
                                >
                                   {selectedStudent.role === 'admin' ? 'Make Student' : 'Make Admin'}
                                </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                               <select 
                                 value={enrollingCourseId}
                                 onChange={(e) => setEnrollingCourseId(e.target.value)}
                                 className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                               >
                                  <option value="">Select Course...</option>
                                  {availableCourses
                                    .filter(c => !enrollments.some(e => e.courseId === c.id))
                                    .map(c => <option key={c.id} value={c.id}>{c.title}</option>)
                                  }
                               </select>
                               <div className="flex gap-2">
                                  <button onClick={() => setIsEnrolling(false)} className="flex-1 py-2 text-[10px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm">Cancel</button>
                                  <button onClick={handleManualEnroll} className="flex-1 py-2 text-[10px] font-bold text-white bg-primary rounded-lg shadow-md hover:bg-primary/90 transition-all">Enroll Now</button>
                               </div>
                            </div>
                          )}
                          <a 
                            href={`mailto:${selectedStudent.email}`}
                            className="w-full py-3.5 bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                             Email Learner
                          </a>
                       </div>
                    </motion.div>
                 ) : (
                    <div className="h-full bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center text-slate-300">
                       <User size={64} className="mb-4 opacity-20" />
                       <h4 className="font-display font-bold text-slate-400">Select a Student</h4>
                       <p className="text-[10px] font-medium mt-1">View detailed profiles and progress.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>
        </div>
    </div>
  );
};

export default StudentDirectory;
