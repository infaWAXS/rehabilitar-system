import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function RegistrarAsistenciaKinesiologo() {
  return (
    <LayoutPrivado titulo="Asistencias">
      <PaginaEsqueleto
        titulo="Registrar Asistencia"
        descripcion="Registrar asistencia por DNI y gestionar comentarios de cada asistencia."
        tags={['Registrar asistencia por DNI', 'Dejar comentario', 'Eliminar comentario', 'Modificar comentario']}
      />
    </LayoutPrivado>
  );
}

export default RegistrarAsistenciaKinesiologo;
