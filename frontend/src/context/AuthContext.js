import { createContext, useContext, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem('userInfo'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data); return data;
  };
  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data); return data;
  };
  const logout = () => { localStorage.removeItem('userInfo'); setUser(null); };
  const updateUser = (d) => {
    const merged = { ...user, ...d };
    localStorage.setItem('userInfo', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
