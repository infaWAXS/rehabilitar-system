# HU - Trazabilidad Sprint 1

Matriz para mostrar donde se implementa cada HU del Sprint 1, su escenario funcional y sus rutas en el proyecto.

Columnas:
- Responsable: integrante principal.
- Escenario: DADO/CUADNO/ENTONCES resumido.
- Front: ruta visible + archivo.
- Back: endpoint + archivo backend.
- Estado: base, en progreso, pendiente.

## 1) Gestion de usuarios y autenticacion

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Registrar usuario | Francis | Dado un visitante, cuando completa registro, entonces se crea su cuenta. | /registro -> frontend/src/pages/public/Registro.jsx | POST /users -> backend/app/routes/authRoutes.py | Base |
| Iniciar sesion | Francis | Dado un usuario activo, cuando envia credenciales validas, entonces recibe acceso. | /login -> frontend/src/pages/public/Login.jsx | POST /login -> backend/app/routes/authRoutes.py | Base |
| Cerrar sesion | Francis | Dado un usuario logueado, cuando cierra sesion, entonces se invalida su sesion local. | Navbar privada (pendiente componente auth) | Logout local/JWT en cliente (sin endpoint obligatorio) | Pendiente |
| Recuperar contrasena | Francis | Dado un usuario olvidado, cuando ingresa email, entonces se dispara flujo de recuperacion. | /recuperar-contrasena -> frontend/src/pages/public/RecuperarContrasena.jsx | Endpoint sugerido: POST /auth/recovery/request -> backend/app/routes/authRoutes.py | Pendiente |
| Restablecer contrasena | Francis | Dado un token valido, cuando define nueva clave, entonces actualiza password. | /restablecer-contrasena -> frontend/src/pages/public/RestablecerContrasena.jsx | Endpoint sugerido: POST /auth/recovery/reset -> backend/app/routes/authRoutes.py | Pendiente |
| Cambiar contrasena | Francis | Dado un usuario autenticado, cuando carga nueva clave, entonces se guarda. | /perfil -> frontend/src/pages/client/perfil/VerPerfil.jsx | PUT /users/change-password -> backend/app/routes/userRoutes.py | Base |
| Subir DNI | Francis | Dado un usuario autenticado, cuando sube documento, entonces se adjunta en su perfil. | /perfil -> frontend/src/pages/client/perfil/VerPerfil.jsx | Endpoint sugerido: POST /users/upload-dni -> backend/app/routes/userRoutes.py | Pendiente |
| Ver perfil | Francis | Dado un usuario autenticado, cuando entra a perfil, entonces visualiza sus datos. | /perfil -> frontend/src/pages/client/perfil/VerPerfil.jsx | GET /users/me -> backend/app/routes/userRoutes.py | Base |
| Editar perfil | Francis | Dado un usuario autenticado, cuando edita datos, entonces se actualiza su perfil. | /perfil -> frontend/src/pages/client/perfil/VerPerfil.jsx | PUT /users/update-info -> backend/app/routes/userRoutes.py | Base |
| Buscar empleado | Francis | Dado un admin, cuando filtra por texto, entonces obtiene empleados coincidentes. | /admin/usuarios -> frontend/src/pages/admin/usuarios/ListaUsuarios.jsx | GET /users?role=employee&search=... (sugerido) -> backend/app/routes/userRoutes.py | Pendiente |
| Filtrar empleado | Francis | Dado un admin, cuando aplica filtros, entonces lista segun criterio. | /admin/usuarios -> frontend/src/pages/admin/usuarios/ListaUsuarios.jsx | GET /users?role=employee&status=... -> backend/app/routes/userRoutes.py | Base |
| Eliminar cuenta admin | Francis | Dado un admin, cuando deshabilita otra cuenta admin autorizada, entonces deja de operar. | /admin/usuarios/:id -> frontend/src/pages/admin/usuarios/DetalleUsuario.jsx | PUT /users/disable/{id} -> backend/app/routes/userRoutes.py | Base |
| Eliminar cuenta usuario | Francis | Dado un admin, cuando deshabilita usuario, entonces la cuenta queda inactiva. | /admin/usuarios/:id -> frontend/src/pages/admin/usuarios/DetalleUsuario.jsx | PUT /users/disable/{id} -> backend/app/routes/userRoutes.py | Base |
| Crear cuenta | Francis | Dado un admin, cuando completa formulario, entonces crea cuenta de empleado/cliente/admin. | /admin/usuarios/crear -> frontend/src/pages/admin/usuarios/CrearCuenta.jsx | POST /users (o endpoint admin dedicado) -> backend/app/routes/authRoutes.py | En progreso |
| Adjuntar apto fisico | Francis | Dado un usuario, cuando sube certificado, entonces queda en estado pendiente. | /perfil -> frontend/src/pages/client/perfil/VerPerfil.jsx | POST /users/upload-medical-certificate -> backend/app/routes/userRoutes.py | Base |
| Verificar apto fisico | Francis | Dado un admin, cuando aprueba/rechaza, entonces cambia estado del apto. | /admin/usuarios/:id -> frontend/src/pages/admin/usuarios/DetalleUsuario.jsx | PUT /users/update-medical-clearance/{id}, PUT /users/reject-medical/{id} -> backend/app/routes/userRoutes.py | Base |
| Modificar informacion de usuario | Francis | Dado un admin, cuando edita datos de usuario, entonces persiste cambios. | /admin/usuarios/:id -> frontend/src/pages/admin/usuarios/DetalleUsuario.jsx | Endpoint sugerido: PUT /users/{id} -> backend/app/routes/userRoutes.py | Pendiente |
| Listar condiciones de cliente | Nahuel | Dado admin/cliente, cuando consulta condiciones, entonces ve restricciones del cliente. | /admin/clientes/:id y /cliente/cuenta | Endpoint sugerido: GET /clients/{id}/conditions -> backend/app/routes/clientRoutes.py | Pendiente |
| Modificar empleado | Francis | Dado un admin, cuando cambia datos de empleado, entonces se actualiza. | /admin/usuarios/:id -> frontend/src/pages/admin/usuarios/DetalleUsuario.jsx | Endpoint sugerido: PUT /users/{id} -> backend/app/routes/userRoutes.py | Pendiente |
| Busqueda de usuarios | Francis | Dado un admin, cuando busca por nombre/email, entonces lista coincidencias. | /admin/usuarios -> frontend/src/pages/admin/usuarios/ListaUsuarios.jsx | Endpoint sugerido: GET /users?search=... -> backend/app/routes/userRoutes.py | Pendiente |
| Listar empleados | Francis | Dado un admin, cuando abre gestion usuarios, entonces ve empleados. | /admin/usuarios -> frontend/src/pages/admin/usuarios/ListaUsuarios.jsx | GET /users?role=employee -> backend/app/routes/userRoutes.py | Base |
| Listar clientes | Nahuel | Dado un admin, cuando abre clientes, entonces ve listado de clientes. | /admin/clientes -> frontend/src/pages/admin/clientes/ListaClientes.jsx | Endpoint sugerido: GET /clients -> backend/app/routes/clientRoutes.py | Pendiente |
| Listar administrativos | Francis | Dado un admin, cuando abre gestion usuarios, entonces ve administrativos. | /admin/usuarios -> frontend/src/pages/admin/usuarios/ListaUsuarios.jsx | GET /users?role=admin -> backend/app/routes/userRoutes.py | Base |

