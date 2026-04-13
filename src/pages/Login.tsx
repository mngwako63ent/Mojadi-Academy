import React, { useState, useEffect } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, User, LogIn, UserPlus, Camera } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const location = useLocation();
  const from = (location.state as any)?.from || '/';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate(from, { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate, from]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      const errorCode = err.code || (err.cause && (err.cause as any).code);
      if (errorCode === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in the Firebase Console. Please add your live URL to the "Authorized domains" list in Firebase Authentication settings.');
      } else {
        setError(err.message || 'Google Sign-In failed. Please check the console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp && password !== repeatPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        console.log("Attempting sign up with:", email);
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          console.log("Sign up successful, updating profile...");
          if (name) {
            await updateProfile(userCredential.user, { displayName: name });
          }
          console.log("Profile updated, navigating...");
          navigate(from, { replace: true });
        } catch (err: any) {
          console.error("Detailed Sign-Up Error:", err);
          const errorCode = err.code || (err.cause && (err.cause as any).code);
          console.log("Error Code:", errorCode);
          
          if (errorCode === 'auth/email-already-in-use') {
            setError('User already exists. Sign in?');
          } else if (errorCode === 'auth/operation-not-allowed') {
            setError('Email/Password authentication is not enabled in the Firebase Console. Please enable it in the Authentication > Sign-in method tab.');
          } else if (errorCode === 'auth/weak-password') {
            setError('Password must be at least 6 characters long');
          } else if (errorCode === 'auth/invalid-email') {
            setError('Invalid email address format.');
          } else if (errorCode === 'auth/unauthorized-domain') {
            setError('This domain is not authorized in the Firebase Console. Please add your live URL to the "Authorized domains" list in Firebase Authentication settings.');
          } else {
            setError(err.message || 'An error occurred during sign up. Please check the console for details.');
          }
          setLoading(false);
          return;
        }
      } else {
        console.log("Attempting sign in with:", email);
        try {
          await signInWithEmailAndPassword(auth, email, password);
          console.log("Sign in successful, navigating...");
          navigate(from, { replace: true });
        } catch (err: any) {
          console.error("Detailed Sign-In Error:", err);
          const errorCode = err.code || (err.cause && (err.cause as any).code);
          console.log("Error Code:", errorCode);

          if (
            errorCode === 'auth/wrong-password' || 
            errorCode === 'auth/user-not-found' || 
            errorCode === 'auth/invalid-credential' ||
            errorCode === 'auth/invalid-email'
          ) {
            setError('Password or Email Incorrect');
          } else if (errorCode === 'auth/operation-not-allowed') {
            setError('Email/Password authentication is not enabled in the Firebase Console.');
          } else if (errorCode === 'auth/user-disabled') {
            setError('This account has been disabled.');
          } else if (errorCode === 'auth/unauthorized-domain') {
            setError('This domain is not authorized in the Firebase Console. Please add your live URL to the "Authorized domains" list in Firebase Authentication settings.');
          } else {
            setError(err.message || 'An error occurred during sign in. Please check the console for details.');
          }
          setLoading(false);
          return;
        }
      }
      navigate('/');
    } catch (err: any) {
      console.error("General Auth Error:", err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-32 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-[2rem] w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h1>
          <p className="text-primary/60 dark:text-sage">
            {isSignUp ? 'Join our community of farmers' : 'Sign in to your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div className="flex justify-center mb-6">
                <label className="relative cursor-pointer group">
                  <div className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border-2 border-dashed border-primary/20 dark:border-sage/20 group-hover:border-secondary transition-all overflow-hidden">
                    {photo ? (
                      <img src={URL.createObjectURL(photo)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="text-primary/40 dark:text-sage" size={32} />
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  />
                  <div className="absolute bottom-0 right-0 bg-secondary text-white p-1.5 rounded-full shadow-lg">
                    <UserPlus size={14} />
                  </div>
                </label>
              </div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 dark:text-sage" size={20} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all"
                />
              </div>
            </>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 dark:text-sage" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 dark:text-sage" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all"
            />
          </div>
          {isSignUp && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 dark:text-sage" size={20} />
              <input
                type="password"
                placeholder="Repeat Password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                required
                className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-premium bg-primary dark:bg-sage text-white dark:text-neutral-dark hover:bg-accent dark:hover:bg-sage-bright flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/5 dark:border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-neutral-bg dark:bg-neutral-dark px-2 text-primary/40 dark:text-sage">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full glass py-3 rounded-2xl flex items-center justify-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span className="font-medium">Google</span>
        </button>

        <p className="text-center text-sm text-primary/60 dark:text-sage">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-secondary dark:text-[#E6B981] font-bold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
