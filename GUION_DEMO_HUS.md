# Guión de Demo — Historias de Usuario RehabilitAR

> Rama de trabajo: `angel`
> Última actualización: 2026-07-16
> HU1–HU8 revisadas contra el código real (backend + frontend) y el seed.
> HU9–HU19 revisadas y verificadas contra el código el 2026-07-15.
> **HU 9 reescrita y HU 20–HU 21 agregadas el 2026-07-16**, verificadas end-to-end contra el código y el seed.

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
| **Cliente inscripto (HU 16 y 17)** | **Nadia Pilatera** | **pilates.demo@rehabilitar.com** | **Cliente123** |
| **Cliente abonado Kin. deportiva (HU 9 E4)** | **Diego Deportivo** | **deportivo@rehabilitar.com** | **Cliente123** |
| **Cliente de 75 años (HU 21 E4)** | **Juan Mayor** | **juan.mayor@rehabilitar.com** | **Cliente123** |
| **Cliente SIN apto físico (HU 20 E3 · HU 21 E5)** | **Pepe SinApto** | **pepe.sinapto@rehabilitar.com** | **Cliente123** |

> **Los 3 últimos los agregó el seed el 16/07** para las HU 9 E4, 20 y 21. **Pepe queda sin apto físico a propósito** — `_seed_apto_fisico_demo` lo excluye explícitamente, porque es el cliente que demuestra el bloqueo por apto pendiente.

> **Diego existe para no romper "Adquirir plan".** La HU 9 E4 necesita un abonado de *Kinesiología deportiva*, pero si ese token fuera de Ana, ella no podría **comprar** esa especialidad (el sistema no deja comprar un token de una especialidad que ya tenés sin usar) y se caería la HU 21 E2, que es la única con descuento pendiente.

> Los 5 de abajo los agregó el seed para las HU 16–19. Franco, Ámbar/Pablo y Ariel tienen **especialidades exclusivas** a propósito: así el selector de profesor y las listas de "actividades para asumir" muestran justo lo que pide cada HU y nada más.

> **Nadia existe para no ensuciar a `cliente@`.** Es la inscripta en las actividades de las HU 16 y 17, que solo están para demostrar los avisos a clientes. Si esas inscripciones fueran de `cliente@`, aparecerían en su "Mis reservas" mezcladas con los turnos de la HU 19 y es facilísimo cancelarlas sin querer (ya pasó).

### ⚠️ Dos cosas para revisar antes de la demo (datos arrastrados de sesiones previas)

1. **El apellido de `profesor@rehabilitar.com` quedó como "aaaaaa"** (`Marcos aaaaaa`) — alguien lo pisó probando la edición de perfil. El seed **no** lo corrige a propósito: no toca cuentas activas para no pisar ediciones hechas adrede. Se ve en varias pantallas de la demo. Para dejarlo prolijo:
   ```powershell
   cd backend
   & ..\.venv\Scripts\Activate.ps1
   python -c "import sys; sys.path.insert(0,'.'); from database.connection import SessionLocal; from app.models.user import User; db=SessionLocal(); u=db.query(User).filter(User.email=='profesor@rehabilitar.com').first(); u.lastname='Profesor'; db.commit(); print('ok', u.name, u.lastname)"
   ```
   Ojo: las actividades ya sembradas guardan el nombre del profesor como texto (`Marcos aaaaaa`). Después de renombrarlo, volvé a correr el seed **no** las arregla; si te importa que quede perfecto, renombrá **antes** y borrá las actividades `Cancelación %` para que el seed las recree.

2. **Hay varias "Yoga" viejas** en la base (de demos anteriores, especialidad *Fisioterapia*, ya pasadas o canceladas). Las que importan son dos: la del **19/10/2027** (HU 16 E1, Sala 2, Alex Rivas) y la del **próximo martes** (HU 5, Sala 4, sin profesor). Identificalas por **fecha**, no por nombre.
   El 15/07 se limpiaron las **duplicadas** que pisaban la misma sala, día y hora: las generaba un bug del seed que ya está corregido (buscaba la "Yoga" de *Asumir* filtrando por `professor IS NULL`, así que apenas Alex la asumía dejaba de encontrarla y creaba otra encima).

---

## Cómo simular fechas y feriados (leer antes de las HUs con fecha)

