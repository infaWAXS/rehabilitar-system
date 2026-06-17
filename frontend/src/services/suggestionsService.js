import { apiRequest } from './apiClient';

/** El profesor autenticado sugiere una nueva actividad */
export function suggestActivity(data) {
  return apiRequest('/suggestions/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Lista las sugerencias pendientes de revisión (solo admin) */
export function getPendingSuggestions() {
  return apiRequest('/suggestions/pending');
}

/** Acepta una sugerencia: crea la actividad real con el precio indicado */
export function acceptSuggestion(suggestionId, price) {
  return apiRequest(`/suggestions/${suggestionId}/accept`, {
    method: 'PATCH',
    body: JSON.stringify({ price }),
  });
}

/** Rechaza una sugerencia */
export function rejectSuggestion(suggestionId) {
  return apiRequest(`/suggestions/${suggestionId}/reject`, {
    method: 'PATCH',
  });
}