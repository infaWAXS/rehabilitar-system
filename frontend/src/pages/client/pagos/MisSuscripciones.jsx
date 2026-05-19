import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function MisSuscripciones() {
  return (
    <LayoutPrivado titulo="Suscripciones y Pagos">
      <PaginaEsqueleto
        titulo="Mis Suscripciones"
        descripcion="Ver planes activos, inscribirse a un plan o actividad individual y realizar pagos."
        tags={['Inscribirse a plan', 'Inscribir actividad individual', 'Ver suscripciones', 'Pagar Mercado Pago']}
      />
    </LayoutPrivado>
  );
}

export default MisSuscripciones;
