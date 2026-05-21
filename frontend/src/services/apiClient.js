const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('access_token');

  // El backend espera el token como query param ?token=xxx
  let url = `${API_BASE_URL}${path}`;
  if (token) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}token=${encodeURIComponent(token)}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message = payload?.detail || payload?.message || 'Error de API';
    throw new Error(message);
  }

  return payload;
}

const apiClient = {
  get: (path) => apiRequest(path, { method: 'GET' }).then(data => ({ data })),
  post: (path, data) => apiRequest(path, { method: 'POST', body: JSON.stringify(data) }).then(res => ({ data: res })),
  put: (path, data) => apiRequest(path, { method: 'PUT', body: JSON.stringify(data) }).then(res => ({ data: res })),
  delete: (path) => apiRequest(path, { method: 'DELETE' }).then(res => ({ data: res })),
};

export default apiClient;
export { API_BASE_URL, apiRequest };
