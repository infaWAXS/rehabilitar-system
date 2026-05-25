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

/** Obtiene las opciones disponibles para los filtros de actividades */
export function getActivityFilterOptions(params = {}) {
  const query = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';
  return apiRequest(`/activities/options${query}`);
}

/** Obtiene el detalle de una actividad por ID */
export function getActivityById(activityId) {
  return apiRequest(`/activities/${activityId}`);
}

/** Obtiene la disponibilidad de cupos de una actividad */
export function getActivityAvailability(activityId) {
  return apiRequest(`/activities/${activityId}/availability`);
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

/**
 * HU Listar condiciones de cliente (Nahuel)
 * E1: hay inscriptos → lista con condición de acceso
 * E2: sin inscriptos → lista vacía
 * Lista los clientes inscriptos en una actividad con su condición de acceso.
 */
export function getActivityClients(activityId) {
  return apiRequest(`/activities/${activityId}/clients`);
}

