# Tareas por miembro - Sprint 1

Este archivo define que debe hacer cada integrante en frontend y backend, con rutas de pagina y rutas API.

## Puntos de entrada tecnicos por integrante

- Francis
  - Front: frontend/src/services/authService.js, frontend/src/services/usersService.js
  - Back: backend/app/routes/rutas_autenticacion.py, backend/app/routes/rutas_usuarios.py, backend/app/services/servicio_usuarios.py
- Nahuel
  - Front: frontend/src/services/clientsService.js
  - Back: backend/app/routes/rutas_clientes.py, backend/app/services/servicio_clientes.py
- Angel
  - Front: frontend/src/services/activitiesService.js
  - Back: backend/app/routes/rutas_actividades.py, backend/app/services/servicio_actividades.py
- Agustin
  - Front: frontend/src/services/reservationsService.js, frontend/src/services/waitlistService.js
  - Back: backend/app/routes/rutas_reservas.py, backend/app/routes/rutas_lista_espera.py, backend/app/services/servicio_reservas.py, backend/app/services/servicio_lista_espera.py
- Ezequiel
  - Front: frontend/src/services/attendanceService.js, frontend/src/services/paymentsService.js
  - Back: backend/app/routes/rutas_asistencias.py, backend/app/routes/rutas_pagos.py, backend/app/services/servicio_asistencias.py, backend/app/services/servicio_pagos.py

## Francis - Gestion de usuarios y autenticacion

### Frontend (pantallas)
- Home publica con accesos (ya creada base): / (src/pages/public/InicioPublico.jsx).
- Login: /login (src/pages/public/Login.jsx).
- Registro: /registro (src/pages/public/Registro.jsx).
- Recuperar password: /recuperar-contrasena (src/pages/public/RecuperarContrasena.jsx).
- Restablecer password: /restablecer-contrasena (src/pages/public/RestablecerContrasena.jsx).
- Perfil usuario: /perfil (src/pages/client/perfil/VerPerfil.jsx).
- Admin usuarios: /admin/usuarios (src/pages/admin/usuarios/ListaUsuarios.jsx).
- Admin crear usuario: /admin/usuarios/crear (src/pages/admin/usuarios/CrearCuenta.jsx).
- Admin detalle usuario: /admin/usuarios/:id (src/pages/admin/usuarios/DetalleUsuario.jsx).

### Backend (API + archivos sugeridos)
- Auth y login/registro:
  - Endpoint: POST /users, POST /login.
  - Archivos: backend/app/routes/rutas_autenticacion.py, backend/app/services/servicio_usuarios.py.
- Perfil y password:
  - Endpoint: GET /users/me, PUT /users/change-password, PUT /users/update-info.
  - Archivos: backend/app/routes/rutas_usuarios.py, backend/app/services/servicio_usuarios.py.
- Admin de usuarios:
  - Endpoint: GET /users, GET /users/{id}, PUT /users/disable/{id}, PUT /users/enable/{id}.
  - Archivos: backend/app/routes/rutas_usuarios.py, backend/app/services/servicio_usuarios.py.
- DNI y apto fisico:
  - Endpoint: POST /users/upload-medical-certificate, PUT /users/update-medical-clearance/{id}, PUT /users/reject-medical/{id}.
  - Archivos: backend/app/routes/rutas_usuarios.py, backend/app/services/servicio_usuarios.py.

---

## Nahuel - Gestion de clientes y cuentas

### Frontend (pantallas)
- Admin lista de clientes: /admin/clientes (src/pages/admin/clientes/ListaClientes.jsx).
- Admin gestion cuenta cliente: /admin/clientes/:id (src/pages/admin/clientes/GestionCuentaAdmin.jsx).
- Cliente mi cuenta: /cliente/cuenta (src/pages/client/cuenta/GestionCuentaCliente.jsx).

### Backend (API + archivos sugeridos)
- Crear modulo de clientes:
  - Archivo nuevo sugerido: backend/app/routes/rutas_clientes.py.
  - Archivo nuevo sugerido: backend/app/services/servicio_clientes.py.
- Endpoints esperados:
  - GET /clients.
  - GET /clients/{id}/conditions.
  - POST /clients/{id}/reintegration-request.
  - PUT /clients/{id}/suspend.
  - PUT /clients/{id}/reinstate.

---

## Angel - Gestion de actividades y clases

### Frontend (pantallas)
- Admin lista actividades: /admin/actividades (src/pages/admin/actividades/ListaActividades.jsx).
- Admin crear actividad: /admin/actividades/crear (src/pages/admin/actividades/CrearActividad.jsx).
- Admin detalle actividad: /admin/actividades/:id (src/pages/admin/actividades/DetalleActividad.jsx).
- Cliente actividades: /cliente/actividades (src/pages/client/actividades/ActividadesCliente.jsx).
- Kinesiologo actividades: /kinesiologo/actividades (src/pages/kinesiologist/actividades/MisActividades.jsx).

### Backend (API + archivos sugeridos)
- Crear modulo de actividades:
  - Archivo nuevo sugerido: backend/app/routes/rutas_actividades.py.
  - Archivo nuevo sugerido: backend/app/services/servicio_actividades.py.
