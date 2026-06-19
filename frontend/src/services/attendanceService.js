import { apiRequest } from './apiClient';

export function registerAttendanceByDni(data) {
  return apiRequest('/attendances/by-dni', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getAttendancesByActivity(activityId) {
  return apiRequest(`/attendances/by-activity/${activityId}`);
}

// Pre-genera registros "absent" para todos los inscriptos confirmados
export function initializeAttendances(activityId) {
  return apiRequest(`/attendances/initialize/${activityId}`, { method: 'POST' });
}

export function updateAttendanceComment(attendanceId, comment) {
  return apiRequest(`/attendances/${attendanceId}/comment`, {
    method: 'PATCH',
    body: JSON.stringify({ comment }),
  });
}

export function deleteAttendanceComment(attendanceId) {
  return apiRequest(`/attendances/${attendanceId}/comment`, {
    method: 'DELETE',
  });
}

// Genera un código QR válido por 15 minutos para registrar asistencia a la actividad
export function generateAttendanceQr(activityId) {
  return apiRequest(`/attendances/qr/${activityId}`, { method: 'POST' });
}

// Registra la asistencia del usuario autenticado a partir de un código QR escaneado
export function scanAttendanceQr(code) {
  return apiRequest('/attendances/qr/scan', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}
