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
from app.models.waitlist import Waitlist # ◄── AGREGAMOS EL MODELO WAITLIST

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
        # 🚨 FIX: Capacidad colmada en Pilates Clínico (5 presentes + 3 ausentes = 8 de capacidad máxima)
        {"fecha": date(2026, 1, 15), "nombre": "Pilates Clínico", "hora": "18:00", "sala": sala_4, "profe": "Carlos Gómez", "capacidad": 8, "presentes": 5, "ausentes": 3, "precio": 6500.00, "esp": "Tren Superior"}
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

        # Matricular a los alumnos hasta llenar la capacidad
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
        
        # 🚨 NUEVO: Agregar alumnos sobrantes a la Lista de Espera de Pilates Clínico
        if c["nombre"] == "Pilates Clínico":
            alumnos_sobrantes = [u for u in alumnos_disponibles if u not in alumnos_anotados]
            if len(alumnos_sobrantes) >= 2:
                alumnos_espera = random.sample(alumnos_sobrantes, 2)
                for pos, alumno in enumerate(alumnos_espera):
                    db.add(Waitlist(
                        user_id=alumno.id,
                        activity_id=nueva_act_test.id,
                        status="waiting",
                        position=pos + 1
                    ))
            
    db.commit()

    # ──────────────────────────────────────────────────────────────────────────
    # 5. 3 CLASES FIJAS DISTINTAS (REQUISITO PARA RETENCIÓN)
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ Generando 3 clases fijas distintas para gráfico de retención...")
    fechas_febrero = [date(2026, 2, 2), date(2026, 2, 9), date(2026, 2, 16)]
    
    for i, f in enumerate(fechas_febrero):
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
    # ──────────────────────────────────────────────────────────────────────────
    # 4.5. NUEVA CLASE INDIVIDUAL REQUERIDA (Pilates Clínico - 06/05/2026)
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ Generando nueva clase de Pilates Clínico e inscripciones personalizadas...")
    
    # 1. Crear la actividad solicitada
    act_pilates_personalizada = Activity(
        room_id=sala_4.id,
        name="Pilates Clínico",
        specialization="Tren Superior",
        activity_type="individual",
        specific_date=date(2026, 5, 6),
        time_slot="10:00",
        professor="Carlos Gómez",
        price=10000.00, # 👈 Precio de la clase: $10.000
        capacity=8,
        status="active"
    )
    db.add(act_pilates_personalizada)
    db.flush() # Flush para obtener el ID asignado por la BD

    # 2. Tomar 2 clientes creados para matricularlos
    # Usamos clientes de la lista generada en la Sección 1
    cliente_1 = clientes_creados[0]
    cliente_2 = clientes_creados[1]

    # Datos de inscripción solicitados (fechas de reserva y pago)
    inscripciones = [
        {"cliente": cliente_1, "fecha_pago": datetime(2026, 5, 1, 14, 30)},   # Se inscribe el 01/05/2026
        {"cliente": cliente_2, "fecha_pago": datetime(2026, 4, 27, 11, 15)}   # Se inscribe el 27/04/2026
    ]

    fecha_clase_dt = datetime(2026, 5, 6, 10, 0) # 06/05/2026 a las 10:00 hs

    for insc in inscripciones:
        # A. Crear la reserva confirmada y paga
        nueva_reserva_esp = Reservation(
            user_id=insc["cliente"].id,
            activity_id=act_pilates_personalizada.id,
            reservation_type="individual",
            reservation_date=date(2026, 5, 6),
            status="confirmed",
            payment_status="paid",
            created_at=insc["fecha_pago"]
        )
        db.add(nueva_reserva_esp)
        db.flush()

        # B. Registrar la transacción financiera en la caja del establecimiento
        nueva_transaccion_esp = CreditTransaction(
            user_id=insc["cliente"].id,
            amount=10000.00,
            activity_type="class_reservation",
            reservation_id=nueva_reserva_esp.id,
            reason=f"Pago por reserva de clase individual: {act_pilates_personalizada.name}",
            created_at=insc["fecha_pago"]
        )
        db.add(nueva_transaccion_esp)

        # C. Generar la hoja de asistencia (en estado "present" por defecto)
        db.add(Attendance(
            user_id=insc["cliente"].id,
            activity_id=act_pilates_personalizada.id,
            status="present",
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
    act_carlos_a1 = Activity(room_id=sala_1.id, name="Terapia Avanzada", specialization="Tren Superior", activity_type="individual", specific_date=date(2026, 8, 10), time_slot="09:00", professor=None, price=3000.0, capacity=10, status="active")
    act_carlos_a2 = Activity(room_id=sala_1.id, name="Terapia Avanzada", specialization="Tren Superior", activity_type="individual", specific_date=date(2026, 8, 17), time_slot="09:00", professor=None, price=3000.0, capacity=10, status="active")
    act_carlos_b = Activity(room_id=sala_4.id, name="Pilates Clínico Extra", specialization="Tren Superior", activity_type="individual", specific_date=date(2026, 8, 20), time_slot="10:00", professor=None, price=3500.0, capacity=10, status="active")
    
    # --- ACTIVIDAD PARA MARÍA (FEBRERO) ---
    act_maria_c = Activity(room_id=sala_4.id, name="Rehabilitación Inferior Ausente", specialization="Tren Inferior", activity_type="individual", specific_date=date(2026, 2, 15), time_slot="11:00", professor=None, price=3000.0, capacity=10, status="active")
    
    db.add_all([act_carlos_a1, act_carlos_a2, act_carlos_b, act_maria_c])
    db.flush()

    query_audit = text("""
        INSERT INTO audit_logs (user_id, action, type, result, detail, timestamp)
        VALUES (:user_id, :action, :type, :result, :detail, :timestamp)
    """)
    
    # PROFESOR 1: CARLOS (3 Bajas en Agosto)
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

    # PROFESOR 2: MARÍA (1 Baja en Febrero)
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
    

    # ──────────────────────────────────────────────────────────────────────────
    # 7. INYECCIÓN DE CLASES FIJINI (IDs 19, 20 y 21) CON SUS MATRÍCULAS
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ Generando actividades FIJINI con sus respectivas inscripciones...")

    # Estructuramos la configuración tal cual se muestra en la base de datos
    datos_fijini = [
        {
            "id": 19,
            "fecha": date(2026, 7, 1),
            "cant_clientes": 5 # Inscribe 5 clientes para el 01/07
        },
        {
            "id": 20,
            "fecha": date(2026, 7, 8),
            "cant_clientes": 4 # Inscribe 4 clientes para el 08/07
        },
        {
            "id": 21,
            "fecha": date(2026, 7, 15),
            "cant_clientes": 3 # Inscribe 3 clientes para el 15/07
        }
    ]

    for item in datos_fijini:
        # Verificamos si la actividad ya fue inyectada para evitar duplicar IDs
        existe_act = db.query(Activity).filter(Activity.id == item["id"]).first()
        
        if not existe_act:
            nueva_act = Activity(
                id=item["id"], # Forzamos el ID canónico para asegurar consistencia
                room_id=sala_1.id,
                name="FIJINI",
                specialization="Kinesiologia neurologica",
                activity_type="fixed",
                schedule="Miércoles · 09:00–10:00",
                specific_date=item["fecha"],
                time_slot="09:00",
                professor="Maria Neurologia",
                price=5000.00, # Seteamos un precio base
                capacity=2,    # Capacidad original de la imagen
                status="active"
            )
            db.add(nueva_act)
            db.flush() # Guardamos para que el ID se asocie correctamente
            act_id = nueva_act.id
        else:
            act_id = existe_act.id

        # Tomamos una muestra aleatoria de alumnos de tu lista global para simular inscripciones
        alumnos_para_fijini = random.sample(clientes_creados, min(item["cant_clientes"], len(clientes_creados)))
        
        fecha_clase_dt = datetime.combine(item["fecha"], datetime.min.time()) + timedelta(hours=9)

        for index, alumno in enumerate(alumnos_para_fijini):
            # Fecha de compra/reserva simulada de 1 a 3 días antes de la clase
            fecha_pago = fecha_clase_dt - timedelta(days=random.randint(1, 3))
            
            # Repartimos asistencias presentes y ausentes para poblar los gráficos de Staff y Clientes
            estado_asistencia = "present" if index % 2 == 0 else "absent"

            # A. Crear la Reserva confirmada y paga en la BD
            nueva_reserva_fijini = Reservation(
                user_id=alumno.id,
                activity_id=act_id,
                reservation_type="fixed",
                reservation_date=item["fecha"],
                status="confirmed",
                payment_status="paid",
                created_at=fecha_pago
            )
            db.add(nueva_reserva_fijini)
            db.flush()

            # B. Registrar la Transacción financiera en caja
            nueva_transaccion_fijini = CreditTransaction(
                user_id=alumno.id,
                amount=float(act_fijini.price or 5000.00), # 💡 Convertido a float para que SQLite lo acepte
                activity_type="class_reservation",
                reservation_id=nueva_reserva_fijini.id,
                reason=f"Pago por reserva de clase fija: {act_fijini.name}",
                created_at=fecha_pago
            )
            db.add(nueva_transaccion_fijini)

            # C. Registrar la asistencia del alumno
            db.add(Attendance(
                user_id=alumno.id,
                activity_id=act_id,
                status=estado_asistencia,
                timestamp=fecha_clase_dt
            ))

    db.commit()
    print("✅ Inyección y matriculación de clases FIJINI finalizada correctamente.")
# ──────────────────────────────────────────────────────────────────────────
    # 7. MATRÍCULAS E INSCRIPCIONES PERSONALIZADAS EN CLASES FIJINI
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ Inscribiendo clientes en las clases de FIJINI (IDs 19, 20 y 21)...")
    
    # Configuración de cantidad de inscritos requerida por actividad
    config_fijini = [
        {"id": 21, "cant_clientes": 3},  # 3 inscritos para el 15/07/2026
        {"id": 20, "cant_clientes": 4},  # 4 inscritos para el 08/07/2026
        {"id": 19, "cant_clientes": 5}   # 5 inscritos para el 01/07/2026
    ]
    
    for conf in config_fijini:
        # Buscamos la actividad por su ID para garantizar la integridad
        act_fijini = db.query(Activity).filter(Activity.id == conf["id"]).first()
        
        if act_fijini:
            # Tomamos una muestra aleatoria de clientes reales creados en la Sección 1
            alumnos_seleccionados = random.sample(clientes_creados, min(conf["cant_clientes"], len(clientes_creados)))
            
            # Seteamos la hora de la clase (09:00 hs según tu schedule)
            hora_clase = 9
            fecha_dt = datetime.combine(act_fijini.specific_date, datetime.min.time()) + timedelta(hours=hora_clase)
            
            for index, alumno in enumerate(alumnos_seleccionados):
                # Generamos una fecha de compra/pago de 1 a 3 días antes de la clase
                fecha_reserva_pago = fecha_dt - timedelta(days=random.randint(1, 3))
                
                # Simulamos asistencias realistas: algunos presentes, otros ausentes
                estado_asistencia = "present" if index % 2 == 0 else "absent"
                
                # A. Crear la Reserva confirmada y paga
                nueva_reserva_fijini = Reservation(
                    user_id=alumno.id,
                    activity_id=act_fijini.id,
                    reservation_type="fixed",
                    reservation_date=act_fijini.specific_date,
                    status="confirmed",
                    payment_status="paid",
                    created_at=fecha_reserva_pago
                )
                db.add(nueva_reserva_fijini)
                db.flush()
                
                # B. Registrar la Transacción financiera en caja
                nueva_transaccion_fijini = CreditTransaction(
                    user_id=alumno.id,
                    amount=act_fijini.price or 5000.00,
                    activity_type="class_reservation",
                    reservation_id=nueva_reserva_fijini.id,
                    reason=f"Pago por reserva de clase fija: {act_fijini.name}",
                    created_at=fecha_reserva_pago
                )
                db.add(nueva_transaccion_fijini)
                
                # C. Registrar la planilla de Asistencia
                db.add(Attendance(
                    user_id=alumno.id,
                    activity_id=act_fijini.id,
                    status=estado_asistencia,
                    timestamp=fecha_dt
                ))
        else:
            print(f"⚠️ Advertencia: No se encontró la actividad FIJINI con ID {conf['id']} en la BD.")

    db.commit()
    print("✅ Proceso de seed de FIJINI completado con éxito.")