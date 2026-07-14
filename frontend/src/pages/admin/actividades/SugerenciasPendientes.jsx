import React, { useState, useEffect } from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getPendingSuggestions, acceptSuggestion, rejectSuggestion } from '../../../services/suggestionsService';

const s = {
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', marginBottom: '24px' },
  card: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '20px', marginBottom: '16px', boxShadow: 'var(--sombra)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap',
  },
  nombre: { fontSize: '16px', fontWeight: '700', color: 'var(--color-texto)', marginBottom: '4px' },
  dato: { fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '2px' },
  acciones: { display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'center' },
  btnAprobar: {
    padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    background: '#16a34a', color: '#fff', fontWeight: '600', fontSize: '13px',
  },
  btnAprobarDisabled: {
    padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'not-allowed',
    background: '#a7d8b9', color: '#fff', fontWeight: '600', fontSize: '13px',
  },
  btnRechazar: {
    padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    background: '#dc2626', color: '#fff', fontWeight: '600', fontSize: '13px',
  },
  btnVer: {
    padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    background: 'transparent', color: 'var(--color-texto)', fontWeight: '500', fontSize: '13px',
    cursor: 'pointer',
  },
  mensaje: { fontSize: '14px', color: 'var(--color-texto-suave)', fontStyle: 'italic', padding: '40px 0', textAlign: 'center' },
  error: { color: '#dc2626', fontSize: '13px', marginTop: '4px' },
  exito: { color: '#16a34a', fontSize: '13px', marginTop: '4px' },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '28px',
    width: '90%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '14px',
  },
  modalTitulo: { fontSize: '22px', fontWeight: 'bold', color: '#111' },
  modalDato: { fontSize: '14px', color: '#444' },
  inputPrecio: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid #ccc',
    fontSize: '14px', width: '100%', boxSizing: 'border-box',
  },
  btnCerrar: {
    padding: '8px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer',
    background: '#f1f1f1', color: '#333', fontWeight: '600', fontSize: '13px',
  },
  confirmModal: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '28px',
    width: '90%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px',
  },
  confirmTitulo: { fontSize: '18px', fontWeight: 'bold', color: '#111' },
  confirmTexto: { fontSize: '14px', color: '#444', lineHeight: '1.5' },
};

