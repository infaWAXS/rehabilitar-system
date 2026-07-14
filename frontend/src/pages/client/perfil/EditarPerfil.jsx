// HU Editar perfil - Responsable: Agustin
// E1: datos válidos → actualiza nombre/apellido/dirección/teléfono y muestra confirmación, redirige a /perfil
// E2: campo obligatorio vacío → validación inline muestra error encima del input
// E3: cancelar → descarta cambios, navega de vuelta a /perfil sin llamar al backend
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getCurrentUser, updateUserInfo } from '../../../services/usersService';
import { updateStoredName } from '../../../services/authService';

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
  errInline: { fontSize: '12px', color: '#dc2626', display: 'block', marginBottom: '4px' },
  botonVolver: { padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-texto)', marginBottom: '20px' },
};

function EditarPerfil() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', apellido: '', direccion: '', telefono: '', fecha_nacimiento: '' });
  const [fieldErrors, setFieldErrors] = useState({ nombre: '', apellido: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    getCurrentUser()
      .then((u) => setForm({ nombre: u.name || '', apellido: u.lastname || '', direccion: u.direccion || '', telefono: u.telefono || '', fecha_nacimiento: u.birth_date || '' }))
      .catch(() => setError('No se pudieron cargar los datos del perfil.'))
      .finally(() => setCargando(false));
  }, []);

  const cambio = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido.';
    if (!form.apellido.trim()) errs.apellido = 'El apellido es requerido.';
    if (!form.fecha_nacimiento) {
      errs.fecha_nacimiento = 'La fecha de nacimiento es requerida.';
    } else {
      const hoy = new Date();
      const nacimiento = new Date(form.fecha_nacimiento);
      const edad = hoy.getFullYear() - nacimiento.getFullYear() - 
        ((hoy.getMonth() * 100 + hoy.getDate()) < (nacimiento.getMonth() * 100 + nacimiento.getDate()) ? 1 : 0);
      if (edad < 18) errs.fecha_nacimiento = 'Debés ser mayor de 18 años.';
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({ nombre: '', apellido: '' });

    setGuardando(true);
    try {
      // E1: llama PUT /users/update-info con datos actualizados
      await updateUserInfo({
        name: form.nombre,
        lastname: form.apellido,
        direccion: form.direccion || null,
        telefono: form.telefono || null,
        birth_date: form.fecha_nacimiento || null,
      });
      // Refrescar el nombre en sesión para que la cabecera lo muestre actualizado
      updateStoredName(form.nombre, form.apellido);
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
      <button style={s.botonVolver} onClick={() => navigate('/perfil')}>← Volver</button>
      <div style={s.seccion}>
        <p style={s.titulo}>Editar información personal</p>
        <form onSubmit={enviar}>
          {error && <div style={s.error}>{error}</div>}
          {exito && <div style={s.exito}>{exito}</div>}
          {/* E2: validación inline → mensaje de error encima del input cuando es requerido y está vacío */}
          <div style={s.grid}>
            <div style={s.campo}>
              <label style={s.label}>Nombre</label>
              {fieldErrors.nombre && <span style={s.errInline}>{fieldErrors.nombre}</span>}
              <input style={s.input} name="nombre" value={form.nombre} onChange={cambio} />
            </div>
            <div style={s.campo}>
              <label style={s.label}>Apellido</label>
              {fieldErrors.apellido && <span style={s.errInline}>{fieldErrors.apellido}</span>}
              <input style={s.input} name="apellido" value={form.apellido} onChange={cambio} />
            </div>
          </div>
          <div style={s.campo}>
            <label style={s.label}>Fecha de nacimiento</label>
            {fieldErrors.fecha_nacimiento && <span style={s.errInline}>{fieldErrors.fecha_nacimiento}</span>}
            <input
              style={s.input}
              type="date"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={cambio}
            />
          </div>
          <div style={s.grid}>
            <div style={s.campo}>
              <label style={s.label}>Dirección <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(opcional)</span></label>
              <input style={s.input} name="direccion" value={form.direccion} onChange={cambio} placeholder="Ej: Calle 123, La Plata" />
            </div>
            <div style={s.campo}>
              <label style={s.label}>Teléfono <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(opcional)</span></label>
              <input style={s.input} name="telefono" value={form.telefono} onChange={cambio} placeholder="Ej: 221 123-4567" />
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
