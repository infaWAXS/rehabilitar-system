# Tareas por miembro - Sprint 1

Este archivo define que debe hacer cada integrante en frontend y backend, con rutas de pagina y rutas API.

## Puntos de entrada tecnicos por integrante

- Francis
  - Front: frontend/src/services/authService.js, frontend/src/services/usersService.js
  - Back: backend/app/routes/authRoutes.py, backend/app/routes/userRoutes.py, backend/app/services/user_service.py
- Nahuel
  - Front: frontend/src/services/clientsService.js
  - Back: backend/app/routes/clientRoutes.py, backend/app/services/client_service.py
- Angel
  - Front: frontend/src/services/activitiesService.js
  - Back: backend/app/routes/activityRoutes.py, backend/app/services/activity_service.py
- Agustin
  - Front: frontend/src/services/reservationsService.js, frontend/src/services/waitlistService.js
  - Back: backend/app/routes/reservationRoutes.py, backend/app/routes/waitlistRoutes.py, backend/app/services/reservation_service.py, backend/app/services/waitlist_service.py
- Ezequiel
  - Front: frontend/src/services/attendanceService.js, frontend/src/services/paymentsService.js
  - Back: backend/app/routes/attendanceRoutes.py, backend/app/routes/paymentRoutes.py, backend/app/services/attendance_service.py, backend/app/services/payment_service.py

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
  - Archivos: backend/app/routes/authRoutes.py, backend/app/services/user_service.py.
- Perfil y password:
  - Endpoint: GET /users/me, PUT /users/change-password, PUT /users/update-info.
  - Archivos: backend/app/routes/userRoutes.py, backend/app/services/user_service.py.
- Admin de usuarios:
  - Endpoint: GET /users, GET /users/{id}, PUT /users/disable/{id}, PUT /users/enable/{id}.
  - Archivos: backend/app/routes/userRoutes.py, backend/app/services/user_service.py.
- DNI y apto fisico:
  - Endpoint: POST /users/upload-medical-certificate, PUT /users/update-medical-clearance/{id}, PUT /users/reject-medical/{id}.
  - Archivos: backend/app/routes/userRoutes.py, backend/app/services/user_service.py.

---

## Nahuel - Gestion de clientes y cuentas

### Frontend (pantallas)
- Admin lista de clientes: /admin/clientes (src/pages/admin/clientes/ListaClientes.jsx).
- Admin gestion cuenta cliente: /admin/clientes/:id (src/pages/admin/clientes/GestionCuentaAdmin.jsx).
- Cliente mi cuenta: /cliente/cuenta (src/pages/client/cuenta/GestionCuentaCliente.jsx).

### Backend (API + archivos sugeridos)
- Crear modulo de clientes:
  - Archivo nuevo sugerido: backend/app/routes/clientRoutes.py.
  - Archivo nuevo sugerido: backend/app/services/client_service.py.
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
  - Archivo nuevo sugerido: backend/app/routes/activityRoutes.py.
  - Archivo nuevo sugerido: backend/app/services/activity_service.py.
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
  - Archivo nuevo sugerido: backend/app/routes/reservationRoutes.py.
  - Archivo nuevo sugerido: backend/app/services/reservation_service.py.
- Crear modulo de lista de espera:
  - Archivo nuevo sugerido: backend/app/routes/waitlistRoutes.py.
  - Archivo nuevo sugerido: backend/app/services/waitlist_service.py.
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
  - Archivo nuevo sugerido: backend/app/routes/attendanceRoutes.py.
  - Archivo nuevo sugerido: backend/app/services/attendance_service.py.
- Crear modulo de pagos:
  - Archivo nuevo sugerido: backend/app/routes/paymentRoutes.py.
  - Archivo nuevo sugerido: backend/app/services/payment_service.py.
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
- Evidencia: 1 captura de UI + 1 request/response por HU en el PR.
