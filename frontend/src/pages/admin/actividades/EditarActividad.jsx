import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getRooms } from '../../../services/roomsService';
import { getActivityById, updateActivity, getActivities } from '../../../services/activitiesService';
import { searchUsers } from '../../../services/usersService';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function parseMinutes(texto) {
  if (!texto) return null;
  const m = texto.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** Extrae la hora de inicio de una actividad (time_slot o primer horario del schedule) */
function parseHora(activity) {
  if (activity.time_slot) return activity.time_slot;
  if (activity.schedule) {
    const partes = activity.schedule.split(' · ');
    if (partes[1]) return partes[1].split('–')[0].trim();
  }
  return '';
}

function rangoDeActividad(act) {
  if (act.activity_type === 'individual') {
    const inicio = parseMinutes(act.time_slot);
    return inicio !== null ? [inicio, inicio + 60] : [null, null];
  }

  const matches = [...(act.schedule || '').matchAll(/(\d{1,2}):(\d{2})/g)];
  if (matches.length >= 2) {
    return [
      parseInt(matches[0][1], 10) * 60 + parseInt(matches[0][2], 10),
      parseInt(matches[1][1], 10) * 60 + parseInt(matches[1][2], 10),
    ];
  }

  const inicio = parseMinutes(act.time_slot || act.schedule);
  return inicio !== null ? [inicio, inicio + 60] : [null, null];
}

function diasDeActividad(act) {
  if (act.activity_type === 'individual') {
    if (!act.specific_date) return new Set();
    const d = new Date(`${act.specific_date}T00:00:00`);
    return new Set([DIAS_SEMANA[d.getDay()]]);
  }

  const s = (act.schedule || '').toLowerCase();
  return new Set(DIAS.filter((dia) => s.includes(dia.toLowerCase())));
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

function esMismoProfesor(profesorA, profesorB) {
  return profesorA.trim().toLowerCase() === profesorB.trim().toLowerCase();
}

const s = {
  card: {
    background: 'var(--color-fondo-card)',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: 'var(--sombra)',
    maxWidth: '640px',
  },
  titulo: { fontSize: '20px', fontWeight: '700', color: 'var(--color-texto)', marginBottom: '8px' },
  subtitulo: { fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '24px' },
  resumen: {
    background: 'var(--color-fondo)', borderRadius: '8px', padding: '14px 18px',
    marginBottom: '24px', fontSize: '14px', lineHeight: '1.7', color: 'var(--color-texto)',
  },
  grupo: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--color-texto-suave)' },
  select: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)',
    width: '100%', cursor: 'pointer',
  },
  hint: { fontSize: '12px', color: 'var(--color-texto-suave)', marginTop: '2px' },
  acciones: { display: 'flex', gap: '12px', marginTop: '12px' },
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

