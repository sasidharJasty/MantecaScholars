const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

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
