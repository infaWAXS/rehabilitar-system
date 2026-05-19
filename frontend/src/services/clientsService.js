import { apiRequest } from './apiClient';

// TODO (Nahuel): reemplazar endpoints cuando se implemente clientRoutes.py
export function getClients() {
  return apiRequest('/clients');
}

export function getClientConditions(clientId) {
  return apiRequest(`/clients/${clientId}/conditions`);
}

export function requestReintegration(clientId) {
  return apiRequest(`/clients/${clientId}/reintegration-request`, {
    method: 'POST',
  });
}
