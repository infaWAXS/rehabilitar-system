// Responsable: Nahuel - HU Dar de baja en lista de espera
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getMyWaitlist, removeWaitlistItem } from '../../../services/waitlistService';
import { getActivities } from '../../../services/activitiesService';

const s = {
  wrapper: { maxWidth: '640px', margin: '0 auto' },
  card: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--sombra)', marginBottom: '20px' },
  tituloPage: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', marginBottom: '8px' },
  descripcionPage: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '28px' },
  tituloActividad: { fontSize: '16px', fontWeight: '700', color: 'var(--color-texto)', margin: '0 0 8px 0' },
  badge: (tipo) => ({
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    background: tipo === 'priority' ? '#eff6ff' : '#f3f4f6',
    color: tipo === 'priority' ? '#1d4ed8' : '#374151',
    border: `1px solid ${tipo === 'priority' ? '#bfdbfe' : '#e5e7eb'}`,
    marginBottom: '12px'
  }),
  infoBox: (color) => ({
    background: color === 'blue' ? '#eff6ff' : color === 'yellow' ? '#fefce8' : '#f0fdf4',
    border: `1px solid ${color === 'blue' ? '#bfdbfe' : color === 'yellow' ? '#fde047' : '#86efac'}`,
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '13px',
    marginBottom: '16px',
    color: color === 'blue' ? '#1d4ed8' : color === 'yellow' ? '#854d0e' : '#15803d',
  }),
  metaText: { fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '6px' },
  botones: { display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' },
  btnPeligro: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: '#dc2626',
    color: '#fff',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
  },
  btnPrimario: {
    padding: '10px 24px',
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
  exito: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px',
    padding: '14px 18px',
    color: '#15803d',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '20px',
  },
  listaVacia: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'var(--color-texto-suave)',
    fontSize: '14px'
  }
};

function BajaListaEspera() {
  const navigate = useNavigate();
  const [listaEspera, setListaEspera] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => { cargarLista(); }, []);

  const cargarLista = async () => {
    setCargando(true);
    setError('');
    try {
      const [waitlist, actividades] = await Promise.all([
        getMyWaitlist(),
        getActivities(),
      ]);
      const actMap = Object.fromEntries(actividades.map(a => [a.id, a]));
      setListaEspera(waitlist.map(item => {
        const act = actMap[item.activity_id] || {};
        let turno = '—';
        if (act.specific_date) {
          const fecha = new Date(`${act.specific_date}T00:00:00`);
          const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          const dia = dias[fecha.getDay()];
          const dia_num = fecha.getDate().toString().padStart(2, '0');
          const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
          const anio = fecha.getFullYear();
          turno = `${dia} ${dia_num}/${mes}/${anio}`;
          if (act.time_slot) turno += ` · ${act.time_slot}`;
        } else {
          turno = act.schedule || act.time_slot || '—';
        }
        return {
          ...item,
          nombre: act.name || `Actividad #${item.activity_id}`,
          turno,
          posicion: item.position,
          tipo: item.waitlist_type,
        };
      }));
    } catch (err) {
      setError(err.message || 'Error al cargar la lista de espera.');
    } finally {
      setCargando(false);
    }
  };

  const handleConfirmarBaja = async (id, nombreActividad) => {
    try {
      await removeWaitlistItem(id);
      setListaEspera(prev => prev.filter(item => item.id !== id));
      setConfirmandoId(null);
      setMensajeExito(`Baja registrada con éxito. Se envió un mail confirmando la baja de "${nombreActividad}" a tu casilla.`);
      setTimeout(() => setMensajeExito(''), 7000);
    } catch (err) {
      setError(err.message || 'Error al dar de baja.');
    }
  };

  const handleCancelarBaja = () => {
    setConfirmandoId(null);
  };

  return (
    <LayoutPrivado titulo="Dar de Baja en Lista de Espera">
      <div style={s.wrapper}>
        <button style={s.botonVolver} onClick={() => navigate(-1)}>← Volver</button>
        <h2 style={s.tituloPage}>Dar de Baja en Lista de Espera</h2>
        <p style={s.descripcionPage}>
          Selecciona la actividad de la cual deseas retirarte de la lista de espera.
        </p>

        {mensajeExito && <div style={s.exito}>{mensajeExito}</div>}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

        {cargando ? (
          <div style={s.card}><p style={s.listaVacia}>Cargando lista de espera...</p></div>
        ) : listaEspera.length === 0 ? (
          <div style={s.card}>
            <p style={s.listaVacia}>No te encuentras en la lista de espera de ninguna actividad en este momento.</p>
          </div>
        ) : (
          listaEspera.map((actividad) => {
            const estaConfirmando = confirmandoId === actividad.id;

            return (
              <div key={actividad.id} style={s.card}>
                <span style={s.badge(actividad.tipo)}>
                  {actividad.tipo === 'priority' ? 'Cola Prioritaria (Abonado)' : 'Cola General'}
                </span>

                <h3 style={s.tituloActividad}>{actividad.nombre}</h3>
                <div style={s.metaText}><strong>Turno elegido:</strong> {actividad.turno}</div>
                <div style={s.metaText}><strong>Tu posición actual:</strong> N° {actividad.posicion}</div>

                {!estaConfirmando ? (
                  <div style={s.botones}>
                    <button
                      style={s.btnSecundario}
                      onClick={() => setConfirmandoId(actividad.id)}
                    >
                      Salir de la lista de espera
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-borde)', paddingTop: '16px' }}>
                    <div style={s.infoBox('yellow')}>
                      ¿Estás seguro de que deseas darte de baja de <strong>{actividad.nombre}</strong>?
                      Perderás tu lugar número {actividad.posicion} en la fila de espera.
                    </div>
                    <div style={s.botones}>
                      <button
                        style={s.btnPeligro}
                        onClick={() => handleConfirmarBaja(actividad.id, actividad.nombre)}
                      >
                        Confirmar Baja
                      </button>
                      <button
                        style={s.btnSecundario}
                        onClick={handleCancelarBaja}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </LayoutPrivado>
  );
}

export default BajaListaEspera;
