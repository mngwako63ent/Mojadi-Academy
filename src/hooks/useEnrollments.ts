import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../components/AuthContext';

export const useEnrollments = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEnrollments({});
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'enrollments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data();
      });
      setEnrollments(data);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to enrollments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { enrollments, loading };
};
