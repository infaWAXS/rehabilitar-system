# RehabilitAR System

Proyecto de Ingenieria de Software 2 para gestion de un centro de kinesiologia.

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

### Frontend

```powershell
cd frontend
npm install
npm start
```

### Backend

```powershell
cd backend
..\.venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Levantar ambos desde raiz (PowerShell)

```powershell
Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location "C:\UNLP\2026 PRIMER SEMESTRE\ING2\rehabilitar-system\frontend"; npm start'; Set-Location "C:\UNLP\2026 PRIMER SEMESTRE\ING2\rehabilitar-system\backend"; ..\.venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
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
	- auth/usuarios: `authRoutes.py`, `userRoutes.py`, `user_service.py`
	- clientes: `clientRoutes.py`, `client_service.py`
	- actividades: `activityRoutes.py`, `activity_service.py`
	- reservas/lista espera: `reservationRoutes.py`, `waitlistRoutes.py`, `reservation_service.py`, `waitlist_service.py`
	- asistencias/pagos: `attendanceRoutes.py`, `paymentRoutes.py`, `attendance_service.py`, `payment_service.py`

