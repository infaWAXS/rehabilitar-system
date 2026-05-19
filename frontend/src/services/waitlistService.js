import { apiRequest } from './apiClient';

// TODO (Agustin): conectar con waitlistRoutes.py
export function getMyWaitlist() {
  return apiRequest('/waitlist/me');
}

export function removeWaitlistItem(waitlistId) {
  return apiRequest(`/waitlist/${waitlistId}`, {
    method: 'DELETE',
  });
}
