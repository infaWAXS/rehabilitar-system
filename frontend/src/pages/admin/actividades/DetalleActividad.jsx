// HU Listar condiciones de cliente (Nahuel)
// E1: hay inscriptos → tabla con condición de acceso por cliente
// E2: sin inscriptos → "No hay inscriptos en esta actividad."
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getActivityById, getActivityClients } from '../../../services/activitiesService';
import { getRole } from '../../../services/authService';

const TIPO_LABEL = { fixed: 'Fija', individual: 'Individual' };

const PAGO_LABEL = {
  pending:   'Pago Pendiente',
  partial:   'Seña',
  completed: 'Pago Total',
};

const PAGO_CHIP = {
  completed: { background: '#dcfce7', color: '#15803d' },
  partial:   { background: '#fef9c3', color: '#854d0e' },
  pending:   { background: '#fef2f2', color: '#dc2626' },
};

const CHIP_TIPO = {
  abonado:    { background: '#e0f2fe', color: '#0369a1' },
  no_abonado: { background: '#f3e8ff', color: '#6b21a8' },
};

const FILTROS_VACIOS = { busqueda: '', tipo: '' };

const s = {
  volver: { color: 'var(--color-primario)', textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'inline-block', marginBottom: '16px' },
  card: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--sombra)', marginBottom: '24px' },
  cardTabla: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '0', boxShadow: 'var(--sombra)', marginBottom: '24px', overflowX: 'auto' },
  tituloSeccion: { fontSize: '18px', fontWeight: '700', color: 'var(--color-texto)', marginBottom: '16px', marginTop: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '11px', fontWeight: '600', color: 'var(--color-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  valor: { fontSize: '14px', color: 'var(--color-texto)' },
  chip: { display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--color-texto-suave)', borderBottom: '1px solid var(--color-borde)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '12px 14px', borderBottom: '1px solid var(--color-borde)', color: 'var(--color-texto)' },
  vacio: { textAlign: 'center', padding: '40px', color: 'var(--color-texto-suave)', fontSize: '14px' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' },
  filtros: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center', padding: '16px 24px 0' },
  inputBusqueda: { padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)', minWidth: '220px', boxSizing: 'border-box' },
  select: { padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)', cursor: 'pointer' },
  botonLimpiar: { padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--color-primario)', background: 'transparent', color: 'var(--color-primario)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  link: { color: 'var(--color-primario)', textDecoration: 'none', fontWeight: '600', fontSize: '13px' },
  tituloInscriptos: { fontSize: '18px', fontWeight: '700', color: 'var(--color-texto)', margin: '0', padding: '24px 24px 0' },
};

