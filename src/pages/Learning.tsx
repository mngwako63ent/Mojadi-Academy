import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, HelpCircle, Award, BookOpen, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Lock, Video } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCoursePricing } from '../hooks/useCoursePricing';

const Learning = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { courses, loading: pricingLoading } = useCoursePricing();
  const { user, userProfile, isAuthReady } = useAuth();
  const email = user?.email?.toLowerCase();
  const isAdmin = userProfile?.role === 'admin' || (email === 'm.ngwako63@gmail.com' || email === 'admin@mojadiacademy.com');
  
  const course = courses.find(c => c.id === courseId);
  const moduleIndex = course?.modules?.findIndex((m: any) => m.id === moduleId) ?? -1;
  const module = course?.modules?.[moduleIndex];
  
  const [currentTopicIndex, setCurrentTopicIndex] = useState(-1); // -1 for Module Overview
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAttempt, setQuizAttempt] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [writtenAnswers, setWrittenAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [score, setScore] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    // Reset assessment state when changing modules
    setShowQuiz(false);
    setQuizAttempt(0);
    setSelectedAnswers({});
    setWrittenAnswers({});
    setQuizSubmitted(false);
    setQuizPassed(false);
    setScore(0);
    setShowBreakdown(false);
    setCurrentTopicIndex(-1);
  }, [moduleId]);
  const [loading, setLoading] = useState(true);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockType, setLockType] = useState<'module' | 'course' | 'payment'>('module');

  const isModuleLocked = (mid: string) => {
    if (isAdmin) return false;
    if (!course?.modules) return false;
    const idx = course.modules.findIndex((m: any) => m.id === mid);
    if (idx <= 0) return false;
    // Check if it was already completed (maybe they are revieweing)
    if (completedModules.includes(mid)) return false;
    // Otherwise check previous module
    return !completedModules.includes(course.modules[idx - 1]?.id || '');
  };

  useEffect(() => {
    const fetchProgress = async () => {
      if (isAuthReady) {
        if (!user) {
          navigate('/login', { state: { from: `/learning/${courseId}/${moduleId}` } });
          return;
        }

        if (courseId && course) {
          if (isAdmin) {
            setIsLocked(false);
            setLoading(false);
            // Fetch enrollment if exists, but don't block if not
            const enrollmentRef = doc(db, 'users', user.uid, 'enrollments', courseId);
            const enrollmentSnap = await getDoc(enrollmentRef);
            if (enrollmentSnap.exists()) {
              setCompletedModules(enrollmentSnap.data().completedModules || []);
            }
            return;
          }

          // Check Course Lock (Prerequisite)
          const courseIndex = courses.findIndex(c => c.id === courseId);
          if (courseIndex > 0) {
            const prevCourse = courses[courseIndex - 1];
            const prevRef = doc(db, 'users', user.uid, 'enrollments', prevCourse.id);
            const prevSnap = await getDoc(prevRef);
            
            if (!prevSnap.exists() || (prevSnap.data().completedModules?.length || 0) < (prevCourse.modules?.length || 0)) {
              setIsLocked(true);
              setLockType('course');
              setLoading(false);
              return;
            }
          }

          const enrollmentRef = doc(db, 'users', user.uid, 'enrollments', courseId);
          const enrollmentSnap = await getDoc(enrollmentRef);
          if (enrollmentSnap.exists()) {
            const data = enrollmentSnap.data();
            
            // Check Access Status (Payment)
            if (data.accessStatus !== 'active') {
              setIsLocked(true);
              setLockType('payment');
              setLoading(false);
              return;
            }

            const completed = data.completedModules || [];
            setCompletedModules(completed);
            
            // Re-check module lock with fresh data
            const idx = course?.modules?.findIndex((m: any) => m.id === moduleId) ?? -1;
            if (idx > 0 && course?.modules && !completed.includes(course.modules[idx-1]?.id || '')) {
              setIsLocked(true);
              setLockType('module');
            } else {
              setIsLocked(false);
            }
          } else {
            // Not enrolled, redirect to course detail
            navigate(`/courses/${courseId}`);
          }
        }
      }
      setLoading(false);
    };
    fetchProgress();
  }, [user, isAuthReady, courseId, moduleId, navigate, course]);

  if (loading || pricingLoading) {
    return (
      <div className="pt-32 text-center flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course || !module) {
    return <div className="pt-32 text-center">Module not found</div>;
  }

  const items = (module.lessons && module.lessons.length > 0 ? module.lessons : module.topics) || [];
  const currentItem = items[currentTopicIndex];

  const getModuleNumber = (title: string, index: number) => {
    const match = title.match(/Module\s+(\d+):/i);
    return match ? match[1] : (index + 1).toString();
  };

  const getModuleTitle = (title: string, index: number) => {
    const num = getModuleNumber(title, index);
    return title.replace(`Module ${num}: `, '').replace(`Module ${num}:`, '').trim();
  };

  const handleNextTopic = () => {
    if (currentTopicIndex < items.length - 1) {
      setCurrentTopicIndex(prev => prev + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handlePrevTopic = () => {
    if (currentTopicIndex > -1) {
      setCurrentTopicIndex(prev => prev - 1);
    }
  };

  const handleQuizSubmit = async () => {
    let allCorrect = false;
    let currentScore = 0;
    
    // Check multiple choice quiz
    if (module.quiz && module.quiz.length > 0) {
      const correctCount = module.quiz.filter(q => selectedAnswers[q.id] === q.correctAnswer).length;
      currentScore = Math.round((correctCount / module.quiz.length) * 100);
      allCorrect = currentScore >= 80;
    } else if (module.assessment) {
      // For written assessments, we check if they've provided some content
      const totalQuestions = module.assessment.sections ? 
        module.assessment.sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0) : 
        1;
      
      const answeredCount = Object.values(writtenAnswers).filter(a => a.trim().length > 10).length;
      currentScore = Math.round((answeredCount / totalQuestions) * 100);
      allCorrect = currentScore >= 80;
    }
    
    setScore(currentScore);
    setQuizPassed(allCorrect);
    setQuizSubmitted(true);
    setQuizAttempt(prev => prev + 1);

    if (allCorrect) {
      if (user && courseId) {
        const isAlreadyCompleted = completedModules.includes(module.id);
        const newCompletedModules = isAlreadyCompleted ? completedModules : [...completedModules, module.id];
        
        const enrollmentRef = doc(db, 'users', user.uid, 'enrollments', courseId);
        await updateDoc(enrollmentRef, {
          completedModules: arrayUnion(module.id),
          progress: Math.round((newCompletedModules.length / (course.modules?.length || 1)) * 100)
        });
        
        if (!isAlreadyCompleted) {
          setCompletedModules(newCompletedModules);
        }
      }
    }
  };

  const handleRetryQuiz = () => {
    setQuizSubmitted(false);
    setSelectedAnswers({});
    setWrittenAnswers({});
    setQuizPassed(false);
    setScore(0);
    setShowBreakdown(false);
  };

  const handleNextModule = () => {
    const nextModule = course?.modules?.[moduleIndex + 1];
    if (nextModule?.id) {
      navigate(`/learning/${courseId}/${nextModule.id}`);
      setCurrentTopicIndex(-1);
      setShowQuiz(false);
      setQuizSubmitted(false);
      setQuizAttempt(0);
      setSelectedAnswers({});
    } else {
      navigate(`/courses/${courseId}`);
    }
  };

  return (
    <div className="pt-20 md:pt-28 pb-16 md:pb-32 min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-4 gap-6 md:gap-8">
        
        {/* Sidebar Navigation - Fixed/Sticky on Desktop, Collapsible or Stays at Top on Mobile */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <button 
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-primary/60 dark:text-sage hover:text-secondary transition-colors mb-2 md:mb-4 text-sm font-bold"
          >
            <ArrowLeft size={16} /> Back to Course Info
          </button>
          
          <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4">
            <h3 className="font-bold text-base md:text-lg border-b border-black/5 dark:border-white/5 pb-3">Course Curriculum</h3>
                   <div className="space-y-2">
                    {course.modules?.map((m, idx) => {
                      if (!m) return null;
                      const locked = isModuleLocked(m.id);
                      const active = m.id === moduleId;
                      const completed = completedModules.includes(m.id);

                      return (
                        <button
                          key={m.id || `mod-${idx}`}
                          disabled={locked}
                          onClick={() => {
                            if (!locked) navigate(`/learning/${courseId}/${m.id}`);
                          }}
                          className={cn(
                            "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all",
                            active ? "bg-primary text-white" : locked ? "opacity-50 cursor-not-allowed" : "hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          <div className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5",
                            active ? "bg-white/20" : "bg-black/10 dark:bg-white/10"
                          )}>
                            {locked ? <Lock size={12} /> : getModuleNumber(m.title, idx)}
                          </div>
                          <span className="text-sm font-medium leading-snug flex-grow">{getModuleTitle(m.title, idx)}</span>
                          {completed && (
                            <CheckCircle2 size={16} className={cn(active ? "text-white" : "text-green-500")} />
                          )}
                        </button>
                      );
                    })}
                  </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {isLocked ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-12 text-center space-y-8 rounded-[2.5rem]"
            >
              <div className="w-20 h-20 bg-primary/10 text-primary dark:text-sage rounded-full flex items-center justify-center mx-auto">
                <Lock size={40} />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-display font-bold">
                  {lockType === 'course' ? 'Course Locked' : lockType === 'payment' ? 'Payment Required' : 'Module Locked'}
                </h2>
                <p className="text-xl text-primary/60 dark:text-sage max-w-md mx-auto">
                  {lockType === 'course' 
                    ? "Complete the previous course to unlock this one." 
                    : lockType === 'payment'
                    ? "Please complete payment to access this course."
                    : "Please complete the previous module before continuing."}
                </p>
              </div>
              <button 
                onClick={() => {
                  if (lockType === 'course' || lockType === 'payment') {
                    navigate('/courses');
                  } else {
                    const idx = course?.modules?.findIndex((m: any) => m.id === moduleId) ?? -1;
                    if (idx > 0 && course?.modules) {
                      navigate(`/learning/${courseId}/${course.modules[idx-1].id}`);
                    }
                  }
                }}
                className="btn-premium bg-primary text-white px-8 py-3 rounded-full"
              >
                {lockType === 'course' || lockType === 'payment' ? 'Browse Courses' : 'Go to Previous Module'}
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {!showQuiz ? (
                <motion.div
                  key={currentTopicIndex === -1 ? 'overview' : currentItem?.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass p-5 sm:p-8 md:p-12 rounded-2xl sm:rounded-[2.5rem] space-y-6 sm:space-y-8 overflow-hidden"
                >
                  {currentTopicIndex === -1 ? (
                    // Module Overview
                    <div className="space-y-6 sm:space-y-8">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-secondary font-bold text-xs sm:text-sm uppercase tracking-widest">
                          <BookOpen size={14} className="sm:size-4" /> Module Overview
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold leading-tight">{module.title}</h1>
                        <p className="text-base sm:text-lg md:text-xl text-primary/70 dark:text-sage leading-relaxed whitespace-pre-wrap">
                          {module.introduction}
                        </p>
                      </div>

                    {/* Video Placeholder (Brief Section 6) */}
                    <div className="relative group cursor-pointer">
                      <div className="aspect-video w-full rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center gap-4 overflow-hidden relative">
                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-white group-hover:scale-110 transition-all duration-300">
                          <Video size={24} fill="currentColor" />
                        </div>
                        <div className="text-center">
                          <h4 className="text-lg font-bold text-primary dark:text-white uppercase tracking-tighter">Video demonstration coming soon</h4>
                          <p className="text-[10px] text-primary/40 dark:text-white/40 font-medium">Recorded at Mojadi Production Facilities</p>
                        </div>
                      </div>
                    </div>

                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                          <Award size={20} className="sm:size-6 text-secondary" />
                          Module Achievement Goals
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                          {module.learningObjectives?.map((obj, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 sm:p-5 bg-secondary/5 dark:bg-white/5 rounded-xl sm:rounded-2xl border border-secondary/10 hover:border-secondary/20 transition-all group">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-secondary/20 transition-colors">
                                <CheckCircle2 size={14} className="sm:size-4 text-secondary" />
                              </div>
                              <div 
                                className="text-sm sm:text-base text-primary/80 dark:text-sage font-medium leading-normal prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: obj }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                    <div className="pt-8 border-t border-black/5 dark:border-white/5 flex justify-end">
                      <button
                        onClick={() => setCurrentTopicIndex(0)}
                        className="flex items-center gap-2 px-8 py-4 rounded-full bg-primary dark:bg-sage text-white dark:text-neutral-dark hover:bg-accent transition-all font-bold text-lg"
                      >
                        Start Learning <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Topic Content
                  <>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-wrap items-center gap-2 text-secondary font-bold text-xs sm:text-sm uppercase tracking-widest">
                        <BookOpen size={14} className="sm:size-4" /> Lesson {currentTopicIndex + 1} of {items.length}
                      </div>
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold leading-tight">{currentItem?.title}</h1>
                    </div>

                    <div className="prose dark:prose-invert max-w-full text-base sm:text-lg text-primary/80 dark:text-sage leading-relaxed break-words">
                      {currentItem?.content?.includes('<') ? (
                        <div className="rich-content" dangerouslySetInnerHTML={{ __html: currentItem.content }} />
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {currentItem?.content || ''}
                        </ReactMarkdown>
                      )}
                    </div>



                    <div className="flex justify-between pt-8 border-t border-black/5 dark:border-white/5">
                      <button
                        onClick={handlePrevTopic}
                        className="flex items-center gap-2 px-6 py-3 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all font-bold"
                      >
                        <ChevronLeft size={20} /> Previous
                      </button>
                      <button
                        onClick={handleNextTopic}
                        className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary dark:bg-sage text-white dark:text-neutral-dark hover:bg-accent transition-all font-bold"
                      >
                        {currentTopicIndex === items.length - 1 ? 'Start Assessment' : 'Next Lesson'} <ChevronRight size={20} />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-8 md:p-12 rounded-[2.5rem] space-y-12"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award size={32} />
                  </div>
                  <h2 className="text-3xl font-display font-bold">Module Assessment</h2>
                  <p className="text-primary/60 dark:text-sage">Test your knowledge to complete this module.</p>
                </div>

                {!quizSubmitted ? (
                  <div className="space-y-10">
                    {module.assessment && (
                      <div className="space-y-12">
                        {module.assessment.description && (
                          <div className="p-6 bg-secondary/5 border-l-4 border-secondary rounded-r-2xl prose dark:prose-invert max-w-none text-lg text-primary/80 dark:text-sage leading-relaxed">
                            <h4 className="text-xl font-bold text-secondary mb-2 flex items-center gap-2">
                              <HelpCircle size={20} /> Instructions
                            </h4>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {module.assessment.description}
                            </ReactMarkdown>
                          </div>
                        )}
                        {module.assessment?.sections && module.assessment.sections.length > 0 ? (
                          module.assessment.sections.map((section: any, sIdx: number) => (
                            <div key={sIdx} className="space-y-8">
                              <div className="space-y-4">
                                {section.description && (
                                  <div className="prose dark:prose-invert max-w-none text-lg text-primary/80 dark:text-sage leading-relaxed overflow-x-auto">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {section.description}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-10">
                                {section.questions?.map((q: any, qIdx: number) => (
                                  <div key={qIdx} className="space-y-4">
                                    <div className="space-y-2">
                                      <span className="font-bold text-lg text-secondary">{q.label}</span>
                                      <p className="text-lg font-medium text-primary/90 dark:text-sage whitespace-pre-wrap">{q.text}</p>
                                    </div>
                                    <div className="relative group">
                                      <div className="absolute top-4 left-4 text-xs font-italic text-black/30 dark:text-white/30 pointer-events-none italic">
                                        Learner response:
                                      </div>
                                      <textarea 
                                        className="w-full h-40 p-4 pt-10 rounded-xl bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 focus:border-secondary outline-none transition-all shadow-sm"
                                        placeholder="Type your answer here (minimum 10 characters)..."
                                        value={writtenAnswers[`${section.title}-${qIdx}`] || ''}
                                        onChange={(e) => setWrittenAnswers(prev => ({ ...prev, [`${section.title}-${qIdx}`]: e.target.value }))}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          // Fallback for old content-based assessments
                          <div className="prose dark:prose-invert max-w-none text-lg text-primary/80 dark:text-sage leading-relaxed overflow-x-auto">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {module.assessment.content}
                            </ReactMarkdown>
                            
                            <div className="mt-8 p-6 bg-secondary/5 border border-secondary/20 rounded-3xl">
                              <h4 className="text-xl font-bold text-secondary mb-4">Your Response</h4>
                              <textarea 
                                className="w-full h-48 p-4 rounded-2xl bg-white dark:bg-black/20 border-2 border-black/5 dark:border-white/5 focus:border-secondary outline-none transition-all"
                                placeholder="Type your assessment answers here..."
                                value={writtenAnswers['fallback'] || ''}
                                onChange={(e) => setWrittenAnswers(prev => ({ ...prev, 'fallback': e.target.value }))}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {module.quiz && module.quiz.length > 0 && module.quiz.map((q, idx) => {
                      if (!q) return null;
                      return (
                        <div key={q.id || `q-${idx}`} className="space-y-6">
                          <h4 className="text-xl font-bold flex gap-3">
                            <span className="text-secondary">{idx + 1}.</span>
                            {q.question}
                          </h4>
                          <div className="grid gap-3">
                            {q.options?.map((option, optIdx) => (
                              <button
                                key={optIdx}
                                onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                className={cn(
                                  "w-full p-4 rounded-2xl text-left border-2 transition-all font-medium",
                                  selectedAnswers[q.id] === optIdx 
                                    ? "border-secondary bg-secondary/5 text-secondary" 
                                    : "border-black/5 dark:border-white/5 hover:border-primary/20"
                                )}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <button
                      onClick={handleQuizSubmit}
                      disabled={
                        (module.quiz?.length > 0 && Object.keys(selectedAnswers).length < module.quiz.length) ||
                        (module.assessment && Object.keys(writtenAnswers).length === 0)
                      }
                      className="w-full py-4 rounded-full bg-primary dark:bg-sage text-white dark:text-neutral-dark font-bold text-lg hover:bg-accent disabled:opacity-50 transition-all"
                    >
                      Submit Assessment
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-8 py-8">
                    {quizPassed ? (
                      <div className="space-y-6">
                        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 size={48} />
                        </div>
                        <h3 className="text-3xl font-bold text-green-600">Congratulations!</h3>
                        <p className="text-lg text-primary/70 dark:text-sage">You have successfully completed {module.title}.</p>
                        
                        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-secondary/5 p-4 sm:p-6 rounded-2xl border border-secondary/10">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-primary/40 dark:text-white/40">Total Score</span>
                            <span className={cn("text-2xl sm:text-3xl", isPassing ? "text-green-600" : "text-amber-600")}>{score}%</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-primary/40 dark:text-white/40">Attempt</span>
                            <span className="text-2xl sm:text-3xl text-primary dark:text-sage">{quizAttempt}</span>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="flex items-center gap-2 mx-auto px-6 py-2 rounded-full bg-black/5 dark:bg-white/5 text-sm font-bold border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                          >
                            {showBreakdown ? (
                              <>Hide Answer Breakdown <ChevronUp size={16} /></>
                            ) : (
                              <>Show Answer Breakdown <ChevronDown size={16} /></>
                            )}
                          </button>
                        </div>

                        <AnimatePresence>
                          {showBreakdown && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden space-y-8"
                            >
                              {/* Summary Stats */}
                              {module.quiz && module.quiz.length > 0 && (
                                <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-8 px-4 sm:px-0">
                                  <div className="p-4 bg-green-500/5 rounded-xl sm:rounded-2xl border border-green-500/10 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600 block mb-1">Correct Questions</span>
                                    <span className="text-xl sm:text-2xl font-bold text-green-600">
                                      {module.quiz.filter(q => selectedAnswers[q.id] === q.correctAnswer).length}
                                    </span>
                                  </div>
                                  <div className="p-4 bg-red-500/5 rounded-xl sm:rounded-2xl border border-red-500/10 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-1">Incorrect Questions</span>
                                    <span className="text-xl sm:text-2xl font-bold text-red-600">
                                      {module.quiz.filter(q => selectedAnswers[q.id] !== q.correctAnswer).length}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Results Breakdown */}
                              <div className="max-w-3xl mx-auto text-left space-y-6 pt-8 border-t border-black/5 dark:border-white/5">
                                <h4 className="text-xl font-bold flex items-center gap-2">
                                  <Award size={20} className="text-secondary" /> Detailed Results
                                </h4>
                                
                                {module.quiz && module.quiz.length > 0 && (
                                  <div className="grid gap-4">
                                    {module.quiz?.map((q, idx) => {
                                      if (!q) return null;
                                      return (
                                        <div key={q.id || `q-break-${idx}`} className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 space-y-3">
                                          <div className="flex justify-between items-start gap-4">
                                            <p className="font-bold">{idx + 1}. {q.question}</p>
                                            <span className={cn(
                                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                              selectedAnswers[q.id] === q.correctAnswer 
                                                ? "bg-green-500/10 text-green-600" 
                                                : "bg-red-500/10 text-red-600"
                                            )}>
                                              {selectedAnswers[q.id] === q.correctAnswer ? 'Correct' : 'Incorrect'}
                                            </span>
                                          </div>
                                          <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-1">
                                              <span className="text-primary/40 dark:text-white/40 uppercase text-[10px] font-bold tracking-wider">Your Answer</span>
                                              <p className={cn(
                                                "font-medium",
                                                selectedAnswers[q.id] === q.correctAnswer ? "text-green-600" : "text-red-600"
                                              )}>{q.options[selectedAnswers[q.id]] || "No answer chosen"}</p>
                                            </div>
                                            {selectedAnswers[q.id] !== q.correctAnswer && (
                                              <div className="space-y-1">
                                                <span className="text-primary/40 dark:text-white/40 uppercase text-[10px] font-bold tracking-wider text-green-600">Correct Answer</span>
                                                <p className="font-medium text-green-600">{q.options[q.correctAnswer]}</p>
                                              </div>
                                            )}
                                          </div>
                                          {q.explanation && (
                                            <p className="text-sm text-primary/60 dark:text-sage italic bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-black/5 dark:border-white/5">
                                              <HelpCircle size={14} className="inline mr-1" /> {q.explanation}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {module.assessment && module.assessment.sections && (
                                  <div className="space-y-8">
                                  {module.assessment?.sections?.map((section: any, sIdx: number) => (
                                      <div key={sIdx} className="space-y-4">
                                        <h5 className="font-bold text-secondary text-sm uppercase tracking-widest">{section.title}</h5>
                                        {section.questions?.map((q: any, qIdx: number) => (
                                          <div key={qIdx} className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 space-y-4">
                                            <p className="font-bold text-primary/80">{q.label}: {q.text}</p>
                                            <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5">
                                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40 dark:text-white/40 block mb-2">My Submission</span>
                                              <p className="text-primary/80 dark:text-sage leading-relaxed italic">
                                                {writtenAnswers[`${section.title}-${qIdx}`] || (writtenAnswers['fallback'] ? "Response submitted (refer to guide below)" : "No response provided")}
                                              </p>
                                            </div>
                                            {q.modelAnswer && (
                                              <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/10">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-2">Memorandum / Reference Key</span>
                                                <p className="text-primary/80 dark:text-sage leading-relaxed font-medium">
                                                  {q.modelAnswer}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {module.answerGuide && (
                                <div className="max-w-3xl mx-auto text-left p-8 bg-black/[0.03] dark:bg-white/[0.03] border-l-4 border-secondary rounded-xl space-y-4">
                                  <h4 className="text-xl font-bold text-secondary flex items-center gap-2">
                                    <HelpCircle size={20} /> Answer Guide (Instructor)
                                  </h4>
                                  <div className="prose dark:prose-invert max-w-none text-primary/80 dark:text-sage font-medium leading-relaxed italic">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {module.answerGuide}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                          <button
                            onClick={handleNextModule}
                            className="px-12 py-4 rounded-full bg-primary dark:bg-sage text-white dark:text-neutral-dark font-bold text-lg hover:bg-accent transition-all"
                          >
                            {moduleIndex === (course.modules?.length || 0) - 1 ? 'Finish Course' : 'Next Module'}
                          </button>
                          <button
                            onClick={handleRetryQuiz}
                            className="px-8 py-4 rounded-full border-2 border-primary/20 dark:border-white/10 text-primary dark:text-sage font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                          >
                            Retake Assessment
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                          <XCircle size={48} />
                        </div>
                        <h3 className="text-3xl font-bold text-red-600">Assessment Failed</h3>
                        <p className="text-lg text-primary/70 dark:text-sage">You scored {score}%. You need at least 80% to pass.</p>
                        <p className="text-sm font-medium text-primary/40 dark:text-white/40">Attempts remaining: {MAX_ATTEMPTS - quizAttempt}</p>
                        
                        <div className="pt-4">
                          <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="flex items-center gap-2 mx-auto px-6 py-2 rounded-full bg-black/5 dark:bg-white/5 text-sm font-bold border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                          >
                            {showBreakdown ? (
                              <>Hide Answer Breakdown <ChevronUp size={16} /></>
                            ) : (
                              <>Show Answer Breakdown <ChevronDown size={16} /></>
                            )}
                          </button>
                        </div>

                        <AnimatePresence>
                          {showBreakdown && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden space-y-8"
                            >
                              {/* Results Breakdown */}
                              <div className="max-w-2xl mx-auto text-left space-y-6 pt-8 border-t border-black/5 dark:border-white/5">
                                {module.quiz && module.quiz.length > 0 && (
                                  <div className="grid gap-4">
                                    {module.quiz?.map((q, idx) => {
                                      if (!q) return null;
                                      return (
                                        <div key={q.id || `q-failed-${idx}`} className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 space-y-3">
                                          <div className="flex justify-between items-start gap-4">
                                            <p className="font-bold">{idx + 1}. {q.question}</p>
                                            <span className={cn(
                                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                              selectedAnswers[q.id] === q.correctAnswer 
                                                ? "bg-green-500/10 text-green-600" 
                                                : "bg-red-500/10 text-red-600"
                                            )}>
                                              {selectedAnswers[q.id] === q.correctAnswer ? 'Correct' : 'Incorrect'}
                                            </span>
                                          </div>
                                          
                                          <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-1">
                                              <span className="text-primary/40 dark:text-white/40 uppercase text-[10px] font-bold tracking-wider">Your Answer</span>
                                              <p className={cn(
                                                "font-medium",
                                                selectedAnswers[q.id] === q.correctAnswer ? "text-green-600" : "text-red-600"
                                              )}>{q.options[selectedAnswers[q.id]]}</p>
                                            </div>
                                            
                                            {quizAttempt >= MAX_ATTEMPTS && selectedAnswers[q.id] !== q.correctAnswer && (
                                              <div className="space-y-1">
                                                <span className="text-primary/40 dark:text-white/40 uppercase text-[10px] font-bold tracking-wider text-green-600">Correct Answer</span>
                                                <p className="font-medium text-green-600">{q.options[q.correctAnswer]}</p>
                                              </div>
                                            )}
                                          </div>

                                          {quizAttempt >= MAX_ATTEMPTS && q.explanation && (
                                            <p className="text-sm text-primary/60 dark:text-sage italic bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-black/5 dark:border-white/5">
                                              <HelpCircle size={14} className="inline mr-1" /> {q.explanation}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {quizAttempt >= MAX_ATTEMPTS && module.answerGuide && (
                                  <div className="p-8 bg-black/[0.03] dark:bg-white/[0.03] border-l-4 border-secondary rounded-xl space-y-4">
                                    <h4 className="text-xl font-bold text-secondary flex items-center gap-2">
                                      <HelpCircle size={20} /> Answer Guide (Instructor)
                                    </h4>
                                    <div className="prose dark:prose-invert max-w-none text-primary/80 dark:text-sage font-medium leading-relaxed italic">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {module.answerGuide}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                          {quizAttempt < MAX_ATTEMPTS ? (
                            <button
                              onClick={handleRetryQuiz}
                              className="px-12 py-4 rounded-full bg-secondary text-white dark:text-neutral-dark font-bold text-lg hover:bg-earth transition-all"
                            >
                              Retake Assessment
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setCurrentTopicIndex(-1);
                                setShowQuiz(false);
                                handleRetryQuiz();
                                setQuizAttempt(0);
                              }}
                              className="px-12 py-4 rounded-full bg-primary dark:bg-sage text-white dark:text-neutral-dark font-bold text-lg hover:bg-accent transition-all"
                            >
                              Review & Refresh
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default Learning;
