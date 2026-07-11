import random
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.plan import Plan
from app.models.user_plan import UserPlan
from app.models.room import Room
from app.models.activity import Activity
from app.models.attendance import Attendance

# 🚨 IMPORTANTE: Verificá que la ruta de importación coincida con tu estructura
from app.models.user_suspension import UserSuspension 

def seed_estadisticas(db: Session):
    print("⏳ Iniciando carga de datos estadísticos estacionales (Ene-Jun 2026)...")

    # 1. Asegurar que existan los Planes Base
    planes_nombres = ["Plan Básico", "Plan Premium", "Pase Libre"]
    for nombre in planes_nombres:
        existe = db.query(Plan).filter(Plan.name == nombre).first()
        if not existe:
            nuevo_plan = Plan(
                name=nombre,
                description=f"Descripción de {nombre}",
                price=random.choice([15000.00, 22000.00, 30000.00]),
                duration_days=30,
                coverage_type="Acceso estándar",
                status="active"
            )
            db.add(nuevo_plan)
    db.commit()
    planes = db.query(Plan).all()

    # Listas para generación de nombres
    nombres = ["Lucas", "Santiago", "Mateo", "Matias", "Nicolas", "Agustina", "Sofia", "Valentina", "Camila", "Martina"]
    apellidos = ["Garcia", "Rodriguez", "Lopez", "Fernandez", "Gomez", "Diaz", "Perez", "Romero", "Alvarez", "Sosa"]
    
    clientes_creados = []

    # 2. Distribución de Nuevos Registros según las reglas del negocio para 2026
    distribucion_usuarios = {
        1: 5,   # Enero: Pocos ingresos
        2: 25,  # Febrero: Explota de gente
        3: 12,  # Marzo: Se estabiliza
        4: 10,  # Abril: Se mantiene estable
        5: 11,  # Mayo: Se mantiene estable
        6: 9    # Junio: Se mantiene estable
    }

    alumno_idx = 0
    for mes, cant_usuarios in distribucion_usuarios.items():
        for _ in range(cant_usuarios):
            alumno_idx += 1
            dia_random = random.randint(1, 28)
            fecha_registro = datetime(2026, mes, dia_random, random.randint(9, 19), random.randint(0, 59))
            
            # 1 de cada 15 usuarios nace con la cuenta deshabilitada
            status_cuenta = "disabled" if alumno_idx % 15 == 0 else "active"
            email_random = f"alumno{alumno_idx}_{random.randint(100,999)}@rehabilitar.com"

            nuevo_usuario = User(
                name=random.choice(nombres),
                lastname=random.choice(apellidos),
                email=email_random,
                password="hashed_password_123",
                role="client",
                account_status=status_cuenta,
                birth_date=date(1996, 3, 15),
                created_at=fecha_registro
            )
            db.add(nuevo_usuario)
            clientes_creados.append(nuevo_usuario)
    db.commit()

    # =========================================================================
    # 2.5 GENERACIÓN DE HISTORIAL DE SUSPENSIONES Y REACTIVACIONES
    # =========================================================================
    print("⏳ Generando historial de suspensiones y reactivaciones...")
    
    razones_suspension = [
        "Inasistencia mayor al 50%", 
        "Acumulación de 3 faltas consecutivas", 
        "Falta de pago de arancel", 
        "Incumplimiento de normas del centro"
    ]
    
    razones_reintegro = [
        "Pago regularizado exitosamente", 
        "Alta médica presentada y aprobada", 
        "Reactivación manual por la administración",
        "Compromiso de asistencia firmado"
    ]

    for cliente in clientes_creados:
        # CASO A: Usuario actualmente deshabilitado -> Suspensión ACTIVA
        if cliente.account_status == "disabled":
            fecha_suspension = cliente.created_at + timedelta(days=random.randint(5, 15))
            
            suspension_activa = UserSuspension(
                user_id=cliente.id,
                suspension_date=fecha_suspension,
                suspension_reason=random.choice(razones_suspension),
                is_active=True,
                reinstatement_date=None,
                reinstatement_reason=None
            )
            db.add(suspension_activa)

        # CASO B: Usuario activo, pero con historial de suspensión (Muestra reducida)
        elif cliente.id % 8 == 0: 
            fecha_suspension = cliente.created_at + timedelta(days=random.randint(2, 10))
            duracion_sancion = random.randint(3, 20) 
            fecha_reintegro = fecha_suspension + timedelta(days=duracion_sancion)
            
            # Solo guardamos el historial si la fecha de reintegro es coherente (pasada)
            if fecha_reintegro < datetime(2026, 7, 1):
                suspension_pasada = UserSuspension(
                    user_id=cliente.id,
                    suspension_date=fecha_suspension,
                    suspension_reason=random.choice(razones_suspension),
                    is_active=False,
                    reinstatement_date=fecha_reintegro,
                    reinstatement_reason=random.choice(razones_reintegro)
                )
                db.add(suspension_pasada)
                
    db.commit()

    # 3. Asignar Suscripciones/Planes según el mes de registro
    for cliente in clientes_creados:
        if cliente.account_status == "active":
            fecha_inicio = cliente.created_at.date() + timedelta(days=random.randint(0, 2))
            fecha_fin = fecha_inicio + timedelta(days=30)
            
            plan_activo = UserPlan(
                user_id=cliente.id,
                plan_id=random.choice(planes).id,
                specialization=random.choice(["Tren Superior", "Tren Inferior", "Tren Medio"]),
                start_date=fecha_inicio,
                end_date=fecha_fin,
                status="active" if fecha_fin >= date.today() else "expired"
            )
            db.add(plan_activo)
    db.commit()

    # 4. Obtener salas de kinesiología existentes
    salas = db.query(Room).all()
    if not salas:
        print("⚠️ No hay salas creadas.")
        return

    # 5. Generar Actividades Históricas
    profesores_staff = ["Carlos Gómez", "María Rodríguez", "Juan Pérez", "Marcos Profesor"]
    especialidades_tren = ["Tren Superior", "Tren Inferior", "Tren Medio"]
    actividades_creadas = []

    distribucion_clases = {1: 6, 2: 15, 3: 12, 4: 12, 5: 12, 6: 12}

    act_idx = 0
    for mes, cant_clases in distribucion_clases.items():
        for _ in range(cant_clases):
            act_idx += 1
            dia_random = random.randint(1, 28)
            fecha_act = date(2026, mes, dia_random)
            
            nueva_actividad = Activity(
                room_id=random.choice(salas).id,
                name=f"Sesión Funcional M{act_idx}",
                specialization=random.choice(especialidades_tren),
                activity_type=random.choice(["fixed", "individual"]),
                specific_date=fecha_act,
                time_slot=random.choice(["09:00", "15:00", "19:00"]),
                professor=random.choice(profesores_staff),
                price=3000.00,
                capacity=random.choice([10, 12]),
                status="active"
            )
            db.add(nueva_actividad)
            actividades_creadas.append(nueva_actividad)
    db.commit()

    # 6. Generar Asistencias aplicando las Reglas de Concurrencia por Mes
    for actividad in actividades_creadas:
        mes_actual = actividad.specific_date.month
        
        if mes_actual == 1:
            pesos_asistencia = [40, 60]
            rango_anotados = (2, 4)
        elif mes_actual == 2:
            pesos_asistencia = [85, 15]
            rango_anotados = (7, 10)
        else:
            pesos_asistencia = [75, 25]
            rango_anotados = (5, 8)

        alumnos_disponibles = [u for u in clientes_creados if u.created_at.date() <= actividad.specific_date]
        if not alumnos_disponibles:
            continue

        cant_anotados = min(random.randint(*rango_anotados), len(alumnos_disponibles))
        alumnos_anotados = random.sample(alumnos_disponibles, cant_anotados)

        fecha_base_dt = datetime.combine(actividad.specific_date, datetime.min.time())

        for alumno in alumnos_anotados:
            estado_asistencia = random.choices(["present", "absent"], weights=pesos_asistencia)[0]

            nueva_asistencia = Attendance(
                user_id=alumno.id,
                activity_id=actividad.id,
                status=estado_asistencia,
                timestamp=fecha_base_dt + timedelta(hours=random.randint(9, 19))
            )
            db.add(nueva_asistencia)
            
    db.commit()
    print("✅ Carga masiva estacional completada. ¡Ya podés comparar los meses en el frontend!")