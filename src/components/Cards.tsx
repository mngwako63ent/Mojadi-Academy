import React from 'react';
import { motion } from 'motion/react';
import { Star, Clock, BarChart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Course } from '../data/mockData';
import { cn } from '../lib/utils';

interface CourseCardProps {
  course: Course;
  featured?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, featured }) => {
  return (
    <Link to={`/courses/${course.id}`} className="block">
      <motion.div
        whileHover={{ y: -10 }}
        className={cn(
          "group relative glass rounded-2xl overflow-hidden transition-all duration-500",
          featured ? "md:flex" : ""
        )}
      >
        <div className={cn("relative overflow-hidden", featured ? "md:w-1/2" : "aspect-video")}>
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider rounded-full text-primary">
              {course.category}
            </span>
            <span className="px-3 py-1 bg-secondary text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
              {course.level}
            </span>
          </div>
        </div>

        <div className={cn("p-6 flex flex-col justify-between", featured ? "md:w-1/2" : "")}>
          <div>
            <div className="flex items-center gap-1 text-yellow-500 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill={i < Math.floor(course.rating) ? "currentColor" : "none"} />
              ))}
              <span className="text-xs font-bold ml-1 text-primary/60 dark:text-white/60">({course.rating})</span>
            </div>
            <h3 className="text-xl font-display font-bold mb-3 group-hover:text-secondary transition-colors">
              {course.title}
            </h3>
            <p className="text-sm text-primary/60 dark:text-white/60 line-clamp-2 mb-4">
              {course.description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-primary/50 dark:text-white/40 mb-6">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart size={14} />
                <span>{course.level}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-primary/40 dark:text-white/40">Price</span>
              <span className="text-lg font-bold text-primary dark:text-white">
                {course.price === 0 ? 'Free' : `R${course.price.toLocaleString()}`}
              </span>
            </div>
            <button className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center group-hover:bg-secondary transition-colors">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

interface InstructorCardProps {
  instructor: any;
}

export const InstructorCard: React.FC<InstructorCardProps> = ({ instructor }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass rounded-2xl p-6 text-center group"
    >
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="absolute inset-0 bg-secondary rounded-full rotate-6 group-hover:rotate-12 transition-transform duration-500" />
        <img
          src={instructor.image}
          alt={instructor.name}
          className="relative w-full h-full object-cover rounded-full border-4 border-white dark:border-neutral-dark"
          referrerPolicy="no-referrer"
        />
      </div>
      <h4 className="text-xl font-display font-bold mb-1">{instructor.name}</h4>
      <p className="text-sm text-secondary font-medium mb-4">{instructor.expertise}</p>
      <p className="text-sm text-primary/60 dark:text-white/60 line-clamp-3 mb-6">
        {instructor.bio}
      </p>
      <div className="flex justify-center gap-4">
        {/* Social placeholders */}
        <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-secondary hover:text-white transition-all cursor-pointer" />
        <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-secondary hover:text-white transition-all cursor-pointer" />
      </div>
    </motion.div>
  );
};
