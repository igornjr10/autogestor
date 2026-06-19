import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const ACCESS_KEY = 'gv_access_token';
const REFRESH_KEY = 'gv_refresh_token';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Renovação automática do access token via refresh token
let refreshing: Promise<string> | null = null;

async function renovarToken(): Promise<string> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) throw new Error('Sem refresh token');
  const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  tokenStore.set(data.accessToken, data.refreshToken);
  return data.accessToken;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retry && !isAuthRoute && tokenStore.refresh) {
      original._retry = true;
      try {
        refreshing = refreshing ?? renovarToken();
        const novoToken = await refreshing;
        refreshing = null;
        original.headers.Authorization = `Bearer ${novoToken}`;
        return api(original);
      } catch {
        refreshing = null;
        tokenStore.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/** Extrai mensagem de erro amigável de uma resposta da API. */
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(' ');
    if (typeof msg === 'string') return msg;
  }
  return 'Ocorreu um erro inesperado.';
}
