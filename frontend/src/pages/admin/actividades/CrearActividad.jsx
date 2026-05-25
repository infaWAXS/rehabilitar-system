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
  specific_date: '',
};

// ── Helpers de colisión (espejo del backend) ───────────────────────────────────

/** Extrae minutos desde "HH:MM" o del primer match en un string */
function parseMinutes(texto) {
  if (!texto) return null;
  const m = texto.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

/** Devuelve [inicio, fin] en minutos de una actividad existente */
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

/** Días de la semana que ocupa una actividad existente */
function diasDeActividad(act) {
  if (act.activity_type === 'individual') {
    if (!act.specific_date) return new Set();
    const d = new Date(`${act.specific_date}T00:00:00`);
    return new Set([DIAS_SEMANA[d.getDay()]]);
  }
  const s = (act.schedule || '').toLowerCase();
  return new Set(DIAS.filter((d) => s.includes(d.toLowerCase())));
}

/** true si el rango [inicioA, inicioA+60) solapa con [inicioB, finB) */
function solapaHorario(inicioA, inicioB, finB) {
  return inicioA < finB && inicioB < inicioA + 60;
}

// ── Hook: ocupa qué slot cada sala ────────────────────────────────────────────

/**
 * Devuelve una función: ocupada(roomId, dia, horaInicio) → boolean
 * Construida a partir de las actividades activas existentes.
 */
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
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '32px', boxShadow: 'var(--sombra)', maxWidth: '720px',
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
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [horaInicio, setHoraInicio] = useState('');

  const [salas, setSalas] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [actividadesActivas, setActividadesActivas] = useState([]);

  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const feriadoSeleccionado = useMemo(
    () => obtenerFeriadoArgentino(form.specific_date),
    [form.specific_date]
  );

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
  

  // ── Derivaciones: qué opciones están disponibles ───────────────────────────
  const profesoresDisponibles = useMemo(() => {
    if (!horaInicio) return profesores; // sin hora, no filtramos todavía

    return profesores.filter((prof) => {
      const nombreCompleto = `${prof.name} ${prof.lastname}`;
      return !actividadesActivas.some((act) => {
        if (!act.professor) return false;
        if (act.professor.trim().toLowerCase() !== nombreCompleto.trim().toLowerCase()) return false;

        // Verificar solapamiento de días
        let diasAct;
        if (act.activity_type === 'individual') {
          if (!act.specific_date) return false;
          diasAct = new Set([DIAS_SEMANA[new Date(`${act.specific_date}T00:00:00`).getDay()]]);
        } else {
          const s = (act.schedule || '').toLowerCase();
          diasAct = new Set(DIAS.filter((d) => s.includes(d.toLowerCase())));
        }

        let diasPropuesta;
        if (esIndividual) {
          if (!form.specific_date) return false;
          diasPropuesta = new Set([DIAS_SEMANA[new Date(`${form.specific_date}T00:00:00`).getDay()]]);
        } else {
          diasPropuesta = new Set(diasSeleccionados);
        }

        const hayDiaComun = [...diasPropuesta].some((d) => diasAct.has(d));
        if (!hayDiaComun) return false;

        // Verificar solapamiento de horario
        const [inicioExist, finExist] = rangoDeActividad(act);
        if (inicioExist === null) return false;
        const inicioProp = parseMinutes(horaInicio);
        return inicioProp < finExist && inicioExist < inicioProp + 60;
      });
    });
  }, [profesores, actividadesActivas, horaInicio, esIndividual, form.specific_date, diasSeleccionados]);

  
  const salasDisponibles = useMemo(() => {
    if (esIndividual) {
      if (!form.specific_date || !horaInicio) return salas; // sin filtro todavía
      const dia = DIAS_SEMANA[new Date(`${form.specific_date}T00:00:00`).getDay()];
      return salas.filter((sala) => !ocupada(sala.id, dia, horaInicio));
    }
    // Clase fija: si ya hay días y hora elegidos, filtra salas que tengan ese slot libre
    if (diasSeleccionados.length === 0 || !horaInicio) return salas;
    return salas.filter((sala) =>
      diasSeleccionados.every((dia) => !ocupada(sala.id, dia, horaInicio))
    );
  }, [salas, esIndividual, form.specific_date, horaInicio, diasSeleccionados, ocupada]);

  /**
   * Días disponibles: filtra los días que, para la sala elegida y la hora elegida,
   * ya están ocupados. Solo aplica a clase fija.
   */
  const diasDisponibles = useMemo(() => {
    if (esIndividual || !form.room_id || !horaInicio) return DIAS;
    return DIAS.filter((dia) => !ocupada(form.room_id, dia, horaInicio));
  }, [esIndividual, form.room_id, horaInicio, ocupada]);

  /**
   * Horarios disponibles: filtra los turnos que ya están ocupados para
   * la sala + días/fecha elegidos.
   */
  const horasDisponibles = useMemo(() => {
    if (!form.room_id) return HORAS;

    if (esIndividual) {
      if (!form.specific_date) return HORAS;
      const dia = DIAS_SEMANA[new Date(`${form.specific_date}T00:00:00`).getDay()];
      return HORAS.filter((h) => !ocupada(form.room_id, dia, h.valor));
    }

    if (diasSeleccionados.length === 0) return HORAS;
    // Solo muestra horarios libres en TODOS los días seleccionados
    return HORAS.filter((h) =>
      diasSeleccionados.every((dia) => !ocupada(form.room_id, dia, h.valor))
    );
  }, [form.room_id, esIndividual, form.specific_date, diasSeleccionados, ocupada]);

  // ── Side-effects de limpieza al cambiar tipo de clase ─────────────────────

 const handleChange = (e) => {
  const { name, value } = e.target;
  setForm((prev) => {
    const next = { ...prev, [name]: value };
    if (name === 'specialization') next.professor = '';
    if (name === 'activity_type') {
      next.specific_date = '';
      setDiasSeleccionados([]);
      setHoraInicio('');
    }
    if (name === 'specific_date' && value) {
      const dia = new Date(`${value}T00:00:00`).getDay();
      if (dia === 0 || dia === 6) {
        setError('Las actividades individuales no se pueden programar en fin de semana.');
        return { ...prev, [name]: '' }; // limpia la fecha inválida
      }
      setError('');
    }
    return next;
  });
};

  // Si la sala elegida ya no está disponible tras cambiar días/hora, la limpiamos
  useEffect(() => {
    if (form.room_id && !salasDisponibles.find((s) => s.id === Number(form.room_id))) {
      setForm((prev) => ({ ...prev, room_id: '' }));
    }
  }, [salasDisponibles, form.room_id]);

  // Si el horario elegido ya no está disponible, lo limpiamos
  useEffect(() => {
    if (horaInicio && !horasDisponibles.find((h) => h.valor === horaInicio)) {
      setHoraInicio('');
    }
  }, [horasDisponibles, horaInicio]);

  // Si días seleccionados ya no están disponibles, los quitamos
  useEffect(() => {
    setDiasSeleccionados((prev) => prev.filter((d) => diasDisponibles.includes(d)));
  }, [diasDisponibles]);

  const toggleDia = (dia) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const buildSchedule = () => {
    if (diasSeleccionados.length === 0 || !horaInicio) return '';
    const ordenados = DIAS.filter((d) => diasSeleccionados.includes(d));
    const horaFin = `${String(parseInt(horaInicio) + 1).padStart(2, '0')}:00`;
    return `${ordenados.join(', ')} · ${horaInicio}–${horaFin}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.room_id) return setError('Seleccioná una sala.');
    if (!form.specialization) return setError('Seleccioná una especialidad.');
    if (!horaInicio) return setError('Seleccioná un horario.');
    if (esIndividual && !form.specific_date) return setError('Seleccioná la fecha del turno.');
    if (esIndividual && feriadoSeleccionado.esFeriado) {
      return setError(`La fecha seleccionada es feriado (${feriadoSeleccionado.nombre}). Elegí otra fecha.`);
    }
    if (!esIndividual && diasSeleccionados.length === 0) return setError('Seleccioná al menos un día.');
    if (Number(form.capacity) <= 0) return setError('Los cupos deben ser mayor a 0.');
    if (Number(form.price) < 0) return setError('El precio no puede ser negativo.');

    const payload = {
      name: form.name.trim(),
      specialization: form.specialization,
      room_id: Number(form.room_id),
      activity_type: form.activity_type,
      schedule: esIndividual ? null : buildSchedule(),
      specific_date: esIndividual ? form.specific_date : null,
      time_slot: horaInicio,
      professor: form.professor || null,
      price: parseFloat(form.price),
      capacity: Number(form.capacity),
      description: form.description.trim() || null,
      requirements: form.requirements.trim() || null,
    };

    setGuardando(true);
    try {
      await createActivity(payload);
      navigate('/admin/actividades');
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
                style={s.input} name="name" value={form.name}
                onChange={handleChange} placeholder="Ej: Yoga Terapéutico, Pilates Grupal" required
              />
            </div>

            {/* Especialidad */}
            <div style={{ ...s.grupo, ...s.gridFull }}>
              <label style={s.label}>Especialidad *</label>
              <select style={s.select} name="specialization" value={form.specialization} onChange={handleChange} required>
                <option value="">— Seleccionar especialidad —</option>
                {ESPECIALIZACIONES.map((e) => <option key={e} value={e}>{e}</option>)}
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
                <option value="">— Seleccionar sala —</option>
                {salasDisponibles.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.name} (cap. {sala.capacity})
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha específica — solo clase individual */}
            {esIndividual && (
              <div style={s.grupo}>
                <label style={s.label}>Fecha del turno *</label>
                <input
                  style={s.input} type="date" name="specific_date"
                  value={form.specific_date} onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            )}

            {/* Selector de días — solo clase fija */}
            {!esIndividual && (
              <div style={{ ...s.grupo, ...s.gridFull }}>
                <label style={s.label}>Días *</label>
                <div style={s.diasRow}>
                  {diasDisponibles.map((dia) => (
                    <button
                      key={dia} type="button"
                      style={s.diaBtn(diasSeleccionados.includes(dia))}
                      onClick={() => toggleDia(dia)}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Horario — solo muestra los disponibles */}
            <div style={s.grupo}>
              <label style={s.label}>Horario *</label>
              <select style={s.select} value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)}>
                <option value="">— Seleccionar turno —</option>
                {horasDisponibles.map((h) => (
                  <option key={h.valor} value={h.valor}>{h.label}</option>
                ))}
              </select>
              {!esIndividual && diasSeleccionados.length > 0 && horaInicio && (
                <span style={s.hint}>Horario: {buildSchedule()}</span>
              )}
            </div>

            {/* Profesor */}
            <div style={s.grupo}>
              <label style={s.label}>
                Profesor {esIndividual ? '(opcional)' : '*'}
              </label>
              <select
                style={s.select} name="professor" value={form.professor}
                onChange={handleChange} disabled={!form.specialization}
              >
                <option value="">
                  {!form.specialization
                    ? '— Seleccioná primero una especialidad —'
                    : esIndividual
                    ? '— Sin asignar —'
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
                style={s.input} type="number" name="price" value={form.price}
                onChange={handleChange} min="0" step="0.01" placeholder="0.00" required
              />
            </div>

            {/* Cupos */}
            <div style={s.grupo}>
              <label style={s.label}>Cupos ofrecidos *</label>
              <input
                style={s.input} type="number" name="capacity" value={form.capacity}
                onChange={handleChange} min="1" placeholder="Ej: 8" required
              />
              {salaSeleccionada && (
                <span style={s.hint}>Máximo: {salaSeleccionada.capacity} (capacidad de la sala)</span>
              )}
            </div>

            {/* Descripción */}
            <div style={{ ...s.grupo, ...s.gridFull }}>
              <label style={s.label}>Descripción</label>
              <textarea
                style={s.textarea} name="description" value={form.description}
                onChange={handleChange} placeholder="Descripción de la actividad, beneficios, etc."
              />
            </div>

            {/* Requisitos */}
            <div style={{ ...s.grupo, ...s.gridFull }}>
              <label style={s.label}>Requisitos</label>
              <input
                style={s.input} name="requirements" value={form.requirements}
                onChange={handleChange} placeholder="Ej: Ropa cómoda, certificado médico"
              />
            </div>

          </div>

          <div style={s.acciones}>
            <button type="submit" style={s.botonPrimario} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Crear actividad'}
            </button>
            <button
              type="button" style={s.botonSecundario}
              onClick={() => navigate('/admin/actividades')} disabled={guardando}
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