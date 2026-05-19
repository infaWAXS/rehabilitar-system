import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function ActividadesCliente() {
  return (
    <LayoutPrivado titulo="Actividades">
      <PaginaEsqueleto
        titulo="Actividades disponibles"
        descripcion="Ver, buscar y filtrar actividades para inscribirse."
        tags={['Ver actividad', 'Filtrar actividades', 'Buscar actividades', 'Inscribirse a actividad fija', 'Inscribirse a actividad individual']}
      />
    </LayoutPrivado>
  );
}

export default ActividadesCliente;
