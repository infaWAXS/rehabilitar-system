import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function DetalleUsuario() {
  return (
    <LayoutPrivado titulo="Detalle de Usuario">
      <PaginaEsqueleto
        titulo="Detalle / Edición de usuario"
        descripcion="Ver información completa y modificar datos de un usuario."
        tags={['Ver perfil', 'Modificar empleado', 'Modificar información de usuario', 'Subir DNI']}
      />
    </LayoutPrivado>
  );
}

export default DetalleUsuario;
