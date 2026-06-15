import { apiRequest } from './apiClient';

export function registerAttendanceByDni(data) {
  return apiRequest('/attendances/by-dni', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function generateAttendanceQr(activityId) {
  return apiRequest('/attendances/qr/generate', {
    method: 'POST',
    body: JSON.stringify({ activity_id: activityId }),
  });
}

export function registerAttendanceByQr(token) {
  return apiRequest('/attendances/qr/register', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function getAttendanceSessionStatus(activityId) {
  return apiRequest(`/attendances/session-status/${activityId}`);
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
