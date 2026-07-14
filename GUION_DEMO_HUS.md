# Guión de Demo — Historias de Usuario RehabilitAR

> Rama de trabajo: `angel`
> Última actualización: 2026-07-14
> HU1–HU8 revisadas contra el código real (backend + frontend) y el seed. HU9–HU10 (inscripciones) se conservan de la versión anterior.

## Preparación previa (ejecutar una sola vez)

```powershell
# Activar entorno virtual
& .venv\Scripts\Activate.ps1

# Correr seed (crea usuarios, salas, planes, notificaciones y datos demo)
python backend/database/seed_mock.py

# Iniciar backend
python backend/main.py

# Iniciar frontend (otra terminal)
cd frontend
npm start
```

> El seed es **idempotente y aditivo**: se puede correr varias veces sin duplicar datos. También se ejecuta solo al iniciar `main.py`.

---

## Credenciales de acceso

| Rol                         | Nombre           | Email                       | Contraseña   |
|-----------------------------|------------------|-----------------------------|--------------|
| Admin                       | Super Admin      | admin@rehabilitar.com       | Admin123     |
| Cliente                     | Carlos Cliente   | cliente@rehabilitar.com     | Cliente123   |
| Recepcionista               | Laura Recepcion  | empleado@rehabilitar.com    | Empleado123  |
| Profesor (Fisioterapia)     | Marcos Profesor  | profesor@rehabilitar.com    | Profesor123  |
| Profesor (Kinesiología dep.)| Sofia Kinesiologia | profe2@rehabilitar.com    | Profesor123  |
| Profesor (Pilates)          | Carlos Pilates   | profe3@rehabilitar.com      | Profesor123  |
| **Profesor (Yoga)**         | **Alex Rivas**   | **alex@rehabilitar.com**    | **Profesor123** |
| Profesor (Kinesiología dep.)| Pepe Muñoz       | pepemunoz@rehabilitar.com   | Profesor123  |
| Cliente abonado             | Ana Abonada      | abonado@rehabilitar.com     | Abonado123   |

---

## Cómo simular fechas y feriados (leer antes de las HUs con fecha)

- **No hay override de fecha en el backend.** "Hoy" es el reloj del sistema (al momento de armar este guión, **2026-07-14**).
- Los **feriados** se calculan en el frontend con la librería `date-holidays` (Argentina) — ver [frontend/src/utils/feriados.js](frontend/src/utils/feriados.js). Para "simular" un feriado alcanza con **elegir una fecha que realmente sea feriado**. No hay que esperar la fecha real.
- El campo de fecha (individual) tiene `min = hoy`, así que **no se pueden elegir fechas pasadas** desde el date-picker.
- **Ninguna de estas 8 HUs usa Mercado Pago.** El simulador de pago aplica solo a las HU9/HU10 (inscripciones).

### Fechas reales útiles para la demo (calculadas con `date-holidays` AR 2026)

| Uso | Fecha real a usar | Qué devuelve el sistema |
|-----|-------------------|-------------------------|
| Día hábil futuro | 18/08/2026 (martes) | fecha válida |
| Fin de semana | 15/08/2026 (sáb) o 16/08/2026 (dom) | "…no se pueden programar en fin de semana." |
| Feriado con nombre **"Día no laborable con fines turísticos"** | **07/12/2026 (lunes)** | texto exacto que pide la HU de *Sugerir* |
| Feriado público (Crear actividad) | **17/08/2026 (lunes)** | "…(Paso a la Inmortalidad del General José de San Martín)…" |
| Feriado "Güemes" (texto literal de *Crear actividad*) | 15/06/2026 | **ya pasó**: solo daría el texto exacto si el reloj fuera ≤ 15/06/2026. En vivo usar 17/08/2026 (ver nota de HU8). |

> **Ajuste de fechas respecto de las HUs originales:** varias HUs usan fechas de mayo/junio 2026 (ya pasadas). Se reemplazan por fechas futuras equivalentes que cumplen la misma condición; se indica en cada escenario. Cuando el texto esperado incluye el **nombre del feriado**, ese nombre es el que devuelve la librería para la fecha elegida (dato dinámico, no texto fijo del código).

---

## Nota importante sobre `database.db` (datos preexistentes)

La base local arrastra datos de sesiones previas. Dos cosas a tener en cuenta:

1. **`recep@rehabilitar.com` ya existe** en la base. Sirve para el escenario "email repetido" (Crear Cuenta E5) pero **bloquea el alta exitosa E1**. Para poder demostrar E1→E5 en orden, ejecutar el *reset opcional* de más abajo antes de la HU de Crear Cuenta.
2. Hay actividades viejas llamadas "Yoga" con especialidad **Fisioterapia** (basura de pruebas). **No interfieren** con la demo de *Asumir*: el profesor Alex (especialidad Yoga) solo ve actividades con especialidad exactamente "Yoga", y el seed crea la correcta.

