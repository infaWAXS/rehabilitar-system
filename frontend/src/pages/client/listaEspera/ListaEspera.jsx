import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function ListaEspera() {
  return (
    <LayoutPrivado titulo="Lista de Espera">
      <PaginaEsqueleto
        titulo="Lista de Espera"
        descripcion="Ver y gestionar tu posición en la lista de espera para actividades."
        tags={['Listar lista de espera', 'Dar de baja en lista de espera']}
      />
    </LayoutPrivado>
  );
}

export default ListaEspera;