function EditarActividad() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [actividad, setActividad] = useState(null); // datos de solo lectura
  const [roomId, setRoomId] = useState('');
  const [professor, setProfessor] = useState('');
  const [salas, setSalas] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [actividadesActivas, setActividadesActivas] = useState([]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Carga la actividad, las salas y las actividades activas (para chequear disponibilidad)
  useEffect(() => {
    Promise.all([
      getActivityById(id),
      getRooms(),
      getActivities({ status: 'active' }),
    ])
      .then(([act, rooms, acts]) => {
        setActividad(act);
        setRoomId(act.room_id ?? '');
        setProfessor(act.professor ?? '');
        setSalas(rooms);
        setActividadesActivas(Array.isArray(acts) ? acts : []);
      })
      .catch(() => setError('No se pudo cargar la actividad.'));
  }, [id]);

  // Profesores con la misma especialidad que la actividad
  useEffect(() => {
    if (!actividad?.specialization) { setProfesores([]); return; }
    searchUsers('', 'professor', 'active')
      .then((lista) => {
        const filtrados = (Array.isArray(lista) ? lista : []).filter(
          (p) => p.specialization === actividad.specialization
        );
        setProfesores(filtrados);
      })
      .catch(() => setProfesores([]));
  }, [actividad?.specialization]);

  // Excluye la actividad actual de los chequeos de colisión
  const actividadesParaColision = useMemo(
    () => actividadesActivas.filter((a) => a.id !== Number(id)),
    [actividadesActivas, id]
  );
  const ocupada = useOcupaciones(actividadesParaColision);

  const diaActividad = actividad?.specific_date
    ? DIAS_SEMANA[new Date(`${actividad.specific_date}T00:00:00`).getDay()]
    : null;
  const horaActividad = actividad ? parseHora(actividad) : '';
  const salaOriginal = useMemo(
    () => salas.find((sala) => sala.id === actividad?.room_id),
    [salas, actividad?.room_id]
  );

  // Salas disponibles: con capacidad >= la del aula asignada originalmente y libres
  // en el día/horario fijo de esta actividad
  const salasDisponibles = useMemo(() => {
    let candidatas = salaOriginal
      ? salas.filter((sala) => sala.capacity >= salaOriginal.capacity)
      : salas;
    if (!diaActividad || !horaActividad) return candidatas;
    return candidatas.filter((sala) => !ocupada(sala.id, diaActividad, horaActividad));
  }, [salas, salaOriginal, diaActividad, horaActividad, ocupada]);

  // Profesores disponibles para el día/horario fijo de esta actividad
  const profesoresDisponibles = useMemo(() => {
    if (!actividad?.specialization) return [];
    if (!diaActividad || !horaActividad) return profesores;
    return profesores.filter((profesor) => {
      const nombreCompleto = `${profesor.name} ${profesor.lastname}`;
      return !actividadesActivas.some((act) => {
        if (act.id === Number(id)) return false;
        if (!act.professor) return false;
        if (!esMismoProfesor(act.professor, nombreCompleto)) return false;
        const diasAct = diasDeActividad(act);
        if (!diasAct.has(diaActividad)) return false;
        const [inicioExist, finExist] = rangoDeActividad(act);
        if (inicioExist === null) return false;
        const inicioProp = parseMinutes(horaActividad);
        return inicioProp < finExist && inicioExist < inicioProp + 60;
      });
    });
  }, [profesores, actividadesActivas, diaActividad, horaActividad, id, actividad?.specialization]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!roomId) return setError('Seleccioná una sala.');

    const payload = {
      room_id: Number(roomId),
      professor: professor || null,
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

  if (!actividad) {
    return (
      <LayoutPrivado titulo="Editar Actividad">
        {error ? <div style={s.error}>{error}</div> : <div style={s.cargando}>Cargando…</div>}
      </LayoutPrivado>
    );
  }

  return (
    <LayoutPrivado titulo="Editar Actividad">
      <div style={s.card}>
        <h2 style={s.titulo}>Editar actividad</h2>
        <p style={s.subtitulo}>Solo se puede reasignar la sala y/o el profesor. El resto de los datos quedan fijos.</p>

        {error && <div style={s.error}>{error}</div>}

        <div style={s.resumen}>
          <strong>{actividad.name}</strong><br />
          Especialidad: {actividad.specialization}<br />
          Tipo: {actividad.activity_type === 'fixed' ? 'Fija' : 'Individual'}<br />
          Horario: {actividad.specific_date ? `${actividad.specific_date} · ` : ''}{actividad.schedule || horaActividad || '—'}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.grupo}>
            <label style={s.label}>Sala *</label>
            <select style={s.select} value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
              <option value="">
                {salas.length > 0 && salasDisponibles.length === 0 ? 'No hay salas disponibles' : 'Seleccionar sala'}
              </option>
              {salasDisponibles.map((sala) => (
                <option key={sala.id} value={sala.id}>
                  {sala.name} (cap. {sala.capacity})
                </option>
              ))}
            </select>
            {salaOriginal && (
              <span style={s.hint}>Solo se muestran aulas con capacidad ≥ {salaOriginal.capacity} (la del aula asignada originalmente).</span>
            )}
          </div>

          <div style={s.grupo}>
            <label style={s.label}>
              Profesor {actividad.activity_type === 'individual' ? '(opcional)' : '*'}
            </label>
            <select
              style={s.select}
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
            >
              <option value="">
                {profesoresDisponibles.length === 0
                  ? 'No hay profesores disponibles'
                  : actividad.activity_type === 'individual'
                  ? 'Sin asignar'
                  : 'Seleccionar profesor'}
              </option>
              {profesoresDisponibles.map((p) => (
                <option key={p.id} value={`${p.name} ${p.lastname}`}>
                  {p.name} {p.lastname}
                </option>
              ))}
            </select>
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
