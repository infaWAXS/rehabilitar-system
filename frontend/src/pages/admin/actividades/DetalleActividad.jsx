// HU Listar condiciones de cliente (Nahuel)
// E1: hay inscriptos → tabla con condición de acceso por cliente
// E2: sin inscriptos → "No hay inscriptos en esta actividad."
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getActivityById, getActivityClients } from '../../../services/activitiesService';

const TIPO_LABEL = { fixed: 'Fija', individual: 'Individual' };

const PAGO_LABEL = {
  pending:   'Pago pendiente',
  partial:   'Seña pagada',
  completed: 'Pago total',
};

const PAGO_CHIP = {
  pending:   { background: '#fef2f2', color: '#dc2626' },
  partial:   { background: '#fefce8', color: '#92400e' },
  completed: { background: '#f0fdf4', color: '#166534' },
};

const CONDICION_CHIP = {
  abonado:   { background: '#dbeafe', color: '#1d4ed8', label: 'Suscripción vigente' },
  pagado:    { background: '#f0fdf4', color: '#166534', label: 'Pago total' },
  senia:     { background: '#fefce8', color: '#92400e', label: 'Seña' },
  pendiente: { background: '#fef2f2', color: '#dc2626', label: 'Pago pendiente' },
};

function condicionAcceso(esAbonado, paymentStatus) {
  if (esAbonado) return CONDICION_CHIP.abonado;
  if (paymentStatus === 'completed') return CONDICION_CHIP.pagado;
  if (paymentStatus === 'partial') return CONDICION_CHIP.senia;
  return CONDICION_CHIP.pendiente;
}

const s = {
  volver: { color: 'var(--color-primario)', textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'inline-block', marginBottom: '16px' },
  card: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--sombra)', marginBottom: '24px' },
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
};

function DetalleActividad() {
  const { id } = useParams();
  const [actividad, setActividad] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setCargando(true);
    setError('');
    Promise.all([getActivityById(id), getActivityClients(id)])
      .then(([act, cli]) => {
        setActividad(act);
        // E1/E2: lista de inscriptos (puede ser vacía)
        setClientes(Array.isArray(cli) ? cli : []);
      })
      .catch(() => setError('No se pudo cargar el detalle de la actividad.'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <LayoutPrivado titulo="Detalle de Actividad">
        <div style={s.vacio}>Cargando…</div>
      </LayoutPrivado>
    );
  }

  return (
    <LayoutPrivado titulo="Detalle de Actividad">
      <Link to="/admin/actividades" style={s.volver}>← Volver a actividades</Link>

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
              <span style={s.label}>Horario</span>
              <span style={s.valor}>{actividad.schedule || actividad.specific_date || '—'}</span>
            </div>
            {actividad.time_slot && (
              <div style={s.campo}>
                <span style={s.label}>Hora</span>
                <span style={s.valor}>{actividad.time_slot}</span>
              </div>
            )}
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

      {/* Sección inscriptos con condición de acceso */}
      <div style={s.card}>
        <h3 style={s.tituloSeccion}>Inscriptos</h3>
        {/* E2: sin inscriptos */}
        {clientes.length === 0 ? (
          <div style={s.vacio}>No hay inscriptos en esta actividad.</div>
        ) : (
          /* E1: tabla con condición de acceso */
          <div style={{ overflowX: 'auto' }}>
            <table style={s.tabla}>
              <thead>
                <tr>
                  <th style={s.th}>Nombre</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Tipo reserva</th>
                  <th style={s.th}>Condición de acceso</th>
                  <th style={s.th}>Estado de pago</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => {
                  const condicion = condicionAcceso(c.es_abonado, c.payment_status);
                  const pagoChip = PAGO_CHIP[c.payment_status] ?? PAGO_CHIP.pending;
                  return (
                    <tr key={c.user_id}>
                      <td style={s.td}>{c.name} {c.lastname}</td>
                      <td style={s.td}>{c.email}</td>
                      <td style={s.td}>{TIPO_LABEL[c.reservation_type] ?? c.reservation_type}</td>
                      <td style={s.td}>
                        <span style={{ ...s.chip, ...condicion }}>{condicion.label}</span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.chip, ...pagoChip }}>{PAGO_LABEL[c.payment_status] ?? c.payment_status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LayoutPrivado>
  );
}

export default DetalleActividad;

