// HU Listar clientes (Francis)
// E1: hay clientes → tabla con estado de cuenta, apto físico y condición de abonado
// E2: sin clientes → "No hay clientes registrados." (sin filtros) o "No se encontraron clientes con los filtros aplicados."
// E3: limpiar filtros → limpiarFiltros() resetea a FILTROS_VACIOS y recarga lista completa
import React, { useState, useEffect, useCallback } from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getClients } from '../../../services/usersService';
import { suspendClient, reinstateClient, getReintegrationRequest, rejectReintegration } from '../../../services/clientsService';
import { getRole } from '../../../services/authService';

const STATUS_LABEL = { active: 'Activo', disabled: 'Deshabilitado', suspended: 'Suspendido', pending_reintegration: 'Reintegro pend.' };
const CERT_LABEL = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado', none: 'Sin apto' };

const CHIP_ESTADO = {
  active:                { background: '#dcfce7', color: '#15803d' },
  disabled:              { background: '#fef2f2', color: '#dc2626' },
  suspended:             { background: '#fef2f2', color: '#dc2626' },
  pending_reintegration: { background: '#fef9c3', color: '#854d0e' },
};
const CHIP_CERT = {
  pending:  { background: '#fef9c3', color: '#854d0e' },
  approved: { background: '#dcfce7', color: '#15803d' },
  rejected: { background: '#fef2f2', color: '#dc2626' },
  none:     { background: '#f3f4f6', color: '#6b7280' },
};
const CHIP_ABONADO = {
  si:  { background: '#dbeafe', color: '#1d4ed8' },
  no:  { background: '#f3f4f6', color: '#6b7280' },
};

const s = {
  cabecera: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', margin: 0 },
  filtros: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  inputBusqueda: {
    padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)',
    minWidth: '220px', boxSizing: 'border-box',
  },
  select: {
    padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)', cursor: 'pointer',
  },
  botonLimpiar: {
    padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--color-primario)',
    background: 'transparent', color: 'var(--color-primario)', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--color-texto-suave)', borderBottom: '1px solid var(--color-borde)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '12px 14px', borderBottom: '1px solid var(--color-borde)', color: 'var(--color-texto)' },
  chip: { display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
  vacio: { textAlign: 'center', padding: '48px', color: 'var(--color-texto-suave)', fontSize: '15px' },
  card: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '0', boxShadow: 'var(--sombra)', overflowX: 'auto' },
  link: { color: 'var(--color-primario)', textDecoration: 'none', fontWeight: '600', fontSize: '13px' },
  botonSuspender: {
    display: 'inline-block', padding: '6px 14px', borderRadius: '6px', border: '1px solid #dc2626',
    background: 'transparent', color: '#dc2626', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  botonHabilitar: {
    display: 'inline-block', padding: '6px 14px', borderRadius: '6px', border: '1px solid #15803d',
    background: 'transparent', color: '#15803d', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  botonRechazar: {
    display: 'inline-block', padding: '6px 14px', borderRadius: '6px', border: '1px solid #dc2626',
    background: 'transparent', color: '#dc2626', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginLeft: '8px',
  },
  botonVerMotivo: {
    display: 'inline-block', padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--color-borde)',
    background: 'transparent', color: 'var(--color-texto)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginLeft: '8px',
  },
  motivoTexto: {
    background: '#f9fafb', border: '1px solid var(--color-borde)', borderRadius: '8px', padding: '12px 14px',
    fontSize: '14px', color: 'var(--color-texto)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '16px',
  },
  error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' },
  exito: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', color: '#15803d', fontSize: '13px', marginBottom: '16px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px 32px', maxWidth: '420px', width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.18)' },
  modalTitulo: { fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: 'var(--color-texto)' },
  modalTexto: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '16px', lineHeight: 1.5 },
  modalLabel: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)' },
  modalInput: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' },
  modalBotones: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  modalCancelar: { padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-texto)' },
  modalConfirmar: { padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '700' },
  modalConfirmarHabilitar: { padding: '9px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '700' },
};

const FILTROS_VACIOS = { busqueda: '', estado: '' };

