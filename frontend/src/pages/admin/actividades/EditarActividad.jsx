<<<<<<< HEAD
﻿import React, { useState, useEffect, useMemo } from 'react';

=======
import React, { useState, useEffect, useMemo } from 'react';
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)
import { useNavigate, useParams } from 'react-router-dom';

import LayoutPrivado from '../../../layouts/LayoutPrivado';

import { getRooms } from '../../../services/roomsService';
<<<<<<< HEAD

import { getActivityById, updateActivity, getActivities } from '../../../services/activitiesService';

=======
import { getActivityById, updateActivity, getActivities } from '../../../services/activitiesService';
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)
import { searchUsers } from '../../../services/usersService';
import { obtenerFeriadoArgentino } from '../../../utils/feriados';

import { obtenerFeriadoArgentino } from '../../../utils/feriados';



// Constantes 



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
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];



const HORAS = Array.from({ length: 8 }, (_, i) => {

  const h = 9 + i;

  return { valor: `${String(h).padStart(2, '0')}:00`, label: `${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00` };

});

<<<<<<< HEAD


function esFinDeSemana(fechaTexto) {

  if (!fechaTexto) return false;

  const fecha = new Date(`${fechaTexto}T00:00:00`);

  if (Number.isNaN(fecha.getTime())) return false;

  const dia = fecha.getDay();

  return dia === 0 || dia === 6;

}



function parseMinutes(texto) {

  if (!texto) return null;

  const m = texto.match(/(\d{1,2}):(\d{2})/);

  if (!m) return null;

  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);

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



// ?????? Estilos ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????