## 2) Gestion de clientes

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Solicitar reintegro de cuenta | Nahuel | Dado cliente suspendido, cuando solicita reintegro, entonces queda pedido registrado. | /cliente/cuenta -> frontend/src/pages/client/cuenta/GestionCuentaCliente.jsx | Endpoint sugerido: POST /clients/{id}/reintegration-request -> backend/app/routes/clientRoutes.py | Pendiente |
| Reintegrar cuenta | Nahuel | Dado admin, cuando aprueba reintegro, entonces cuenta vuelve a activa. | /admin/clientes/:id -> frontend/src/pages/admin/clientes/GestionCuentaAdmin.jsx | Endpoint sugerido: PUT /clients/{id}/reinstate -> backend/app/routes/clientRoutes.py | Pendiente |
| Suspender cuenta | Nahuel | Dado admin, cuando suspende cliente, entonces bloquea acceso. | /admin/clientes/:id -> frontend/src/pages/admin/clientes/GestionCuentaAdmin.jsx | Endpoint sugerido: PUT /clients/{id}/suspend -> backend/app/routes/clientRoutes.py | Pendiente |

## 3) Gestion de actividades y clases

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Crear actividad | Angel | Dado admin, cuando crea actividad, entonces queda disponible para reserva. | /admin/actividades/crear -> frontend/src/pages/admin/actividades/CrearActividad.jsx | Endpoint sugerido: POST /activities -> backend/app/routes/activityRoutes.py | Pendiente |
| Renunciar actividad | Angel | Dado kinesio asignado, cuando renuncia, entonces se libera cupo/profesional. | /kinesiologo/actividades -> frontend/src/pages/kinesiologist/actividades/MisActividades.jsx | Endpoint sugerido: PUT /activities/{id}/resign -> backend/app/routes/activityRoutes.py | Pendiente |
| Cancelar actividad | Angel | Dado admin/kinesio autorizado, cuando cancela, entonces se notifica baja. | /admin/actividades/:id -> frontend/src/pages/admin/actividades/DetalleActividad.jsx | Endpoint sugerido: PUT /activities/{id}/cancel -> backend/app/routes/activityRoutes.py | Pendiente |
| Ver actividad | Angel | Dado usuario, cuando abre detalle, entonces ve datos completos. | /admin/actividades/:id o /cliente/actividades | Endpoint sugerido: GET /activities/{id} -> backend/app/routes/activityRoutes.py | Pendiente |
| Filtrar actividades | Angel | Dado usuario, cuando filtra por dia/sala/profe, entonces reduce resultados. | /admin/actividades y /cliente/actividades | Endpoint sugerido: GET /activities?filters... -> backend/app/routes/activityRoutes.py | Pendiente |
| Buscar actividades | Angel | Dado usuario, cuando busca por texto, entonces obtiene coincidencias. | /admin/actividades y /cliente/actividades | Endpoint sugerido: GET /activities?search=... -> backend/app/routes/activityRoutes.py | Pendiente |
| Listar profesores disponibles | Angel | Dado admin, cuando crea actividad, entonces ve profesionales disponibles. | /admin/actividades/crear | Endpoint sugerido: GET /activities/catalog/professionals -> backend/app/routes/activityRoutes.py | Pendiente |
| Listar horarios disponibles | Angel | Dado admin, cuando define turno, entonces ve horarios disponibles. | /admin/actividades/crear | Endpoint sugerido: GET /activities/catalog/schedules -> backend/app/routes/activityRoutes.py | Pendiente |
| Listar dias disponibles | Angel | Dado admin, cuando configura agenda, entonces ve dias posibles. | /admin/actividades/crear | Endpoint sugerido: GET /activities/catalog/days -> backend/app/routes/activityRoutes.py | Pendiente |
| Listar salas disponibles | Angel | Dado admin, cuando crea actividad, entonces evita solape de salas. | /admin/actividades/crear | Endpoint sugerido: GET /activities/catalog/rooms -> backend/app/routes/activityRoutes.py | Pendiente |
| Listar especializaciones | Angel | Dado admin, cuando asigna profe, entonces filtra por especializacion. | /admin/actividades/crear | Endpoint sugerido: GET /activities/catalog/specializations -> backend/app/routes/activityRoutes.py | Pendiente |