function ListaClientes() {
  const rol = getRole();
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);

  // Modal de suspensión directa desde la lista
  const [clienteASuspender, setClienteASuspender] = useState(null);
  const [motivoSuspender, setMotivoSuspender] = useState('');
  const [errMotivo, setErrMotivo] = useState('');
  const [suspendiendo, setSuspendiendo] = useState(false);

  // Modal de habilitación (reintegro) directa desde la lista
  const [clienteAHabilitar, setClienteAHabilitar] = useState(null);
  const [errHabilitar, setErrHabilitar] = useState('');
  const [habilitando, setHabilitando] = useState(false);

  // Modal para rechazar la solicitud de reintegro → la cuenta sigue suspendida
  const [clienteARechazar, setClienteARechazar] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errRechazar, setErrRechazar] = useState('');
  const [rechazando, setRechazando] = useState(false);

  const abrirModalRechazar = (cliente) => {
    setClienteARechazar(cliente);
    setMotivoRechazo('');
    setErrRechazar('');
    setExito('');
  };
  const cerrarModalRechazar = () => {
    setClienteARechazar(null);
    setMotivoRechazo('');
    setErrRechazar('');
  };

  const confirmarRechazar = async () => {
    if (!motivoRechazo.trim()) { setErrRechazar('El motivo del rechazo es obligatorio.'); return; }
    setRechazando(true);
    try {
      const updated = await rejectReintegration(clienteARechazar.id, motivoRechazo.trim());
      const nuevoEstado = updated?.account_status || 'suspended';
      setClientes((prev) => prev.map((c) => (c.id === clienteARechazar.id ? { ...c, account_status: nuevoEstado } : c)));
      setExito(`La solicitud de reintegro de ${clienteARechazar.name} ${clienteARechazar.lastname} fue rechazada. La cuenta sigue suspendida.`);
      cerrarModalRechazar();
    } catch (err) {
      setErrRechazar(err.message || 'No se pudo rechazar la solicitud.');
    } finally {
      setRechazando(false);
    }
  };

  // Modal para ver el motivo que escribió el cliente al solicitar el reintegro
  const [clienteMotivo, setClienteMotivo] = useState(null);
  const [motivoSolicitud, setMotivoSolicitud] = useState(null);
  const [cargandoMotivo, setCargandoMotivo] = useState(false);

  const abrirModalMotivo = async (cliente) => {
    setClienteMotivo(cliente);
    setMotivoSolicitud(null);
    setCargandoMotivo(true);
    try {
      const solicitud = await getReintegrationRequest(cliente.id);
      setMotivoSolicitud(solicitud?.motivo || '');
    } catch {
      setMotivoSolicitud('');
    } finally {
      setCargandoMotivo(false);
    }
  };

  const abrirModalSuspender = (cliente) => {
    setClienteASuspender(cliente);
    setMotivoSuspender('');
    setErrMotivo('');
    setExito('');
  };
  const cerrarModalSuspender = () => {
    setClienteASuspender(null);
    setMotivoSuspender('');
    setErrMotivo('');
  };

