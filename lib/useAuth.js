import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email, password, firstName, lastName) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      // Create user document in Firestore
      const userDoc = {
        uid: userCredential.user.uid,
        email: email,
        name: fullName || email.split('@')[0],
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: email === 'admin@school.local' || email === 'superadmin@school.local' ? 'admin' : 'user',
        department: '',
        phone: '',
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

      // After creating the user document, sign out the user so they must
      // explicitly sign in via the login page before accessing protected routes.
      try {
        await signOut(auth);
      } catch (signOutErr) {
        console.warn('Failed to sign out after registration:', signOutErr);
      }

      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { user, loading, error, register, login, logout };
}