function SugerenciasPendientes() {
  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajes, setMensajes] = useState({});
  const [procesando, setProcesando] = useState({});
  const [seleccionada, setSeleccionada] = useState(null);
  const [precio, setPrecio] = useState('');
  const [confirmRechazo, setConfirmRechazo] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const datos = await getPendingSuggestions();
      setSugerencias(datos);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const horarioDeTexto = (s) =>
    s.activity_type === 'fixed' ? s.schedule : `${s.specific_date} · ${s.time_slot}`;

  const fechasDeTexto = (s) => {
    if (s.activity_type !== 'fixed' || !Array.isArray(s.dates) || s.dates.length === 0) return null;
    return `${s.dates.length} clase${s.dates.length !== 1 ? 's' : ''}: ${s.dates.join(', ')}`;
  };

  const manejarRechazo = async (id) => {
    setProcesando((prev) => ({ ...prev, [id]: true }));
    try {
      await rejectSuggestion(id);
      setMensajes((prev) => ({ ...prev, [id]: { tipo: 'err', texto: 'Sugerencia rechazada' } }));
      setTimeout(() => setSugerencias((prev) => prev.filter((c) => c.id !== id)), 7500);
    } catch (err) {
      setMensajes((prev) => ({ ...prev, [id]: { tipo: 'err', texto: err.message || 'Error al rechazar.' } }));
    } finally {
      setProcesando((prev) => ({ ...prev, [id]: false }));
    }
  };

  const manejarAceptacion = async (id, precioIngresado) => {
    setProcesando((prev) => ({ ...prev, [id]: true }));
    try {
      await acceptSuggestion(id, Number(precioIngresado));
      setMensajes((prev) => ({ ...prev, [id]: { tipo: 'ok', texto: 'Sugerencia aceptada. La actividad ya está disponible.' } }));
      setTimeout(() => setSugerencias((prev) => prev.filter((c) => c.id !== id)), 7500);
    } catch (err) {
      setMensajes((prev) => ({ ...prev, [id]: { tipo: 'err', texto: err.message || 'Error al aceptar.' } }));
    } finally {
      setProcesando((prev) => ({ ...prev, [id]: false }));
    }
  };

  const abrirDetalle = (sugerencia) => {
    setSeleccionada(sugerencia);
    setPrecio('');
  };

  return (
    <LayoutPrivado>
      <p style={s.titulo}>Sugerencias de Actividades Pendientes</p>

      {cargando && <p style={s.mensaje}>Cargando...</p>}

      {!cargando && sugerencias.length === 0 && (
        <p style={s.mensaje}>No hay sugerencias pendientes de revisión.</p>
      )}

      {!cargando && sugerencias.map((sug) => (
        <div key={sug.id} style={s.card}>
          <div>
            <p style={s.nombre}>{sug.name || sug.specialization}</p>
            <p style={s.dato}>Especialidad: {sug.specialization}</p>
            <p style={s.dato}>Profesor: {sug.professor_name}</p>
            <p style={s.dato}>Sala: {sug.room_name} · Cupos: {sug.capacity}</p>
            <p style={s.dato}>
              {sug.activity_type === 'fixed' ? 'Clase fija' : 'Clase individual'} — {horarioDeTexto(sug)}
            </p>
            {fechasDeTexto(sug) && <p style={s.dato}>{fechasDeTexto(sug)}</p>}
            {mensajes[sug.id] && (
              <p style={mensajes[sug.id].tipo === 'ok' ? s.exito : s.error}>
                {mensajes[sug.id].texto}
              </p>
            )}
          </div>
          <div style={s.acciones}>
            <button style={s.btnVer} onClick={() => abrirDetalle(sug)}>
              Ver detalle
            </button>
          </div>
        </div>
      ))}

      {seleccionada && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <p style={s.modalTitulo}>{seleccionada.name || seleccionada.specialization}</p>

            <p style={s.modalDato}><strong>Especialidad:</strong> {seleccionada.specialization}</p>
            <p style={s.modalDato}><strong>Profesor:</strong> {seleccionada.professor_name}</p>
            <p style={s.modalDato}><strong>Sala:</strong> {seleccionada.room_name}</p>
            <p style={s.modalDato}>
              <strong>Tipo:</strong> {seleccionada.activity_type === 'fixed' ? 'Clase fija' : 'Clase individual'}
            </p>
            <p style={s.modalDato}><strong>Horario:</strong> {horarioDeTexto(seleccionada)}</p>
            {fechasDeTexto(seleccionada) && (
              <p style={s.modalDato}><strong>Fechas:</strong> {fechasDeTexto(seleccionada)}</p>
            )}
            <p style={s.modalDato}><strong>Cupos máximos:</strong> {seleccionada.capacity}</p>
            {seleccionada.description && (
              <p style={s.modalDato}><strong>Descripción:</strong> {seleccionada.description}</p>
            )}
            {seleccionada.requirements && (
              <p style={s.modalDato}><strong>Requisitos:</strong> {seleccionada.requirements}</p>
            )}

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#444' }}>
                Precio de la clase ($) *
              </label>
              <input
                style={s.inputPrecio}
                type="number"
                min="0.01"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej: 5000"
              />
              <span style={{ fontSize: '12px', color: '#888' }}>
                Necesario para aceptar la sugerencia y crear la actividad.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                style={(!precio || Number(precio) <= 0) ? s.btnAprobarDisabled : s.btnAprobar}
                disabled={!precio || Number(precio) <= 0 || procesando[seleccionada.id]}
                onClick={() => {
                  manejarAceptacion(seleccionada.id, precio);
                  setSeleccionada(null);
                }}
              >
                Aceptar
              </button>
              <button
                style={s.btnRechazar}
                disabled={procesando[seleccionada.id]}
                onClick={() => {
                  setConfirmRechazo({ id: seleccionada.id, nombre: seleccionada.name || seleccionada.specialization });
                  setSeleccionada(null);
                }}
              >
                Rechazar
              </button>
              <button style={s.btnCerrar} onClick={() => setSeleccionada(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRechazo && (
        <div style={s.modalOverlay}>
          <div style={s.confirmModal}>
            <p style={s.confirmTitulo}>Confirmar rechazo</p>
            <p style={s.confirmTexto}>
              ¿Estás seguro/a de que querés rechazar la sugerencia <strong>{confirmRechazo.nombre}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                style={s.btnCerrar}
                onClick={() => setConfirmRechazo(null)}
                disabled={procesando[confirmRechazo.id]}
              >
                Cancelar
              </button>
              <button
                style={s.btnRechazar}
                disabled={procesando[confirmRechazo.id]}
                onClick={() => {
                  manejarRechazo(confirmRechazo.id);
                  setConfirmRechazo(null);
                }}
              >
                {procesando[confirmRechazo.id] ? 'Procesando...' : 'Sí, rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutPrivado>
  );
}

export default SugerenciasPendientes;