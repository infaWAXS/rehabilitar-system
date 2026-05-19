import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function CrearCuenta() {
  return (
    <LayoutPrivado titulo="Crear Cuenta">
      <PaginaEsqueleto
        titulo="Crear cuenta de usuario"
        descripcion="Formulario para crear una nueva cuenta de empleado, cliente o administrativo."
        tags={['Crear cuenta', 'Adjuntar apto físico', 'Verificar apto físico']}
      />
    </LayoutPrivado>
  );
}

export default CrearCuenta;
