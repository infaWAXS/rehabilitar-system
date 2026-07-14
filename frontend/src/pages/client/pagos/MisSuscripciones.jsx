// Responsable: Ezequiel
// HU: Ver suscripciones + Pagar Mercado Pago
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getPlans, getMyPlan, getMyPlans, mercadoPagoCheckout } from '../../../services/paymentsService';
import { abrirVentanaPago } from '../../../services/mercadoPagoPopup';
import OverlayEsperandoPago from '../../../components/OverlayEsperandoPago';

const ESPECIALIZACIONES = [
  'Kinesiologia deportiva', 'Fisioterapia', 'Kinesiologia neurologica',
  'Rehabilitacion cardiovascular', 'Kinesiologia traumatologica', 'Pilates terapeutico',
  'Kinesiologia pediatrica', 'Osteopatia', 'Acupuntura', 'Masoterapia',
  'Kinesiologia respiratoria', 'Rehabilitacion post-quirurgica',
  'Kinesiologia gerontologica', 'Electroterapia',
];

const DURACION = (dias) => {
  if (dias === 30)  return '1 mes';
  if (dias === 90)  return '3 meses';
  if (dias === 180) return '6 meses';
  if (dias === 365) return '1 año';
  return `${dias} días`;
};

const ESTADO_LABEL = {
  active: { texto: 'Activa', color: '#15803d', fondo: '#dcfce7' },
  expired: { texto: 'Vencida', color: '#6b7280', fondo: '#f3f4f6' },
  cancelled: { texto: 'Cancelada', color: '#dc2626', fondo: '#fef2f2' },
};

