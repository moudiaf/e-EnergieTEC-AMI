import { useCallback, useRef } from 'react';
import { useToasts } from './useToasts';

export const useApi = (logout: () => void) => {
  const { addToast } = useToasts();
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const addToastRef = useRef(addToast);
  addToastRef.current = addToast;

  const getApiUrl = (url: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return url.startsWith('http') ? url : `${baseUrl}${url}`;
  };

  const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = localStorage.getItem('ami_jwt_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const fullUrl = getApiUrl(url);
    let res: Response;
    try {
      res = await fetch(fullUrl, { ...options, headers });
    } catch (err: any) {
      // Chrome net::ERR_NETWORK_CHANGED / Transient Network Switch Retry
      await new Promise(resolve => setTimeout(resolve, 600));
      try {
        res = await fetch(fullUrl, { ...options, headers });
      } catch (retryErr) {
        throw retryErr;
      }
    }

    if (res.status === 403 || res.status === 401) {
      if (url !== '/api/login') {
        logoutRef.current();
        addToastRef.current('Session expirée — Veuillez vous reconnecter.', 'error');
      }
    }
    return res;
  }, []);

  return { authFetch, getApiUrl };
};
