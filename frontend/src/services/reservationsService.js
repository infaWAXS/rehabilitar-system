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

// HU: Inscribirse a actividad individual
export function reserveIndividual(data) {
  return apiRequest('/reservations/individual', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
