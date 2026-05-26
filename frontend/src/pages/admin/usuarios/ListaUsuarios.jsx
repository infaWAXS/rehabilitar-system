// HU Búsqueda de usuarios (Francis)
// E1: búsqueda con resultados → tabla con usuarios coincidentes
// E2: búsqueda sin resultados → "No se encontraron usuarios."
// HU Listar empleados (Agustin) — filtrar por rol professor/receptionist
// E1: hay empleados → tabla con resultados
// E2: sin empleados para el rol → "No se encontraron usuarios."
// E3: limpiar filtros → limpiar() resetea busqueda y rol, recarga todos los usuarios
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { searchUsers, deleteUser } from '../../../services/usersService';

const ROLES_LABEL = {
  admin: 'Administrador',
  client: 'Cliente',
  receptionist: 'Recepcionista',
  professor: 'Profesor',
};

const s = {
  cabecera: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', margin: 0 },
  botonCrear: {
    padding: '9px 20px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
  },
  filtros: {
    display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap',
    background: 'var(--color-fondo-card)', padding: '16px', borderRadius: '10px', boxShadow: 'var(--sombra)',
  },
  inputBuscar: {
    flex: 1, minWidth: '200px', padding: '9px 14px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)',
  },
  select: {
    padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)', cursor: 'pointer',
  },
  botonBuscar: {
    padding: '9px 20px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  botonLimpiar: {
    padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    background: '#fff', color: 'var(--color-texto-suave)', fontSize: '14px', cursor: 'pointer',
  },
  tabla: { width: '100%', borderCollapse: 'collapse', background: 'var(--color-fondo-card)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--sombra)' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)', borderBottom: '1px solid var(--color-borde)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '12px 16px', fontSize: '14px', color: 'var(--color-texto)', borderBottom: '1px solid var(--color-borde)' },
  chip: (rol) => {
    const colores = { admin: { bg: '#dbeafe', color: '#1d4ed8' }, client: { bg: '#dcfce7', color: '#15803d' }, receptionist: { bg: '#fef9c3', color: '#854d0e' }, professor: { bg: '#f3e8ff', color: '#7e22ce' } };
    const c = colores[rol] || { bg: '#f3f4f6', color: '#374151' };
    return { display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: c.bg, color: c.color };
  },
  chipEstado: (estado) => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
    background: estado === 'active' ? '#dcfce7' : '#fef2f2',
    color: estado === 'active' ? '#15803d' : '#dc2626',
  }),
  acciones: { display: 'flex', gap: '8px' },
  botonVer: {
    padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--color-primario)',
    background: 'transparent', color: 'var(--color-primario)', fontSize: '13px', cursor: 'pointer', fontWeight: '600', textDecoration: 'none',
  },
  botonEliminar: {
    padding: '6px 14px', borderRadius: '6px', border: '1px solid #dc2626',
    background: 'transparent', color: '#dc2626', fontSize: '13px', cursor: 'pointer', fontWeight: '600',
  },
  vacio: { textAlign: 'center', padding: '40px', color: 'var(--color-texto-suave)', fontSize: '14px' },
  cargando: { textAlign: 'center', padding: '40px', color: 'var(--color-texto-suave)', fontSize: '14px' },
  errorBanner: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px 32px', maxWidth: '380px', width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.18)' },
  modalTitulo: { fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: 'var(--color-texto)' },
  modalTexto: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '24px', lineHeight: 1.5 },
  modalBotones: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  modalCancelar: { padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-texto)' },
  modalConfirmar: { padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '700' },
};

function ListaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [rol, setRol] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarUsuarios = useCallback(async (busq, rolFiltro) => {
    setCargando(true);
    setErrorBanner('');
    try {
      const data = await searchUsers(busq, rolFiltro);
      setUsuarios(data);
    } catch (err) {
      setErrorBanner(err.message || 'No se pudo cargar la lista de usuarios.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarUsuarios('', ''); }, [cargarUsuarios]);

  const buscar = (e) => {
    e.preventDefault();
    cargarUsuarios(busqueda, rol);
  };

  const limpiar = () => {
    setBusqueda('');
    setRol('');
    cargarUsuarios('', '');
  };

  const abrirModal = (usuario) => { setUsuarioAEliminar(usuario); setModalVisible(true); };
  const cerrarModal = () => { setModalVisible(false); setUsuarioAEliminar(null); };

  const confirmarEliminar = async () => {
    if (!usuarioAEliminar) return;
    setEliminando(true);
    try {
      await deleteUser(usuarioAEliminar.id);
      setUsuarios((prev) => prev.filter((u) => u.id !== usuarioAEliminar.id));
      cerrarModal();
    } catch (err) {
      setErrorBanner(err.message || 'No se pudo eliminar el usuario.');
      cerrarModal();
    } finally {
      setEliminando(false);
    }
  };

  return (
    <LayoutPrivado titulo="Usuarios">
      <div style={s.cabecera}>
        <p style={s.titulo}>Gestión de usuarios</p>
        <Link to="/gestion/usuarios/crear" style={s.botonCrear}>+ Crear cuenta</Link>
      </div>

      {errorBanner && <div style={s.errorBanner}>{errorBanner}</div>}

      <form onSubmit={buscar} style={s.filtros}>
        <input
          style={s.inputBuscar}
          placeholder="Buscar por nombre, apellido, email o DNI..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select style={s.select} value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="client">Cliente</option>
          <option value="receptionist">Recepcionista</option>
          <option value="professor">Profesor</option>
        </select>
        <button type="submit" style={s.botonBuscar}>Buscar</button>
        <button type="button" style={s.botonLimpiar} onClick={limpiar}>Limpiar</button>
      </form>

      {cargando ? (
        <div style={s.cargando}>Cargando usuarios...</div>
      ) : (
        <table style={s.tabla}>
          <thead>
            <tr>
              <th style={s.th}>Nombre</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Rol</th>
              <th style={s.th}>Estado</th>
              <th style={s.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr><td colSpan={5} style={s.vacio}>No se encontraron usuarios.</td></tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id}>
                  <td style={s.td}>{u.name} {u.lastname}</td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}><span style={s.chip(u.role)}>{ROLES_LABEL[u.role] || u.role}</span></td>
                  <td style={s.td}><span style={s.chipEstado(u.account_status)}>{u.account_status === 'active' ? 'Activo' : 'Deshabilitado'}</span></td>
                  <td style={s.td}>
                    <div style={s.acciones}>
                      <Link to={`/gestion/usuarios/${u.id}`} style={s.botonVer}>Editar</Link>
                      <button style={s.botonEliminar} onClick={() => abrirModal(u)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {modalVisible && usuarioAEliminar && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={s.modalTitulo}>Eliminar cuenta</p>
            <p style={s.modalTexto}>
              ¿Estás seguro de que querés eliminar la cuenta de{' '}
              <strong>{usuarioAEliminar.name} {usuarioAEliminar.lastname}</strong>?{' '}
              Esta acción no se puede deshacer.
            </p>
            <div style={s.modalBotones}>
              <button style={s.modalCancelar} onClick={cerrarModal} disabled={eliminando}>Cancelar</button>
              <button style={s.modalConfirmar} onClick={confirmarEliminar} disabled={eliminando}>
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutPrivado>
  );
}

export default ListaUsuarios;

