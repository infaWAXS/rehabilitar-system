# Guión de Demo — Historias de Usuario RehabilitAR

> Rama: `feat/testing`
> Última actualización: 2026-07-11

## Preparación previa (ejecutar una sola vez)

```bash
# Activar entorno virtual
& .venv\Scripts\Activate.ps1

# Correr seed (crea usuarios, salas, planes, notificaciones y datos demo)
python backend/database/seed_mock.py

# Iniciar backend
python backend/main.py

# Iniciar frontend (otra terminal)
cd frontend && npm start
```

---

## Credenciales de acceso

| Rol                      | Email                         | Contraseña   |
|--------------------------|-------------------------------|--------------|
| Admin                    | admin@rehabilitar.com         | Admin123     |
| Cliente                  | cliente@rehabilitar.com       | Cliente123   |
| Recepcionista            | empleado@rehabilitar.com      | Empleado123  |
| Profesor (Fisioterapia)  | profesor@rehabilitar.com      | Profesor123  |
| Profesor (Kinesiología)  | profe2@rehabilitar.com        | Profesor123  |
| Profesor (Pilates)       | profe3@rehabilitar.com        | Profesor123  |
| Profesor Pepe Muñoz      | pepemunoz@rehabilitar.com     | Profesor123  |
| Cliente abonado          | abonado@rehabilitar.com       | Abonado123   |

---

## HU 1 — Desactivar notificación

**Precondición:** Loguearse como `cliente@rehabilitar.com`. Las notificaciones deben estar activadas (estado por defecto).

| # | Escenario | Datos | Pasos | Resultado esperado |
|---|-----------|-------|-------|--------------------|
| E1 | Desactivar notificaciones | — | 1. Hacer click en el ícono de campana (esquina superior derecha). 2. Desmarcar el checkbox "Notificaciones del sistema". | El switch queda desactivado. El sistema deja de enviar notificaciones al usuario. |

---

## HU 2 — Activar notificación

**Precondición:** Las notificaciones deben estar desactivadas (completar HU 1 primero).

| # | Escenario | Datos | Pasos | Resultado esperado |
|---|-----------|-------|-------|--------------------|
| E1 | Activar notificaciones | — | 1. Hacer click en el ícono de campana. 2. Marcar el checkbox "Notificaciones del sistema". | El switch queda activado. El sistema vuelve a enviar notificaciones al usuario. |

---

## HU 3 — Marcar notificación como leído

**Precondición:** Loguearse como `cliente@rehabilitar.com`. El seed crea 4 notificaciones sin leer.

| # | Escenario | Datos | Pasos | Resultado esperado |
|---|-----------|-------|-------|--------------------|
| E1 | Marcar una notificación como leída | Notificación "Turno confirmado" | 1. Abrir el panel de notificaciones (campana). 2. Hacer click en la notificación "Turno confirmado". | La notificación se marca como leída. La insignia roja del ícono disminuye (o desaparece si no quedan más sin leer). |
| E2 | Marcar todas como leídas | Las 4 notificaciones del seed | 1. Repetir el click en cada notificación. | El ícono de campana deja de mostrar la insignia roja. |

---

## HU 4 — Aceptar Actividad

**Precondición:** El seed crea dos sugerencias pendientes: "Prueba" (Marcos Profesor, Fisioterapia) y "Pilates avanzado" (Carlos Pilates). Loguearse como `admin@rehabilitar.com`.

**Orden recomendado:** Demostrar E1 (aceptar "Prueba"), luego E2 (rechazar "Pilates avanzado"). Tras aceptar/rechazar, la sugerencia desaparece de la lista.

| # | Escenario | Datos | Pasos | Resultado esperado |
|---|-----------|-------|-------|--------------------|
| E1 | Aceptar sugerencia | Sugerencia: "Prueba", Precio: $5000 | 1. Ir a Actividades → Sugerencias Pendientes. 2. Hacer click en "Ver detalle" de "Prueba". 3. Ingresar precio $5000 en el campo "Precio de la clase". 4. Hacer click en "Aceptar". | Aparece el mensaje: **"Sugerencia aceptada. La actividad ya está disponible."** La sugerencia desaparece de la lista y la actividad queda creada. |
| E2 | Rechazar sugerencia | Sugerencia: "Pilates avanzado" | 1. Hacer click en "Ver detalle" de "Pilates avanzado". 2. Hacer click en "Rechazar". 3. En el modal de confirmación, hacer click en "Sí, rechazar". | Aparece el mensaje: **"Sugerencia rechazada"** La sugerencia desaparece de la lista. |

---

## HU 5 — Asumir Actividad

