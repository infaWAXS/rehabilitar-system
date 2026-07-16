import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getAuditLogs } from '../../../services/auditLogsService';

const acciones = [
    {value: "CREATE", label: "Crear", tipos: ["ACCOUNT", "ACTIVITY"]},
    {value: "UPDATE", label: "Actualizar", tipos: ["ACCOUNT", "ACTIVITY"]},
    {value: "DELETE", label: "Eliminar", tipos: ["ACCOUNT", "ACTIVITY"]},
    {value: "LOGIN", label: "Login", tipos: ["ACCOUNT"]},
    {value: "RESET_PASSWORD", label: "Restablecer Contraseña", tipos: ["ACCOUNT"]},
    {value: "SUSPEND_ACCOUNT", label: "Suspender Cuenta", tipos: ["ACCOUNT"]},
    {value: "REINTEGRATE_ACCOUNT", label: "Reintegrar Cuenta", tipos: ["ACCOUNT"]},
    {value: "DENY_REINTEGRATION", label: "Denegar Reintegración", tipos: ["ACCOUNT"]},
    {value: "UPDATE_MEDICAL_CERTIFICATE", label: "Actualizar Certificado Médico", tipos: ["ACCOUNT"]},
    {value: "SUGGEST_ACTIVITY", label: "Sugerir Actividad", tipos: ["ACTIVITY"]},
    {value: "APPROVE_SUGGESTION", label: "Aprobar Sugerencia", tipos: ["ACTIVITY"]},
    {value: "REJECT_SUGGESTION", label: "Rechazar Sugerencia", tipos: ["ACTIVITY"]},
    {value: "CLAIM_ACTIVITY", label: "Reclamar Actividad", tipos: ["ACTIVITY"]},
    {value: "RESIGN_ACTIVITY", label: "Renunciar a Actividad", tipos: ["ACTIVITY"]},
    {value: "SUBSCRIPTION", label: "Pago de plan", tipos: ["PAYMENT"]},
    {value: "INDIVIDUAL", label: "Pago individual", tipos: ["PAYMENT"]},
    {value: "REFUND", label: "Reembolso", tipos: ["PAYMENT"]},
];  

const s = {
    titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', margin: 0 },
    filtros: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', background: 'var(--color-fondo-card)', padding: '16px', borderRadius: '10px', boxShadow: 'var(--sombra)' },
    inputBuscar: { flex: 1, minWidth: '200px', padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)' },
    select: { padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)', cursor: 'pointer'},
    inputFecha: { padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)', fontFamily: 'inherit', cursor: 'pointer' },
    botonBuscar: { padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--color-primario)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
    botonLimpiar: { padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', color: 'var(--color-texto-suave)', fontSize: '14px', cursor: 'pointer' },
    tabla: { width: '100%', borderCollapse: 'collapse', background: 'var(--color-fondo-card)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--sombra)' },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)', borderBottom: '1px solid var(--color-borde)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    td: { padding: '12px 16px', fontSize: '14px', color: 'var(--color-texto)', borderBottom: '1px solid var(--color-borde)' },
    chipResultado: (resultado) => ({
        display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
        background: resultado === 'SUCCESS' ? '#dcfce7' : '#fef2f2',
        color: resultado === 'SUCCESS' ? '#15803d' : '#dc2626',
    }),
    chipTipo: (tipo) => ({
        display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
        background: tipo === 'PAYMENT' ? '#dcfce7' : tipo === 'ACTIVITY' ? '#dbeafe' : '#FEF3C7',
        color: tipo === 'PAYMENT' ? '#166534' : tipo === 'ACTIVITY' ? '#1d4ed8' :'#92400E',
    }),
    vacio: { textAlign: 'center', padding: '40px', color: 'var(--color-texto-suave)', fontSize: '14px' },
}

