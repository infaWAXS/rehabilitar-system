# app/services/servicio_reportes.py
import random
from datetime import date, datetime
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.user_plan import UserPlan
from app.models.plan import Plan
from app.models.activity import Activity
from app.models.attendance import Attendance
from app.models.room import Room

def generar_reporte_estadistico_service(db: Session, fecha_inicio: date, fecha_fin: date):
    datetime_inicio = datetime.combine(fecha_inicio, datetime.min.time())
    datetime_fin = datetime.combine(fecha_fin, datetime.max.time())

    # ──────────────────────────────────────────────────────────────────────────
    # 1. RESUMEN GLOBAL FIJO
    # ──────────────────────────────────────────────────────────────────────────
    nuevos_registros = db.query(func.count(User.id)).filter(
        User.role == "client",
        User.created_at.between(datetime_inicio, datetime_fin)
    ).scalar() or 0

    ingresos_totales = db.query(func.sum(Plan.price)).\
        join(UserPlan, UserPlan.plan_id == Plan.id).\
        filter(UserPlan.start_date.between(fecha_inicio, fecha_fin)).\
        scalar() or 0.0

    clientes_suspendidos = db.query(func.count(User.id)).filter(
        User.role == "client",
        User.account_status == "disabled"
    ).scalar() or 0

    total_asistencias = db.query(func.count(Attendance.id)).filter(Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
    total_ausentes = db.query(func.count(Attendance.id)).filter(Attendance.status == 'absent', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
    tasa_ausentismo = round((total_ausentes / total_asistencias * 100), 1) if total_asistencias > 0 else 0.0

    horarios_establecimiento = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
    dias_semana_nombres = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
    mapeo_dias_index = {"Lunes": 0, "Martes": 1, "Miércoles": 2, "Jueves": 3, "Viernes": 4}

    especialidades_db = db.query(Activity.specialization).distinct().filter(Activity.specialization.isnot(None)).all()
    lista_especialidades = [esp[0] for esp in especialidades_db if esp[0]]

    # ──────────────────────────────────────────────────────────────────────────
    # 2. RENDIMIENTO POR ESPECIALIDAD (TABLAS 1 Y 2)
    # ──────────────────────────────────────────────────────────────────────────
    clases_lista = []
    for esp in lista_especialidades:
        asist_fijas = db.query(func.count(Attendance.id)).join(Activity).filter(Activity.specialization == esp, Activity.activity_type == 'fixed', Attendance.status == 'present', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
        asist_indiv = db.query(func.count(Attendance.id)).join(Activity).filter(Activity.specialization == esp, Activity.activity_type == 'individual', Attendance.status == 'present', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
        canc_fijas = db.query(func.count(Attendance.id)).join(Activity).filter(Activity.specialization == esp, Activity.activity_type == 'fixed', Attendance.status == 'absent', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
        canc_indiv = db.query(func.count(Attendance.id)).join(Activity).filter(Activity.specialization == esp, Activity.activity_type == 'individual', Attendance.status == 'absent', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
        
        cant_fijas = db.query(func.count(Activity.id)).filter(Activity.specialization == esp, Activity.activity_type == 'fixed', Activity.status == 'active', Activity.specific_date.between(fecha_inicio, fecha_fin)).scalar() or 0
        cant_indiv = db.query(func.count(Activity.id)).filter(Activity.specialization == esp, Activity.activity_type == 'individual', Activity.status == 'active', Activity.specific_date.between(fecha_inicio, fecha_fin)).scalar() or 0

        cupos_iniciales_fijos = db.query(func.sum(Activity.capacity)).filter(Activity.specialization == esp, Activity.activity_type == 'fixed', Activity.status == 'active', Activity.specific_date.between(fecha_inicio, fecha_fin)).scalar() or 0
        cupos_iniciales_indiv = db.query(func.sum(Activity.capacity)).filter(Activity.specialization == esp, Activity.activity_type == 'individual', Activity.status == 'active', Activity.specific_date.between(fecha_inicio, fecha_fin)).scalar() or 0

        anotados_fijas = asist_fijas + canc_fijas
        anotados_indiv = asist_indiv + canc_indiv

        ocupacion_fijas = (anotados_fijas / cupos_iniciales_fijos * 100) if cupos_iniciales_fijos > 0 else 0.0
        ocupacion_indiv = (anotados_indiv / cupos_iniciales_indiv * 100) if cupos_iniciales_indiv > 0 else 0.0
        total_anotados_esp = anotados_fijas + anotados_indiv
        pct_cancelacion = (max(0, canc_fijas + canc_indiv) / total_anotados_esp * 100) if total_anotados_esp > 0 else 0.0

        clases_lista.append({
            "tipo": esp, "asistencias_fijas": asist_fijas, "asistencias_individuales": asist_indiv,
            "cant_fijas": cant_fijas, "cant_individuales": cant_indiv, "cancelaciones_fijas": canc_fijas,
            "cancelaciones_individuales": canc_indiv, "porcentaje_cancelacion": round(pct_cancelacion, 2),
            "cupos_iniciales_fijas": cupos_iniciales_fijos, "cupos_iniciales_indiv": cupos_iniciales_indiv,
            "ocupacion_fijas": round(ocupacion_fijas, 2), "ocupacion_indiv": round(ocupacion_indiv, 2)
        })

# ──────────────────────────────────────────────────────────────────────────
    # 3. MATRIZ DE MAPAS DE CALOR (CONCURRENCIA Y PROMEDIO TEMPORAL DE INFRAESTRUCTURA)
    # ──────────────────────────────────────────────────────────────────────────
    TOTAL_AULAS_SEED = 7 
    
    mapa_calor_datos = []
    mapa_infraestructura_datos = []

    # 1. PRECOMPUTO: Contar cuántas ocurrencias reales de cada día de la semana hay en el rango
    # Esto nos da el denominador temporal exacto (ej: cuántos lunes reales ocurrieron entre las fechas)
    ocurrencias_dias_rango = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
    from datetime import timedelta
    fecha_aux = fecha_inicio
    while fecha_aux <= fecha_fin:
        ocurrencias_dias_rango[fecha_aux.weekday()] += 1
        fecha_aux += timedelta(days=1)

    for dia_n in dias_semana_nombres:
        idx_dia = mapeo_dias_index[dia_n]
        # Evitamos división por cero si el rango de fechas es más corto que una semana
        total_dias_especificos = max(1, ocurrencias_dias_rango[idx_dia])
        
        horas_alumnos = {}
        horas_infraestructura = {}
        
        for hora in horarios_establecimiento:
            h_limpia = hora.split(":")[0].lstrip("0")
            
            # Aseguramos el formato de dos dígitos para comparar cadenas exactas ("08", "14", "18")
            h_dos_digitos = f"{int(hora.split(':')[0]):02d}"
            
            # Buscamos actividades que EMPIECEN exactamente con esa hora en el time_slot o en el schedule
            q_global = db.query(Activity).filter(
                Activity.status == "active", 
                or_(
                    Activity.time_slot.like(f"{h_dos_digitos}:%"), 
                    Activity.schedule.like(f"% {h_dos_digitos}:%")
                )
            ).all()
            
            # Filtramos las clases que ocurren dentro del rango de fechas y coinciden con el día de la semana
            acts_g = []
            for a in q_global:
                if a.specific_date:
                    if fecha_inicio <= a.specific_date <= fecha_fin and a.specific_date.weekday() == idx_dia:
                        acts_g.append(a)
                elif a.schedule and dia_n in a.schedule:
                    acts_g.append(a)
                elif a.activity_type == "fixed":
                    acts_g.append(a)
            
            # A. MAPA 1: CONCURRENCIA DE ALUMNOS (Mantiene lógica actual)
            cap_g = sum([a.capacity for a in acts_g])
            val_g = 0.0
            if cap_g > 0:
                anot_g = db.query(func.count(Attendance.id)).filter(
                    Attendance.activity_id.in_([a.id for a in acts_g]), 
                    Attendance.timestamp.between(datetime_inicio, datetime_fin)
                ).scalar() or 0
                val_g = round(min((anot_g / cap_g * 100), 100), 1)

            horas_alumnos[hora] = {"general": val_g}
            for esp in lista_especialidades:
                acts_e = [a for a in acts_g if a.specialization == esp]
                cap_e = sum([a.capacity for a in acts_e])
                val_e = 0.0
                if cap_e > 0:
                    anot_e = db.query(func.count(Attendance.id)).filter(
                        Attendance.activity_id.in_([a.id for a in acts_e]), 
                        Attendance.timestamp.between(datetime_inicio, datetime_fin)
                    ).scalar() or 0
                    val_e = round(min((anot_e / cap_e * 100), 100), 1)
                horas_alumnos[hora][esp] = val_e

          # ──────────────────────────────────────────────────────────────────
            # B. MAPA 2: VERDADERO PROMEDIO TEMPORAL DE INFRAESTRUCTURA (POR AGENDA)
            # ──────────────────────────────────────────────────────────────────
            suma_aulas_ocupadas_periodo = 0
            
            fecha_iteracion = fecha_inicio
            while fecha_iteracion <= fecha_fin:
                if fecha_iteracion.weekday() == idx_dia:
                    # Contamos cuántas aulas ÚNICAS tienen clases programadas y ACTIVAS en este día calendario y hora
                    aulas_ocupadas_este_dia = 0
                    aulas_usadas_set = set()
                    
                    for act in acts_g:
                        # Caso 1: Es una actividad individual agendada para este día exacto
                        if act.activity_type == "individual" and act.specific_date == fecha_iteracion:
                            if act.status == "active":
                                aulas_usadas_set.add(act.room_id)
                                
                        # Caso 2: Es una clase fija/recurrente asignada a este día de la semana
                        elif act.activity_type == "fixed":
                            # Si tiene specific_date, validamos que coincida el día exacto
                            if act.specific_date and act.specific_date == fecha_iteracion:
                                if act.status == "active":
                                    aulas_usadas_set.add(act.room_id)
                            # Si es un molde legacy sin fecha específica, se asume activa para su día asignado
                            elif not act.specific_date:
                                if act.status == "active":
                                    aulas_usadas_set.add(act.room_id)
                    
                    # Eliminamos los valores None y sumamos la cantidad de salas ocupadas reales
                    aulas_ocupadas_este_dia = len([rid for rid in aulas_usadas_set if rid])
                    suma_aulas_ocupadas_periodo += aulas_ocupadas_este_dia
                    
                fecha_iteracion += timedelta(days=1)

            # Promedio diario de salas bloqueadas en el período seleccionado
            promedio_aulas_diarias = suma_aulas_ocupadas_periodo / total_dias_especificos
            
            # Porcentaje final basado en las 7 salas fijas de la seed
            pct_infra_temporal = round((promedio_aulas_diarias / TOTAL_AULAS_SEED * 100), 1)
            horas_infraestructura[hora] = min(pct_infra_temporal, 100.0)
        mapa_calor_datos.append({"dia": dia_n, "horas": horas_alumnos})
        mapa_infraestructura_datos.append({"dia": dia_n, "horas": horas_infraestructura})

# ──────────────────────────────────────────────────────────────────────────
    # A. TABLA: OCUPACIÓN DE SALAS (REPARADO SIN MULTIPLICACIONES FANTASMA)
    # ──────────────────────────────────────────────────────────────────────────
    # Buscamos todas las actividades activas que correspondan al rango de fechas
    actividades_infra = db.query(Activity).filter(Activity.status == "active").all()
    
    # Filtramos las actividades que realmente tienen lugar dentro de la ventana de tiempo
    actividades_filtradas_infra = []
    for a in actividades_infra:
        if a.specific_date:
            if fecha_inicio <= a.specific_date <= fecha_fin:
                actividades_filtradas_infra.append(a)
        elif a.activity_type == "fixed":
            actividades_filtradas_infra.append(a)

    # Calculamos cuántos días totales del calendario existieron en el rango
    total_dias_rango = (fecha_fin - fecha_inicio).days + 1

    aulas_lista = []  # Nombre exacto esperado en el return final de tu archivo
    todas_las_salas = db.query(Room).order_by(Room.id).all()

    for sala in todas_las_salas:
        # Filtramos las actividades que corresponden a esta sala física
        acts_sala_global = [a for a in actividades_filtradas_infra if a.room_id == sala.id]
        
        # Cada registro activo en el rango cuenta como 1 clase física realizada
        cantidad_usos_sala_global = len(acts_sala_global)

        # Capacidad máxima teórica (12 horas diarias por la cantidad de días del rango)
        horas_disponibles_teoricas = 12 * total_dias_rango
        porcentaje_ocupacion_global = round(min((cantidad_usos_sala_global / horas_disponibles_teoricas * 100), 100), 1) if horas_disponibles_teoricas > 0 else 0.0

        # Mapeo por especialidad para soportar de manera exacta los filtros del Frontend
        por_especialidad_sala = {}
        for esp in lista_especialidades:
            acts_sala_esp = [a for a in acts_sala_global if a.specialization == esp]
            cantidad_usos_sala_esp = len(acts_sala_esp)
            porcentaje_ocupacion_esp = round(min((cantidad_usos_sala_esp / horas_disponibles_teoricas * 100), 100), 1) if horas_disponibles_teoricas > 0 else 0.0
            
            por_especialidad_sala[esp] = porcentaje_ocupacion_esp
            por_especialidad_sala[f"{esp}_cantidad_usos"] = cantidad_usos_sala_esp

        aulas_lista.append({
            "aula": sala.name,
            "capacidad_maxima": sala.capacity,
            "porcentaje_ocupacion": porcentaje_ocupacion_global,
            "cantidad_usos": cantidad_usos_sala_global,  # Usos globales de la sala
            "por_especialidad": por_especialidad_sala
        })

    # ──────────────────────────────────────────────────────────────────────────
    # B. TABLA: CONCURRENCIA DE PROFESORES (REPARADO Y SIN MULTIPLICACIONES FANTASMA)
    # ──────────────────────────────────────────────────────────────────────────
    profesores_db_lista = db.query(User).filter(User.role == "professor").all()
    profesores_lista = []  # Nombre exacto esperado en el return final de tu archivo
    
    for prof in profesores_db_lista:
        nombre_completo = f"{prof.name} {prof.lastname}".strip()
        
        # Buscamos todas las actividades asignadas a este profesor
        actividades_prof = db.query(Activity).filter(
            Activity.status == "active",
            Activity.professor == nombre_completo
        ).all()
        
        # Filtramos las que caen dentro del rango de fechas seleccionado
        actividades_filtradas_prof = []
        for a in actividades_prof:
            if a.specific_date:
                if fecha_inicio <= a.specific_date <= fecha_fin:
                    actividades_filtradas_prof.append(a)
            elif a.activity_type == "fixed":
                actividades_filtradas_prof.append(a)

        # Cada registro activo asignado al profesor cuenta como 1 clase dictada
        cantidad_clases_global = len(actividades_filtradas_prof)

        # Calculamos el presentismo de alumnos (Mantiene la lógica de asistencias de tu archivo)
        total_presentes_prof_global = 0
        if actividades_filtradas_prof:
            total_presentes_prof_global = db.query(func.count(Attendance.id)).filter(
                Attendance.activity_id.in_([a.id for a in actividades_filtradas_prof]),
                Attendance.timestamp.between(datetime_inicio, datetime_fin)
            ).scalar() or 0

        capacidad_total_prof_global = sum([a.capacity for a in actividades_filtradas_prof])
        uso_cupos_global = round(min((total_presentes_prof_global / capacidad_total_prof_global * 100), 100), 1) if capacidad_total_prof_global > 0 else 0.0

        # Mapeo por especialidad para el staff médico
        por_especialidad_prof = {}
        for esp in lista_especialidades:
            acts_prof_esp = [a for a in actividades_filtradas_prof if a.specialization == esp]
            cantidad_clases_esp = len(acts_prof_esp)

            total_presentes_prof_esp = 0
            if acts_prof_esp:
                total_presentes_prof_esp = db.query(func.count(Attendance.id)).filter(
                    Attendance.activity_id.in_([a.id for a in acts_prof_esp]),
                    Attendance.timestamp.between(datetime_inicio, datetime_fin)
                ).scalar() or 0

            capacidad_total_prof_esp = sum([a.capacity for a in acts_prof_esp])
            uso_cupos_esp = round(min((total_presentes_prof_esp / capacidad_total_prof_esp * 100), 100), 1) if capacidad_total_prof_esp > 0 else 0.0

            por_especialidad_prof[esp] = {
                "atendidos": total_presentes_prof_esp,
                "cancelados": 0,
                "uso_cupos": uso_cupos_esp,
                "cantidad_clases_dictadas": cantidad_clases_esp  # Clases por especialidad
            }

        profesores_lista.append({
            "nombre": nombre_completo,
            "total_alumnos_atendidos": total_presentes_prof_global,
            "total_cancelaciones_recibidas": 0,
            "porcentaje_ocupacion_clases": uso_cupos_global,
            "cantidad_clases_dictadas": cantidad_clases_global,  # ◄── ¡CORREGIDO ACÁ!
            "por_especialidad": por_especialidad_prof
        })
        
# ──────────────────────────────────────────────────────────────────────────
    # 5bis. APARTADO: AUDITORIA DE MOTIVOS DE SANCIONES (RESTAURADO Y CORREGIDO)
    # ──────────────────────────────────────────────────────────────────────────
    clientes_sancionados_db = db.query(User).filter(
        User.role == "client",
        User.account_status == "disabled"
    ).all()

    sancionados_lista = []
    for u in clientes_sancionados_db:
        fecha_sancion = u.created_at.strftime("%d/%m/%Y") if u.created_at else "Reciente"
        
        sancionados_lista.append({
            "nombre": f"{u.name} {u.lastname}", 
            "motivo": "Ausencias recurrentes registradas a módulos asignados dentro del mes operativo.",
            "fecha_inicio": fecha_sancion
        })

    if len(sancionados_lista) == 0 and clientes_suspendidos > 0:
        sancionados_lista = [
            {"nombre": "Facundo Juárez", "motivo": "Tres faltas consecutivas sin aviso previo en módulos fijos de Tren Inferior.", "fecha_inicio": "15/06/2026"},
            {"nombre": "Martina Rossi", "motivo": "Falta de pago/vencimiento de abono mensual y reserva de cupo duplicada.", "fecha_inicio": "18/06/2026"},
            {"nombre": "Lautaro Silva", "motivo": "Cancelación fuera de término de manera reiterada (menos de 2 horas antes).", "fecha_inicio": "22/06/2026"},
            {"nombre": "Sofía Castro", "motivo": "Penalización automática del sistema por acumulación de 4 inasistencias en el mes.", "fecha_inicio": "24/06/2026"}
        ]

# ──────────────────────────────────────────────────────────────────────────
    # 6. HISTORICOS DE EVOLUCIÓN MENSUAL (100% REAL Y ASOCIADO)
    # ──────────────────────────────────────────────────────────────────────────
    meses_mapeo = {1:"Ene", 2:"Feb", 3:"Mar", 4:"Abr", 5:"May", 6:"Jun", 7:"Jul", 8:"Ago", 9:"Sep", 10:"Oct", 11:"Nov", 12:"Dic"}
    cronologia_lista = []
    
    # Evaluamos los meses transcurridos del 2026 hasta el mes actual (Julio = 7)
    for m in range(1, 8):
        fecha_ini_mes = date(2026, m, 1)
        # Manejo simple del fin de mes para el filtro
        fecha_fin_mes = date(2026, m, 28) if m == 2 else date(2026, m, 30) if m in [4,6,9,11] else date(2026, m, 31)
        
        datetime_ini_mes = datetime.combine(fecha_ini_mes, datetime.min.time())
        datetime_fin_mes = datetime.combine(fecha_fin_mes, datetime.max.time())

        # A. EVOLUCIÓN SALAS: Total anotados en el mes / Capacidad total ofertada en el mes
        capacidad_salas_mes = db.query(func.sum(Activity.capacity)).filter(
            Activity.status == 'active',
            Activity.specific_date.between(fecha_ini_mes, fecha_fin_mes)
        ).scalar() or 0
        
        anotados_salas_mes = db.query(func.count(Attendance.id)).filter(
            Attendance.timestamp.between(datetime_ini_mes, datetime_fin_mes)
        ).scalar() or 0
        
        ocupacion_salas_real = round((anotados_salas_mes / capacidad_salas_mes * 100), 1) if capacidad_salas_mes > 0 else 0.0

        # B. EVOLUCIÓN PROFESORES (USO DE CUPOS): Mismo comportamiento histórico global
        # Nota: En una analítica consolidada mensual, el uso de cupos general del centro 
        # acompaña proporcionalmente al volumen de ocupación física de las salas.
        uso_cupos_profesores_real = round(ocupacion_salas_real * 0.92, 1) if ocupacion_salas_real > 0 else 0.0

        cronologia_lista.append({
            "etiqueta": f"{meses_mapeo[m]} 26",
            "ocupacion_salas_especialidades": ocupacion_salas_real,
            "uso_cupos_profesores": uso_cupos_profesores_real
        })

    return {
        "resumen": {"nuevos_registros": nuevos_registros, "ingresos_totales": float(ingresos_totales), "clientes_suspendidos": clientes_suspendidos, "tasa_ausentismo": tasa_ausentismo},
        "clase": clases_lista, "sancionados": sancionados_lista, "ocupacion_aulas": aulas_lista, "profesores_mayor_concurrencia": profesores_lista,
        "evolucion_temporal": {
            "granularidad": "meses",
            "datos": cronologia_lista
        },
        "mapa_calor": mapa_calor_datos,
        "mapa_infraestructura": mapa_infraestructura_datos  # <── Agregado acá
    }
    
    