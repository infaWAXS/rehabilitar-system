import React, { useState } from 'react';
import LayoutPublico from '../../layouts/LayoutPublico';

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
  enlace: { display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '13px' },
  titulo: { fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--color-texto)' },
};

function Registro() {
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', contrasena: '', confirmar: '' });
  const cambio = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = (e) => {
    e.preventDefault();
    // TODO: conectar con servicio de registro
    alert('Implementar lógica de registro');
  };

  return (
    <LayoutPublico>
      <p style={s.titulo}>Crear cuenta</p>
      <form onSubmit={enviar}>
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
          <label style={s.label}>Correo electrónico</label>
          <input style={s.input} type="email" name="email" value={form.email} onChange={cambio} required />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Contraseña</label>
          <input style={s.input} type="password" name="contrasena" value={form.contrasena} onChange={cambio} required />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Confirmar contraseña</label>
          <input style={s.input} type="password" name="confirmar" value={form.confirmar} onChange={cambio} required />
        </div>
        <button type="submit" style={s.boton}>Registrarse</button>
        <a href="/login" style={s.enlace}>¿Ya tenés cuenta? Iniciar sesión</a>
      </form>
    </LayoutPublico>
  );
}

export default Registro;
