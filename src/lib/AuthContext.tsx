import React, { createContext, useContext, useEffect, useState, type ReactNode, type FC } from 'react';

export interface User {
  uid: string;
  email?: string;
  displayName?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>; // Kept name for compatibility
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('tidepool_auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = async (): Promise<void> => {
    setLoading(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));
    
    // Create a local mock user
    const newUser: User = {
      uid: 'local_' + Math.random().toString(36).substring(2, 11),
      displayName: 'Guest Researcher',
      email: 'guest@local.sim'
    };
    
    localStorage.setItem('tidepool_auth_user', JSON.stringify(newUser));
    setUser(newUser);
    setLoading(false);
  };

  const logout = async (): Promise<void> => {
    localStorage.removeItem('tidepool_auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
