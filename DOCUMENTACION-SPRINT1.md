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
| Registrar usuario | Agustin | E1: datos válidos + foto DNI → cuenta creada, redirige a /login. E2: sin apto físico → cuenta activa sin permisos hasta adjuntarlo. E3: con apto físico → cuenta activa, apto en estado "pendiente de aprobación". E4: email ya registrado → error 409. E5: password < 6 chars → error validación. E6: validación DNI foto → TODO (sistema externo, pendiente). E7: 2FA via mail → TODO (pendiente). | `/registro` → `Registro.jsx` | `POST /users` → `rutas_autenticacion.py` · `POST /users/upload-dni` → `rutas_usuarios.py` (E6) · `POST /users/upload-medical-certificate` → `rutas_usuarios.py` (E3) | Front ✓ / Back ✓ (E6 sistema externo DNI: pendiente; E7 2FA: pendiente) |
| Iniciar sesion | Agustin | E1: credenciales correctas + cuenta activa → JWT devuelto, redirige según rol. E2: email inexistente → error 404. E3: password incorrecta <3 intentos → error 401, incrementa contador. E4: 3er intento fallido → cuenta deshabilitada; TODO: enviar mail recuperación. E5: cuenta suspendida → error 403. | `/login` → `Login.jsx` | `POST /login` → `rutas_autenticacion.py` → `login_user()` en `servicio_usuarios.py` | Front ✓ / Back ✓ (E4 mail recuperación: pendiente; reinicio contador en 3er intento: pendiente) |
| Cerrar sesion | Francis | E1: confirma → logout + redirige a /. E2: cancela → permanece. | `/` → InicioPublico.jsx (modal logout) | `POST /logout` → rutas_autenticacion.py | Front ✓ / Back ✓ |
| Recuperar contrasena | Francis | E1: email valido → envia link de recuperacion. E2: email no registrado → mensaje de error. | `/recuperar-contrasena` → RecuperarContrasena.jsx | `POST /auth/recovery/request` → rutas_autenticacion.py | Front ✓ / Back ✓ |
| Restablecer contrasena | Francis | E1: contrasenas validas → actualiza y redirige al login. E2: menos de 6 chars → error. E3: no coinciden → error. | `/restablecer-contrasena` → RestablecerContrasena.jsx | `POST /auth/recovery/reset` → rutas_autenticacion.py | Front ✓ / Back ✓ |
| Cambiar contrasena | Agustin | E1: nueva ≥ 6 chars + coinciden → contraseña actualizada, logout y redirige a /login. E2: < 6 chars → error frontend. E3: no coinciden → error frontend. E4: cancelar → formulario limpio, sin cambios. | `/cliente/cuenta` → `GestionCuentaCliente.jsx` (sección "Cambiar contraseña") | `PUT /users/change-password` → `rutas_usuarios.py` → `change_password()` en `servicio_usuarios.py` | Front ✓ / Back ✓ |
| Subir DNI | Agustin | E1: sistema externo valida foto → `dni_verified=true`. E2: DNI no reconocido → error externo. E3: menor de edad → error externo. E4: fallo conexión → error externo. Escenarios E1–E4 pendientes de integración con sistema externo. | `/registro` → `Registro.jsx` (campo "Foto del DNI", obligatorio) | `POST /users/upload-dni` → `rutas_usuarios.py` (guarda foto; TODO: envía a sistema externo) | Front ✓ / Back ✓ (integración sistema externo: pendiente) |
| Ver perfil | Agustin | E1: usuario autenticado selecciona "Mi Perfil" → muestra nombre, apellido, email, rol, estado cuenta, estado DNI, estado apto físico y fecha de registro. | `/perfil` → `VerPerfil.jsx` (accesible desde barra lateral para todos los roles) | `GET /users/me` → `rutas_usuarios.py` | Front ✓ / Back ✓ |
| Editar perfil | Agustin | E1: nombre/apellido válidos → actualiza y muestra confirmación, redirige a /perfil. E2: campo vacío → validación HTML nativa (required). E3: cancelar → descarta cambios, vuelve a /perfil. | `/perfil/editar` → `EditarPerfil.jsx` (botón "Editar perfil" en VerPerfil) | `PUT /users/update-info` → `rutas_usuarios.py` → `update_user_info()` en `servicio_usuarios.py` | Front ✓ / Back ✓ |
| Buscar empleado | Francis | E1: nombre coincide → muestra listado filtrado. E2: sin coincidencias → informa no encontrados. | `/staff` → Staff.jsx | `GET /staff?search=` → rutas_autenticacion.py | Front ✓ / Back ✓ |
| Filtrar empleado | Francis | E1: filtro por especializacion → muestra coincidencias. E2: sin resultados → informa no encontrados. E3: limpiar filtros → muestra lista completa. | `/staff` → Staff.jsx | `GET /staff?specialization=` → rutas_autenticacion.py | Front ✓ / Back ✓ |
| Eliminar cuenta admin | Francis | E1-E5: admin confirma → elimina cuenta de cualquier rol. E6: cancela → no elimina. | `/admin/usuarios` → ListaUsuarios.jsx | `DELETE /users/{user_id}` → rutas_usuarios.py | Front ✓ / Back ✓ |
| Eliminar cuenta usuario | Francis | E1: usuario confirma → elimina cuenta, cierra sesion y redirige a /. E2: cancela → no elimina. | `/cliente/cuenta` → GestionCuentaCliente.jsx | `DELETE /users/me` → rutas_usuarios.py | Front ✓ / Back ✓ |
| Crear cuenta | Francis | `/admin/usuarios/crear` → `CrearCuenta.jsx` | `POST /users` → `rutas_autenticacion.py`; `POST /users/{id}/upload-medical-certificate` (apto opcional para clientes) | E1: recepcionista creada; E2: profesor con especialidad; E3: cliente con apto opcional; E4: admin creado; E5: email duplicado → error; E6: profesor sin especialidad → error frontend; E7: contraseña < 6 → error frontend | Front ✓ / Back ✓ (envío de credenciales por email: pendiente) |
| Adjuntar apto fisico | Agustin | `/perfil` → `VerPerfil.jsx` (sección "Adjuntar / Renovar apto físico") | `POST /users/upload-medical-certificate` → `rutas_usuarios.py` | E1: cliente sube apto → status = pending; E2: sin archivo → validación HTML; E3: re-sube apto rechazado/vencido → backend reemplaza archivo | Front ✓ / Back ✓ |
| Verificar apto fisico | Agustin | `/admin/clientes/aptos-fisicos` → `AptosFisicosAdmin.jsx` | `GET /users/pending-medical`; `PUT /users/update-medical-clearance/{id}`; `PUT /users/reject-medical/{id}` → `rutas_usuarios.py` | E1: admin aprueba → status = approved; E2: admin rechaza → status = rejected; E3: sin pendientes → mensaje informativo | Front ✓ / Back ✓ |
| Modificar informacion de usuario | Nahuel | E1: nombre/apellido guardados exitosamente. E2: profesor → campo especialidad disponible. E3: profesor con clases asignadas → TODO pendiente módulo actividades. E4: cancelar → restaura sin cambios. | `/admin/usuarios/:id` → DetalleUsuario.jsx | `PUT /users/{id}/modify` → rutas_usuarios.py | Front ✓ / Back ✓ (E3 pendiente módulo actividades) |
| Listar condiciones de cliente | Nahuel | E1: hay inscriptos → tabla con nombre, email, tipo reserva, condición de acceso y estado de pago. E2: sin inscriptos → "No hay inscriptos en esta actividad." | `/admin/actividades/:id` → DetalleActividad.jsx | `GET /activities/{id}/clients` → rutas_actividades.py | Front ✓ / Back ✓ |
| Modificar empleado | Francis | E1: nombre/apellido guardados exitosamente. E2: cancelar → restaura sin cambios. E3: validación → nombre y apellido son requeridos; email es solo lectura. | `/admin/usuarios/:id` → DetalleUsuario.jsx | `PUT /users/{id}/modify` → rutas_usuarios.py | Front ✓ / Back ✓ |
| Busqueda de usuarios | Francis | E1: búsqueda con resultados → tabla con usuarios coincidentes (por nombre/apellido/email/DNI y rol). E2: sin resultados → "No se encontraron usuarios." | `/admin/usuarios` → ListaUsuarios.jsx | `GET /users/search` → rutas_usuarios.py | Front ✓ / Back ✓ |
| Listar empleados | Agustin | E1: hay empleados para el rol → tabla filtrada. E2: sin empleados → "No se encontraron usuarios." E3: limpiar filtros → limpiar() recarga todos los usuarios. | `/admin/usuarios` → ListaUsuarios.jsx (filtro por rol professor/receptionist) | `GET /users/search?role=professor\|receptionist` → rutas_usuarios.py | Front ✓ / Back ✓ |
| Listar clientes | Francis | E1: existen clientes → muestra tabla con estado. E2: sin clientes → mensaje vacio. E3: limpiar filtros → lista completa. | `/admin/clientes` → ListaClientes.jsx | `GET /clients` → rutas_clientes.py | Front ✓ / Back ✓ |
| Listar administrativos | Agustin | E1: existen administrativos → tabla filtrable de admin/profesor/recepcionista. E2: sin resultados → "No se encontraron usuarios.". E3: limpiar filtros → lista completa. | `/admin/usuarios` → ListaUsuarios.jsx (filtro por rol: admin/profesor/recepcionista) | `GET /users/search?role=...` → rutas_usuarios.py | Front ✓ / Back ✓ |

