// Responsable: Francis
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { reserveFixed, reserveIndividual, getMyReservations, getInscriptionOptions } from '../../../services/reservationsService';
import { addToWaitlist, getMyWaitlist } from '../../../services/waitlistService';
import { getActivities, getActivityAvailability } from '../../../services/activitiesService';
import { getMyPlan } from '../../../services/paymentsService';
import { getCurrentUser } from '../../../services/usersService';
import { abrirVentanaPago } from '../../../services/mercadoPagoPopup';
import OverlayEsperandoPago from '../../../components/OverlayEsperandoPago';

const PASOS = ['Actividad', 'Metodo de pago', 'Resultado'];

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
  metodoBtnDeshabilitado: {
    padding: '14px 18px',
    borderRadius: '10px',
    cursor: 'not-allowed',
    textAlign: 'left',
    border: '1px solid var(--color-borde)',
    background: 'var(--color-fondo)',
    fontWeight: '400',
    fontSize: '14px',
    color: 'var(--color-texto-suave)',
    opacity: 0.55,
  },
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
  actCard: (sel) => ({
    padding: '14px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    border: sel ? '2px solid var(--color-primario)' : '1px solid var(--color-borde)',
    background: sel ? '#f0f4ff' : 'var(--color-fondo-card)',
    transition: 'border-color 0.12s, background 0.12s',
  }),
  actCardNombre: { fontSize: '15px', fontWeight: '700', color: 'var(--color-texto)', marginBottom: '2px' },
  actCardMeta: { fontSize: '12px', color: 'var(--color-texto-suave)', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '4px' },
  actCardPrecio: { fontSize: '14px', fontWeight: '700', color: 'var(--color-primario)' },
  resumenBox: { background: 'var(--color-fondo)', borderRadius: '8px', padding: '14px', marginBottom: '16px', fontSize: '14px', lineHeight: '1.8' },
  divider: { borderTop: '1px solid var(--color-borde)', margin: '18px 0' },
};

function formatPrecio(n) {
  return '$' + Number(n || 0).toLocaleString('es-AR');
}

