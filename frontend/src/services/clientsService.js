import { apiRequest } from './apiClient';

export function getClients(busqueda = '', estado = '') {
  const params = new URLSearchParams();
  if (busqueda) params.append('search', busqueda);
  if (estado) params.append('status', estado);
  const qs = params.toString();
  return apiRequest(`/clients${qs ? '?' + qs : ''}`);
}

export function getClientConditions(clientId) {
  return apiRequest(`/clients/${clientId}/conditions`);
}

// HU Solicitar reintegro de cuenta (cliente) — E1: motivo + cuenta suspendida → pending_reintegration
export function requestReintegration(clientId, motivo) {
  return apiRequest(`/clients/${clientId}/reintegration-request`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  });
}

// HU Reintegrar cuenta (admin) — devuelve la última solicitud del cliente (con su motivo) o null
export function getReintegrationRequest(clientId) {
  return apiRequest(`/clients/${clientId}/reintegration-request`);
}

// HU Suspender cuenta (admin) — E1: motivo obligatorio → cuenta pasa a "suspended"
export function suspendClient(clientId, motivo) {
  return apiRequest(`/clients/${clientId}/suspend`, {
    method: 'PUT',
    body: JSON.stringify({ motivo }),
  });
}

// HU Reintegrar cuenta (admin) — E1/E2: motivo opcional → cuenta pasa a "active"
export function reinstateClient(clientId, motivo = null) {
  return apiRequest(`/clients/${clientId}/reinstate`, {
    method: 'PUT',
    body: JSON.stringify({ motivo }),
  });
}

// HU Reintegrar cuenta — E3: admin rechaza solicitud con motivo obligatorio → cuenta vuelve a "suspended"
export function rejectReintegration(clientId, motivo) {
  return apiRequest(`/clients/${clientId}/reject-reintegration`, {
    method: 'PUT',
    body: JSON.stringify({ motivo }),
  });
}
