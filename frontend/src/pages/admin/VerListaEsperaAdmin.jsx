// Responsable: Nahuel - HU Listar lista de espera (Vista Admin/Staff)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../layouts/LayoutPrivado';
import { getActivityWaitlist } from '../../services/waitlistService';
import { getActivityById } from '../../services/activitiesService';

const s = {
  wrapper: { maxWidth: '900px', margin: '0 auto' },
  headerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  tituloPage: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', margin: 0 },
  descripcionPage: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '24px' },
  card: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--sombra)', marginBottom: '20px' },
  filterBar: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', fontSize: '14px', minWidth: '240px', background: 'var(--color-fondo)' },
  select: { padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)', color: 'var(--color-texto)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  th: { padding: '12px 16px', background: '#f8fafc', color: '#64748b', fontWeight: '600', borderBottom: '2px solid #e2e8f0' },
  td: { padding: '14px 16px', borderBottom: '1px solid var(--color-borde)', color: 'var(--color-texto)', verticalAlign: 'middle' },
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
  }),
  btnSecundario: { padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: 'transparent', color: 'var(--color-texto-suave)', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  botonVolver: { padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-texto)', marginBottom: '20px' },
  infoBox: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', marginBottom: '20px', color: '#15803d' },
  avisoClase: { background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#c2410c', marginBottom: '20px', fontWeight: '500' },
  noResultados: { textAlign: 'center', padding: '32px', color: 'var(--color-texto-suave)', fontSize: '15px' }
};

function VerListaEsperaAdmin() {
  const { id: activityId } = useParams();
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [actividad, setActividad] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setCargando(true);
      setError('');
      try {
        const [actData, listaData] = await Promise.all([
          getActivityById(activityId),
          getActivityWaitlist(activityId),
        ]);
        setActividad(actData);
        setLista(listaData);
      } catch (err) {
        setError(err.message || 'Error al cargar la lista de espera.');
      } finally {
        setCargando(false);
      }
    })();
  }, [activityId]);

  const listaFiltrada = lista.filter(item =>
    item.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    item.email.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  const handleLimpiarFiltros = () => {
    setFiltroTexto('');
  };

  return (
    <LayoutPrivado titulo="Gestión de Listas de Espera">
      <div style={s.wrapper}>

        <button style={s.botonVolver} onClick={() => navigate(`/admin/actividades/${activityId}`)}>← Volver</button>
        <div style={s.headerFlex}>
          <div>
            <h2 style={s.tituloPage}>
              Lista de Espera{actividad ? ` — ${actividad.name}` : ''}
            </h2>
            <p style={s.descripcionPage}>Panel de control para usuarios autorizados y administración.</p>
          </div>
        </div>

        <div style={s.avisoClase}>
          ⚠️ <strong>Nota del Sistema:</strong> Una vez comenzada la clase, la lista de espera de la misma se eliminará automáticamente de forma permanente.
        </div>

        <div style={s.filterBar}>
          <input
            type="text"
            style={s.input}
            placeholder="Buscar por nombre o email..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
          {filtroTexto && (
            <button style={s.btnSecundario} onClick={handleLimpiarFiltros}>
              Limpiar Filtros
            </button>
          )}
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

        <div style={s.card}>
          {cargando ? (
            <div style={s.noResultados}>Cargando lista de espera...</div>
          ) : listaFiltrada.length === 0 ? (
            <div style={s.noResultados}>
              {lista.length === 0
                ? "No hay clientes anotados en la lista de espera de esta actividad."
                : "No se encontraron resultados que coincidan con los filtros aplicados."
              }
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Posición</th>
                  <th style={s.th}>Cliente</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Tipo de Cola</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((item) => (
                  <tr key={item.id}>
                    <td style={s.td}><strong># {item.position}</strong></td>
                    <td style={s.td}>
                      <div style={{ fontWeight: '600' }}>{item.nombre}</div>
                    </td>
                    <td style={s.td}>
                      <div style={{ fontSize: '13px' }}>{item.email}</div>
                    </td>
                    <td style={s.td}>
                      <span style={s.badge(item.waitlist_type)}>
                        {item.waitlist_type === 'priority' ? 'Prioritaria (Abonado)' : 'General'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </LayoutPrivado>
  );
}

export default VerListaEsperaAdmin;
