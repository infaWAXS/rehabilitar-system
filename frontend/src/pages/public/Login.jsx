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
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const mensajeExito = location.state?.mensaje || '';
  const [form, setForm] = useState({ email: '', contrasena: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const cambio = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const data = await login({ email: form.email, password: form.contrasena });

      // E5-suspendida: cuenta suspendida → no puede ingresar, redirige a solicitar reintegro
      if (data.account_status === 'suspended') {
        navigate(`/solicitar-reintegro?email=${encodeURIComponent(form.email)}`, {
          state: { token: data.access_token, userId: data.id },
        });
        return;
      }

      saveUserData(data);
      navigate('/');
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('deshabilitada')) {
        setError('Tu cuenta está deshabilitada. Contactate con el centro.');
      } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('404')) {
        setError('El correo no está registrado en el sistema.');
      } else {
        setError('Correo o contraseña incorrectos.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <LayoutPublico>
      <form onSubmit={enviar}>
        {mensajeExito && <div style={s.exito}>{mensajeExito}</div>}
        {error && <div style={s.error}>{error}</div>}
        <div style={s.campo}>
          <label style={s.label}>Correo electrónico</label>
          <input style={s.input} type="email" name="email" value={form.email} onChange={cambio} required placeholder="ejemplo@mail.com" />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Contraseña</label>
          <input style={s.input} type="password" name="contrasena" value={form.contrasena} onChange={cambio} required placeholder="••••••••" />
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