## 4) Gestion de reservas de turnos

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Inscribirse a actividad fija | Agustin | Dado cliente, cuando elige actividad fija, entonces se genera reserva. | /cliente/reservas/inscribir -> frontend/src/pages/client/reservas/InscribirActividad.jsx | Endpoint sugerido: POST /reservations/fixed -> backend/app/routes/reservationRoutes.py | Pendiente |
| Inscribirse a actividad individual | Agustin | Dado cliente, cuando elige actividad individual, entonces se genera turno. | /cliente/reservas/inscribir -> frontend/src/pages/client/reservas/InscribirActividad.jsx | Endpoint sugerido: POST /reservations/individual -> backend/app/routes/reservationRoutes.py | Pendiente |
| Ver mis reservas | Agustin | Dado cliente, cuando entra a reservas, entonces ve sus turnos. | /cliente/reservas -> frontend/src/pages/client/reservas/MisReservas.jsx | Endpoint sugerido: GET /reservations/me -> backend/app/routes/reservationRoutes.py | Pendiente |

## 5) Gestion de lista de espera

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Dar de baja en lista de espera | Agustin | Dado cliente en espera, cuando cancela, entonces se lo elimina de lista. | /cliente/lista-espera -> frontend/src/pages/client/listaEspera/ListaEspera.jsx | Endpoint sugerido: DELETE /waitlist/{id} -> backend/app/routes/waitlistRoutes.py | Pendiente |
| Listar lista de espera | Agustin | Dado cliente, cuando abre lista, entonces ve su estado en espera. | /cliente/lista-espera -> frontend/src/pages/client/listaEspera/ListaEspera.jsx | Endpoint sugerido: GET /waitlist/me -> backend/app/routes/waitlistRoutes.py | Pendiente |

