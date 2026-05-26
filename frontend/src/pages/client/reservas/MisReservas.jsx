// Responsable: Ezequiel
// HU: Ver mis reservas
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getMyReservations } from '../../../services/reservationsService';

const ESTADO_LABEL = {
  confirmed:  { texto: 'Confirmada',  color: '#16a34a', bg: '#dcfce7' },
  pending:    { texto: 'Pendiente',   color: '#d97706', bg: '#fef3c7' },
  completed:  { texto: 'Completada',  color: '#2563eb', bg: '#eff6ff' },
};

const PAGO_LABEL = {
  completed: 'Pagado',
  partial:   'Seña',
  pending:   'Pendiente',
};

const s = {
  cabecera: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
  },
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', margin: 0 },
  botonInscribir: {
    padding: '10px 20px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  alerta: (tipo) => ({
    padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
    background: tipo === 'error' ? '#fef2f2' : '#f0fdf4',
    border: `1px solid ${tipo === 'error' ? '#fecaca' : '#bbf7d0'}`,
    color: tipo === 'error' ? '#dc2626' : '#15803d',
  }),
  vacio: {
    textAlign: 'center', padding: '48px 24px',
    color: 'var(--color-texto-suave)', fontSize: '14px',
    background: 'var(--color-fondo-card)', borderRadius: '12px',
  },
  vacioIcono: { fontSize: '36px', marginBottom: '12px' },
  vacioTexto: { fontWeight: '600', marginBottom: '6px', color: 'var(--color-texto)' },
  tarjeta: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '18px 20px', boxShadow: 'var(--sombra)',
    marginBottom: '12px',
  },
  tarjetaFila: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px',
  },
  actividadNombre: { fontSize: '15px', fontWeight: '700', color: 'var(--color-texto)' },
  detalle: { fontSize: '13px', color: 'var(--color-texto-suave)', marginTop: '3px' },
  badges: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' },
  badge: (color, bg) => ({
    padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
    fontWeight: '600', color, background: bg,
  }),
};

export default function MisReservas() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyReservations()
      .then(setReservas)
      .catch(() => setError('No se pudieron cargar tus reservas.'))
      .finally(() => setCargando(false));
  }, []);

  function formatearHorario(r) {
    if (r.activity_type === 'fixed') return r.schedule || '—';
    const parts = [];
    if (r.specific_date) parts.push(r.specific_date);
    if (r.time_slot) parts.push(r.time_slot);
    return parts.join(' · ') || '—';
  }

  return (
    <LayoutPrivado>
      <div style={s.cabecera}>
        <h1 style={s.titulo}>Mis Reservas</h1>
        <button style={s.botonInscribir} onClick={() => navigate('/cliente/reservas/inscribir')}>
          + Inscribirse a una actividad
        </button>
      </div>

      {error && <div style={s.alerta('error')}>{error}</div>}

      {cargando ? (
        <div style={s.vacio}>Cargando tus reservas...</div>
      ) : reservas.length === 0 ? (
        <div style={s.vacio}>
          <div style={s.vacioIcono}>📋</div>
          <div style={s.vacioTexto}>No tenés reservas para ver</div>
          <div>Todavía no te inscribiste a ninguna actividad.</div>
        </div>
      ) : (
        reservas.map((r) => {
          const estado = ESTADO_LABEL[r.status] || { texto: r.status, color: '#6b7280', bg: '#f3f4f6' };
          return (
            <div key={r.id} style={s.tarjeta}>
              <div style={s.tarjetaFila}>
                <div>
                  <div style={s.actividadNombre}>{r.activity_name}</div>
                  <div style={s.detalle}>
                    {r.activity_type === 'fixed' ? 'Clase fija' : 'Clase individual'}
                    {' · '}
                    {formatearHorario(r)}
                  </div>
                  <div style={s.detalle}>
                    Tipo de reserva: {r.reservation_type === 'fixed' ? 'Fija' : 'Individual'}
                  </div>
                </div>
              </div>
              <div style={s.badges}>
                <span style={s.badge(estado.color, estado.bg)}>{estado.texto}</span>
                <span style={s.badge('#6b7280', '#f3f4f6')}>
                  Pago: {PAGO_LABEL[r.payment_status] || r.payment_status}
                </span>
              </div>
            </div>
          );
        })
      )}
    </LayoutPrivado>
  );
}

