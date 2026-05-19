import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function ListaClientes() {
  return (
    <LayoutPrivado titulo="Clientes">
      <PaginaEsqueleto
        titulo="Lista de Clientes"
        descripcion="Gestionar cuentas de clientes: suspender, reintegrar y listar condiciones."
        tags={['Listar clientes', 'Suspender cuenta', 'Reintegrar cuenta', 'Listar condiciones de cliente']}
      />
    </LayoutPrivado>
  );
}

export default ListaClientes;
