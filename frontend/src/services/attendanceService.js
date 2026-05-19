import { apiRequest } from './apiClient';

// TODO (Ezequiel): conectar con attendanceRoutes.py
export function registerAttendanceByDni(data) {
  return apiRequest('/attendances/by-dni', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
