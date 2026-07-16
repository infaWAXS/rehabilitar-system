// HU Ver perfil — Responsable: Agustin
// E1: usuario autenticado selecciona "Mi Perfil" → sistema muestra datos del perfil (GET /users/me)
// E2: no autenticado → redirigido por LayoutPrivado
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getCurrentUser, uploadMedicalCertificate } from '../../../services/usersService';

const s = {
  seccion: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '24px', marginBottom: '24px', boxShadow: 'var(--sombra)',
  },
  titulo: { fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--color-texto)' },
  fila: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' },
  campo: { marginBottom: '4px' },
  label: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--color-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  valor: { fontSize: '14px', color: 'var(--color-texto)', margin: 0, fontWeight: '500' },
  badge: { display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  badgeActivo: { background: '#dcfce7', color: '#16a34a' },
  badgePendiente: { background: '#fef3c7', color: '#d97706' },
  badgeInactivo: { background: '#f3f4f6', color: '#6b7280' },
  alerta: (tipo) => ({
    padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
    background: tipo === 'error' ? '#fef2f2' : '#f0fdf4',
    border: `1px solid ${tipo === 'error' ? '#fecaca' : '#bbf7d0'}`,
    color: tipo === 'error' ? '#dc2626' : '#15803d',
  }),
  aptoBox: {
    background: '#f9fafb', border: '1px solid var(--color-borde)', borderRadius: '8px',
    padding: '14px', marginTop: '12px',
  },
  aptoInput: {
    display: 'block', marginTop: '8px', fontSize: '13px',
  },
  aptoBoton: {
    marginTop: '10px', padding: '8px 18px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
  },
};

