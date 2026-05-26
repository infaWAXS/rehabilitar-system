// HU Modificar información de usuario (Nahuel)
// E1: modificación exitosa → guardar() llama modifyUser(id, payload) → PUT /users/{id}/modify
// E2: cambio de especialidad profesor → select de especialidad visible solo si role=professor
// E3: profesor con clases asignadas → TODO backend (desvincular clases pendiente módulo Angel)
// E4: cancelar → cancelar() restaura form al estado original sin llamada a la API
// HU Modificar empleado (Francis)
// E1: modificación exitosa → mismo flujo guardar()
// E2: cancelar → cancelar() restaura form sin cambios
// E3: validación → nombre y apellido son requeridos; email es solo lectura (no editable)
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getUserById, modifyUser } from '../../../services/usersService';

const ROLES_LABEL = {
  admin: 'Administrador',
  client: 'Cliente',
  receptionist: 'Recepcionista',
  professor: 'Profesor',
};

const STATUS_LABEL = {
  active: 'Activo',
  disabled: 'Deshabilitado',
};

const ESPECIALIZACIONES = [
  'Kinesiologia deportiva',
  'Fisioterapia',
  'Kinesiologia neurologica',
  'Rehabilitacion cardiovascular',
  'Kinesiologia traumatologica',
  'Pilates terapeutico',
  'Kinesiologia pediatrica',
  'Osteopatia',
  'Acupuntura',
  'Masoterapia',
  'Kinesiologia respiratoria',
  'Rehabilitacion post-quirurgica',
  'Kinesiologia gerontologica',
  'Electroterapia',
];

const s = {
  wrapper: { maxWidth: '620px' },
  cabecera: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', margin: 0 },
  volver: { fontSize: '13px', color: 'var(--color-primario)', textDecoration: 'none' },
  card: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '28px', boxShadow: 'var(--sombra)' },
  campo: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)' },
  labelSub: { fontWeight: 400, color: 'var(--color-texto-suave)' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)',
    color: 'var(--color-texto)', boxSizing: 'border-box',
  },
  inputReadonly: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px',
    background: 'var(--color-fondo)', color: 'var(--color-texto-suave)',
    boxSizing: 'border-box', cursor: 'default',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  botones: { display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' },
  botonGuardar: {
    padding: '10px 28px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  botonCancelar: {
    padding: '10px 20px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', background: 'transparent',
    color: 'var(--color-texto-suave)', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
  },
  botonDisabled: {
    padding: '10px 28px', borderRadius: '8px', border: 'none',
    background: '#ccc', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'not-allowed',
  },
  error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' },
  exito: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', color: '#15803d', fontSize: '13px', marginBottom: '16px' },
  divider: { borderTop: '1px solid var(--color-borde)', margin: '20px 0' },
  seccionLabel: { fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' },
  cargando: { textAlign: 'center', padding: '48px', color: 'var(--color-texto-suave)' },
  select: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)',
    color: 'var(--color-texto)', cursor: 'pointer', boxSizing: 'border-box',
  },
};

function formDesdeDatos(datos) {
  return {
    nombre: datos.name || '',
    apellido: datos.lastname || '',
    especializacion: datos.specialization || ESPECIALIZACIONES[0],
    direccion: datos.direccion || '',
    telefono: datos.telefono || '',
  };
}

function DetalleUsuario() {
  const { id } = useParams();
  const [usuario, setUsuario] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', especializacion: '', direccion: '', telefono: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    getUserById(id)
      .then((data) => {
        setUsuario(data);
        setForm(formDesdeDatos(data));
      })
      .catch(() => setError('No se pudo cargar el usuario.'))
      .finally(() => setCargando(false));
  }, [id]);

  const cambio = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setExito('');
  };

  const cancelar = () => {
    if (usuario) setForm(formDesdeDatos(usuario));
    setError('');
    setExito('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('El nombre y apellido no pueden estar vacios.');
      return;
    }
    if (usuario.role === 'professor' && !form.especializacion.trim()) {
      setError('Un profesor debe tener una especializacion asignada.');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        name: form.nombre,
        lastname: form.apellido,
        direccion: form.direccion.trim() || null,
        telefono: form.telefono.trim() || null,
      };
      if (usuario.role === 'professor') {
        payload.specialization = form.especializacion;
      }
      const actualizado = await modifyUser(id, payload);
      setUsuario(actualizado);
      setExito('Datos actualizados correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudieron guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <LayoutPrivado titulo="Detalle de Usuario">
      <div style={s.cabecera}>
        <Link to="/gestion/usuarios" style={s.volver}>&#8592; Volver</Link>
        <p style={s.titulo}>Editar usuario</p>
      </div>

      <div style={s.wrapper}>
        {cargando ? (
          <div style={s.cargando}>Cargando...</div>
        ) : !usuario && !error ? null : error && !usuario ? (
          <div style={s.error}>{error}</div>
        ) : (
          <div style={s.card}>
            {error && <div style={s.error}>{error}</div>}
            {exito && <div style={s.exito}>{exito}</div>}

            <form onSubmit={guardar}>
              {/* Info de solo lectura */}
              <p style={s.seccionLabel}>Informacion de cuenta</p>
              <div style={s.grid2}>
                <div style={s.campo}>
                  <label style={s.label}>Rol</label>
                  <input style={s.inputReadonly} value={ROLES_LABEL[usuario.role] || usuario.role} readOnly />
                </div>
                <div style={s.campo}>
                  <label style={s.label}>Estado</label>
                  <input style={s.inputReadonly} value={STATUS_LABEL[usuario.account_status] || usuario.account_status} readOnly />
                </div>
              </div>

              <div style={s.divider} />
              <p style={s.seccionLabel}>Datos personales</p>

              <div style={s.campo}>
                <label style={s.label}>Correo electronico</label>
                <input style={s.inputReadonly} value={usuario.email || ''} readOnly />
              </div>

              <div style={s.grid2}>
                <div style={s.campo}>
                  <label style={s.label}>Nombre</label>
                  <input style={s.input} name="nombre" value={form.nombre} onChange={cambio} required />
                </div>
                <div style={s.campo}>
                  <label style={s.label}>Apellido</label>
                  <input style={s.input} name="apellido" value={form.apellido} onChange={cambio} required />
                </div>
              </div>

              <div style={s.grid2}>
                <div style={s.campo}>
                  <label style={s.label}>Dirección <span style={s.labelSub}>(opcional)</span></label>
                  <input style={s.input} name="direccion" value={form.direccion} onChange={cambio} placeholder="Ej: Calle 123, La Plata" />
                </div>
                <div style={s.campo}>
                  <label style={s.label}>Teléfono <span style={s.labelSub}>(opcional)</span></label>
                  <input style={s.input} name="telefono" value={form.telefono} onChange={cambio} placeholder="Ej: 221 123-4567" />
                </div>
              </div>

              {usuario.role === 'professor' && (
                <div style={s.campo}>
                  <label style={s.label}>Especializacion</label>
                  <select
                    style={s.select}
                    name="especializacion"
                    value={form.especializacion}
                    onChange={cambio}
                    required
                  >
                    {ESPECIALIZACIONES.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={s.botones}>
                <button type="submit" style={guardando ? s.botonDisabled : s.botonGuardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button type="button" style={s.botonCancelar} onClick={cancelar}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </LayoutPrivado>
  );
}

export default DetalleUsuario;

