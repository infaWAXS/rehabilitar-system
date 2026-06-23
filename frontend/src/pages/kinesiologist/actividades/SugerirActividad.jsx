import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getRooms } from '../../../services/roomsService';
import { getActivities } from '../../../services/activitiesService';
import { getCurrentUser } from '../../../services/usersService';
import { suggestActivity } from '../../../services/suggestionsService';
import { obtenerFeriadoArgentino } from '../../../utils/feriados';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const HORAS = Array.from({ length: 8 }, (_, i) => {
  const h = 9 + i;
  return {
    valor: `${String(h).padStart(2, '0')}:00`,
    label: `${String(h).padStart(2, '0')}:00 – ${String(h + 1).padStart(2, '0')}:00`,
  };
});

// ── Meses disponibles (próximos 6 meses) — espejo de CrearActividad ────────

const MESES_DISPONIBLES = (() => {
  const today = new Date();
  const result = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
    result.push({ valor, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return result;
})();

// Genera todas las ocurrencias de un día de la semana dentro del mes dado.
function generarFechasDelMes(mesStr, diaSemanaStr) {
  if (!mesStr || !diaSemanaStr) return [];
  const [year, month] = mesStr.split('-').map(Number);
  const targetDay = DIAS_SEMANA.indexOf(diaSemanaStr);
  if (targetDay === -1) return [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const result = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    if (dateObj.getDay() === targetDay) {
      const fechaStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const feriado = obtenerFeriadoArgentino(fechaStr);
      result.push({ date: dateObj, fechaStr, esFeriado: feriado.esFeriado, nombreFeriado: feriado.nombre || '' });
    }
  }
  return result;
}

// ── Helpers de colisión (espejo de CrearActividad / backend) ──────────────

function parseMinutes(texto) {
  if (!texto) return null;
  const m = texto.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

function rangoDeActividad(act) {
  if (act.activity_type === 'individual') {
    const inicio = parseMinutes(act.time_slot);
    return inicio !== null ? [inicio, inicio + 60] : [null, null];
  }
  const matches = [...(act.schedule || '').matchAll(/(\d{1,2}):(\d{2})/g)];
  if (matches.length >= 2) {
    return [
      parseInt(matches[0][1]) * 60 + parseInt(matches[0][2]),
      parseInt(matches[1][1]) * 60 + parseInt(matches[1][2]),
    ];
  }
  const inicio = parseMinutes(act.time_slot || act.schedule);
  return inicio !== null ? [inicio, inicio + 60] : [null, null];
}

function diasDeActividad(act) {
  // Tanto individual como fijas nuevas tienen specific_date
  if (act.specific_date) {
    const d = new Date(`${act.specific_date}T00:00:00`);
    return new Set([DIAS_SEMANA[d.getDay()]]);
  }
  if (act.activity_type === 'individual') return new Set();
  // Fijas legacy con schedule
  const sch = (act.schedule || '').toLowerCase();
  return new Set(DIAS.filter((d) => sch.includes(d.toLowerCase())));
}

function solapaHorario(inicioA, inicioB, finB) {
  return inicioA < finB && inicioB < inicioA + 60;
}

function useOcupaciones(actividadesActivas) {
  return useMemo(() => {
    return function ocupada(roomId, dia, horaInicio) {
      if (!roomId || !dia || !horaInicio) return false;
      const inicio = parseMinutes(horaInicio);
      if (inicio === null) return false;
      return actividadesActivas.some((act) => {
        if (act.room_id !== Number(roomId)) return false;
        const dias = diasDeActividad(act);
        if (!dias.has(dia)) return false;
        const [inicioExist, finExist] = rangoDeActividad(act);
        if (inicioExist === null) return false;
        return solapaHorario(inicio, inicioExist, finExist);
      });
    };
  }, [actividadesActivas]);
}

// ── Estilos ─────────────────────────────────────────────────────────────

const s = {
  card: {
    background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '32px',
    boxShadow: 'var(--sombra)', maxWidth: '720px',
  },
  titulo: { fontSize: '20px', fontWeight: '700', color: 'var(--color-texto)', marginBottom: '6px' },
  subtitulo: { fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' },
  gridFull: { gridColumn: '1 / -1' },
  grupo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--color-texto-suave)' },
  input: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)',
    width: '100%', boxSizing: 'border-box',
  },
  textarea: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)',
    width: '100%', resize: 'vertical', minHeight: '70px', boxSizing: 'border-box',
  },
  select: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)',
    width: '100%', cursor: 'pointer',
  },
  valorFijo: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto-suave)',
  },
  hint: { fontSize: '12px', color: 'var(--color-texto-suave)', marginTop: '2px' },
  acciones: { display: 'flex', gap: '12px', marginTop: '28px' },
  botonPrimario: {
    padding: '11px 28px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  botonSecundario: {
    padding: '11px 24px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    background: 'transparent', color: 'var(--color-texto)',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
    padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '20px',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '28px 32px', maxWidth: '440px', width: '90%',
  },
  modalTitulo: { fontSize: '17px', fontWeight: '700', marginBottom: '12px', color: 'var(--color-texto)' },
  modalTexto: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '20px', lineHeight: '1.6' },
  modalBotones: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
};

