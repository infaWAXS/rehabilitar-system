import random
from datetime import date, datetime, timedelta
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.plan import Plan
from app.models.room import Room
from app.models.activity import Activity
from app.models.attendance import Attendance
from app.models.reservation import Reservation
from app.models.credit_transaction import CreditTransaction

def seed_estadisticas(db: Session):
    print("⏳ Iniciando carga de datos de Testing (Clases, Reservas, Pagos, Auditoría y Asistencias)...")

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
    # 2. CREACIÓN DE PROFESORES COMO USUARIOS (CON ESPECIALIDAD)
    # ──────────────────────────────────────────────────────────────────────────
    profesores_data = [
        {"name": "Carlos", "lastname": "Gómez", "esp": "Tren Superior"},
        {"name": "María", "lastname": "Rodríguez", "esp": "Tren Inferior"},
        {"name": "Leyma", "lastname": "Sosa", "esp": "Tren Medio"} 
    ]
    
    for p_data in profesores_data:
        email_profe = f"{p_data['name'].lower().replace('í', 'i')}@profe.com"
        if not db.query(User).filter(User.email == email_profe).first():
            nuevo_profe = User(
                name=p_data['name'], 
                lastname=p_data['lastname'], 
                email=email_profe, 
                password="pwd",
                role="professor", 
                specialization=p_data['esp'],
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
    # 4. INYECCIÓN DE CLASES INDIVIDUALES CRUZADAS CON ESPECIALIDAD
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ Generando transacciones financieras y reservas...")

    clases_test = [
        {"fecha": date(2026, 1, 5), "nombre": "Yoga", "hora": "08:00", "sala": sala_4, "profe": "Leyma Sosa", "capacidad": 6, "presentes": 2, "ausentes": 1, "precio": 3000.00, "esp": "Tren Medio"},
        {"fecha": date(2026, 1, 20), "nombre": "Hip Trass", "hora": "10:00", "sala": sala_1, "profe": "María Rodríguez", "capacidad": 9, "presentes": 3, "ausentes": 2, "precio": 3500.00, "esp": "Tren Inferior"},
        {"fecha": date(2026, 1, 22), "nombre": "twrk", "hora": "12:00", "sala": sala_1, "profe": "María Rodríguez", "capacidad": 9, "presentes": 2, "ausentes": 0, "precio": 3000.00, "esp": "Tren Inferior"},
        {"fecha": date(2026, 1, 29), "nombre": "perreo", "hora": "12:00", "sala": sala_1, "profe": "María Rodríguez", "capacidad": 9, "presentes": 1, "ausentes": 2, "precio": 3000.00, "esp": "Tren Inferior"},
        {"fecha": date(2026, 1, 15), "nombre": "Pilates Clínico", "hora": "18:00", "sala": sala_4, "profe": "Carlos Gómez", "capacidad": 8, "presentes": 4, "ausentes": 3, "precio": 6500.00, "esp": "Tren Superior"}
    ]

    for c in clases_test:
        nueva_act_test = Activity(
            room_id=c["sala"].id, name=c["nombre"], specialization=c["esp"], activity_type="individual", 
            specific_date=c["fecha"], time_slot=c["hora"], professor=c["profe"], price=c["precio"], 
            capacity=c["capacidad"], status="active"
        )
        db.add(nueva_act_test)
        db.flush() 

        total_anotados = c["presentes"] + c["ausentes"]
        alumnos_disponibles = [u for u in clientes_creados if u.created_at.date() <= c["fecha"]]
        alumnos_anotados = alumnos_disponibles if total_anotados > len(alumnos_disponibles) else random.sample(alumnos_disponibles, total_anotados)

        hora_int = int(c["hora"].split(":")[0])
        fecha_dt = datetime.combine(c["fecha"], datetime.min.time()) + timedelta(hours=hora_int)

        for index, alumno in enumerate(alumnos_anotados):
            estado_asistencia = "present" if index < c["presentes"] else "absent"
            fecha_reserva_pago = fecha_dt - timedelta(days=random.randint(1, 3))
            
            nueva_reserva = Reservation(
                user_id=alumno.id, activity_id=nueva_act_test.id, reservation_type="individual",
                reservation_date=c["fecha"], status="confirmed", payment_status="paid", created_at=fecha_reserva_pago
            )
            db.add(nueva_reserva)
            db.flush() 
            
            nueva_transaccion = CreditTransaction(
                user_id=alumno.id, amount=c["precio"], activity_type="class_reservation", 
                reservation_id=nueva_reserva.id, reason=f"Pago por reserva de clase individual: {c['nombre']}",
                created_at=fecha_reserva_pago
            )
            db.add(nueva_transaccion)

            db.add(Attendance(user_id=alumno.id, activity_id=nueva_act_test.id, status=estado_asistencia, timestamp=fecha_dt))
            
    db.commit()

    # ──────────────────────────────────────────────────────────────────────────
    # 5. 3 CLASES FIJAS DISTINTAS (REQUISITO PARA RETENCIÓN)
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ Generando 3 clases fijas distintas para gráfico de retención...")
    fechas_febrero = [date(2026, 2, 2), date(2026, 2, 9), date(2026, 2, 16)]
    
    for i, f in enumerate(fechas_febrero):
        # Creamos una actividad nueva y distinta para cada fecha
        act_fija = Activity(
            room_id=sala_1.id,
            name="Terapia Física Continua",
            specialization="Tren Superior",
            activity_type="fixed",
            specific_date=f, 
            schedule="Lunes", 
            time_slot="10:00",
            professor="Carlos Gómez",
            price=4000.00,
            capacity=10,
            status="active"
        )
        db.add(act_fija)
        db.flush()

        fecha_clase_dt = datetime.combine(f, datetime.min.time()) + timedelta(hours=10)
        alumnos_semana = clientes_creados[i*5 : (i+1)*5] 
        
        for index, alumno in enumerate(alumnos_semana):
            estado_asistencia = "present" if index < 4 else "absent"
            db.add(Attendance(
                user_id=alumno.id, 
                activity_id=act_fija.id, 
                status=estado_asistencia, 
                timestamp=fecha_clase_dt
            ))
    db.commit()

  # ──────────────────────────────────────────────────────────────────────────
    # 6. REGISTROS DE AUDITORÍA: ABSENTISMO DE STAFF (CON COLUMNA RESULT)
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ Generando bajas en el Staff (Absentismo)...")
    carlos = db.query(User).filter(User.name == "Carlos", User.role == "professor").first()
    maria = db.query(User).filter(User.name == "María", User.role == "professor").first()
    
    # --- ACTIVIDADES PARA CARLOS (AGOSTO) ---
    # 2 veces en la misma clase (mismo nombre, distinta fecha para simular sesiones)
    act_carlos_a1 = Activity(room_id=sala_1.id, name="Terapia Avanzada", specialization="Tren Superior", activity_type="individual", specific_date=date(2026, 8, 10), time_slot="09:00", professor=None, price=3000.0, capacity=10, status="active")
    act_carlos_a2 = Activity(room_id=sala_1.id, name="Terapia Avanzada", specialization="Tren Superior", activity_type="individual", specific_date=date(2026, 8, 17), time_slot="09:00", professor=None, price=3000.0, capacity=10, status="active")
    # 1 vez en otra clase distinta
    act_carlos_b = Activity(room_id=sala_4.id, name="Pilates Clínico Extra", specialization="Tren Superior", activity_type="individual", specific_date=date(2026, 8, 20), time_slot="10:00", professor=None, price=3500.0, capacity=10, status="active")
    
    # --- ACTIVIDAD PARA MARÍA (FEBRERO) ---
    act_maria_c = Activity(room_id=sala_4.id, name="Rehabilitación Inferior Ausente", specialization="Tren Inferior", activity_type="individual", specific_date=date(2026, 2, 15), time_slot="11:00", professor=None, price=3000.0, capacity=10, status="active")
    
    db.add_all([act_carlos_a1, act_carlos_a2, act_carlos_b, act_maria_c])
    db.flush()

    query_audit = text("""
        INSERT INTO audit_logs (user_id, action, type, result, detail, timestamp)
        VALUES (:user_id, :action, :type, :result, :detail, :timestamp)
    """)
    
    # ─────────────────────────────────────────────────────────
    # PROFESOR 1: CARLOS (3 Bajas en Agosto)
    # ─────────────────────────────────────────────────────────
    # Baja 1: Terapia Avanzada (Para la clase del 10 de Agosto)
    db.execute(query_audit, {
        "user_id": carlos.id, "action": "CLAIM_ACTIVITY", "type": "ACTIVITY", "result": "SUCCESS",
        "detail": f"Profesor Carlos Gómez asumió la actividad '{act_carlos_a1.name}' (id {act_carlos_a1.id})", 
        "timestamp": "2026-08-01 10:00:00"
    })
    db.execute(query_audit, {
        "user_id": carlos.id, "action": "RESIGN_ACTIVITY", "type": "ACTIVITY", "result": "SUCCESS",
        "detail": f"Profesor Carlos Gómez renunció a la actividad '{act_carlos_a1.name}' (id {act_carlos_a1.id})", 
        "timestamp": "2026-08-05 14:30:00" 
    })
    
    # Baja 2: Terapia Avanzada (Para la clase del 17 de Agosto) - 2da vez en misma clase
    db.execute(query_audit, {
        "user_id": carlos.id, "action": "CLAIM_ACTIVITY", "type": "ACTIVITY", "result": "SUCCESS",
        "detail": f"Profesor Carlos Gómez asumió la actividad '{act_carlos_a2.name}' (id {act_carlos_a2.id})", 
        "timestamp": "2026-08-01 10:05:00"
    })
    db.execute(query_audit, {
        "user_id": carlos.id, "action": "RESIGN_ACTIVITY", "type": "ACTIVITY", "result": "SUCCESS",
        "detail": f"Profesor Carlos Gómez renunció a la actividad '{act_carlos_a2.name}' (id {act_carlos_a2.id})", 
        "timestamp": "2026-08-12 09:15:00" 
    })

    # Baja 3: Pilates Clínico Extra (Para la clase del 20 de Agosto) - Otra clase
    db.execute(query_audit, {
        "user_id": carlos.id, "action": "CLAIM_ACTIVITY", "type": "ACTIVITY", "result": "SUCCESS",
        "detail": f"Profesor Carlos Gómez asumió la actividad '{act_carlos_b.name}' (id {act_carlos_b.id})", 
        "timestamp": "2026-08-02 11:00:00"
    })
    db.execute(query_audit, {
        "user_id": carlos.id, "action": "RESIGN_ACTIVITY", "type": "ACTIVITY", "result": "SUCCESS",
        "detail": f"Profesor Carlos Gómez renunció a la actividad '{act_carlos_b.name}' (id {act_carlos_b.id})", 
        "timestamp": "2026-08-18 16:00:00" 
    })

    # ─────────────────────────────────────────────────────────
    # PROFESOR 2: MARÍA (1 Baja en Febrero)
    # ─────────────────────────────────────────────────────────
    # Baja 1: Rehabilitación Inferior (Para la clase del 15 de Febrero)
    db.execute(query_audit, {
        "user_id": maria.id, "action": "CLAIM_ACTIVITY", "type": "ACTIVITY", "result": "SUCCESS",
        "detail": f"Profesor María Rodríguez asumió la actividad '{act_maria_c.name}' (id {act_maria_c.id})", 
        "timestamp": "2026-02-01 09:00:00"
    })
    db.execute(query_audit, {
        "user_id": maria.id, "action": "RESIGN_ACTIVITY", "type": "ACTIVITY", "result": "SUCCESS",
        "detail": f"Profesor María Rodríguez renunció a la actividad '{act_maria_c.name}' (id {act_maria_c.id})", 
        "timestamp": "2026-02-10 10:00:00" 
    })
    
    db.commit()
    print("✅ Seed finalizado. Reservas, transacciones y auditoría cargadas a la base de datos correctamente.")
