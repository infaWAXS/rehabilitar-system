import random
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.plan import Plan
from app.models.room import Room
from app.models.activity import Activity
from app.models.attendance import Attendance
# 🚨 Agregamos los modelos de Reservas y Transacciones
from app.models.reservation import Reservation
from app.models.credit_transaction import CreditTransaction

def seed_estadisticas(db: Session):
    print("⏳ Iniciando carga de datos de Testing (Clases, Reservas, Pagos y Asistencias)...")

    # ──────────────────────────────────────────────────────────────────────────
    # 1. PLANES BASE Y CLIENTES
    # ──────────────────────────────────────────────────────────────────────────
    planes_nombres = ["Plan Básico", "Plan Premium", "Pase Libre"]
    for nombre in planes_nombres:
        if not db.query(Plan).filter(Plan.name == nombre).first():
            nuevo_plan = Plan(name=nombre, description="Descripción", price=20000.00, duration_days=30, coverage_type="estándar", status="active")
            db.add(nuevo_plan)
    db.commit()

    clientes_creados = []
    for i in range(1, 20): 
        email_random = f"alumno{i}@rehabilitar.com"
        usuario_existente = db.query(User).filter(User.email == email_random).first()
        if not usuario_existente:
            nuevo_usuario = User(
                name="Alumno", 
                lastname=f"Test_{i}", 
                email=email_random, 
                password="pwd",
                role="client", 
                account_status="active", 
                created_at=datetime(2026, 1, 1, 10, 0),
                birth_date=date(1990, 1, 1) 
            )
            db.add(nuevo_usuario)
            clientes_creados.append(nuevo_usuario)
        else:
            clientes_creados.append(usuario_existente)
    db.commit()

    # ──────────────────────────────────────────────────────────────────────────
    # 2. CREACIÓN DE PROFESORES COMO USUARIOS
    # ──────────────────────────────────────────────────────────────────────────
    profesores_data = [
        {"name": "Carlos", "lastname": "Gómez"},
        {"name": "María", "lastname": "Rodríguez"},
        {"name": "Leyma", "lastname": ""} 
    ]
    
    for p_data in profesores_data:
        email_profe = f"{p_data['name'].lower()}@profe.com"
        if not db.query(User).filter(User.email == email_profe).first():
            nuevo_profe = User(
                name=p_data['name'], 
                lastname=p_data['lastname'], 
                email=email_profe, 
                password="pwd",
                role="professor", 
                account_status="active", 
                created_at=datetime(2025, 12, 1),
                birth_date=date(1985, 5, 5) 
            )
            db.add(nuevo_profe)
    db.commit()

    # ──────────────────────────────────────────────────────────────────────────
    # 3. VERIFICACIÓN DE SALAS
    # ──────────────────────────────────────────────────────────────────────────
    salas = db.query(Room).all()
    if not salas:
        db.add_all([
            Room(name="Sala 1", capacity=15, equipment="Básico", status="active"),
            Room(name="Sala 4", capacity=10, equipment="Especial", status="active")
        ])
        db.commit()
        salas = db.query(Room).all()

    sala_1 = next((s for s in salas if "1" in s.name or "1" in str(s.id)), salas[0])
    sala_4 = next((s for s in salas if "4" in s.name or "4" in str(s.id)), salas[-1])

    # ──────────────────────────────────────────────────────────────────────────
    # 4. INYECCIÓN DE CLASES (CON RESERVAS Y TRANSACCIONES)
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ Generando transacciones financieras y reservas...")

    clases_test = [
        {"fecha": date(2026, 1, 5), "nombre": "Yoga", "hora": "08:00", "sala": sala_4, "profe": "Carlos Gómez", "capacidad": 6, "presentes": 2, "ausentes": 1, "precio": 3000.00, "esp": "Tren Medio"},
        {"fecha": date(2026, 1, 20), "nombre": "Hip Trass", "hora": "10:00", "sala": sala_1, "profe": "María Rodríguez", "capacidad": 9, "presentes": 3, "ausentes": 2, "precio": 3500.00, "esp": "Tren Inferior"},
        {"fecha": date(2026, 1, 22), "nombre": "twrk", "hora": "12:00", "sala": sala_1, "profe": "Leyma", "capacidad": 9, "presentes": 2, "ausentes": 0, "precio": 3000.00, "esp": "Tren Inferior"},
        {"fecha": date(2026, 1, 29), "nombre": "perreo", "hora": "12:00", "sala": sala_1, "profe": "Leyma", "capacidad": 9, "presentes": 1, "ausentes": 2, "precio": 3000.00, "esp": "Tren Inferior"},
        {"fecha": date(2026, 1, 15), "nombre": "Pilates Clínico", "hora": "18:00", "sala": sala_4, "profe": "Carlos Gómez", "capacidad": 8, "presentes": 4, "ausentes": 3, "precio": 6500.00, "esp": "Tren Superior"}
    ]

    for c in clases_test:
        # 1. Crear la Actividad
        nueva_act_test = Activity(
            room_id=c["sala"].id,
            name=c["nombre"],
            specialization=c["esp"],
            activity_type="individual", 
            specific_date=c["fecha"],
            time_slot=c["hora"],
            professor=c["profe"],
            price=c["precio"], 
            capacity=c["capacidad"],
            status="active"
        )
        db.add(nueva_act_test)
        db.flush() 

        total_anotados = c["presentes"] + c["ausentes"]
        alumnos_disponibles = [u for u in clientes_creados if u.created_at.date() <= c["fecha"]]
        
        if total_anotados > len(alumnos_disponibles):
            alumnos_anotados = alumnos_disponibles
        else:
            alumnos_anotados = random.sample(alumnos_disponibles, total_anotados)

        hora_int = int(c["hora"].split(":")[0])
        fecha_dt = datetime.combine(c["fecha"], datetime.min.time()) + timedelta(hours=hora_int)

        for index, alumno in enumerate(alumnos_anotados):
            estado_asistencia = "present" if index < c["presentes"] else "absent"
            
            # Simulamos que la reserva y el pago se hicieron de 1 a 3 días antes de la clase
            fecha_reserva_pago = fecha_dt - timedelta(days=random.randint(1, 3))
            
           # 2. Registrar la Reserva (Reservation)
            nueva_reserva = Reservation(
                user_id=alumno.id,
                activity_id=nueva_act_test.id,
                reservation_type="individual",  # <-- FIX 1: Campo obligatorio en BD
                reservation_date=c["fecha"],    # <-- FIX 2: Agregado por seguridad (suele ser obligatorio)
                status="confirmed",
                payment_status="paid",          # <-- Opcional: lo marcamos pagado de una vez
                created_at=fecha_reserva_pago
            )
            db.add(nueva_reserva)
            db.flush() # Obtenemos el ID de la reserva para enlazarla al pago
            
            # 3. Registrar la Transacción Financiera (CreditTransaction)
            nueva_transaccion = CreditTransaction(
                user_id=alumno.id,
                amount=c["precio"], # Valor facturado por la clase individual
                activity_type="class_reservation", 
                reservation_id=nueva_reserva.id,
                reason=f"Pago por reserva de clase individual: {c['nombre']}",
                created_at=fecha_reserva_pago
            )
            db.add(nueva_transaccion)

            # 4. Registrar la Asistencia (Attendance)
            nueva_asistencia_test = Attendance(
                user_id=alumno.id,
                activity_id=nueva_act_test.id,
                status=estado_asistencia, 
                timestamp=fecha_dt
            )
            db.add(nueva_asistencia_test)
            
    db.commit()
    print("✅ Seed finalizado. Reservas y transacciones cargadas a la base de datos correctamente.")