export default function VerPerfil() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aptoFile, setAptoFile] = useState(null);
  const [aptoSubiendo, setAptoSubiendo] = useState(false);
  const [aptoError, setAptoError] = useState('');
  const [aptoExito, setAptoExito] = useState('');

  useEffect(() => {
    getCurrentUser()
      .then((datos) => { setUsuario(datos); setError(''); })
      .catch(() => setError('No se pudo cargar los datos del perfil.'))
      .finally(() => setCargando(false));
  }, []);

  const subirApto = async (e) => {
    e.preventDefault();
    if (!aptoFile) {
      setAptoError('Debés seleccionar un archivo.');
      return;
    }
    setAptoSubiendo(true);
    setAptoError('');
    setAptoExito('');
    try {
      await uploadMedicalCertificate(aptoFile);
      setAptoExito('Apto físico enviado. Quedará pendiente de revisión por el administrador.');
      setAptoFile(null);
      const datos = await getCurrentUser();
      setUsuario(datos);
    } catch {
      setAptoError('No se pudo subir el archivo. Intentá de nuevo.');
    } finally {
      setAptoSubiendo(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const estadoCertificadoLabel = (status) => {
    if (status === 'approved') return { texto: 'Aprobado', estilo: s.badgeActivo };
    if (status === 'pending') return { texto: 'Pendiente de revisión', estilo: s.badgePendiente };
    if (status === 'rejected') return { texto: 'Rechazado', estilo: { background: '#fef2f2', color: '#dc2626' } };
    return null;
  };

  if (cargando) {
    return (
      <LayoutPrivado>
        <p style={{ color: 'var(--color-texto-suave)', fontSize: '14px' }}>Cargando perfil...</p>
      </LayoutPrivado>
    );
  }

  return (
    <LayoutPrivado>
      {error && <div style={s.alerta('error')}>{error}</div>}

      {usuario && (
        <>
          {/* ── Datos personales ────────────────────────── */}
          <div style={s.seccion}>
            <p style={s.titulo}>Datos Personales</p>
            <div style={s.fila}>
              <div style={s.campo}>
                <label style={s.label}>Nombre</label>
                <p style={s.valor}>{usuario.name}</p>
              </div>
              <div style={s.campo}>
                <label style={s.label}>Apellido</label>
                <p style={s.valor}>{usuario.lastname}</p>
              </div>
            </div>
            <div style={s.fila}>
              <div style={s.campo}>
                <label style={s.label}>Email</label>
                <p style={s.valor}>{usuario.email}</p>
              </div>
              <div style={s.campo}>
                <label style={s.label}>DNI</label>
                <p style={s.valor}>{usuario.dni || '—'}</p>
              </div>
            </div>
            {usuario.birth_date && (
              <div style={s.fila}>
                <div style={s.campo}>
                  <label style={s.label}>Fecha de nacimiento</label>
                  <p style={s.valor}>{usuario.birth_date.split('-').reverse().join('/')}</p>
                </div>
              </div>
            )}
            <div style={s.fila}>
              <div style={s.campo}>
                <label style={s.label}>Dirección</label>
                <p style={s.valor}>{usuario.direccion || '—'}</p>
              </div>
              <div style={s.campo}>
                <label style={s.label}>Teléfono</label>
                <p style={s.valor}>{usuario.telefono || '—'}</p>
              </div>
            </div>
          </div>

          {/* ── Datos profesionales ────────────────────────── */}
          {usuario.role === 'professor' && (
            <div style={s.seccion}>
              <p style={s.titulo}>Datos Profesionales</p>
              <div style={s.fila}>
                <div style={s.campo}>
                  <label style={s.label}>Especialidad</label>
                  <p style={s.valor}>{usuario.specialization || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Apto físico ──────────────────────────────── */}
          {usuario.role === 'client' && (
            <div style={s.seccion}>
              <p style={s.titulo}>Apto Físico</p>
              {(() => {
                const cert = estadoCertificadoLabel(usuario.medical_certificate_status);
                return cert ? (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ ...s.badge, ...cert.estilo }}>{cert.texto}</span>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '12px' }}>
                    No has subido ningún apto físico todavía.
                  </p>
                );
              })()}

              {aptoError && <div style={s.alerta('error')}>{aptoError}</div>}
              {aptoExito && <div style={s.alerta('ok')}>{aptoExito}</div>}

              {usuario.medical_certificate_status !== 'pending' && usuario.medical_certificate_status !== 'approved' && (
                <form onSubmit={subirApto} style={s.aptoBox}>
                  <label style={s.label}>
                    {usuario.medical_certificate_status === 'none' ? 'Subir apto físico' : 'Actualizar apto físico'}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={s.aptoInput}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
                      if (!tiposPermitidos.includes(file.type)) {
                        setAptoError('Solo se permiten archivos JPG, PNG y PDF');
                        e.target.value = null;
                        return;
                      }
                      setAptoFile(file);
                    }}
                  />
                  <button type="submit" style={s.aptoBoton} disabled={aptoSubiendo}>
                    {aptoSubiendo ? 'Subiendo...' : 'Enviar'}
                  </button>
                </form>
              )}
            </div>
          )}
          
          {/* ── Información del Registro ──────────────────── */}
          <div style={s.seccion}>
            <p style={s.titulo}>Información del Registro</p>
            <div style={s.campo}>
              <label style={s.label}>Fecha de Registro</label>
              <p style={s.valor}>{formatearFecha(usuario.created_at)}</p>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--color-texto-suave)', marginTop: '20px', textAlign: 'center' }}>
            <Link
              to="/perfil/editar"
              style={{
                display: 'inline-block', padding: '9px 20px', borderRadius: '8px',
                background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
                color: '#fff', fontWeight: '700', fontSize: '14px', textDecoration: 'none', marginRight: '10px',
              }}
            >
              Editar perfil
            </Link>
            <Link
              to="/cliente/cuenta"
              style={{
                display: 'inline-block', padding: '9px 20px', borderRadius: '8px',
                border: '1px solid var(--color-borde)', background: 'transparent',
                color: 'var(--color-texto)', fontWeight: '600', fontSize: '14px', textDecoration: 'none',
              }}
            >
              Gestionar cuenta
            </Link>
          </p>
        </>
      )}
    </LayoutPrivado>
  );
}