function ListaAuditoria() {
    const [registros, setRegistros] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [tipo, setTipo] = useState('');
    const [accion, setAccion] = useState('');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [resultado, setResultado] = useState('');
    const [cargando, setCargando] = useState(true);

    const cargarRegistros = useCallback(async (search,type,action,from,to,result) => {
        setCargando(true);
        try {
            console.log(type,"",action);
            const data = await getAuditLogs(search, type, action, from, to, result);
            setRegistros(data);
        } catch (error) {
            console.error('Error al cargar los registros de auditoría:', error);
        }
        setCargando(false);
    } , []);

    useEffect(() => {
        cargarRegistros();
    }, []);

    const buscar = (e) => {
        e.preventDefault();
        console.log({ busqueda, tipo, accion, desde, hasta, resultado });
        cargarRegistros(busqueda, tipo, accion, desde, hasta, resultado);
    }

    const limpiarFiltros = () => {
        setBusqueda('');
        setTipo('');
        setAccion('');
        setDesde('');
        setHasta('');
        setResultado('');
        cargarRegistros("", "", "", "", "");
    }

    const accionesVisibles = acciones.filter(a => !tipo || a.tipos.includes(tipo));

    return (
        <LayoutPrivado>
            <h1 style={s.titulo}>Registro de Auditoría</h1>
            <div style={s.filtros}>
                <input
                    type="text"
                    placeholder="Buscar por usuario"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={s.inputBuscar} />

                <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={s.select}>
                    <option value="">Todos los tipos</option>
                    <option value="ACCOUNT">Cuenta</option>
                    <option value="ACTIVITY">Actividad</option>
                    <option value="PAYMENT">Pago</option>
                </select>
                <select value={accion} onChange={(e) => setAccion(e.target.value)} style={s.select}>
                    <option value="">Todas las acciones</option>
                    {accionesVisibles.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                </select>
                <input
                    type="date"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                    style={s.inputFecha} />
                <input
                    type="date"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                    style={s.inputFecha} />
                <select value={resultado} onChange={(e) => setResultado(e.target.value)} style={s.select}>
                    <option value="">Todos los resultados</option>
                    <option value="SUCCESS">Éxito</option>
                    <option value="ERROR">Fallo</option>
                </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={buscar} style={s.botonBuscar}>Buscar</button>
                <button onClick={limpiarFiltros} style={s.botonLimpiar}>Limpiar Filtros</button>
            </div>
            {cargando ? (
                <p>Cargando registros...</p>
            ) : (
                <table style={s.tabla}>
                    <thead>
                        <tr>
                            <th style={s.th}>Fecha y Hora</th>
                            <th style={s.th}>Usuario</th>
                            <th style={s.th}>ID de usuario</th>
                            <th style={s.th}>Tipo de Acción</th>
                            <th style={s.th}>Acción</th>
                            <th style={s.th}>Resultado</th>
                            <th style={s.th}>Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registros.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={s.vacio}>No se encontraron registros.</td>
                            </tr>
                        ) : (
                            registros.map((registro, index) => (
                                console.log(registro.timestamp),
                                <tr key={index}>
                                    <td style={s.td}>{new Date(registro.timestamp).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false })}</td>
                                <td style={s.td}>{registro.user.name} {registro.user.lastname}</td>
                                <td style={s.td}>{registro.user.id}</td>
                                <td style={s.td}><span style={s.chipTipo(registro.type)}>{registro.type}</span></td>
                                <td style={s.td}>{registro.action}</td>
                                <td style={s.td}><span style={s.chipResultado(registro.result)}>{registro.result}</span></td>
                                <td style={s.td}>{registro.detail}</td>
                            </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </LayoutPrivado>
    );
}

export default ListaAuditoria;





/*
Título: Como administrador quiero ver el registro de actividad
del sistema para auditar las acciones realizadas por empleados
y administradores.
Reglas de negocio:

* El sistema debe registrar todas las acciones relevantes
(altas, bajas, modificaciones, accesos, pagos, notificaciones,
etc.) con fecha, usuario y detalle.
* El registro debe ser inalterable.
* Debe permitir filtrar por usuario, tipo de acción, fecha y
resultado.
*/