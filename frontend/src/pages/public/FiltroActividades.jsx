<<<<<<< HEAD
// Responsable: Angel
=======
// Responsable: Francis
>>>>>>> f84c9d7738836b02791283eb23a4f7be303a4a90
import { useState, useEffect, useMemo } from 'react';
import { getStaff } from '../../services/usersService';

/* ── Helpers ────────────────────────────────────────────── */
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const TIPOS = [
  { value: 'fixed', label: 'Clase fija' },
  { value: 'individual', label: 'Individual' },
];
const FRANJAS = ['Mañana', 'Tarde'];
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
<<<<<<< HEAD
=======
const HORAS = Array.from({ length: 8 }, (_, i) => {
  const h = 9 + i;
  return { valor: `${String(h).padStart(2, '0')}:00`, label: `${String(h).padStart(2, '0')}:00 – ${String(h + 1).padStart(2, '0')}:00` };
});
>>>>>>> f84c9d7738836b02791283eb23a4f7be303a4a90

const DIAS_COMPLETOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function obtenerDiaDesdeFecha(fecha) {
  if (!fecha) return null;
  const normalizada = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(normalizada.getTime())) return null;
  return DIAS_COMPLETOS[normalizada.getDay()] || null;
}

function extraerDias(schedule) {
  if (!schedule) return [];
  return DIAS.filter(d => schedule.toLowerCase().includes(d.toLowerCase()));
}

function obtenerDiasActividad(actividad) {
  if (!actividad) return [];

  if (actividad.activity_type === 'individual') {
    const diaDesdeFecha = obtenerDiaDesdeFecha(actividad.specific_date);
    return diaDesdeFecha ? [diaDesdeFecha] : [];
  }

  return extraerDias(actividad.schedule);
}

function extraerFranja(schedule, timeSlot) {
  const fuente = timeSlot || schedule || '';
  const match = fuente.match(/(\d{1,2}):\d{2}/);
  if (!match) return null;
  const h = Number(match[1]);
  if (h < 12) return 'Mañana';
  if (h < 17) return 'Tarde';
  return 'Noche';
}

const FILTROS_INICIAL = {
  busqueda: '',
  especialidad: '',
  tipo: '',
  dia: '',
  horario: '',
  profesor: '',
  precioMin: '',
  precioMax: '',
  soloCupos: false,
};

<<<<<<< HEAD
function aplicarFiltros(actividades, filtros, cuposMap = {}) {
=======
function aplicarFiltros(actividades, filtros) {
>>>>>>> f84c9d7738836b02791283eb23a4f7be303a4a90
  const textoBusqueda = filtros.busqueda.trim().toLowerCase();

  return actividades.filter(a => {
    if (textoBusqueda) {
      const texto = [a.name, a.specialization, a.description, a.requirements]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!texto.includes(textoBusqueda)) return false;
    }

    if (filtros.especialidad && a.specialization !== filtros.especialidad) return false;
    if (filtros.tipo && a.activity_type !== filtros.tipo) return false;
    if (filtros.dia && !obtenerDiasActividad(a).includes(filtros.dia)) return false;
    if (filtros.horario && extraerFranja(a.schedule, a.time_slot) !== filtros.horario) return false;
    if (filtros.profesor && a.professor !== filtros.profesor) return false;
    if (filtros.precioMin !== '' && Number(a.price) < Number(filtros.precioMin)) return false;
    if (filtros.precioMax !== '' && Number(a.price) > Number(filtros.precioMax)) return false;
<<<<<<< HEAD
    if (filtros.soloCupos && Number(cuposMap[a.id] ?? a.capacity ?? 0) <= 0) return false;
=======
    if (filtros.soloCupos && Number(a.available_spots ?? 0) <= 0) return false;
>>>>>>> f84c9d7738836b02791283eb23a4f7be303a4a90
    return true;
  });
}

/* ── Estilos ────────────────────────────────────────────── */
const s = {
  wrapper: {
    background: '#fff',
    border: '1px solid var(--color-borde)',
    borderRadius: '14px',
    padding: '18px 20px',
    marginBottom: '24px',
    boxShadow: 'var(--sombra)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  titulo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--color-texto)',
  },
  badge: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-primario-oscuro, #0d7377)',
    background: 'var(--color-primario-suave, #e8f5f5)',
    padding: '3px 10px',
    borderRadius: '999px',
  },
  limpiarBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primario)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
    gap: '12px',
    alignItems: 'end',
  },
  buscadorRow: {
    marginBottom: '12px',
  },
  grupo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-texto-suave)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  select: {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid var(--color-borde)',
    fontSize: '13px',
    color: 'var(--color-texto)',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
    width: '100%',
  },
  precioRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  inputPrecio: {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid var(--color-borde)',
    fontSize: '13px',
    color: 'var(--color-texto)',
    width: '100%',
    outline: 'none',
    minWidth: 0,
  },
  precioSep: {
    color: 'var(--color-texto-suave)',
    fontSize: '12px',
    flexShrink: 0,
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid var(--color-borde)',
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: '13px',
    color: 'var(--color-texto)',
  },
  checkbox: {
    width: '15px',
    height: '15px',
    accentColor: 'var(--color-primario)',
    cursor: 'pointer',
    flexShrink: 0,
  },
};

