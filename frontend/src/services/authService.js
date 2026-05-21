import { apiRequest } from './apiClient';

// ── Llamadas API ──────────────────────────────────────────

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

export function logout() {
  return apiRequest('/logout', { method: 'POST' });
}

export function requestPasswordRecovery(email) {
  return apiRequest('/auth/recovery/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token, new_password, confirm_password) {
  return apiRequest('/auth/recovery/reset', {
    method: 'POST',
    body: JSON.stringify({ token, new_password, confirm_password }),
  });
}

export function changePassword(new_password, confirm_password) {
  return apiRequest('/users/change-password', {
    method: 'PUT',
    body: JSON.stringify({ new_password, confirm_password }),
  });
}

// ── Helpers de sesión (localStorage) ─────────────────────

export function saveUserData({ access_token, role, name, lastname, account_status }) {
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('user_role', role);
  localStorage.setItem('user_name', name);
  localStorage.setItem('user_lastname', lastname || '');
  localStorage.setItem('account_status', account_status || 'active');
}

export function clearUserData() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_lastname');
  localStorage.removeItem('account_status');
}

export function getToken() {
  return localStorage.getItem('access_token');
}

export function getRole() {
  return localStorage.getItem('user_role');
}

export function getAccountStatus() {
  return localStorage.getItem('account_status') || 'active';
}

export function getUserName() {
  const name = localStorage.getItem('user_name') || '';
  const lastname = localStorage.getItem('user_lastname') || '';
  return `${name} ${lastname}`.trim();
}

// ── Redirección por rol ───────────────────────────────────

export function getRoleRedirect(role) {
  const map = {
    admin: '/admin/usuarios',
    client: '/cliente/actividades',
    professor: '/profesor/actividades',
    receptionist: '/admin/clientes',
  };
  return map[role] || '/';
}