**Precondición:** El seed crea la actividad "Fisioterapia sin asignar" (fija, Jueves · 11:00–12:00, sin profesor asignado). Loguearse como `profesor@rehabilitar.com` (Marcos Profesor, especialidad Fisioterapia).

| # | Escenario | Datos | Pasos | Resultado esperado |
|---|-----------|-------|-------|--------------------|
| E1 | Asumir actividad sin profesor | Actividad: "Fisioterapia sin asignar" | 1. Ir a Actividades → Mis Actividades. 2. En la sección "Actividades que podés asumir" localizar "Fisioterapia sin asignar". 3. Hacer click en "Asumir". 4. En el modal "Confirmar asignación" hacer click en "Confirmar". | Aparece el mensaje: **"Asumiste la actividad "Fisioterapia sin asignar" correctamente."** La actividad pasa a aparecer en "Mis actividades" con el profesor asignado. |

---

## HU 6 — Sugerir Actividad

**Precondición:** Loguearse como `profesor@rehabilitar.com` (Marcos Profesor).

> **Nota sobre fechas:** Las fechas del HU original (mayo/junio 2026) ya pasaron. Usar fechas futuras (agosto–diciembre 2026). Para E4 (fin de semana), usar el próximo sábado o domingo. El HU menciona "20/8/2026" como fin de semana, pero ese día es jueves — es un error en el HU; usar otra fecha.

| # | Escenario | Datos | Pasos | Resultado esperado |
|---|-----------|-------|-------|--------------------|
| E1 | Sugerir actividad fija | Nombre: "Elongación", Especialidad: Fisioterapia, Sala: Sala 1, Tipo: Fija, Día: Lunes, Hora: 09:00, Duración: 1h, Cupos: 5 | 1. Ir a Actividades → Sugerir Actividad. 2. Completar el formulario. 3. Hacer click en "Enviar sugerencia". | Aparece el mensaje: **"Tu sugerencia fue enviada. Queda pendiente de aprobación por un administrador."** |
| E2 | Sugerir actividad individual | Nombre: "Kinesiología individual", Tipo: Individual, Fecha: (cualquier día hábil futuro), Hora: 10:00, Sala: Sala 2, Cupos: 1 | 1. Mismo flujo con tipo Individual. | Mismo mensaje de éxito. |
| E3 | Fecha pasada (individual) | Fecha: fecha anterior a hoy | 1. Seleccionar una fecha pasada. 2. Salir del campo (clic afuera). | El campo muestra el error inline: **"Ingresá una fecha válida."** |
| E4 | Fin de semana (individual) | Fecha: próximo sábado o domingo | 1. Seleccionar una fecha de fin de semana. | El campo muestra: **"Las actividades individuales no se pueden programar en fin de semana."** |
| E5 | Feriado (individual) | Fecha: 17/08/2026 (Paso a la Inmortalidad del Gral. San Martín) | 1. Seleccionar 17/08/2026. | El campo muestra: **"La fecha seleccionada es feriado (Paso a la Inmortalidad del General José de San Martín). Elegí otra fecha."** |

---

## HU 7 — Crear Cuenta (Admin)

**Precondición:** Loguearse como `admin@rehabilitar.com`.

**Orden recomendado:** Ejecutar E1 primero (crea `pepe@rehabilitar.com`). E5 reutiliza ese mismo email para demostrar el conflicto. E7 usa DNI `46201004`, que el seed ya registra como profesor (Bruno Demo).