## 6) Gestion de asistencias

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Registrar asistencia por DNI | Ezequiel | Dado personal autorizado, cuando ingresa DNI, entonces registra asistencia. | /admin/asistencias y /kinesiologo/asistencias | Endpoint sugerido: POST /attendances/by-dni -> backend/app/routes/attendanceRoutes.py | Pendiente |
| Dejar comentario en asistencia | Ezequiel | Dado una asistencia, cuando agrega comentario, entonces queda auditado. | /admin/asistencias y /kinesiologo/asistencias | Endpoint sugerido: POST /attendances/{id}/comments -> backend/app/routes/attendanceRoutes.py | Pendiente |
| Eliminar comentario en asistencia | Ezequiel | Dado un comentario, cuando se elimina, entonces deja de mostrarse. | /admin/asistencias y /kinesiologo/asistencias | Endpoint sugerido: DELETE /attendances/{id}/comments/{comment_id} -> backend/app/routes/attendanceRoutes.py | Pendiente |
| Modificar comentario en asistencia | Ezequiel | Dado un comentario, cuando se edita, entonces queda actualizado. | /admin/asistencias y /kinesiologo/asistencias | Endpoint sugerido: PUT /attendances/{id}/comments/{comment_id} -> backend/app/routes/attendanceRoutes.py | Pendiente |

## 7) Gestion de pago

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Inscribirse a plan | Ezequiel | Dado cliente, cuando elige plan, entonces queda suscripto. | /cliente/suscripciones -> frontend/src/pages/client/pagos/MisSuscripciones.jsx | Endpoint sugerido: POST /subscriptions/plans -> backend/app/routes/paymentRoutes.py | Pendiente |
| Inscribir actividad individual | Ezequiel | Dado cliente, cuando paga actividad individual, entonces habilita reserva. | /cliente/suscripciones -> frontend/src/pages/client/pagos/MisSuscripciones.jsx | Endpoint sugerido: POST /subscriptions/activities/individual -> backend/app/routes/paymentRoutes.py | Pendiente |
| Ver suscripciones | Ezequiel | Dado cliente, cuando abre suscripciones, entonces ve planes activos/historial. | /cliente/suscripciones -> frontend/src/pages/client/pagos/MisSuscripciones.jsx | Endpoint sugerido: GET /subscriptions/me -> backend/app/routes/paymentRoutes.py | Pendiente |
| Pagar Mercado Pago | Ezequiel | Dado cliente, cuando confirma pago, entonces se crea preferencia y checkout. | /cliente/suscripciones -> frontend/src/pages/client/pagos/MisSuscripciones.jsx | Endpoint sugerido: POST /payments/mercadopago/checkout -> backend/app/routes/paymentRoutes.py | Pendiente |

## 8) Gestion de cancelaciones y politicas

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Cancelar turno | Agustin | Dado cliente con reserva activa, cuando cancela, entonces libera el turno. | /cliente/reservas -> frontend/src/pages/client/reservas/MisReservas.jsx | Endpoint sugerido: PUT /reservations/{id}/cancel -> backend/app/routes/reservationRoutes.py | Pendiente |


