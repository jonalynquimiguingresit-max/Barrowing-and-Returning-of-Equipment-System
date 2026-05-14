'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { user, loading, error, login, logout, register } = useAuth();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (user) {
      // Default role - in production, fetch from Firestore
      setUserRole('user');
    } else {
      setUserRole(null);
    }
  }, [user]);

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
