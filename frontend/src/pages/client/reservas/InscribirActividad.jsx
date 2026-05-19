import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function InscribirActividad() {
  return (
    <LayoutPrivado titulo="Inscribirse a Actividad">
      <PaginaEsqueleto
        titulo="Inscribirse a actividad"
        descripcion="Seleccionar y confirmar inscripción a una actividad fija o individual."
        tags={['Inscribirse a actividad fija', 'Inscribirse a actividad individual']}
      />
    </LayoutPrivado>
  );
}

export default InscribirActividad;
