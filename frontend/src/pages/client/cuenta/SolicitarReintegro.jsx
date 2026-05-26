// HU Solicitar reintegro de cuenta (Nahuel)
// E1: solicitud exitosa (motivo obligatorio → queda pendiente de revisión)
// E2: cuenta no suspendida → cartel verde + redirección automática
// E3: no es cliente (admin, profesor) → cartel de acceso restringido
// E4: solicitud reciente (menos de 24hs) → muestra tiempo restante
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../services/apiClient';

const s = {
  contenedor: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-fondo)', padding: '20px', boxSizing: 'border-box' },
  card: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '32px', boxShadow: 'var(--sombra)', maxWidth: '450px', width: '100%', boxSizing: 'border-box' },
  titulo: { fontSize: '24px', fontWeight: '700', color: 'var(--color-texto)', margin: '0 0 8px 0', textAlign: 'center' },
  subtitulo: { fontSize: '14px', color: 'var(--color-texto-suave)', margin: '0 0 24px 0', textAlign: 'center', lineHeight: '1.5' },
  grupo: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--color-texto)', marginBottom: '8px' },
  textarea: { width: '100%', height: '120px', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5' },
  boton: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--color-primario)', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s', marginTop: '8px' },
  botonDeshabilitado: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#cbd5e1', color: '#94a3b8', fontSize: '15px', fontWeight: '600', cursor: 'not-allowed', marginTop: '8px' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', color: '#dc2626', fontSize: '13px', marginBottom: '20px', lineHeight: '1.4' },
  exito: { background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', color: '#15803d', fontSize: '14px', textAlign: 'center', lineHeight: '1.5' },
  enlace: { display: 'inline-block', color: 'var(--color-primario)', textDecoration: 'none', fontWeight: '600', fontSize: '14px', marginTop: '16px' },
  centrado: { textAlign: 'center' }
};

function SolicitarReintegro() {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  // Limpiar el token temporal al salir de la página (fue guardado solo para este flujo)
  useEffect(() => {
    return () => {
      localStorage.removeItem('access_token');
    };
  }, []);

  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const [cuentaActivaMensaje, setCuentaActivaMensaje] = useState(false);
  const [noEsClienteMensaje, setNoEsClienteMensaje] = useState(false);
  const [bloqueadoPorTiempo, setBloqueadoPorTiempo] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    let activoTimer;

    fetch(`${API_BASE_URL}/clients/reintegration/status?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Sesión inválida o expirada. Por favor, iniciá sesión nuevamente.');
        }
        if (!res.ok) {
          throw new Error('No se pudo verificar el estado en el servidor.');
        }
        return res.json();
      })
      .then((data) => {
        if (!data) {
          setCargando(false);
          return;
        }

        if (data.status === 'not_a_client') {
          setNoEsClienteMensaje(true);
          setCargando(false);
          return;
        }

        if (data.status === 'pending_reintegration') {
          // ya enviaron una solicitud → mostrar mensaje de espera en lugar de redirigir
          setErrorValidacion('Tu solicitud de reintegro ya fue registrada y está pendiente de revisión por un administrador. No es necesario volver a solicitarla.');
          setCargando(false);
          return;
        }

        if (data.status !== 'suspended') {
          setCuentaActivaMensaje(true);
          setCargando(false);

          activoTimer = setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);

          return;
        }

        if (!data.can_request) {
          setBloqueadoPorTiempo(true);
          const horasString = String(data.horas_transcurridas);
          const textoHaceCuanto = horasString.includes('minutos')
            ? horasString
            : `${horasString}hs`;

          setErrorValidacion(
            `Ya registraste una solicitud hace ${textoHaceCuanto}. Tu cuenta se encuentra suspendida, pero debés esperar ${data.tiempo_restante} para poder volver a solicitar un reintegro.`
          );
        } else {
          setErrorValidacion('');
        }

        setCargando(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorValidacion(err.message || 'No se pudo verificar el estado en el servidor.');
        setCargando(false);
      });

    return () => {
      if (activoTimer) clearTimeout(activoTimer);
    };
  }, [token, navigate]);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setErrorValidacion('');

    if (!motivo.trim()) {
      setErrorValidacion('El motivo de la solicitud es obligatorio.');
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await fetch(
        `${API_BASE_URL}/clients/reintegration/submit?token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo: motivo })
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.detail || 'Hubo un problema al procesar tu solicitud.');
      }

      setMensajeExito('Tu solicitud de reintegro fue registrada con éxito y quedó pendiente de revisión por un administrador.');
    } catch (err) {
      setErrorValidacion(err.message || 'No se pudo enviar la solicitud. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div style={s.contenedor}>
        <div style={s.card}>
          <p style={s.subtitulo}>Verificando credenciales del usuario...</p>
        </div>
      </div>
    );
  }

  if (noEsClienteMensaje) {
    return (
      <div style={s.contenedor}>
        <div style={s.card}>
          <p style={s.titulo}>Acceso Restringido</p>
          <div style={s.error}>
            <strong>Error de perfil:</strong> Esta sección es de uso exclusivo para Alumnos/Clientes del sistema. Tu usuario actual no posee los permisos requeridos.
          </div>
          <div style={s.centrado}>
            <a href="/" style={s.enlace}>Volver al Inicio</a>
          </div>
        </div>
      </div>
    );
  }

  if (cuentaActivaMensaje) {
    return (
      <div style={s.contenedor}>
        <div style={s.card}>
          <p style={s.titulo}>Cuenta Activa</p>
          <div style={s.exito}>
            Tu cuenta se encuentra activa y no registra suspensiones vigentes en el sistema.
          </div>
          <p style={{ ...s.subtitulo, marginBottom: 0, marginTop: '16px' }}>
            Redirigiendo automáticamente al inicio en 5 segundos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.contenedor}>
      <div style={s.card}>
        <p style={s.titulo}>Solicitar Reintegro</p>

        {mensajeExito ? (
          <div style={s.centrado}>
            <div style={s.exito}>{mensajeExito}</div>
            <button
              style={{ ...s.enlace, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => { localStorage.removeItem('access_token'); navigate('/'); }}
            >
              Ir al Inicio
            </button>
          </div>
        ) : (
          <>
            {!bloqueadoPorTiempo && (
              <p style={s.subtitulo}>
                Tu cuenta de alumno se encuentra suspendida. Completá el formulario para enviar la revisión al administrador.
              </p>
            )}

            {errorValidacion && <div style={s.error}>{errorValidacion}</div>}

            {!bloqueadoPorTiempo && (
              <form onSubmit={manejarEnvio}>
                <div style={s.grupo}>
                  <label style={s.label} htmlFor="motivo">Motivo de la solicitud</label>
                  <textarea
                    id="motivo"
                    style={s.textarea}
                    placeholder="Explicá detalladamente por qué solicitás la reincorporación..."
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
            )}

            <div style={s.centrado}>
              <a href="/" style={s.enlace}>Cancelar</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SolicitarReintegro;