## 2) Gestion de clientes

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Solicitar reintegro de cuenta | Nahuel | E1: motivo ingresado + cuenta suspendida → solicitud registrada, estado = "pending_reintegration". E2: motivo vacío → error de validación. E3: cuenta no suspendida → error 400 del backend. | `/cliente/cuenta` → GestionCuentaCliente.jsx (sección reintegro, visible solo si cuenta suspendida) | `POST /clients/{id}/reintegration-request` → rutas_clientes.py | Front ✓ / Back ✓ |
| Reintegrar cuenta | Nahuel | E1: con solicitud pendiente → admin aprueba, cuenta → "active". E2: sin solicitud previa → admin reintegra directamente, misma acción. E3: rechazar solicitud → `PUT /clients/{id}/reject-reintegration`, cuenta vuelve a "suspended". | `/admin/clientes/:id` → GestionCuentaAdmin.jsx (botones Reintegrar / Rechazar según estado) | `PUT /clients/{id}/reinstate` + `PUT /clients/{id}/reject-reintegration` → rutas_clientes.py | Front ✓ / Back ✓ |
| Suspender cuenta | Nahuel | E1: motivo ingresado → cuenta pasa a "suspended", mail pendiente. E2: cancelar → modal se cierra sin cambios (frontend). E3: motivo vacío → error de validación (Field min_length=1). | `/admin/clientes/:id` → GestionCuentaAdmin.jsx (botón Suspender + modal con motivo) | `PUT /clients/{id}/suspend` → rutas_clientes.py | Front ✓ / Back ✓ |

