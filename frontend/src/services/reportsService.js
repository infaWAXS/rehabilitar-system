// frontend/src/services/reportsService.js
import apiClient from './apiClient';

/**
 * HU: Generar reporte estadístico completo (Admin)
 * Llama al endpoint monolítico que procesa mapas de calor, asistencias, finanzas y profesores.
 */
export async function getStatisticsReport(fechaInicio, fechaFin) {
  const params = new URLSearchParams();
  params.append('fecha_inicio', fechaInicio);
  params.append('fecha_fin', fechaFin);
  
  // Utilizamos el método get del apiClient que ya maneja el token y los errores
  const response = await apiClient.get(`/api/reports/statistics?${params.toString()}`);
  
  // apiClient devuelve { data: payload }, extraemos la data
  return response.data;
}


export async function getFinancialReport(fechaInicio, fechaFin) {
  // apiClient ya debería tener interceptores para inyectar el token automáticamente
  // Cambiamos a la URL relativa y usamos el apiClient configurado
  const response = await apiClient.get(`/api/reports/finances?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
  
  return response.data;
}