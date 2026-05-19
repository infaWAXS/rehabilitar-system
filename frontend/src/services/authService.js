import { apiRequest } from './apiClient';

export function login(data) {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function register(data) {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function saveToken(token) {
  localStorage.setItem('access_token', token);
}

export function clearToken() {
  localStorage.removeItem('access_token');
}
