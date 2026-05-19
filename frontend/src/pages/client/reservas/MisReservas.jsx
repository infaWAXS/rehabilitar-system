import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function MisReservas() {
  return (
    <LayoutPrivado titulo="Mis Reservas">
      <PaginaEsqueleto
        titulo="Mis Reservas"
        descripcion="Ver y gestionar tus reservas de turnos activas."
        tags={['Ver mis reservas', 'Inscribirse a actividad fija', 'Inscribirse a actividad individual', 'Cancelar turno']}
      />
    </LayoutPrivado>
  );
}

export default MisReservas;
