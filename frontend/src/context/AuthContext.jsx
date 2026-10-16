import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
          localStorage.setItem('applyzen_user', JSON.stringify(userData));
        } catch (err) {
          console.error("Token verification failed:", err);
          authService.logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (identifier, password) => {
    const res = await authService.login(identifier, password);
    setUser(res.user);
    return res;
  };

  const signup = async (email, password, fullName, username) => {
    const res = await authService.signup(email, password, fullName, username);
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const googleLogin = async (payload) => {
    const res = await authService.googleAuth(payload);
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const verifyEmail = async (payload) => {
    const res = await authService.verifyEmail(payload);
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    authService.logout();
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const nextUser = { ...(prev || {}), ...updatedFields };
      localStorage.setItem('applyzen_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const setAuthUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('applyzen_user', JSON.stringify(userData));
    }
  };

  const activeUser = user || authService.getCurrentUser();

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        loading,
        login,
        signup,
        googleLogin,
        verifyEmail,
        logout,
        updateUser,
        setAuthUser,
        isAuthenticated: !!activeUser && authService.isAuthenticated()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
