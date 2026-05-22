// HU Solicitar reintegro de cuenta
// E1: solicitud exitosa (motivo obligatorio → queda pendiente de revisión)
// E2: solicitud fallida por falta de motivo (valida campo vacío)
// E3: cuenta no suspendida / acceso directo sin flujo de login → redirige a /login
import React, { useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../services/apiClient';

const s = {
  contenedor: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-fondo)', padding: '20px', boxSizing: 'border-box' },
  card: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '32px', boxShadow: 'var(--sombra)', maxWidth: '450px', width: '100%', boxSizing: 'border-box' },
  titulo: { fontSize: '24px', fontWeight: '700', color: 'var(--color-texto)', margin: '0 0 8px 0', textAlign: 'center' },
  subtitulo: { fontSize: '14px', color: 'var(--color-texto-suave)', margin: '0 0 24px 0', textAlign: 'center', lineHeight: '1.5' },
  grupo: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--color-texto)', marginBottom: '8px' },
  textarea: {
    width: '100%', height: '120px', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)', boxSizing: 'border-box',
    resize: 'none', fontFamily: 'inherit', lineHeight: '1.5',
  },
  boton: {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
    marginTop: '8px',
  },
  botonDeshabilitado: {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: '#cbd5e1', color: '#94a3b8', fontSize: '15px', fontWeight: '600', cursor: 'not-allowed', marginTop: '8px',
  },
  error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', color: '#dc2626', fontSize: '13px', marginBottom: '20px', lineHeight: '1.4' },
  exito: { background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', color: '#15803d', fontSize: '14px', textAlign: 'center', lineHeight: '1.5' },
  enlace: { display: 'inline-block', color: 'var(--color-primario)', textDecoration: 'none', fontWeight: '600', fontSize: '14px', marginTop: '16px' },
  centrado: { textAlign: 'center' },
};

function SolicitarReintegro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const email = searchParams.get('email');
  // token y userId vienen del state de navigate (pasado desde Login.jsx al detectar cuenta suspendida)
  const { token, userId } = location.state || {};

  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // E3: si no llegó token ni email, el usuario accedió directo sin pasar por login → redirigir
  if (!email || !token || !userId) {
    return (
      <div style={s.contenedor}>
        <div style={s.card}>
          <p style={s.titulo}>Acceso no válido</p>
          <p style={s.subtitulo}>
            Esta página solo está disponible para cuentas suspendidas que intenten iniciar sesión.
          </p>
          <div style={s.centrado}>
            <a href="/login" style={s.enlace}>Ir al Login</a>
          </div>
        </div>
      </div>
    );
  }

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setErrorValidacion('');

    // E2: motivo vacío → error de validación frontend
    if (!motivo.trim()) {
      setErrorValidacion('El motivo de la solicitud es obligatorio.');
      return;
    }

    setEnviando(true);
    try {
      // E1: llamada real al backend POST /clients/{userId}/reintegration-request
      const url = `${API_BASE_URL}/clients/${userId}/reintegration-request?token=${encodeURIComponent(token)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivo.trim() }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.detail || 'No se pudo enviar la solicitud.');
      }
      setMensajeExito('Tu solicitud de reintegro fue registrada con éxito y quedó pendiente de revisión por un administrador.');
    } catch (err) {
      setErrorValidacion(err.message || 'Ocurrió un error al enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={s.contenedor}>
      <div style={s.card}>
        <p style={s.titulo}>Solicitar Reintegro</p>

        {mensajeExito ? (
          <div style={s.centrado}>
            <div style={s.exito}>{mensajeExito}</div>
            <a href="/login" style={s.enlace}>Volver al Login</a>
          </div>
        ) : (
          <>
            <p style={s.subtitulo}>
              Tu cuenta asociada a <strong>{email}</strong> se encuentra suspendida.
              Completá el siguiente formulario para pedir el alta.
            </p>

            {errorValidacion && <div style={s.error}>{errorValidacion}</div>}

            <form onSubmit={manejarEnvio}>
              <div style={s.grupo}>
                <label style={s.label} htmlFor="motivo">Motivo de la solicitud</label>
                <textarea
                  id="motivo"
                  style={s.textarea}
                  placeholder="Explicá detalladamente el motivo por el cual solicitás el reintegro de tu cuenta..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  disabled={enviando}
                />
              </div>

              <button
                type="submit"
                style={enviando ? s.botonDeshabilitado : s.boton}
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'Solicitar reintegro'}
              </button>
            </form>

            <div style={s.centrado}>
              <a href="/login" style={s.enlace}>Cancelar</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SolicitarReintegro;
