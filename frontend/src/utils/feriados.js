import Holidays from 'date-holidays';

const feriadosAR = new Holidays('AR');

export function obtenerFeriadoArgentino(fechaTexto) {
  if (!fechaTexto) {
    return { esFeriado: false, nombre: '' };
  }

  const fecha = new Date(`${fechaTexto}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) {
    return { esFeriado: false, nombre: '' };
  }

  const feriados = feriadosAR.isHoliday(fecha);
  if (!feriados || feriados.length === 0) {
    return { esFeriado: false, nombre: '' };
  }

  return {
    esFeriado: true,
    nombre: feriados[0].name || '',
  };

}
