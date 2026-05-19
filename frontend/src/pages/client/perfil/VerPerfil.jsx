import React from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import PaginaEsqueleto from '../../../componentes/comun/PaginaEsqueleto';

function VerPerfil() {
  return (
    <LayoutPrivado titulo="Mi Perfil">
      <PaginaEsqueleto
        titulo="Mi Perfil"
        descripcion="Ver y editar información personal, subir DNI, cambiar contraseña."
        tags={['Ver perfil', 'Editar perfil', 'Subir DNI', 'Cambiar contraseña', 'Adjuntar apto físico']}
      />
    </LayoutPrivado>
  );
}

export default VerPerfil;
