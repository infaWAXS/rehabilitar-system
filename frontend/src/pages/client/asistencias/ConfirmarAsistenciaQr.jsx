// HU: Registrar asistencia por QR
import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
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
  advertencia: {
    background: '#fff8ec', border: '1px solid #fbd38d', borderRadius: '8px',
    padding: '14px 18px', color: '#b45309', fontSize: '14px', fontWeight: '600',
  },
  boton: {
    marginTop: '20px', padding: '10px 24px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
};

// Mapea las respuestas de error del backend a mensajes orientados al cliente
// que escanea el QR (los mensajes del backend están redactados desde la
// perspectiva del profesor para el flujo de marcar por DNI).
const CASOS_ERROR_QR = [
  {
    // El backend borra los QR vencidos de la actividad apenas se genera uno
    // nuevo, así que un código viejo puede llegar como "expirado" (410, si
    // todavía no se generó otro) o como "no encontrado" (404, si ya se
    // borró). Para el cliente el motivo y la solución son las mismas.
    status: [410, 404],
    match: (detail) => detail === 'El código QR expiró' || detail === 'Código QR no encontrado',
    tono: 'error',
    titulo: 'El código QR ya no es válido',
    mensaje: 'Este código expiró o ya fue reemplazado. Pedile al profesor que genere uno nuevo y escaneálo.',
  },
  {
    status: [403],
    match: (detail) => detail === 'El cliente no se anotó para dicha clase',
    tono: 'error',
    titulo: 'No estás inscripto en esta clase',
    mensaje: 'No te encuentras inscrito a esta clase.',
  },
  {
    status: [409],
    match: (detail) => detail === 'La asistencia ya ha sido marcada como presente',
    tono: 'advertencia',
    titulo: 'Ya estabas presente',
    mensaje: 'Tu asistencia a esta clase ya había sido registrada anteriormente.',
  },
];

function interpretarErrorQr(e) {
  const detail = e?.detail || e?.message || '';
  const caso = CASOS_ERROR_QR.find((c) => c.status.includes(e?.status) && c.match(detail));
  if (caso) return caso;
  return {
    tono: 'error',
    titulo: 'No se pudo registrar',
    mensaje: detail || 'Ocurrió un error inesperado al registrar la asistencia.',
  };
}

function ConfirmarAsistenciaQr() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const [exito, setExito] = useState(false);
  const scanRequestedRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login', {
        replace: true,
        state: {
          mensaje: 'Iniciá sesión para registrar tu asistencia con QR.',
          redirectTo: `/asistencia/qr/${code}`,
        },
      });
      return;
    }

    if (scanRequestedRef.current) return;
    scanRequestedRef.current = true;

    scanAttendanceQr(code)
      .then(() => {
        setErrorInfo(null);
        setExito(true);
      })
      .catch((e) => {
        setErrorInfo(interpretarErrorQr(e));
      })
      .finally(() => {
        setCargando(false);
      });
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
              <h2 style={s.titulo}>{errorInfo?.titulo || 'No se pudo registrar'}</h2>
              <div style={errorInfo?.tono === 'advertencia' ? s.advertencia : s.error}>
                {errorInfo?.mensaje}
              </div>
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
