import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function GestionCuentaCliente() {
  return (
    <LayoutPrivado titulo="Mi Cuenta">
      <PaginaEsqueleto
        titulo="Mi Cuenta"
        descripcion="Solicitar reintegro de cuenta o consultar el estado de tu cuenta."
        tags={['Solicitar reintegro de cuenta', 'Listar condiciones de cliente']}
      />
    </LayoutPrivado>
  );
}

export default GestionCuentaCliente;
