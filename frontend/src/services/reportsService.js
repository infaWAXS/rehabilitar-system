import { apiRequest } from './apiClient';

/**
 * HU: Generar reporte (Admin)
 * Agregamos /api inicial para que coincida exactamente con el prefijo del backend
 */
export function getStatisticsReport(fechaInicio, fechaFin) {
  const params = new URLSearchParams();
  params.append('fecha_inicio', fechaInicio);
  params.append('fecha_fin', fechaFin);
  
  // ── SOLUCIÓN: Agregamos /api adelante para que la URL final sea /api/reports/...
  return apiRequest(`/api/reports/statistics?${params.toString()}`); 
}