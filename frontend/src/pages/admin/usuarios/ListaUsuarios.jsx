import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function ListaUsuarios() {
  return (
    <LayoutPrivado titulo="Usuarios">
      <PaginaEsqueleto
        titulo="Lista de Usuarios"
        descripcion="Buscar, filtrar y gestionar empleados, clientes y administrativos."
        tags={['Listar empleados', 'Listar clientes', 'Buscar usuario', 'Filtrar empleado', 'Eliminar cuenta']}
      />
    </LayoutPrivado>
  );
}

export default ListaUsuarios;
