import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { courses } from '../data/courses';
import { BookOpen, Clock, Award, ChevronRight, PlayCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const Dashboard = () => {
  const { user, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthReady && !user) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    const fetchEnrollments = async () => {
      if (user) {
        try {
          const enrollmentsRef = collection(db, 'users', user.uid, 'enrollments');
          const querySnapshot = await getDocs(enrollmentsRef);
          const enrollmentsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as { progress?: number; completedModules?: string[] })
          }));
          
          const enrichedCourses = enrollmentsData.map(enrollment => {
            const course = courses.find(c => c.id === enrollment.id);
            if (!course) return null;
            return {
              ...course,
              progress: enrollment.progress || 0,
              completedModules: enrollment.completedModules || []
            };
          }).filter((c): c is any => c !== null);

          setEnrolledCourses(enrichedCourses);
        } catch (error) {
          console.error("Error fetching enrollments:", error);
        }
      }
      setLoading(false);
    };

    fetchEnrollments();
  }, [user, isAuthReady, navigate]);

  if (loading) {
    return (
      <div className="pt-32 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-display font-bold">Welcome back, {user?.displayName || 'Farmer'}!</h1>
        <p className="text-primary/60 dark:text-sage text-lg">Continue your journey to agricultural excellence.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="text-secondary" /> Enrolled Courses
            </h2>
            
            {enrolledCourses.length > 0 ? (
              <div className="grid gap-6">
                {enrolledCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-6 rounded-3xl flex flex-col md:flex-row gap-6 hover:shadow-xl transition-all group"
                  >
                    <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0">
                      <img 
                        src={course.image} 
                        alt={course.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-grow space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{course.title}</h3>
                          <p className="text-sm text-primary/60 dark:text-sage">{course.category}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-secondary">{course.progress}%</span>
                          <p className="text-xs text-primary/40 dark:text-sage uppercase font-bold tracking-wider">Progress</p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          className="h-full bg-secondary"
                        />
                      </div>
                      
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-4 text-sm text-primary/60 dark:text-sage">
                          <span className="flex items-center gap-1"><Clock size={14} /> {course.duration}</span>
                          <span className="flex items-center gap-1"><Award size={14} /> {course.completedModules.length} / {course.modules.length} Modules</span>
                        </div>
                        <Link 
                          to={`/learning/${course.id}/${course.modules[0].id}`}
                          className="flex items-center gap-2 text-primary font-bold hover:text-secondary transition-colors"
                        >
                          Continue Learning <ChevronRight size={18} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass p-12 rounded-[2.5rem] text-center space-y-6">
                <div className="w-20 h-20 bg-primary/5 text-primary/40 rounded-full flex items-center justify-center mx-auto">
                  <PlayCircle size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">No courses enrolled yet</h3>
                  <p className="text-primary/60 dark:text-sage">Start your learning journey by exploring our available courses.</p>
                </div>
                <Link to="/courses" className="btn-premium bg-primary text-white inline-block">
                  Browse Courses
                </Link>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-bold">Learning Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                <span className="text-primary/60 dark:text-sage">Courses Enrolled</span>
                <span className="text-2xl font-bold">{enrolledCourses.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                <span className="text-primary/60 dark:text-sage">Modules Completed</span>
                <span className="text-2xl font-bold">
                  {enrolledCourses.reduce((acc, c) => acc + c.completedModules.length, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                <span className="text-primary/60 dark:text-sage">Average Progress</span>
                <span className="text-2xl font-bold">
                  {enrolledCourses.length > 0 
                    ? Math.round(enrolledCourses.reduce((acc, c) => acc + c.progress, 0) / enrolledCourses.length) 
                    : 0}%
                </span>
              </div>
            </div>
          </section>

          <section className="glass p-8 rounded-[2.5rem] space-y-6 bg-secondary/5 border-secondary/20">
            <h3 className="text-xl font-bold text-secondary">Academy News</h3>
            <p className="text-sm text-primary/60 dark:text-sage">Stay updated with the latest from Mojadi Academy.</p>
            <div className="space-y-4">
              <div className="p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-secondary/10">
                <p className="font-bold text-sm">Level 2 Modules Live</p>
                <p className="text-xs text-secondary">Intermediate Crop Production is now fully available.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
