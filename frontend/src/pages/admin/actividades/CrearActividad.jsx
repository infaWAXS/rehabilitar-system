import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function CrearActividad() {
  return (
    <LayoutPrivado titulo="Crear Actividad">
      <PaginaEsqueleto
        titulo="Crear nueva actividad"
        descripcion="Formulario para crear una nueva actividad, asignar sala, horarios y profesores."
        tags={['Crear actividad', 'Listar profesores disponibles', 'Listar especializaciones', 'Listar salas disponibles']}
      />
    </LayoutPrivado>
  );
}

export default CrearActividad;
