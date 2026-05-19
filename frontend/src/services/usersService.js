import { apiRequest } from './apiClient';

export function getCurrentUser() {
  return apiRequest('/users/me');
}

export function getUsers(params = '') {
  const query = params ? `?${params}` : '';
  return apiRequest(`/users/${query}`);
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