=======
function esFinDeSemana(fechaTexto) {
  if (!fechaTexto) return false;
  const fecha = new Date(`${fechaTexto}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return false;
  const dia = fecha.getDay();
  return dia === 0 || dia === 6;
}

function parseMinutes(texto) {
  if (!texto) return null;
  const m = texto.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
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

// ── Estilos ────────────────────────────────────────────────────────────────────
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)

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



// ?????? Helpers ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????



/** Extrae los d??as seleccionados de un schedule como "Lunes, Mi??rcoles ?? 09:00???10:00" */

function parseDias(schedule) {

  if (!schedule) return [];

  const [diasParte] = schedule.split(' ?? ');

  return diasParte ? diasParte.split(', ').filter((d) => DIAS.includes(d)) : [];

}



/** Extrae la hora de inicio de un schedule o time_slot */

function parseHora(activity) {

  if (activity.time_slot) return activity.time_slot;

  if (activity.schedule) {

    const partes = activity.schedule.split(' ?? ');

    if (partes[1]) return partes[1].split('???')[0].trim();

  }

  return '';

}

<<<<<<< HEAD


function esMismoProfesor(profesorA, profesorB) {

  return profesorA.trim().toLowerCase() === profesorB.trim().toLowerCase();

}



// ?????? Componente ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????


=======
function esMismoProfesor(profesorA, profesorB) {
  return profesorA.trim().toLowerCase() === profesorB.trim().toLowerCase();
}

// ── Componente ─────────────────────────────────────────────────────────────────
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)

function EditarActividad() {

  const { id } = useParams();

  const navigate = useNavigate();

<<<<<<< HEAD


  const [form, setForm] = useState(null);

  const [horaInicio, setHoraInicio] = useState('');

  const [salas, setSalas] = useState([]);

  const [profesores, setProfesores] = useState([]);

  const [actividadesActivas, setActividadesActivas] = useState([]);

  const [error, setError] = useState('');

  const [guardando, setGuardando] = useState(false);
  const feriadoSeleccionado = useMemo(
    () => obtenerFeriadoArgentino(form?.specific_date),
    [form?.specific_date]
  );

=======
  const [form, setForm] = useState(null);
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [horaInicio, setHoraInicio] = useState('');
  const [salas, setSalas] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [actividadesActivas, setActividadesActivas] = useState([]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const feriadoSeleccionado = useMemo(
    () => obtenerFeriadoArgentino(form?.specific_date),
    [form?.specific_date]
  );

>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)
  const esIndividual = form?.activity_type === 'individual';
  const ocupada = useOcupaciones(
    actividadesActivas.filter((actividad) => actividad.id !== Number(id))
  );

<<<<<<< HEAD
  const feriadoSeleccionado = useMemo(

    () => obtenerFeriadoArgentino(form?.specific_date),

    [form?.specific_date]

  );



  const esIndividual = form?.activity_type === 'individual';

  // Excluye la actividad actual y las actividades hermanas (mismo día-semana pero distinta
  // specific_date) para que no bloqueen falsamente la sala/horario al editar una repetición.
  const actividadesParaColision = useMemo(
    () => actividadesActivas.filter((a) => {
      if (a.id === Number(id)) return false;
      if (form?.specific_date && a.specific_date && a.specific_date !== form.specific_date) return false;
      return true;
    }),
    [actividadesActivas, id, form?.specific_date]
  );

  const ocupada = useOcupaciones(actividadesParaColision);



  // Carga actividad, salas y actividades activas

  useEffect(() => {

    Promise.all([

      getActivityById(id),

      getRooms(),

      getActivities({ status: 'active' }),

    ])

      .then(([actividad, rooms, acts]) => {

        setSalas(rooms);

        setActividadesActivas(Array.isArray(acts) ? acts : []);

=======
  // Carga actividad, salas y actividades activas
  useEffect(() => {
    Promise.all([
      getActivityById(id),
      getRooms(),
      getActivities({ status: 'active' }),
    ])
      .then(([actividad, rooms, acts]) => {
        setSalas(rooms);
        setActividadesActivas(Array.isArray(acts) ? acts : []);
        setDiasSeleccionados(parseDias(actividad.schedule));
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)
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
  
  const profesoresDisponibles = useMemo(() => {
    if (!form?.specialization) return [];
    if (esIndividual && !form.specific_date) return profesores;
    if (!horaInicio) return profesores;

    return profesores.filter((profesor) => {
      const nombreCompleto = `${profesor.name} ${profesor.lastname}`;
      return !actividadesActivas.some((actividad) => {
        if (actividad.id === Number(id)) return false;
        if (!actividad.professor) return false;
        if (!esMismoProfesor(actividad.professor, nombreCompleto)) return false;

        let diasActividad;
        if (actividad.activity_type === 'individual') {
          if (!actividad.specific_date) return false;
          diasActividad = new Set([DIAS_SEMANA[new Date(`${actividad.specific_date}T00:00:00`).getDay()]]);
        } else {
          const s = (actividad.schedule || '').toLowerCase();
          diasActividad = new Set(DIAS.filter((dia) => s.includes(dia.toLowerCase())));
        }

        let diasPropuesta;
        if (esIndividual) {
          if (!form.specific_date) return false;
          diasPropuesta = new Set([DIAS_SEMANA[new Date(`${form.specific_date}T00:00:00`).getDay()]]);
        } else {
          diasPropuesta = new Set(diasSeleccionados);
        }

        const hayDiaComun = [...diasPropuesta].some((dia) => diasActividad.has(dia));
        if (!hayDiaComun) return false;

        const [inicioExist, finExist] = rangoDeActividad(actividad);
        if (inicioExist === null) return false;
        const inicioProp = parseMinutes(horaInicio);
        return inicioProp < finExist && inicioExist < inicioProp + 60;
      });
    });
  }, [profesores, actividadesActivas, horaInicio, esIndividual, form?.specific_date, diasSeleccionados, id]);

  const salasDisponibles = useMemo(() => {
    if (esIndividual) {
      if (!form?.specific_date || !horaInicio) return salas;
      const dia = DIAS_SEMANA[new Date(`${form.specific_date}T00:00:00`).getDay()];
      return salas.filter((sala) => !ocupada(sala.id, dia, horaInicio));
    }

    if (diasSeleccionados.length === 0 || !horaInicio) return salas;
    return salas.filter((sala) => diasSeleccionados.every((dia) => !ocupada(sala.id, dia, horaInicio)));
  }, [salas, esIndividual, form?.specific_date, horaInicio, diasSeleccionados, ocupada]);

  const diasDisponibles = useMemo(() => {
    if (esIndividual || !form?.room_id || !horaInicio) return DIAS;
    return DIAS.filter((dia) => !ocupada(form.room_id, dia, horaInicio));
  }, [esIndividual, form?.room_id, horaInicio, ocupada]);

  const horasDisponibles = useMemo(() => {
    if (!form?.room_id) return HORAS;

    if (esIndividual) {
      if (!form.specific_date) return HORAS;
      const dia = DIAS_SEMANA[new Date(`${form.specific_date}T00:00:00`).getDay()];
      return HORAS.filter((hora) => !ocupada(form.room_id, dia, hora.valor));
    }

    if (diasSeleccionados.length === 0) return HORAS;
    return HORAS.filter((hora) => diasSeleccionados.every((dia) => !ocupada(form.room_id, dia, hora.valor)));
  }, [form?.room_id, esIndividual, form?.specific_date, diasSeleccionados, ocupada]);

  useEffect(() => {
    if (form?.room_id && !salasDisponibles.find((sala) => sala.id === Number(form.room_id))) {
      setForm((prev) => ({ ...prev, room_id: '' }));
    }
  }, [salasDisponibles, form?.room_id]);

  useEffect(() => {
    if (horaInicio && !horasDisponibles.find((hora) => hora.valor === horaInicio)) {
      setHoraInicio('');
    }
  }, [horasDisponibles, horaInicio]);

  useEffect(() => {
    setDiasSeleccionados((prev) => prev.filter((dia) => diasDisponibles.includes(dia)));
  }, [diasDisponibles]);

  

  const profesoresDisponibles = useMemo(() => {
    if (!form?.specialization) return [];
    if (!form?.specific_date || !horaInicio) return profesores;
    const diaFormulario = DIAS_SEMANA[new Date(`${form.specific_date}T00:00:00`).getDay()];
    return profesores.filter((profesor) => {
      const nombreCompleto = `${profesor.name} ${profesor.lastname}`;
      return !actividadesActivas.some((actividad) => {
        if (actividad.id === Number(id)) return false;
        if (!actividad.professor) return false;
        if (!esMismoProfesor(actividad.professor, nombreCompleto)) return false;
        const diasActividad = diasDeActividad(actividad);
        if (!diasActividad.has(diaFormulario)) return false;
        const [inicioExist, finExist] = rangoDeActividad(actividad);
        if (inicioExist === null) return false;
        const inicioProp = parseMinutes(horaInicio);
        return inicioProp < finExist && inicioExist < inicioProp + 60;
      });
    });
  }, [profesores, actividadesActivas, horaInicio, form?.specific_date, id]);



  const salasDisponibles = useMemo(() => {
    if (!form?.specific_date || !horaInicio) return salas;
    const dia = DIAS_SEMANA[new Date(`${form.specific_date}T00:00:00`).getDay()];
    return salas.filter((sala) => !ocupada(sala.id, dia, horaInicio));
  }, [salas, form?.specific_date, horaInicio, ocupada]);



  const horasDisponibles = useMemo(() => {
    if (!form?.room_id || !form?.specific_date) return HORAS;
    const dia = DIAS_SEMANA[new Date(`${form.specific_date}T00:00:00`).getDay()];
    return HORAS.filter((hora) => !ocupada(form.room_id, dia, hora.valor));
  }, [form?.room_id, form?.specific_date, ocupada]);



  useEffect(() => {

    if (form?.room_id && !salasDisponibles.find((sala) => sala.id === Number(form.room_id))) {

      setForm((prev) => ({ ...prev, room_id: '' }));

    }

  }, [salasDisponibles, form?.room_id]);



  useEffect(() => {

    if (horaInicio && !horasDisponibles.find((hora) => hora.valor === horaInicio)) {

      setHoraInicio('');

    }

  }, [horasDisponibles, horaInicio]);





  const handleChange = (e) => {
    const { name, value } = e.target;
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

    if (name === 'specialization') {
<<<<<<< HEAD
      setForm((prev) => ({ ...prev, specialization: newValue, professor: '' }));
    } else if (name === 'activity_type') {
      setForm((prev) => ({
        ...prev,
        activity_type: newValue,
        specific_date: '',
      }));
=======
      setForm((prev) => ({ ...prev, specialization: value, professor: '' }));
    } else if (name === 'activity_type') {
      setForm((prev) => ({
        ...prev,
        activity_type: value,
        specific_date: '',
      }));
      setDiasSeleccionados([]);
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)
      setHoraInicio('');
    } else {
      setForm((prev) => ({ ...prev, [name]: newValue }));
    }
  };

<<<<<<< HEAD
=======
  const toggleDia = (dia) => {
    if (!diasDisponibles.includes(dia)) return;
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)


  const handleSubmit = async (e) => {

    e.preventDefault();

    setError('');

<<<<<<< HEAD


=======
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)
    if (!form.room_id) return setError('Seleccioná una sala.');

    if (!form.specialization) return setError('Seleccioná una especialidad.');

    if (!horaInicio) return setError('Seleccioná un horario.');
<<<<<<< HEAD

    if (!form.specific_date) return setError('Seleccioná la fecha.');

    if (feriadoSeleccionado.esFeriado) {

      return setError(`La fecha seleccionada es feriado (${feriadoSeleccionado.nombre}). Eleg?? otra fecha.`);

    }

    if (esFinDeSemana(form.specific_date)) {

      return setError('Las actividades no se pueden programar en fin de semana.');

    }

=======
    if (esIndividual && !form.specific_date) return setError('Seleccioná la fecha del turno.');
    if (esIndividual && feriadoSeleccionado.esFeriado) {
      return setError(`La fecha seleccionada es feriado (${feriadoSeleccionado.nombre}). Elegí otra fecha.`);
    }
    if (esIndividual && esFinDeSemana(form.specific_date)) {
      return setError('Las actividades individuales no se pueden programar en fin de semana.');
    }
    if (!esIndividual && diasSeleccionados.length === 0) return setError('Seleccioná al menos un día.');
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)
    if (Number(form.capacity) <= 0) return setError('Los cupos deben ser mayor a 0.');

    if (Number(form.price) < 0) return setError('El precio no puede ser negativo.');



    const payload = {

      name:          form.name.trim(),

      specialization: form.specialization,

      room_id:       Number(form.room_id),

      activity_type: form.activity_type,

      specific_date: form.specific_date || null,

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

<<<<<<< HEAD


  const salaSeleccionada = salasDisponibles.find((r) => r.id === Number(form?.room_id));


=======
  const salaSeleccionada = salasDisponibles.find((r) => r.id === Number(form?.room_id));
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)

  if (!form) {

    return (

      <LayoutPrivado titulo="Editar Actividad">

        {error

          ? <div style={s.error}>{error}</div>

          : <div style={s.cargando}>Cargando</div>}

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

                <option value=""> Seleccionar especialidad </option>

                {ESPECIALIZACIONES.map((e) => (

                  <option key={e} value={e}>{e}</option>

                ))}

              </select>

            </div>



            {/* Sala */}

            <div style={s.grupo}>

              <label style={s.label}>Sala *</label>

              <select style={s.select} name="room_id" value={form.room_id} onChange={handleChange} required>
<<<<<<< HEAD
<<<<<<< HEAD

                <option value="">

                  {salas.length > 0 && salasDisponibles.length === 0

                    ? ' No hay salas disponibles '

                    : ' Seleccionar sala '}

                </option>

=======
                <option value="">
                  {salas.length > 0 && salasDisponibles.length === 0
                    ? '— No hay salas disponibles —'
                    : '— Seleccionar sala —'}
                </option>
>>>>>>> 824a1f5 (Agrego la cantidad de cupos disponibles en Ver Actividades)
                {salasDisponibles.map((sala) => (

=======
                <option value="">— Seleccionar sala —</option>
                {salasDisponibles.map((sala) => (
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)
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

<<<<<<< HEAD
=======
            {/* Selector de días — solo para clase fija */}
            {form.activity_type === 'fixed' && (
              <div style={{ ...s.grupo, ...s.gridFull }}>
                <label style={s.label}>Días *</label>
                <div style={s.diasRow}>
                  {diasDisponibles.map((dia) => (
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
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)


            {/* Fecha */}

            <div style={s.grupo}>

              <label style={s.label}>{esIndividual ? 'Fecha del turno *' : 'Fecha de la actividad *'}</label>

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


<<<<<<< HEAD
=======
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
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <span style={s.hint}>
                  {feriadoSeleccionado.esFeriado
                    ? `No hay fecha disponible: feriado (${feriadoSeleccionado.nombre}).`
                    : 'Elegí una fecha disponible para el turno.'}
                </span>
              </div>
            )}
>>>>>>> 824a1f5 (Agrego la cantidad de cupos disponibles en Ver Actividades)

            {/* Selector de horario */}

            <div style={s.grupo}>

              <label style={s.label}>Horario *</label>

              <select

                style={s.select}

                value={horaInicio}

                onChange={(e) => setHoraInicio(e.target.value)}

              >
<<<<<<< HEAD
<<<<<<< HEAD

                <option value="">

                  {horasDisponibles.length === 0

                    ? ' No hay horarios disponibles '

                    : ' Seleccionar turno '}

                </option>

=======
                <option value="">
                  {horasDisponibles.length === 0
                    ? '— No hay horarios disponibles —'
                    : '— Seleccionar turno —'}
                </option>
>>>>>>> 824a1f5 (Agrego la cantidad de cupos disponibles en Ver Actividades)
                {horasDisponibles.map((h) => (

=======
                <option value="">— Seleccionar turno —</option>
                {horasDisponibles.map((h) => (
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)
                  <option key={h.valor} value={h.valor}>{h.label}</option>

                ))}

              </select>

              {horaInicio && form.specific_date && (

                <span style={s.hint}>

                  {`${form.specific_date} · ${horaInicio}–${String(parseInt(horaInicio) + 1).padStart(2, '0')}:00`}

                </span>

              )}

            </div>



            {/* Profesor ??? opcional para clases individuales */}

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
<<<<<<< HEAD

                    ? ' Seleccioná primero una especialidad '

                    : profesoresDisponibles.length === 0

                    ? ' No hay profesores disponibles '

=======
                    ? '— Seleccioná primero una especialidad —'
                    : profesoresDisponibles.length === 0
                    ? '— No hay profesores disponibles —'
>>>>>>> 824a1f5 (Agrego la cantidad de cupos disponibles en Ver Actividades)
                    : form.activity_type === 'individual'
<<<<<<< HEAD

                    ? ' Sin asignar '
                    : ' Seleccionar profesor'}

                </option>

                {profesoresDisponibles.map((p) => (

=======
                    ? '— Sin asignar —'
                    : '— Seleccionar profesor —'}
                </option>
                {profesoresDisponibles.map((p) => (
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)
                  <option key={p.id} value={`${p.name} ${p.lastname}`}>

                    {p.name} {p.lastname}

                  </option>

                ))}
<<<<<<< HEAD

=======
>>>>>>> 910b3a2 (Corrijo la creación y modificación de actividades)
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

                <span style={s.hint}>M??ximo: {salaSeleccionada.capacity} (capacidad de la sala)</span>

              )}

            </div>



            {/* Descripci??n */}

            <div style={{ ...s.grupo, ...s.gridFull }}>

              <label style={s.label}>Descripci??n</label>

              <textarea

                style={s.textarea}

                name="description"

                value={form.description}

                onChange={handleChange}

                placeholder="Descripcion de la actividad, beneficios, etc."

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

