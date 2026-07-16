import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getRooms } from '../../../services/roomsService';
import { createActivity, getActivities } from '../../../services/activitiesService';
import { searchUsers } from '../../../services/usersService';
import { obtenerFeriadoArgentino } from '../../../utils/feriados';

// ── Constantes ─────────────────────────────────────────────────────────────────

const ESPECIALIZACIONES = [
  'Kinesiologia deportiva', 'Fisioterapia', 'Kinesiologia neurologica',
  'Rehabilitacion cardiovascular', 'Kinesiologia traumatologica', 'Pilates terapeutico',
  'Kinesiologia pediatrica', 'Osteopatia', 'Acupuntura', 'Masoterapia',
  'Kinesiologia respiratoria', 'Rehabilitacion post-quirurgica',
  'Kinesiologia gerontologica', 'Electroterapia',
];

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const HORAS = Array.from({ length: 8 }, (_, i) => {
  const h = 9 + i;
  return {
    valor: `${String(h).padStart(2, '0')}:00`,
    label: `${String(h).padStart(2, '0')}:00 – ${String(h + 1).padStart(2, '0')}:00`,
  };
});

const FORM_INICIAL = {
  name: '',
  specialization: '',
  professor: '',
  room_id: '',
  activity_type: 'fixed',
  price: '',
  capacity: '',
  description: '',
  requirements: '',
  mes: '',          // YYYY-MM — solo fija
  diaSemana: '',    // Lunes|Martes|…  — solo fija
  specific_date: '', // solo individual
};

// ── Meses disponibles (próximos 6 meses) ──────────────────────────────────────

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
// Retorna array de { date, fechaStr, esFeriado, nombreFeriado }
function generarFechasDelMes(mesStr, diaSemanaStr) {
  if (!mesStr || !diaSemanaStr) return [];
  const [year, month] = mesStr.split('-').map(Number);
  const targetDay = DIAS_SEMANA.indexOf(diaSemanaStr); // 0=Dom…6=Sáb
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

// ── Helpers de colisión (espejo del backend) ───────────────────────────────────

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

// ── Hook: ocupaciones por sala ─────────────────────────────────────────────────

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

// ── Estilos ────────────────────────────────────────────────────────────────────

const s = {
  card: {
    background: 'var(--color-fondo-card)',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: 'var(--sombra)',
    maxWidth: '720px',
  },
  titulo: { fontSize: '20px', fontWeight: '700', color: 'var(--color-texto)', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' },
  gridFull: { gridColumn: '1 / -1' },
  grupo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--color-texto-suave)' },
  input: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)',
    boxSizing: 'border-box', width: '100%',
  },
  textarea: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)',
    width: '100%', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box',
  },
  select: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)',
    width: '100%', cursor: 'pointer',
  },
  // Selector de días
  diasRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  diaBtn: (activo) => ({
    padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', border: '1px solid',
    borderColor: activo ? 'var(--color-primario)' : 'var(--color-borde)',
    background: activo ? 'var(--color-primario)' : 'transparent',
    color: activo ? '#fff' : 'var(--color-texto)',
    transition: 'all 0.15s',
  }),
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
};

// ── Componente ─────────────────────────────────────────────────────────────────

