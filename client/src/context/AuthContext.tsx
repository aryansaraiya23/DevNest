import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, SignUpCredentials } from '../types/auth';
import { authApiService } from '../services/authApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: SignUpCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On mount: attempt to restore session from the HTTP-only cookie via /api/auth/me
  useEffect(() => {
    authApiService.getMe().then((existing) => {
      if (existing) setUser(existing);
      setIsLoading(false);
    });
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const loggedIn = await authApiService.login(credentials);
    setUser(loggedIn);
  };

  const register = async (credentials: SignUpCredentials): Promise<void> => {
    const registered = await authApiService.register(credentials);
    setUser(registered);
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApiService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