const confirmarSuspender = async () => {
    if (!motivoSuspender.trim()) { setErrMotivo('El motivo es obligatorio.'); return; }
    setSuspendiendo(true);
    try {
      const response = await suspendClient(clienteASuspender.id, motivoSuspender.trim());
      // 🚨 Cambiamos 'updated' por 'response' y usamos el campo que devuelve el servicio
      const nuevoEstado = response?.account_status || 'suspended'; 
      setClientes((prev) => prev.map((c) => (c.id === clienteASuspender.id ? { ...c, account_status: nuevoEstado } : c)));
      setExito(`La cuenta de ${clienteASuspender.name} ${clienteASuspender.lastname} fue suspendida correctamente.`);
      cerrarModalSuspender();
    } catch (err) {
      setErrMotivo(err.message || 'No se pudo suspender la cuenta.');
    } finally {
      setSuspendiendo(false);
    }
  };

  const abrirModalHabilitar = (cliente) => {
    setClienteAHabilitar(cliente);
    setErrHabilitar('');
    setExito('');
  };
  const cerrarModalHabilitar = () => {
    setClienteAHabilitar(null);
    setErrHabilitar('');
  };

  const confirmarHabilitar = async () => {
    setHabilitando(true);
    try {
      const updated = await reinstateClient(clienteAHabilitar.id);
      const nuevoEstado = updated?.account_status || 'active';
      setClientes((prev) => prev.map((c) => (c.id === clienteAHabilitar.id ? { ...c, account_status: nuevoEstado } : c)));
      setExito(`La cuenta de ${clienteAHabilitar.name} ${clienteAHabilitar.lastname} fue habilitada correctamente.`);
      cerrarModalHabilitar();
    } catch (err) {
      setErrHabilitar(err.message || 'No se pudo habilitar la cuenta.');
    } finally {
      setHabilitando(false);
    }
  };

  const cargar = useCallback((f) => {
    setCargando(true);
    setError('');
    getClients(f.busqueda, f.estado)
      .then((data) => setClientes(Array.isArray(data) ? data : []))
      .catch(() => setError('No se pudieron cargar los clientes.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar(filtros);
  }, []); // eslint-disable-line

  const aplicarFiltros = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    cargar(nuevosFiltros);
  };

  const cambio = (e) => {
    const nuevosFiltros = { ...filtros, [e.target.name]: e.target.value };
    setFiltros(nuevosFiltros);
    cargar(nuevosFiltros);
  };

  const limpiarFiltros = () => aplicarFiltros(FILTROS_VACIOS);

  const hayFiltros = filtros.busqueda !== '' || filtros.estado !== '';

  return (
    <LayoutPrivado titulo="Clientes">
      <div style={s.cabecera}>
        <p style={s.titulo}>Lista de clientes</p>
      </div>

      {error && <div style={s.error}>{error}</div>}
      {exito && <div style={s.exito}>{exito}</div>}

      {/* Filtros */}
      <div style={s.filtros}>
        <input
          style={s.inputBusqueda}
          type="text"
          name="busqueda"
          placeholder="Buscar por nombre, email o DNI..."
          value={filtros.busqueda}
          onChange={cambio}
        />
        <select style={s.select} name="estado" value={filtros.estado} onChange={cambio}>
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="disabled">Deshabilitado</option>
        </select>
        {hayFiltros && (
          <button style={s.botonLimpiar} onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div style={s.vacio}>Cargando...</div>
      ) : clientes.length === 0 ? (
        <div style={s.vacio}>
          {hayFiltros ? 'No se encontraron clientes con los filtros aplicados.' : 'No hay clientes registrados.'}
        </div>
      ) : (
        <div style={s.card}>
          <table style={s.tabla}>
            <thead>
              <tr>
                <th style={s.th}>Nombre</th>
                <th style={s.th}>Email</th>
                <th style={s.th}>DNI</th>
                <th style={s.th}>Estado cuenta</th>
                <th style={s.th}>Apto fisico</th>
                <th style={s.th}>Abonado</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td style={s.td}>{c.name} {c.lastname}</td>
                  <td style={s.td}>{c.email}</td>
                  <td style={s.td}>{c.dni || '—'}</td>
                  <td style={s.td}>
                    <span style={{ ...s.chip, ...(CHIP_ESTADO[c.account_status] || {}) }}>
                      {STATUS_LABEL[c.account_status] || c.account_status}
                    </span>
                  </td>
                  <td style={s.td}>
                    {c.medical_certificate_status ? (
                      <span style={{ ...s.chip, ...(CHIP_CERT[c.medical_certificate_status] || {}) }}>
                        {CERT_LABEL[c.medical_certificate_status] || c.medical_certificate_status}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-texto-suave)', fontSize: '13px' }}>Sin apto</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.chip, ...(c.es_abonado ? CHIP_ABONADO.si : CHIP_ABONADO.no) }}>
                      {c.es_abonado ? 'Abonado' : 'No abonado'}
                    </span>
                  </td>
                  <td style={s.td}>
                    {(rol === 'admin' || rol === 'recepcionista') &&
                      (c.account_status === 'active' || c.account_status === 'disabled') && (
                        <button style={s.botonSuspender} onClick={() => abrirModalSuspender(c)}>
                          Suspender cuenta
                        </button>
                    )}
                    {/* Suspendido sin solicitud → el admin habilita por decisión propia */}
                    {(rol === 'admin' || rol === 'recepcionista') &&
                      c.account_status === 'suspended' && (
                        <button style={s.botonHabilitar} onClick={() => abrirModalHabilitar(c)}>
                          Habilitar cuenta
                        </button>
                    )}
                    {/* Con solicitud pendiente → el admin la resuelve aceptando o rechazando */}
                    {(rol === 'admin' || rol === 'recepcionista') &&
                      c.account_status === 'pending_reintegration' && (
                        <>
                          <button style={s.botonHabilitar} onClick={() => abrirModalHabilitar(c)}>
                            Aceptar
                          </button>
                          <button style={s.botonRechazar} onClick={() => abrirModalRechazar(c)}>
                            Rechazar
                          </button>
                          <button style={s.botonVerMotivo} onClick={() => abrirModalMotivo(c)}>
                            Ver motivo
                          </button>
                        </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal suspender cuenta — directo desde la lista */}
      {clienteASuspender && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={s.modalTitulo}>Suspender cuenta</p>
            <p style={s.modalTexto}>
              Vas a suspender la cuenta de <strong>{clienteASuspender.name} {clienteASuspender.lastname}</strong>.
              Ingresá el motivo de la suspensión. El cliente será notificado.
            </p>
            <label style={s.modalLabel}>Motivo *</label>
            <textarea
              style={s.modalInput}
              value={motivoSuspender}
              onChange={(e) => { setMotivoSuspender(e.target.value); setErrMotivo(''); }}
              placeholder="Escribí el motivo..."
            />
            {errMotivo && <div style={{ ...s.error, marginBottom: '12px' }}>{errMotivo}</div>}
            <div style={s.modalBotones}>
              <button style={s.modalCancelar} onClick={cerrarModalSuspender} disabled={suspendiendo}>Cancelar</button>
              <button style={s.modalConfirmar} onClick={confirmarSuspender} disabled={suspendiendo}>
                {suspendiendo ? 'Suspendiendo...' : 'Confirmar suspensión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal habilitar cuenta — directo desde la lista */}
      {clienteAHabilitar && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={s.modalTitulo}>
              {clienteAHabilitar.account_status === 'pending_reintegration' ? 'Aceptar solicitud de reintegro' : 'Habilitar cuenta'}
            </p>
            <p style={s.modalTexto}>
              {clienteAHabilitar.account_status === 'pending_reintegration'
                ? <>Vas a aceptar la solicitud de reintegro de <strong>{clienteAHabilitar.name} {clienteAHabilitar.lastname}</strong>. La cuenta pasará a estado activo. ¿Confirmás?</>
                : <>Vas a habilitar la cuenta de <strong>{clienteAHabilitar.name} {clienteAHabilitar.lastname}</strong>. La cuenta pasará a estado activo. ¿Confirmás?</>}
            </p>
            {errHabilitar && <div style={{ ...s.error, marginBottom: '12px' }}>{errHabilitar}</div>}
            <div style={s.modalBotones}>
              <button style={s.modalCancelar} onClick={cerrarModalHabilitar} disabled={habilitando}>Cancelar</button>
              <button style={s.modalConfirmarHabilitar} onClick={confirmarHabilitar} disabled={habilitando}>
                {habilitando ? 'Habilitando...' : 'Confirmar habilitación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal rechazar solicitud de reintegro — la cuenta permanece suspendida */}
      {clienteARechazar && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={s.modalTitulo}>Rechazar solicitud de reintegro</p>
            <p style={s.modalTexto}>
              Vas a rechazar la solicitud de <strong>{clienteARechazar.name} {clienteARechazar.lastname}</strong>.
              La cuenta va a permanecer suspendida. Ingresá el motivo del rechazo: el cliente será notificado.
            </p>
            <label style={s.modalLabel}>Motivo del rechazo *</label>
            <textarea
              style={s.modalInput}
              value={motivoRechazo}
              onChange={(e) => { setMotivoRechazo(e.target.value); setErrRechazar(''); }}
              placeholder="Escribí el motivo del rechazo..."
            />
            {errRechazar && <div style={{ ...s.error, marginBottom: '12px' }}>{errRechazar}</div>}
            <div style={s.modalBotones}>
              <button style={s.modalCancelar} onClick={cerrarModalRechazar} disabled={rechazando}>Cancelar</button>
              <button style={s.modalConfirmar} onClick={confirmarRechazar} disabled={rechazando}>
                {rechazando ? 'Rechazando...' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal con el motivo que escribió el cliente al solicitar el reintegro */}
      {clienteMotivo && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={s.modalTitulo}>Motivo de la solicitud</p>
            <p style={s.modalTexto}>
              Solicitud de reintegro de <strong>{clienteMotivo.name} {clienteMotivo.lastname}</strong>.
            </p>
            {cargandoMotivo ? (
              <p style={s.modalTexto}>Cargando motivo...</p>
            ) : motivoSolicitud ? (
              <p style={s.motivoTexto}>{motivoSolicitud}</p>
            ) : (
              <p style={s.modalTexto}>El cliente no dejó un motivo.</p>
            )}
            <div style={s.modalBotones}>
              <button style={s.modalCancelar} onClick={() => setClienteMotivo(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </LayoutPrivado>
  );
}

export default ListaClientes;

