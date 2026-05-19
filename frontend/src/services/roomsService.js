import { apiRequest } from './apiClient';

export async function getRooms() {
  return apiRequest('/'); // El endpoint principal devuelve las salas
}
