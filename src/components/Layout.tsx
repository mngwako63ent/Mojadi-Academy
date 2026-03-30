import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, ChevronRight, Leaf } from 'lucide-react';
import { cn } from '../lib/utils';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
        isScrolled ? 'glass py-3' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white group-hover:rotate-12 transition-transform duration-300">
            <Leaf size={24} />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight text-primary dark:text-white">
            Mojadi<span className="text-secondary">Academy</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                'text-sm font-medium transition-colors hover:text-secondary',
                location.pathname === link.path 
                  ? 'text-secondary' 
                  : 'text-primary/70 dark:text-white/70'
              )}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="flex items-center gap-4 ml-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {isDark ? <Sun size={20} className="text-white" /> : <Moon size={20} />}
            </button>
            <Link
              to="/courses"
              className="btn-premium bg-primary text-white hover:bg-accent shadow-lg shadow-primary/20"
            >
              Start Learning
            </Link>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            {isDark ? <Sun size={20} className="text-white" /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 glass border-t border-white/10 md:hidden p-6 flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'text-lg font-medium py-2 border-b border-black/5 dark:border-white/5',
                  location.pathname === link.path ? 'text-secondary' : 'text-primary/70 dark:text-white/70'
                )}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/courses"
              onClick={() => setIsOpen(false)}
              className="btn-premium bg-primary text-white text-center mt-4"
            >
              Start Learning
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-primary text-white pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary">
              <Leaf size={24} />
            </div>
            <span className="text-2xl font-display font-bold tracking-tight">
              Mojadi<span className="text-secondary">Academy</span>
            </span>
          </Link>
          <p className="text-white/70 leading-relaxed">
            To provide accessible, high-quality agricultural education that empowers farmers with the knowledge and skills needed to succeed in modern farming. We believe every farmer deserves access to expert guidance and proven techniques.
          </p>
          <div className="flex gap-4">
            {/* Social Icons Placeholder */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer" />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold mb-6">Quick Links</h4>
          <ul className="space-y-4 text-white/70">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/courses" className="hover:text-white transition-colors">Courses</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-bold mb-6">Categories</h4>
          <ul className="space-y-4 text-white/70">
            <li><Link to="/courses" className="hover:text-white transition-colors">Crop Science</Link></li>
            <li><Link to="/courses" className="hover:text-white transition-colors">Sustainable Farming</Link></li>
            <li><Link to="/courses" className="hover:text-white transition-colors">Agri-Business</Link></li>
            <li><Link to="/courses" className="hover:text-white transition-colors">Soil Management</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-bold mb-6">Contact Info</h4>
          <ul className="space-y-4 text-white/70">
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center" />
              <span>South Africa</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center" />
              <span>084 520 2073</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center" />
              <span>Mojadifarmholding@gmail.com</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col md:row justify-between items-center gap-4 text-sm text-white/50">
        <p>© 2026 AgriAcademy. All rights reserved.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-white">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};
