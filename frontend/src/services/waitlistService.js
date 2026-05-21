import { apiRequest } from './apiClient';

export function getMyWaitlist() {
  return apiRequest('/waitlist/me');
}

// HU: Inscribirse a actividad fija/individual (lista de espera)
export function addToWaitlist(activity_id) {
  return apiRequest('/waitlist', {
    method: 'POST',
    body: JSON.stringify({ activity_id }),
  });
}

export function removeWaitlistItem(waitlistId) {
  return apiRequest(`/waitlist/${waitlistId}`, {
    method: 'DELETE',
  });
}
