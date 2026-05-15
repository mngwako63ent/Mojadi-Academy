import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { courses as staticCourses, Course } from '../data/courses';

export const useCoursePricing = () => {
  const [courses, setCourses] = useState<Course[]>(staticCourses);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to the main courses collection
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const dbCourses = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Course[];

      // Filter for published courses only for public view
      // Note: We might want a different hook for admin or filtered views, 
      // but for now, we merge and prefer Firestore data if ID matches
      
      const merged = [...staticCourses];
      
      dbCourses.forEach(dbCourse => {
        const index = merged.findIndex(c => c.id === dbCourse.id);
        if (index > -1) {
          // Update existing static course with firestore data
          merged[index] = { ...merged[index], ...dbCourse };
        } else if (dbCourse.status === 'published') {
          // Add new published course from firestore
          merged.push(dbCourse);
        }
      });

      // Also handle the case where a static course might be "shadowed" by a draft in Firestore
      // If a course exists in Firestore but status is 'draft', we should probably hide it if it's supposed to be managed
      const finalCourses = merged.filter(course => {
        const dbEntry = dbCourses.find(dc => dc.id === course.id);
        if (dbEntry) {
          return dbEntry.status === 'published';
        }
        // If not in DB, it's a static course that hasn't been "imported" to CMS yet, allow it?
        // Or should we only show what's in Firestore?
        // Let's allow static for now to not break initial app state
        return true;
      });

      setCourses(finalCourses);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching courses from Firestore:", error);
      setLoading(false);
    });

    return () => unsubCourses();
  }, []);

  return { courses, loading };
};
