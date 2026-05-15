import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar, Footer } from './components/Layout';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Learning from './pages/Learning';
import Dashboard from './pages/Dashboard';
import Payment from './pages/Payment';
import AdminPayments from './pages/AdminPayments';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import CourseCMS from './pages/admin/CourseCMS';
import StudentDirectory from './pages/admin/StudentDirectory';
import OrderManagement from './pages/admin/OrderManagement';
import MediaLibrary from './pages/admin/MediaLibrary';
import { useAuth } from './components/AuthContext';
import { Leaf } from 'lucide-react';

import AdminSettings from './pages/admin/Settings';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const AdminWrapper = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== 'admin')) {
      navigate('/');
    }
  }, [userProfile, loading, navigate]);

  if (loading) return null;
  if (!userProfile || userProfile.role !== 'admin') return null;

  return <>{children}</>;
};

const AppRoutes = () => {
  const location = useLocation();
  const { isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-primary"
        >
          <Leaf size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <Routes location={location} key={location.pathname}>
      {/* Admin Routes with nested Layout - No Navbar/Footer */}
      <Route path="/admin" element={<AdminWrapper><AdminLayout /></AdminWrapper>}>
        <Route index element={<AdminDashboard />} />
        <Route path="courses" element={<CourseCMS />} />
        <Route path="students" element={<StudentDirectory />} />
        <Route path="payments" element={<OrderManagement />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Public & Learner Routes with Navbar/Footer */}
      <Route path="*" element={
        <>
          <Navbar />
          <main className="flex-grow">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                <Route path="/courses" element={<PageWrapper><Courses /></PageWrapper>} />
                <Route path="/courses/:id" element={<PageWrapper><CourseDetail /></PageWrapper>} />
                <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
                <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
                <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/payment/:orderId" element={<PageWrapper><Payment /></PageWrapper>} />
                <Route path="/learning/:courseId/:moduleId" element={<PageWrapper><Learning /></PageWrapper>} />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />
        </>
      } />
    </Routes>
  );
};

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppRoutes />
    </Router>
  );
}
