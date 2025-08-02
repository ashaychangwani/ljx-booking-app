import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserInfo {
  email: string;
  lastName: string;
  unitNumber: string;
}

interface UserContextType {
  userInfo: UserInfo | null;
  setUserInfo: (userInfo: UserInfo | null) => void;
  clearUserInfo: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null);

  // Load user info from localStorage on mount
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('ljx-userinfo');
    if (storedUserInfo) {
      try {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        setUserInfoState(parsedUserInfo);
      } catch (error) {
        console.error('Failed to parse stored user info:', error);
        localStorage.removeItem('ljx-userinfo');
      }
    }
  }, []);

  const setUserInfo = (userInfo: UserInfo | null) => {
    setUserInfoState(userInfo);
    if (userInfo) {
      localStorage.setItem('ljx-userinfo', JSON.stringify(userInfo));
    } else {
      localStorage.removeItem('ljx-userinfo');
    }
  };

  const clearUserInfo = () => {
    setUserInfo(null);
  };

  const value: UserContextType = {
    userInfo,
    setUserInfo,
    clearUserInfo,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
} 