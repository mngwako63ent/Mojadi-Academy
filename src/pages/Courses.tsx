import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutGrid, List } from 'lucide-react';
import { courses as staticCourses } from '../data/courses';
import { CourseCard } from '../components/Cards';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { useCoursePricing } from '../hooks/useCoursePricing';
import { useCourseLockStatus } from '../hooks/useCourseLockStatus';

const Courses = () => {
  const { user, userProfile } = useAuth();
  const { courses, loading: pricingLoading } = useCoursePricing();
  const { courseStatus, loading: lockLoading } = useCourseLockStatus(courses);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const categories = useMemo(() => ['All', ...new Set((courses || []).map(c => c.category))], [courses]);
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) || 
                           course.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || course.category === category;
      const matchesLevel = level === 'All' || course.level === level;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [search, category, level, courses]);

  return (
    <div className="pt-20 md:pt-24 lg:pt-32 pb-32 space-y-8 md:space-y-12 w-full max-w-7xl mx-auto px-4 sm:px-6">
      <div className="space-y-3 md:space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight tracking-tight">Explore Our Courses</h1>
        <p className="text-base sm:text-lg text-primary/60 dark:text-sage max-w-2xl leading-relaxed">
          From foundational knowledge to advanced commercial techniques, find the perfect course to elevate your farming expertise.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="glass p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col md:flex-row items-center gap-4 sm:gap-6 shadow-lg border-secondary/5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 dark:text-sage" size={20} />
          <input
            type="text"
            placeholder="Search courses or instructors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
            <button
              onClick={() => setView('grid')}
              className={cn("p-2 rounded-xl transition-all", view === 'grid' ? "bg-white dark:bg-neutral-dark shadow-sm text-secondary" : "text-primary/40 dark:text-sage/40")}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn("p-2 rounded-xl transition-all", view === 'list' ? "bg-white dark:bg-neutral-dark shadow-sm text-secondary" : "text-primary/40 dark:text-sage/40")}
            >
              <List size={20} />
            </button>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-black/5 dark:bg-white/5 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-secondary text-sm font-medium"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-black/5 dark:bg-white/5 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-secondary text-sm font-medium"
          >
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Results Grid */}
      <div className={cn(
        "grid gap-8",
        view === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        <AnimatePresence mode="popLayout">
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <CourseCard 
                course={course} 
                featured={view === 'list'} 
                locked={courseStatus[course.id]?.locked} 
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-primary/20 dark:text-sage">
            <Search size={40} />
          </div>
          <h3 className="text-2xl font-display font-bold">No courses found</h3>
          <p className="text-primary/60 dark:text-sage">Try adjusting your search or filters to find what you're looking for.</p>
          <button 
            onClick={() => { setSearch(''); setCategory('All'); setLevel('All'); }}
            className="text-secondary font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Courses;
