// Responsable: Francis
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { reserveFixed, reserveIndividual, getMyReservations } from '../../../services/reservationsService';
import { addToWaitlist } from '../../../services/waitlistService';
import { getActivities, getActivityAvailability } from '../../../services/activitiesService';
import { getMyPlan } from '../../../services/paymentsService';

const PASOS = ['Actividad', 'Metodo de pago', 'Confirmacion', 'Resultado'];

const s = {
  wrapper: { maxWidth: '640px' },
  stepper: { display: 'flex', alignItems: 'center', gap: '0', marginBottom: '32px' },
  stepItem: (activo, hecho) => ({
    flex: 1,
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: activo ? '700' : '500',
    color: activo ? 'var(--color-primario)' : hecho ? 'var(--color-texto-suave)' : '#bbb',
    paddingBottom: '8px',
    borderBottom: activo ? '2px solid var(--color-primario)' : hecho ? '2px solid var(--color-texto-suave)' : '2px solid #e5e7eb',
  }),
  card: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '28px', boxShadow: 'var(--sombra)' },
  titulo: { fontSize: '16px', fontWeight: '700', color: 'var(--color-texto)', margin: '0 0 20px 0' },
  campo: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)' },
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--color-borde)',
    fontSize: '14px',
    background: 'var(--color-fondo)',
    color: 'var(--color-texto)',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  checkRow: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--color-texto)', marginBottom: '8px' },
  infoBox: (color) => ({
    background: color === 'blue' ? '#eff6ff' : color === 'yellow' ? '#fefce8' : '#f0fdf4',
    border: `1px solid ${color === 'blue' ? '#bfdbfe' : color === 'yellow' ? '#fde047' : '#86efac'}`,
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '16px',
    color: color === 'blue' ? '#1d4ed8' : color === 'yellow' ? '#854d0e' : '#15803d',
  }),
  metodosGrid: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  metodoBtn: (sel) => ({
    padding: '14px 18px',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    border: sel ? '2px solid var(--color-primario)' : '1px solid var(--color-borde)',
    background: sel ? '#f0f4ff' : 'var(--color-fondo-card)',
    fontWeight: sel ? '700' : '500',
    fontSize: '14px',
    color: 'var(--color-texto)',
  }),
  metodoBtnSub: { fontSize: '12px', color: 'var(--color-texto-suave)', marginTop: '3px' },
  botones: { display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' },
  btnPrimario: {
    padding: '10px 28px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    color: '#fff',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
  },
  btnSecundario: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid var(--color-borde)',
    background: 'transparent',
    color: 'var(--color-texto-suave)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  btnDisabled: {
    padding: '10px 28px',
    borderRadius: '8px',
    border: 'none',
    background: '#ccc',
    color: '#fff',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'not-allowed',
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#dc2626',
    fontSize: '13px',
    marginBottom: '16px',
  },
  exito: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px',
    padding: '14px 18px',
    color: '#15803d',
    fontSize: '15px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '12px',
  },
  resumenBox: { background: 'var(--color-fondo)', borderRadius: '8px', padding: '14px', marginBottom: '16px', fontSize: '14px', lineHeight: '1.8' },
  divider: { borderTop: '1px solid var(--color-borde)', margin: '18px 0' },
  mpBox: { textAlign: 'center', padding: '20px 0' },
  mpTitulo: { fontSize: '18px', fontWeight: '700', color: '#009EE3', marginBottom: '6px' },
  mpSub: { fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '20px' },
};

function formatPrecio(n) {
  return '$' + Number(n || 0).toLocaleString('es-AR');
}

function normalizarActividad(a) {
  return {
    id: Number(a.id),
    name: a.name || a.nombre || `Actividad ${a.id}`,
    price: Number(a.price ?? a.precio ?? 0),
    capacity: Number(a.capacity ?? a.cupos ?? 1),
    reservationType: (a.activity_type || a.reservation_type || a.tipo || 'fixed') === 'individual' ? 'individual' : 'fixed',
    schedule: a.schedule || null,
    specificDate: a.specific_date || null,
    timeSlot: a.time_slot || null,
  };
}

