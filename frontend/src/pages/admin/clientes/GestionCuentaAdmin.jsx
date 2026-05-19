import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function GestionCuentaAdmin() {
  return (
    <LayoutPrivado titulo="Gestión de Cuenta">
      <PaginaEsqueleto
        titulo="Gestión de cuenta de cliente"
        descripcion="Suspender, reintegrar o revisar solicitudes de reintegro de una cuenta de cliente."
        tags={['Suspender cuenta', 'Reintegrar cuenta', 'Solicitar reintegro de cuenta']}
      />
    </LayoutPrivado>
  );
}

export default GestionCuentaAdmin;