function DetalleActividad() {
  const { id } = useParams();
  const [actividad, setActividad] = useState(null);
  const [todosClientes, setTodosClientes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);

  useEffect(() => {
    setCargando(true);
    setError('');
    Promise.all([getActivityById(id), getActivityClients(id)])
      .then(([act, cli]) => {
        setActividad(act);
        const lista = Array.isArray(cli) ? cli : [];
        setTodosClientes(lista);
        setClientes(lista);
      })
      .catch(() => setError('No se pudo cargar el detalle de la actividad.'))
      .finally(() => setCargando(false));
  }, [id]);

  const aplicarFiltros = useCallback((f, base) => {
    let filtrados = base;
    if (f.busqueda) {
      const b = f.busqueda.toLowerCase();
      filtrados = filtrados.filter((c) =>
        c.name.toLowerCase().includes(b) ||
        c.lastname.toLowerCase().includes(b) ||
        (c.email || '').toLowerCase().includes(b)
      );
    }
    if (f.tipo) {
      const quiereAbonado = f.tipo === 'abonado';
      filtrados = filtrados.filter((c) => c.es_abonado === quiereAbonado);
    }
    setClientes(filtrados);
  }, []);

  const cambio = (e) => {
    const nuevosFiltros = { ...filtros, [e.target.name]: e.target.value };
    setFiltros(nuevosFiltros);
    aplicarFiltros(nuevosFiltros, todosClientes);
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_VACIOS);
    setClientes(todosClientes);
  };

  const hayFiltros = filtros.busqueda !== '' || filtros.tipo !== '';

  if (cargando) {
    return (
      <LayoutPrivado titulo="Detalle de Actividad">
        <div style={s.vacio}>Cargando…</div>
      </LayoutPrivado>
    );
  }

  const rol = getRole();
  const actividadesBase = rol === 'admin' ? '/admin/actividades' : '/recepcionista/actividades';
  const clientesBase = rol === 'admin' ? '/admin/clientes' : '/recepcionista/clientes';

  return (
    <LayoutPrivado titulo="Detalle de Actividad">
      <Link to={actividadesBase} style={s.volver}>← Volver a actividades</Link>

      {error && <div style={s.error}>{error}</div>}

      {actividad && (
        <div style={s.card}>
          <h3 style={s.tituloSeccion}>{actividad.name}</h3>
          <div style={s.grid}>
            <div style={s.campo}>
              <span style={s.label}>Tipo</span>
              <span style={s.valor}>{TIPO_LABEL[actividad.activity_type] ?? actividad.activity_type}</span>
            </div>
            <div style={s.campo}>
              <span style={s.label}>Especialidad</span>
              <span style={s.valor}>{actividad.specialization || '—'}</span>
            </div>
            <div style={s.campo}>
              <span style={s.label}>Fecha</span>
              <span style={s.valor}>
                {actividad.specific_date ? (() => {
                  const fecha = new Date(`${actividad.specific_date}T00:00:00`);
                  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                  const dia = dias[fecha.getDay()];
                  const dia_num = fecha.getDate().toString().padStart(2, '0');
                  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
                  const anio = fecha.getFullYear();
                  return `${dia} ${dia_num}/${mes}/${anio}`;
                })() : (actividad.schedule || '—')}
              </span>
            </div>
            <div style={s.campo}>
              <span style={s.label}>Horario</span>
              <span style={s.valor}>{actividad.time_slot || '—'}</span>
            </div>
            <div style={s.campo}>
              <span style={s.label}>Profesor</span>
              <span style={s.valor}>{actividad.professor || 'Sin asignar'}</span>
            </div>
            <div style={s.campo}>
              <span style={s.label}>Cupos</span>
              <span style={s.valor}>{actividad.capacity}</span>
            </div>
            <div style={s.campo}>
              <span style={s.label}>Precio</span>
              <span style={s.valor}>${actividad.price}</span>
            </div>
          </div>
          {actividad.description && (
            <div style={{ ...s.campo, marginTop: '16px' }}>
              <span style={s.label}>Descripción</span>
              <span style={s.valor}>{actividad.description}</span>
            </div>
          )}
          {actividad.requirements && (
            <div style={{ ...s.campo, marginTop: '12px' }}>
              <span style={s.label}>Requisitos</span>
              <span style={s.valor}>{actividad.requirements}</span>
            </div>
          )}
        </div>
      )}

      {/* Sección inscriptos */}
      <div style={s.cardTabla}>
        <h3 style={s.tituloInscriptos}>Inscriptos</h3>

        {/* Filtros */}
        <div style={s.filtros}>
          <input
            style={s.inputBusqueda}
            type="text"
            name="busqueda"
            placeholder="Buscar por nombre o email..."
            value={filtros.busqueda}
            onChange={cambio}
          />
          <select style={s.select} name="tipo" value={filtros.tipo} onChange={cambio}>
            <option value="">Todos los tipos</option>
            <option value="abonado">Abonado</option>
            <option value="no_abonado">No abonado</option>
          </select>
          {hayFiltros && (
            <button style={s.botonLimpiar} onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla */}
        {cargando ? (
          <div style={s.vacio}>Cargando inscriptos...</div>
        ) : clientes.length === 0 ? (
          <div style={s.vacio}>
            {hayFiltros
              ? 'No se encontraron inscriptos con los filtros aplicados.'
              : 'No hay inscriptos en esta actividad.'}
          </div>
        ) : (
          <table style={s.tabla}>
            <thead>
              <tr>
                <th style={s.th}>Nombre</th>
                <th style={s.th}>Email</th>
                <th style={s.th}>Condición</th>
                <th style={s.th}>Suscripción / Reserva</th>
                <th style={s.th}>Estado de Pago</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.user_id}>
                  <td style={s.td}>{c.name} {c.lastname}</td>
                  <td style={s.td}>{c.email || '—'}</td>

                  {/* Abonado / No abonado */}
                  <td style={s.td}>
                    <span style={{ ...s.chip, ...(c.es_abonado ? CHIP_TIPO.abonado : CHIP_TIPO.no_abonado) }}>
                      {c.es_abonado ? 'Abonado' : 'No abonado'}
                    </span>
                  </td>

                  {/* Suscripción (abonado) o Reserva (no abonado) */}
                  <td style={s.td}>
                    {c.es_abonado ? (
                      <span style={{ ...s.chip, background: '#dcfce7', color: '#15803d' }}>
                        Suscripción Activa
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-texto)', fontSize: '13px', fontWeight: '500' }}>
                        Tiene Reserva ✅
                      </span>
                    )}
                  </td>

                  {/* Estado de pago (solo no abonados) */}
                  <td style={s.td}>
                    {!c.es_abonado ? (
                      <span style={{ ...s.chip, ...(PAGO_CHIP[c.payment_status] || PAGO_CHIP.pending) }}>
                        {PAGO_LABEL[c.payment_status] || c.payment_status}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-texto-suave)', fontSize: '13px' }}>N/A</span>
                    )}
                  </td>

                  <td style={s.td}>
                    <Link to={`${clientesBase}/${c.user_id}`} style={s.link}>Ver ficha</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </LayoutPrivado>
  );
}

export default DetalleActividad;