## 3) Gestion de actividades y clases

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Crear actividad | Angel | E1: admin completa form con sala/tipo/horario/especialidad y crea → guardada, visible en "Salas Disponibles". E2: clase individual sin profesor → guardada sin prof asignado, prof puede asumirla luego. E3: cupos > capacidad sala → error 400, no se crea. | `/admin/actividades/crear` → `CrearActividad.jsx` | `POST /activities/` → `rutas_actividades.py` | Front ✓ / Back ✓ (mail prof: pendiente) |
| Renunciar actividad | Angel |  |  |  |  |
| Cancelar actividad | Angel | E1: admin confirma cancelación → status = "cancelled", desaparece del listado activo e informa éxito. E2: actividad en curso → validación pendiente en back. E3: admin cancela el diálogo → no se realiza ningún cambio. | `/admin/actividades` → `ListaActividades.jsx` (botón Cancelar + confirm) | `DELETE /activities/{id}` → `rutas_actividades.py` | Front ✓ / Back ✓ (mail alumnos/prof: pendiente; validar "en curso": pendiente) |
| Ver actividad | Angel | E1: usuario selecciona actividad → modal con nombre, sala, especialidad, horario/fecha, profesor, precio, cupos, descripción, requisitos. | `/` → `InicioPublico.jsx` (modal "Ver") · `/admin/actividades/{id}` → `DetalleActividad.jsx` | `GET /activities/{id}` → `rutas_actividades.py` | Front ✓ / Back ✓ |
| Filtrar actividades | Angel |  |  |  | |
| Buscar actividades | Angel |  |  |  |  |
| Listar profesores disponibles | Angel |  |  |  |  |
| Listar horarios disponibles | Angel | Horarios fijos 09:00–16:00 (franja de 1 h). Se muestran en el formulario de creación. | `/admin/actividades/crear` → `CrearActividad.jsx` (selector HORAS) | — (lógica en frontend) | Front ✓ |
| Listar dias disponibles | Angel | Días Lunes–Viernes. Se muestran como botones en el formulario de creación (solo clases fijas). | `/admin/actividades/crear` → `CrearActividad.jsx` (botones DIAS) | — (lógica en frontend) | Front ✓ |
| Listar salas disponibles | Angel | E1: existen actividades activas → cards en pantalla principal con nombre, sala, tipo, horario y precio. E2: sin actividades → mensaje informativo. | `/` → `InicioPublico.jsx` (sección "Salas Disponibles") | `GET /activities/?status=active` → `rutas_actividades.py` · `GET /rooms/` → `rutas_salas.py` | Front ✓ / Back ✓ |
| Listar especializaciones | Angel | Lista fija de 14 especializaciones (Kinesiología deportiva, Fisioterapia, Tren superior/medio/inferior, etc.) en el formulario de creación. | `/admin/actividades/crear` → `CrearActividad.jsx` (select ESPECIALIZACIONES) | — (constante en frontend) | Front ✓ |

