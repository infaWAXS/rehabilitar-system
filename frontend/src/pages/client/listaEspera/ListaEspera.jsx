// Responsable: Nahuel - HU Dar de baja en lista de espera
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getMyWaitlist, removeWaitlistItem } from '../../../services/waitlistService';

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
    padding: '10px 20px', borderRadius: '8px', border: 'none',
    background: '#dc2626', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  btnSecundario: {
    padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    background: 'transparent', color: 'var(--color-texto-suave)', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
  },
  exito: {
    background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
    padding: '14px 18px', color: '#15803d', fontSize: '14px', fontWeight: '600', marginBottom: '20px',
  },
  listaVacia: { textAlign: 'center', padding: '40px 20px', color: 'var(--color-texto-suave)', fontSize: '14px' },
  botonVolver: { padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-texto)', marginBottom: '20px' },
};

function ListaEspera() {
  const navigate = useNavigate();
  const [listaEspera, setListaEspera] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyWaitlist();
        setListaEspera(data);
      } catch (err) {
        setError(err.message || 'No se pudo cargar la lista de espera.');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const handleConfirmarBaja = async (id, nombreActividad) => {
    try {
      await removeWaitlistItem(id);
      setListaEspera(prev => prev.filter(item => item.id !== id));
      setConfirmandoId(null);
      setMensajeExito(`Baja registrada con éxito de "${nombreActividad}". Se envió un correo de confirmación a tu casilla. (simulado — Sprint 2)`);
      setTimeout(() => setMensajeExito(''), 8000);
    } catch (err) {
      setError(err.message || 'No se pudo procesar la baja. Intentá de nuevo.');
    }
  };

  const handleCancelarBaja = () => {
    setConfirmandoId(null);
  };

  if (cargando) {
    return (
      <LayoutPrivado titulo="Lista de Espera">
        <div style={s.wrapper}>
          <p style={{ color: 'var(--color-texto-suave)', fontSize: '14px' }}>Cargando lista de espera...</p>
        </div>
      </LayoutPrivado>
    );
  }

  return (
    <LayoutPrivado titulo="Lista de Espera">
      <div style={s.wrapper}>
        <button style={s.botonVolver} onClick={() => navigate(-1)}>← Volver</button>
        <h2 style={s.tituloPage}>Lista de Espera</h2>
        <p style={s.descripcionPage}>
          Ver y gestionar tu posición en la lista de espera para actividades.
        </p>

        {mensajeExito && <div style={s.exito}>{mensajeExito}</div>}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

        {listaEspera.length === 0 ? (
          <div style={s.card}>
            <p style={s.listaVacia}>No te encontrás en la lista de espera de ninguna actividad en este momento.</p>
          </div>
        ) : (
          listaEspera.map((actividad) => {
            const estaConfirmando = confirmandoId === actividad.id;

            return (
              <div key={actividad.id} style={s.card}>
                <span style={s.badge(actividad.waitlist_type)}>
                  {actividad.waitlist_type === 'priority' ? 'Cola Prioritaria (Abonado)' : 'Cola General'}
                </span>

                <h3 style={s.tituloActividad}>{actividad.activity_name ?? `Actividad #${actividad.activity_id}`}</h3>
                {actividad.activity_schedule && (
                  <div style={s.metaText}><strong>Horario:</strong> {actividad.activity_schedule}</div>
                )}
                <div style={s.metaText}><strong>Tu posición actual:</strong> N° {actividad.position}</div>

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
                      ¿Estás seguro de que deseás darte de baja de <strong>{actividad.activity_name}</strong>?
                      Perderás tu lugar número {actividad.position} en la fila de espera.
                    </div>
                    <div style={s.botones}>
                      <button
                        style={s.btnPeligro}
                        onClick={() => handleConfirmarBaja(actividad.id, actividad.activity_name)}
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

export default ListaEspera;
