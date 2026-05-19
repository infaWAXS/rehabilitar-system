import { apiRequest } from './apiClient';

// TODO (Agustin): conectar con reservationRoutes.py
export function getMyReservations() {
  return apiRequest('/reservations/me');
}

export function reserveFixed(data) {
  return apiRequest('/reservations/fixed', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function reserveIndividual(data) {
  return apiRequest('/reservations/individual', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