const s = {
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', marginBottom: '8px' },
  subtitulo: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '24px' },
  seccionTitulo: { fontSize: '16px', fontWeight: '700', color: 'var(--color-texto)', margin: '28px 0 12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '16px' },
  card: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '20px', boxShadow: 'var(--sombra)',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  cardNombre: { fontSize: '16px', fontWeight: '700', color: 'var(--color-texto)' },
  cardDesc: { fontSize: '13px', color: 'var(--color-texto-suave)', flex: 1 },
  cardPrecio: { fontSize: '22px', fontWeight: '800', color: 'var(--color-primario)' },
  cardDetalle: { fontSize: '12px', color: 'var(--color-texto-suave)' },
  botonPagar: {
    marginTop: '8px', padding: '10px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)',
    color: '#fff', fontWeight: '600', fontSize: '14px',
    cursor: 'pointer', width: '100%',
  },
  listaPlanes: { display: 'flex', flexDirection: 'column', gap: '10px' },
  itemPlan: {
    background: 'var(--color-fondo-card)', borderRadius: '10px', padding: '14px 18px',
    boxShadow: 'var(--sombra)', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
  },
  itemPlanNombre: { fontSize: '14px', fontWeight: '700', color: 'var(--color-texto)' },
  itemPlanSub: { fontSize: '12px', color: 'var(--color-texto-suave)', marginTop: '3px' },
  badgeEstado: (estado) => ({
    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
    color: (ESTADO_LABEL[estado] || ESTADO_LABEL.expired).color,
    background: (ESTADO_LABEL[estado] || ESTADO_LABEL.expired).fondo,
    whiteSpace: 'nowrap',
  }),
  vacio: {
    textAlign: 'center', padding: '48px 24px', color: 'var(--color-texto-suave)',
    fontSize: '14px', background: 'var(--color-fondo-card)', borderRadius: '12px',
  },
  vacioChico: {
    padding: '20px 18px', color: 'var(--color-texto-suave)',
    fontSize: '13px', background: 'var(--color-fondo-card)', borderRadius: '12px',
  },
  botonVolver: { padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-texto)', marginBottom: '20px' },
  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '28px 32px',
    width: '100%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalTitulo: { fontSize: '18px', fontWeight: '700', marginBottom: '4px', color: 'var(--color-texto)' },
  modalSubtitulo: { fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '20px' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)', marginBottom: '6px', display: 'block' },
  select: {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '16px',
  },
  botonConfirmar: {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff',
    fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginBottom: '10px',
  },
  botonCancelar: {
    width: '100%', padding: '10px', borderRadius: '8px',
    border: '1px solid #d1d5db', background: '#fff',
    fontWeight: '600', fontSize: '14px', cursor: 'pointer', color: 'var(--color-texto)',
  },
  alerta: (tipo) => ({
    padding: '12px 14px', borderRadius: '8px', marginBottom: '14px',
    fontSize: '13px', lineHeight: '1.5',
    ...(tipo === 'success' ? { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' } : {}),
    ...(tipo === 'error'   ? { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' } : {}),
    ...(tipo === 'warn'    ? { background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706' } : {}),
  }),
  mpLogo: { fontSize: '28px', marginBottom: '4px' },
  // Mi abono / créditos
  abonoBox: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '20px', boxShadow: 'var(--sombra)',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  badgeAbonado: {
    alignSelf: 'flex-start', display: 'inline-block', padding: '3px 12px',
    borderRadius: '20px', fontSize: '12px', fontWeight: '700',
    background: '#dcfce7', color: '#16a34a',
  },
  creditosBox: {
    background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px',
    padding: '10px 14px', fontSize: '13px', color: '#1d4ed8',
  },
  creditosNota: { fontSize: '12px', color: '#1d4ed8', opacity: 0.85, marginTop: '4px' },
  creditosPorTipo: { fontSize: '12px', color: '#1d4ed8', marginTop: '6px' },
};

export default function MisSuscripciones() {
  const navigate = useNavigate();
  const [planes, setPlanes]         = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [misPlanes, setMisPlanes]   = useState([]);
  const [pendingDiscount, setPendingDiscount] = useState(0);
  const [planInfo, setPlanInfo]     = useState(null);

  // Especialidades
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState(ESPECIALIZACIONES[0]);

  // Modal
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [pagando, setPagando]                   = useState(false);
  const [resultado, setResultado]               = useState(null); // { tipo, mensaje }
  const [esperandoPago, setEsperandoPago]       = useState(false);
  const pagoHandleRef = useRef(null);

  const cargarMisSuscripciones = useCallback(() => {
    getMyPlans()
      .then((data) => setMisPlanes(Array.isArray(data) ? data : []))
      .catch(() => setMisPlanes([]));
    getMyPlan()
      .then((data) => { setPendingDiscount(data.pending_discount_percent ?? 0); setPlanInfo(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([getPlans(), getMyPlan(), getMyPlans()])
      .then(([planesData, miPlanData, misPlanesData]) => {
        setPlanes(planesData);
        setPendingDiscount(miPlanData.pending_discount_percent ?? 0);
        setPlanInfo(miPlanData);
        setMisPlanes(Array.isArray(misPlanesData) ? misPlanesData : []);
      })
      .catch(() => setErrorCarga('No se pudieron cargar los planes.'))
      .finally(() => setCargando(false));
  }, []);

  // Especialidades en las que el cliente ya tiene una suscripción activa: no se ofrecen de nuevo.
  const especialidadesConSuscripcionActiva = new Set(
    misPlanes.filter((p) => p.status === 'active').map((p) => p.specialization)
  );
  const especialidadesDisponibles = ESPECIALIZACIONES.filter(
    (esp) => !especialidadesConSuscripcionActiva.has(esp)
  );

  function abrirModal(plan) {
    setResultado(null);
    setEspecialidadSeleccionada(especialidadesDisponibles[0] || '');
    setPlanSeleccionado(plan);
  }

  function cerrarModal() {
    if (pagando || esperandoPago) return;
    setPlanSeleccionado(null);
    setResultado(null);
  }

  // El detalle de cada fallo de pago (fondos insuficientes, error de conexión con el banco)
  // se muestra dentro de la ventana de Mercado Pago; en el sistema solo informamos un fallo general.
  const FALLO_GENERAL = 'Hubo un error al completar el pago. Intentalo nuevamente.';

  async function ejecutarPago(scenario) {
    setPagando(true);
    setResultado(null);
    try {
      const res = await mercadoPagoCheckout(planSeleccionado.id, especialidadSeleccionada, scenario);
      if (res.success) {
        setResultado({ tipo: 'success', mensaje: res.message });
        cargarMisSuscripciones();
      } else {
        setResultado({ tipo: 'error', mensaje: FALLO_GENERAL });
      }
    } catch (err) {
      // Validaciones del sistema (ej. ya suscripto a esa especialidad) se muestran tal cual;
      // los fallos de pago/conexión con el banco se informan de forma general.
      const mensaje = err?.status === 400 ? (err.detail || FALLO_GENERAL) : FALLO_GENERAL;
      setResultado({ tipo: 'error', mensaje });
    } finally {
      setPagando(false);
    }
  }

  function handleAbrirPago() {
    if (!planSeleccionado || !especialidadSeleccionada) return;
    const precioFinal = pendingDiscount > 0
      ? Math.round(Number(planSeleccionado.price) * (1 - pendingDiscount / 100))
      : Number(planSeleccionado.price);

    setEsperandoPago(true);
    pagoHandleRef.current = abrirVentanaPago(
      { monto: precioFinal, descripcion: `Plan ${planSeleccionado.name}` },
      {
        onResultado: (scenario) => {
          setEsperandoPago(false);
          ejecutarPago(scenario);
        },
        onCancelado: (motivo) => {
          setEsperandoPago(false);
          if (motivo === 'popup_bloqueado') {
            setResultado({ tipo: 'error', mensaje: 'No se pudo abrir la ventana de pago. Verificá que tu navegador no bloquee ventanas emergentes.' });
          }
        },
      }
    );
  }

  function handleCancelarPago() {
    pagoHandleRef.current?.cancelar();
    setEsperandoPago(false);
  }

  return (
    <LayoutPrivado>
      <button style={s.botonVolver} onClick={() => navigate(-1)}>← Volver</button>
      <h1 style={s.titulo}>Planes y Abonos</h1>
      <p style={s.subtitulo}>Comparar opciones disponibles y suscribirse al plan que mejor se adapte a tus necesidades. Podés tener varias suscripciones activas a la vez (por ejemplo, una por especialidad).</p>

      {errorCarga && <div style={s.alerta('error')}>{errorCarga}</div>}

      {/* ── Planes disponibles (adquirir) ────────────────── */}
      <p style={s.seccionTitulo}>Adquirir un plan</p>
      {cargando ? (
        <div style={s.vacio}>Cargando planes...</div>
      ) : planes.length === 0 ? (
        <div style={s.vacio}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontWeight: '600', marginBottom: '6px', color: 'var(--color-texto)' }}>
            No hay planes disponibles
          </div>
          <div>En este momento no hay planes activos. Volvé más tarde.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {planes.map((plan) => (
            <div key={plan.id} style={s.card}>
              <div style={s.cardNombre}>{plan.name}</div>
              {plan.description && <div style={s.cardDesc}>{plan.description}</div>}
              <div style={s.cardPrecio}>${Number(plan.price).toLocaleString('es-AR')}</div>
              <div style={s.cardDetalle}>Duración: {DURACION(plan.duration_days)}</div>
              <div style={s.cardDetalle}>Cobertura: {plan.coverage_type}</div>
              <button style={s.botonPagar} onClick={() => abrirModal(plan)}>
                Suscribirse
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Mi abono y créditos (movido desde Mi Perfil) ──── */}
      <p style={s.seccionTitulo}>Mi abono</p>
      {cargando ? (
        <div style={s.vacioChico}>Cargando tu abono...</div>
      ) : planInfo?.es_abonado ? (
        <div style={s.abonoBox}>
          <span style={s.badgeAbonado}>Abonado activo</span>
          {pendingDiscount > 0 && (
            <div style={s.alerta('success')}>
              Tenés un <strong>{pendingDiscount}% de descuento</strong> pendiente por cancelación. Se aplicará automáticamente en el pago de tu próxima suscripción.
            </div>
          )}
          <div style={s.creditosBox}>
            🎫 Créditos disponibles este mes: <strong>{planInfo.credits ?? 0} / {planInfo.credits_cap ?? 3}</strong>
            <div style={s.creditosNota}>
              Se ganan cancelando una clase con más de 48 hs de anticipación. El límite se renueva el día 1 de cada mes.
            </div>
            {planInfo.credits_by_type && Object.keys(planInfo.credits_by_type).length > 0 && (
              <div style={s.creditosPorTipo}>
                {Object.entries(planInfo.credits_by_type).map(([tipo, cantidad]) => (
                  <span key={tipo} style={{ marginRight: '10px' }}>{tipo}: {cantidad}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={s.vacioChico}>
          Todavía no sos abonado. Suscribite a un plan para acceder a beneficios de abonado, descuentos y reservas prioritarias.
        </div>
      )}

      {/* ── Mis suscripciones ────────────────────────────── */}
      <p style={s.seccionTitulo}>Mis suscripciones</p>
      {cargando ? (
        <div style={s.vacioChico}>Cargando tus suscripciones...</div>
      ) : misPlanes.length === 0 ? (
        <div style={s.vacioChico}>Todavía no tenés ninguna suscripción. Elegí un plan más arriba para empezar.</div>
      ) : (
        <div style={s.listaPlanes}>
          {misPlanes.map((p) => (
            <div key={p.id} style={s.itemPlan}>
              <div>
                <div style={s.itemPlanNombre}>{p.plan_name} · {p.specialization}</div>
                <div style={s.itemPlanSub}>
                  {p.start_date} → {p.end_date} · Clases usadas: {p.classes_used}/{p.classes_max}
                </div>
              </div>
              <span style={s.badgeEstado(p.status)}>{(ESTADO_LABEL[p.status] || ESTADO_LABEL.expired).texto}</span>
            </div>
          ))}
        </div>
      )}

      {/* Modal de pago */}
      {planSeleccionado && (
        <div style={s.overlay} onClick={cerrarModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.mpLogo}>💳</div>
            <div style={s.modalTitulo}>Pagar con Mercado Pago</div>
            <div style={s.modalSubtitulo}>
              {planSeleccionado.name} · {pendingDiscount > 0 ? (
                <>
                  <span style={{ textDecoration: 'line-through' }}>${Number(planSeleccionado.price).toLocaleString('es-AR')}</span>{' '}
                  ${Math.round(Number(planSeleccionado.price) * (1 - pendingDiscount / 100)).toLocaleString('es-AR')}
                </>
              ) : (
                <>${Number(planSeleccionado.price).toLocaleString('es-AR')}</>
              )}
            </div>

            {pendingDiscount > 0 && !resultado && (
              <div style={s.alerta('success')}>
                Tenés un <strong>{pendingDiscount}% de descuento</strong> acumulado por cancelación. Se aplicará automáticamente a este pago.
              </div>
            )}

            {resultado && (
              <div style={s.alerta(resultado.tipo)}>{resultado.mensaje}</div>
            )}

            {!resultado && (
              especialidadesDisponibles.length === 0 ? (
                <div style={s.alerta('warn')}>
                  Ya tenés una suscripción activa en todas las especialidades disponibles.
                </div>
              ) : (
                <>
                  <label style={s.label}>Especialidad</label>
                  <select
                    style={s.select}
                    value={especialidadSeleccionada}
                    onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
                    disabled={pagando}
                  >
                    {especialidadesDisponibles.map((esp) => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>

                  <button style={s.botonConfirmar} onClick={handleAbrirPago} disabled={pagando}>
                    {pagando ? 'Procesando...' : 'Pagar'}
                  </button>
                </>
              )
            )}

            <button style={s.botonCancelar} onClick={cerrarModal} disabled={pagando}>
              {resultado ? 'Cerrar' : 'Cancelar'}
            </button>
          </div>
        </div>
      )}

      <OverlayEsperandoPago visible={esperandoPago} onCancelar={handleCancelarPago} />
    </LayoutPrivado>
  );
}
