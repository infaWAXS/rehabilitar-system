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
