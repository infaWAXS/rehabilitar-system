const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export async function apiRequest(path, options = {}) {
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

export { API_BASE_URL };
