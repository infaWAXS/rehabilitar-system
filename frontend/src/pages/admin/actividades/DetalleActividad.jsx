import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function DetalleActividad() {
  return (
    <LayoutPrivado titulo="Detalle de Actividad">
      <PaginaEsqueleto
        titulo="Detalle de actividad"
        descripcion="Ver detalle completo de una actividad, cancelarla o renunciar a ella."
        tags={['Ver actividad', 'Cancelar actividad', 'Renunciar actividad']}
      />
    </LayoutPrivado>
  );
}

export default DetalleActividad;
