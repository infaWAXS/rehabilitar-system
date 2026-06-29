import { apiRequest, API_BASE_URL } from './apiClient';

export function getCurrentUser() {
  return apiRequest('/users/me');
}

export function getUsers(params = '') {
  const query = params ? `?${params}` : '';
  return apiRequest(`/users/${query}`);
}

export function searchUsers(search = '', role = '', status = '') {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (role) params.append('role', role);
  if (status) params.append('status', status);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/users/search${qs}`);
}

export function getClients(search = '', status = '') {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/users/clients/list${qs}`);
}

export function getUserById(userId) {
  return apiRequest(`/users/${userId}`);
}

// HU Crear cuenta (admin): crea la cuenta sin contraseña — el backend genera una
// contraseña temporal y se la envía al usuario por mail.
export function createUserByAdmin(data) {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function modifyUser(userId, data) {
  return apiRequest(`/users/${userId}/modify`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function adminUploadCertificate(userId, file) {
  const token = localStorage.getItem('access_token');
  const formData = new FormData();
  formData.append('file', file);
  const url = `${API_BASE_URL}/users/${userId}/upload-medical-certificate?token=${encodeURIComponent(token)}`;
  return fetch(url, { method: 'POST', body: formData }).then(r => r.json());
}

export function deleteUser(userId) {
  return apiRequest(`/users/${userId}`, { method: 'DELETE' });
}

export function deleteMyAccount() {
  return apiRequest('/users/me', { method: 'DELETE' });
}

export function updateUserInfo(data) {
  return apiRequest('/users/update-info', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function changePassword(data) {
  return apiRequest('/users/change-password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Sube el certificado médico del usuario autenticado (multipart/form-data).
export function uploadMedicalCertificate(file) {
  const token = localStorage.getItem('access_token');
  const formData = new FormData();
  formData.append('file', file);
  const url = `${API_BASE_URL}/users/upload-medical-certificate?token=${encodeURIComponent(token)}`;
  return fetch(url, { method: 'POST', body: formData }).then(r => r.json());
}

// Sube el certificado médico usando un token explícito (post-registro).
export function uploadMedicalCertificateWithToken(token, file) {
  const formData = new FormData();
  formData.append('file', file);
  const url = `${API_BASE_URL}/users/upload-medical-certificate?token=${encodeURIComponent(token)}`;
  return fetch(url, { method: 'POST', body: formData }).then(r => r.json());
}

// HU Registrar usuario (Agustin) - E6: sube foto del DNI post-registro para validación externa.
// TODO (Agustin): cuando el sistema externo valide, dni_verified pasará a true y se poblará el dni.
export function uploadDniWithToken(token, file) {
  const formData = new FormData();
  formData.append('file', file);
  const url = `${API_BASE_URL}/users/upload-dni?token=${encodeURIComponent(token)}`;
  return fetch(url, { method: 'POST', body: formData }).then(r => r.json());
}

// Devuelve la lista pública de staff activo con filtros opcionales.
export function getStaff(search = '', specialization = '') {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (specialization) params.append('specialization', specialization);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/auth/staff${qs}`);
}

// Devuelve las especializaciones disponibles para el filtro del staff.
export function getStaffSpecializations() {
  return apiRequest('/auth/staff/specializations');
}

// HU Verificar apto físico (admin) - devuelve clientes con medical_certificate_status = "pending".
export function getPendingMedical() {
  return apiRequest('/users/pending-medical');
}

// HU Verificar apto físico (admin) - E1: aprueba el apto físico del cliente (status → "approved").
export function approveMedical(userId) {
  return apiRequest(`/users/acept-medical/${userId}`, { method: 'PUT' });
}

// HU Verificar apto físico (admin) - E2: desaprueba el apto físico del cliente (status → "rejected").
export function rejectMedical(userId) {
  return apiRequest(`/users/reject-medical/${userId}`, { method: 'PUT' });
}