- **No hay override de fecha en el backend.** "Hoy" es el reloj del sistema (al momento de armar este guión, **2026-07-14**).
- Los **feriados** se calculan en el frontend con la librería `date-holidays` (Argentina) — ver [frontend/src/utils/feriados.js](frontend/src/utils/feriados.js). Para "simular" un feriado alcanza con **elegir una fecha que realmente sea feriado**. No hay que esperar la fecha real.
- El campo de fecha (individual) tiene `min = hoy`, así que **no se pueden elegir fechas pasadas** desde el date-picker.
- **Ninguna de estas 8 HUs usa Mercado Pago.** El simulador de pago aplica a las **HU 9 / HU 10** (inscripciones) y a la **HU 21** (adquirir plan). En los tres casos es el mismo simulador: **no hace falta una cuenta ni un pago real**, se elige el resultado desde la ventana emergente.

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

### 🔧 Cambio del 15/07: la lista "Actividades que podés asumir" ahora filtra por choque de horario

Antes la lista mostraba **todas** las actividades sin profesor de tu especialidad, aunque se superpusieran con una clase que ya tenías: al hacer click en **Asumir** el backend las rechazaba con *"El profesor X ya tiene una actividad asignada en ese horario."* Ahora **no se muestran**.

El filtro lo hace el backend en [`listar_actividades_asumibles`](backend/app/services/servicio_actividades.py#L690), reutilizando el **mismo** `_solapa_en_profesor` que usa `asumir_actividad` para validar — por eso la lista y el botón no pueden discrepar. Se muestra una actividad solo si cumple **todo**:

- está **activa** y **no empezó** todavía;
- **no tiene profesor**;
- su especialidad es **la tuya**;
- **no se superpone** con ninguna de tus actividades activas.

Sobre el solapamiento, el criterio es el del backend: si **las dos** actividades tienen fecha puntual, solo chocan si es **la misma fecha** y los horarios se pisan; si a alguna le falta la fecha, se compara por **día de la semana**.

> 💡 **Para mostrarlo en vivo:** entrá como `admin@` y asigná a **Alex Rivas** como profesor de cualquier actividad de **Yoga** que caiga el **martes a las 10:00**. La "Yoga" de esta HU **desaparece** de su lista de "podés asumir". Sacale esa asignación y vuelve a aparecer.

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

**Flujo:** Reservas → seleccionar la actividad → **Siguiente** → elegir método → **Confirmar**. En cada confirmación el sistema además **notifica al usuario** (inbox + email). **Ref. código:** [InscribirActividad.jsx](frontend/src/pages/client/reservas/InscribirActividad.jsx) · [servicio_reservas.py:176](backend/app/services/servicio_reservas.py#L176) (`create_reservation`).

### 🔑 Lo primero que hay que entender: la suscripción cubre EL MES, no una clase

Un plan es un **token de un solo uso** atado a una especialidad. Al inscribirte por suscripción a una clase fija, el sistema te anota **a las 4 clases de ese mes de una sola vez** ([servicio_reservas.py:52](backend/app/services/servicio_reservas.py#L52), `_inscribir_ocurrencias_del_mes`) y el token queda **gastado**. No se gasta "de a una clase": o está entero, o está usado.

Por eso en **E1** las "clases usadas" pasan de **0 a 4**, no de 0 a 1, y el cupo baja **en las 4 clases** — que es exactamente lo que pide la HU ("decrementa el cupo disponible a las 4 clases, inscribe al cliente en las 4 actividades"). Verificado end-to-end el 16/07.

### Datos que deja el seed (16/07 — antes no existían)

| Dato | Detalle |
|---|---|
| **"Rehabilitar Codo"** (E1/E2/E3/E6/E7) | **4 clases** del **mes que viene**, Martes · 10:00–11:00, Sala 1, cap. **3**, $5000, Fisioterapia, prof. Marcos. Las 4 son **filas hermanas** (mismo lote). |
| **"Rehabilitar tobillo"** (E4) | **4 clases**, Miércoles · 10:00–11:00, Sala 2, cap. **3**, $6000, **Kinesiología deportiva**, prof. Sofia. La **primera del mes está llena** (3/3). |
| **"Rehabilitar Codo" 12:00** (E5) | La de la **lista de espera**: próximo martes, **0 cupos** (llena por los clientes de relleno). |
| Suscripciones | `abonado@` → **Fisioterapia sin usar** · `deportivo@` → **Kin. deportiva sin usar** · `cliente@` → **ninguna (no abonado)**. |

> ⚠️ **Los lotes se programan en el MES QUE VIENE, no en el actual.** El mes en curso puede tener menos de 4 martes por delante, y el sistema solo cuenta las clases **futuras**: con **2 clases o menos** el token dispararía además el descuento por "mes corto" ([subscriptions.py:18](backend/app/utils/subscriptions.py#L18)), que no es lo que describe la HU.

> ⚠️ **En la lista van a aparecer 6 tarjetas "Rehabilitar Codo".** Las 4 del lote (martes **10:00**, una por fecha), la de lista de espera (martes **12:00**) y la **individual** de la HU 10 (viernes 14:00). **Identificalas por hora y fecha**, no por nombre. Es a propósito: los escenarios se contradicen sobre la misma actividad (E1/E2/E3 piden cupo libre, E5 pide 0 cupos).

**Simulación de Mercado Pago (Abonar Total / Abonar Seña):** al **Confirmar** aparece el overlay **"Esperando pago… Completá el pago en la ventana de Mercado Pago que se abrió."** ([OverlayEsperandoPago.jsx:36](frontend/src/components/OverlayEsperandoPago.jsx#L36)) y se abre la ventana [/pago/mercadopago](frontend/src/pages/pago/PagoMercadoPago.jsx) con *"Elegí un escenario para simular"* → **"✅ Pago exitoso"** / **"❌ Fondos insuficientes"**. *(Habilitar ventanas emergentes.)*

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Confirmada por suscripción activa | **`abonado@`** (token Fisioterapia sin usar) | Seleccionar **cualquiera** de las 4 "Rehabilitar Codo" de las **10:00** → **Siguiente** → **Confirmar por suscripción activa** → **Confirmar** | Inscripción **confirmada**, cupo **3→2 en las 4 clases**, clases usadas **0→4**: **"Inscripción confirmada. Tu lugar está reservado."** ✅ *literal* + recuadro *"Tu plan cubre el mes, así que te inscribimos en las 4 clases del mes."* · **Inbox:** `Inscripción confirmada: Rehabilitar Codo` ✅ *literal* + mail. |
| E2 | Confirmada con pago total | **`cliente@`** (no abonado), simulador **✅ Pago exitoso** | Seleccionar una "Rehabilitar Codo" de las 10:00 → Siguiente → **Abonar Total** → Confirmar → (overlay) → **✅ Pago exitoso** | **Confirmada**, decrementa cupo **solo de esa clase**: **"Inscripción confirmada. Tu lugar está reservado."** y notifica. |
| E3 | Confirmada con seña | `cliente@`, simulador **✅ Pago exitoso** | Seleccionar → Siguiente → **Abonar Seña** → elegir **% a abonar** → Confirmar → (overlay) → **✅ Pago exitoso** | Calcula la seña, registra **Pendiente**: **"Inscripción en estado pendiente"** + "Monto abonado: $X. Monto restante: $Y." y notifica. |
| E4 | Lista de espera **con prioridad** (abonado) | **`deportivo@`** · **"Rehabilitar tobillo"** — la **primera clase del mes** (la llena) | Seleccionar esa clase → Siguiente → **Esperar en la lista** → Confirmar | Agregado **con prioridad** (`waitlist_type = priority`, verificado): **"Agregado a la lista de espera. Te notificaremos cuando haya un cupo disponible."** ✅ *literal* y notifica. |
| E5 | Lista de espera **general** (no abonado) | `cliente@` · **"Rehabilitar Codo" de las 12:00** (0 cupos) | Seleccionar esa clase → Siguiente → **Abonar Total** o **Abonar Seña** → Confirmar → **✅ Pago exitoso** | Agregado a la lista **general**. ⚠️ **No dice el texto de la HU** — ver el desvío de abajo. |
| E6 | Confirmada con créditos | `abonado@` (el seed lo deja con **saldo 1**) | Seleccionar una "Rehabilitar Codo" de las 10:00 → Siguiente → **Usar crédito** → Confirmar | **Confirmada**, decrementa **cupo y crédito**: **"Inscripción confirmada. Tu lugar está reservado."** y notifica. |
| E7 | Fallida por error en el pago | `cliente@`, simulador **❌ Fondos insuficientes** | Seleccionar → Siguiente → método de pago → Confirmar → (overlay) → **❌ Fondos insuficientes** | **"Hubo un error en el pago. Intenta nuevamente."** ✅ *literal* y **cancela** la inscripción. |

> ⚠️ **Orden: E1 y E6 se pisan entre sí — corré el seed entre los dos.** Los dos son de `abonado@` sobre "Rehabilitar Codo":
> - **E1 después de E6** → E1 informa **"te inscribimos en las 3 clases del mes"** en vez de 4, porque la clase que Ana ya reservó con el crédito se saltea.
> - **E6 después de E1** → E1 la anotó a **las 4** clases, así que las 4 tarjetas **desaparecen** de su lista (la pantalla oculta las actividades en las que ya estás inscripto) y E6 se queda sin actividad.
>
> Correr el seed tarda segundos y deja todo como estaba, así que lo más prolijo es **E1 → seed → E6**. E2/E3/E7 son de `cliente@` y E4 de `deportivo@`: **no se pisan** con E1/E6 ni entre sí.

### ❗ Desvío real de E5: el sistema NO le ofrece "Esperar en la Lista" al no abonado

La HU dice que el no abonado elige *"Esperar en la Lista"* y queda en la cola gratis. **El sistema no hace eso**: al no abonado sin cupos lo obliga a **abonar** (total o seña) para reservar su lugar en la cola ([InscribirActividad.jsx:723](frontend/src/pages/client/reservas/InscribirActividad.jsx#L723)), y el mensaje final es **"Abonaste $X. Si se libera un cupo tu inscripción queda confirmada; si la clase pasa sin que te toque, te devolvemos el total."**

**Está así a propósito y no lo toqué:** hay una regla de reintegro implementada alrededor ([servicio_reintegros.py](backend/app/services/servicio_reintegros.py)) que le devuelve la plata si la clase pasa sin que le toque el cupo. El abonado sí entra gratis y con prioridad (E4), que es la diferencia de beneficio entre uno y otro. **Decisión pendiente tuya:** si la HU manda, hay que agregar el botón "Esperar en la lista" sin pago para no abonados.

### Reglas del código a tener en cuenta

- **Sin apto físico aprobado no hay inscripción**, en ningún escenario ([servicio_reservas.py:192](backend/app/services/servicio_reservas.py#L192)). El seed lo aprueba para todos los clientes de demo **menos Pepe**.
- La **seña** tiene que estar entre **50% y 100%** ([servicio_reservas.py:232](backend/app/services/servicio_reservas.py#L232)) — coincide con la regla de negocio de la HU ("al menos el 50% como seña").
- `subscription`, `full_payment` y `credit` → **confirmada**; `partial_payment` (seña) → **pendiente** ([servicio_reservas.py:254](backend/app/services/servicio_reservas.py#L254)).
- Un token cuenta como **usado** si existe *cualquier* reserva imputada a él, **incluidas las canceladas** ([subscriptions.py:67](backend/app/utils/subscriptions.py#L67)). Cancelar los turnos **no** revive la suscripción — por eso el seed borra esas reservas para poder repetir la demo.

> 🔧 **Corregido el 16/07:** faltaba el **punto** después de "Agregado a la lista de espera" ([InscribirActividad.jsx:838](frontend/src/pages/client/reservas/InscribirActividad.jsx#L838)); ahora el texto es literal el de la HU. También se cambió `Esperando pago...` por **`Esperando pago…`** (elipsis, como la escribe la HU).

> 🔧 **Bug de datos corregido el 16/07:** el token de Fisioterapia de `abonado@` estaba **gastado** en la base (por reservas canceladas de demos anteriores), así que **E1 fallaba** con *"No tenés una suscripción disponible para esta especialidad"*. Además `cliente@` tenía **3 suscripciones viejas** y figuraba como **abonado**, lo que rompía E2/E3/E5 (que lo piden **no abonado**). El seed ahora normaliza las suscripciones de los clientes de demo en cada corrida.

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

> 🔁 **Para repetir la demo:** volvé a correr el seed. Desde el 15/07 estas actividades se **auto-restauran** al estado inicial de la HU: si una demo les cambió la sala o el profesor, o las canceló, el seed las devuelve a Sala 2 / Alex Rivas y Sala 3 / Ámbar Soto. También repone la inscripción de Nadia si se dio de baja.

> **El inscripto es Nadia (`pilates.demo@`), no `cliente@`** — a propósito. `cliente@` es quien usa "Mis reservas" en la HU 19, y estos turnos le aparecían ahí mezclados con los de cancelar turno: ya pasó que se cancelaran sin querer y la HU 16 se quedara sin clientes a los que avisar.

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

> 🔁 **Para repetir:** volvé a correr el seed. Desde el 15/07 **reactiva** las actividades demo que hayan quedado canceladas, en vez de saltearlas. Antes había que borrarlas a mano — y como el seed creaba una nueva en lugar de reutilizar la vieja, cada ciclo dejaba una fila muerta: así se acumularon las 8 "Pilates" y las "Yoga" repetidas que arrastra la base.

---

## HU 18 — Renunciar a Actividad (Profesor)

**Flujo:** entrar como el profesor → **Mis actividades** → **Renunciar** → modal **"Confirmar renuncia"** → **Sí, renunciar**.
**Ref. código:** [MisActividades.jsx:155](frontend/src/pages/kinesiologist/actividades/MisActividades.jsx#L155) · [servicio_actividades.py:550](backend/app/services/servicio_actividades.py#L550) (`renunciar_actividad`) · [notifications.py:967](backend/app/utils/notifications.py#L967).

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Baja exitosa | **`profe@gmail.com`** / `Profesor123` (Ariel Gómez). Actividad fija **"Tren superior"** — la de **Lunes · 09:00–10:00** del **10/08/2026** (Sala 5, Osteopatía) | Mis actividades → **Renunciar** en "Tren superior" → **Sí, renunciar** | Renuncia y muestra **`Renunciaste a la actividad "Tren superior" correctamente.`** ✅ *literal* · La actividad **queda sin profesor** (`professor = None`, [servicio_actividades.py:600](backend/app/services/servicio_actividades.py#L600)) → el cupo de profesor queda libre · Se **avisa al admin**: `Renuncia de profesor: Tren superior` / `El profesor Ariel Gómez renunció a 'Tren superior' programada para Lunes 2026-08-10 · 09:00–10:00.` |

**Ojo con los dos "Tren superior":** el de esta HU es el de **Ariel Gómez / Lunes 09:00 / Sala 5**. El otro (Ámbar → Pablo, Jueves 13:00, Sala 3) es de la **HU 16 E2** — son actividades separadas **a propósito**, para que las dos HUs no se pisen y puedas demostrarlas **en cualquier orden**.

> 🔁 **Para repetir:** hay dos formas. La rápida en vivo: después de renunciar, la actividad queda libre y aparece en su sección **"Actividades que podés asumir"** (verificado el 15/07 con el ciclo completo renunciar → asumir), así que Ariel puede **volver a asumirla** ahí mismo — y de paso demostrás la HU 5. La otra: volver a correr el seed, que le devuelve el profesor.

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

## HU 20 — Ver planes y abonos (Cliente)

**Flujo:** entrar como cliente → menú **Suscripciones** (`/cliente/suscripciones`).
**Ref. código:** [MisSuscripciones.jsx](frontend/src/pages/client/pagos/MisSuscripciones.jsx) · [servicio_pagos.py:106](backend/app/services/servicio_pagos.py#L106) (`get_my_plans`) · [rutas_pagos.py:46](backend/app/routes/rutas_pagos.py#L46) (`/my-plan`).

La pantalla tiene **siempre las mismas 3 secciones, en este orden**: **"Adquirir un plan"** ([:332](frontend/src/pages/client/pagos/MisSuscripciones.jsx#L332)) → **"Mi abono"** ([:383](frontend/src/pages/client/pagos/MisSuscripciones.jsx#L383)) → **"Mis suscripciones"** ([:415](frontend/src/pages/client/pagos/MisSuscripciones.jsx#L415)). Lo que cambia entre escenarios es **qué dice cada una**. Los 4 escenarios son **solo de lectura**: no consumen ni ensucian datos, se pueden mostrar en cualquier orden y repetir.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Visualización **con** suscripciones | **`abonado@`** (Ana) — token **Fisioterapia sin usar** + apto aprobado + **1 crédito** | Login → **Suscripciones** | **"Adquirir un plan"**: la tarjeta **Mensual · $20.000**. · **"Mi abono"**: badge **"Abonado activo"** + **"🎫 Créditos disponibles este mes: 1 / 3"**. · **"Mis suscripciones"**: fila **`Mensual · Fisioterapia`** con estado **"Sin usar"** y el detalle **"Sin usar · podés anotarte a 4 clases fijas de esta especialidad"**. |
| E2 | Visualización **sin** suscripciones | **`cliente@`** (Carlos) — **ninguna** suscripción + apto aprobado | Login → **Suscripciones** | **"Adquirir un plan"**: la tarjeta Mensual con el botón **Suscribirse** habilitado. · **"Mi abono"**: **"Todavía no sos abonado. Suscribite a un plan para acceder a beneficios de abonado, descuentos y reservas prioritarias."** ✅ *literal* · **"Mis suscripciones"**: **"Todavía no tenés ninguna suscripción. Elegí un plan más arriba para empezar."** ✅ *literal* |
| E3 | Visualización **sin apto físico** | **`pepe.sinapto@`** (Pepe) — apto **pendiente** | Login → **Suscripciones** | En **"Adquirir un plan"**, cartel amarillo: **"No podés suscribirte a ningún plan hasta que tu apto físico esté aprobado. Subilo desde tu perfil y esperá la aprobación del administrador."** ✅ *literal* · El botón **Suscribirse** queda **deshabilitado** (gris, tooltip *"Necesitás tu apto físico aprobado para suscribirte"*). |
| E4 | Visualización **con descuento** | **`abonado@`** — **después de correr la HU 19 E2** (ver nota) | HU 19 E2 → volver a **Suscripciones** | **"Mi abono"**: badge "Abonado activo" + los créditos + cartel verde **"Tenés un 20% de descuento pendiente por una cancelación previa. Se aplicará automáticamente en tu próxima compra de suscripción."** · Las otras dos secciones, igual que en E1. |

### Notas de la HU 20

- **E4 depende de la HU 19: el seed deja el descuento en 0 a propósito.** No hay ningún dato "descuento pendiente" sembrado — el seed lo resetea en cada corrida ([seed_mock.py](backend/database/seed_mock.py), bloque de Cancelar turno) para que los escenarios E2/E3/E4 de la HU 19 den los porcentajes correctos. **Para demostrar E4 hay que cancelar antes un turno de la franja 24-48 h** (HU 19 E2 → 20%, o E3 → 30%). Si hacés **HU 19 E4**, el descuento vuelve a **0** y E4 de esta HU deja de verse.
- **"Mi abono" solo muestra el descuento si el cliente es abonado** ([:389](frontend/src/pages/client/pagos/MisSuscripciones.jsx#L389)) — coincide con el "Dado una cuenta abonada" de la HU.
- **El descuento tiene dos motivos posibles** y la pantalla los distingue ([:37](frontend/src/pages/client/pagos/MisSuscripciones.jsx#L37)): *"por una cancelación previa"* (el de esta HU) o *"porque tu plan anterior cubrió un mes con menos clases"*. La HU solo contempla el primero.
- **"El estado de uso y el historial" de E1 se ven mejor encadenando con la HU 9 E1:** después de que Ana gaste el token, la fila pasa a **"Usada"** y muestra **"Ya la usaste · te anotó a 4 clases fijas"** + las 4 fechas concretas. Ese es el *historial*. Volvé a correr el seed para dejarla otra vez en "Sin usar".
- **No hay estado "Vencida":** los tokens **no vencen** ([subscriptions.py:3](backend/app/utils/subscriptions.py#L3)). Los estados posibles son **Sin usar / Usada / Cancelada**.
- La HU escribe *"Mis sucripciones"* (sin la `s`); la pantalla dice **"Mis suscripciones"**. Es un typo de la HU, no del sistema.

---

## HU 21 — Adquirir plan (Cliente)

**Flujo:** **Suscripciones** → **Suscribirse** en la tarjeta del plan → en el modal, elegir **Especialidad** → **Pagar** → simulador de Mercado Pago.
**Ref. código:** [MisSuscripciones.jsx:446](frontend/src/pages/client/pagos/MisSuscripciones.jsx#L446) (modal) · [servicio_pagos.py:157](backend/app/services/servicio_pagos.py#L157) (`simulate_mercadopago_payment`).

**Cómo se simula el pago (no hace falta Mercado Pago real):** al presionar **Pagar** aparece el overlay **"Esperando pago… Completá el pago en la ventana de Mercado Pago que se abrió."** y se abre la ventana [/pago/mercadopago](frontend/src/pages/pago/PagoMercadoPago.jsx) con *"Elegí un escenario para simular"* → **"✅ Pago exitoso"** / **"❌ Fondos insuficientes"**. *(Habilitar ventanas emergentes.)*

**Regla de negocio (verificada):** **20% de descuento para clientes de 65 años o más** ([subscriptions.py:33](backend/app/utils/subscriptions.py#L33)). Los descuentos **no se acumulan**: se aplica **el mayor** entre el de edad y el pendiente por cancelación ([servicio_pagos.py:196](backend/app/services/servicio_pagos.py#L196)). Si gana el de edad, el pendiente por cancelación **no se consume** y le queda para la próxima.

| # | Escenario | Datos a usar | Pasos | Resultado esperado |
|---|-----------|--------------|-------|--------------------|
| E1 | Adquisición exitosa | **`cliente@`** (sin suscripciones ni descuentos) | Suscripciones → **Suscribirse** → Especialidad **Kinesiologia deportiva** → **Pagar** → (overlay) → **✅ Pago exitoso** | **"Pago aprobado. Te suscribiste al plan 'Mensual' en Kinesiologia deportiva."** ✅ *literal, verificado* · **Inbox:** `Suscripción confirmada: Mensual` + mail. |
| E2 | Adquisición exitosa **con descuento por cancelación** | **`abonado@`** — **correr antes la HU 19 E2** (deja 20% pendiente) | Suscripciones → **Suscribirse** → **Kinesiologia deportiva** → **Pagar** → **✅ Pago exitoso** | El modal muestra **~~$20.000~~ $16.000** y el cartel del descuento. Al confirmar: **"Pago aprobado. Te suscribiste al plan 'Mensual' en Kinesiologia deportiva. Se aplicó un 20% de descuento por cancelación previa (pagaste $16000.00 en lugar de $20000.00)."** ✅ *verificado* · El descuento pendiente **se consume** (vuelve a 0). |
| E3 | Adquisición **fallida** por error en el pago | `cliente@` (o cualquiera), simulador **❌ Fondos insuficientes** | **Suscribirse** → cualquier especialidad → **Pagar** → (overlay) → **❌ Fondos insuficientes** | **"Hubo un error al completar el pago. Intentalo nuevamente."** ✅ *literal* · **No** se crea la suscripción. |
| E4 | Adquisición exitosa **con descuento por edad** | **`juan.mayor@`** (Juan, **75 años**) | Suscripciones → **Suscribirse** → Especialidad **Masoterapia** → **Pagar** → **✅ Pago exitoso** | Antes de pagar, en "Adquirir un plan": **"🎉 Por tener 65 años o más, tenés un 20% de descuento…"**. Al confirmar: **"Pago aprobado. Te suscribiste al plan 'Mensual' en Masoterapia. Se aplicó un 20% de descuento por ser adulto mayor (65 años o más) (pagaste $16000.00 en lugar de $20000.00)."** ✅ *verificado* — ver nota, **el texto de la HU E4 está mal copiado**. |
| E5 | Adquisición **fallida** por falta de apto físico | **`pepe.sinapto@`** (Pepe) | Login → **Suscripciones** | **"No podés suscribirte a ningún plan hasta que tu apto físico esté aprobado. Subilo desde tu perfil y esperá la aprobación del administrador."** ✅ *literal* · El botón **Suscribirse** está **deshabilitado**: no se llega ni al pago. *(Es el mismo escenario que la HU 20 E3.)* |

### Notas de la HU 21

- **El texto esperado de E4 en la HU está mal copiado.** Dice *"…en Kinesiologia deportiva. Se aplicó un 20% de descuento **por cancelación previa**"*, pero el escenario es **Masoterapia** y el descuento es **por edad**. Es un copy-paste de E2. El texto de la tabla es el que devuelve el sistema, y es el correcto.
- **E1 escribe el plan sin comillas** (*"al plan Mensual"*) pero **E2 y E4 lo escriben con comillas** (*"al plan 'Mensual'"*). El sistema usa **comillas** siempre, así que coincide con E2/E4.
- **El paréntesis con los montos** (*"(pagaste $16000.00 en lugar de $20000.00)"*) es un agregado del sistema que la HU no menciona. **Lo dejamos a propósito**: no contradice a la HU y hace verificable el descuento en vivo.
- **E3 dice "el sistema realiza el descuento"** en un escenario de **fallo**. No tiene sentido y es otro arrastre de E2: si el pago falla, no se descuenta ni se crea nada.
- **La especialidad se escribe sin tilde** en todo el sistema (**"Kinesiologia deportiva"**), porque así está el catálogo ([MisSuscripciones.jsx:11](frontend/src/pages/client/pagos/MisSuscripciones.jsx#L11)). La HU la escribe con tilde. Es **dato**, no texto fijo.
- **No se puede comprar dos veces la misma especialidad sin usar la primera:** el sistema responde **"Ya tenés una suscripción sin usar en la especialidad 'X'. Usala antes de comprar otra."** ([servicio_pagos.py:182](backend/app/services/servicio_pagos.py#L182)). Por eso E1 y E2 usan **clientes distintos** y ambos compran *Kinesiologia deportiva*.
- 🔁 **Para repetir:** volvé a correr el seed. Desde el 16/07 **borra las suscripciones que las demos anteriores dejaron** y devuelve a cada cliente a su estado inicial (`SUSCRIPCIONES_DEMO` en [seed_mock.py](backend/database/seed_mock.py)).

---

## 🔧 Cambios de código del 16/07 (resumen)

| Archivo | Cambio | Por qué |
|---|---|---|
| [InscribirActividad.jsx:838](frontend/src/pages/client/reservas/InscribirActividad.jsx#L838) | `Agregado a la lista de espera` → **`Agregado a la lista de espera.`** | Faltaba el punto que pide la HU 9 E4/E5. |
| [OverlayEsperandoPago.jsx:36](frontend/src/components/OverlayEsperandoPago.jsx#L36) | `Esperando pago...` → **`Esperando pago…`** | La HU usa el carácter de elipsis. Afecta a las HU 9, 10 y 21. |
| [servicio_reservas.py:653](backend/app/services/servicio_reservas.py#L653) | `age > 65` → **`get_age_discount_percent(user) > 0`** (65 o más) | **Bug real:** la regla de los 65 estaba implementada **dos veces y distinto** — `>= 65` al comprar un plan y `> 65` al inscribirse. Un cliente de **exactamente 65** tenía descuento en una pantalla y no en la otra. |
| [seed_mock.py](backend/database/seed_mock.py) | Plan **"Plan Mensual" → "Mensual"** (renombra la fila, no crea otra) | El mensaje de la HU 21 es literal *"al plan 'Mensual'"*; con el nombre viejo decía *"al plan 'Plan Mensual'"*. Se renombra la fila para no dejar colgadas las suscripciones ya compradas. |
| [seed_mock.py](backend/database/seed_mock.py) | **Lotes de 4 clases** (`Rehabilitar Codo`, `Rehabilitar tobillo`) + clientes Diego/Juan/Pepe + normalización de suscripciones | Sin esto la HU 9 E1 **no se podía reproducir** (la fija era una sola fila sin fecha, así que nunca anotaba al mes) y E4 no tenía actividad. |
| [servicio_reservas.py:165](backend/app/services/servicio_reservas.py#L165) | Descuento por mes corto: `clases_del_mes != 2` → **`> 2`** (o sea, **2 o menos**) | **Bug real:** solo compensaba el mes de **exactamente 2** clases. Un mes con **1** clase daba **0%** — y es el caso en que el cliente **menos** recibió por lo que pagó. Pasa cuando gasta el token sobre el final del mes: solo se cuentan las clases **futuras**. |
| [servicio_reservas.py:174](backend/app/services/servicio_reservas.py#L174) | Devuelve **0** (antes: el descuento que ya tenía) cuando no otorga nada nuevo | **Aviso engañoso:** si el cliente ya tenía un 30% por cancelación, el mail/inbox le decía *"Como este mes tenía menos clases de las que cubre tu plan, te otorgamos un 30% de descuento"* — un descuento que ni era nuevo ni era por mes corto (el motivo guardado seguía siendo `cancelacion`). El descuento que tiene el cliente **no cambia**: se sigue respetando el mayor. |

**Lo que NO se cambió, y por qué:**
- **El asunto del mail** de la inscripción por suscripción dice `Inscripción confirmada: Rehabilitar Codo (4 clases de agosto)` ([notifications.py:681](backend/app/utils/notifications.py#L681)). La HU fija el texto de **la notificación al usuario**, y esa —la del inbox— dice exactamente **`Inscripción confirmada: Rehabilitar Codo`** ([notifications.py:724](backend/app/utils/notifications.py#L724)). El asunto del mail agrega contexto útil y la HU no lo especifica.
- **El botón "Esperar en la lista" para no abonados** (HU 9 E5) — ver el desvío documentado en la HU 9.

---
