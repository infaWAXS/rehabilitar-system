const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function buildHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
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
