import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { loginSuccess, logoutSuccess, setLoading } from '../store/authSlice';

const AuthListener = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Enforce IIITL authentication globally just in case
        if (user.email && user.email.endsWith('@iiitl.ac.in')) {
          dispatch(loginSuccess({
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            uid: user.uid
          }));
        } else {
          dispatch(logoutSuccess());
        }
      } else {
        dispatch(logoutSuccess());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthListener;