| # | Escenario | Datos | Pasos | Resultado esperado |
|---|-----------|-------|-------|--------------------|
| E1 | Crear cuenta exitosa (cliente) | Nombre: Pepe, Apellido: Viral, Email: pepe@rehabilitar.com, DNI: 12345678, Rol: Cliente, Fecha nac.: 01/01/1990 | 1. Ir a Usuarios → Crear Cuenta. 2. Completar los campos. 3. Hacer click en "Crear cuenta". | Aparece el mensaje: **"Cuenta creada exitosamente. Se envió una contraseña temporal al correo del usuario."** |
| E2 | Crear cuenta exitosa (profesor) | Nombre: Ana, Apellido: Kine, Email: anakine@rehabilitar.com, DNI: 87654321, Rol: Profesor, Especialidad: Fisioterapia, Fecha nac.: 15/06/1985 | 1. Mismo flujo eligiendo Rol = Profesor y completando especialidad. | Mismo mensaje de éxito. |
| E3 | Menor de edad | Nombre: Pedro, Email: pedro@rehabilitar.com, DNI: 11223344, Fecha nac.: (fecha con resultado < 18 años) | 1. Ingresar fecha de nacimiento de menor de edad. | El formulario bloquea el envío con un error de validación. |
| E4 | Profesor sin especialidad | Nombre: Juan, Email: juan@rehabilitar.com, DNI: 99887766, Rol: Profesor, Especialidad: (vacío) | 1. Seleccionar Rol = Profesor y dejar especialidad vacía. 2. Intentar crear. | Aparece el mensaje: **"Un profesor debe tener una especialidad asignada."** |
| E5 | Email ya registrado | Email: pepe@rehabilitar.com (creado en E1), DNI: 55556666, Rol: Cliente | 1. Intentar crear una cuenta con el email del E1. | Aparece el mensaje: **"El email ya está registrado"** |
| E6 | DNI duplicado mismo rol (cliente) | Email: nuevo@rehabilitar.com, DNI: 12345678 (el del cliente creado en E1), Rol: Cliente | 1. Usar el DNI del E1 con un email diferente. | Aparece el mensaje: **"Ya existe un usuario con ese DNI en este rol."** |
| E7 | DNI duplicado mismo rol (profesor) | Email: pepe@rehabilitar.com, DNI: 46201004 (Bruno Demo — ya registrado como profesor por el seed), Rol: Profesor | 1. Seleccionar Rol = Profesor, ingresar DNI 46201004. | Aparece el mensaje: **"Ya existe un usuario con ese DNI en este rol."** |

---

## HU 8 — Crear Actividad

**Precondición:** Loguearse como `admin@rehabilitar.com`. El seed crea al profesor "Pepe Muñoz" (`pepemunoz@rehabilitar.com`).

> **Nota sobre fechas:** Las fechas del HU original (mayo/junio 2026) ya pasaron. Usar meses futuros (agosto–diciembre 2026). Para E3 (fin de semana), usar cualquier sábado o domingo futuro. Para E4 (feriado), usar 17/08/2026.

| # | Escenario | Datos | Pasos | Resultado esperado |
|---|-----------|-------|-------|--------------------|
| E1 | Crear actividad fija exitosa | Nombre: "Fisioterapia lunes", Especialidad: Fisioterapia, Tipo: Fija, Días: Lunes, Mes: Agosto 2026, Hora inicio: 15:00, Duración: 1h, Sala: Sala 1, Profesor: Pepe Muñoz, Precio: $6000, Cupos: 8 | 1. Ir a Actividades → Crear Actividad. 2. Completar el formulario. 3. Hacer click en "Crear actividad". | Redirige a la lista de actividades con el mensaje: **"Se crearon N actividades con éxito."** |
| E2 | Crear actividad individual exitosa | Nombre: "Fisioterapia individual", Tipo: Individual, Fecha: (cualquier día hábil de agosto 2026), Hora: 15:00, Sala: Sala 2, Profesor: Pepe Muñoz, Precio: $8000, Cupos: 1 | 1. Mismo flujo con Tipo = Individual. | Redirige con el mensaje: **"Actividad creada con éxito."** |
| E3 | Fecha fin de semana (individual) | Fecha: próximo sábado o domingo | 1. Seleccionar fecha de fin de semana en el campo de fecha. | El campo se limpia y aparece el error: **"Las actividades individuales no se pueden programar en fin de semana."** |
| E4 | Fecha feriado (individual) | Fecha: 17/08/2026 | 1. Seleccionar el 17/08/2026. | El campo se limpia y aparece el error: **"La fecha seleccionada es feriado (Paso a la Inmortalidad del General José de San Martín). Elegí otra fecha."** |

---

## HU 9 — Inscribir a Actividad Fija

**Precondición:** El seed crea "Rehabilitar Codo" (fija, Martes · 10:00–11:00, capacidad 3, $5000, Fisioterapia, Sala 1). El usuario `abonado@rehabilitar.com` tiene plan activo de Fisioterapia.

**Simulación de Mercado Pago:** En el paso 2 del flujo de inscripción aparece el dropdown **"Simular escenario de pago"**. Seleccionar la opción según el escenario a demostrar.

> **Nota E3 (seña):** El HU original indica el resultado de seña como "confirmada", pero el sistema muestra correctamente "pendiente" (pago parcial = reserva en estado pendiente). El código es correcto; el HU tiene un error de redacción.

