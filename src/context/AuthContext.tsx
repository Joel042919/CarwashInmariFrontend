import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario, RolUsuario } from '@/types';
import {
  setAuthToken,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  onUnauthorized,
} from '@/services/api';
import { authService, LoginParams, RegisterClienteParams } from '@/services/auth.service';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: RolUsuario | null;
  isAdmin: boolean;
  isCliente: boolean;
  isTrabajador: boolean;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterClienteParams) => Promise<void>;
  logout: () => Promise<void>;
  updateUserLocal: (updatedUser: Partial<Usuario>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializar sesión guardada al montar la app
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(USER_STORAGE_KEY),
        ]);

        if (savedToken && savedUser) {
          setAuthToken(savedToken);
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error('Error cargando sesión persistida:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = useCallback(async (params: LoginParams) => {
    setIsLoading(true);
    try {
      const resp = await authService.login(params);
      setAuthToken(resp.token);
      setToken(resp.token);
      setUser(resp.usuario);

      await Promise.all([
        AsyncStorage.setItem(TOKEN_STORAGE_KEY, resp.token),
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(resp.usuario)),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (params: RegisterClienteParams) => {
    setIsLoading(true);
    try {
      const resp = await authService.register(params);
      setAuthToken(resp.token);
      setToken(resp.token);
      setUser(resp.usuario);

      await Promise.all([
        AsyncStorage.setItem(TOKEN_STORAGE_KEY, resp.token),
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(resp.usuario)),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      setAuthToken(null);
      setToken(null);
      setUser(null);
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
        AsyncStorage.removeItem(USER_STORAGE_KEY),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserLocal = useCallback(async (updatedFields: Partial<Usuario>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  }, [user]);

  useEffect(() => onUnauthorized(() => { void logout(); }), [logout]);

  const value = useMemo<AuthContextType>(() => {
    const userRole = user?.rol || null;
    return {
      user,
      token,
      isLoading,
      isAuthenticated: !!token && !!user,
      role: userRole,
      isAdmin: userRole === 'administrador',
      isCliente: userRole === 'cliente',
      isTrabajador: userRole === 'trabajador',
      login,
      register,
      logout,
      updateUserLocal,
    };
  }, [user, token, isLoading, login, register, logout, updateUserLocal]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
