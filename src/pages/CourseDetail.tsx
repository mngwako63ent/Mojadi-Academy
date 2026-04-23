import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Star, Clock, BarChart, CheckCircle2, Users, BookOpen, Video, Award, MessageSquare, Lock } from 'lucide-react';
import { courses } from '../data/courses';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const course = courses.find((c) => c.id === id);
  const [isEnrolled, setIsEnrolled] = React.useState(false);
  const [completedModules, setCompletedModules] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkEnrollment = async () => {
      if (user && id) {
        const enrollmentRef = doc(db, 'users', user.uid, 'enrollments', id);
        const enrollmentSnap = await getDoc(enrollmentRef);
        if (enrollmentSnap.exists()) {
          setIsEnrolled(true);
          setCompletedModules(enrollmentSnap.data().completedModules || []);
        } else {
          setIsEnrolled(false);
          setCompletedModules([]);
        }
      }
      setLoading(false);
    };
    checkEnrollment();
  }, [user, id]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    if (course) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'enrollments', course.id), {
          courseId: course.id,
          enrolledAt: new Date().toISOString(),
          progress: 0,
          completedModules: []
        });
        setIsEnrolled(true);
        navigate('/dashboard');
      } catch (error) {
        console.error("Error enrolling in course:", error);
      }
    }
  };

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

  return (
    <div className="pt-32 pb-32 max-w-5xl mx-auto px-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary/60 dark:text-sage hover:text-secondary transition-colors mb-8">
        <ArrowLeft size={20} /> Back to Courses
      </button>

      <div className="space-y-8">
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
          <h1 className="text-4xl md:text-5xl font-display font-bold">{course.title}</h1>
          <p className="text-lg text-primary/70 dark:text-sage max-w-2xl">{course.description}</p>
          
            <div className="flex items-center gap-6 text-sm text-primary/60 dark:text-sage pt-2">
            <div className="flex items-center gap-2"><Star size={20} className="text-yellow-500" /> {course.rating} Rating</div>
            <div className="flex items-center gap-2"><Users size={20} className="text-secondary" /> {course.students} Students</div>
            <div className="flex items-center gap-2"><Clock size={20} className="text-secondary" /> {course.duration}</div>
          </div>
        </div>

        {/* Image */}
        <img src={course.image} alt={course.title} className="w-full h-96 object-cover rounded-[2rem]" referrerPolicy="no-referrer" />

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="glass p-8 rounded-[2rem]">
              <h3 className="text-2xl font-bold mb-6">What You'll Learn</h3>
              <ul className="space-y-4">
                {[
                  "Comprehensive understanding of " + course.title.toLowerCase(),
                  "Practical techniques you can apply immediately on your farm",
                  "Best practices used by successful commercial farmers",
                  "How to maximize yield and profitability",
                  "Sustainable and environmentally friendly farming methods"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-primary/80 dark:text-sage">
                    <CheckCircle2 size={20} className="text-secondary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Enrollment Card */}
          <div className="glass p-8 rounded-[2rem] h-fit sticky top-32">
            <h2 className="text-4xl font-bold mb-6">
              {course.price === 0 ? 'Free' : `R${course.price.toLocaleString()}`}
            </h2>
            <button 
              onClick={isEnrolled ? () => navigate(`/learning/${course.id}/${course.modules[0].id}`) : handleEnroll}
              className="w-full btn-premium bg-primary dark:bg-sage text-white dark:text-neutral-dark hover:bg-accent dark:hover:bg-sage-bright text-lg py-4 mb-6 rounded-full"
            >
              {isEnrolled ? 'Continue Learning' : 'Enroll Now'}
            </button>
            <div className="space-y-4 text-sm text-primary/70 dark:text-sage">
              <p className="font-bold text-primary dark:text-sage">This course includes:</p>
              <div className="flex items-center gap-3"><BookOpen size={18} /> {course.modules.length} Modules</div>
              <div className="flex items-center gap-3"><Video size={18} /> Video Lessons</div>
              <div className="flex items-center gap-3"><Clock size={18} /> {course.duration} Duration</div>
              <div className="flex items-center gap-3"><Award size={18} /> Certificate of Completion</div>
              <div className="flex items-center gap-3"><MessageSquare size={18} /> Community Access</div>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="glass p-8 rounded-[2rem]">
          <h3 className="text-2xl font-bold mb-6">Course Curriculum</h3>
          <div className="space-y-4">
            {course.modules.map((module, index) => {
              const isCompleted = completedModules.includes(module.id);
              const isFirstModule = index === 0;
              const isPrevCompleted = index > 0 && completedModules.includes(course.modules[index - 1].id);
              const isLocked = !isFirstModule && !isPrevCompleted && !isCompleted;
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
                      {isCompleted ? <CheckCircle2 size={20} /> : index + 6}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{module.title}</h4>
                        {isLocked && <Lock size={14} className="text-primary/40" />}
                        {isCurrent && <span className="text-[10px] font-black uppercase tracking-widest text-secondary px-2 py-0.5 bg-secondary/10 rounded-full">In Progress</span>}
                      </div>
                      <p className="text-sm text-primary/60 dark:text-sage">{module.duration}</p>
                    </div>
                  </div>
                  {isEnrolled && (
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