- Endpoints esperados:
  - POST /activities.
  - GET /activities.
  - GET /activities/{id}.
  - PUT /activities/{id}/cancel.
  - PUT /activities/{id}/resign.
  - GET /activities/catalog/professionals.
  - GET /activities/catalog/schedules.
  - GET /activities/catalog/days.
  - GET /activities/catalog/rooms.
  - GET /activities/catalog/specializations.

---

## Agustin - Gestion de reservas y lista de espera

### Frontend (pantallas)
- Cliente mis reservas: /cliente/reservas (src/pages/client/reservas/MisReservas.jsx).
- Cliente inscripcion: /cliente/reservas/inscribir (src/pages/client/reservas/InscribirActividad.jsx).
- Cliente lista de espera: /cliente/lista-espera (src/pages/client/listaEspera/ListaEspera.jsx).

### Backend (API + archivos sugeridos)
- Crear modulo de reservas:
  - Archivo nuevo sugerido: backend/app/routes/rutas_reservas.py.
  - Archivo nuevo sugerido: backend/app/services/servicio_reservas.py.
- Crear modulo de lista de espera:
  - Archivo nuevo sugerido: backend/app/routes/rutas_lista_espera.py.
  - Archivo nuevo sugerido: backend/app/services/servicio_lista_espera.py.
- Endpoints esperados:
  - POST /reservations/fixed.
  - POST /reservations/individual.
  - GET /reservations/me.
  - PUT /reservations/{id}/cancel.
  - GET /waitlist/me.
  - DELETE /waitlist/{id}.

---

## Ezequiel - Gestion de asistencias y pagos

### Frontend (pantallas)
- Admin asistencias: /admin/asistencias (src/pages/admin/asistencias/RegistrarAsistencia.jsx).
- Kinesiologo asistencias: /kinesiologo/asistencias (src/pages/kinesiologist/asistencias/RegistrarAsistencia.jsx).
- Cliente suscripciones y pagos: /cliente/suscripciones (src/pages/client/pagos/MisSuscripciones.jsx).

### Backend (API + archivos sugeridos)
- Crear modulo de asistencias:
  - Archivo nuevo sugerido: backend/app/routes/rutas_asistencias.py.
  - Archivo nuevo sugerido: backend/app/services/servicio_asistencias.py.
- Crear modulo de pagos:
  - Archivo nuevo sugerido: backend/app/routes/rutas_pagos.py.
  - Archivo nuevo sugerido: backend/app/services/servicio_pagos.py.
- Endpoints esperados:
  - POST /attendances/by-dni.
  - POST /attendances/{id}/comments.
  - PUT /attendances/{id}/comments/{comment_id}.
  - DELETE /attendances/{id}/comments/{comment_id}.
  - GET /subscriptions/me.
  - POST /subscriptions/plans.
  - POST /subscriptions/activities/individual.
  - POST /payments/mercadopago/checkout.

---

## Definition of Done por HU

- Front: pantalla funcional, validaciones minimas, manejo de errores basico.
- Back: endpoint operativo, validaciones basicas, respuesta consistente.
- Integracion: front consume endpoint real o mock acordado.

## Tabla consolidada de HUs del Sprint 1

| HU | Responsable |
|---|---|
| Registrar usuario | Francis |
| Iniciar sesión | Francis |
| Cerrar sesión | Francis |
| Recuperar contraseña | Francis |
| Restablecer contraseña | Francis |
| Cambiar contraseña | Francis |
| Subir DNI | Nahuel |
| Ver perfil | Francis |
| Editar perfil | Francis |
| Buscar empleado | Francis |
| Filtrar empleado | Agustin |
| Eliminar cuenta admin | Francis |
| Eliminar cuenta usuario | Francis |
| Crear cuenta | Francis |
| Adjuntar apto físico | Nahuel |
| Verificar apto físico | Nahuel |
| Modificar información de usuario | Nahuel |
| Listar condiciones de cliente | Nahuel |
| Modificar empleado | Agustin |
| Búsqueda de usuarios | Agustin |
| Listar empleados | Agustin |
| Listar clientes | Agustin |
| Listar administrativos | Agustin |
| Solicitar reintegro de cuenta | Nahuel |
| Reintegrar cuenta | Nahuel |
| Suspender cuenta | Nahuel |
| Crear actividad | Angel |
| Renunciar actividad | Angel |
| Cancelar actividad | Angel |
| Ver Actividad | Angel |
| Filtrar actividades | Angel |
| Buscar actividades | Angel |
| Listar profesores disponibles | Angel |
| Listar horarios disponibles | Angel |
| Listar dias disponibles | Angel |
| Listar salas disponibles | Angel |
| Listar especializaciones | Angel |
| Inscribirse a actividad fija | Agustin |
| Inscribirse a actividad individual | Agustin |
| Ver mis reservas | Agustin |
| Dar de baja en lista de espera | Agustin |
| Listar lista de espera | Agustin |
| Registrar asistencia por DNI | Ezequiel |
| Dejar comentario en asistencia | Ezequiel |
| Eliminar comentario en asistencia | Ezequiel |
| Modificar comentario en asistencia | Ezequiel |
| Inscribirse a plan | Ezequiel |
| Inscribir actividad individual | Ezequiel |
| Ver suscripciones | Ezequiel |
| Pagar Mercado Pago | Ezequiel |
| Cancelar turno | Agustin |
