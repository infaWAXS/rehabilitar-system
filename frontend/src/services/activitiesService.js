import { apiRequest } from './apiClient';

/**
 * Lista actividades. Parámetros opcionales: room_id, activity_type, status
 * @param {Object} params  e.g. { room_id: 1, activity_type: 'fixed', status: 'active' }
 */
export function getActivities(params = {}) {
  const query = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';
  return apiRequest(`/activities${query}`);
}

/** Obtiene el detalle de una actividad por ID */
export function getActivityById(activityId) {
  return apiRequest(`/activities/${activityId}`);
}

/** Crea una actividad (solo admin) */
export function createActivity(data) {
  return apiRequest('/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Actualiza campos de una actividad (solo admin) */
export function updateActivity(activityId, data) {
  return apiRequest(`/activities/${activityId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** Cancela una actividad (solo admin) — soft delete */
export function cancelActivity(activityId) {
  return apiRequest(`/activities/${activityId}`, { method: 'DELETE' });
}

