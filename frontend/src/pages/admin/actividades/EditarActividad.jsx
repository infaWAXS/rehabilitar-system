import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getRooms } from '../../../services/roomsService';
import { getActivityById, updateActivity } from '../../../services/activitiesService';
import { searchUsers } from '../../../services/usersService';

// ── Constantes ─────────────────────────────────────────────────────────────────

const ESPECIALIZACIONES = [
  'Kinesiologia deportiva',
  'Fisioterapia',
  'Kinesiologia neurologica',
  'Rehabilitacion cardiovascular',
  'Kinesiologia traumatologica',
  'Pilates terapeutico',
  'Kinesiologia pediatrica',
  'Osteopatia',
  'Acupuntura',
  'Masoterapia',
  'Kinesiologia respiratoria',
  'Rehabilitacion post-quirurgica',
  'Kinesiologia gerontologica',
  'Electroterapia',
];

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const HORAS = Array.from({ length: 8 }, (_, i) => {
  const h = 9 + i;
  return { valor: `${String(h).padStart(2, '0')}:00`, label: `${String(h).padStart(2, '0')}:00 – ${String(h + 1).padStart(2, '0')}:00` };
});

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
  cargando: { padding: '48px', textAlign: 'center', color: 'var(--color-texto-suave)' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Extrae los días seleccionados de un schedule como "Lunes, Miércoles · 09:00–10:00" */
function parseDias(schedule) {
  if (!schedule) return [];
  const [diasParte] = schedule.split(' · ');
  return diasParte ? diasParte.split(', ').filter((d) => DIAS.includes(d)) : [];
}

/** Extrae la hora de inicio de un schedule o time_slot */
function parseHora(activity) {
  if (activity.time_slot) return activity.time_slot;
  if (activity.schedule) {
    const partes = activity.schedule.split(' · ');
    if (partes[1]) return partes[1].split('–')[0].trim();
  }
  return '';
}

// ── Componente ─────────────────────────────────────────────────────────────────

function EditarActividad() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [horaInicio, setHoraInicio] = useState('');
  const [salas, setSalas] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Carga actividad y salas en paralelo
  useEffect(() => {
    Promise.all([getActivityById(id), getRooms()])
      .then(([actividad, rooms]) => {
        setSalas(rooms);
        setDiasSeleccionados(parseDias(actividad.schedule));
        setHoraInicio(parseHora(actividad));
        setForm({
          name:          actividad.name ?? '',
          specialization: actividad.specialization ?? '',
          room_id:       actividad.room_id ?? '',
          activity_type: actividad.activity_type ?? 'fixed',
          price:         actividad.price ?? '',
          capacity:      actividad.capacity ?? '',
          description:   actividad.description ?? '',
          requirements:  actividad.requirements ?? '',
          specific_date: actividad.specific_date ?? '',
          professor:     actividad.professor ?? '',
        });
      })
      .catch(() => setError('No se pudo cargar la actividad.'));
  }, [id]);

  // Recarga profesores cuando cambia la especialidad
  useEffect(() => {
    if (!form?.specialization) { setProfesores([]); return; }
    searchUsers('', 'professor', 'active')
      .then((lista) => {
        const filtrados = (Array.isArray(lista) ? lista : []).filter(
          (p) => p.specialization === form.specialization
        );
        setProfesores(filtrados);
      })
      .catch(() => setProfesores([]));
  }, [form?.specialization]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'specialization') {
      setForm((prev) => ({ ...prev, specialization: value, professor: '' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

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

    const esIndividual = form.activity_type === 'individual';

    if (!form.room_id) return setError('Seleccioná una sala.');
    if (!form.specialization) return setError('Seleccioná una especialidad.');
    if (!horaInicio) return setError('Seleccioná un horario.');
    if (esIndividual && !form.specific_date) return setError('Seleccioná la fecha del turno.');
    if (!esIndividual && diasSeleccionados.length === 0) return setError('Seleccioná al menos un día.');
    if (Number(form.capacity) <= 0) return setError('Los cupos deben ser mayor a 0.');
    if (Number(form.price) < 0) return setError('El precio no puede ser negativo.');

    const payload = {
      name:          form.name.trim(),
      specialization: form.specialization,
      room_id:       Number(form.room_id),
      activity_type: form.activity_type,
      schedule:      esIndividual ? null : buildSchedule(),
      specific_date: esIndividual ? form.specific_date : null,
      time_slot:     horaInicio,
      professor:     form.professor || null,
      price:         parseFloat(form.price),
      capacity:      Number(form.capacity),
      description:   form.description.trim() || null,
      requirements:  form.requirements.trim() || null,
    };

    setGuardando(true);
    try {
      await updateActivity(id, payload);
      navigate('/admin/actividades');
    } catch (err) {
      setError(err.message || 'Error al guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  const salaSeleccionada = salas.find((r) => r.id === Number(form?.room_id));

  if (!form) {
    return (
      <LayoutPrivado titulo="Editar Actividad">
        {error
          ? <div style={s.error}>{error}</div>
          : <div style={s.cargando}>Cargando…</div>}
      </LayoutPrivado>
    );
  }

  return (
    <LayoutPrivado titulo="Editar Actividad">
      <div style={s.card}>
        <h2 style={s.titulo}>Editar actividad</h2>

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

            {/* Sala */}
            <div style={s.grupo}>
              <label style={s.label}>Sala *</label>
              <select style={s.select} name="room_id" value={form.room_id} onChange={handleChange} required>
                <option value="">— Seleccionar sala —</option>
                {salas.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.name} (cap. {sala.capacity})
                  </option>
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

            {/* Selector de días — solo para clase fija */}
            {form.activity_type === 'fixed' && (
              <div style={{ ...s.grupo, ...s.gridFull }}>
                <label style={s.label}>Días *</label>
                <div style={s.diasRow}>
                  {DIAS.map((dia) => (
                    <button
                      key={dia}
                      type="button"
                      style={s.diaBtn(diasSeleccionados.includes(dia))}
                      onClick={() => toggleDia(dia)}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fecha específica — solo para clase individual */}
            {form.activity_type === 'individual' && (
              <div style={s.grupo}>
                <label style={s.label}>Fecha del turno *</label>
                <input
                  style={s.input}
                  type="date"
                  name="specific_date"
                  value={form.specific_date}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* Selector de horario */}
            <div style={s.grupo}>
              <label style={s.label}>Horario *</label>
              <select
                style={s.select}
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              >
                <option value="">— Seleccionar turno —</option>
                {HORAS.map((h) => (
                  <option key={h.valor} value={h.valor}>{h.label}</option>
                ))}
              </select>
              {form.activity_type === 'fixed' && diasSeleccionados.length > 0 && horaInicio && (
                <span style={s.hint}>Horario: {buildSchedule()}</span>
              )}
            </div>

            {/* Profesor — opcional para clases individuales */}
            <div style={s.grupo}>
              <label style={s.label}>
                Profesor {form.activity_type === 'individual' ? '(opcional)' : '*'}
              </label>
              <select
                style={s.select}
                name="professor"
                value={form.professor}
                onChange={handleChange}
                disabled={!form.specialization}
              >
                <option value="">
                  {!form.specialization
                    ? '— Seleccioná primero una especialidad —'
                    : form.activity_type === 'individual'
                    ? '— Sin asignar —'
                    : profesores.length === 0
                    ? '— Sin profesores con esa especialidad —'
                    : '— Seleccionar profesor —'}
                </option>
                {profesores.map((p) => (
                  <option key={p.id} value={`${p.name} ${p.lastname}`}>
                    {p.name} {p.lastname}
                  </option>
                ))}
                {/* Si el profesor actual no está en la lista filtrada, mostrarlo igual */}
                {form.professor && !profesores.some((p) => `${p.name} ${p.lastname}` === form.professor) && (
                  <option value={form.professor}>{form.professor}</option>
                )}
              </select>
            </div>

            {/* Precio */}
            <div style={s.grupo}>
              <label style={s.label}>Precio ($) *</label>
              <input
                style={s.input}
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            {/* Cupos */}
            <div style={s.grupo}>
              <label style={s.label}>Cupos ofrecidos *</label>
              <input
                style={s.input}
                type="number"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                min="1"
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
              {guardando ? 'Guardando…' : 'Guardar cambios'}
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

export default EditarActividad;
