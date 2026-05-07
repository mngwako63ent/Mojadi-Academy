import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { courses as staticCourses, Course } from '../data/courses';

export const useCoursePricing = () => {
  const [courses, setCourses] = useState<Course[]>(staticCourses);
  const [overrides, setOverrides] = useState<Record<string, { price: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'course_overrides'), (snapshot) => {
      const newOverrides: Record<string, { price: number }> = {};
      snapshot.docs.forEach(doc => {
        newOverrides[doc.id] = doc.data() as { price: number };
      });
      setOverrides(newOverrides);

      const mergedCourses = staticCourses.map(course => {
        if (newOverrides[course.id]) {
          return {
            ...course,
            price: newOverrides[course.id].price
          };
        }
        return course;
      });
      setCourses(mergedCourses);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching course pricing overrides:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { courses, overrides, loading };
};
