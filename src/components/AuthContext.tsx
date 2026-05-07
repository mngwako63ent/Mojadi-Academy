import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Use a function for the core logic so we can retry it
        const syncProfile = async () => {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const email = currentUser.email?.toLowerCase();
          const isAdminEmail = email === 'm.ngwako63@gmail.com' || email === 'admin@mojadiacademy.com';
          
          try {
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const data = userDoc.data();
              
              let updatedData = { ...data };
              let needsUpdate = false;

              if (isAdminEmail && data.role !== 'admin') {
                updatedData.role = 'admin';
                needsUpdate = true;
              }

              // Backfill missing or old format ID
              const isOldAdminId = data.studentId && data.studentId.startsWith('ADM-');
              if (!data.studentId || (updatedData.role === 'admin' && (isOldAdminId || !data.studentId.startsWith('ADMIN-')))) {
                const randomPart = Math.floor(1000 + Math.random() * 9000);
                if (updatedData.role === 'admin') {
                  updatedData.studentId = `ADMIN-${randomPart}`;
                } else {
                  const year = new Date().getFullYear();
                  const stuRandom = Math.floor(100000 + Math.random() * 900000);
                  updatedData.studentId = `STU-${year}-${stuRandom}`;
                }
                needsUpdate = true;
              }

              if (needsUpdate) {
                await setDoc(userDocRef, updatedData, { merge: true });
              }

              setUserProfile(updatedData);

              // Set online
              await updateDoc(userDocRef, {
                isOnline: true,
                lastSeen: serverTimestamp()
              });

            } else {
              const year = new Date().getFullYear();
              const randomPart = isAdminEmail ? Math.floor(1000 + Math.random() * 9000) : Math.floor(100000 + Math.random() * 900000);
              const studentId = isAdminEmail ? `ADMIN-${randomPart}` : `STU-${year}-${randomPart}`;
              
              // Create new user profile
              const newProfile = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                studentId,
                role: isAdminEmail ? 'admin' : 'user',
                isOnline: true,
                lastSeen: serverTimestamp(),
                createdAt: serverTimestamp(),
              };
              await setDoc(userDocRef, newProfile);
              setUserProfile(newProfile);
            }
          } catch (error) {
            console.error("Error fetching/creating user profile:", error);
            // If it's a permission error or similar, we'll keep loading as false but userProfile will be null
            // The components should handle null userProfile gracefully
          } finally {
            setLoading(false);
            setIsAuthReady(true);
          }
        };

        syncProfile();
      } else {
        // If logging out, try to set offline
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          updateDoc(userDocRef, {
            isOnline: false,
            lastSeen: serverTimestamp()
          }).catch(() => {});
        }
        setUserProfile(null);
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Recovery Logic: If user is present but profile is still missing after 5 seconds, retry once
  useEffect(() => {
    if (user && !userProfile && isAuthReady && !loading) {
      const timer = setTimeout(async () => {
        if (!userProfile) { // Check again after timeout
          console.log("Retrying profile sync...");
          const userDocRef = doc(db, 'users', user.uid);
          try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setUserProfile(userDoc.data());
            } else {
              // Try to create it again - maybe permissions were fixed
              const email = user.email?.toLowerCase();
              const isAdminEmail = email === 'm.ngwako63@gmail.com' || email === 'admin@mojadiacademy.com';
              const year = new Date().getFullYear();
              const randomPart = isAdminEmail ? Math.floor(1000 + Math.random() * 9000) : Math.floor(100000 + Math.random() * 900000);
              const studentId = isAdminEmail ? `ADMIN-${randomPart}` : `STU-${year}-${randomPart}`;
              
              const newProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                studentId,
                role: isAdminEmail ? 'admin' : 'user',
                isOnline: true,
                lastSeen: serverTimestamp(),
                createdAt: serverTimestamp(),
              };
              await setDoc(userDocRef, newProfile);
              setUserProfile(newProfile);
            }
          } catch (e) {
            console.error("Recovery sync failed:", e);
          }
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, userProfile, isAuthReady, loading]);

  // Presence Heartbeat
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);

    const updateStatus = async (online: boolean) => {
      try {
        await updateDoc(userDocRef, {
          isOnline: online,
          lastSeen: serverTimestamp()
        });
      } catch (e) {
        // Ignore errors (e.g. if already logged out)
      }
    };

    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateStatus(true);
      }
    }, 120000); // 2 minutes

    const handleVisibilityChange = () => {
      updateStatus(document.visibilityState === 'visible');
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => updateStatus(false));

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      updateStatus(false);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