function normalizarActividad(a) {
  return {
    id: Number(a.id),
    name: a.name || a.nombre || `Actividad ${a.id}`,
    specialization: a.specialization || null,
    professor: a.professor || null,
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

  // Actividad con fecha específica (individual o fija nueva): un solo turno
  // Busca ambos: specificDate (camelCase) y specific_date (snake_case del backend)
  const fechaEspecifica = actividad.specificDate || actividad.specific_date;
  const tiempoEspecifico = actividad.timeSlot || actividad.time_slot;
  
  if (fechaEspecifica) {
    const hora = tiempoEspecifico || '10:00';
    const [h, m] = hora.split(':').map(Number);
    const d = new Date(fechaEspecifica + 'T00:00:00');
    d.setHours(h, m, 0, 0);
    return [{
      value: d.toISOString(),
      label: d.toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    }];
  }

  // Fija legacy: generar turnos por schedule
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
  const [esAbonado, setEsAbonado] = useState(false);
  const [credits, setCredits] = useState(0);
  const [creditsCap, setCreditsCap] = useState(3);
  const [depositPercent, setDepositPercent] = useState(50);
  const [metodo, setMetodo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [cuposDisponibles, setCuposDisponibles] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [inscriptionOptions, setInscriptionOptions] = useState(null);
  const [esperandoPago, setEsperandoPago] = useState(false);
  const [aptoAprobado, setAptoAprobado] = useState(null); // null = cargando, true/false = resuelto
  const pagoHandleRef = useRef(null);

  // Verificar el estado del apto físico: sin apto aprobado el cliente no puede
  // inscribirse a ninguna actividad (regla validada también en el backend).
  useEffect(() => {
    getCurrentUser()
      .then((data) => setAptoAprobado(data?.medical_certificate_status === 'approved'))
      .catch(() => setAptoAprobado(false));
  }, []);

  // Detectar si el cliente es abonado desde el backend
  useEffect(() => {
    getMyPlan()
      .then((data) => {
        setEsAbonado(data?.es_abonado === true);
        setCredits(data?.credits ?? 0);
        setCreditsCap(data?.credits_cap ?? 3);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const idFromState = location.state?.actividadId;
    Promise.all([
      getActivities(),
      getMyReservations().catch(() => []),
      getMyWaitlist().catch(() => []),
    ])
      .then(([data, reservations, waitlist]) => {
        const lista = Array.isArray(data) ? data : (data.activities || []);
        const normalizadas = lista.map(normalizarActividad);

        // Excluir actividades en las que el usuario ya tiene una reserva activa
        // o ya está anotado en la lista de espera
        const idsInscritos = new Set(
          (Array.isArray(reservations) ? reservations : [])
            .filter((r) => r.status !== 'cancelled')
            .map((r) => r.activity_id)
        );
        (Array.isArray(waitlist) ? waitlist : [])
          .filter((w) => w.status !== 'cancelled')
          .forEach((w) => idsInscritos.add(w.activity_id));
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

  // Obtener opciones de inscripción (descuentos por edad, disponibilidad de suscripción, etc.)
  useEffect(() => {
    if (!actividadId) return;
    getInscriptionOptions(Number(actividadId))
      .then((data) => setInscriptionOptions(data))
      .catch(() => setInscriptionOptions(null));
  }, [actividadId]);

  // Obtener cupos reales del backend cuando cambia la actividad o el turno seleccionado.
  // Para actividades fijas se pasa la fecha del turno para obtener cupos de ESA clase específica.
  useEffect(() => {
    if (!actividadId) return;
    const act = actividades.find((a) => a.id === Number(actividadId));
    const dateParam = act?.reservationType === 'fixed' && fecha ? fecha : null;
    setCuposDisponibles(null);
    getActivityAvailability(Number(actividadId), dateParam)
      .then((data) => setCuposDisponibles(data.available_spots ?? 0))
      .catch(() => setCuposDisponibles(null));
  }, [actividadId, fecha]); // eslint-disable-line

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
  const actividadesFiltradas = useMemo(() => {
    const q = normStr(filtro.trim());
    if (!q) return actividades;
    return actividades.filter((a) =>
      normStr(a.name).includes(q) ||
      normStr(a.specialization || '').includes(q) ||
      normStr(a.professor || '').includes(q)
    );
  }, [actividades, filtro]);
  const hayCupos = cuposDisponibles !== null ? cuposDisponibles > 0 : (actividad ? actividad.capacity > 0 : false);
  const cuposMostrar = cuposDisponibles ?? actividad?.capacity ?? 0;
  const precioBase = actividad?.price || 0;
  const descuento = inscriptionOptions?.has_age_discount && tipoReserva === 'fixed' ? precioBase * 0.2 : 0;
  const precioFinal = precioBase - descuento;
  const sena = Math.round(precioFinal * depositPercent / 100);
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
    else if (inscriptionOptions?.can_use_subscription) setMetodo('subscription');
    else if (credits > 0) setMetodo('credit');
    else setMetodo('full_payment');
    setPaso(1);
  };

  const handleWaitlist = async () => {
    setCargando(true);
    setError('');

    try {
      await addToWaitlist(actividad.id);
      // Quitar la actividad del listado: el usuario ya está anotado en la lista de espera
      setActividades((prev) => prev.filter((a) => a.id !== actividad.id));
      setResultado({
        tipo: 'lista_espera',
        mensaje: 'Te notificaremos cuando haya un cupo disponible.',
      });
      setPaso(2);
    } catch (err) {
      setError(err.message || 'No se pudo agregar a la lista de espera.');
    } finally {
      setCargando(false);
    }
  };

  const handleReservar = async (paymentMethod, testScenario = 'success') => {
    setCargando(true);
    setError('');

    try {
      const payload = {
        activity_id: actividad.id,
        reservation_type: tipoReserva,
        reservation_date: new Date(fecha).toISOString(),
        payment_method: paymentMethod,
        test_scenario: testScenario,
        ...(paymentMethod === 'partial_payment' ? { deposit_percent: depositPercent } : {}),
      };

      const fn = tipoReserva === 'fixed' ? reserveFixed : reserveIndividual;
      await fn(payload);

      // Quitar la actividad del listado: el usuario ya tiene una reserva activa
      setActividades((prev) => prev.filter((a) => a.id !== actividad.id));

      if (paymentMethod === 'partial_payment') {
        setResultado({
          tipo: 'pendiente',
          mensaje: `Monto abonado: ${formatPrecio(sena)}. Monto restante: ${formatPrecio(precioFinal - sena)}.`,
        });
      } else {
        setResultado({ tipo: 'confirmada', mensaje: 'Inscripcion confirmada. Tu lugar esta reservado.' });
      }
      setPaso(2);
    } catch (err) {
      const esPago = paymentMethod === 'full_payment' || paymentMethod === 'partial_payment';
      const mensaje = esPago
        ? 'Hubo un error en el pago. Intenta nuevamente.'
        : (err.message || 'Hubo un error al procesar tu inscripcion.');
      setResultado({ tipo: 'error', mensaje });
      setPaso(2);
    } finally {
      setCargando(false);
    }
  };

  const handleAbrirPago = () => {
    setError('');
    setEsperandoPago(true);
    pagoHandleRef.current = abrirVentanaPago(
      { monto: montoAPagar, descripcion: actividad?.name },
      {
        onResultado: (scenario) => {
          setEsperandoPago(false);
          handleReservar(metodo, scenario);
        },
        onCancelado: (motivo) => {
          setEsperandoPago(false);
          if (motivo === 'popup_bloqueado') {
            setError('No se pudo abrir la ventana de pago. Verifica que tu navegador no bloquee ventanas emergentes.');
          }
        },
      }
    );
  };

  const handleCancelarPago = () => {
    pagoHandleRef.current?.cancelar();
    setEsperandoPago(false);
  };

  const handleConfirmarMetodo = () => {
    if (!metodo) {
      setError('Selecciona un metodo.');
      return;
    }

    setError('');
    if (metodo === 'waitlist') handleWaitlist();
    else if (metodo === 'subscription' || metodo === 'credit') handleReservar(metodo);
    else handleAbrirPago();
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

          {paso === 0 && aptoAprobado === false && (
            <>
              <p style={s.titulo}>Apto físico requerido</p>
              <div style={s.infoBox('yellow')}>
                No podés inscribirte a ninguna actividad hasta que tu apto físico esté aprobado.
                Subilo desde tu perfil y esperá la aprobación del administrador.
              </div>
              <div style={s.botones}>
                <button style={s.btnPrimario} onClick={() => navigate('/perfil')}>Ir a mi perfil</button>
                <button style={s.btnSecundario} onClick={handleCancelar}>Volver al inicio</button>
              </div>
            </>
          )}

          {paso === 0 && aptoAprobado !== false && (
            <>
              <p style={s.titulo}>Selecciona una actividad</p>

              {cargandoActividades ? (
                <p style={{ color: 'var(--color-texto-suave)', fontSize: '14px' }}>Cargando actividades...</p>
              ) : actividades.length === 0 ? (
                <p style={{ color: 'var(--color-texto-suave)', fontSize: '14px' }}>
                  No hay actividades disponibles para inscribirse. Es posible que ya estés inscripto en todas las actividades activas.
                </p>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, especialidad o profesor..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    style={{ ...s.select, marginBottom: '12px' }}
                  />
                  {actividadesFiltradas.length === 0 && (
                    <p style={{ fontSize: '13px', color: 'var(--color-texto-suave)', margin: '0 0 12px' }}>
                      No se encontraron actividades para &ldquo;{filtro}&rdquo;.
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' }}>
                    {actividadesFiltradas.map((a) => {
                      const turnoLabel = a.specificDate
                        ? (() => {
                            const d = new Date(a.specificDate + 'T00:00:00');
                            const [h, m] = (a.timeSlot || '10:00').split(':').map(Number);
                            d.setHours(h, m, 0, 0);
                            return d.toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                          })()
                        : (a.schedule || 'Sin fecha definida');
                      const sel = String(a.id) === actividadId;
                      return (
                        <div
                          key={a.id}
                          style={s.actCard(sel)}
                          onClick={() => { setActividadId(String(a.id)); setMetodo(''); setFecha(''); }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={s.actCardNombre}>{a.name}</div>
                              <div style={s.actCardMeta}>
                                {a.specialization && <span>{a.specialization}</span>}
                                {a.professor && (
                                  <><span>·</span><span>{a.professor}</span></>
                                )}
                                <span>·</span>
                                <span>{turnoLabel}</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={s.actCardPrecio}>{formatPrecio(a.price)}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-texto-suave)', marginTop: '2px' }}>
                                {a.reservationType === 'fixed' ? 'Fija' : 'Individual'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                    <div style={{ fontSize: '13px', color: 'var(--color-texto)', marginBottom: '6px', opacity: !hayCupos ? 0.45 : 1 }}>
                      Créditos disponibles: 
                      <strong>{credits} / {creditsCap}</strong>
                      {!hayCupos && credits > 0 && <span style={{ fontSize: '11px', color: 'var(--color-texto-suave)', marginLeft: '4px' }}>(no aplica sin cupos)</span>}
                    </div>
                  )}
                  {inscriptionOptions?.has_age_discount && hayCupos && (
                    <div style={{ ...s.infoBox('green'), marginBottom: '8px' }}>Tenés descuento por ser mayor de 65 años (20% off)</div>
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
                  {inscriptionOptions?.has_age_discount && (
                    <div style={s.infoBox('green')}>Tienes descuento por mayor de 65 años</div>
                  )}
                  <div style={s.metodosGrid}>
                    <button style={s.metodoBtn(metodo === 'waitlist')} onClick={() => setMetodo('waitlist')}>
                      Esperar en la lista
                      <div style={s.metodoBtnSub}>{inscriptionOptions?.can_use_subscription ? 'Lista prioritaria (abonado)' : 'Lista general'}</div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {inscriptionOptions?.has_age_discount && (
                    <div style={s.infoBox('green')}>Tienes descuento por mayor de 65 años</div>
                  )}
                  <div style={s.metodosGrid}>
                    {inscriptionOptions?.can_use_subscription && (
                      <button style={s.metodoBtn(metodo === 'subscription')} onClick={() => setMetodo('subscription')}>
                        Confirmar por suscripcion activa
                        <div style={s.metodoBtnSub}>Sin costo adicional (especialidad: {inscriptionOptions?.plan_specialization})</div>
                      </button>
                    )}
                    {esAbonado && (
                      <button
                        style={credits > 0 ? s.metodoBtn(metodo === 'credit') : s.metodoBtnDeshabilitado}
                        onClick={() => credits > 0 && setMetodo('credit')}
                        disabled={credits <= 0}
                      >
                      Usar crédito
                      <div style={s.metodoBtnSub}>
                        {credits > 0 ? `Se descuenta 1 crédito (tenés ${credits})` : 'No tenés créditos disponibles'}
                      </div>
                    </button>
                  )}
                  <button style={s.metodoBtn(metodo === 'full_payment')} onClick={() => setMetodo('full_payment')}>
                    Abonar total - {formatPrecio(precioFinal)}
                    <div style={s.metodoBtnSub}>Reserva confirmada al instante</div>
                  </button>
                  <button style={s.metodoBtn(metodo === 'partial_payment')} onClick={() => setMetodo('partial_payment')}>
                    Abonar seña - {formatPrecio(sena)} ({depositPercent}%)
                    <div style={s.metodoBtnSub}>Elegí qué porcentaje abonar (mínimo 50%) — Reserva en estado pendiente hasta completar el pago</div>
                  </button>
                  {metodo === 'partial_payment' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 4px 0' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)' }}>Porcentaje a abonar:</label>
                      <select
                        value={depositPercent}
                        onChange={(e) => setDepositPercent(Number(e.target.value))}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-borde)', fontSize: '13px' }}
                      >
                        {[50, 60, 70, 80, 90, 100].map((p) => (
                          <option key={p} value={p}>{p}%</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                </>
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

          {paso === 2 && resultado && (
            <>
              {resultado.tipo === 'confirmada' && (
                <>
                  <div style={s.exito}> {resultado.mensaje}</div>
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

      <OverlayEsperandoPago visible={esperandoPago} onCancelar={handleCancelarPago} />
    </LayoutPrivado>
  );
}

export default InscribirActividad;

