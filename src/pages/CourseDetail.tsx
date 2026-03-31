import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Star, Clock, BarChart, CheckCircle2, Users, BookOpen, Video, Award, MessageSquare } from 'lucide-react';
import { courses, instructors } from '../data/mockData';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const course = courses.find((c) => c.id === id);
  const instructor = instructors.find((i) => i.name === course?.instructor);

  if (!course) {
    return (
      <div className="pt-32 pb-32 text-center">
        <h2 className="text-3xl font-bold">Course not found</h2>
        <button onClick={() => navigate('/courses')} className="mt-4 text-secondary dark:text-[#E6B981] hover:underline">
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 max-w-5xl mx-auto px-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary/60 dark:text-sage hover:text-secondary dark:hover:text-[#E6B981] transition-colors mb-8">
        <ArrowLeft size={20} /> Back to Courses
      </button>

      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-secondary/10 text-secondary dark:text-[#E6B981] text-xs font-bold uppercase tracking-wider rounded-full">
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
            <div className="flex items-center gap-2"><Users size={20} className="text-secondary dark:text-[#E6B981]" /> {course.students} Students</div>
            <div className="flex items-center gap-2"><Clock size={20} className="text-secondary dark:text-[#E6B981]" /> {course.duration}</div>
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
                    <CheckCircle2 size={20} className="text-secondary dark:text-[#E6B981] shrink-0 mt-0.5" />
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
            <button className="w-full btn-premium bg-primary dark:bg-sage text-white dark:text-neutral-dark hover:bg-accent dark:hover:bg-sage-bright text-lg py-4 mb-6 rounded-full">
              Enroll Now
            </button>
            <div className="space-y-4 text-sm text-primary/70 dark:text-sage">
              <p className="font-bold text-primary dark:text-sage">This course includes:</p>
              <div className="flex items-center gap-3"><BookOpen size={18} /> {course.modules} Modules</div>
              <div className="flex items-center gap-3"><Video size={18} /> {course.lessons} Video Lessons</div>
              <div className="flex items-center gap-3"><Clock size={18} /> {course.duration} Duration</div>
              <div className="flex items-center gap-3"><Award size={18} /> Certificate of Completion</div>
              <div className="flex items-center gap-3"><MessageSquare size={18} /> Community Access</div>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="glass p-8 rounded-[2rem]">
          <h3 className="text-2xl font-bold mb-4">Course Overview</h3>
          <p className="text-primary/80 dark:text-sage leading-relaxed">{course.description} This comprehensive beginner level course is designed for farmers who want to excel in introduction to sustainable farming. Over 4 weeks, you'll gain in-depth knowledge and practical skills through 8 carefully structured modules containing 24 detailed lessons.</p>
        </div>

        {/* Instructor */}
        {instructor && (
          <div className="glass p-8 rounded-[2rem] flex items-start gap-6">
            <img src={instructor.image} alt={instructor.name} className="w-24 h-24 rounded-full object-cover" referrerPolicy="no-referrer" />
            <div>
              <h3 className="text-2xl font-bold mb-1">About Your Instructor</h3>
              <p className="text-secondary dark:text-[#E6B981] font-bold mb-2">{instructor.name} <span className="text-primary/60 dark:text-sage font-normal">- {instructor.expertise}</span></p>
              <p className="text-primary/80 dark:text-sage leading-relaxed">{instructor.bio}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
