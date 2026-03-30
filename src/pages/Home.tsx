import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, BookOpen, Award, CheckCircle2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { courses, testimonials } from '../data/mockData';
import { CourseCard } from '../components/Cards';

const StatItem = ({ icon: Icon, value, label }: { icon: any, value: string, label: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="flex flex-col items-center text-center p-8 glass rounded-3xl"
  >
    <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-6">
      <Icon size={32} />
    </div>
    <span className="text-4xl font-display font-bold mb-2">{value}</span>
    <span className="text-sm text-primary/60 dark:text-white/60 font-medium uppercase tracking-widest">{label}</span>
  </motion.div>
);

const Home = () => {
  return (
    <div className="space-y-32 pb-32">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40 z-10" />
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000"
            alt="Agriculture Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-20 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Empowering the Next Generation of Farmers
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-bold leading-[0.9] tracking-tight">
              Grow Your <br />
              <span className="text-secondary">Farming</span> Success
            </h1>
            <p className="text-xl text-white/80 max-w-lg leading-relaxed">
              Access world-class agricultural education from leading experts. Master sustainable practices, crop science, and agri-business management.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/courses" className="btn-premium bg-secondary text-white hover:bg-earth shadow-xl shadow-secondary/20 flex items-center gap-2">
                Explore Courses <ArrowRight size={20} />
              </Link>
              <Link to="/about" className="btn-premium bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20">
                Learn More
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hidden md:block relative"
          >
            <div className="absolute -inset-4 bg-secondary/20 blur-3xl rounded-full" />
            <div className="relative glass p-4 rounded-[2.5rem] border-white/30">
              <img
                src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800"
                alt="Farming Education"
                className="rounded-[2rem] shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-10 -left-10 glass p-6 rounded-3xl shadow-xl max-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <CheckCircle2 size={24} />
                  </div>
                  <span className="font-bold text-primary dark:text-white">Certified</span>
                </div>
                <p className="text-xs text-primary/60 dark:text-white/60">Professional agricultural certification upon completion.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatItem icon={Users} value="2,500+" label="Active Students" />
          <StatItem icon={Award} value="12" label="Expert Instructors" />
          <StatItem icon={BookOpen} value="45+" label="Courses" />
          <StatItem icon={CheckCircle2} value="95%" label="Success Rate" />
        </div>
      </section>

      {/* Featured Courses */}
      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex flex-col md:row justify-between items-end gap-6">
          <div className="space-y-4">
            <span className="text-secondary font-bold uppercase tracking-widest text-sm">Our Curriculum</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold">Featured Courses</h2>
          </div>
          <Link to="/courses" className="text-primary dark:text-white font-bold flex items-center gap-2 hover:text-secondary transition-colors">
            View All Courses <ArrowRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courses.slice(0, 3).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-primary py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <span className="text-secondary font-bold uppercase tracking-widest text-sm">Success Stories</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white">Trusted by Farmers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl relative"
              >
                <div className="text-secondary mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" className="inline mr-1" />)}
                </div>
                <p className="text-white/80 italic mb-8 leading-relaxed">"{t.content}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="text-white font-bold">{t.name}</h4>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
