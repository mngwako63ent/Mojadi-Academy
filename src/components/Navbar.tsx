import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md dark:bg-green-950/80"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-2xl font-bold">
          <span className="text-[#b1c1a4]">Mojadi</span>
          <span className="text-green-900 dark:text-green-100"> Academy</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-green-900 hover:text-green-600 dark:text-green-100">Home</Link>
          <Link to="/courses" className="text-sm font-medium text-green-900 hover:text-green-600 dark:text-green-100">Courses</Link>
          <Link to="/about" className="text-sm font-medium text-green-900 hover:text-green-600 dark:text-green-100">About</Link>
          <Link to="/contact" className="text-sm font-medium text-green-900 hover:text-green-600 dark:text-green-100">Contact</Link>
          <Link to="/courses" className="rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700">
            Start Learning
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
