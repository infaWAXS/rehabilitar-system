// HU Verificar apto físico (admin) - Responsable: Agustin
// E1: admin aprueba apto → PUT /users/update-medical-clearance/{id} → status = "approved"
// E2: admin rechaza apto  → PUT /users/reject-medical/{id}           → status = "rejected"
// E3: no hay aptos pendientes → se muestra mensaje informativo
import React, { useState, useEffect } from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getPendingMedical, approveMedical, rejectMedical } from '../../../services/usersService';

const API_BASE_URL = 'http://localhost:8000';

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
  btnRechazar: {
    padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    background: '#dc2626', color: '#fff', fontWeight: '600', fontSize: '13px',
  },
  btnVer: {
    padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    background: 'transparent', color: 'var(--color-texto)', fontWeight: '500', fontSize: '13px',
    cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
  },
  mensaje: { fontSize: '14px', color: 'var(--color-texto-suave)', fontStyle: 'italic', padding: '40px 0', textAlign: 'center' },
  error: { color: '#dc2626', fontSize: '13px', marginTop: '4px' },
  exito: { color: '#16a34a', fontSize: '13px', marginTop: '4px' },
};

function AptosFisicosAdmin() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajes, setMensajes] = useState({});  // { [userId]: { tipo: 'ok'|'err', texto } }
  const [procesando, setProcesando] = useState({});

  const cargar = async () => {
    setCargando(true);
    try {
      const datos = await getPendingMedical();
      setClientes(datos);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const manejarAccion = async (userId, accion) => {
    setProcesando((prev) => ({ ...prev, [userId]: true }));
    setMensajes((prev) => ({ ...prev, [userId]: null }));
    try {
      if (accion === 'aprobar') {
        await approveMedical(userId);
        setMensajes((prev) => ({ ...prev, [userId]: { tipo: 'ok', texto: 'Apto aprobado.' } }));
      } else {
        await rejectMedical(userId);
        setMensajes((prev) => ({ ...prev, [userId]: { tipo: 'err', texto: 'Apto rechazado.' } }));
      }
      // Quitar el cliente de la lista tras la acción
      setTimeout(() => {
        setClientes((prev) => prev.filter((c) => c.id !== userId));
      }, 1200);
    } catch (err) {
      setMensajes((prev) => ({ ...prev, [userId]: { tipo: 'err', texto: 'Error al procesar. Intentá de nuevo.' } }));
    } finally {
      setProcesando((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const getCertificadoUrl = (path) => {
    if (!path) return null;
    return `${API_BASE_URL}/${path}`;
  };

  return (
    <LayoutPrivado>
      <p style={s.titulo}>Aptos Físicos Pendientes</p>

      {cargando && <p style={s.mensaje}>Cargando...</p>}

      {/* E3: no hay aptos pendientes */}
      {!cargando && clientes.length === 0 && (
        <p style={s.mensaje}>No hay aptos físicos pendientes de verificación.</p>
      )}

      {!cargando && clientes.map((cliente) => (
        <div key={cliente.id} style={s.card}>
          <div>
            <p style={s.nombre}>{cliente.name} {cliente.lastname}</p>
            <p style={s.dato}>Email: {cliente.email}</p>
            {cliente.medical_certificate_path && (
              <p style={s.dato}>
                Archivo: {cliente.medical_certificate_path.split('/').pop()}
              </p>
            )}
            {mensajes[cliente.id] && (
              <p style={mensajes[cliente.id].tipo === 'ok' ? s.exito : s.error}>
                {mensajes[cliente.id].texto}
              </p>
            )}
          </div>
          <div style={s.acciones}>
            {/* Ver certificado en nueva pestaña */}
            {cliente.medical_certificate_path && (
              <a
                href={getCertificadoUrl(cliente.medical_certificate_path)}
                target="_blank"
                rel="noopener noreferrer"
                style={s.btnVer}
              >
                Ver certificado
              </a>
            )}
            {/* E1: aprobar */}
            <button
              style={s.btnAprobar}
              disabled={procesando[cliente.id]}
              onClick={() => manejarAccion(cliente.id, 'aprobar')}
            >
              Aprobar
            </button>
            {/* E2: rechazar */}
            <button
              style={s.btnRechazar}
              disabled={procesando[cliente.id]}
              onClick={() => manejarAccion(cliente.id, 'rechazar')}
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </LayoutPrivado>
  );
}

export default AptosFisicosAdmin;
