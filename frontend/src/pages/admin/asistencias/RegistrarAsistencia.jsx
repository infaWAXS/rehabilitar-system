import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function RegistrarAsistenciaAdmin() {
  return (
    <LayoutPrivado titulo="Asistencias">
      <PaginaEsqueleto
        titulo="Registrar Asistencia"
        descripcion="Registrar la asistencia de un cliente por número de DNI y gestionar comentarios."
        tags={['Registrar asistencia por DNI', 'Dejar comentario', 'Eliminar comentario', 'Modificar comentario']}
      />
    </LayoutPrivado>
  );
}

export default RegistrarAsistenciaAdmin;
