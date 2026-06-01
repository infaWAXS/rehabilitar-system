// HU Registrar usuario - Responsable: Agustin
// E1/E2/E3: registro exitoso (con/sin apto, con/sin prof) → cuenta creada + redirige a /login
// E4: email ya registrado → error "El correo ya se encuentra registrado"
// E5: password < 6 chars → error validación inline (esquema_usuario.py también lo valida)
// E6: DNI numérico opcional → sin foto ni sistema externo (deshabilitado)
// E7: error doble autenticación (2FA via mail) → pendiente (no implementado)
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
  errInline: { fontSize: '12px', color: '#dc2626', display: 'block', marginBottom: '4px' },
};

function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', contrasena: '', confirmar: '', dni: '', direccion: '', telefono: '', fecha_nacimiento: '' });
  const [aptoFile, setAptoFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const cambio = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    // Validación inline por campo
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'Este campo es requerido.';
    if (!form.apellido.trim()) errs.apellido = 'Este campo es requerido.';
    if (!form.email.trim()) errs.email = 'Este campo es requerido.';
    if (!form.dni.trim()) {
      errs.dni = 'Este campo es requerido.';
    } else if (!/^\d{7,8}$/.test(form.dni.trim())) {
      errs.dni = 'El DNI debe tener entre 7 y 8 dígitos numéricos.';
    }
    if (!form.contrasena) errs.contrasena = 'Este campo es requerido.';
    else if (form.contrasena.length < 6) errs.contrasena = 'La contraseña debe tener al menos 6 caracteres.';
    if (!form.confirmar) errs.confirmar = 'Este campo es requerido.';
    else if (form.contrasena !== form.confirmar) errs.confirmar = 'Las contraseñas no coinciden.';
    if (!form.fecha_nacimiento) {
      errs.fecha_nacimiento = 'Este campo es requerido.';
    } else {
      const hoy = new Date();
      const nacimiento = new Date(form.fecha_nacimiento);
      const edad = hoy.getFullYear() - nacimiento.getFullYear() - 
      ((hoy.getMonth(), hoy.getDate()) < (nacimiento.getMonth(), nacimiento.getDate()) ? 1 : 0);
      if (edad < 18) errs.fecha_nacimiento = 'Debés ser mayor de 18 años para registrarte.';
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
 
    setCargando(true);
    try {
      // E1/E2/E3: registra el usuario con datos opcionales
      await register({
        name: form.nombre,
        lastname: form.apellido,
        email: form.email,
        password: form.contrasena,
        dni: form.dni.trim(),
        birth_date: form.fecha_nacimiento,
        direccion: form.direccion.trim() || null,
        telefono: form.telefono.trim() || null,
      });

      // Subir apto físico con token temporal post-registro
      if (aptoFile) {
        try {
          const loginData = await login({ email: form.email, password: form.contrasena });
          if (loginData?.access_token) {
            // E3: sube apto físico → medical_certificate_status = "pending"
            await uploadMedicalCertificateWithToken(loginData.access_token, aptoFile);
          }
        } catch (err) {
          const msg = err.message || '';

          if (msg.includes('Solo se permiten archivos')) {
            setError('Solo se permiten archivos PNG, JPG y PDF');
          } else {
            setError('Error al subir el certificado médico');
          }
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
            {fieldErrors.nombre && <span style={s.errInline}>{fieldErrors.nombre}</span>}
            <input style={s.input} name="nombre" value={form.nombre} onChange={cambio} />
          </div>
          <div style={s.campo}>
            <label style={s.label}>Apellido</label>
            {fieldErrors.apellido && <span style={s.errInline}>{fieldErrors.apellido}</span>}
            <input style={s.input} name="apellido" value={form.apellido} onChange={cambio} />
          </div>
        </div>
        <div style={s.campo}>
          <label style={s.label}>Correo electrónico</label>
          {fieldErrors.email && <span style={s.errInline}>{fieldErrors.email}</span>}
          <input style={s.input} type="email" name="email" value={form.email} onChange={cambio} />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Contraseña <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(mín. 6 caracteres)</span></label>
          {fieldErrors.contrasena && <span style={s.errInline}>{fieldErrors.contrasena}</span>}
          <input style={s.input} type="password" name="contrasena" value={form.contrasena} onChange={cambio} />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Confirmar contraseña</label>
          {fieldErrors.confirmar && <span style={s.errInline}>{fieldErrors.confirmar}</span>}
          <input style={s.input} type="password" name="confirmar" value={form.confirmar} onChange={cambio} />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Fecha de nacimiento</label>
          {fieldErrors.fecha_nacimiento && <span style={s.errInline}>{fieldErrors.fecha_nacimiento}</span>}
          <input
            style={s.input}
            type="date"
            name="fecha_nacimiento"
            value={form.fecha_nacimiento}
            onChange={cambio}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={s.campo}>
            <label style={s.label}>DNI</label>
            {fieldErrors.dni && <span style={s.errInline}>{fieldErrors.dni}</span>}
            <input style={s.input} type="text" inputMode="numeric" pattern="[0-9]*" name="dni" value={form.dni} onChange={cambio} placeholder="Ej: 40123456" />
          </div>
          <div style={s.campo}>
            {/* E2: sin apto → cuenta activa sin permisos hasta adjuntar. E3: con apto → estado "pendiente" */}
            <label style={s.label}>
              Apto físico <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(opcional, PDF o imagen)</span>
            </label>
            <input
              style={{ ...s.input, padding: '7px 14px' }}
              type="file"
              accept=".jpg,.jpeg,.png,application/pdf" 
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
                if (!tiposPermitidos.includes(file.type)) {
                  setError('Solo se permiten archivos JPG, PNG y PDF');
                  e.target.value = null;
                  return;
                }
                
                setAptoFile(file);
                }}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={s.campo}>
            <label style={s.label}>Dirección <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(opcional)</span></label>
            <input style={s.input} name="direccion" value={form.direccion} onChange={cambio} placeholder="Ej: Calle 123, La Plata" />
          </div>
          <div style={s.campo}>
            <label style={s.label}>Teléfono <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(opcional)</span></label>
            <input style={s.input} name="telefono" value={form.telefono} onChange={cambio} placeholder="Ej: 221 123-4567" />
          </div>
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
