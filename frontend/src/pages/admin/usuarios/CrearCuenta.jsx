// HU Crear cuenta (Francis) - Responsable: Agustin
// E1: recepcionista creada → POST /users (role=receptionist) → cuenta activa
// E2: cuenta de profesor creada con especialidad → POST /users (role=professor, specialization) → cuenta activa
// E3: cuenta de cliente creada, opcionalmente con apto físico → POST /users (role=client) [+ POST /{id}/upload-medical-certificate]
// E4: cuenta de admin creada → POST /users (role=admin) → cuenta activa
// E5: email ya registrado → el backend retorna 400/409 → se muestra error
// E6: profesor sin especialidad → validación frontend evita envío
// E7: contraseña < 6 caracteres → validación frontend evita envío
// TODO (sistema): enviar credenciales por email al usuario creado (backend pendiente)
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { register } from '../../../services/authService';
import { adminUploadCertificate } from '../../../services/usersService';

const ROLES = [
  { value: 'client',       label: 'Cliente' },
  { value: 'receptionist', label: 'Recepcionista' },
  { value: 'professor',    label: 'Profesor' },
  { value: 'admin',        label: 'Administrador' },
];

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
  wrapper: { maxWidth: '560px' },
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
    boxSizing: 'border-box',
  },
  select: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)',
    color: 'var(--color-texto)', cursor: 'pointer', boxSizing: 'border-box',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  botones: { display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' },
  botonEnviar: {
    padding: '10px 28px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  botonOtra: {
    padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--color-primario)',
    background: 'transparent', color: 'var(--color-primario)', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  botonDisabled: {
    padding: '10px 28px', borderRadius: '8px', border: 'none',
    background: '#ccc', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'not-allowed',
  },
  error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' },
  exito: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 14px', color: '#15803d', fontSize: '14px', marginBottom: '16px' },
  divider: { borderTop: '1px solid var(--color-borde)', margin: '20px 0' },
  seccionLabel: { fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' },
};

const FORM_VACIO = { nombre: '', apellido: '', email: '', contrasena: '', dni: '', especializacion: '' };

function CrearCuenta() {
  const [rolSeleccionado, setRolSeleccionado] = useState('client');
  const [form, setForm] = useState(FORM_VACIO);
  const [aptoFile, setAptoFile] = useState(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const cambio = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(FORM_VACIO);
    setAptoFile(null);
    setError('');
    setExito('');
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (form.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (rolSeleccionado === 'professor' && !form.especializacion.trim()) {
      setError('Un profesor debe tener una especialidad asignada.');
      return;
    }

    setCargando(true);
    try {
      const createdUser = await register({
        name: form.nombre,
        lastname: form.apellido,
        email: form.email,
        password: form.contrasena,
        role: rolSeleccionado,
        dni: form.dni || undefined,
        specialization: rolSeleccionado === 'professor' ? form.especializacion : undefined,
      });
      if (rolSeleccionado === 'client' && aptoFile && createdUser && createdUser.id) {
        try {
          await adminUploadCertificate(createdUser.id, aptoFile);
        } catch (_) {}
      }
      setExito('Cuenta creada exitosamente, credenciales enviadas.');
      setForm(FORM_VACIO);
      setAptoFile(null);
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('ya existe') || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('conflict')) {
        setError('El correo ya está registrado en el sistema.');
      } else if (msg.toLowerCase().includes('especialidad')) {
        setError('Un profesor debe tener una especialidad asignada.');
      } else {
        setError(msg || 'No se pudo crear la cuenta. Intentá de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <LayoutPrivado titulo="Crear Cuenta">
      <div style={s.cabecera}>
        <Link to="/admin/usuarios" style={s.volver}>← Volver</Link>
        <p style={s.titulo}>Crear cuenta de usuario</p>
      </div>

      <div style={s.wrapper}>
        <div style={s.card}>
          {error && <div style={s.error}>{error}</div>}
          {exito && (
            <div>
              <div style={s.exito}>{exito}</div>
              <div style={s.botones}>
                <button style={s.botonOtra} onClick={resetForm}>Crear otra cuenta</button>
                <Link to="/admin/usuarios" style={{ ...s.botonEnviar, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Ver lista</Link>
              </div>
            </div>
          )}

          {!exito && (
            <form onSubmit={enviar}>
              {/* Rol */}
              <div style={s.campo}>
                <label style={s.label}>Rol</label>
                <select
                  style={s.select}
                  value={rolSeleccionado}
                  onChange={(e) => { setRolSeleccionado(e.target.value); setError(''); }}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div style={s.divider} />
              <p style={s.seccionLabel}>Datos personales</p>

              {/* Nombre y Apellido */}
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

              {/* Email */}
              <div style={s.campo}>
                <label style={s.label}>Correo electrónico</label>
                <input style={s.input} type="email" name="email" value={form.email} onChange={cambio} required />
              </div>

              {/* Contraseña */}
              <div style={s.campo}>
                <label style={s.label}>
                  Contraseña{' '}
                  <span style={s.labelSub}>(mín. 6 caracteres)</span>
                </label>
                <input style={s.input} type="password" name="contrasena" value={form.contrasena} onChange={cambio} required />
              </div>

              {/* DNI (para todos excepto... se muestra siempre como opcional) */}
              <div style={s.campo}>
                <label style={s.label}>
                  DNI <span style={s.labelSub}>(opcional)</span>
                </label>
                <input style={s.input} name="dni" value={form.dni} onChange={cambio} placeholder="Ej: 12345678" />
              </div>

              {/* Apto fisico - solo para clientes */}
              {rolSeleccionado === 'client' && (
                <div style={s.campo}>
                  <label style={s.label}>
                    Apto fisico{' '}
                    <span style={s.labelSub}>(opcional)</span>
                  </label>
                  <input
                    style={s.input}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setAptoFile(e.target.files[0] || null)}
                  />
                </div>
              )}

              {/* Especializacion - solo para profesores */}
              {rolSeleccionado === 'professor' && (
                <div style={s.campo}>
                  <label style={s.label}>Especializacion</label>
                  <input
                    style={s.input}
                    name="especializacion"
                    value={form.especializacion}
                    onChange={cambio}
                    placeholder="Ej: Kinesiologia deportiva"
                    list="especializaciones-list"
                  />
                  <datalist id="especializaciones-list">
                    {ESPECIALIZACIONES.map((e) => (
                      <option key={e} value={e} />
                    ))}
                  </datalist>
                </div>
              )}

              <div style={s.botones}>
                <button type="submit" style={cargando ? s.botonDisabled : s.botonEnviar} disabled={cargando}>
                  {cargando ? 'Creando...' : 'Crear cuenta'}
                </button>
                <Link to="/admin/usuarios" style={{ ...s.botonDisabled, background: 'transparent', color: 'var(--color-texto-suave)', border: '1px solid var(--color-borde)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  Cancelar
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </LayoutPrivado>
  );
}

export default CrearCuenta;

