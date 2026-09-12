import { useState, useEffect } from 'react';
import { User as AppUser } from '../types';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ami_jwt_token');
    const savedUser = localStorage.getItem('ami_user');
    if (token && savedUser) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (user: AppUser, token: string) => {
    localStorage.setItem('ami_jwt_token', token);
    localStorage.setItem('ami_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('ami_jwt_token');
    localStorage.removeItem('ami_user');
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  return { currentUser, isLoggedIn, login, logout, setCurrentUser, setIsLoggedIn };
};
