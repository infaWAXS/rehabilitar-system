import { apiRequest } from './apiClient';

export function getMyWaitlist() {
  return apiRequest('/waitlist/me');
}

// HU: Inscribirse a actividad fija/individual (lista de espera)
// `pago` lleva el deposit_percent (50-100) que abona el cliente no abonado para reservar
// su lugar en la cola. El abonado entra sin pagar y lo manda vacío.
export function addToWaitlist(activity_id, pago = {}) {
  return apiRequest('/waitlist', {
    method: 'POST',
    body: JSON.stringify({ activity_id, ...pago }),
  });
}

export function removeWaitlistItem(waitlistId) {
  return apiRequest(`/waitlist/${waitlistId}`, {
    method: 'DELETE',
  });
}

// HU: Listar lista de espera - admin y recepcionista
export function getActivityWaitlist(activityId) {
  return apiRequest(`/waitlist/activity/${activityId}`);
}
