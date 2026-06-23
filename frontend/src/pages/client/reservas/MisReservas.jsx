// Responsable: Ezequiel
// HU: Ver mis reservas | HU: Cancelar turno
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getMyReservations, cancelReservation } from '../../../services/reservationsService';
import { getMyWaitlist, removeWaitlistItem } from '../../../services/waitlistService';

const ESTADO_LABEL = {
  confirmed:  { texto: 'Confirmada',  color: '#16a34a', bg: '#dcfce7' },
  pending:    { texto: 'Pendiente',   color: '#d97706', bg: '#fef3c7' },
  completed:  { texto: 'Completada',  color: '#2563eb', bg: '#eff6ff' },
  cancelled:  { texto: 'Cancelada',   color: '#dc2626', bg: '#fef2f2' },
};

const PAGO_LABEL = {
  completed: 'Pagado',
  partial:   'Seña',
  pending:   'Pendiente',
};

// Colores de resultado de cancelación
const RESULTADO_ESTILO = {
  credit:               { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
  discount_30:          { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
  discount_20:          { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
  no_benefit:           { bg: '#fefce8', border: '#fde68a', color: '#92400e' },
  deposit_returned:     { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
  no_refund:            { bg: '#fefce8', border: '#fde68a', color: '#92400e' },
  center_credit:        { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
  center_credit_capped: { bg: '#fefce8', border: '#fde68a', color: '#92400e' },
  center_refund:        { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
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
  badges: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px', alignItems: 'center' },
  badge: (color, bg) => ({
    padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
    fontWeight: '600', color, background: bg,
  }),
  botonCancelar: (disabled) => ({
    padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
    border: `1px solid ${disabled ? '#d1d5db' : '#ef4444'}`,
    background: 'transparent',
    color: disabled ? '#9ca3af' : '#ef4444',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
  // Modal de confirmación
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'var(--color-fondo-card)', borderRadius: '14px',
    padding: '28px 32px', maxWidth: '420px', width: '90%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalTitulo: { fontSize: '17px', fontWeight: '700', marginBottom: '10px', color: 'var(--color-texto)' },
  modalTexto: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '20px', lineHeight: '1.5' },
  modalBotones: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  botonConfirmar: {
    padding: '9px 20px', borderRadius: '8px', border: 'none',
    background: '#ef4444', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
  },
  botonCerrar: {
    padding: '9px 20px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', background: 'transparent',
    color: 'var(--color-texto)', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
  },
  resultadoBanner: (estilo) => ({
    marginTop: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
    background: estilo.bg, border: `1px solid ${estilo.border}`, color: estilo.color,
  }),
  // Pestañas
  tabs: { display: 'flex', marginBottom: '24px', borderBottom: '2px solid var(--color-borde)' },
  tab: (activo) => ({
    padding: '10px 22px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    border: 'none', background: 'transparent',
    color: activo ? 'var(--color-primario)' : 'var(--color-texto-suave)',
    borderBottom: activo ? '2px solid var(--color-primario)' : '2px solid transparent',
    marginBottom: '-2px',
  }),
  // Lista de espera
  wBadge: (tipo) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '700',
    background: tipo === 'priority' ? '#eff6ff' : '#f3f4f6',
    color: tipo === 'priority' ? '#1d4ed8' : '#374151',
    border: `1px solid ${tipo === 'priority' ? '#bfdbfe' : '#e5e7eb'}`,
  }),
  wInfoBox: {
    background: '#fefce8', border: '1px solid #fde068', borderRadius: '8px',
    padding: '12px 14px', fontSize: '13px', color: '#854d0e', marginTop: '12px',
  },
  btnDanger: {
    padding: '7px 16px', borderRadius: '8px', border: 'none',
    background: '#dc2626', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
  },
  btnGhost: {
    padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    background: 'transparent', color: 'var(--color-texto-suave)', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
  },
  exito: {
    background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
    padding: '12px 16px', color: '#15803d', fontSize: '13px', fontWeight: '600', marginBottom: '16px',
  },
};

export default function MisReservas() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Estado del modal de confirmación
  const [modalReserva, setModalReserva] = useState(null); // reserva a cancelar
  const [cancelando, setCancelando] = useState(false);
  // Resultados por ID de reserva: { [id]: { result, message } }
  const [resultados, setResultados] = useState({});

  // Lista de espera
  const [pestana, setPestana] = useState('reservas');
  const [listaEspera, setListaEspera] = useState([]);
  const [cargandoEspera, setCargandoEspera] = useState(false);
  const [errorEspera, setErrorEspera] = useState('');
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [mensajeExitoBaja, setMensajeExitoBaja] = useState('');

  useEffect(() => {
    cargar();
  }, []);

  function cargar() {
    setCargando(true);
    setError('');
    getMyReservations()
      .then(setReservas)
      .catch(() => setError('No se pudieron cargar tus reservas.'))
      .finally(() => setCargando(false));
  }

  function formatearHorario(r) {
    if (r.activity_type === 'fixed') return r.schedule || '—';
    // Para individual: mostrar fecha (Lunes XX/XX/XXXX) y turno en líneas separadas
    const partes = [];
    if (r.specific_date) {
      const fecha = new Date(`${r.specific_date}T00:00:00`);
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dia = dias[fecha.getDay()];
      const dia_num = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const anio = fecha.getFullYear();
      partes.push(`${dia} ${dia_num}/${mes}/${anio}`);
    }
    if (r.time_slot) partes.push(r.time_slot);
    return partes.join(' · ') || '—';
  }

  // Una reserva se puede cancelar si no está cancelada y la clase no comenzó aún
  function puedeCancel(r) {
    if (r.status === 'cancelled' || r.status === 'completed') return false;
    const inicio = new Date(r.reservation_date);
    return inicio > new Date();
  }

  function abrirModal(r) {
    setModalReserva(r);
  }

  function cerrarModal() {
    if (cancelando) return;
    setModalReserva(null);
  }

  useEffect(() => {
    if (pestana === 'espera') cargarEspera();
  }, [pestana]); 

  function cargarEspera() {
    setCargandoEspera(true);
    setErrorEspera('');
    getMyWaitlist()
      .then(setListaEspera)
      .catch(() => setErrorEspera('No se pudo cargar la lista de espera.'))
      .finally(() => setCargandoEspera(false));
  }

  async function confirmarBaja(id, nombre) {
    try {
      await removeWaitlistItem(id);
      setListaEspera((prev) => prev.filter((item) => item.id !== id));
      setConfirmandoId(null);
      setMensajeExitoBaja(`Baja registrada de "${nombre}". Correo de confirmación enviado a tu casilla. (simulado — Sprint 2)`);
      setTimeout(() => setMensajeExitoBaja(''), 8000);
    } catch (err) {
      setErrorEspera(err?.message || 'No se pudo procesar la baja.');
    }
  }

  async function confirmarCancelacion() {
    if (!modalReserva) return;
    setCancelando(true);
    try {
      const data = await cancelReservation(modalReserva.id);
      // Marcar reserva como cancelada en estado local
      setReservas((prev) =>
        prev.map((r) => r.id === modalReserva.id ? { ...r, status: 'cancelled' } : r)
      );
      setResultados((prev) => ({ ...prev, [modalReserva.id]: data }));
      setModalReserva(null);
    } catch (e) {
      const msg = e?.message || 'No se pudo cancelar la reserva.';
      setResultados((prev) => ({ ...prev, [modalReserva.id]: { result: 'error', message: msg } }));
      setModalReserva(null);
    } finally {
      setCancelando(false);
    }
  }

  return (
    <LayoutPrivado>
      <div style={s.cabecera}>
        <h1 style={s.titulo}>Mis Reservas</h1>
        {pestana === 'reservas' && (
          <button style={s.botonInscribir} onClick={() => navigate('/cliente/reservas/inscribir')}>
            + Inscribirse a una actividad
          </button>
        )}
      </div>

      <div style={s.tabs}>
        <button style={s.tab(pestana === 'reservas')} onClick={() => setPestana('reservas')}>Mis Reservas</button>
        <button style={s.tab(pestana === 'espera')} onClick={() => setPestana('espera')}>Lista de Espera</button>
      </div>

      {pestana === 'reservas' && <>
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
          const resultado = resultados[r.id];
          const estiloResultado = resultado ? (RESULTADO_ESTILO[resultado.result] || RESULTADO_ESTILO.no_benefit) : null;
          const cancelable = puedeCancel(r);
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
                  Pago: {r.payment_status === 'partial' && r.deposit_percent
                    ? `Seña (${r.deposit_percent}%)`
                    : (PAGO_LABEL[r.payment_status] || r.payment_status)}
                </span>
                {r.status !== 'cancelled' && r.status !== 'completed' && (
                  <button
                    style={s.botonCancelar(!cancelable)}
                    disabled={!cancelable}
                    title={!cancelable ? 'La clase ya comenzó o finalizó' : 'Cancelar turno'}
                    onClick={() => cancelable && abrirModal(r)}
                  >
                    Cancelar turno
                  </button>
                )}
              </div>
              {resultado && estiloResultado && (
                <div style={s.resultadoBanner(estiloResultado)}>{resultado.message}</div>
              )}
            </div>
          );
        })
      )}
      </>}

      {/* ── Lista de Espera ── */}
      {pestana === 'espera' && <>
        {mensajeExitoBaja && <div style={s.exito}>{mensajeExitoBaja}</div>}
        {errorEspera && <div style={s.alerta('error')}>{errorEspera}</div>}
        {cargandoEspera ? (
          <div style={s.vacio}>Cargando lista de espera...</div>
        ) : listaEspera.length === 0 ? (
          <div style={s.vacio}>
            <div style={s.vacioIcono}>⏳</div>
            <div style={s.vacioTexto}>No estás en ninguna lista de espera</div>
            <div>Cuando no haya cupos en una actividad y te inscribas, aparecerá aquí.</div>
          </div>
        ) : (
          listaEspera.map((item) => {
            const confirmando = confirmandoId === item.id;
            return (
              <div key={item.id} style={s.tarjeta}>
                <div style={s.tarjetaFila}>
                  <div>
                    <div style={s.actividadNombre}>{item.activity_name ?? `Actividad #${item.activity_id}`}</div>
                    {item.activity_schedule && (
                      <div style={s.detalle}>{item.activity_schedule}</div>
                    )}
                  </div>
                </div>
                <div style={s.badges}>
                  <span style={s.wBadge(item.waitlist_type)}>
                    {item.waitlist_type === 'priority' ? 'Cola Prioritaria (Abonado)' : 'Cola General'}
                  </span>
                  <span style={s.badge('#6b7280', '#f3f4f6')}>Posición N° {item.position}</span>
                  {!confirmando && (
                    <button style={s.botonCancelar(false)} onClick={() => setConfirmandoId(item.id)}>
                      Salir de la lista
                    </button>
                  )}
                </div>
                {confirmando && (
                  <div style={s.wInfoBox}>
                    <p style={{ margin: '0 0 10px 0' }}>
                      ¿Salir de la lista de espera de <strong>{item.activity_name}</strong>?
                      Perderás tu lugar N° {item.position}.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={s.btnDanger} onClick={() => confirmarBaja(item.id, item.activity_name)}>
                        Confirmar
                      </button>
                      <button style={s.btnGhost} onClick={() => setConfirmandoId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </>}

      {/* Modal de confirmación de reserva */}
      {modalReserva && (
        <div style={s.overlay} onClick={cerrarModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitulo}>¿Cancelar turno?</div>
            <div style={s.modalTexto}>
              Vas a cancelar tu reserva en <strong>{modalReserva.activity_name}</strong>.
              Según las políticas del centro, puede aplicar o no una devolución dependiendo
              de cuánto tiempo falta para la clase y tu condición de abonado.
            </div>
            <div style={s.modalBotones}>
              <button style={s.botonCerrar} onClick={cerrarModal} disabled={cancelando}>
                Volver
              </button>
              <button style={s.botonConfirmar} onClick={confirmarCancelacion} disabled={cancelando}>
                {cancelando ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutPrivado>
  );
}

