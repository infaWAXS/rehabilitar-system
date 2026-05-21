import React, { useState, useEffect } from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getCurrentUser } from '../../../services/usersService';

const s = {
  seccion: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '24px', marginBottom: '24px', boxShadow: 'var(--sombra)',
  },
  titulo: { fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--color-texto)' },
  campo: { marginBottom: '18px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-texto-suave)' },
  valor: { fontSize: '14px', fontWeight: '500', color: 'var(--color-texto)', padding: '10px 0' },
  fila: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '8px' },
  cargando: { fontSize: '14px', color: 'var(--color-texto-suave)', fontStyle: 'italic', padding: '40px 20px', textAlign: 'center' },
  badge: {
    display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
    marginTop: '4px'
  },
  badgeActivo: { background: '#d1fae5', color: '#065f46' },
  badgeInactivo: { background: '#fee2e2', color: '#991b1b' },
  badgeVerificado: { background: '#d1fae5', color: '#065f46' },
  badgePendiente: { background: '#fef08a', color: '#78350f' },
};

function VerPerfil() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const datos = await getCurrentUser();
        setUsuario(datos);
        setError('');
      } catch (err) {
        setError('No se pudo cargar los datos del perfil.');
        console.error(err);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getEstadoCuenta = () => {
    if (!usuario?.account_status) return '-';
    const estado = usuario.account_status.toLowerCase();
    return estado === 'active' ? 'Activa' : estado === 'disabled' ? 'Deshabilitada' : estado;
  };

  const getEstadoDNI = () => {
    return usuario?.dni_verified ? 'Verificado' : 'No verificado';
  };

  const getEstadoAptoDni = () => {
    const status = usuario?.medical_certificate_status || 'none';
    if (status === 'approved') return 'Aprobado';
    if (status === 'pending') return 'Pendiente de aprobación';
    if (status === 'rejected') return 'Rechazado';
    return 'Sin subir';
  };

  return (
    <LayoutPrivado titulo="Mi Perfil">
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', color: '#dc2626', marginBottom: '20px' }}>{error}</div>}

      {cargando ? (
        <div style={s.cargando}>Cargando datos del perfil...</div>
      ) : usuario ? (
        <>
          {/* ── Información Personal ─────────────────────── */}
          <div style={s.seccion}>
            <p style={s.titulo}>Información Personal</p>
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
                <div>
                  <p style={s.valor}>{usuario.dni || '-'}</p>
                  <span style={{ ...s.badge, ...s.badgeVerificado }}>{getEstadoDNI()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Estado de la Cuenta ───────────────────────── */}
          <div style={s.seccion}>
            <p style={s.titulo}>Estado de la Cuenta</p>
            <div style={s.fila}>
              <div style={s.campo}>
                <label style={s.label}>Rol</label>
                <p style={s.valor}>{usuario.role || '-'}</p>
              </div>
              <div style={s.campo}>
                <label style={s.label}>Estado</label>
                <div>
                  <span style={{ ...s.badge, ...(usuario.account_status?.toLowerCase() === 'active' ? s.badgeActivo : s.badgeInactivo) }}>
                    {getEstadoCuenta()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Apto Físico ──────────────────────────────── */}
          <div style={s.seccion}>
            <p style={s.titulo}>Apto Físico</p>
            <div style={s.campo}>
              <label style={s.label}>Estado del Apto Físico</label>
              <div>
                <span style={{ ...s.badge, ...(usuario.medical_certificate_status === 'approved' ? s.badgeVerificado : usuario.medical_certificate_status === 'pending' ? s.badgePendiente : s.badgeInactivo) }}>
                  {getEstadoAptoDni()}
                </span>
              </div>
            </div>
            {usuario.medical_certificate_path && (
              <div style={s.campo}>
                <label style={s.label}>Archivo Adjunto</label>
                <p style={s.valor}>{usuario.medical_certificate_path.split('/').pop()}</p>
              </div>
            )}
          </div>

          {/* ── Información del Registro ──────────────────── */}
          <div style={s.seccion}>
            <p style={s.titulo}>Información del Registro</p>
            <div style={s.campo}>
              <label style={s.label}>Fecha de Registro</label>
              <p style={s.valor}>{formatearFecha(usuario.created_at)}</p>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--color-texto-suave)', marginTop: '20px', textAlign: 'center' }}>
            Para editar tus datos o cambiar tu contraseña, dirigite a <strong>Mi Cuenta</strong>.
          </p>
        </>
      ) : (
        <div style={s.cargando}>No se pudieron cargar los datos.</div>
      )}
    </LayoutPrivado>
  );
}

export default VerPerfil;