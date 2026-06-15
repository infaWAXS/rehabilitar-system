// HU: Registrar asistencia por QR
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { scanAttendanceQr } from '../../../services/attendanceService';

const s = {
  wrapper: { maxWidth: '480px', margin: '0 auto' },
  card: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '32px', boxShadow: 'var(--sombra)', textAlign: 'center',
  },
  titulo: { fontSize: '20px', fontWeight: '700', color: 'var(--color-texto)', marginBottom: '12px' },
  texto: { fontSize: '14px', color: 'var(--color-texto-suave)', lineHeight: 1.5 },
  exito: {
    background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
    padding: '14px 18px', color: '#15803d', fontSize: '14px', fontWeight: '600',
  },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
    padding: '14px 18px', color: '#dc2626', fontSize: '14px', fontWeight: '600',
  },
  boton: {
    marginTop: '20px', padding: '10px 24px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
};

function ConfirmarAsistenciaQr() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  useEffect(() => {
    let mounted = true;
    scanAttendanceQr(code)
      .then(() => {
        if (mounted) setExito(true);
      })
      .catch((e) => {
        if (mounted) setError(e?.message || 'No se pudo registrar la asistencia.');
      })
      .finally(() => {
        if (mounted) setCargando(false);
      });
    return () => { mounted = false; };
  }, [code]);

  return (
    <LayoutPrivado titulo="Registrar asistencia">
      <div style={s.wrapper}>
        <div style={s.card}>
          {cargando ? (
            <p style={s.texto}>Registrando asistencia...</p>
          ) : exito ? (
            <>
              <h2 style={s.titulo}>¡Listo!</h2>
              <div style={s.exito}>Asistencia registrada correctamente.</div>
            </>
          ) : (
            <>
              <h2 style={s.titulo}>No se pudo registrar</h2>
              <div style={s.error}>{error}</div>
            </>
          )}
          <button style={s.boton} onClick={() => navigate('/cliente/reservas')}>
            Ir a Mis Reservas
          </button>
        </div>
      </div>
    </LayoutPrivado>
  );
}

export default ConfirmarAsistenciaQr;
