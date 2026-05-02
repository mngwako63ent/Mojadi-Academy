import React from 'react';
import { motion } from 'motion/react';
import { Star, Clock, BarChart, ArrowRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Course } from '../data/courses';
import { cn, formatPrice } from '../lib/utils';

interface CourseCardProps {
  course: Course;
  featured?: boolean;
  locked?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, featured, locked }) => {
  const content = (
    <motion.div
      whileHover={locked ? {} : { y: -10 }}
      className={cn(
        "group relative glass rounded-2xl overflow-hidden transition-all duration-500",
        featured ? "md:flex" : "",
        locked ? "opacity-75 grayscale-[0.5]" : ""
      )}
    >
      <div className={cn("relative overflow-hidden", featured ? "md:w-1/2" : "aspect-video")}>
        <img
          src={course.image}
          alt={course.title}
          className={cn(
            "w-full h-full object-cover transition-transform duration-700",
            !locked && "group-hover:scale-110"
          )}
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider rounded-full text-primary dark:text-sage">
            {course.category}
          </span>
          <span className="px-3 py-1 bg-secondary text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
            {course.level}
          </span>
          {locked && (
            <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
              <Lock size={10} /> Locked
            </span>
          )}
        </div>
        {locked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
              <Lock size={32} className="text-white" />
            </div>
          </div>
        )}
      </div>

      <div className={cn("p-6 flex flex-col justify-between", featured ? "md:w-1/2" : "")}>
        <div>
          <div className="flex items-center gap-1 text-yellow-500 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill={i < Math.floor(course.rating) ? "currentColor" : "none"} />
            ))}
            <span className="text-xs font-bold ml-1 text-primary/60 dark:text-sage">({course.rating})</span>
          </div>
          <h3 className={cn(
            "text-xl font-display font-bold mb-3 transition-colors",
            !locked && "group-hover:text-secondary"
          )}>
            {course.title}
          </h3>
          <p className="text-sm text-primary/60 dark:text-sage line-clamp-2 mb-4">
            {course.description}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-primary/50 dark:text-sage mb-6">
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
            <span className="text-[10px] uppercase tracking-widest text-primary/40 dark:text-sage">Price</span>
            <span className="text-lg font-bold text-primary dark:text-sage">
              {course.price === 0 ? 'Free' : formatPrice(course.price)}
            </span>
          </div>
          <button className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            locked 
              ? "bg-black/10 dark:bg-white/10 text-primary/40 dark:text-sage/40" 
              : "bg-primary dark:bg-sage text-white dark:text-neutral-dark group-hover:bg-secondary"
          )}>
            {locked ? <Lock size={18} /> : <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Link 
      to={locked ? "#" : `/courses/${course.id}`} 
      onClick={(e) => locked && e.preventDefault()}
      className={cn("block", locked && "cursor-not-allowed")}
    >
      {content}
    </Link>
  );
};

interface InstructorCardProps {
  instructor: any;
}
