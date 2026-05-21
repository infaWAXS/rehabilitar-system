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
| Registrar usuario | Agustin |  |  |  |  |
| Iniciar sesion | Agustin |  |  |  |  |
| Cerrar sesion | Francis | E1: confirma → logout + redirige a /. E2: cancela → permanece. | `/` → InicioPublico.jsx (modal logout) | `POST /logout` → rutas_autenticacion.py | Front ✓ / Back ✓ |
| Recuperar contrasena | Francis | E1: email valido → envia link de recuperacion. E2: email no registrado → mensaje de error. | `/recuperar-contrasena` → RecuperarContrasena.jsx | `POST /auth/recovery/request` → rutas_autenticacion.py | Front ✓ / Back ✓ |
| Restablecer contrasena | Francis | E1: contrasenas validas → actualiza y redirige al login. E2: menos de 6 chars → error. E3: no coinciden → error. | `/restablecer-contrasena` → RestablecerContrasena.jsx | `POST /auth/recovery/reset` → rutas_autenticacion.py | Front ✓ / Back ✓ |
| Cambiar contrasena | Agustin |  |  |  |  |
| Subir DNI | Agustin |  |  |  |  |
| Ver perfil | Agustin |  |  |  |  |
| Editar perfil | Agustin |  |  |  |  |
| Buscar empleado | Francis | E1: nombre coincide → muestra listado filtrado. E2: sin coincidencias → informa no encontrados. | `/staff` → Staff.jsx | `GET /staff?search=` → rutas_autenticacion.py | Front ✓ / Back ✓ |
| Filtrar empleado | Francis | E1: filtro por especializacion → muestra coincidencias. E2: sin resultados → informa no encontrados. E3: limpiar filtros → muestra lista completa. | `/staff` → Staff.jsx | `GET /staff?specialization=` → rutas_autenticacion.py | Front ✓ / Back ✓ |
| Eliminar cuenta admin | Francis | E1-E5: admin confirma → elimina cuenta de cualquier rol. E6: cancela → no elimina. | `/admin/usuarios` → ListaUsuarios.jsx | `DELETE /users/{user_id}` → rutas_usuarios.py | Front ✓ / Back ✓ |
| Eliminar cuenta usuario | Francis | E1: usuario confirma → elimina cuenta, cierra sesion y redirige a /. E2: cancela → no elimina. | `/cliente/cuenta` → GestionCuentaCliente.jsx | `DELETE /users/me` → rutas_usuarios.py | Front ✓ / Back ✓ |
| Crear cuenta | Francis |  |  |  |  |
| Adjuntar apto fisico | Agustin |  |  |  |  |
| Verificar apto fisico | Agustin |  |  |  |  |
| Modificar informacion de usuario | Nahuel |  |  |  |  |
| Listar condiciones de cliente | Nahuel |  |  |  |  |
| Modificar empleado | Francis |  |  |  |  |
| Busqueda de usuarios | Francis |  |  |  |  |
| Listar empleados | Agustin |  |  |  |  |
| Listar clientes | Francis | E1: existen clientes → muestra tabla con estado. E2: sin clientes → mensaje vacio. E3: limpiar filtros → lista completa. | `/admin/clientes` → ListaClientes.jsx | `GET /users/clients/list` → rutas_usuarios.py | Front ✓ / Back ✓ |
| Listar administrativos | Agustin |  |  |  |  |

## 2) Gestion de clientes

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Solicitar reintegro de cuenta | Nahuel |  |  |  |  |
| Reintegrar cuenta | Nahuel |  |  |  |  |
| Suspender cuenta | Nahuel |  |  |  |  |

## 3) Gestion de actividades y clases

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Crear actividad | Angel |  |  |  |  |
| Renunciar actividad | Angel |  |  |  |  |
| Cancelar actividad | Angel |  |  |  |  |
| Ver actividad | Angel |  |  |  |  |
| Filtrar actividades | Angel |  |  |  |  |
| Buscar actividades | Angel |  |  |  |  |
| Listar profesores disponibles | Angel |  |  |  |  |
| Listar horarios disponibles | Angel |  |  |  |  |
| Listar dias disponibles | Angel |  |  |  |  |
| Listar salas disponibles | Angel |  |  |  |  |
| Listar especializaciones | Angel |  |  |  |  |

## 4) Gestion de reservas de turnos

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Inscribirse a actividad fija | Francis | E1: suscripcion → confirmada. E2: pago total → confirmada. E3: sena → pendiente. E4: 65+ → descuento 20%. E5/E6: sin cupos → lista espera (prioridad abonado). E7: credito → confirmada. E8: error pago → cancelada. E9: cancelar → inicio. | `/cliente/reservas/inscribir` → InscribirActividad.jsx | `POST /reservations/fixed` → rutas_reservas.py | Front ✓ / Back ✓ |
| Inscribirse a actividad individual | Francis | E1: pago total → confirmada. E2: sena → pendiente. E3: sin cupos → lista espera. E4: credito → confirmada. E5: error pago → cancelada. E6: cancelar → inicio. | `/cliente/reservas/inscribir` → InscribirActividad.jsx | `POST /reservations/individual` → rutas_reservas.py | Front ✓ / Back ✓ |
| Ver mis reservas | Ezequiel |  |  |  |  |

## 5) Gestion de lista de espera

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Dar de baja en lista de espera | Nahuel |  |  |  |  |
| Listar lista de espera | Nahuel |  |  |  |  |

## 6) Gestion de asistencias

| HU | Responsable | Escenario resumido | Front | Back | Estado |
|---|---|---|---|---|---|
| Registrar asistencia por DNI | Ezequiel |  |  |  |  |
| Dejar comentario en asistencia | Ezequiel |  |  |  |  |
| Eliminar comentario en asistencia | Ezequiel |  |  |  |  |
| Modificar comentario en asistencia | Ezequiel |  |  |  |  |

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


