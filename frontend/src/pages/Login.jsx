import React, { useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { setLoading, loginSuccess, setError } from '../store/authSlice';
import styles from './Login.module.css';

const Login = () => {
  const { user, loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // If user is already logged in, redirect away from login page
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleLogin = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const result = await signInWithPopup(auth, googleProvider);
      const authenticatedUser = result.user;

      // Domain Enforcement Check
      if (authenticatedUser.email && !authenticatedUser.email.endsWith('@iiitl.ac.in')) {
        await signOut(auth);
        dispatch(setError("Only IIIT Lucknow institutional accounts are allowed."));
        return; // Early return prevents Redux login success
      }

      dispatch(loginSuccess({
        displayName: authenticatedUser.displayName,
        email: authenticatedUser.email,
        photoURL: authenticatedUser.photoURL,
        uid: authenticatedUser.uid
      }));

      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        dispatch(setError('Sign-in popup was closed before completing. Please try again.'));
      } else {
        dispatch(setError('Failed to sign in. Please verify your internet connection or try again later.'));
      }
    }
  };

  // Generate random particles securely wrapped in useMemo preventing intense continuous array recreation on component redraws
  const particles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  })), []);

  return (
    <div className={styles.container}>
      {/* Animated Glowing Particles */}
      <div className={styles.particles}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: `${p.x}vw`, y: `${p.y}vh` }}
            animate={{
              opacity: [0, 0.6, 0],
              y: [`${p.y}vh`, `${p.y - 30}vh`]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "linear"
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: '#a777e3',
              boxShadow: '0 0 15px 3px rgba(167, 119, 227, 0.6)',
            }}
          />
        ))}
      </div>

      <motion.div
        className={styles.authCard}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", type: "spring", stiffness: 100 }}
      >
        <div className={styles.logoContainer}>
          <motion.div
            className={styles.iconWrapper}
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.5 }}
          >
            <User size={34} color="white" />
          </motion.div>
        </div>

        <motion.h1
          className={styles.heading}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Welcome to UserRush
        </motion.h1>

        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Sign in with your IIIT Lucknow account
        </motion.p>

        <motion.button
          className={styles.googleBtn}
          onClick={handleGoogleLogin}
          disabled={loading}
          whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(167, 119, 227, 0.4)' }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {loading ? (
            <div className={styles.spinner}></div>
          ) : (
            <>
              <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </>
          )}
        </motion.button>

        {error && (
          <motion.div
            className={styles.errorMsg}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring" }}
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