function CrearActividad() {
  const navigate = useNavigate();
  const [form, setForm] = useState(FORM_INICIAL);
  const [horaInicio, setHoraInicio] = useState('');

  const [salas, setSalas] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [actividadesActivas, setActividadesActivas] = useState([]);

  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const fechasGeneradas = useMemo(
    () => generarFechasDelMes(form.mes, form.diaSemana),
    [form.mes, form.diaSemana]
  );
  // No se ofrecen fechas pasadas: en un lote mensual se descartan los días del mes que
  // ya transcurrieron, igual que los feriados (hoy sigue disponible; la hora de hoy la
  // filtra horasDisponibles).
  const fechasValidas = useMemo(() => {
    const hoyStr = new Date().toISOString().split('T')[0];
    return fechasGeneradas.filter((f) => !f.esFeriado && f.fechaStr >= hoyStr);
  }, [fechasGeneradas]);
  // Fecha representativa para cálculos de colisión de sala/profesor
  const representativeDate = useMemo(() => {
    if (form.activity_type === 'individual') return form.specific_date || null;
    return fechasValidas.length > 0 ? fechasValidas[0].fechaStr : null;
  }, [form.activity_type, form.specific_date, fechasValidas]);

  const ocupada = useOcupaciones(actividadesActivas);
  const esIndividual = form.activity_type === 'individual';

  // Carga inicial: salas + actividades activas
  useEffect(() => {
    Promise.all([
      getRooms(),
      getActivities({ status: 'active' }),
    ])
      .then(([rooms, acts]) => {
        setSalas(rooms);
        setActividadesActivas(Array.isArray(acts) ? acts : []);
      })
      .catch(() => setError('No se pudieron cargar los datos iniciales.'));
  }, []);

  // Recarga profesores cuando cambia la especialidad
  useEffect(() => {
    if (!form.specialization) { setProfesores([]); return; }
    searchUsers('', 'professor', 'active')
      .then((lista) => {
        const arr = Array.isArray(lista) ? lista : [];
        setProfesores(arr.filter((p) => p.specialization === form.specialization));
      })
      .catch(() => setProfesores([]));
  }, [form.specialization]);

  // ── Derivaciones: opciones disponibles ───────────────────────────────────

  // Las fechas que realmente se van a crear. Una fija genera una clase por cada fecha
  // del mes, no una sola: hay que chequear el profesor contra TODAS.
  const fechasACrear = useMemo(() => {
    if (esIndividual) return form.specific_date ? [form.specific_date] : [];
    return fechasValidas.map((f) => f.fechaStr);
  }, [esIndividual, form.specific_date, fechasValidas]);

  // Un profesor no se ofrece si ya tiene una actividad que se pisa con alguna de las
  // fechas a crear. Se compara contra la FECHA concreta y no contra el día de la semana:
  // por día, un profesor con clase el jueves de agosto quedaba excluido al crear los
  // jueves de septiembre, donde en realidad está libre.
  const profesoresDisponibles = useMemo(() => {
    if (!horaInicio || fechasACrear.length === 0) return profesores;
    const inicioProp = parseMinutes(horaInicio);
    const fechas = new Set(fechasACrear);

    return profesores.filter((prof) => {
      const nombreCompleto = `${prof.name} ${prof.lastname}`.trim().toLowerCase();
      return !actividadesActivas.some((act) => {
        if (!act.professor) return false;
        if (act.professor.trim().toLowerCase() !== nombreCompleto) return false;

        if (act.specific_date) {
          if (!fechas.has(act.specific_date)) return false;
        } else {
          // Fija legacy sin fecha: se repite todas las semanas, así que choca si comparte
          // el día de la semana con alguna de las fechas a crear.
          const diasAct = diasDeActividad(act);
          const chocaElDia = fechasACrear.some(
            (f) => diasAct.has(DIAS_SEMANA[new Date(`${f}T00:00:00`).getDay()])
          );
          if (!chocaElDia) return false;
        }

        const [inicioExist, finExist] = rangoDeActividad(act);
        if (inicioExist === null) return false;
        return inicioProp < finExist && inicioExist < inicioProp + 60;
      });
    });
  }, [profesores, actividadesActivas, horaInicio, fechasACrear]);

  // Si el profesor ya elegido deja de estar disponible (se cambió la hora, el mes o el
  // día), hay que soltarlo: si no, queda seleccionado uno ocupado y el alta muere con el
  // 409 del backend ("ya tiene una actividad asignada en ese horario").
  useEffect(() => {
    if (!form.professor) return;
    const sigueDisponible = profesoresDisponibles.some(
      (p) => `${p.name} ${p.lastname}` === form.professor
    );
    if (!sigueDisponible) setForm((f) => ({ ...f, professor: '' }));
  }, [profesoresDisponibles, form.professor]);

  const salasDisponibles = useMemo(() => {
    if (!representativeDate || !horaInicio) return salas;
    const dia = DIAS_SEMANA[new Date(`${representativeDate}T00:00:00`).getDay()];
    return salas.filter((sala) => !ocupada(sala.id, dia, horaInicio));
  }, [salas, representativeDate, horaInicio, ocupada]);

  const horasDisponibles = useMemo(() => {
    if (!form.room_id || !representativeDate) return HORAS;
    const dia = DIAS_SEMANA[new Date(`${representativeDate}T00:00:00`).getDay()];

    // Si el turno es hoy, no se ofrecen las horas que ya pasaron (a las 12:51 no aparece
    // el turno de las 12:00). Se compara contra ahora, sin mensaje de error.
    const ahora = new Date();
    const esHoy = representativeDate === ahora.toISOString().split('T')[0];
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

    return HORAS.filter((h) => {
      if (ocupada(form.room_id, dia, h.valor)) return false;
      if (esHoy && parseMinutes(h.valor) <= minutosAhora) return false;
      return true;
    });
  }, [form.room_id, representativeDate, ocupada]);

  // ── Side-effects de limpieza ─────────────────────────────────────────────
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

  useEffect(() => {}, []);  // placeholder (diasDisponibles removed)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      let newValue = value;
      
      // Validación especial para precio: solo números y un punto
      if (name === 'price') {
        newValue = value.replace(/[^0-9.]/g, ''); // solo números y punto
        const parts = newValue.split('.');
        if (parts.length > 2) newValue = parts[0] + '.' + parts.slice(1).join(''); // solo un punto
      }
      
      // Validación especial para cupos: solo números positivos, no supera máximo
      if (name === 'capacity') {
        newValue = value.replace(/[^0-9]/g, ''); // solo números
        if (salaSeleccionada && newValue && Number(newValue) > salaSeleccionada.capacity) {
          newValue = String(salaSeleccionada.capacity);
        }
      }
      
      const next = { ...prev, [name]: newValue };
      if (name === 'specialization') next.professor = '';
      if (name === 'activity_type') {
        next.mes = '';
        next.diaSemana = '';
        next.specific_date = '';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.room_id) return setError('Seleccioná una sala.');
    if (!form.specialization) return setError('Seleccioná una especialidad.');
    if (!horaInicio) return setError('Seleccioná un horario.');
    if (esIndividual) {
      if (!form.specific_date) return setError('Seleccioná la fecha del turno.');
      const feriado = obtenerFeriadoArgentino(form.specific_date);
      if (feriado.esFeriado) return setError(`La fecha seleccionada es feriado (${feriado.nombre}). Elegí otra fecha.`);
    } else {
      if (!form.mes) return setError('Seleccioná el mes.');
      if (!form.diaSemana) return setError('Seleccioná el día de la semana.');
      if (fechasValidas.length === 0) return setError('No hay clases disponibles ese mes (todas las fechas son feriados).');
    }
    if (Number(form.capacity) <= 0) return setError('Los cupos deben ser mayor a 0.');
    if (Number(form.price) < 0) return setError('El precio no puede ser negativo.');

    const payload = {
      name: form.name.trim(),
      specialization: form.specialization,
      room_id: Number(form.room_id),
      activity_type: form.activity_type,
      specific_date: esIndividual ? form.specific_date : fechasValidas[0].fechaStr,
      time_slot: horaInicio,
      professor: form.professor || null,
      price: parseFloat(form.price),
      capacity: Number(form.capacity),
      description: form.description.trim() || null,
      requirements: form.requirements.trim() || null,
      repetitions: esIndividual ? 1 : undefined,
      dates: esIndividual ? undefined : fechasValidas.map((f) => f.fechaStr),
    };

    setGuardando(true);
    try {
      const result = await createActivity(payload);
      const cantidad = Array.isArray(result) ? result.length : 1;
      navigate('/admin/actividades', {
        state: { mensaje: cantidad === 1 ? 'Actividad creada con éxito.' : `Se crearon ${cantidad} actividades con éxito.` },
      });
    } catch (err) {
      setError(err.message || 'Error al crear la actividad.');
    } finally {
      setGuardando(false);
    }
  };

  const salaSeleccionada = salas.find((r) => r.id === Number(form.room_id));

  return (
    <LayoutPrivado titulo="Crear Actividad">
      <div style={s.card}>
        <h2 style={s.titulo}>Nueva actividad</h2>

        {error && <div style={s.error}>{error}</div>}

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
                required
              />
            </div>

            {/* Especialidad */}
            <div style={{ ...s.grupo, ...s.gridFull }}>
              <label style={s.label}>Especialidad *</label>
              <select style={s.select} name="specialization" value={form.specialization} onChange={handleChange} required>
                <option value="">— Seleccionar especialidad —</option>
                {ESPECIALIZACIONES.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div style={s.grupo}>
              <label style={s.label}>Tipo de clase *</label>
              <select style={s.select} name="activity_type" value={form.activity_type} onChange={handleChange}>
                <option value="fixed">Fija (grupo fijo semanal)</option>
                <option value="individual">Individual (turno por turno)</option>
              </select>
            </div>

            {/* Sala — solo muestra las disponibles */}
            <div style={s.grupo}>
              <label style={s.label}>Sala *</label>
              <select style={s.select} name="room_id" value={form.room_id} onChange={handleChange} required>
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

            {/* Fecha del turno — solo individual */}
            {esIndividual && (
              <div style={s.grupo}>
                <label style={s.label}>Fecha del turno *</label>
                <input
                  style={s.input}
                  type="date"
                  name="specific_date"
                  value={form.specific_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            )}

            {/* Mes y día de semana — solo fija */}
            {!esIndividual && (
              <>
                <div style={s.grupo}>
                  <label style={s.label}>Mes *</label>
                  <select style={s.select} name="mes" value={form.mes} onChange={handleChange} required>
                    <option value="">— Seleccionar mes —</option>
                    {MESES_DISPONIBLES.map((m) => (
                      <option key={m.valor} value={m.valor}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div style={s.grupo}>
                  <label style={s.label}>Día de la semana *</label>
                  <select style={s.select} name="diaSemana" value={form.diaSemana} onChange={handleChange} required>
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
                  Clases a crear&nbsp;
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

            {/* Horario — solo muestra los disponibles */}
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

            {/* Profesor */}
            <div style={s.grupo}>
              <label style={s.label}>
                Profesor {esIndividual ? '(opcional)' : '*'}
              </label>
              {/* Sin la fecha y la hora no se sabe quién está ocupado, y listar a todos
                  invita a elegir un profesor que después rebota con el 409 del backend.
                  Por eso el selector espera a tener esos datos. */}
              <select
                style={s.select}
                name="professor"
                value={form.professor}
                onChange={handleChange}
                disabled={!form.specialization || !horaInicio || fechasACrear.length === 0}
              >
                <option value="">
                  {!form.specialization
                    ? '— Seleccioná primero una especialidad —'
                    : fechasACrear.length === 0
                    ? '— Seleccioná primero la fecha —'
                    : !horaInicio
                    ? '— Seleccioná primero el horario —'
                    : profesoresDisponibles.length === 0
                    ? '— No hay profesores libres en ese horario —'
                    : esIndividual
                    ? '— Sin asignar (el profesor se puede asignar después) —'
                    : '— Seleccionar profesor —'}
                </option>
                {profesoresDisponibles.map((p) => (
                  <option key={p.id} value={`${p.name} ${p.lastname}`}>
                    {p.name} {p.lastname}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div style={s.grupo}>
              <label style={s.label}>Precio ($) *</label>
              <input
                style={s.input}
                type="text"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>

            {/* Cupos */}
            <div style={s.grupo}>
              <label style={s.label}>Cupos ofrecidos *</label>
              <input
                style={s.input}
                type="text"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                placeholder="Ej: 8"
                required
              />
              {salaSeleccionada && (
                <span style={s.hint}>Máximo: {salaSeleccionada.capacity} (capacidad de la sala)</span>
              )}
            </div>

            {/* Descripción */}
            <div style={{ ...s.grupo, ...s.gridFull }}>
              <label style={s.label}>Descripción</label>
              <textarea
                style={s.textarea}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Descripción de la actividad, beneficios, etc."
              />
            </div>

            {/* Requisitos */}
            <div style={{ ...s.grupo, ...s.gridFull }}>
              <label style={s.label}>Requisitos</label>
              <input
                style={s.input}
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                placeholder="Ej: Ropa cómoda, certificado médico"
              />
            </div>

          </div>

          <div style={s.acciones}>
            <button type="submit" style={s.botonPrimario} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Crear actividad'}
            </button>
            <button
              type="button"
              style={s.botonSecundario}
              onClick={() => navigate('/admin/actividades')}
              disabled={guardando}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </LayoutPrivado>
  );
}

export default CrearActividad;