### Reset opcional para repetir la HU de Crear Cuenta

```powershell
# Borra SOLO las cuentas demo que crean los escenarios E1–E4 (para poder repetirlos).
# No toca cuentas reales ni las del seed.
& .venv\Scripts\Activate.ps1
python - <<'PY'
import sys, os; sys.path.insert(0, os.path.abspath('backend'))
from database.connection import SessionLocal
import app.models.attendance, app.models.user_plan, app.models.plan, app.models.waitlist, app.models.room, app.models.reservation, app.models.notification, app.models.activity, app.models.activity_suggestion
from app.models.user import User
db = SessionLocal()
emails = ['recep@rehabilitar.com','prof@rehabilitar.com','usuario@rehabilitar.com','admin2@rehabilitar.com','prof2@rehabilitar.com']
for u in db.query(User).filter(User.email.in_(emails)).all():
    print('borrando', u.email); db.delete(u)
db.commit(); db.close()
PY
```

---

## HU 1 — Desactivar notificación

**Precondición:** Loguearse como `cliente@rehabilitar.com`. Las notificaciones arrancan activadas (default del sistema).
**Ref. código:** toggle en [LayoutPrivado.jsx:340](frontend/src/layouts/LayoutPrivado.jsx#L340) → `PUT /notifications/preferences`.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Desactivación exitosa | Usuario `cliente@` | 1. Click en la campana (arriba a la derecha). 2. **Desmarcar** el checkbox **"Notificaciones del sistema"**. | El switch queda apagado. El sistema deja de generar notificaciones in-app para el usuario (las nuevas ya no entran al inbox). |

---

## HU 2 — Activar notificación

**Precondición:** Que el usuario tenga las notificaciones **desactivadas** (correr HU 1 primero sobre el mismo `cliente@`).

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Activación exitosa | Usuario `cliente@` (con notif. desactivadas) | 1. Click en la campana. 2. **Marcar** el checkbox **"Notificaciones del sistema"**. | El switch queda encendido. El sistema vuelve a habilitar las notificaciones in-app. |

---

## HU 3 — Marcar notificación como leído

**Ref. código:** badge = `notifications.filter(n => !n.read).length` ([LayoutPrivado.jsx:432](frontend/src/layouts/LayoutPrivado.jsx#L432)); click → `POST /notifications/{id}/read` ([LayoutPrivado.jsx:452](frontend/src/layouts/LayoutPrivado.jsx#L452)).

**Datos pre-sembrados:** `cliente@` tiene **4 notificaciones sin leer**; `abonado@` (Ana) tiene **exactamente 1** (para el Escenario 2). *(La HU nombra a "pepito@gmail.com"; se reemplaza por usuarios del seed — los nombres no necesitan coincidir.)*

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Marcado exitoso (resta 1 del badge) | Login `cliente@` (badge = 4) | 1. Abrir el panel de la campana. 2. Click en **una** notificación. | La notificación queda en negrita apagada (leída) y **el número del badge baja de 4 a 3**. |
| E2 | Marcado de la única notificación (desaparece el badge) | Login `abonado@` (badge = 1) | 1. Abrir el panel de la campana. 2. Click en **la única** notificación. | Se marca como leída y **el badge desaparece** por completo. |

---

## HU 4 — Aceptar / Rechazar Actividad sugerida

**Precondición:** Login `admin@rehabilitar.com`. El seed deja **3 sugerencias pendientes**: **"Prueba"** (fija, profesor Marcos, Fisioterapia), **"Pilates"** (fija, profesor Carlos Pilates) y **"Yoga"** (individual, profesor Alex Rivas, **Sala 4 · 22/07/2026 · 14:00**, 4 cupos). Además el seed crea una actividad **"Turno reservado Sala 4"** que ocupa la Sala 4 ese mismo día y hora, para forzar el conflicto de E3.
**Orden:** E1 acepta "Prueba"; E2 rechaza "Pilates" (ambas salen de la lista). **E3 falla a propósito** y la sugerencia "Yoga" **queda pendiente** (se puede repetir). *(La HU usa profesores "Juan"/"Carlos"/"Maite"; el dato del seed difiere y no afecta.)*

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Aceptar con éxito | Sugerencia **"Prueba"**, precio **5000** | 1. Actividades → **Sugerencias Pendientes**. 2. "Ver detalle" en **Prueba**. 3. Ingresar **5000** en "Precio de la clase ($)". 4. Click **Aceptar**. | Pantalla: **"Sugerencia aceptada. La actividad ya está disponible."** La actividad queda creada y disponible. **Inbox al profesor** → título **"Sugerencia aceptada: Prueba"**, cuerpo: `Tu sugerencia de actividad "Prueba" fue aceptada y ya está disponible.` |
| E2 | Rechazar con éxito | Sugerencia **"Pilates"** | 1. "Ver detalle" en **Pilates**. 2. Click **Rechazar**. 3. En el modal, click **"Sí, rechazar"**. | Pantalla: **"Sugerencia rechazada"**. **Inbox al profesor** → título **"Sugerencia rechazada: Pilates"**, cuerpo: `Tu sugerencia de actividad "Pilates" fue rechazada por un administrador.` |
| E3 | Aceptación fallida por sala no disponible | Sugerencia individual **"Yoga"** (Sala 4 · 22/07/2026 · 14:00 · 4 cupos), precio **3000** | 1. "Ver detalle" en la sugerencia individual **Yoga**. 2. Ingresar **3000** en "Precio de la clase ($)". 3. Click **Aceptar**. | El sistema informa (en rojo, sobre la tarjeta): **"La sala no está disponible para la fecha y hora seleccionadas porque ya existe una actividad programada."** La sugerencia **no se acepta** y queda pendiente. |

> Para ver el inbox del profesor: loguearse como `profesor@rehabilitar.com` (Prueba) o `profe3@rehabilitar.com` (Pilates) y abrir la campana.
> **E3** verificado end-to-end: `aceptar_sugerencia` → `crear_actividad` → `_validar_disponibilidad_sala` lanza HTTP 409 con ese texto ([servicio_actividades.py:183](backend/app/services/servicio_actividades.py#L183)); el frontend lo muestra tal cual ([SugerenciasPendientes.jsx:113](frontend/src/pages/admin/actividades/SugerenciasPendientes.jsx#L113)).

---

## HU 5 — Asumir Actividad

**Precondición / datos pre-sembrados:**
- Actividad **"Yoga"** (fija), especialidad **Yoga**, **sin profesor**, **Sala 4**, programada el **próximo martes** (en la fecha de referencia = **Martes 2026-07-21 · 10:00–11:00**), cupos 5.
- Profesor **Alex Rivas** (`alex@rehabilitar.com`), especialidad **Yoga** — cumple la regla "el profesor debe tener la misma especialidad que la clase".
- Cliente `cliente@` **inscripto** en Yoga (para demostrar el aviso a los inscriptos).
- **Ref. código:** validación de especialidad en [servicio_actividades.py:641](backend/app/services/servicio_actividades.py#L641); textos del inbox en [notifications.py:798](backend/app/utils/notifications.py#L798).

> La fecha se calcula como "próximo martes" para que la clase **siempre esté a futuro** y el inbox diga exactamente `Martes AAAA-MM-DD · 10:00–11:00`. En la fecha de referencia da **2026-07-21**, igual que la HU.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Asignación exitosa | Login **`alex@rehabilitar.com`**, actividad **"Yoga"** | 1. Actividades → **Mis Actividades**. 2. Sección **"Actividades que podés asumir"** → localizar **Yoga**. 3. Click **Asumir**. 4. En el modal "Confirmar asignación" → **Confirmar**. | Pantalla: **`Asumiste la actividad "Yoga" correctamente.`** Se asigna a la clase. **Inboxes:** • **Alex** → "Asumiste: Yoga" / `Confirmamos que asumiste la actividad 'Yoga' programada para Martes 2026-07-21 · 10:00–11:00.` • **Admin** → "Profesor asignado: Yoga" / `El profesor Alex Rivas asumió 'Yoga' programada para Martes 2026-07-21 · 10:00–11:00.` • **Cliente inscripto** → "Profesor asignado: Yoga" / `La actividad 'Yoga' ya tiene profesor/a asignado/a: Alex Rivas.` |

> Verificación de inboxes: admin (`admin@`) y cliente (`cliente@`) → campana. La HU escribe el profesor como "Alex"; el sistema muestra el **nombre completo** ("Alex Rivas"), que es dato, no texto fijo.

---

## HU 6 — Sugerir Actividad

**Precondición:** Login `profesor@rehabilitar.com` (Marcos, Fisioterapia). Menú Actividades → **"+ Sugerir Actividad"**.
**Ref. código:** validaciones y textos en [SugerirActividad.jsx](frontend/src/pages/kinesiologist/actividades/SugerirActividad.jsx).

> **Ajuste de tipo:** los escenarios de *fin de semana* y *feriado* de la HU están escritos con tipo "Fija", pero ese mensaje exacto solo aparece con tipo **Individual** (las clases fijas eligen día de semana Lun–Vie y omiten feriados automáticamente). Para reproducir el texto literal, usar **Individual**.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Sugerencia de clase fija con éxito | Nombre **"Yoga"**, Tipo **Fija**, Sala **Sala 3**, Mes **Agosto 2026**, Día **Lunes**, Horario **09:00–10:00**, Cupos **4** | 1. Completar el formulario. 2. **Enviar sugerencia**. 3. **Confirmar**. | Pantalla: **"Tu sugerencia fue enviada. Queda pendiente de aprobación por un administrador."** (la sugerencia llega al admin con estado `pending`). |
| E2 | Sugerencia de clase individual con éxito | Nombre **"Pilates"**, Tipo **Individual**, Sala **Sala 3**, Fecha **18/08/2026** (día hábil), Horario **13:00–14:00**, Cupos **10** | 1. Completar. 2. **Enviar sugerencia**. 3. **Confirmar**. | Mismo mensaje de éxito (estado `pending`). |
| E3 | Falla por fin de semana | Tipo **Individual**, Fecha **16/08/2026 (domingo)** *(la HU usa 20/8, que en realidad es jueves — se reemplaza por un finde real)* | 1. Elegir una fecha de sábado/domingo. | El sistema informa: **"Las actividades individuales no se pueden programar en fin de semana."** |
| E4 | Falla por feriado | Tipo **Individual**, Fecha **07/12/2026 (lunes)** *(la HU usa 20/8, que no es feriado — se reemplaza por un feriado real de ese tipo)* | 1. Elegir el 07/12/2026. 2. Intentar enviar. | El sistema informa: **"La fecha seleccionada es feriado (Día no laborable con fines turísticos). Elegí otra fecha."** |

> La HU escribe E3 y E4 con tipo "Fija" y una "Fecha de turno" puntual, pero las clases fijas se cargan por mes + día de semana (no admiten un día suelto) y omiten feriados automáticamente. El mensaje **literal** de fin de semana / feriado solo aparece con tipo **Individual**; por eso ambos se demuestran como Individual.
> Nota: `18/08/2026`, `16/08/2026` y `07/12/2026` son fechas reales (día hábil, domingo y feriado "Día no laborable con fines turísticos", respectivamente) verificadas con `date-holidays` para 2026.

---

## HU 7 — Crear Cuenta (Admin)

**Precondición:** Login `admin@rehabilitar.com`. Usuarios → **Crear Cuenta**.
**Ref. código:** validaciones frontend en [CrearCuenta.jsx:111](frontend/src/pages/admin/usuarios/CrearCuenta.jsx#L111); alta backend en [servicio_usuarios.py:119](backend/app/services/servicio_usuarios.py#L119).

**Reglas relevantes:** el email es único; la especialidad es obligatoria para profesores; **el DNI se puede repetir entre roles distintos, pero no dentro del mismo rol**.

**Orden / datos pre-sembrados:**
- Correr E1–E4 (altas exitosas) **primero**. Cada una usa email nuevo. Si `recep@` ya existe (dato viejo), correr el *reset opcional* de arriba.
- **E5** reutiliza el email de E1. **E7** usa DNI **46201004**, ya registrado como **profesor** (Bruno Demo, del seed) → dispara el conflicto por rol.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Alta recepcionista | Rol **Recepcionista**, Laura Gómez, `recep@rehabilitar.com`, DNI **43215678**, nac. **20/12/1990** | 1. Completar. 2. **Crear cuenta**. | **"Cuenta creada exitosamente. Se envió una contraseña temporal al correo del usuario."** (rol Recepcionista, activa). |
| E2 | Alta profesor | Rol **Profesor**, Carlos Ruiz, `prof@rehabilitar.com`, DNI **12345678**, nac. **01/10/1975**, Especialidad **Tren superior** | 1. Elegir Profesor + especialidad. 2. **Crear cuenta**. | Mismo mensaje de éxito. *(DNI 12345678 existe como **cliente**; al ser otro rol, no hay conflicto.)* |
| E3 | Alta cliente | Rol **Cliente**, Juan Carlos, `usuario@rehabilitar.com`, DNI **43658970**, nac. **20/05/1979** | 1. Completar. 2. **Crear cuenta**. | Mismo mensaje de éxito; cuenta con apto físico pendiente de revisión (si se sube el certificado opcional queda "pendiente"). |
| E4 | Alta administrador | Rol **Administrador**, Angel Lee, `admin2@rehabilitar.com`, DNI **46201004**, nac. **19/11/2004** | 1. Completar. 2. **Crear cuenta**. | Mismo mensaje de éxito. *(DNI 46201004 existe como cliente y profesor, pero **no como admin** → alta permitida.)* |
| E5 | Falla por email repetido | Email **`recep@rehabilitar.com`** (de E1), resto cualquiera válido | 1. Reusar ese email. 2. **Crear cuenta**. | **"El email ya está registrado"** |
| E6 | Falla por profesor sin especialidad | Rol **Profesor**, Julián Castro, `prof2@rehabilitar.com`, DNI 12345678, nac. válida, **Especialidad vacía** | 1. Completar todo **menos** especialidad. 2. **Crear cuenta**. | El campo *Especialización* muestra **"Campo requerido"** (no envía). |
| E7 | Falla por DNI repetido en el rol | Rol **Profesor**, Pepe Viral, `pepeviral@rehabilitar.com`, DNI **46201004**, Especialidad **Osteopatia**, nac. válida | 1. Completar (con especialidad). 2. **Crear cuenta**. | **"Ya existe un usuario con ese DNI en este rol."** |
| E8 | Falla por campos incompletos | Rol **Cliente**, sólo Nombre **"Juan"** y Email `juancito@gmail.com` | 1. Dejar apellido, DNI y fecha de nacimiento vacíos. 2. **Crear cuenta**. | Cada campo faltante (Apellido, DNI, Fecha de nacimiento) muestra **"Campo requerido"** (no envía). |

> La HU usa "Usuario" y "Cliente" como sinónimos: en el formulario el rol se llama **"Cliente"** (valor `client`).

---

## HU 8 — Crear Actividad (Admin)

**Precondición:** Login `admin@rehabilitar.com`. Actividades → **"+ Nueva actividad"**. Profesor **Pepe Muñoz** (`pepemunoz@`) está pre-sembrado con especialidad **Kinesiología deportiva** (alineado a la HU).
**Ref. código:** validaciones/feriado en [CrearActividad.jsx:327](frontend/src/pages/admin/actividades/CrearActividad.jsx#L327).

> **Ajuste de fechas:** la HU usa junio 2026 (pasado). El selector de mes ofrece los **próximos 6 meses**; usar un mes futuro (ej. Agosto 2026). Para el feriado, "Güemes" (15/06/2026) ya pasó → se usa **17/08/2026** (San Martín); el comportamiento es idéntico y solo cambia el nombre del feriado mostrado.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Fija con profesor asignado | Nombre **"Tren medio"**, Especialidad **Kinesiologia deportiva**, Tipo **Fija**, Sala **Sala 3**, Mes **Agosto 2026**, Día **Lunes**, Horario **15:00–16:00**, Profesor **Pepe Muñoz**, Precio **10000**, Cupos **10** | 1. Completar. 2. **Crear actividad**. | Redirige a **Actividades** con **"Se crearon N actividades con éxito."** La clase queda disponible para inscripción. |
| E2 | Individual sin profesor | Nombre **"Tren medio"**, Especialidad **Kinesiologia deportiva**, Tipo **Individual**, Sala **Sala 3**, Fecha **18/08/2026** (hábil), Horario **11:00–12:00**, Profesor **— sin asignar —**, Precio **10000**, Cupos **10** | 1. Completar (dejar profesor sin asignar). 2. **Crear actividad**. | Redirige a **Actividades** con **"Actividad creada con éxito."** Queda disponible para inscribirse **y** para que un profesor de esa especialidad la asuma. |
| E3 | Falla por fin de semana (individual) | Tipo **Individual**, Fecha **16/08/2026 (domingo)** *(la HU usa 23/5, un domingo pasado)* | 1. Elegir una fecha de sábado/domingo. | El campo se limpia y aparece: **"Las actividades individuales no se pueden programar en fin de semana."** |
| E4 | Falla por feriado (individual) | Tipo **Individual**, Fecha **17/08/2026** | 1. Elegir el 17/08/2026. 2. **Crear actividad**. | Aparece: **"La fecha seleccionada es feriado (Paso a la Inmortalidad del General José de San Martín). Elegí otra fecha."** *(Con reloj ≤ 15/06/2026, la fecha 15/06 daría el texto de Güemes de la HU.)* |

---

## HU 9 — Inscribir a Actividad Fija

**Precondición:** El seed crea "Rehabilitar Codo" (fija, Martes · 10:00–11:00, capacidad 3, $5000, Fisioterapia, Sala 1). `abonado@rehabilitar.com` tiene plan activo de Fisioterapia (cubre la actividad). **Flujo:** Reservas → seleccionar "Rehabilitar Codo" → **Inscribirse / Siguiente** → elegir método → **Confirmar**. En cada confirmación el sistema además **notifica al usuario** (inbox + email). **Ref. código:** [InscribirActividad.jsx](frontend/src/pages/client/reservas/InscribirActividad.jsx).

**Simulación de Mercado Pago (Abonar Total / Abonar Seña):** al **Confirmar** aparece el overlay **"Esperando pago... Completá el pago en la ventana de Mercado Pago que se abrió."** ([OverlayEsperandoPago.jsx:36](frontend/src/components/OverlayEsperandoPago.jsx#L36)) y se abre la ventana [/pago/mercadopago](frontend/src/pages/pago/PagoMercadoPago.jsx) con *"Elegí un escenario para simular"* → **"✅ Pago exitoso"** / **"❌ Fondos insuficientes"**. *(Habilitar ventanas emergentes.)*

> Único desvío (cosmético): la app muestra los textos **sin tildes** ("Inscripcion... Tu lugar esta reservado."); la HU los escribe con tildes.

> 🔧 **Datos a preparar (no vienen en el seed):** para **E4/E5** (lista de espera) llenar antes los **3 cupos** de "Rehabilitar Codo" con otros clientes; para **E6** (créditos) el abonado necesita `credits > 0`. El **20% para mayores de 65** se aplica automáticamente (en esta versión de la HU ya no tiene escenario propio). Puedo sembrarlos si querés (ver pregunta final).

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Confirmada por suscripción activa (abonado) | `abonado@` | Seleccionar "Rehabilitar Codo" → **Siguiente** → **Confirmar por suscripción activa** → **Confirmar** | Inscripción **confirmada**, decrementa cupo, **"Inscripción confirmada. Tu lugar está reservado."** y **notifica** al usuario. |
| E2 | Confirmada con pago total | `cliente@`, simulador **✅ Pago exitoso** | Seleccionar → Siguiente → **Abonar Total** → Confirmar → (overlay "Esperando pago…") → **✅ Pago exitoso** | **Confirmada**, decrementa cupo, **"Inscripción confirmada. Tu lugar está reservado."** y notifica. |
| E3 | Confirmada con seña | `cliente@`, simulador **✅ Pago exitoso** | Seleccionar → Siguiente → **Abonar Seña** → elegir **% a abonar** → Confirmar → (overlay) → **✅ Pago exitoso** | Calcula la seña, registra **Pendiente**, decrementa cupo, **"Inscripcion en estado pendiente"** + "Monto abonado / Monto restante" y notifica. |
| E4 | Lista de espera (abonado, 0 cupos) | `abonado@`, cupos llenos | Seleccionar → Siguiente → **Esperar en la Lista** → Confirmar | Agregado **con prioridad**, **"Agregado a la lista de espera. Te notificaremos cuando haya un cupo disponible."** y notifica. |
| E5 | Lista de espera (no abonado, 0 cupos) | `cliente@`, cupos llenos | Seleccionar → Siguiente → **Esperar en la Lista** → Confirmar | Agregado a la lista **general** (sin prioridad), mismo mensaje y notifica. |
| E6 | Confirmada con créditos | `abonado@` con `credits > 0` | Seleccionar → Siguiente → **Usar crédito** → Confirmar | **Confirmada**, decrementa **cupo y crédito**, **"Inscripción confirmada. Tu lugar esta reservado."** y notifica. |
| E7 | Fallida por error en el pago | `cliente@`, simulador **❌ Fondos insuficientes** | Seleccionar → Siguiente → método de pago → Confirmar → (overlay) → **❌ Fondos insuficientes** | **"Hubo un error en el pago. Intenta nuevamente."** y **cancela** la inscripción. |

---

## HU 10 — Inscribir a Actividad Individual

**Precondición:** El seed crea "Rehabilitar Codo" (individual, fecha = hoy + 14 días al momento del seed, hora 14:00, $8000, capacidad 3, Sala 1). Si esa fecha ya pasó, crear una nueva individual vía HU 8 E2. **Mismo simulador de Mercado Pago, overlay "Esperando pago…" y mismos textos de resultado que HU 9.** El cliente puede ser abonado o no abonado; el 20% por edad **no** aplica a individuales (solo a fijas).

> Tu HU individual mantiene los textos viejos ("Tu inscripción quedo confirmada…") en E1/E2; la tabla usa el texto **real de la app** ("Inscripción confirmada. Tu lugar esta reservado."). En E2 (seña) la HU dice "confirmada" pero pago parcial = **pendiente**.

| # | Escenario | Datos a usar | Pasos | Resultado esperado (app · *HU*) |
|---|-----------|--------------|-------|--------------------|
| E1 | Inscripción con pago total | `cliente@`, simulador **✅ Pago exitoso** | Inscribirse en "Rehabilitar Codo" (individual) → Siguiente → **Abonar Total** → Confirmar → **✅ Pago exitoso** | Inscripción **confirmada**, decrementa cupo: **"Inscripcion confirmada. Tu lugar esta reservado."** *(HU: "Tu inscripción quedo confirmada. Podes verla en Mis Reservas.")* |
| E2 | Inscripción con seña | `cliente@`, simulador **✅ Pago exitoso** | Inscribirse → Siguiente → **Abonar Seña** → Confirmar → **✅ Pago exitoso** | Reserva **pendiente**: **"Inscripcion en estado pendiente"** + montos. *(La HU dice "confirmada" — es error de la HU: pago parcial = pendiente.)* |
| E3 | Lista de espera general (0 cupos) | `cliente@`, cupos llenos | Inscribirse → Siguiente → **Esperar en la lista** → Confirmar | Agregado a la lista de espera general: **"Agregado a la lista de espera"** + "Te notificaremos cuando haya un cupo disponible." |
| E5 | Fallida por error en el pago | `cliente@`, simulador **❌ Fondos insuficientes** | Inscribirse → Siguiente → Abonar Total/Seña → Confirmar → **❌ Fondos insuficientes** | **"Hubo un error en el pago. Intenta nuevamente."** + "La inscripcion fue cancelada. Podes intentarlo nuevamente." (no se inscribe). |

> La HU individual no tiene "Escenario 4"; la numeración salta de E3 a E5, respetada acá.

---

## HU 11 — Registrar usuario (público)

**Precondición:** **Sin** iniciar sesión. Ir a **`/registro`** (link "¿No tenés cuenta? Registrarse" desde el login). **Ref. código:** [Registro.jsx](frontend/src/pages/public/Registro.jsx) (validaciones inline líneas [62-82](frontend/src/pages/public/Registro.jsx#L62)).

**Orden / datos:** E1 crea `pepe@gmail.com`; **E3** reutiliza ese email (correr E1 antes). Para **E9** (DNI existente) el DNI se valida **por rol cliente**: usar un DNI ya registrado como cliente, p. ej. **22222222** (de `cliente@`). Tras E1/E2, para repetir hay que borrar `pepe@gmail.com`.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Registro exitoso sin apto físico | Pepe Martínez, `pepe@gmail.com`, pass **abc123** (×2), DNI **12345678**, nac. **20/07/2000**, sin apto | Completar y **Registrarse** | Cuenta creada (activa, sin permisos hasta cargar apto): **"¡Cuenta creada correctamente! Redirigiendo al login..."** y redirige a `/login`. |
| E2 | Registro exitoso con apto físico | Igual a E1 + adjuntar archivo de apto físico | Adjuntar apto → **Registrarse** | Mismo mensaje; el apto queda en **"Pendiente de revisión"**. |
| E3 | Falla por email existente | Email **`pepe@gmail.com`** (creado en E1), resto válido | **Registrarse** | **"El email ya está registrado"** *(corregido en código para coincidir con la HU)*. |
| E4 | Falla por contraseña < 6 | pass **1234** (×2), resto válido | **Registrarse** | **"La contraseña debe tener al menos 6 caracteres."** |
| E5 | Falla por DNI inválido | DNI **1234**, resto válido | **Registrarse** | **"El DNI debe tener entre 7 y 8 dígitos numéricos."** |
| E6 | Falla por menor de edad | nac. **12/03/2018**, resto válido | **Registrarse** | **"Debés ser mayor de 18 años para registrarte."** |
| E7 | Falla por campos faltantes | Dejar vacío algún obligatorio (p. ej. email) | **Registrarse** | Cada campo faltante muestra **"Este campo es requerido."** |
| E8 | Falla por contraseñas no coincidentes | pass **123456** / confirmar **1234567** | **Registrarse** | **"Las contraseñas no coinciden."** |
| E9 | Falla por DNI existente (mismo rol) | DNI **22222222** (ya es cliente), email nuevo | **Registrarse** | **"Ya existe una cuenta con ese DNI."** |

---

## HU 12 — Iniciar sesión

**Precondición:** Ir a **`/login`**. Usar cuentas del seed. **Ref. código:** [Login.jsx](frontend/src/pages/public/Login.jsx), backend [servicio_usuarios.py:202](backend/app/services/servicio_usuarios.py#L202).

> ⚠️ **E7** deshabilita la cuenta (3 intentos) y **E8** requiere una cuenta **suspendida** (no viene en el seed). Ver notas.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Inicio exitoso — cliente | `cliente@rehabilitar.com` / `Cliente123` | Ingresar y **Iniciar sesión** | Reinicia intentos, entra y redirige al **home de cliente**. |
| E2 | Inicio exitoso — administrador | `admin@rehabilitar.com` / `Admin123` | Ingresar y **Iniciar sesión** | Entra y redirige al **panel de administrador**. |
| E3 | Inicio exitoso — profesor | `profesor@rehabilitar.com` / `Profesor123` | Ingresar y **Iniciar sesión** | Entra y redirige al **home de profesor**. |
| E4 | Inicio exitoso — recepcionista | `empleado@rehabilitar.com` / `Empleado123` | Ingresar y **Iniciar sesión** | Entra y redirige al **home de recepcionista**. |
| E5 | Falla por email inexistente | `noexiste@gmail.com` / cualquiera | **Iniciar sesión** | **"El correo no está registrado en el sistema."** |
| E6 | Falla por contraseña (intento < 3) | cuenta válida + pass incorrecta | **Iniciar sesión** | **"La contraseña es incorrecta."** y suma 1 al contador de intentos. |
| E7 | Falla por 3er intento | misma cuenta, 3ª pass incorrecta | **Iniciar sesión** | Deshabilita la cuenta y muestra **"Tu cuenta está deshabilitada. Para habilitarla hacé click en recuperar contraseña"**. ⚠️ Usar una cuenta descartable (queda deshabilitada). |
| E8 | Falla por cuenta suspendida | cuenta con estado **suspendido** | **Iniciar sesión** | Muestra la vista **"Cuenta suspendida"** ("No podés acceder…" + opción de reintegro). ⚠️ Suspender una cuenta desde el panel admin antes (o pedime que la siembre). |

---

## HU 13 — Recuperar contraseña

**Precondición:** En `/login` → **"¿Olvidaste tu contraseña?"** (`/recuperar-contrasena`). **Ref. código:** [RecuperarContrasena.jsx](frontend/src/pages/public/RecuperarContrasena.jsx).

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Falla por mail inválido | `noexiste@gmail.com` | Ingresar correo → **Enviar enlace** | **"El correo no está registrado en el sistema."** |
| E2 | Recuperación exitosa | un email real del seed (ej. `cliente@rehabilitar.com`) | Ingresar correo → **Enviar enlace** | **"¡Enlace enviado!"** + "Revisá tu correo electrónico." y envía el link (válido 30 min). *(SMTP simulado: el link aparece en los logs del backend.)* |

---

## HU 14 — Cambiar contraseña (autenticado)

**Precondición:** Iniciar sesión y entrar a la sección **Cuenta / Cambiar contraseña**. **Ref. código:** [GestionCuentaCliente.jsx:94](frontend/src/pages/client/cuenta/GestionCuentaCliente.jsx#L94).

> ⚠️ **E1** cambia la contraseña real del usuario logueado y **cierra sesión**. Usar una cuenta descartable o anotar la nueva contraseña.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Cambio exitoso | nueva **abcdefg** / confirmar **abcdefg** | Ingresar ambas → **Confirmar** | Guarda la nueva contraseña, redirige a `/login` con **"Contrasena actualizada. Inicia sesion con tu nueva contrasena."** *(La HU no fija el texto exacto.)* |
| E2 | Falla por contraseña < 6 | **hola1** / **hola1** | **Confirmar** | **"La contraseña debe tener al menos 6 caracteres."** |
| E3 | Falla por discrepancia | **helloWord** / **123456** | **Confirmar** | **"Las contraseñas no coinciden."** |

---

## HU 15 — Restablecer contraseña (con token)

**Precondición:** Se accede vía el link de recuperación (`/restablecer-contrasena?token=…`). Para **E1–E3** generar un token válido con **HU 13 E2** y tomar el link de los logs del backend. Para **E4** usar un token inválido o sin token. **Ref. código:** [RestablecerContrasena.jsx](frontend/src/pages/public/RestablecerContrasena.jsx); backend [rutas_autenticacion.py:69](backend/app/routes/rutas_autenticacion.py#L69).

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Falla por contraseña < 6 | token válido, **hola1** / **hola1** | **Restablecer contraseña** | **"La contraseña debe tener al menos 6 caracteres."** |
| E2 | Falla por discrepancia | token válido, **helloWord** / **helloword** | **Restablecer contraseña** | **"Las contraseñas no coinciden."** |
| E3 | Restablecimiento exitoso | token válido, **abcdefg** / **abcdefg** | **Restablecer contraseña** | Guarda la contraseña y redirige a `/login` con **"Contraseña actualizada. Podés iniciar sesión."** |
| E4 | Enlace inválido o expirado | token inválido o ausente en la URL | Abrir `/restablecer-contrasena` con token inválido | **"Token inválido o expirado. Solicitá uno nuevo desde Recuperar contraseña."** |
