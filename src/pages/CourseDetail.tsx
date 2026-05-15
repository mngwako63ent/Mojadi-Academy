import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Clock, BarChart, CheckCircle2, Users, BookOpen, Video, Award, MessageSquare, Lock } from 'lucide-react';
import { courses } from '../data/courses';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { cn, formatPrice } from '../lib/utils';
import { useCoursePricing } from '../hooks/useCoursePricing';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const email = user?.email?.toLowerCase();
  const isAdmin = userProfile?.role === 'admin' || (email === 'm.ngwako63@gmail.com' || email === 'admin@mojadiacademy.com');
  const { courses, loading: pricingLoading } = useCoursePricing();
  const course = courses.find((c) => c.id === id);
  const courseIndex = courses.findIndex(c => c.id === id);
  
  const [isEnrolled, setIsEnrolled] = React.useState(false);
  const [existingOrder, setExistingOrder] = React.useState<any>(null);
  const [completedModules, setCompletedModules] = React.useState<string[]>([]);
  const [isLocked, setIsLocked] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkStatus = async () => {
      if (user && id) {
        if (isAdmin) {
          setIsLocked(false);
          // Check if enrolled, but don't strictly require it for the UI to show access
          const enrollmentRef = doc(db, 'users', user.uid, 'enrollments', id);
          const enrollmentSnap = await getDoc(enrollmentRef);
          if (enrollmentSnap.exists()) {
            setIsEnrolled(true);
            setCompletedModules(enrollmentSnap.data().completedModules || []);
          }
          setLoading(false);
          return;
        }

        // Check current enrollment
        const enrollmentRef = doc(db, 'users', user.uid, 'enrollments', id);
        const enrollmentSnap = await getDoc(enrollmentRef);
        
        if (enrollmentSnap.exists()) {
          setIsEnrolled(true);
          setCompletedModules(enrollmentSnap.data().completedModules || []);
        } else {
          setIsEnrolled(false);
          setCompletedModules([]);
          
          // Check for existing order
          const q = query(collection(db, 'orders'), where('userId', '==', user.uid), where('courseId', '==', id));
          const orderSnap = await getDocs(q);
          if (!orderSnap.empty) {
            setExistingOrder({ id: orderSnap.docs[0].id, ...orderSnap.docs[0].data() });
          }
        }

        // Check prerequisite course
        if (courseIndex > 0) {
          const prevCourse = courses[courseIndex - 1];
          const prevRef = doc(db, 'users', user.uid, 'enrollments', prevCourse.id);
          const prevSnap = await getDoc(prevRef);
          
          if (!prevSnap.exists() || (prevSnap.data().completedModules?.length || 0) < (prevCourse.modules?.length || 0)) {
            setIsLocked(true);
          }
        }
      }
      setLoading(false);
    };
    checkStatus();
  }, [user, id, courseIndex, courses, isAdmin]);

  const handleEnroll = async () => {
    if (!user || !userProfile) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    if (isLocked) return;

    if (course) {
      try {
        if (course.price === 0 || isAdmin) {
          // Free course or Admin: direct enrollment
          await setDoc(doc(db, 'users', user.uid, 'enrollments', course.id), {
            courseId: course.id,
            courseTitle: course.title,
            enrolledAt: serverTimestamp(),
            progress: 0,
            completedModules: [],
            accessStatus: 'active'
          });
          setIsEnrolled(true);
          navigate('/dashboard');
        } else {
          // Paid course: create order first
          const orderData = {
            userId: user.uid,
            studentId: userProfile.studentId,
            courseId: course.id,
            courseTitle: course.title,
            price: course.price,
            status: 'pending',
            createdAt: serverTimestamp(),
          };
          const orderRef = await addDoc(collection(db, 'orders'), orderData);
          navigate(`/payment/${orderRef.id}`);
        }
      } catch (error) {
        console.error("Error enrolling in course:", error);
      }
    }
  };

  if (pricingLoading) {
    return <div className="pt-32 pb-32 text-center">Loading course...</div>;
  }

  if (!course) {
    return (
      <div className="pt-32 pb-32 text-center">
        <h2 className="text-3xl font-bold">Course not found</h2>
        <button onClick={() => navigate('/courses')} className="mt-4 text-secondary hover:underline">
          Back to Courses
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="pt-32 pb-32 text-center space-y-4">
        <h2 className="text-2xl font-bold">Course Not Found</h2>
        <p>The course you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/courses')} className="px-6 py-2 bg-secondary text-white rounded-full font-bold">
          Back to Courses
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="pt-32 pb-32 text-center">Checking enrollment...</div>;
  }

  return (
    <div className="pt-24 pb-16 md:pt-32 md:pb-32 w-full max-w-7xl mx-auto px-4 sm:px-6">
      <button onClick={() => navigate('/courses')} className="flex items-center gap-2 text-primary/60 dark:text-sage hover:text-secondary transition-colors mb-6 md:mb-8 text-sm md:text-base">
        <ArrowLeft size={20} /> Back to Courses
      </button>

      {isLocked && !isAdmin && (
        <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-600">
          <Lock size={24} />
          <div>
            <p className="font-bold">Course Locked</p>
            <p className="text-sm">Complete the previous course to unlock this one.</p>
          </div>
        </div>
      )}

      <div className={cn("space-y-8", (isLocked && !isAdmin) && "opacity-60 pointer-events-none grayscale")}>
        {/* Header */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider rounded-full">
              {course.category}
            </span>
            <span className="px-3 py-1 bg-primary/10 text-primary dark:text-sage text-xs font-bold uppercase tracking-wider rounded-full">
              {course.level}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight">{course.title}</h1>
          <p className="text-base md:text-lg text-primary/70 dark:text-sage max-w-2xl leading-relaxed">{course.description}</p>
          
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-primary/60 dark:text-sage pt-2">
            <div className="flex items-center gap-2"><Star size={18} className="text-yellow-500" /> {course.rating} Rating</div>
            <div className="flex items-center gap-2"><Users size={18} className="text-secondary" /> {course.students} Students</div>
            <div className="flex items-center gap-2"><Clock size={18} className="text-secondary" /> {course.duration}</div>
          </div>
        </div>

        {/* Video Placeholder (Brief Section 6) */}
        <div className="relative group cursor-pointer">
          <div className="aspect-video w-full rounded-[2.5rem] bg-neutral-100 dark:bg-neutral-800 border-4 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center gap-6 overflow-hidden relative shadow-inner">
            {/* Background Image with blur/overlay */}
            <img 
              src={course.image || course.thumbnail || undefined} 
              alt={course.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px] scale-105 group-hover:scale-110 transition-transform duration-700" 
              referrerPolicy="no-referrer" 
            />
            
            <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-white shadow-[0_0_40px_rgba(202,138,4,0.4)] group-hover:scale-110 transition-all duration-300">
                <Video size={40} fill="currentColor" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold text-primary dark:text-white uppercase tracking-tighter">Video content coming soon</h3>
                <p className="text-sm text-primary/40 dark:text-white/40 font-medium">Wait for official production release for full demonstrations.</p>
              </div>
            </div>

            {isLocked && !isAdmin && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Lock size={48} />
                  <span className="font-bold uppercase tracking-widest text-xs">Course Locked</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6 md:space-y-8">
            <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-[2rem]">
              <h3 className="text-xl md:text-2xl font-bold mb-6">What You'll Learn</h3>
              <ul className="space-y-3 sm:space-y-4">
                {(course.learningObjectives && course.learningObjectives.length > 0
                  ? course.learningObjectives
                  : [
                      "Comprehensive understanding of " + course.title.toLowerCase(),
                      "Practical techniques you can apply immediately on your farm",
                      "Best practices used by successful commercial farmers",
                      "How to maximize yield and profitability",
                      "Sustainable and environmentally friendly farming methods"
                    ]
                ).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-secondary/5 dark:bg-white/5 rounded-xl sm:rounded-2xl border border-secondary/10 hover:border-secondary/20 transition-all group">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-secondary/20 transition-colors">
                      <CheckCircle2 size={14} className="text-secondary" />
                    </div>
                    <div 
                      className="prose prose-sm prose-slate max-w-none dark:prose-invert text-primary/80 dark:text-sage font-medium leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Enrollment Card */}
          <div className="lg:relative">
            <div className="glass p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] lg:sticky lg:top-32 shadow-xl border-secondary/10">
              <div className="flex flex-row md:flex-col justify-between items-center md:items-start mb-6 gap-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  {course.price === 0 ? 'Free' : formatPrice(course.price)}
                </h2>
                {isEnrolled && (
                  <span className="px-3 py-1 bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                    Enrolled
                  </span>
                )}
              </div>
              <button 
                onClick={
                  isEnrolled 
                    ? () => {
                        const firstModuleId = course.modules?.[0]?.id;
                        if (firstModuleId) {
                          navigate(`/learning/${course.id}/${firstModuleId}`);
                        } else {
                          navigate(`/learning/${course.id}`);
                        }
                      }
                    : existingOrder 
                    ? () => navigate(`/payment/${existingOrder.id}`)
                    : handleEnroll
                }
                className="w-full btn-premium bg-primary dark:bg-sage text-white dark:text-neutral-dark hover:bg-accent dark:hover:bg-sage-bright text-base md:text-lg py-3 md:py-4 mb-6 rounded-full shadow-lg shadow-primary/20"
              >
                {isEnrolled ? 'Continue Learning' : existingOrder ? 'Finish Payment' : 'Enroll Now'}
              </button>
              <div className="space-y-3 sm:space-y-4 text-sm text-primary/70 dark:text-sage">
                <p className="font-bold text-primary dark:text-sage border-b border-black/5 pb-2">This course includes:</p>
                <div className="flex items-center gap-3"><BookOpen size={16} className="text-secondary" /> {course.modules?.length || 0} Modules</div>
                <div className="flex items-center gap-3"><Video size={16} className="text-secondary" /> Video Lessons</div>
                <div className="flex items-center gap-3"><Clock size={16} className="text-secondary" /> {course.duration} Duration</div>
                <div className="flex items-center gap-3"><Award size={16} className="text-secondary" /> Certificate of Completion</div>
                <div className="flex items-center gap-3"><MessageSquare size={16} className="text-secondary" /> Community Access</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="glass p-8 rounded-[2rem]">
          <h3 className="text-2xl font-bold mb-6">Course Curriculum</h3>
          <div className="space-y-4">
            {course.modules?.map((module, index) => {
              const isCompleted = completedModules.includes(module.id);
              const isFirstModule = index === 0;
              const isPrevCompleted = index > 0 && course.modules && completedModules.includes(course.modules[index - 1]?.id || '');
              const isLocked = !isAdmin && !isFirstModule && !isPrevCompleted && !isCompleted;
              const isCurrent = (isFirstModule || isPrevCompleted) && !isCompleted;

              return (
                <div 
                  key={module.id} 
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl transition-all",
                    isLocked ? "bg-black/5 dark:bg-white/5 opacity-60" : "bg-black/5 dark:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                      isCompleted ? "bg-green-500/20 text-green-500" : "bg-primary/10 text-primary dark:text-sage"
                    )}>
                      {isCompleted ? <CheckCircle2 size={20} /> : index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{module.title}</h4>
                        {isLocked && <Lock size={14} className="text-primary/40" />}
                        {isCurrent && <span className="text-[10px] font-black uppercase tracking-widest text-secondary px-2 py-0.5 bg-secondary/10 rounded-full">In Progress</span>}
                      </div>
                      <p className="text-sm text-primary/60 dark:text-sage">{module.duration}</p>
                      {module.learningObjectives && module.learningObjectives.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Module Objectives:</p>
                          <ul className="space-y-2">
                            {module.learningObjectives.map((obj: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-primary/70 dark:text-sage">
                                <CheckCircle2 size={12} className="text-secondary shrink-0 mt-0.5" />
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  { (isEnrolled || isAdmin) && (
                    <div className="flex items-center gap-4">
                      {isLocked ? (
                        <span className="text-xs font-bold text-primary/40 italic">Locked</span>
                      ) : (
                        <button 
                          onClick={() => navigate(`/learning/${course.id}/${module.id}`)}
                          className="text-secondary font-bold hover:underline"
                        >
                          {isCompleted ? 'Review' : 'Start'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