## 4) Gestion de reservas de turnos

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Inscribirse a actividad fija | Francis | E1: suscripcion → confirmada. E2: pago total → confirmada. E3: sena → pendiente. E4: 65+ → descuento 20%. E5/E6: sin cupos → lista espera (prioridad abonado). E7: credito → confirmada. E8: error pago → cancelada. E9: cancelar → inicio. | `/cliente/reservas/inscribir` → InscribirActividad.jsx | `POST /reservations/fixed` → rutas_reservas.py | Front ✓ / Back ✓ |
| Inscribirse a actividad individual | Francis | E1: pago total → confirmada. E2: sena → pendiente. E3: sin cupos → lista espera. E4: credito → confirmada. E5: error pago → cancelada. E6: cancelar → inicio. | `/cliente/reservas/inscribir` → InscribirActividad.jsx | `POST /reservations/individual` → rutas_reservas.py | Front ✓ / Back ✓ |
| Ver mis reservas | Ezequiel | E1: cliente tiene reservas → listado con nombre actividad, tipo, horario, estado y pago. E2: sin reservas → "No tenés reservas para ver". | `/cliente/reservas` → `MisReservas.jsx` | `GET /reservations/me` → `rutas_reservas.py` → `get_user_reservations_enriched()` | Front ✓ / Back ✓ |

## 5) Gestion de lista de espera

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Dar de baja en lista de espera | Nahuel |  |  |  |  |
| Listar lista de espera | Nahuel |  |  |  |  |

## 6) Gestion de asistencias

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---||---|
| Registrar asistencia por DNI | Ezequiel | E1: DNI válido + inscripto, sin comentario → asistencia registrada. E2: DNI válido + inscripto, con comentario → asistencia + comentario. E3: DNI de cliente no inscripto en la clase → error 403 "El cliente no se anotó para dicha clase". E4: asistencia ya registrada → error 409. | `/profesor/actividades/:id/asistencias` → `kinesiologist/asistencias/RegistrarAsistencia.jsx` (sección superior) | `POST /attendances/by-dni` → `rutas_asistencias.py` → `marcar_asistencia_por_dni()` | Front ✓ / Back ✓ |
| Dejar comentario en asistencia | Ezequiel | E1: asistencia sin comentario → botón "Agregar", input inline, guardar → comentario guardado. | `/profesor/actividades/:id/asistencias` → `RegistrarAsistencia.jsx` (tabla inferior, botón Agregar) | `PATCH /attendances/{id}/comment` → `rutas_asistencias.py` → `actualizar_comentario()` | Front ✓ / Back ✓ |
| Modificar comentario en asistencia | Ezequiel | E1: asistencia con comentario → botón "Editar", input inline con valor actual, guardar → comentario actualizado. | `/profesor/actividades/:id/asistencias` → `RegistrarAsistencia.jsx` (tabla inferior, botón Editar) | `PATCH /attendances/{id}/comment` → `rutas_asistencias.py` → `actualizar_comentario()` | Front ✓ / Back ✓ |
| Eliminar comentario en asistencia | Ezequiel | E1: asistencia con comentario → botón "Eliminar" → comentario queda en null. | `/profesor/actividades/:id/asistencias` → `RegistrarAsistencia.jsx` (tabla inferior, botón Eliminar) | `DELETE /attendances/{id}/comment` → `rutas_asistencias.py` → `eliminar_comentario()` | Front ✓ / Back ✓ |

## 7) Gestion de pago

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Inscribirse a plan | Ezequiel |  |  |  |  |
| Inscribir actividad individual | Ezequiel |  |  |  |  |
| Ver suscripciones | Ezequiel |  |  |  |  |
| Pagar Mercado Pago | Ezequiel |  |  |  |  |

## 8) Gestion de cancelaciones y politicas

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Cancelar turno | Ezequiel |  |  |  |  |


