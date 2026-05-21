# RehabilitAR System

Proyecto de Ingenieria de Software 2 para gestion de un centro de kinesiologia.

# Rama para testear front/back antes de mandar a develop.

## Objetivo del sprint actual

- Implementar HU del Sprint 1 priorizando funcionalidad, flujo completo y bajo costo de infraestructura.
- Mantener una portada publica comun para todos los usuarios.
- Habilitar funciones extra por rol una vez autenticado.

## Stack actual

- Frontend: React (react-scripts) + React Router.
- Backend: FastAPI + SQLAlchemy.
- Base de datos: definida en backend/database/connection.py.

## Estructura actual del repositorio

```text
rehabilitar-system/
├─ backend/
│  ├─ main.py
│  ├─ requirements.txt
│  ├─ app/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ exceptions/
│  │  ├─ middlewares/
│  │  ├─ models/
│  │  ├─ repositories/
│  │  ├─ routes/
│  │  ├─ schemas/
│  │  ├─ services/
│  │  ├─ utils/
│  │  └─ validators/
│  └─ database/
│     ├─ connection.py
│     └─ migrations/
├─ frontend/
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ public/
│  └─ src/
│     ├─ App.jsx
│     ├─ assets/
│     ├─ componentes/
│     │  └─ comun/
│     ├─ layouts/
│     ├─ pages/
│     │  ├─ public/
│     │  ├─ admin/
│     │  ├─ client/
│     │  ├─ kinesiologist/
│     │  └─ receptionist/
│     ├─ services/
│     └─ index.jsx
├─ docs/
├─ scripts/
├─ tests/
├─ HU-Todas-las-Epicas.md
├─ Tareas-miembros.md
└─ README.md
```

## Arranque rapido

### Requisitos previos
- Python 3.11+ instalado.
- Node.js instalado.
- Estar en la raíz del repositorio.

### Preparación inicial (una sola vez)
Desde la raíz del proyecto:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
cd frontend
npm install
cd ..
```

### Activar el entorno virtual
Si querés trabajar dentro del entorno virtual en PowerShell, desde la raíz del proyecto usa:

```powershell
.\.venv\Scripts\Activate
pip install fastapi uvicorn sqlalchemy pydantic email-validator bcrypt
Ruta: http://127.0.0.1:8000/docs
```

Para salir del entorno virtual, ejecuta:

```powershell
deactivate
```

### Iniciar el backend
Desde la raíz del proyecto:

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Iniciar el frontend
Desde la raíz del proyecto: (Abrir otra terminal)

```powershell
cd frontend
npm start
```

## Documentacion del sprint

- Tareas por integrante (front + back + rutas): Tareas-miembros.md.
- Trazabilidad de HU Sprint 1 (escenario, rutas, archivos): DOCUMENTACION-SPRINT1.md.
- Listado completo de epicas/HU: HU-Todas-las-Epicas.md.

## Estructura de trabajo por integrante

- Frontend centralizado en `frontend/src/services/`:
	- `authService.js`, `usersService.js` (Francis)
	- `clientsService.js` (Nahuel)
	- `activitiesService.js` (Angel)
	- `reservationsService.js`, `waitlistService.js` (Agustin)
	- `attendanceService.js`, `paymentsService.js` (Ezequiel)
	- `apiClient.js` contiene la configuracion comun de llamadas HTTP.

- Backend modular en `backend/app/routes/` y `backend/app/services/`:
	- auth/usuarios: `rutas_autenticacion.py`, `rutas_usuarios.py`, `servicio_usuarios.py`
	- clientes: `rutas_clientes.py`, `servicio_clientes.py`
	- actividades: `rutas_actividades.py`, `servicio_actividades.py`
	- reservas/lista espera: `rutas_reservas.py`, `rutas_lista_espera.py`, `servicio_reservas.py`, `servicio_lista_espera.py`
	- asistencias/pagos: `rutas_asistencias.py`, `rutas_pagos.py`, `servicio_asistencias.py`, `servicio_pagos.py`