const FORM_INICIAL = {
  name: '',
  room_id: '',
  activity_type: 'fixed',
  specific_date: '',  // solo individual
  mes: '',            // YYYY-MM — solo fija
  diaSemana: '',      // Lunes|Martes|… — solo fija
  capacity: '',
  description: '',
  requirements: '',
};

function SugerirActividad() {
  const navigate = useNavigate();
  const [especialidad, setEspecialidad] = useState('');
  const [salas, setSalas] = useState([]);
  const [actividadesActivas, setActividadesActivas] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [horaInicio, setHoraInicio] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const esIndividual = form.activity_type === 'individual';
  const ocupada = useOcupaciones(actividadesActivas);

  const fechasGeneradas = useMemo(
    () => generarFechasDelMes(form.mes, form.diaSemana),
    [form.mes, form.diaSemana]
  );
  const fechasValidas = useMemo(
    () => fechasGeneradas.filter((f) => !f.esFeriado),
    [fechasGeneradas]
  );
  // Fecha representativa para cálculos de colisión de sala
  const representativeDate = useMemo(() => {
    if (esIndividual) return form.specific_date || null;
    return fechasValidas.length > 0 ? fechasValidas[0].fechaStr : null;
  }, [esIndividual, form.specific_date, fechasValidas]);

  const feriadoSeleccionado = useMemo(
    () => obtenerFeriadoArgentino(form.specific_date),
    [form.specific_date]
  );

  useEffect(() => {
    Promise.all([getRooms(), getActivities({ status: 'active' }), getCurrentUser()])
      .then(([rooms, acts, me]) => {
        setSalas(rooms);
        setActividadesActivas(Array.isArray(acts) ? acts : []);
        setEspecialidad(me?.specialization || '');
        if (!me?.specialization) {
          setError('No tenés una especialización asignada. Contactá al administrador.');
        }
      })
      .catch(() => setError('No se pudieron cargar los datos iniciales.'))
      .finally(() => setCargando(false));
  }, []);

  // ── Derivaciones: qué opciones quedan disponibles ─────────────────────

  const salasDisponibles = useMemo(() => {
    if (!representativeDate || !horaInicio) return salas;
    const dia = DIAS_SEMANA[new Date(`${representativeDate}T00:00:00`).getDay()];
    return salas.filter((sala) => !ocupada(sala.id, dia, horaInicio));
  }, [salas, representativeDate, horaInicio, ocupada]);

  const horasDisponibles = useMemo(() => {
    if (!form.room_id || !representativeDate) return HORAS;
    const dia = DIAS_SEMANA[new Date(`${representativeDate}T00:00:00`).getDay()];
    return HORAS.filter((h) => !ocupada(form.room_id, dia, h.valor));
  }, [form.room_id, representativeDate, ocupada]);

  // ── Limpieza automática si la opción elegida deja de estar disponible ──

  useEffect(() => {
    if (form.room_id && !salasDisponibles.find((s) => s.id === Number(form.room_id))) {
      setForm((prev) => ({ ...prev, room_id: '' }));
    }
  }, [salasDisponibles, form.room_id]);

  useEffect(() => {
    if (horaInicio && !horasDisponibles.find((h) => h.valor === horaInicio)) {
      setHoraInicio('');
    }
  }, [horasDisponibles, horaInicio]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      let newValue = value;

      if (name === 'capacity') {
        newValue = value.replace(/[^0-9]/g, '');
        if (salaSeleccionada && newValue && Number(newValue) > salaSeleccionada.capacity) {
          newValue = String(salaSeleccionada.capacity);
        }
      }

      const next = { ...prev, [name]: newValue };
      if (name === 'activity_type') {
        next.specific_date = '';
        next.mes = '';
        next.diaSemana = '';
        setHoraInicio('');
      }
      if (name === 'specific_date' && newValue) {
        const dia = new Date(`${newValue}T00:00:00`).getDay();
        if (dia === 0 || dia === 6) {
          setError('Las actividades individuales no se pueden programar en fin de semana.');
          return { ...prev, [name]: '' };
        }
        setError('');
      }
      return next;
    });
  };

  // Paso 1: valida y abre el modal de confirmación (no manda nada al backend todavía)
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Ingresá un nombre para la actividad.');
    if (!form.room_id) return setError('Seleccioná una sala.');
    if (!horaInicio) return setError('Seleccioná un horario.');
    if (esIndividual) {
      if (!form.specific_date) return setError('Seleccioná la fecha del turno.');
      if (feriadoSeleccionado.esFeriado) {
        return setError(`La fecha seleccionada es feriado (${feriadoSeleccionado.nombre}). Elegí otra fecha.`);
      }
    } else {
      if (!form.mes) return setError('Seleccioná el mes.');
      if (!form.diaSemana) return setError('Seleccioná el día de la semana.');
      if (fechasValidas.length === 0) return setError('No hay clases disponibles ese mes (todas las fechas son feriados).');
    }
    if (!form.capacity || Number(form.capacity) <= 0) return setError('Los cupos deben ser mayor a 0.');

    setConfirmando(true);
  };

  // Paso 2: el profesor confirma -> ahí sí se envía la sugerencia
  const confirmarEnvio = async () => {
    setEnviando(true);
    setError('');
    try {
      await suggestActivity({
        room_id: Number(form.room_id),
        name: form.name.trim(),
        specialization: especialidad,
        activity_type: form.activity_type,
        schedule: esIndividual ? null : `${form.diaSemana} · ${horaInicio}–${String(parseInt(horaInicio) + 1).padStart(2, '0')}:00`,
        specific_date: esIndividual ? form.specific_date : fechasValidas[0]?.fechaStr || null,
        time_slot: horaInicio,
        dates: esIndividual ? undefined : fechasValidas.map((f) => f.fechaStr),
        capacity: Number(form.capacity),
        description: form.description.trim() || null,
        requirements: form.requirements.trim() || null,
      });
      setConfirmando(false);
      setExito('Tu sugerencia fue enviada. Queda pendiente de aprobación por un administrador.');
    } catch (err) {
      setConfirmando(false);
      setError(err.message || 'No se pudo enviar la sugerencia.');
    } finally {
      setEnviando(false);
    }
  };

  const salaSeleccionada = salas.find((r) => r.id === Number(form.room_id));

  if (cargando) {
    return (
      <LayoutPrivado titulo="Sugerir Actividad">
        <div style={s.card}>Cargando...</div>
      </LayoutPrivado>
    );
  }

  return (
    <LayoutPrivado titulo="Sugerir Actividad">
      <div style={s.card}>
        <h2 style={s.titulo}>Sugerir una nueva actividad</h2>
        <p style={s.subtitulo}>
          Tu sugerencia queda a disposición de los administradores para que la aprueben manualmente.
        </p>

        {error && <div style={s.error}>{error}</div>}
        {exito && (
          <>
            <div style={{ ...s.error, background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}>{exito}</div>
            <button style={s.botonPrimario} onClick={() => navigate('/profesor/actividades')}>
              Volver a Mis Actividades
            </button>
          </>
        )}

        {!exito && (
          <form onSubmit={handleSubmit}>
            <div style={s.grid}>

              {/* Nombre */}
              <div style={{ ...s.grupo, ...s.gridFull }}>
                <label style={s.label}>Nombre de la actividad *</label>
                <input
                  style={s.input}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej: Yoga Terapéutico, Pilates Grupal"
                />
              </div>

              <div style={{ ...s.grupo, ...s.gridFull }}>
                <label style={s.label}>Tipo de actividad (tu especialidad)</label>
                <div style={s.valorFijo}>{especialidad || '—'}</div>
              </div>

              <div style={s.grupo}>
                <label style={s.label}>Tipo de clase *</label>
                <select style={s.select} name="activity_type" value={form.activity_type} onChange={handleChange}>
                  <option value="fixed">Fija (grupo fijo semanal)</option>
                  <option value="individual">Individual (turno puntual)</option>
                </select>
              </div>

              <div style={s.grupo}>
                <label style={s.label}>Sala *</label>
                <select style={s.select} name="room_id" value={form.room_id} onChange={handleChange}>
                  <option value="">
                    {salas.length > 0 && salasDisponibles.length === 0
                      ? '— No hay salas disponibles —'
                      : '— Seleccionar sala —'}
                  </option>
                  {salasDisponibles.map((sala) => (
                    <option key={sala.id} value={sala.id}>
                      {sala.name} (cap. {sala.capacity})
                    </option>
                  ))}
                </select>
              </div>

              {esIndividual ? (
                <div style={s.grupo}>
                  <label style={s.label}>Fecha del turno *</label>
                  <input
                    style={s.input}
                    type="date"
                    name="specific_date"
                    value={form.specific_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              ) : (
                <>
                  <div style={s.grupo}>
                    <label style={s.label}>Mes *</label>
                    <select style={s.select} name="mes" value={form.mes} onChange={handleChange}>
                      <option value="">— Seleccionar mes —</option>
                      {MESES_DISPONIBLES.map((m) => (
                        <option key={m.valor} value={m.valor}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={s.grupo}>
                    <label style={s.label}>Día de la semana *</label>
                    <select style={s.select} name="diaSemana" value={form.diaSemana} onChange={handleChange}>
                      <option value="">— Seleccionar día —</option>
                      {DIAS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Preview clases del mes — solo fija */}
              {!esIndividual && fechasGeneradas.length > 0 && (
                <div style={{ ...s.grupo, ...s.gridFull }}>
                  <label style={s.label}>
                    Clases a sugerir&nbsp;
                    <span style={{ fontWeight: 400, color: 'var(--color-texto)' }}>
                      ({fechasValidas.length} clase{fechasValidas.length !== 1 ? 's' : ''}
                      {fechasGeneradas.length !== fechasValidas.length && ` — ${fechasGeneradas.length - fechasValidas.length} feriado(s) omitido(s)`})
                    </span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {fechasGeneradas.map((f) => (
                      <span
                        key={f.fechaStr}
                        title={f.esFeriado ? `Feriado: ${f.nombreFeriado} — se omite` : ''}
                        style={{
                          borderRadius: '4px',
                          padding: '3px 10px',
                          fontSize: '13px',
                          background: f.esFeriado ? '#fef2f2' : '#e8f5e9',
                          color: f.esFeriado ? '#dc2626' : '#2e7d32',
                          textDecoration: f.esFeriado ? 'line-through' : 'none',
                        }}
                      >
                        {f.date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {f.esFeriado && ' — feriado'}
                      </span>
                    ))}
                  </div>
                  {fechasValidas.length === 0 && (
                    <span style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                      Todas las fechas son feriados. Elegí otro mes o día.
                    </span>
                  )}
                </div>
              )}

              <div style={s.grupo}>
                <label style={s.label}>Horario *</label>
                <select style={s.select} value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)}>
                  <option value="">
                    {horasDisponibles.length === 0
                      ? '— No hay horarios disponibles —'
                      : '— Seleccionar turno —'}
                  </option>
                  {horasDisponibles.map((h) => (
                    <option key={h.valor} value={h.valor}>{h.label}</option>
                  ))}
                </select>
                {!esIndividual && form.diaSemana && horaInicio && (
                  <span style={s.hint}>Horario: {horaInicio} – {`${String(parseInt(horaInicio) + 1).padStart(2, '0')}:00`}</span>
                )}
              </div>

              <div style={s.grupo}>
                <label style={s.label}>Cupos máximos *</label>
                <input
                  style={s.input}
                  type="text"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="Ej: 8"
                />
                {salaSeleccionada && (
                  <span style={s.hint}>Máximo: {salaSeleccionada.capacity} (capacidad de la sala)</span>
                )}
              </div>

              <div style={{ ...s.grupo, ...s.gridFull }}>
                <label style={s.label}>Descripción</label>
                <textarea
                  style={s.textarea}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Descripción de la actividad (opcional)"
                />
              </div>

              <div style={{ ...s.grupo, ...s.gridFull }}>
                <label style={s.label}>Requisitos</label>
                <input
                  style={s.input}
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  placeholder="Ej: Ropa cómoda (opcional)"
                />
              </div>

            </div>

            <div style={s.acciones}>
              <button type="submit" style={s.botonPrimario}>Enviar Sugerencia</button>
              <button type="button" style={s.botonSecundario} onClick={() => navigate('/profesor/actividades')}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {confirmando && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitulo}>Confirmar sugerencia</div>
            <div style={s.modalTexto}>
              ¿Confirmás el envío de esta sugerencia de actividad? Quedará pendiente de revisión por un administrador.
            </div>
            <div style={s.modalBotones}>
              <button style={s.botonSecundario} onClick={() => setConfirmando(false)} disabled={enviando}>
                Cancelar
              </button>
              <button style={s.botonPrimario} onClick={confirmarEnvio} disabled={enviando}>
                {enviando ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutPrivado>
  );
}

export default SugerirActividad;
