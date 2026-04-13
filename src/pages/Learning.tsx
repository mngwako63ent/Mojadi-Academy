import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { courses } from '../data/courses';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, HelpCircle, Award, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Learning = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { user, isAuthReady } = useAuth();
  
  const course = courses.find(c => c.id === courseId);
  const moduleIndex = course?.modules.findIndex(m => m.id === moduleId) ?? -1;
  const module = course?.modules[moduleIndex];
  
  const [currentTopicIndex, setCurrentTopicIndex] = useState(-1); // -1 for Module Overview
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAttempt, setQuizAttempt] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (isAuthReady) {
        if (!user) {
          navigate('/login', { state: { from: `/learning/${courseId}/${moduleId}` } });
          return;
        }

        if (courseId) {
          const enrollmentRef = doc(db, 'users', user.uid, 'enrollments', courseId);
          const enrollmentSnap = await getDoc(enrollmentRef);
          if (enrollmentSnap.exists()) {
            setCompletedModules(enrollmentSnap.data().completedModules || []);
          } else {
            // Not enrolled, redirect to course detail
            navigate(`/courses/${courseId}`);
          }
        }
      }
      setLoading(false);
    };
    fetchProgress();
  }, [user, isAuthReady, courseId, moduleId, navigate]);

  if (!course || !module) {
    return <div className="pt-32 text-center">Module not found</div>;
  }

  const currentTopic = module.topics[currentTopicIndex];

  const handleNextTopic = () => {
    if (currentTopicIndex < module.topics.length - 1) {
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
    const allCorrect = module.quiz.every(q => selectedAnswers[q.id] === q.correctAnswer);
    setQuizPassed(allCorrect);
    setQuizSubmitted(true);
    setQuizAttempt(prev => prev + 1);

    if (allCorrect) {
      if (user && courseId) {
        const enrollmentRef = doc(db, 'users', user.uid, 'enrollments', courseId);
        await updateDoc(enrollmentRef, {
          completedModules: arrayUnion(module.id),
          progress: Math.round(((completedModules.length + 1) / course.modules.length) * 100)
        });
        setCompletedModules(prev => [...prev, module.id]);
      }
    }
  };

  const handleRetryQuiz = () => {
    setQuizSubmitted(false);
    setSelectedAnswers({});
  };

  const handleNextModule = () => {
    const nextModule = course.modules[moduleIndex + 1];
    if (nextModule) {
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
    <div className="pt-24 pb-32 min-h-screen bg-neutral-light dark:bg-neutral-dark">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-6">
          <button 
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-primary/60 dark:text-sage hover:text-secondary transition-colors mb-4"
          >
            <ArrowLeft size={18} /> Back to Course
          </button>
          
          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-lg border-b border-black/5 dark:border-white/5 pb-4">Course Progress</h3>
                  <div className="space-y-2">
                    {course.modules.map((m, idx) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          navigate(`/learning/${courseId}/${m.id}`);
                          setCurrentTopicIndex(-1);
                          setShowQuiz(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                          m.id === moduleId ? "bg-primary text-white" : "hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold">
                          {idx + 6}
                        </div>
                        <span className="text-sm font-medium truncate flex-grow">{m.title.replace('Module ' + (idx + 6) + ': ', '')}</span>
                        {completedModules.includes(m.id) && (
                          <CheckCircle2 size={16} className="text-green-500" />
                        )}
                      </button>
                    ))}
                  </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          <AnimatePresence mode="wait">
            {!showQuiz ? (
              <motion.div
                key={currentTopicIndex === -1 ? 'overview' : currentTopic?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass p-8 md:p-12 rounded-[2.5rem] space-y-8"
              >
                {currentTopicIndex === -1 ? (
                  // Module Overview
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-secondary dark:text-[#E6B981] font-bold text-sm uppercase tracking-widest">
                        <BookOpen size={16} /> Module Overview
                      </div>
                      <h1 className="text-3xl md:text-4xl font-display font-bold">{module.title}</h1>
                      <p className="text-xl text-primary/70 dark:text-sage leading-relaxed">
                        {module.introduction}
                      </p>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold">Learning Objectives</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {module.learningObjectives.map((obj, i) => (
                          <div key={i} className="flex items-start gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                            <CheckCircle2 size={20} className="text-secondary dark:text-[#E6B981] shrink-0 mt-0.5" />
                            <span className="text-primary/80 dark:text-sage font-medium">{obj}</span>
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-secondary dark:text-[#E6B981] font-bold text-sm uppercase tracking-widest">
                        <BookOpen size={16} /> Topic {currentTopicIndex + 1} of {module.topics.length}
                      </div>
                      <h1 className="text-3xl md:text-4xl font-display font-bold">{currentTopic.title}</h1>
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-lg text-primary/80 dark:text-sage leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {currentTopic.content}
                      </ReactMarkdown>
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
                        {currentTopicIndex === module.topics.length - 1 ? 'Start Assessment' : 'Next Topic'} <ChevronRight size={20} />
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
                  <div className="w-16 h-16 bg-secondary/10 text-secondary dark:text-[#E6B981] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award size={32} />
                  </div>
                  <h2 className="text-3xl font-display font-bold">Module Assessment</h2>
                  <p className="text-primary/60 dark:text-sage">Test your knowledge to complete this module.</p>
                </div>

                {!quizSubmitted ? (
                  <div className="space-y-10">
                    {module.quiz.map((q, idx) => (
                      <div key={q.id} className="space-y-6">
                        <h4 className="text-xl font-bold flex gap-3">
                          <span className="text-secondary dark:text-[#E6B981]">{idx + 1}.</span>
                          {q.question}
                        </h4>
                        <div className="grid gap-3">
                          {q.options.map((option, optIdx) => (
                            <button
                              key={optIdx}
                              onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                              className={cn(
                                "w-full p-4 rounded-2xl text-left border-2 transition-all font-medium",
                                selectedAnswers[q.id] === optIdx 
                                  ? "border-secondary bg-secondary/5 text-secondary dark:text-[#E6B981]" 
                                  : "border-black/5 dark:border-white/5 hover:border-primary/20"
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(selectedAnswers).length < module.quiz.length}
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
                        <button
                          onClick={handleNextModule}
                          className="px-12 py-4 rounded-full bg-primary dark:bg-sage text-white dark:text-neutral-dark font-bold text-lg hover:bg-accent transition-all"
                        >
                          {moduleIndex === course.modules.length - 1 ? 'Finish Course' : 'Next Module'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                          <XCircle size={48} />
                        </div>
                        <h3 className="text-3xl font-bold text-red-600">Assessment Failed</h3>
                        <p className="text-lg text-primary/70 dark:text-sage">Don't worry, you can review the content and try again.</p>
                        
                        <div className="space-y-6 text-left max-w-2xl mx-auto">
                          {module.quiz.map((q, idx) => (
                            <div key={q.id} className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl space-y-3">
                              <p className="font-bold">{idx + 1}. {q.question}</p>
                              {quizAttempt === 1 ? (
                                <p className={cn(
                                  "text-sm font-bold flex items-center gap-2",
                                  selectedAnswers[q.id] === q.correctAnswer ? "text-green-600" : "text-red-600"
                                )}>
                                  {selectedAnswers[q.id] === q.correctAnswer ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                  {selectedAnswers[q.id] === q.correctAnswer ? 'Correct' : 'Incorrect - Try again'}
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-sm font-bold text-green-600 flex items-center gap-2">
                                    <CheckCircle2 size={16} /> Correct Answer: {q.options[q.correctAnswer]}
                                  </p>
                                  <p className="text-sm text-primary/60 dark:text-sage italic bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                                    <HelpCircle size={14} className="inline mr-1" /> {q.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={handleRetryQuiz}
                          className="px-12 py-4 rounded-full bg-secondary dark:bg-[#E6B981] text-white dark:text-neutral-dark font-bold text-lg hover:bg-earth transition-all"
                        >
                          Retry Assessment
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Learning;
