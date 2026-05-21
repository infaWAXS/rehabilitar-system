import apiClient from "./apiClient";

/**
 * Obtiene la lista de las 7 salas físicas del centro.
 * @returns {Promise<Array>} Lista de salas con id, name, capacity
 */
export const getRooms = () =>
  apiClient.get("/rooms").then((res) => res.data);

/**
 * Obtiene el detalle de una sala por ID.
 * @param {number} roomId
 */
export const getRoomById = (roomId) =>
  apiClient.get(`/rooms/${roomId}`).then((res) => res.data);
