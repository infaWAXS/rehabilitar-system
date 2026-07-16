# app/seeds/seed_estadisticas.py
import random
from datetime import date, datetime, timedelta
from sqlalchemy import text
from sqlalchemy.orm import Session

# Importación de modelos del sistema
from app.models.user import User
from app.models.plan import Plan
from app.models.room import Room
from app.models.activity import Activity
from app.models.attendance import Attendance
from app.models.reservation import Reservation
from app.models.credit_transaction import CreditTransaction
from app.models.waitlist import Waitlist
from app.models.user_suspension import UserSuspension  # Para el control estricto de bloqueos

def seed_estadisticas(db: Session):
    print("⏳ [Fase 1/N] Limpiando tablas para garantizar consistencia absoluta...")
    # Limpieza en cascada en orden inverso de dependencias para evitar conflictos de FK
    db.query(Attendance).delete()
    db.query(CreditTransaction).delete()
    db.query(Reservation).delete()
    db.query(Waitlist).delete()
    db.query(UserSuspension).delete()
    db.query(Activity).delete()
    db.query(User).filter(User.role.in_(["client", "professor"])).delete()
    db.commit()

    print("⏳ [Fase 2/N] Creando planes base del sistema...")
    # Aseguramos planes de suscripción coherentes para los flujos de caja del Hub y Finanzas
    planes_nombres = [
        {"name": "Pase Libre", "price": 28000.00},
        {"name": "Plan Premium", "price": 22000.00},
        {"name": "Plan Básico", "price": 16000.00}
    ]
    planes_db = []
    for p_data in planes_nombres:
        nuevo_plan = Plan(
            name=p_data["name"],
            description=f"Acceso preferencial según cobertura: {p_data['name']}",
            price=p_data["price"],
            duration_days=30,
            coverage_type="estándar",
            status="active"
        )
        db.add(nuevo_plan)
        planes_db.append(nuevo_plan)
    db.commit()

    # ──────────────────────────────────────────────────────────────────────────
    # 3. POBLACIÓN ESTRUCTURADA DE CLIENTES Y SUSPENSIONES (HISTÓRICO 2026)
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ [Fase 3/N] Creando clientes y aplicando penalizaciones históricas...")

    # Mapeo exacto de registros y suspensiones según la planificación de la presentación:
    # Enero: 2 registros, 0 suspendidos
    # Febrero: 5 registros, 2 suspendidos (1 sistema [Usuario 3], 1 hurto [Usuario 4])
    # Marzo: 2 registros, 1 suspendido (se levanta ban del sistema [Usuario 3])
    # Abril: 5 registros, 3 suspendidos (se suman: 1 sistema [Usuario 8], 1 vandalismo [Usuario 9])
    # Mayo: 2 registros, 3 suspendidos (estable)
    # Junio: 7 registros, 4 suspendidos (re-baneo del primero [Usuario 3] por sistema)
    # Julio: 5 registros, 3 suspendidos (se levanta ban del ladrón [Usuario 4])
    
    clientes_por_mes = {
        1: [ # Enero (2 clientes)
            {"name": "Felipe", "lastname": "Mendoza", "email": "felipe.mendoza@gmail.com", "fecha": datetime(2026, 1, 10, 9, 30)},
            {"name": "Agustina", "lastname": "Paz", "email": "agustina.paz@gmail.com", "fecha": datetime(2026, 1, 24, 15, 10)}
        ],
        2: [ # Febrero (5 clientes)
            {"name": "Nahuel", "lastname": "Flores", "email": "nahuel.flores@gmail.com", "fecha": datetime(2026, 2, 4, 10, 0)},  # [Usuario 3] - Ban Sistema Feb, Unban Mar, Re-ban Jun
            {"name": "Bautista", "lastname": "Giménez", "email": "bautista.gimenez@gmail.com", "fecha": datetime(2026, 2, 11, 16, 45)}, # [Usuario 4] - Ban Hurto Feb, Unban Jul
            {"name": "Camila", "lastname": "Díaz", "email": "camila.diaz@gmail.com", "fecha": datetime(2026, 2, 15, 11, 20)},
            {"name": "Valentino", "lastname": "Herrera", "email": "valentino.herrera@gmail.com", "fecha": datetime(2026, 2, 18, 14, 0)},
            {"name": "Milagros", "lastname": "Sosa", "email": "milagros.sosa@gmail.com", "fecha": datetime(2026, 2, 26, 18, 30)}
        ],
        3: [ # Marzo (2 clientes)
            {"name": "Mateo", "lastname": "Castillo", "email": "mateo.castillo@gmail.com", "fecha": datetime(2026, 3, 5, 9, 15)},
            {"name": "Sofía", "lastname": "Romero", "email": "sofia.romero@gmail.com", "fecha": datetime(2026, 3, 20, 16, 10)}
        ],
        4: [ # Abril (5 clientes)
            {"name": "Santiago", "lastname": "Maldonado", "email": "santiago.maldonado@gmail.com", "fecha": datetime(2026, 4, 3, 10, 30)}, # [Usuario 8] - Ban Sistema Abr
            {"name": "Martina", "lastname": "Benítez", "email": "martina.benitez@gmail.com", "fecha": datetime(2026, 4, 12, 11, 0)},     # [Usuario 9] - Ban Vandalismo Abr
            {"name": "Juan", "lastname": "Acosta", "email": "juan.acosta@gmail.com", "fecha": datetime(2026, 4, 18, 15, 40)},
            {"name": "Lucía", "lastname": "Domínguez", "email": "lucia.dominguez@gmail.com", "fecha": datetime(2026, 4, 22, 17, 15)},
            {"name": "Tomás", "lastname": "Silva", "email": "tomas.silva@gmail.com", "fecha": datetime(2026, 4, 28, 19, 0)}
        ],
        5: [ # Mayo (2 clientes)
            {"name": "Enzo", "lastname": "Ortega", "email": "enzo.ortega@gmail.com", "fecha": datetime(2026, 5, 8, 9, 0)},
            {"name": "Delfina", "lastname": "Peralta", "email": "delfina.peralta@gmail.com", "fecha": datetime(2026, 5, 22, 14, 30)}
        ],
        6: [ # Junio (7 clientes)
            {"name": "Joaquín", "lastname": "Castro", "email": "joaquin.castro@gmail.com", "fecha": datetime(2026, 6, 2, 10, 15)},
            {"name": "Olivia", "lastname": "Ríos", "email": "olivia.rios@gmail.com", "fecha": datetime(2026, 6, 7, 11, 40)},
            {"name": "Benjamín", "lastname": "Ponce", "email": "benjamin.ponce@gmail.com", "fecha": datetime(2026, 6, 12, 14, 10)},
            {"name": "Catalina", "lastname": "Suárez", "email": "catalina.suarez@gmail.com", "fecha": datetime(2026, 6, 16, 16, 0)},
            {"name": "Lucas", "lastname": "Blanco", "email": "lucas.blanco@gmail.com", "fecha": datetime(2026, 6, 21, 18, 20)},
            {"name": "Julieta", "lastname": "Torres", "email": "julieta.torres@gmail.com", "fecha": datetime(2026, 6, 25, 9, 45)},
            {"name": "Felipe", "lastname": "Vega", "email": "felipe.vega@gmail.com", "fecha": datetime(2026, 6, 29, 15, 30)}
        ],
        7: [ # Julio (5 clientes)
            {"name": "Bautista", "lastname": "Medina", "email": "bautista.medina@gmail.com", "fecha": datetime(2026, 7, 2, 10, 0)},
            {"name": "Zoe", "lastname": "Guzmán", "email": "zoe.guzman@gmail.com", "fecha": datetime(2026, 7, 5, 11, 15)},
            {"name": "Lautaro", "lastname": "Molina", "email": "lautaro.molina@gmail.com", "fecha": datetime(2026, 7, 8, 14, 30)},
            {"name": "Alma", "lastname": "Cardozo", "email": "alma.cardozo@gmail.com", "fecha": datetime(2026, 7, 12, 16, 20)},
            {"name": "Ignacio", "lastname": "Navarro", "email": "ignacio.navarro@gmail.com", "fecha": datetime(2026, 7, 15, 17, 45)}
        ]
    }

    todos_los_clientes = []
    mapa_clientes = {} # Para poder recuperar usuarios fácilmente

    # Creación y guardado de clientes en base de datos
    for mes, lista in clientes_por_mes.items():
        for c in lista:
            nuevo_usuario = User(
                name=c["name"],
                lastname=c["lastname"],
                email=c["email"],
                password="pwd",
                role="client",
                account_status="active",
                created_at=c["fecha"],
                birth_date=date(1995, mes, random.randint(1, 28))
            )
            db.add(nuevo_usuario)
            db.flush()
            todos_los_clientes.append(nuevo_usuario)
            mapa_clientes[c["email"]] = nuevo_usuario
    db.commit()

    # ──────────────────────────────────────────────────────────────────────────
    # APLICACIÓN DE SUSPENSIONES CRONOLÓGICAS (Exactamente según tus pautas)
    # ──────────────────────────────────────────────────────────────────────────
    
    # 1. Febrero: Se suspende "Nahuel Flores" (Sistema) y "Bautista Giménez" (Hurto)
    u_nahuel = mapa_clientes["nahuel.flores@gmail.com"]
    u_bautista = mapa_clientes["bautista.gimenez@gmail.com"]

    susp_nahuel_feb = UserSuspension(
        user_id=u_nahuel.id,
        suspension_date=datetime(2026, 2, 10, 18, 0),
        suspension_reason="Inasistencia_Mayor_Al_50%", # Por sistema
        is_active=False, # Se inactiva en Marzo
        reinstatement_date=datetime(2026, 3, 10, 9, 0)
    )
    susp_bautista_feb = UserSuspension(
        user_id=u_bautista.id,
        suspension_date=datetime(2026, 2, 15, 12, 0),
        suspension_reason="Sustracción_De_Bienes_Del_Establecimiento", # Hurto
        is_active=False, # Se reactiva en Julio
        reinstatement_date=datetime(2026, 7, 10, 9, 0)
    )
    db.add_all([susp_nahuel_feb, susp_bautista_feb])

    # 2. Abril: Se suspende "Santiago Maldonado" (Sistema) y "Martina Benítez" (Suciedad / Vandalismo)
    u_santiago = mapa_clientes["santiago.maldonado@gmail.com"]
    u_martina = mapa_clientes["martina.benitez@gmail.com"]

    susp_santiago_abr = UserSuspension(
        user_id=u_santiago.id,
        suspension_date=datetime(2026, 4, 15, 18, 0),
        suspension_reason="Acumulacion_De_3_Faltas_Consecutivas", # Por sistema
        is_active=True # Sigue suspendido
    )
    susp_martina_abr = UserSuspension(
        user_id=u_martina.id,
        suspension_date=datetime(2026, 4, 20, 10, 30),
        suspension_reason="Incumplimiento_Normas_De_Higiene_Y_Limpieza", # Ensuciar el aula
        is_active=True # Sigue suspendida
    )
    db.add_all([susp_santiago_abr, susp_martina_abr])

    # 3. Junio: "Nahuel Flores" (primero del sistema) comete otra falta y se lo vuelve a banear
    susp_nahuel_jun = UserSuspension(
        user_id=u_nahuel.id,
        suspension_date=datetime(2026, 6, 15, 18, 0),
        suspension_reason="Acumulacion_De_3_Faltas_Consecutivas", # Re-ban por sistema
        is_active=True # Sigue suspendido en Julio
    )
    db.add(susp_nahuel_jun)

    # Aplicamos estados de cuenta actualizados basados en el estado activo en Julio (mes actual)
    u_nahuel.account_status = "suspended"
    u_santiago.account_status = "suspended"
    u_martina.account_status = "suspended"
    u_bautista.account_status = "active" # Indultado en julio

    db.commit()
    print("✅ [Fase 3/N] Base de datos de Clientes y Penalizaciones cargada.")

    # ──────────────────────────────────────────────────────────────────────────
    # 4. CONFIGURACIÓN Y MODELADO DE INGRESOS MENSUALES
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ [Fase 4/N] Preparando estructura de planes y transacciones...")

    # Mapeo de compras de planes por mes para la presentación
    # Mes 3 (Marzo): 2 planes básicos ($16.000 c/u) = $32.000
    # Mes 5 (Mayo): 2 planes premium ($22.000 c/u) = $44.000
    # Mes 7 (Julio): 1 pase libre ($28.000 c/u) = $28.000
    compras_planes_programadas = {
        3: [
            {"email": "mateo.castillo@gmail.com", "plan_idx": 2}, # Plan Básico $16.000
            {"email": "sofia.romero@gmail.com", "plan_idx": 2}    # Plan Básico $16.000
        ],
        5: [
            {"email": "enzo.ortega@gmail.com", "plan_idx": 1},   # Plan Premium $22.000
            {"email": "delfina.peralta@gmail.com", "plan_idx": 1} # Plan Premium $22.000
        ],
        7: [
            {"email": "zoe.guzman@gmail.com", "plan_idx": 0}      # Pase Libre $28.000
        ]
    }

    # Registro en base de datos de las compras de planes (Suscripciones)
    from app.models.user_plan import UserPlan # Importamos dinámicamente si es necesario

    for mes, compras in compras_planes_programadas.items():
        for compra in compras:
            cliente = mapa_clientes.get(compra["email"])
            plan = planes_db[compra["plan_idx"]]
            
            if cliente:
                fecha_compra = datetime(2026, mes, random.randint(1, 5), 10, 0)
                
                # Registrar suscripción activa
                nueva_suscripcion = UserPlan(
                    user_id=cliente.id,
                    plan_id=plan.id,
                    start_date=fecha_compra.date(),
                    end_date=(fecha_compra + timedelta(days=30)).date(),
                    specialization="Acupuntura" # Plan global corporativo
                )
                db.add(nueva_suscripcion)
                db.flush()
                
                # Registrar el ingreso real en caja
                transaccion_plan = CreditTransaction(
                    user_id=cliente.id,
                    amount=float(plan.price),
                    activity_type="plan_purchase",
                    reason=f"Adquisición mensual de suscripción: {plan.name}",
                    created_at=fecha_compra
                )
                db.add(transaccion_plan)

    db.commit()
    print("✅ [Fase 4/N] Suscripciones y transacciones de planes base registradas con éxito.")

