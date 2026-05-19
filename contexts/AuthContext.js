'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { user, loading, error, login, logout, register } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || 'user');
            setUserProfile(userData);
          } else {
            // User document doesn't exist, create with default role
            const defaultName = user.email?.split('@')[0] || 'User';
            setUserRole('user');
            setUserProfile({ email: user.email, role: 'user', name: defaultName });
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user'); // Default to user role on error
        }
      } else {
        setUserRole(null);
        setUserProfile(null);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = userRole === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        register,
        userRole,
        userProfile,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
