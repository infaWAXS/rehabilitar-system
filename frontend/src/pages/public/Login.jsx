// HU Iniciar sesión - Responsable: Agustin
// E1: credenciales correctas, cuenta activa → saveUserData + redirige a /
// E2: email inexistente → "El correo no está registrado en el sistema"
// E3: contraseña incorrecta (< 3 intentos) → "Correo o contraseña incorrectos", incrementa contador
// E4: 3er intento fallido → cuenta deshabilitada (back); TODO (Agustin): enviar mail recuperación + reiniciar contador
// E5: cuenta deshabilitada → "Tu cuenta está deshabilitada."
// E5-suspendida: cuenta suspendida → permite ingresar; LayoutPrivado mostrará banner y contenido inhabilitado
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LayoutPublico from '../../layouts/LayoutPublico';
import { login, saveUserData } from '../../services/authService';

const s = {
  campo: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px', outline: 'none',
    background: 'var(--color-fondo)',
  },
  boton: {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    color: '#fff', fontWeight: '700', fontSize: '15px', marginTop: '8px', cursor: 'pointer',
  },
  botonDisabled: {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: '#ccc', color: '#fff', fontWeight: '700', fontSize: '15px', marginTop: '8px', cursor: 'not-allowed',
  },
  enlace: { display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '13px' },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
    padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px',
  },
  exito: {
    background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
    padding: '10px 14px', color: '#16a34a', fontSize: '13px', marginBottom: '16px',
  },
  errInline: { fontSize: '12px', color: '#dc2626', display: 'block', marginBottom: '4px' },
  suspCard: { display: 'flex', flexDirection: 'column', gap: '14px' },
  suspTitulo: { fontSize: '18px', fontWeight: '700', margin: 0 },
  suspTexto: { fontSize: '14px', color: 'var(--color-texto)', lineHeight: '1.6', margin: 0 },
  suspBtnPrimario: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--color-primario)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '4px' },
  suspBtnVolver: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: 'transparent', color: 'var(--color-texto-suave)', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const mensajeExito = location.state?.mensaje || '';
  const [form, setForm] = useState({ email: '', contrasena: '' });
  const [fieldErrors, setFieldErrors] = useState({ email: '', contrasena: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [suspendida, setSuspendida] = useState(null); // null | { pendiente: bool }

  const cambio = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');

    // Validación inline por campo
    const errs = {};
    if (!form.email.trim()) errs.email = 'El correo es requerido.';
    if (!form.contrasena) errs.contrasena = 'La contraseña es requerida.';
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({ email: '', contrasena: '' });

    setCargando(true);

    try {
      const data = await login({ email: form.email, password: form.contrasena });

      // E5-suspendida: cuenta suspendida → no puede ingresar, mostrar vista con opción de reintegro
      if (data.account_status === 'suspended') {
        localStorage.setItem('access_token', data.access_token); // solo para SolicitarReintegro
        setSuspendida({ pendiente: false });
        return;
      }
      // cuenta con solicitud pendiente → no puede ingresar, mostrar mensaje de espera
      if (data.account_status === 'pending_reintegration') {
        setSuspendida({ pendiente: true });
        return;
      }

      saveUserData(data);
      navigate('/');
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('deshabilitada')) {
        setError('cuenta_deshabilitada');
      } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('404')) {
        setError('El correo no está registrado en el sistema.');
      } else {
        setError('Correo o contraseña incorrectos.');
      }
    } finally {
      setCargando(false);
    }
  };

  if (suspendida) {
    return (
      <LayoutPublico>
        <div style={s.suspCard}>
          {!suspendida.pendiente ? (
            <>
              <p style={{ ...s.suspTitulo, color: '#dc2626' }}>Cuenta suspendida</p>
              <p style={s.suspTexto}>
                Tu cuenta está <strong>suspendida</strong>. No podés acceder al sistema
                hasta que un administrador la reactive.
              </p>
              <p style={s.suspTexto}>
                Podés solicitar el reintegro completando el formulario de solicitud.
              </p>
              <button style={s.suspBtnPrimario} onClick={() => navigate('/solicitar-reintegro')}>
                Solicitar Reintegro
              </button>
            </>
          ) : (
            <>
              <p style={{ ...s.suspTitulo, color: '#92400e' }}>Solicitud pendiente</p>
              <p style={s.suspTexto}>
                Tu solicitud de reintegro está <strong>pendiente de revisión</strong> por un
                administrador. No podés acceder hasta que sea procesada.
              </p>
            </>
          )}
          <button style={s.suspBtnVolver} onClick={() => { localStorage.removeItem('access_token'); setSuspendida(null); }}>
            ← Volver al login
          </button>
        </div>
      </LayoutPublico>
    );
  }

  return (
    <LayoutPublico>
      <form onSubmit={enviar}>
        {mensajeExito && <div style={s.exito}>{mensajeExito}</div>}
        {error && (
          <div style={s.error}>
            {error === 'cuenta_deshabilitada' ? (
              <>
                Tu cuenta está deshabilitada. Para habilitarla hacé click en{' '}
                <a href="/recuperar-contrasena" style={{ color: 'var(--color-primario)', textDecoration: 'none', fontWeight: 400 }}>
                  recuperar contraseña
                </a>
              </>
            ) : (
              error
            )}
          </div>
        )}
        <div style={s.campo}>
          <label style={s.label}>Correo electrónico</label>
          {fieldErrors.email && <span style={s.errInline}>{fieldErrors.email}</span>}
          <input style={s.input} type="email" name="email" value={form.email} onChange={cambio} placeholder="ejemplo@mail.com" />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Contraseña</label>
          {fieldErrors.contrasena && <span style={s.errInline}>{fieldErrors.contrasena}</span>}
          <input style={s.input} type="password" name="contrasena" value={form.contrasena} onChange={cambio} placeholder="••••••••" />
        </div>
        <button type="submit" style={cargando ? s.botonDisabled : s.boton} disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
        <a href="/recuperar-contrasena" style={s.enlace}>¿Olvidaste tu contraseña?</a>
        <a href="/registro" style={{ ...s.enlace, color: 'var(--color-texto-suave)' }}>¿No tenés cuenta? Registrarse</a>
      </form>
    </LayoutPublico>
  );
}

export default Login;
