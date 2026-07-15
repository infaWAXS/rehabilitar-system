import { apiRequest } from './apiClient';

// ── Llamadas API ──────────────────────────────────────────

export function login(data) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function register(data) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function logout() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

export function requestPasswordRecovery(email) {
  return apiRequest('/auth/recovery/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function validateRecoveryToken(token) {
  return apiRequest(`/auth/recovery/validate?token=${encodeURIComponent(token)}`, {
    method: 'GET',
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

export function saveUserData({ access_token, role, name, lastname, account_status, id }) {
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('user_role', role);
  localStorage.setItem('user_name', name);
  localStorage.setItem('user_lastname', lastname || '');
  localStorage.setItem('account_status', account_status || 'active');
  if (id) localStorage.setItem('user_id', String(id));
}

export function clearUserData() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_lastname');
  localStorage.removeItem('account_status');
  localStorage.removeItem('user_id');
}

export function getToken() {
  return localStorage.getItem('access_token');
}

export function getRole() {
  return localStorage.getItem('user_role');
}

export function getUserId() {
  const id = localStorage.getItem('user_id');
  return id ? parseInt(id, 10) : null;
}

export function getAccountStatus() {
  return localStorage.getItem('account_status') || 'active';
}

export function getUserName() {
  const name = localStorage.getItem('user_name') || '';
  const lastname = localStorage.getItem('user_lastname') || '';
  return `${name} ${lastname}`.trim();
}

// Actualiza el nombre guardado en sesión tras editar el perfil, para que la
// cabecera muestre el nombre nuevo sin necesidad de volver a iniciar sesión.
export function updateStoredName(name, lastname) {
  if (name != null) localStorage.setItem('user_name', name);
  if (lastname != null) localStorage.setItem('user_lastname', lastname || '');
}

// ── Redirección por rol ───────────────────────────────────

export function getRoleRedirect(role) {
  const map = {
    admin: '/admin/usuarios',
    client: '/cliente/actividades',
    professor: '/profesor/actividades',
    receptionist: '/recepcionista/actividades',
  };
  return map[role] || '/';
}
