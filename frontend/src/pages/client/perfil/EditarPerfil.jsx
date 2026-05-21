// HU Editar perfil - Responsable: Agustin
// E1: datos válidos → actualiza nombre/apellido y muestra confirmación, redirige a /perfil
// E2: campo obligatorio vacío → validación HTML nativa (required) impide submit
// E3: cancelar → descarta cambios, navega de vuelta a /perfil sin llamar al backend
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getCurrentUser, updateUserInfo } from '../../../services/usersService';

const s = {
  seccion: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '24px', marginBottom: '24px', boxShadow: 'var(--sombra)',
  },
  titulo: { fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--color-texto)' },
  campo: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px',
    background: 'var(--color-fondo)', boxSizing: 'border-box',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  fila: { display: 'flex', gap: '12px', marginTop: '8px' },
  boton: {
    padding: '10px 24px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  botonDisabled: {
    padding: '10px 24px', borderRadius: '8px', border: 'none',
    background: '#ccc', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'not-allowed',
  },
  botonCancelar: {
    padding: '10px 24px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', background: 'transparent',
    color: 'var(--color-texto-suave)', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
  },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
    padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '14px',
  },
  exito: {
    background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
    padding: '10px 14px', color: '#16a34a', fontSize: '13px', marginBottom: '14px',
  },
  cargando: { fontSize: '14px', color: 'var(--color-texto-suave)', fontStyle: 'italic', padding: '40px 20px', textAlign: 'center' },
};

function EditarPerfil() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', apellido: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    getCurrentUser()
      .then((u) => setForm({ nombre: u.name || '', apellido: u.lastname || '' }))
      .catch(() => setError('No se pudieron cargar los datos del perfil.'))
      .finally(() => setCargando(false));
  }, []);

  const cambio = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setGuardando(true);
    try {
      // E1: llama PUT /users/update-info con nombre y apellido actualizados
      await updateUserInfo({ name: form.nombre, lastname: form.apellido });
      setExito('Perfil actualizado correctamente.');
      setTimeout(() => navigate('/perfil'), 1500);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  // E3: cancelar → vuelve al perfil sin guardar cambios
  const cancelar = () => navigate('/perfil');

  if (cargando) {
    return (
      <LayoutPrivado titulo="Editar Perfil">
        <p style={s.cargando}>Cargando datos del perfil...</p>
      </LayoutPrivado>
    );
  }

  return (
    <LayoutPrivado titulo="Editar Perfil">
      <div style={s.seccion}>
        <p style={s.titulo}>Editar información personal</p>
        <form onSubmit={enviar}>
          {error && <div style={s.error}>{error}</div>}
          {exito && <div style={s.exito}>{exito}</div>}
          {/* E2: atributo required → el navegador bloquea el submit si los campos están vacíos */}
          <div style={s.grid}>
            <div style={s.campo}>
              <label style={s.label}>Nombre</label>
              <input style={s.input} name="nombre" value={form.nombre} onChange={cambio} required />
            </div>
            <div style={s.campo}>
              <label style={s.label}>Apellido</label>
              <input style={s.input} name="apellido" value={form.apellido} onChange={cambio} required />
            </div>
          </div>
          <div style={s.fila}>
            <button type="submit" style={guardando ? s.botonDisabled : s.boton} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            {/* E3: cancelar → navega sin guardar */}
            <button type="button" style={s.botonCancelar} onClick={cancelar}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </LayoutPrivado>
  );
}

export default EditarPerfil;