/* ── Componente ─────────────────────────────────────────── */
<<<<<<< HEAD
export default function FiltroActividades({ actividades = [], cuposMap = {}, onChange }) {
=======
export default function FiltroActividades({ actividades = [], onChange }) {
>>>>>>> f84c9d7738836b02791283eb23a4f7be303a4a90
  const [filtros, setFiltros] = useState(FILTROS_INICIAL);
  const [profesores, setProfesores] = useState([]);

  useEffect(() => {
    let cancelado = false;

    getStaff()
      .then(data => {
        if (cancelado) return;

        const lista = Array.isArray(data) ? data : [];
        const soloProfesores = lista
          .filter(persona => persona.role === 'professor')
          .map(persona => `${persona.name} ${persona.lastname}`.trim())
          .filter(Boolean)
          .sort();

        setProfesores(soloProfesores);
      })
      .catch(() => {
        if (cancelado) return;
        setProfesores([]);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Notificar resultado filtrado al padre
  useEffect(() => {
<<<<<<< HEAD
    onChange?.(aplicarFiltros(actividades, filtros, cuposMap));
  }, [filtros, actividades, cuposMap, onChange]);
=======
    onChange?.(aplicarFiltros(actividades, filtros));
  }, [filtros, actividades, onChange]);
>>>>>>> f84c9d7738836b02791283eb23a4f7be303a4a90

  const setFiltro = (campo) => (e) =>
    setFiltros(f => ({ ...f, [campo]: e.target.value }));

  const hayFiltros = Object.entries(filtros).some(([, v]) => v !== '' && v !== false);
<<<<<<< HEAD
  const totalFiltrado = useMemo(() => aplicarFiltros(actividades, filtros, cuposMap).length, [filtros, actividades, cuposMap]);
=======
  const totalFiltrado = useMemo(() => aplicarFiltros(actividades, filtros).length, [filtros, actividades]);
>>>>>>> f84c9d7738836b02791283eb23a4f7be303a4a90

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        <span style={s.titulo}>
          🔍 Filtrar actividades
          <span style={s.badge}>{totalFiltrado} resultado{totalFiltrado !== 1 ? 's' : ''}</span>
        </span>
        {hayFiltros && (
          <button style={s.limpiarBtn} onClick={() => setFiltros(FILTROS_INICIAL)}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      <div style={s.buscadorRow}>
        <div style={s.grupo}>
          <label style={s.label}>Buscar actividades</label>
          <input
            style={s.select}
            type="text"
            placeholder="Nombre, especialidad, descripción o requisitos"
            value={filtros.busqueda}
            onChange={setFiltro('busqueda')}
          />
        </div>
      </div>

      <div style={s.grid}>
        {/* Especialidad */}
        <div style={s.grupo}>
          <label style={s.label}>Especialidad</label>
          <select style={s.select} value={filtros.especialidad} onChange={setFiltro('especialidad')}>
            <option value="">Todas</option>
            {ESPECIALIZACIONES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {/* Tipo de clase */}
        <div style={s.grupo}>
          <label style={s.label}>Tipo de clase</label>
          <select style={s.select} value={filtros.tipo} onChange={setFiltro('tipo')}>
            <option value="">Todos</option>
            {TIPOS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Día */}
        <div style={s.grupo}>
          <label style={s.label}>Día</label>
          <select style={s.select} value={filtros.dia} onChange={setFiltro('dia')}>
            <option value="">Todos</option>
            {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Horario */}
        <div style={s.grupo}>
          <label style={s.label}>Horario</label>
          <select style={s.select} value={filtros.horario} onChange={setFiltro('horario')}>
            <option value="">Cualquiera</option>
            {FRANJAS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        {/* Profesor */}
        <div style={s.grupo}>
          <label style={s.label}>Profesor</label>
          <select style={s.select} value={filtros.profesor} onChange={setFiltro('profesor')}>
            <option value="">Todos</option>
            {profesores.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Precio */}
        <div style={s.grupo}>
          <label style={s.label}>Precio ($)</label>
          <div style={s.precioRow}>
            <input
              type="number"
              placeholder="Mín"
              style={s.inputPrecio}
              value={filtros.precioMin}
              onChange={setFiltro('precioMin')}
              min={0}
            />
            <span style={s.precioSep}>–</span>
            <input
              type="number"
              placeholder="Máx"
              style={s.inputPrecio}
              value={filtros.precioMax}
              onChange={setFiltro('precioMax')}
              min={0}
            />
          </div>
        </div>

        {/* Cupos */}
        <div style={s.grupo}>
          <label style={s.label}>Cupos</label>
          <label style={s.checkLabel}>
            <input
              type="checkbox"
              style={s.checkbox}
              checked={filtros.soloCupos}
              onChange={e => setFiltros(f => ({ ...f, soloCupos: e.target.checked }))}
            />
            Solo con cupos disponibles
          </label>
        </div>
      </div>
    </div>
  );
}