# ──────────────────────────────────────────────────────────────────────────
    # 5. CREACIÓN DE PROFESORES Y SALAS
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ [Fase 5/N] Creando Profesores (10) y asociando Salas de la base de datos...")

    # 10 Profesores exactos con la distribución requerida
    profesores_data = [
        {"name": "Roberto", "lastname": "Chen", "esp": "Acupuntura"},             # TOP 1
        {"name": "Miyagi", "lastname": "Sato", "esp": "Acupuntura"},              # TOP 2
        {"name": "Claudio", "lastname": "García", "esp": "Fisioterapia"},         # MALO 1
        {"name": "Valeria", "lastname": "Rojas", "esp": "Fisioterapia"},          # MALO 2
        {"name": "Luciana", "lastname": "Vidal", "esp": "Fisioterapia"},          # NORMAL 1
        {"name": "Esteban", "lastname": "Mora", "esp": "Kinesiologia deportiva"}, # NORMAL 2
        {"name": "Marcos", "lastname": "Luna", "esp": "Kinesiologia neurologica"},# NORMAL 3
        {"name": "Carolina", "lastname": "Paz", "esp": "Pilates terapeutico"},    # NORMAL 4
        {"name": "Diego", "lastname": "Sosa", "esp": "Osteopatia"},               # NORMAL 5
        {"name": "Florencia", "lastname": "Ruiz", "esp": "Kinesiologia traumatologica"} # NORMAL 6
    ]
    
    mapa_profesores = {}
    for p in profesores_data:
        email_profe = f"{p['name'].lower()}@rehabilitar.com"
        nuevo_profe = User(
            name=p['name'], lastname=p['lastname'], email=email_profe, password="pwd",
            role="professor", specialization=p['esp'], account_status="active",
            created_at=datetime(2025, 12, 1), birth_date=date(1980, 5, 5)
        )
        db.add(nuevo_profe)
        db.flush()
        mapa_profesores[f"{p['name']} {p['lastname']}"] = nuevo_profe
    db.commit()

    # 👇 CORRECCIÓN CLAVE: Recuperamos las salas existentes (sin crear nada)
    # Recuperamos las salas existentes (sin crear nada)
    salas_existentes = db.query(Room).order_by(Room.id).all()
    if len(salas_existentes) < 7:
        raise Exception(f"❌ Error: Se necesitan al menos 7 salas cargadas en la base de datos para la simulación. Hay {len(salas_existentes)}.")

    # Creamos un diccionario para acceder fácil y rápido a cada una de ellas por su número (1 al 7)
    mapa_salas = {i + 1: salas_existentes[i] for i in range(7)}
    
    db.commit()

    # ──────────────────────────────────────────────────────────────────────────
    # 6. INYECCIÓN DE 24 CLASES Y RESERVAS MATEMÁTICAMENTE EXACTAS (CON AUSENTISMO)
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ [Fase 6/N] Inyectando 24 Clases, cuadrando ingresos y forzando ausentismos...")

    clientes_bd = db.query(User).filter(User.role == "client").all()

    def get_clientes_validos(fecha_clase, cantidad):
        # Intentamos filtrar de forma estricta por fecha de registro
        validos = [c for c in clientes_bd if c.created_at.date() <= fecha_clase.date()]
        # Si no llegamos a cubrir el número solicitado de inscriptos, ampliamos al pool de clientes general
        if len(validos) < cantidad:
            validos = clientes_bd
        return random.sample(validos, min(cantidad, len(validos)))

    # Estructura: [Mes, Profe, Especialidad, Nombre Clase, Precio, Cant_Pagas, Cant_Señas, Comportamiento]
    # Comportamiento: "normal" o "all_absent" (para el profe Top 2 que recauda pero no van)
