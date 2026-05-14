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

  const register = async (email, password) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Create user document in Firestore
      const userDoc = {
        uid: userCredential.user.uid,
        email: email,
        name: email.split('@')[0], // Default name from email
        role: email === 'admin@school.local' ? 'admin' : 'user', // Auto-admin for admin email
        department: '',
        phone: '',
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

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
