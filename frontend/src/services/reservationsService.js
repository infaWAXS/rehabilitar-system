// Responsable: Francis
import { apiRequest } from './apiClient';

export function getMyReservations() {
  return apiRequest('/reservations/me');
}

// HU: Inscribirse a actividad fija
export function reserveFixed(data) {
  return apiRequest('/reservations/fixed', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// HU: Obtener opciones de inscripción a una actividad (descuentos por edad, disponibilidad de suscripción, etc.)
export function getInscriptionOptions(activityId) {
  return apiRequest(`/reservations/activity/${activityId}/inscription-options`);
}

// HU: Inscribirse a actividad individual
export function reserveIndividual(data) {
  return apiRequest('/reservations/individual', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// HU: Cancelar turno
export function cancelReservation(reservationId) {
  return apiRequest(`/reservations/${reservationId}/cancel`, { method: 'PUT' });
}
