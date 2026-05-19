import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPublico from '../../layouts/LayoutPublico';
import { register, login } from '../../services/authService';
import { uploadMedicalCertificateWithToken } from '../../services/usersService';

const s = {
  campo: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px',
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
  titulo: { fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--color-texto)' },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
    padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px',
  },
  exito: {
    background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
    padding: '10px 14px', color: '#16a34a', fontSize: '13px', marginBottom: '16px',
  },
};

function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', email: '', contrasena: '', confirmar: '' });
  const [aptoFile, setAptoFile] = useState(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const cambio = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (form.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (form.contrasena !== form.confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      await register({
        name: form.nombre,
        lastname: form.apellido,
        email: form.email,
        password: form.contrasena,
        dni: form.dni || undefined,
      });

      // Si hay apto físico, hacer login automático para obtener token y subir el archivo
      if (aptoFile) {
        try {
          const loginData = await login({ email: form.email, password: form.contrasena });
          if (loginData?.access_token) {
            await uploadMedicalCertificateWithToken(loginData.access_token, aptoFile);
          }
        } catch {
          // Si falla la subida, el usuario puede subirlo desde su perfil
        }
      }

      setExito('¡Cuenta creada correctamente! Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('ya existe') || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('conflict')) {
        setError('El correo ya se encuentra registrado en el sistema.');
      } else {
        setError(msg || 'No se pudo crear la cuenta. Intentá de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <LayoutPublico>
      <p style={s.titulo}>Crear cuenta</p>
      <form onSubmit={enviar}>
        {error && <div style={s.error}>{error}</div>}
        {exito && <div style={s.exito}>{exito}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={s.campo}>
            <label style={s.label}>Nombre</label>
            <input style={s.input} name="nombre" value={form.nombre} onChange={cambio} required />
          </div>
          <div style={s.campo}>
            <label style={s.label}>Apellido</label>
            <input style={s.input} name="apellido" value={form.apellido} onChange={cambio} required />
          </div>
        </div>
        <div style={s.campo}>
          <label style={s.label}>DNI</label>
          <input style={s.input} name="dni" value={form.dni} onChange={cambio} placeholder="Ej: 12345678" />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Correo electrónico</label>
          <input style={s.input} type="email" name="email" value={form.email} onChange={cambio} required />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Contraseña <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(mín. 6 caracteres)</span></label>
          <input style={s.input} type="password" name="contrasena" value={form.contrasena} onChange={cambio} required />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Confirmar contraseña</label>
          <input style={s.input} type="password" name="confirmar" value={form.confirmar} onChange={cambio} required />
        </div>
        <div style={s.campo}>
          <label style={s.label}>
            Apto físico <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(opcional, PDF o imagen)</span>
          </label>
          <input
            style={{ ...s.input, padding: '7px 14px' }}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setAptoFile(e.target.files[0] || null)}
          />
        </div>
        <button type="submit" style={cargando ? s.botonDisabled : s.boton} disabled={cargando}>
          {cargando ? 'Registrando...' : 'Registrarse'}
        </button>
        <a href="/login" style={s.enlace}>¿Ya tenés cuenta? Iniciar sesión</a>
      </form>
    </LayoutPublico>
  );
}

export default Registro;
