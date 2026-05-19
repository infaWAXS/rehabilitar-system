import { apiRequest } from './apiClient';

// TODO (Angel): conectar con activityRoutes.py
export function getActivities(params = '') {
  const query = params ? `?${params}` : '';
  return apiRequest(`/activities${query}`);
}

export function createActivity(data) {
  return apiRequest('/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