# Estructura: [Mes, Profe, Especialidad, Nombre Clase, Precio, Cant_Pagas, Cant_Señas, Comportamiento]
    clases_config = [
        # --- ENERO (Target total: $30k) -> 3 Clases ---
        # Subimos precios y alumnos para sumar exactamente $30.000 ($12k + $10k + $8k)
        [1, "Miyagi Sato", "Acupuntura", "Acupuntura Zen I", 6000.0, 2, 0, "all_absent"],          # $12.000 (Miyagi)
        [1, "Claudio García", "Fisioterapia", "Fisio Tarde", 5000.0, 2, 0, "normal"],               # $10.000
        [1, "Luciana Vidal", "Fisioterapia", "Fisio Mañana", 4000.0, 2, 0, "normal"],               # $8.000
        
        # --- FEBRERO (Target total: $70k) -> 2 Clases ---
        # Subimos la demanda individual para compensar la falta de planes en este mes y llegar a $70.000 ($35k + $35k)
        [2, "Esteban Mora", "Kinesiologia deportiva", "Deportiva Base", 7000.0, 5, 0, "normal"],    # $35.000
        [2, "Marcos Luna", "Kinesiologia neurologica", "Neuro Base", 7000.0, 5, 0, "normal"],       # $35.000
        
        # --- MARZO (Target total: $45k + $109k total original) -> 5 Clases ---
        # Mantenemos las proporciones que ya tenías para respetar tu target de ingresos
        [3, "Roberto Chen", "Acupuntura", "Acupuntura Vital I", 5000.0, 1, 0, "normal"],            # $5.000
        [3, "Roberto Chen", "Acupuntura", "Acupuntura Vital II", 5000.0, 1, 0, "normal"],           # $5.000
        [3, "Valeria Rojas", "Fisioterapia", "Fisio Suave", 3000.0, 0, 1, "normal"],                # Seña $1.500
        [3, "Carolina Paz", "Pilates terapeutico", "Pilates Post", 3000.0, 0, 1, "normal"],         # Seña $1.500
        [3, "Diego Sosa", "Osteopatia", "Osteo Eval", 3000.0, 0, 0, "normal"],                      # $0
        
        # --- ABRIL (Target total: $40k) -> 2 Clases ---
        # Incrementamos inscritos y precios para aproximar a los $40.000 ($24k + $16k)
        [4, "Miyagi Sato", "Acupuntura", "Acupuntura Zen II", 8000.0, 3, 0, "all_absent"],          # $24.000 (Miyagi)
        [4, "Florencia Ruiz", "Kinesiologia traumatologica", "Trauma Rec", 8000.0, 2, 0, "normal"], # $16.000
        
        # --- MAYO (Target total: $35k + $162k total original) -> 6 Clases ---
        # Conservamos la alta recaudación del mes estrella
        [5, "Roberto Chen", "Acupuntura", "Acupuntura Mag. I", 5000.0, 2, 0, "normal"],             # $10.000
        [5, "Roberto Chen", "Acupuntura", "Acupuntura Mag. II", 5000.0, 2, 0, "normal"],            # $10.000
        [5, "Roberto Chen", "Acupuntura", "Acupuntura Mag. III", 5000.0, 2, 0, "normal"],           # $10.000
        [5, "Claudio García", "Fisioterapia", "Fisio Lenta", 5000.0, 0, 1, "normal"],               # Seña $2.500
        [5, "Valeria Rojas", "Fisioterapia", "Fisio Vacía", 5000.0, 0, 1, "normal"],                # Seña $2.500
        [5, "Luciana Vidal", "Fisioterapia", "Fisio Express", 3000.0, 0, 0, "normal"],              # $0
        
        # --- JUNIO (Target total: $55k) -> 2 Clases ---
        # Incrementamos reservas para alcanzar prolijamente los $55.000 ($30k + $25k)
        [6, "Miyagi Sato", "Acupuntura", "Acupuntura Zen III", 10000.0, 3, 0, "all_absent"],        # $30.000 (Miyagi)
        [6, "Esteban Mora", "Kinesiologia deportiva", "Dep. Elite", 8333.3, 3, 0, "normal"],        # $25.000
        
        # --- JULIO (Target total: $15k + $43k total original) -> 4 Clases ---
        # Conservamos la distribución estricta de Julio
        [7, "Marcos Luna", "Kinesiologia neurologica", "Neuro Final", 5000.0, 1, 0, "normal"],      # $5.000
        [7, "Carolina Paz", "Pilates terapeutico", "Pilates Flow", 5000.0, 1, 0, "normal"],         # $5.000
        [7, "Diego Sosa", "Osteopatia", "Osteo Core", 5000.0, 0, 1, "normal"],                      # Seña $2.500
        [7, "Florencia Ruiz", "Kinesiologia traumatologica", "Trauma Avz", 5000.0, 0, 1, "normal"]  # Seña $2.500
    ]

    for c in clases_config:
        mes, nom_profe, esp, nom_clase, precio, cant_pagas, cant_senas, comportamiento = c
        fecha_clase = datetime(2026, mes, random.randint(1, 28), random.choice([9, 11, 14, 16]), 0)
        
        # Distribución inteligente: Sala 1 y Sala 2 son las más usadas, el resto se reparte del 3 al 7
        if "Zen" in nom_clase or "Mag" in nom_clase:
            sala_asignada = mapa_salas[1]  # Sala 1 (Acupuntura / Top)
        elif "Fisio" in nom_clase or "Post" in nom_clase:
            sala_asignada = mapa_salas[2]  # Sala 2 (Fisioterapia / Retención)
        else:
            # Clases normales distribuidas secuencialmente de la Sala 3 a la 7
            sala_idx = 3 + (mes % 5) # Genera valores de 3 a 7 según el mes
            sala_asignada = mapa_salas[sala_idx]
        
        nueva_clase = Activity(
            room_id=sala_asignada.id, # Asignamos el ID de la sala que definimos arriba
            name=nom_clase, specialization=esp, activity_type="individual",
            specific_date=fecha_clase.date(), time_slot=fecha_clase.strftime("%H:00"),
            professor=nom_profe, price=precio, capacity=10, status="active"
        )
        db.add(nueva_clase)
        db.flush()

        total_alumnos = cant_pagas + cant_senas
        if total_alumnos > 0:
            alumnos = get_clientes_validos(fecha_clase, total_alumnos)
            
            for i, alumno in enumerate(alumnos):
                es_pago_completo = i < cant_pagas
                estado_pago = "paid" if es_pago_completo else "partial"
                monto_abonado = precio if es_pago_completo else (precio * 0.5)
                porcentaje_sena = None if es_pago_completo else 50.0

                fecha_reserva = fecha_clase - timedelta(days=random.randint(1, 4))
                
                nueva_reserva = Reservation(
                    user_id=alumno.id, activity_id=nueva_clase.id, reservation_type="individual",
                    reservation_date=fecha_clase.date(), status="confirmed",
                    payment_status=estado_pago, deposit_percent=porcentaje_sena,
                    created_at=fecha_reserva
                )
                db.add(nueva_reserva)
                db.flush()

                nueva_transaccion = CreditTransaction(
                    user_id=alumno.id, amount=monto_abonado, activity_type="class_reservation",
                    reservation_id=nueva_reserva.id, reason=f"Reserva {estado_pago}: {nom_clase}",
                    created_at=fecha_reserva
                )
                db.add(nueva_transaccion)

                # 💡 REGLA DE AUSENTISMO: Si es Miyagi (all_absent), faltan todos aunque hayan pagado
                if comportamiento == "all_absent":
                    estado_asistencia = "absent"
                else:
                    estado_asistencia = "present" if random.random() > 0.2 else "absent"
                
                db.add(Attendance(
                    user_id=alumno.id, activity_id=nueva_clase.id,
                    status=estado_asistencia, timestamp=fecha_clase
                ))

    db.commit()

    # ──────────────────────────────────────────────────────────────────────────
    # 7. REGISTROS DE AUDITORÍA: BAJAS/RENUNCIAS DEL STAFF EN EL TIEMPO
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ [Fase 7/N] Inyectando bajas (Absentismo del Staff) en logs de auditoría...")
    
    # Vamos a crear 3 actividades fantasmas canceladas para poder asignarles las renuncias
    actividades_canceladas = [
        {"name": "Rehabilitación Extra", "esp": "Fisioterapia", "profe": "Claudio García"},
        {"name": "Fisio Nocturna", "esp": "Fisioterapia", "profe": "Claudio García"},
        {"name": "Guardia Fisio", "esp": "Fisioterapia", "profe": "Luciana Vidal"},
        {"name": "Osteo Urgencia", "esp": "Osteopatia", "profe": "Diego Sosa"}
    ]
    
    acts_fantasma = []
    for ac in actividades_canceladas:
        act = Activity(
            room_id=mapa_salas[1].id, name=ac["name"], specialization=ac["esp"], activity_type="individual",
            specific_date=date(2026, random.randint(3, 6), random.randint(1, 28)), 
            time_slot="18:00", professor=ac["profe"], price=3000.0, capacity=10, status="cancelled"
        )
        db.add(act)
        acts_fantasma.append(act)
    db.commit() # Guardamos para obtener sus IDs

    query_audit = text("""
        INSERT INTO audit_logs (user_id, action, type, result, detail, timestamp)
        VALUES (:user_id, :action, :type, :result, :detail, :timestamp)
    """)

    # Definimos la línea de tiempo de renuncias ("RESIGN_ACTIVITY")
    # Profe Malo (Claudio) tiene varias. Profes Promedio (Luciana y Diego) tienen un par.
    renuncias = [
        {"profe_name": "Claudio García", "act": acts_fantasma[0], "ts": "2026-03-10 14:00:00"},
        {"profe_name": "Claudio García", "act": acts_fantasma[1], "ts": "2026-04-22 09:15:00"},
        {"profe_name": "Claudio García", "act": acts_fantasma[0], "ts": "2026-06-05 16:30:00"}, # Reincidente
        {"profe_name": "Luciana Vidal", "act": acts_fantasma[2], "ts": "2026-05-18 11:00:00"},
        {"profe_name": "Diego Sosa", "act": acts_fantasma[3], "ts": "2026-06-20 10:45:00"}
    ]

    for ren in renuncias:
        profe = mapa_profesores[ren["profe_name"]]
        act = ren["act"]
        
        # 1. El profe asume la clase
        db.execute(query_audit, {
            "user_id": profe.id, "action": "CLAIM_ACTIVITY", "type": "ACTIVITY", "result": "SUCCESS",
            "detail": f"Profesor {profe.name} {profe.lastname} asumió la actividad '{act.name}' (id {act.id})", 
            "timestamp": (datetime.strptime(ren["ts"], "%Y-%m-%d %H:%M:%S") - timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")
        })
        # 2. El profe renuncia a la clase
        db.execute(query_audit, {
            "user_id": profe.id, "action": "RESIGN_ACTIVITY", "type": "ACTIVITY", "result": "SUCCESS",
            "detail": f"Profesor {profe.name} {profe.lastname} renunció a la actividad '{act.name}' (id {act.id})", 
            "timestamp": ren["ts"]
        })

    db.commit()
    print("✅ [Fase 7/N] Logs de absentismo del staff procesados.")

    # ──────────────────────────────────────────────────────────────────────────
    # 8. CLASES FIJAS: ANÁLISIS DE RETENCIÓN DE ALUMNOS (Marzo y Junio)
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ [Fase 8/N] Generando clases fijas (Retención) con curvas de asistencia específicas...")

    # Buscamos 5 alumnos que se hayan registrado entre enero y febrero para asegurar que 
    # existan en el sistema antes de las clases de marzo.
    alumnos_retencion = db.query(User).filter(
        User.role == "client",
        User.created_at < datetime(2026, 3, 1)
    ).limit(5).all()

    # --- CASO 1: MARZO (ASISTENCIA FLUCTUANTE) ---
    # 4 sesiones. Mismo nombre, profe, día (Miércoles 10:00). IDs autoincrementales distintos.
    fechas_marzo = [date(2026, 3, 4), date(2026, 3, 11), date(2026, 3, 18), date(2026, 3, 25)]
    
    # Patrón de asistencia deseado: 3 van, 5 van (sube), 2 van (baja), 4 van (sube)
    patron_marzo = [
        [True, True, True, False, False], # Sesión 1: 3 presentes
        [True, True, True, True, True],   # Sesión 2: 5 presentes
        [True, True, False, False, False],# Sesión 3: 2 presentes
        [True, True, True, False, True]   # Sesión 4: 4 presentes
    ]

    for idx, f_marzo in enumerate(fechas_marzo):
        clase_fija_mar = Activity(
            room_id=mapa_salas[1].id,
            name="Rehabilitación Postural",
            specialization="Fisioterapia",
            activity_type="fixed",
            schedule="Miércoles · 10:00",
            specific_date=f_marzo,
            time_slot="10:00",
            professor="Luciana Vidal", # Profe Normal 1
            price=0.0, # 💡 Precio 0 para no alterar la meta financiera de los $45k de Marzo
            capacity=10,
            status="active"
        )
        db.add(clase_fija_mar)
        db.flush()

        fecha_dt = datetime.combine(f_marzo, datetime.min.time()) + timedelta(hours=10)

        for i, alumno in enumerate(alumnos_retencion):
            # Inscribimos a los 5 en la clase
            nueva_reserva = Reservation(
                user_id=alumno.id, activity_id=clase_fija_mar.id, reservation_type="fixed",
                reservation_date=f_marzo, status="confirmed", payment_status="paid", 
                created_at=fecha_dt - timedelta(days=2)
            )
            db.add(nueva_reserva)
            db.flush()

            # Marcamos la asistencia según el patrón fluctuante
            est_asistencia = "present" if patron_marzo[idx][i] else "absent"
            db.add(Attendance(
                user_id=alumno.id, activity_id=clase_fija_mar.id,
                status=est_asistencia, timestamp=fecha_dt
            ))


    # --- CASO 2: JUNIO (DESERCIÓN PROGRESIVA HASTA 1 ALUMNO) ---
    # 4 sesiones. Mismo nombre, profe, día (Jueves 17:00). IDs autoincrementales distintos.
    fechas_junio = [date(2026, 6, 4), date(2026, 6, 11), date(2026, 6, 18), date(2026, 6, 25)]
    
    # Patrón de asistencia deseado: 5 van, 4 van, 2 van, 1 va.
    patron_junio = [
        [True, True, True, True, True],   # Sesión 1: 5 presentes (Todos)
        [True, True, True, True, False],  # Sesión 2: 4 presentes
        [True, True, False, False, False],# Sesión 3: 2 presentes
        [True, False, False, False, False]# Sesión 4: 1 presente (Solo quedó el primero)
    ]

    for idx, f_junio in enumerate(fechas_junio):
        clase_fija_jun = Activity(
            room_id=mapa_salas[2].id,
            name="Pilates de Mantenimiento",
            specialization="Pilates terapeutico",
            activity_type="fixed",
            schedule="Jueves · 17:00",
            specific_date=f_junio,
            time_slot="17:00",
            professor="Carolina Paz", # Profe Normal 4
            price=0.0, # 💡 Precio 0 para no alterar la meta financiera de Junio
            capacity=10,
            status="active"
        )
        db.add(clase_fija_jun)
        db.flush()

        fecha_dt = datetime.combine(f_junio, datetime.min.time()) + timedelta(hours=17)

        for i, alumno in enumerate(alumnos_retencion):
            nueva_reserva = Reservation(
                user_id=alumno.id, activity_id=clase_fija_jun.id, reservation_type="fixed",
                reservation_date=f_junio, status="confirmed", payment_status="paid", 
                created_at=fecha_dt - timedelta(days=2)
            )
            db.add(nueva_reserva)
            db.flush()

            # Marcamos la asistencia según la caída progresiva
            est_asistencia = "present" if patron_junio[idx][i] else "absent"
            db.add(Attendance(
                user_id=alumno.id, activity_id=clase_fija_jun.id,
                status=est_asistencia, timestamp=fecha_dt
            ))

    db.commit()
    print("✅ [Fase 8/N] Datos de retención y deserción de clases fijas creados con éxito.")
    print("🎉 SEED ESTADÍSTICO FINALIZADO. La base de datos está lista para la presentación.")

    # ──────────────────────────────────────────────────────────────────────────
    # 9. LISTAS DE ESPERA CON FLUCTUACIONES EN CLASES LLENAS
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ [Fase 9/N] Inyectando Listas de Espera fluctuantes en 5 clases de alta demanda...")

    # Seleccionamos 5 clases específicas que sabemos que tienen alta demanda (Top/Normales)
    # de las 24 generadas en la Fase 6
    nombres_target = [
        "Acupuntura Zen II",     # Clase 1 (Abril) -> Meta: 2
        "Acupuntura Mag. I",     # Clase 2 (Mayo)  -> Meta: 5
        "Acupuntura Mag. II",    # Clase 3 (Mayo)  -> Meta: 1
        "Acupuntura Zen III",    # Clase 4 (Junio) -> Meta: 2
        "Neuro Avanzada"         # Clase 5 (Mayo)  -> Meta: 1
    ]
    
    clases_target = db.query(Activity).filter(
        Activity.name.in_(nombres_target),
        Activity.status == "active"
    ).limit(5).all()

    # Meta exacta de personas que quedan en estado 'waiting' al día de la clase
    waitlist_targets = [2, 5, 1, 2, 1]
    
    # Traemos todos los clientes para buscar candidatos a la lista
    todos_clientes = db.query(User).filter(User.role == "client").all()

    for idx, act in enumerate(clases_target):
        # Obtenemos la meta de espera final para esta iteración
        target_waiting = waitlist_targets[idx] if idx < len(waitlist_targets) else 1
        
        # Filtramos los alumnos que YA están inscritos en la clase para no duplicarlos
        inscritos_ids = [r.user_id for r in db.query(Reservation).filter(Reservation.activity_id == act.id).all()]
        
        # Clientes disponibles que se registraron antes de la fecha de la clase
        disponibles = [c for c in todos_clientes if c.id not in inscritos_ids and c.created_at.date() <= act.specific_date]
        
        # 💡 FLUCTUACIÓN: Sumamos entre 2 y 4 personas extra que entrarán a la lista de espera, 
        # pero que se darán de baja antes del día de la clase.
        cant_fluctuacion = random.randint(2, 4)
        seleccionados = random.sample(disponibles, target_waiting + cant_fluctuacion)
        
        for pos, alumno in enumerate(seleccionados):
            # Si está dentro de la meta, queda 'waiting'. Si es extra, se cancela o promueve.
            if pos < target_waiting:
                estado_wl = "waiting"
            else:
                # Simulamos que el usuario se cansó de esperar y canceló, o consiguió lugar
                estado_wl = random.choice(["cancelled", "promoted"])
                
            # Ingresan a la lista entre 1 y 7 días antes de que ocurra la clase
            dias_antes = random.randint(1, 7)
            fecha_ingreso = datetime.combine(act.specific_date, datetime.min.time()) - timedelta(days=dias_antes)
            
            # Guardamos el registro. La fluctuación queda auditada en la base de datos 
            # gracias a los estados históricos, pero el frontend solo leerá los 'waiting'.
            wl_entry = Waitlist(
                user_id=alumno.id,
                activity_id=act.id,
                status=estado_wl,
                position=pos + 1
            )
            
            # Si tu modelo Waitlist soporta fecha de creación (ej. created_at), 
            # la inyectamos para que la fluctuación temporal sea rastreable.
            if hasattr(Waitlist, 'created_at'):
                wl_entry.created_at = fecha_ingreso
                
            db.add(wl_entry)
            
    db.commit()
    print("✅ [Fase 9/N] Listas de espera y fluctuaciones de cupos configuradas con éxito.")
    print("🎉 SEED ESTADÍSTICO FINALIZADO. Sistema 100% listo para la presentación.")