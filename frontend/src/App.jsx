import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './assets/styles/variables.css';

// ── Páginas públicas (Francis) ──────────────────────────
import InicioPublico from './pages/public/InicioPublico';
import Login from './pages/public/Login';
import Registro from './pages/public/Registro';
import RecuperarContrasena from './pages/public/RecuperarContrasena';
import RestablecerContrasena from './pages/public/RestablecerContrasena';
import Staff from './pages/public/Staff';

// ── Perfil compartido (Agustin) ─────────────────────────
import VerPerfil from './pages/client/perfil/VerPerfil';
import EditarPerfil from './pages/client/perfil/EditarPerfil';

// ── Admin: Usuarios (Francis) ───────────────────────────
import ListaUsuarios from './pages/admin/usuarios/ListaUsuarios';
import CrearCuenta from './pages/admin/usuarios/CrearCuenta';
import DetalleUsuario from './pages/admin/usuarios/DetalleUsuario';

// ── Admin: Clientes (Nahuel) ─────────────────────────────
import ListaClientes from './pages/admin/clientes/ListaClientes';
import GestionCuentaAdmin from './pages/admin/clientes/GestionCuentaAdmin';
import AptosFisicosAdmin from './pages/admin/clientes/AptosFisicosAdmin';

// ── Admin: Actividades (Angel) ───────────────────────────
import ListaActividades from './pages/admin/actividades/ListaActividades';
import CrearActividad from './pages/admin/actividades/CrearActividad';
import DetalleActividad from './pages/admin/actividades/DetalleActividad';
import EditarActividad from './pages/admin/actividades/EditarActividad';

// ── Admin: Asistencias (Ezequiel) ────────────────────────
import RegistrarAsistenciaAdmin from './pages/admin/asistencias/RegistrarAsistencia';
import VerListaEsperaAdmin from './pages/admin/VerListaEsperaAdmin';

// ── Cliente: Actividades (Angel) ─────────────────────────
import ActividadesCliente from './pages/client/actividades/ActividadesCliente';

// ── Cliente: Reservas y Lista de Espera (Agustin) ────────
import MisReservas from './pages/client/reservas/MisReservas';
import InscribirActividad from './pages/client/reservas/InscribirActividad';
import ListaEspera from './pages/client/listaEspera/ListaEspera';

// ── Cliente: Pagos (Ezequiel) ─────────────────────────────
import MisSuscripciones from './pages/client/pagos/MisSuscripciones';

// ── Cliente: Cuenta (Nahuel) ──────────────────────────────
import GestionCuentaCliente from './pages/client/cuenta/GestionCuentaCliente';
import SolicitarReintegro from './pages/client/cuenta/SolicitarReintegro';

// ── Cliente: Asistencias ──────────────────────────────────
import ConfirmarAsistenciaQr from './pages/client/asistencias/ConfirmarAsistenciaQr';

// ── Recepcionista (Nahuel) ────────────────────────────────
// VerInscriptos fusionado en DetalleActividad (misma tabla, mismo endpoint)

// ── Kinesiólogo (Nahuel) ─────────────────────────────────
import MisActividadesProfesor from './pages/kinesiologist/actividades/MisActividades';
import RegistrarAsistenciaProfesor from './pages/kinesiologist/asistencias/RegistrarAsistencia';

function App() {
  return (
    <Router>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<InicioPublico />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
        <Route path="/solicitar-reintegro" element={<SolicitarReintegro />} />
        <Route path="/staff" element={<Staff />} />

        {/* Perfil (todos los roles) */}
        <Route path="/perfil/editar" element={<EditarPerfil />} />
        <Route path="/perfil" element={<VerPerfil />} />

        {/* Admin — Usuarios */}
        <Route path="/admin/usuarios" element={<ListaUsuarios />} />
        <Route path="/admin/usuarios/crear" element={<CrearCuenta />} />
        <Route path="/admin/usuarios/:id" element={<DetalleUsuario />} />

        {/* Admin — Clientes */}
        <Route path="/admin/clientes" element={<ListaClientes />} />
        <Route path="/admin/aptos-fisicos" element={<AptosFisicosAdmin />} />
        <Route path="/admin/clientes/:id" element={<GestionCuentaAdmin />} />

        {/* Admin — Actividades */}
        <Route path="/admin/actividades" element={<ListaActividades />} />
        <Route path="/admin/actividades/crear" element={<CrearActividad />} />
        <Route path="/admin/actividades/editar/:id" element={<EditarActividad />} />
        <Route path="/admin/actividades/:id/lista-espera" element={<VerListaEsperaAdmin />} />
        <Route path="/admin/actividades/:id" element={<DetalleActividad />} />

        {/* Admin — Asistencias */}
        <Route path="/admin/asistencias" element={<RegistrarAsistenciaAdmin />} />

        {/* Recepcionista */}
        <Route path="/recepcionista/actividades" element={<ListaActividades />} />
        <Route path="/recepcionista/actividades/:id/lista-espera" element={<VerListaEsperaAdmin />} />
        <Route path="/recepcionista/actividades/:id" element={<DetalleActividad />} />
        <Route path="/recepcionista/clientes" element={<ListaClientes />} />
        <Route path="/recepcionista/clientes/:id" element={<GestionCuentaAdmin />} />

        {/* Cliente */}
        <Route path="/cliente/actividades" element={<ActividadesCliente />} />
        <Route path="/cliente/reservas" element={<MisReservas />} />
        <Route path="/cliente/reservas/inscribir" element={<InscribirActividad />} />
        <Route path="/cliente/lista-espera" element={<ListaEspera />} />
        <Route path="/cliente/suscripciones" element={<MisSuscripciones />} />
        <Route path="/cliente/cuenta" element={<GestionCuentaCliente />} />
        <Route path="/asistencia/qr/:code" element={<ConfirmarAsistenciaQr />} />

        {/* Profesor (Kinesiólogo) */}
        <Route path="/profesor/actividades" element={<MisActividadesProfesor />} />
        <Route path="/profesor/actividades/:id/asistencias" element={<RegistrarAsistenciaProfesor />} />

        {/* Redirect por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
