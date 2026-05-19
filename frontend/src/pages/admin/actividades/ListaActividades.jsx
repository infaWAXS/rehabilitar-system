import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function ListaActividades() {
  return (
    <LayoutPrivado titulo="Actividades">
      <PaginaEsqueleto
        titulo="Lista de Actividades"
        descripcion="Ver, buscar y filtrar todas las actividades del centro."
        tags={['Ver actividad', 'Filtrar actividades', 'Buscar actividades', 'Cancelar actividad', 'Listar salas', 'Listar horarios', 'Listar días']}
      />
    </LayoutPrivado>
  );
}

export default ListaActividades;
