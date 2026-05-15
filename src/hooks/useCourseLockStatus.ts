import { useMemo } from 'react';
import { Course } from '../data/courses';
import { useAuth } from '../components/AuthContext';
import { useEnrollments } from './useEnrollments';

export const useCourseLockStatus = (courses: Course[]) => {
  const { user, userProfile } = useAuth();
  const email = user?.email?.toLowerCase();
  const isAdmin = userProfile?.role === 'admin' || (email === 'm.ngwako63@gmail.com' || email === 'admin@mojadiacademy.com');
  const { enrollments, loading: enrollmentsLoading } = useEnrollments();

  const courseStatus = useMemo(() => {
    const status: Record<string, { locked: boolean; completed: boolean }> = {};
    
    courses.forEach((course, index) => {
      const enrollment = enrollments[course.id];
      const isCompleted = enrollment?.completedModules?.length === (course.modules?.length || 0);
      
      let isLocked = false;
      // Only show locked for logged in users to avoid confusing visitors
      if (user && index > 0) {
        const prevCourse = courses[index - 1];
        const prevEnrollment = prevCourse?.id ? enrollments[prevCourse.id] : null;
        const prevCompleted = prevEnrollment?.completedModules?.length === (prevCourse?.modules?.length || 0);
        isLocked = !prevCompleted;
      }

      status[course.id] = {
        locked: isAdmin ? false : isLocked,
        completed: isCompleted
      };
    });
    
    return status;
  }, [enrollments, courses, isAdmin, user]);

  return { courseStatus, loading: enrollmentsLoading };
};
