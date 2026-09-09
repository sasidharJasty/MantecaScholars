const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const request = async (token: string | null) => {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  };

  let response = await request(localStorage.getItem('accessToken'));

  if (response.status === 401 && endpoint !== '/token/refresh/') {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshResponse.ok) {
        const refreshed = await refreshResponse.json();
        localStorage.setItem('accessToken', refreshed.access);
        if (refreshed.refresh) localStorage.setItem('refreshToken', refreshed.refresh);
        response = await request(refreshed.access);
      }
    }

    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new Event('manteca:session-expired'));
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || 'API request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (endpoint: string, options: RequestInit = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, data?: any, options: RequestInit = {}) => apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(data ?? {}) }),
  put: (endpoint: string, data?: any, options: RequestInit = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data ?? {}) }),
  patch: (endpoint: string, data?: any, options: RequestInit = {}) => apiRequest(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data ?? {}) }),
  delete: (endpoint: string, options: RequestInit = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
