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

// ── Recepcionista (Nahuel) ────────────────────────────────

// ── Kinesiólogo (Angel + Ezequiel) ─── (usa /gestion/ compartido)

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

        {/* Gestión — Usuarios (admin) */}
        <Route path="/gestion/usuarios" element={<ListaUsuarios />} />
        <Route path="/gestion/usuarios/crear" element={<CrearCuenta />} />
        <Route path="/gestion/usuarios/:id" element={<DetalleUsuario />} />

        {/* Gestión — Clientes (admin + recepcionista) */}
        <Route path="/gestion/clientes" element={<ListaClientes />} />
        <Route path="/gestion/clientes/aptos-fisicos" element={<AptosFisicosAdmin />} />
        <Route path="/gestion/clientes/:id" element={<GestionCuentaAdmin />} />

        {/* Gestión — Actividades (admin + recepcionista + profesor) */}
        <Route path="/gestion/actividades" element={<ListaActividades />} />
        <Route path="/gestion/actividades/crear" element={<CrearActividad />} />
        <Route path="/gestion/actividades/editar/:id" element={<EditarActividad />} />
        <Route path="/gestion/actividades/:id" element={<DetalleActividad />} />

        {/* Gestión — Asistencias (admin + profesor) */}
        <Route path="/gestion/asistencias" element={<RegistrarAsistenciaAdmin />} />

        {/* Cliente */}
        <Route path="/cliente/actividades" element={<ActividadesCliente />} />
        <Route path="/cliente/reservas" element={<MisReservas />} />
        <Route path="/cliente/reservas/inscribir" element={<InscribirActividad />} />
        <Route path="/cliente/lista-espera" element={<ListaEspera />} />
        <Route path="/cliente/suscripciones" element={<MisSuscripciones />} />
        <Route path="/cliente/cuenta" element={<GestionCuentaCliente />} />

        {/* Recepcionista */}

        {/* Redirect por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
