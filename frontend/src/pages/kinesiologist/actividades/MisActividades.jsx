import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function MisActividadesKinesiologo() {
  return (
    <LayoutPrivado titulo="Mis Actividades">
      <PaginaEsqueleto
        titulo="Mis Actividades"
        descripcion="Ver y gestionar las actividades a cargo del kinesiólogo."
        tags={['Ver actividad', 'Renunciar actividad', 'Cancelar actividad']}
      />
    </LayoutPrivado>
  );
}

export default MisActividadesKinesiologo;
