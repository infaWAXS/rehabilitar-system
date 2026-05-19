import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getClients } from '../../../services/usersService';

const STATUS_LABEL = { active: 'Activo', disabled: 'Deshabilitado' };
const CERT_LABEL = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' };

const CHIP_ESTADO = {
  active:   { background: '#dcfce7', color: '#15803d' },
  disabled: { background: '#fef2f2', color: '#dc2626' },
};
const CHIP_CERT = {
  pending:  { background: '#fef9c3', color: '#854d0e' },
  approved: { background: '#dcfce7', color: '#15803d' },
  rejected: { background: '#fef2f2', color: '#dc2626' },
};

const s = {
  cabecera: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', margin: 0 },
  filtros: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  inputBusqueda: {
    padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)',
    minWidth: '220px', boxSizing: 'border-box',
  },
  select: {
    padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)', cursor: 'pointer',
  },
  botonLimpiar: {
    padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--color-primario)',
    background: 'transparent', color: 'var(--color-primario)', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--color-texto-suave)', borderBottom: '1px solid var(--color-borde)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '12px 14px', borderBottom: '1px solid var(--color-borde)', color: 'var(--color-texto)' },
  chip: { display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
  vacio: { textAlign: 'center', padding: '48px', color: 'var(--color-texto-suave)', fontSize: '15px' },
  card: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '0', boxShadow: 'var(--sombra)', overflowX: 'auto' },
  link: { color: 'var(--color-primario)', textDecoration: 'none', fontWeight: '600', fontSize: '13px' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' },
};

const FILTROS_VACIOS = { busqueda: '', estado: '' };

function ListaClientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);

  const cargar = useCallback((f) => {
    setCargando(true);
    setError('');
    getClients(f.busqueda, f.estado)
      .then((data) => setClientes(Array.isArray(data) ? data : []))
      .catch(() => setError('No se pudieron cargar los clientes.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar(filtros);
  }, []); // eslint-disable-line

  const aplicarFiltros = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    cargar(nuevosFiltros);
  };

  const cambio = (e) => {
    const nuevosFiltros = { ...filtros, [e.target.name]: e.target.value };
    setFiltros(nuevosFiltros);
    cargar(nuevosFiltros);
  };

  const limpiarFiltros = () => aplicarFiltros(FILTROS_VACIOS);

  const hayFiltros = filtros.busqueda !== '' || filtros.estado !== '';

  return (
    <LayoutPrivado titulo="Clientes">
      <div style={s.cabecera}>
        <p style={s.titulo}>Lista de clientes</p>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {/* Filtros */}
      <div style={s.filtros}>
        <input
          style={s.inputBusqueda}
          type="text"
          name="busqueda"
          placeholder="Buscar por nombre, email o DNI..."
          value={filtros.busqueda}
          onChange={cambio}
        />
        <select style={s.select} name="estado" value={filtros.estado} onChange={cambio}>
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="disabled">Deshabilitado</option>
        </select>
        {hayFiltros && (
          <button style={s.botonLimpiar} onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div style={s.vacio}>Cargando...</div>
      ) : clientes.length === 0 ? (
        <div style={s.vacio}>
          {hayFiltros ? 'No se encontraron clientes con los filtros aplicados.' : 'No hay clientes registrados.'}
        </div>
      ) : (
        <div style={s.card}>
          <table style={s.tabla}>
            <thead>
              <tr>
                <th style={s.th}>Nombre</th>
                <th style={s.th}>Email</th>
                <th style={s.th}>DNI</th>
                <th style={s.th}>Estado cuenta</th>
                <th style={s.th}>Apto fisico</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td style={s.td}>{c.name} {c.lastname}</td>
                  <td style={s.td}>{c.email}</td>
                  <td style={s.td}>{c.dni || '—'}</td>
                  <td style={s.td}>
                    <span style={{ ...s.chip, ...(CHIP_ESTADO[c.account_status] || {}) }}>
                      {STATUS_LABEL[c.account_status] || c.account_status}
                    </span>
                  </td>
                  <td style={s.td}>
                    {c.medical_certificate_status ? (
                      <span style={{ ...s.chip, ...(CHIP_CERT[c.medical_certificate_status] || {}) }}>
                        {CERT_LABEL[c.medical_certificate_status] || c.medical_certificate_status}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-texto-suave)', fontSize: '13px' }}>Sin apto</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <Link to={`/admin/clientes/${c.id}`} style={s.link}>Ver detalle</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LayoutPrivado>
  );
}

export default ListaClientes;