function normStr(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const DIA_NUMS = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 };

function turnosDeActividad(actividad) {
  if (!actividad) return [];

  if (actividad.reservationType === 'individual') {
    if (!actividad.specificDate) return [];
    const hora = actividad.timeSlot || '10:00';
    const [h, m] = hora.split(':').map(Number);
    const d = new Date(actividad.specificDate + 'T00:00:00');
    d.setHours(h, m, 0, 0);
    return [{
      value: d.toISOString(),
      label: d.toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    }];
  }

  // Actividad fija: detectar días por nombre (igual que el backend)
  if (!actividad.schedule) return [];
  const schedNorm = normStr(actividad.schedule);
  const diasNums = Object.entries(DIA_NUMS)
    .filter(([dia]) => schedNorm.includes(dia))
    .map(([, num]) => num);
  if (diasNums.length === 0) return [];

  const timeMatch = actividad.schedule.match(/(\d{1,2}):(\d{2})/);
  const h = timeMatch ? Number(timeMatch[1]) : 10;
  const m = timeMatch ? Number(timeMatch[2]) : 0;

  const turnos = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);
  const limite = new Date(cursor);
  limite.setDate(cursor.getDate() + 56); // 8 semanas

  while (turnos.length < 8 && cursor <= limite) {
    if (diasNums.includes(cursor.getDay())) {
      const slot = new Date(cursor);
      slot.setHours(h, m, 0, 0);
      turnos.push({
        value: slot.toISOString(),
        label: slot.toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return turnos;
}

function InscribirActividad() {
  const navigate = useNavigate();
  const location = useLocation();
  const [paso, setPaso] = useState(0);
  const [actividades, setActividades] = useState([]);
  const [cargandoActividades, setCargandoActividades] = useState(true);
  const [actividadId, setActividadId] = useState('');
  const [fecha, setFecha] = useState('');
  const [esMayor65, setEsMayor65] = useState(false);
  const [esAbonado, setEsAbonado] = useState(false);
  const [tieneCredito, setTieneCredito] = useState(false);
  const [metodo, setMetodo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [cuposDisponibles, setCuposDisponibles] = useState(null);

  // Detectar si el cliente es abonado desde el backend
  useEffect(() => {
    getMyPlan()
      .then((data) => setEsAbonado(data?.es_abonado === true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const idFromState = location.state?.actividadId;
    Promise.all([
      getActivities(),
      getMyReservations().catch(() => []),
    ])
      .then(([data, reservations]) => {
        const lista = Array.isArray(data) ? data : (data.activities || []);
        const normalizadas = lista.map(normalizarActividad);

        // Excluir actividades en las que el usuario ya tiene una reserva activa
        const idsInscritos = new Set(
          (Array.isArray(reservations) ? reservations : [])
            .filter((r) => r.status !== 'cancelled')
            .map((r) => r.activity_id)
        );
        const disponibles = normalizadas.filter((a) => !idsInscritos.has(a.id));

        setActividades(disponibles);
        if (idFromState && !idsInscritos.has(Number(idFromState))) {
          setActividadId(String(idFromState));
        } else if (disponibles.length > 0) {
          setActividadId(String(disponibles[0].id));
        }
      })
      .catch(() => {
        setActividades([]);
      })
      .finally(() => setCargandoActividades(false));
  }, []); // eslint-disable-line

  // Obtener cupos reales del backend cuando cambia la actividad seleccionada
  useEffect(() => {
    if (!actividadId) return;
    setCuposDisponibles(null);
    getActivityAvailability(Number(actividadId))
      .then((data) => setCuposDisponibles(data.available_spots ?? 0))
      .catch(() => setCuposDisponibles(null));
  }, [actividadId]);

  const actividad = actividades.find((a) => a.id === Number(actividadId));
  const turnos = useMemo(() => turnosDeActividad(actividad), [actividad]);

  // Cuando la actividad cambia, seleccionar el primer slot disponible
  useEffect(() => {
    if (turnos.length > 0) {
      setFecha(turnos[0].value);
    } else {
      setFecha('');
    }
  }, [turnos]);

  const tipoReserva = actividad?.reservationType || 'fixed';
  const hayCupos = cuposDisponibles !== null ? cuposDisponibles > 0 : (actividad ? actividad.capacity > 0 : false);
  const cuposMostrar = cuposDisponibles ?? actividad?.capacity ?? 0;
  const precioBase = actividad?.price || 0;
  const descuento = esMayor65 && tipoReserva === 'fixed' ? precioBase * 0.2 : 0;
  const precioFinal = precioBase - descuento;
  const sena = Math.round(precioFinal * 0.5);
  const montoAPagar = metodo === 'partial_payment' ? sena : precioFinal;

  const handleCancelar = () => navigate('/');

  const handleSiguiente = () => {
    if (!actividad) {
      setError('Selecciona una actividad.');
      return;
    }
    if (!fecha) {
      setError('Selecciona una fecha y hora.');
      return;
    }

    setError('');
    if (!hayCupos) setMetodo('waitlist');
    else if (esAbonado && tipoReserva === 'fixed') setMetodo('subscription');
    else if (tieneCredito) setMetodo('credit');
    else setMetodo('full_payment');
    setPaso(1);
  };

  const handleWaitlist = async () => {
    setCargando(true);
    setError('');

    try {
      await addToWaitlist(actividad.id);
      setResultado({
        tipo: 'lista_espera',
        mensaje: 'Fuiste agregado a la lista de espera. Te notificaremos cuando haya un cupo disponible.',
      });
      setPaso(3);
    } catch (err) {
      setError(err.message || 'No se pudo agregar a la lista de espera.');
    } finally {
      setCargando(false);
    }
  };

  const handleReservar = async (paymentMethod) => {
    setCargando(true);
    setError('');

    try {
      const payload = {
        activity_id: actividad.id,
        reservation_type: tipoReserva,
        reservation_date: new Date(fecha).toISOString(),
        payment_method: paymentMethod,
      };

      const fn = tipoReserva === 'fixed' ? reserveFixed : reserveIndividual;
      await fn(payload);

      if (paymentMethod === 'partial_payment') {
        setResultado({
          tipo: 'pendiente',
          mensaje: `Tu reserva quedo en estado pendiente. Monto abonado: ${formatPrecio(sena)}. Monto restante: ${formatPrecio(precioFinal - sena)}.`,
        });
      } else {
        setResultado({ tipo: 'confirmada', mensaje: 'Inscripcion confirmada. Tu lugar esta reservado.' });
      }
      setPaso(3);
    } catch (err) {
      setResultado({ tipo: 'error', mensaje: err.message || 'Hubo un error al procesar tu inscripcion.' });
      setPaso(3);
    } finally {
      setCargando(false);
    }
  };

  const handleConfirmarMetodo = () => {
    if (!metodo) {
      setError('Selecciona un metodo.');
      return;
    }

    setError('');
    if (metodo === 'waitlist') handleWaitlist();
    else if (metodo === 'subscription' || metodo === 'credit') handleReservar(metodo);
    else setPaso(2);
  };

  const handlePagoSimulado = async (simPayment) => {
    if (!simPayment) {
      setResultado({ tipo: 'error', mensaje: 'Error en el pago. No se pudo completar la inscripcion.' });
      setPaso(3);
      return;
    }
    await handleReservar(metodo);
  };

  return (
    <LayoutPrivado titulo="Inscribirse a Actividad">
      <div style={s.wrapper}>
        <div style={s.stepper}>
          {PASOS.map((p, i) => (
            <div key={p} style={s.stepItem(i === paso, i < paso)}>{p}</div>
          ))}
        </div>

        <div style={s.card}>
          {error && <div style={s.error}>{error}</div>}

          {paso === 0 && (
            <>
              <p style={s.titulo}>Selecciona la actividad y el turno</p>

              {cargandoActividades ? (
                <p style={{ color: 'var(--color-texto-suave)', fontSize: '14px' }}>Cargando actividades...</p>
              ) : actividades.length === 0 ? (
                <p style={{ color: 'var(--color-texto-suave)', fontSize: '14px' }}>
                  No hay actividades disponibles para inscribirse. Es posible que ya estés inscripto en todas las actividades activas.
                </p>
              ) : (
                <>
                  <div style={s.campo}>
                    <label style={s.label}>Actividad</label>
                    <select style={s.select} value={actividadId} onChange={(e) => { setActividadId(e.target.value); setMetodo(''); setFecha(''); }}>
                      {actividades.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} - {a.reservationType === 'fixed' ? 'Fija' : 'Individual'} - {formatPrecio(a.price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={s.campo}>
                    <label style={s.label}>Turno disponible</label>
                    {turnos.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--color-texto-suave)', margin: '4px 0' }}>
                        No hay turnos disponibles para esta actividad.
                      </p>
                    ) : (
                      <select style={s.select} value={fecha} onChange={(e) => setFecha(e.target.value)}>
                        {turnos.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div style={s.divider} />
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    Tu situacion
                  </p>

                  {esAbonado ? (
                    <div style={{ ...s.infoBox('green'), marginBottom: '8px' }}>Suscripción activa detectada — accedés a beneficios de abonado</div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '8px' }}>Sin suscripción activa</div>
                  )}
                  {esAbonado && (
                    <label style={s.checkRow}>
                      <input type="checkbox" checked={tieneCredito} onChange={(e) => setTieneCredito(e.target.checked)} />
                      Tengo crédito disponible
                    </label>
                  )}
                  {tipoReserva === 'fixed' && (
                    <label style={s.checkRow}>
                      <input type="checkbox" checked={esMayor65} onChange={(e) => setEsMayor65(e.target.checked)} />
                      Soy mayor de 65 anos (descuento 20%)
                    </label>
                  )}

                    {actividad && (
                    <div style={s.infoBox(!hayCupos ? 'yellow' : 'blue')}>
                      {hayCupos
                        ? `Cupos disponibles: ${cuposMostrar} — Precio: ${formatPrecio(precioFinal)}${descuento > 0 ? ` (descuento aplicado: ${formatPrecio(descuento)})` : ''}`
                        : 'No hay cupos disponibles. Podés anotarte en la lista de espera.'}
                    </div>
                  )}

                  <div style={s.botones}>
                    <button style={s.btnPrimario} onClick={handleSiguiente}>Siguiente</button>
                    <button style={s.btnSecundario} onClick={handleCancelar}>Cancelar</button>
                  </div>
                </>
              )}
            </>
          )}

          {paso === 1 && actividad && (
            <>
              <p style={s.titulo}>Selecciona como queres inscribirte</p>
              <div style={s.resumenBox}>
                <strong>{actividad.name}</strong><br />
                Tipo: {tipoReserva === 'fixed' ? 'Actividad fija' : 'Actividad individual'} | Precio: {formatPrecio(precioFinal)}
                {descuento > 0 && ' (con 20% de descuento)'}
                <br />
                Turno: {new Date(fecha).toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>

              {!hayCupos ? (
                <>
                  <div style={s.infoBox('yellow')}>Sin cupos disponibles. Solo podes anotarte en la lista de espera.</div>
                  <div style={s.metodosGrid}>
                    <button style={s.metodoBtn(metodo === 'waitlist')} onClick={() => setMetodo('waitlist')}>
                      Esperar en la lista
                      <div style={s.metodoBtnSub}>{esAbonado && tipoReserva === 'fixed' ? 'Lista prioritaria (abonado)' : 'Lista general'}</div>
                    </button>
                  </div>
                </>
              ) : (
                <div style={s.metodosGrid}>
                  {esAbonado && tipoReserva === 'fixed' && (
                    <button style={s.metodoBtn(metodo === 'subscription')} onClick={() => setMetodo('subscription')}>
                      Confirmar por suscripcion activa
                      <div style={s.metodoBtnSub}>Sin costo adicional</div>
                    </button>
                  )}
                  {tieneCredito && (
                    <button style={s.metodoBtn(metodo === 'credit')} onClick={() => setMetodo('credit')}>
                      Usar credito
                      <div style={s.metodoBtnSub}>Se descuenta un credito disponible</div>
                    </button>
                  )}
                  <button style={s.metodoBtn(metodo === 'full_payment')} onClick={() => setMetodo('full_payment')}>
                    Abonar total - {formatPrecio(precioFinal)}
                    <div style={s.metodoBtnSub}>Reserva confirmada al instante</div>
                  </button>
                  <button style={s.metodoBtn(metodo === 'partial_payment')} onClick={() => setMetodo('partial_payment')}>
                    Abonar sena (50%) - {formatPrecio(sena)}
                    <div style={s.metodoBtnSub}>Reserva en estado pendiente hasta completar el pago</div>
                  </button>
                </div>
              )}

              <div style={s.botones}>
                <button style={cargando ? s.btnDisabled : s.btnPrimario} onClick={handleConfirmarMetodo} disabled={cargando}>
                  {cargando ? 'Procesando...' : 'Confirmar'}
                </button>
                <button style={s.btnSecundario} onClick={() => { setPaso(0); setError(''); }}>Volver</button>
                <button style={s.btnSecundario} onClick={handleCancelar}>Cancelar</button>
              </div>
            </>
          )}

          {paso === 2 && actividad && (
            <>
              <div style={s.mpBox}>
                <div style={s.mpTitulo}>Mercado Pago</div>
                <div style={s.mpSub}>Estas a punto de realizar un pago seguro</div>
              </div>
              <div style={s.resumenBox}>
                <strong>Detalle del pago</strong><br />
                Actividad: {actividad.name}<br />
                Monto a pagar: <strong>{formatPrecio(montoAPagar)}</strong>
                {metodo === 'partial_payment' && <><br /><span style={{ color: 'var(--color-texto-suave)', fontSize: '12px' }}>Sena del 50% - monto restante: {formatPrecio(precioFinal - sena)}</span></>}
              </div>

              <div style={s.botones}>
                <button style={cargando ? s.btnDisabled : s.btnPrimario} onClick={() => handlePagoSimulado(true)} disabled={cargando}>
                  {cargando ? 'Procesando...' : 'Confirmar pago'}
                </button>
                <button style={s.btnSecundario} onClick={() => handlePagoSimulado(false)} disabled={cargando}>Simular error</button>
                <button style={s.btnSecundario} onClick={handleCancelar}>Cancelar</button>
              </div>
            </>
          )}

          {paso === 3 && resultado && (
            <>
              {resultado.tipo === 'confirmada' && (
                <>
                  <div style={s.exito}>OK - {resultado.mensaje}</div>
                  <div style={s.infoBox('green')}>Tu inscripcion quedo confirmada. Podes verla en Mis Reservas.</div>
                </>
              )}
              {resultado.tipo === 'pendiente' && (
                <>
                  <div style={{ ...s.infoBox('yellow'), fontSize: '15px', fontWeight: '600' }}>Inscripcion en estado pendiente</div>
                  <p style={{ fontSize: '14px', color: 'var(--color-texto)', lineHeight: 1.6 }}>{resultado.mensaje}</p>
                </>
              )}
              {resultado.tipo === 'lista_espera' && (
                <div style={s.infoBox('blue')}>
                  <strong>Agregado a la lista de espera</strong><br />
                  {resultado.mensaje}
                </div>
              )}
              {resultado.tipo === 'error' && (
                <>
                  <div style={s.error}>{resultado.mensaje}</div>
                  <p style={{ fontSize: '13px', color: 'var(--color-texto-suave)', marginTop: 8 }}>La inscripcion fue cancelada. Podes intentarlo nuevamente.</p>
                </>
              )}

              <div style={s.botones}>
                <button style={s.btnPrimario} onClick={() => navigate('/cliente/reservas')}>Ver mis reservas</button>
                <button style={s.btnSecundario} onClick={() => { setPaso(0); setResultado(null); setError(''); }}>Nueva inscripcion</button>
                <button style={s.btnSecundario} onClick={() => navigate('/')}>Ir al inicio</button>
              </div>
            </>
          )}
        </div>
      </div>
    </LayoutPrivado>
  );
}

export default InscribirActividad;