| # | Escenario | Datos | Pasos | Resultado esperado |
|---|-----------|-------|-------|--------------------|
| E1 | Inscripción con abono (usuario con plan) | Login: abonado@rehabilitar.com | 1. Ir a Reservas → Inscribirse en actividad. 2. Seleccionar "Rehabilitar Codo". 3. Elegir "Pagar con abono". 4. Confirmar. | Aparece el mensaje: **"Tu inscripción quedo confirmada. Podes verla en Mis Reservas."** |
| E2 | Inscripción con pago total (Mercado Pago) | Login: cliente@rehabilitar.com, simulador: Pago exitoso | 1. Seleccionar "Rehabilitar Codo". 2. Elegir "Pagar con Mercado Pago". 3. Seleccionar "✅ Pago exitoso" en el simulador. 4. Confirmar pago. | Aparece el mensaje: **"Tu inscripción quedo confirmada. Podes verla en Mis Reservas."** |
| E3 | Inscripción con seña (50%) | Simulador: Pago exitoso, elegir opción "Abonar Seña" | 1. Elegir "Pagar con Mercado Pago". 2. Seleccionar la opción de seña. 3. Simular pago exitoso. | Aparece el mensaje: **"Tu reserva quedo en estado pendiente."** (más montos abonado y restante). |
| E4 | Descuento por edad (adulto mayor) | Cliente nacido antes de 1961 | 1. Loguearse con un cliente mayor de 65 años. 2. Inscribirse en "Rehabilitar Codo". 3. Verificar descuento en el precio mostrado. | El sistema aplica el descuento y la inscripción queda confirmada. |
| E5 | Lista de espera (abonado, sin cupo) | Llenar los 3 cupos de "Rehabilitar Codo" primero | 1. Con cupos agotados, intentar inscribirse como `abonado@rehabilitar.com`. | Aparece el mensaje: **"Fuiste agregado a la lista de espera. Te notificaremos cuando haya un cupo disponible."** |
| E6 | Lista de espera (cliente sin plan, sin cupo) | Login: cliente@rehabilitar.com, cupos agotados | 1. Mismo flujo con `cliente@rehabilitar.com`. | Aparece el mismo mensaje de lista de espera. |
| E7 | Pago con créditos | Usuario con créditos disponibles | 1. Elegir "Pagar con créditos". 2. Confirmar. | Aparece el mensaje: **"Tu inscripción quedo confirmada. Podes verla en Mis Reservas."** |
| E8 | Error en pago | Simulador: Fondos insuficientes | 1. Elegir Mercado Pago. 2. Seleccionar "❌ Fondos insuficientes" en el simulador. 3. Intentar pagar. | El sistema informa que hubo un error en el pago y cancela la inscripción. |

---

## HU 10 — Inscribir a Actividad Individual

**Precondición:** El seed crea "Rehabilitar Codo" (individual, fecha = hoy + 14 días al momento del seed, hora 14:00, $8000, capacidad 3, Sala 1). Si esa fecha ya pasó (seed viejo), crear una nueva actividad individual via HU 8 E2 antes de la demo.

**Simulación de Mercado Pago:** igual que HU 9 — dropdown en el paso 2.

> **Nota E2 (seña):** El HU original dice que el resultado de seña en actividad individual es "confirmada", pero el sistema muestra "pendiente" (mismo comportamiento que fija E3). El código es correcto; el HU tiene un error de redacción.

| # | Escenario | Datos | Pasos | Resultado esperado |
|---|-----------|-------|-------|--------------------|
| E1 | Inscripción con pago total | Login: cliente@rehabilitar.com, simulador: Pago exitoso | 1. Ir a Reservas → Inscribirse en actividad. 2. Filtrar o localizar "Rehabilitar Codo" (individual). 3. Elegir "Pagar con Mercado Pago". 4. Seleccionar "✅ Pago exitoso". 5. Confirmar pago. | Aparece el mensaje: **"Tu inscripción quedo confirmada. Podes verla en Mis Reservas."** |
| E2 | Inscripción con seña | Simulador: Pago exitoso, elegir seña | 1. Mismo flujo eligiendo pago parcial (seña). | Aparece el mensaje: **"Tu reserva quedo en estado pendiente."** (más montos). *(El HU dice "confirmada" — es un error en el HU; el código es correcto.)* |
| E3 | Actividad sin cupos (lista de espera) | Llenar los 3 cupos primero | 1. Con cupos agotados, intentar inscribirse. | Aparece el mensaje: **"Fuiste agregado a la lista de espera. Te notificaremos cuando haya un cupo disponible."** |
| E4 | Descuento por edad (adulto mayor) | Cliente nacido antes de 1961 | 1. Loguearse con cliente mayor de 65 años. 2. Inscribirse en la actividad individual. | El sistema aplica el descuento y confirma la inscripción. |
| E5 | Error en pago | Simulador: Fondos insuficientes | 1. Elegir Mercado Pago. 2. Seleccionar "❌ Fondos insuficientes". 3. Intentar pagar. | El sistema informa el error en el pago y cancela la inscripción. |
