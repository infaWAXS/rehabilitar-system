# Guión de Demo — Historias de Usuario RehabilitAR

> Rama de trabajo: `angel`
> Última actualización: 2026-07-15
> HU1–HU8 revisadas contra el código real (backend + frontend) y el seed.
> HU9–HU19 revisadas y verificadas contra el código el 2026-07-15.

## Preparación previa

```powershell
# 1) Backend (dejar corriendo). OJO: hay que estar parado en backend/
cd backend
& ..\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 2) Seed, en OTRA terminal, también parado en backend/
cd backend
& ..\.venv\Scripts\Activate.ps1
python database/seed_mock.py

# 3) Frontend (otra terminal)
cd frontend
npm start
```

> ⚠️ **Correr el seed el mismo día de la demo, poco antes de empezar.** Los turnos de la HU 19 (Cancelar turno) se calculan como offsets desde "ahora" (+10 h, +36 h, +60 h…). Volver a correr el seed también es la forma de **resetear** esa HU si ya cancelaste los turnos.

### ⚠️ Hay dos `database.db` — usar siempre la de `backend/`

`DATABASE_URL` es **relativa al directorio actual** ([connection.py:5](backend/database/connection.py#L5)), así que la base que se usa depende de desde dónde arranques:

| Cómo arrancás | Base que usa |
|---|---|
| `cd backend` + `uvicorn main:app` ← **el correcto** | `backend/database.db` |
| `python backend/main.py` desde la raíz | `database.db` (raíz) — **base vieja, no la de la demo** |

Los datos de demo viven en **`backend/database.db`**. Si corrés el seed desde la raíz, siembra la base equivocada y en la app no vas a ver nada.

> **`python backend/main.py` no levanta el servidor.** `main.py` no tiene bloque `__main__` ni `uvicorn.run`: importarlo corre las migraciones y el seed, y termina. El servidor se levanta sí o sí con `uvicorn main:app` desde `backend/`.

> El seed es **idempotente y aditivo** salvo el bloque de la HU 19, que se reconstruye entero en cada corrida (a propósito). También se ejecuta solo al iniciar el backend — ojo con `--reload`: **guardar un archivo del backend durante la demo re-corre el seed** y resetea los créditos y el descuento pendiente de `abonado@`.

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
| **Profesor (Kin. respiratoria)** | **Franco Ibarra** | **franco@rehabilitar.com** | **Profesor123** |
| **Profesora (Kin. traumatológica)** | **Ámbar Soto** | **ambar@rehabilitar.com** | **Profesor123** |
| **Profesor (Kin. traumatológica)** | **Pablo Ruiz** | **pablo@rehabilitar.com** | **Profesor123** |
| **Profesor (Osteopatía)**   | **Ariel Gómez**  | **profe@gmail.com**         | **Profesor123** |
| **Cliente (solo HU 17 E4)** | **Nadia Pilatera** | **pilates.demo@rehabilitar.com** | **Cliente123** |

> Los 5 de abajo los agregó el seed para las HU 16–19. Franco, Ámbar/Pablo y Ariel tienen **especialidades exclusivas** a propósito: así el selector de profesor y las listas de "actividades para asumir" muestran justo lo que pide cada HU y nada más.

### ⚠️ Dos cosas para revisar antes de la demo (datos arrastrados de sesiones previas)

1. **El apellido de `profesor@rehabilitar.com` quedó como "aaaaaa"** (`Marcos aaaaaa`) — alguien lo pisó probando la edición de perfil. El seed **no** lo corrige a propósito: no toca cuentas activas para no pisar ediciones hechas adrede. Se ve en varias pantallas de la demo. Para dejarlo prolijo:
   ```powershell
   cd backend
   & ..\.venv\Scripts\Activate.ps1
   python -c "import sys; sys.path.insert(0,'.'); from database.connection import SessionLocal; from app.models.user import User; db=SessionLocal(); u=db.query(User).filter(User.email=='profesor@rehabilitar.com').first(); u.lastname='Profesor'; db.commit(); print('ok', u.name, u.lastname)"
   ```
   Ojo: las actividades ya sembradas guardan el nombre del profesor como texto (`Marcos aaaaaa`). Después de renombrarlo, volvé a correr el seed **no** las arregla; si te importa que quede perfecto, renombrá **antes** y borrá las actividades `Cancelación %` para que el seed las recree.

2. **Hay varias "Yoga" viejas** en la base (de demos anteriores de *Asumir*), dos de ellas en Sala 2 y con Alex Rivas. La de esta HU es **la del 19/10/2027** — identificala por fecha, no por nombre.

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

> 🔧 **Corregido el 15/07:** la app mostraba los textos **sin tildes** ("Inscripcion… Tu lugar esta reservado."). Ya está arreglado en [InscribirActividad.jsx:414](frontend/src/pages/client/reservas/InscribirActividad.jsx#L414) — ahora dice **"Inscripción confirmada. Tu lugar está reservado."**, igual que la HU. *(La HU se contradice sola: E1 lo escribe con tilde y E6 sin tilde; se usó la ortografía correcta.)*

> 🔧 **Corregido el 15/07:** "Rehabilitar Codo" había quedado **sin profesor** en la base (alguien renunció o la editó en una demo previa), y el seed no lo arreglaba porque solo crea la actividad si no existe. Ahora el seed le **reasigna Marcos** si la encuentra sin profesor ([seed_mock.py](backend/database/seed_mock.py)). Importaba: sin profesor, la clase entra en la **cancelación automática de ≤12 h** y aparece en la lista de "actividades para asumir".

> 🔧 **Datos a preparar (no vienen en el seed):** para **E4/E5** (lista de espera) llenar antes los **3 cupos** de "Rehabilitar Codo" con otros clientes. El **20% para mayores de 65** se aplica automáticamente (en esta versión de la HU ya no tiene escenario propio).
> Para **E6** (créditos) **ya no hay que preparar nada**: el seed deja a `abonado@` con **saldo 1 crédito** (ver HU 19). Pero **ojo con el orden** — si hacés la **HU 19 E8** antes, ese crédito ya se gastó; y volver a correr el seed **resetea** el ledger.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Confirmada por suscripción activa (abonado) | `abonado@` | Seleccionar "Rehabilitar Codo" → **Siguiente** → **Confirmar por suscripción activa** → **Confirmar** | Inscripción **confirmada**, decrementa cupo, **"Inscripción confirmada. Tu lugar está reservado."** y **notifica** al usuario. |
| E2 | Confirmada con pago total | `cliente@`, simulador **✅ Pago exitoso** | Seleccionar → Siguiente → **Abonar Total** → Confirmar → (overlay "Esperando pago…") → **✅ Pago exitoso** | **Confirmada**, decrementa cupo, **"Inscripción confirmada. Tu lugar está reservado."** y notifica. |
| E3 | Confirmada con seña | `cliente@`, simulador **✅ Pago exitoso** | Seleccionar → Siguiente → **Abonar Seña** → elegir **% a abonar** → Confirmar → (overlay) → **✅ Pago exitoso** | Calcula la seña, registra **Pendiente**, decrementa cupo, **"Inscripción en estado pendiente"** + "Monto abonado: $X. Monto restante: $Y." y notifica. |
| E4 | Lista de espera (abonado, 0 cupos) | `abonado@`, cupos llenos | Seleccionar → Siguiente → **Esperar en la Lista** → Confirmar | Agregado **con prioridad**, **"Agregado a la lista de espera. Te notificaremos cuando haya un cupo disponible."** y notifica. |
| E5 | Lista de espera (no abonado, 0 cupos) | `cliente@`, cupos llenos | Seleccionar → Siguiente → **Esperar en la Lista** → Confirmar | Agregado a la lista **general** (sin prioridad), mismo mensaje y notifica. |
| E6 | Confirmada con créditos | `abonado@` (el seed lo deja con **saldo 1**) | Seleccionar → Siguiente → **Usar crédito** → Confirmar | **Confirmada**, decrementa **cupo y crédito**, **"Inscripción confirmada. Tu lugar está reservado."** y notifica. |
| E7 | Fallida por error en el pago | `cliente@`, simulador **❌ Fondos insuficientes** | Seleccionar → Siguiente → método de pago → Confirmar → (overlay) → **❌ Fondos insuficientes** | **"Hubo un error en el pago. Intenta nuevamente."** ✅ *literal* y **cancela** la inscripción. |

**Reglas del código a tener en cuenta** (verificadas el 15/07 en [servicio_reservas.py:23](backend/app/services/servicio_reservas.py#L23), `create_reservation`):
- **Sin apto físico aprobado no hay inscripción**, en ningún escenario ([servicio_reservas.py:39](backend/app/services/servicio_reservas.py#L39)). El seed ahora lo **aprueba automáticamente** para `cliente@`, `abonado@` y `pilates.demo@`.
- La **seña** tiene que estar entre **50% y 100%** ([servicio_reservas.py:76](backend/app/services/servicio_reservas.py#L76)) — coincide con la regla de negocio de la HU.
- La **suscripción cubre 4 clases fijas por plan**; si no quedan cupos, E1 falla con *"No tenés cupo disponible en tu suscripción…"*.
- `subscription`, `full_payment` y `credit` → **confirmada**; `partial_payment` (seña) → **pendiente** ([servicio_reservas.py:98](backend/app/services/servicio_reservas.py#L98)).

---

## HU 10 — Inscribir a Actividad Individual

**Precondición:** El seed crea "Rehabilitar Codo" (individual, fecha = hoy + 14 días al momento del seed, hora 14:00, $8000, capacidad 3, Sala 1). Si esa fecha ya pasó, crear una nueva individual vía HU 8 E2. **Mismo simulador de Mercado Pago, overlay "Esperando pago…" y mismos textos de resultado que HU 9.** El cliente puede ser abonado o no abonado; el 20% por edad **no** aplica a individuales (solo a fijas).

**Dos desvíos de la HU individual — los dos son error de la HU, no del sistema:**
1. **E1/E2 arrastran textos viejos** ("Tu inscripción quedo confirmada. Podes verla en Mis Reservas."). Ese texto **no existe** en ninguna parte del código, y la HU fija (HU 9) pide **otro** texto para el mismo evento. Se dejó el de la HU 9, que es el que la app usa en las dos pantallas (es el mismo componente).
2. **E2 dice "confirmada" para un pago con seña.** Es imposible por regla de negocio: pago parcial ⇒ **pendiente** ([servicio_reservas.py:101](backend/app/services/servicio_reservas.py#L101)). La propia HU 9 E3 lo dice bien.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Inscripción con pago total | `cliente@`, simulador **✅ Pago exitoso** | Inscribirse en "Rehabilitar Codo" (individual) → Siguiente → **Abonar Total** → Confirmar → **✅ Pago exitoso** | Inscripción **confirmada**, decrementa cupo: **"Inscripción confirmada. Tu lugar está reservado."** *(la HU pide "Tu inscripción quedo confirmada. Podes verla en Mis Reservas." — ver desvío 1)* |
| E2 | Inscripción con seña | `cliente@`, simulador **✅ Pago exitoso** | Inscribirse → Siguiente → **Abonar Seña** → Confirmar → **✅ Pago exitoso** | Reserva **pendiente**: **"Inscripción en estado pendiente"** + montos *(la HU dice "confirmada" — ver desvío 2)* |
| E3 | Lista de espera general (0 cupos) | `cliente@`, cupos llenos | Inscribirse → Siguiente → **Esperar en la lista** → Confirmar | Agregado a la lista de espera general: **"Agregado a la lista de espera"** + "Te notificaremos cuando haya un cupo disponible." *(la HU escribe "Fuiste agregado a la lista de espera…"; la HU 9 escribe "Agregado a la lista de espera…" para el mismo mensaje — la app usa esta última)* |
| E5 | Fallida por error en el pago | `cliente@`, simulador **❌ Fondos insuficientes** | Inscribirse → Siguiente → Abonar Total/Seña → Confirmar → **❌ Fondos insuficientes** | **"Hubo un error en el pago. Intenta nuevamente."** (no se inscribe). |

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

---

## HU 16 — Modificar Actividad (Admin)

**Flujo:** entrar como `admin@` → **Actividades** → **Editar** en la actividad → cambiar Sala y/o Profesor → **Guardar cambios**.
**Ref. código:** [EditarActividad.jsx](frontend/src/pages/admin/actividades/EditarActividad.jsx) · [servicio_actividades.py:393](backend/app/services/servicio_actividades.py#L393) (`editar_actividad`) · [notifications.py:264](backend/app/utils/notifications.py#L264) (`notify_activity_modified`).

**Reglas que impone el código (no están en la HU, pero condicionan la demo):**
- **Solo se puede cambiar sala y profesor.** El resto (nombre, horario, precio) queda fijo al crear ([servicio_actividades.py:394](backend/app/services/servicio_actividades.py#L394)).
- El selector de **Sala** solo ofrece salas con **capacidad ≥ la de la sala original** y libres ese día/hora ([EditarActividad.jsx:186](frontend/src/pages/admin/actividades/EditarActividad.jsx#L186)). El backend rechaza bajar de capacidad con un 400 ([servicio_actividades.py:412](backend/app/services/servicio_actividades.py#L412)).
- El selector de **Profesor** solo ofrece profesores de **la misma especialidad** que la actividad y sin choque de horario ([EditarActividad.jsx:160](frontend/src/pages/admin/actividades/EditarActividad.jsx#L160)). Eso es lo que hace que "Pablo cumple la condición". **Ojo:** esa validación es **solo del frontend** — `editar_actividad` no revalida la especialidad, así que por API se podría asignar un profesor de otra especialidad.

> 🔎 **La HU E1 se contradice a sí misma.** El "Dado" habla de *Sala 5 (cap. 6) → Sala 6 (cap. 10)*, pero el mensaje esperado dice *"Sala: Sala 2 → Sala 3"*. Se sembró la actividad en **Sala 2** para que la notificación salga **palabra por palabra** como la pide la HU. (Además *Sala 5 → Sala 6* sería **imposible** en el sistema: Sala 6 tiene capacidad 5 y Sala 5 tiene 8 — bajar de capacidad está prohibido.)

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Modificación de **sala** exitosa | `admin@`. Actividad **"Yoga"** del **19/10/2027** (Martes · 10:00–11:00, Sala 2, cap. 6, prof. **Alex Rivas**, `cliente@` inscripto) | Actividades → **Editar** en "Yoga" del 19/10/2027 → Sala: **Sala 3** → **Guardar cambios** | Guarda el cambio y **notifica al profesor (Alex) y al cliente (Carlos)**. Inbox de ambos:<br>**Título:** `Actividad modificada (la sala): Yoga`<br>**Cuerpo:** `Se modificó la sala de 'Yoga'. Sala: Sala 2 → Sala 3.` ✅ *coincide literal con la HU* |
| E2 | Modificación de **profesor** exitosa | `admin@`. Actividad **"Tren superior"** del **20/08/2026** (Jueves · 13:00–14:00, Sala 3, prof. **Ámbar Soto**, `cliente@` inscripto) | Actividades → **Editar** en "Tren superior" del 20/08/2026 → Profesor: **Pablo Ruiz** → **Guardar cambios** | Guarda y manda **3 notificaciones**:<br>→ **Pablo**: `Asignación a actividad: Tren superior` / `Fuiste asignado/a como profesor/a de 'Tren superior' programada para Jueves 2026-08-20 · 13:00–14:00.`<br>→ **Ámbar**: `Cambio en actividad: Tren superior` / `Fuiste removido/a de la actividad 'Tren superior' programada para Jueves 2026-08-20 · 13:00–14:00.`<br>→ **cliente@**: `Actividad modificada (el profesor): Tren superior` / `Se modificó el profesor de 'Tren superior'. Profesor: Ámbar Soto → Pablo Ruiz.` |

**Desvíos de E2 respecto del texto de la HU** (ambos son la *misma variable* renderizada distinto, no un bug):
- La HU escribe la fecha como `2026-08-20 13:00`; la app la escribe `Jueves 2026-08-20 · 13:00–14:00`. El formato corto es el de las actividades **individuales**; "Tren superior" es **fija**, y para las fijas el sistema arma la etiqueta con día + rango ([notifications.py:242](backend/app/utils/notifications.py#L242), `_when_label`).
- La HU dice `Ámbar → Pablo`; la app usa **nombre + apellido** (`Ámbar Soto → Pablo Ruiz`), porque el campo `professor` guarda el nombre completo.

> 🔁 **Para repetir la demo:** E1 y E2 **se gastan** (quedan con la sala/profesor nuevos). Para volver atrás: editar de nuevo y elegir Sala 2 / Ámbar Soto. Correr el seed **no** los resetea (son aditivos, ya existen).

---

## HU 17 — Cancelar Actividad (Admin)

**Flujo:** `admin@` → **Actividades** → botón **Cancelar** en la fila → modal **"Confirmar cancelación"** → **Confirmar** o **Cancelar**.
**Ref. código:** [ListaActividades.jsx:115](frontend/src/pages/admin/actividades/ListaActividades.jsx#L115) · [servicio_actividades.py:464](backend/app/services/servicio_actividades.py#L464) (`cancelar_actividad`) · [notifications.py:213](backend/app/utils/notifications.py#L213).

> La actividad **no se borra**: pasa a `status="cancelled"` ([servicio_actividades.py:525](backend/app/services/servicio_actividades.py#L525)). Por eso el aula queda libre, que es lo que pide el título de la HU.

> ⚠️ **Orden obligatorio: E2 antes que E1.** Los dos usan la **misma** "Rehabilitar Muñeca" (la del profesor Franco): E2 aborta la cancelación y E1 la concreta. Si hacés E1 primero, E2 ya no tiene qué cancelar.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| **E2** *(hacer primero)* | Cancelación **abortada** | `admin@`. **"Rehabilitar Muñeca"** con prof. **Franco Ibarra** (Lunes · 10:00–11:00, Sala 6, **sin inscriptos**) | Actividades → **Cancelar** → en el modal, **Cancelar** | Se cierra el modal y **no pasa nada**: la actividad sigue activa en la lista. |
| **E1** *(después de E2)* | Cancelación exitosa **con profesor** | La misma "Rehabilitar Muñeca" de E2 | Actividades → **Cancelar** → **Confirmar** | Cancela la actividad y notifica a **Franco**:<br>**Título:** `Actividad cancelada: Rehabilitar Muñeca`<br>**Cuerpo:** `Te informamos que la actividad 'Rehabilitar Muñeca' programada para Lunes 2026-07-27 · 10:00–11:00 fue cancelada.` |
| E3 | Cancelación exitosa **sin profesor** | `admin@`. La **otra** "Rehabilitar Muñeca" — la de **Lunes · 12:00–13:00** (Sala 6, **sin profesor** ni inscriptos) | Actividades → **Cancelar** → **Confirmar** | Cancela la actividad **sin mandar ninguna notificación** (`notify_activity_cancellation` corta al toque si no hay profesor — [notifications.py:189](backend/app/utils/notifications.py#L189)). |
| E4 | Cancelación **fallida** por inscriptos | `admin@`. **"Pilates"** de **Viernes · 17:00–18:00** (Sala 5, prof. Carlos Pilates, **1 inscripta**: Nadia) | Actividades → **Cancelar** → **Confirmar** | Error: **`No se puede eliminar la actividad: tiene clientes inscriptos.`** ✅ *literal* · La actividad **sigue activa**. |

**Sobre la fecha de E1:** la HU dice `Lunes 2026-06-29 · 10:00–11:00`, que **ya pasó** (hoy es 15/07/2026). El seed la programa el **próximo lunes futuro**, así que la fecha del mensaje cambia. **El formato es idéntico** al de la HU (`Lunes YYYY-MM-DD · HH:MM–HH:MM`) — lo único distinto es el día concreto.

**Hay dos "Rehabilitar Muñeca" a propósito** (E1/E2 usan la de las 10:00 **con** Franco; E3 usa la de las 12:00 **sin** profesor). Se distinguen por **hora y profesor** en la lista. La de E3 usa la especialidad *Electroterapia*, que no tiene ningún profesor asignado, justamente para que no aparezca en la lista de "actividades para asumir" de nadie.

> ⚠️ **Ojo con "Pilates":** en la base hay **8 "Pilates" viejas canceladas** de los viernes 15:00 (basura de demos de *Aceptar sugerencia*). La de esta HU es la de las **17:00**, y es la única **activa**. También existe una **sugerencia** pendiente llamada "Pilates" (Sala 2, viernes 15:00) que usa la HU 4 — **no la toques acá**.

> 🔁 **Para repetir:** E1, E3 y (si llegara a funcionar) E4 **gastan** la actividad. El seed **no** las recrea (chequea nombre+fecha+hora y las encuentra, aunque estén canceladas). Para repetir, borralas a mano y volvé a correr el seed.

---

## HU 18 — Renunciar a Actividad (Profesor)

**Flujo:** entrar como el profesor → **Mis actividades** → **Renunciar** → modal **"Confirmar renuncia"** → **Sí, renunciar**.
**Ref. código:** [MisActividades.jsx:155](frontend/src/pages/kinesiologist/actividades/MisActividades.jsx#L155) · [servicio_actividades.py:550](backend/app/services/servicio_actividades.py#L550) (`renunciar_actividad`) · [notifications.py:967](backend/app/utils/notifications.py#L967).

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Baja exitosa | **`profe@gmail.com`** / `Profesor123` (Ariel Gómez). Actividad fija **"Tren superior"** — la de **Lunes · 09:00–10:00** del **10/08/2026** (Sala 5, Osteopatía) | Mis actividades → **Renunciar** en "Tren superior" → **Sí, renunciar** | Renuncia y muestra **`Renunciaste a la actividad "Tren superior" correctamente.`** ✅ *literal* · La actividad **queda sin profesor** (`professor = None`, [servicio_actividades.py:600](backend/app/services/servicio_actividades.py#L600)) → el cupo de profesor queda libre · Se **avisa al admin**: `Renuncia de profesor: Tren superior` / `El profesor Ariel Gómez renunció a 'Tren superior' programada para Lunes 2026-08-10 · 09:00–10:00.` |

**Ojo con los dos "Tren superior":** el de esta HU es el de **Ariel Gómez / Lunes 09:00 / Sala 5**. El otro (Ámbar → Pablo, Jueves 13:00, Sala 3) es de la **HU 16 E2** — son actividades separadas **a propósito**, para que las dos HUs no se pisen y puedas demostrarlas **en cualquier orden**.

> 🔁 **Para repetir:** después de renunciar, la actividad queda libre y Ariel puede **volver a asumirla** desde la misma pantalla (*Actividades que podés asumir*) — es la forma más rápida de resetear este escenario, y de paso demuestra la HU de *Asumir*.

---

## HU 19 — Cancelar Turno (Cliente abonado / no abonado)

**Flujo:** entrar como cliente → **Mis reservas** → **Cancelar turno** → modal **"¿Cancelar turno?"** → **Confirmar cancelación**.
**Ref. código:** [MisReservas.jsx](frontend/src/pages/client/reservas/MisReservas.jsx) · [servicio_reservas.py:240](backend/app/services/servicio_reservas.py#L240) (`cancel_reservation_with_policy`) · [credits.py](backend/app/utils/credits.py).

### Regla de los descuentos (24-48 h)

**20% en la primera cancelación del mes, 30% en la segunda, sin descuento a partir de la tercera.** El descuento es **total, no acumulativo**: el de la segunda reemplaza al de la primera, no se suman. El código ya lo implementa así ([servicio_reservas.py:319](backend/app/services/servicio_reservas.py#L319)) — verificado el 15/07 corriendo los 8 escenarios.

> ⚠️ **El texto de la HU tiene los porcentajes al revés.** La versión escrita de esta HU dice "30% en la primera, 20% en la segunda" (y sus escenarios E2/E3 repiten esa inversión, incluido el literal *"Tenés un 20%…"* en E3). La regla correcta, confirmada el 15/07, es **20% → 30%**. Esta tabla sigue la regla correcta, no el texto de la HU.

### Cómo se simulan las ventanas de tiempo

**No hay override de fecha en el backend.** El seed crea 8 turnos con la hora de inicio calculada como **offset desde el momento en que corrés el seed** (+10 h, +12 h, +30 h, +36 h, +40 h, +44 h, +60 h, +72 h). La política lee `reservation.reservation_date`, así que con eso alcanza: no hay que esperar ninguna fecha real.

> ⚠️ **Corré el seed el mismo día de la demo.** Los turnos "de menos de 24 h" quedan a ~10-12 h: si el seed es de ayer, esos turnos ya empezaron y el botón **Cancelar turno** aparece **deshabilitado** ("La clase ya comenzó o finalizó"). Volver a correr el seed regenera los 8 turnos y **resetea** créditos y descuento.

### ⚠️ Orden obligatorio: E2 → E3 → E4

Los tres dependen de **cuántas veces cancelaste en la franja 24-48 h este mes** ([servicio_reservas.py:292](backend/app/services/servicio_reservas.py#L292)). Si los hacés desordenados, los porcentajes salen mal. **E1, E5, E6, E7 y E8 son independientes** y se pueden hacer en cualquier momento.

> 💡 **Mirá "Mis Suscripciones" justo después de E2 y de E3.** El descuento pendiente se **pisa** en cada cancelación, y **E4 lo borra** (lo deja en 0). Si hacés E4 y después vas a mirar, no vas a ver ningún descuento.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Cancelación con **crédito** (>48 h) | `abonado@` · turno **"Cancelación +48h (abonado)"** (~60 h) | Mis reservas → **Cancelar turno** → **Confirmar cancelación** | Cancela y otorga 1 crédito: **`Turno cancelado. Se te otorgó un crédito para tu próxima clase.`** ✅ *literal* |
| **E2** *(1ro)* | **Primera** cancelación con descuento (24-48 h) | `abonado@` · turno **"Cancelación 24-48h (1ra)"** (~36 h) | **Cancelar turno** → **Confirmar cancelación** | Cancela y da **20%**: **`Turno cancelado. Tendrás un 20% de descuento en el pago de tu próxima suscripción mensual.`** → en **Mis Suscripciones**: **`Tenés un 20% de descuento pendiente por cancelación. Se aplicará automáticamente en el pago de tu próxima renovación de suscripción.`** |
| **E3** *(2do)* | **Segunda** cancelación con descuento (24-48 h) | `abonado@` · turno **"Cancelación 24-48h (2da)"** (~40 h) | **Cancelar turno** → **Confirmar cancelación** | Cancela y da **30%**, que **reemplaza** al 20% anterior: **`Turno cancelado. Tendrás un 30% de descuento (total, no acumulativo) en el pago de tu próxima suscripción mensual.`** → en **Mis Suscripciones** el cartel ahora dice **30%** |
| **E4** *(3ro)* | **Tercera** cancelación, **sin** descuento | `abonado@` · turno **"Cancelación 24-48h (3ra)"** (~44 h) | **Cancelar turno** → **Confirmar cancelación** | Cancela **sin descuento**: **`Turno cancelado. Perdiste el beneficio de descuento por cancelaciones repetidas este mes.`** · el descuento pendiente **vuelve a 0** |
| E5 | Cancelación **sin beneficios** (<24 h) | `abonado@` · turno **"Cancelación -24h (abonado)"** (~12 h) | **Cancelar turno** → **Confirmar cancelación** | **`Turno cancelado. No recibís crédito ni devolución: cancelaste con menos de 24 hs de anticipación.`** |
| E6 | Cancelación **con devolución de seña** (>24 h) | `cliente@` (**no** abonado) · turno **"Cancelación +24h (no abonado)"** (~30 h, seña 50%) | **Cancelar turno** → **Confirmar cancelación** | **`Turno cancelado. Se te reintegra el 50% que habías abonado.`** · queda el reintegro en la **auditoría** ([servicio_reservas.py:338](backend/app/services/servicio_reservas.py#L338)) |
| E7 | Cancelación **sin devolución** (<24 h) | `cliente@` · turno **"Cancelación -24h (no abonado)"** (~10 h, seña 50%) | **Cancelar turno** → **Confirmar cancelación** | **`Turno cancelado. No se reintegra lo abonado: cancelaste con menos de 24 hs de anticipación.`** |
| E8 | Cancelación **sin crédito** (clase reservada con crédito) | `abonado@` · turno **"Cancelación con crédito (+48h)"** (~72 h) | **Cancelar turno** → **Confirmar cancelación** | **`Turno cancelado. No se otorga crédito: esta clase fue reservada usando un crédito.`** ✅ *literal* |

### Notas de la HU 19

- **E8 tiene que ser >48 h, no >24 h.** La HU dice "faltan más de 24 hs", pero el chequeo de "reservada con crédito" solo vive en la rama de **>48 h** ([servicio_reservas.py:301](backend/app/services/servicio_reservas.py#L301)). Entre 24 y 48 h caería en la rama de descuento y daría otro mensaje. El turno sembrado está a ~72 h.
- **E2 y E4 no fijan texto literal en la HU** ("se informan ambas operaciones" / "se informa que el turno se canceló sin aplicar descuento"). La tabla pone el texto **real** de la app.
- **El descuento se ve en "Mis Suscripciones", no en "Mi perfil".** La HU E3 dice "Mi perfil", pero la sección se movió — está en [MisSuscripciones.jsx:331](frontend/src/pages/client/pagos/MisSuscripciones.jsx#L331) (el propio código lo comenta: *"movido desde Mi Perfil"*).
- **Estado de créditos que deja el seed para `abonado@`:** 2 ganados y 1 gastado (el de E8) → **saldo 1**. Ese crédito libre es el que usa la **HU 9 E6** (inscripción con crédito). Con 2 ganados sigue debajo del tope de 3, así que E1 todavía puede otorgar el suyo. Después de E1 quedan **3 ganados** = tope alcanzado: otra cancelación >48 h diría *"Ya alcanzaste el límite de 3 créditos este mes."* ([credits.py:19](backend/app/utils/credits.py#L19)).
- **La HU dice "menos de 3 créditos"**, que suena a *saldo*; el código mira **ganados en el mes**, no el saldo ([credits.py:70](backend/app/utils/credits.py#L70)). Con los datos del seed las dos lecturas dan lo mismo, así que no cambié nada.
- **Por qué los turnos demo tienen profesor asignado:** hay un job que corre **cada 15 minutos** y cancela automáticamente las clases **sin profesor** que empiezan en ≤12 h ([servicio_auto_cancelacion.py:34](backend/app/services/servicio_auto_cancelacion.py#L34)). Los turnos de E5/E7 están dentro de esa ventana: sin profesor, el job se los comería en pleno demo.

---
