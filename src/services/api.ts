import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Determinar la URL base según la plataforma y el entorno
const getDefaultBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    // 10.0.2.2 es el host del emulador Android para acceder al localhost de Windows
    return 'http://10.0.2.2:8080/api/v1';
  }
  return 'http://localhost:8080/api/v1';
};

export const API_BASE_URL = getDefaultBaseUrl();

export const TOKEN_STORAGE_KEY = '@carwash_inmari_token';
export const USER_STORAGE_KEY = '@carwash_inmari_user';

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const onUnauthorized = (handler: () => void): (() => void) => {
  unauthorizedHandler = handler;
  return () => { if (unauthorizedHandler === handler) unauthorizedHandler = null; };
};

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = (): string | null => {
  return authToken;
};

export const resolveMediaUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('file://') || url.startsWith('data:')) {
    return url;
  }
  const backendHost = API_BASE_URL.replace('/api/v1', '');

  // Si es URL directa de R2 S3 API (que es privada), proxearla a través de Go /api/v1/archivos/
  if (url.includes('r2.cloudflarestorage.com/')) {
    const parts = url.split('r2.cloudflarestorage.com/');
    if (parts.length > 1) {
      let key = parts[1];
      if (key.startsWith('carwash-inmari/')) {
        key = key.replace('carwash-inmari/', '');
      }
      return `${API_BASE_URL}/archivos/${key}`;
    }
  }

  // Si es una ruta relativa local
  if (url.startsWith('/')) {
    return `${backendHost}${url}`;
  }

  return url;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

const buildHeaders = (isJson = true): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401 && authToken) unauthorizedHandler?.();
  if (!response.ok) {
    let errorMessage = `Error HTTP ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) {
        errorMessage = errorJson.error;
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Ignorar fallo de parseo
    }
    throw new ApiError(response.status, errorMessage);
  }

  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();
  if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
    return json.data as T;
  }
  return json as T;
};

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: buildHeaders(true),
    });
    return handleResponse<T>(res);
  },

  post: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(res);
  },

  put: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: buildHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(res);
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE', headers: buildHeaders(true) });
    return handleResponse<T>(res);
  },

  patch: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: buildHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(res);
  },

  uploadMultipart: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const headers = buildHeaders(false); // No fijar Content-Type para permitir boundary
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse<T>(res);
  },
};
