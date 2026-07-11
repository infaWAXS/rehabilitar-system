# app/services/reportes/servicio_repsalas.py
from datetime import date, datetime, timedelta
from sqlalchemy import func, or_, text
from sqlalchemy.orm import Session
from app.models.activity import Activity
from app.models.attendance import Attendance
from app.models.room import Room
from app.models.user import User

def generar_reporte_salas_service(db: Session, fecha_inicio: date, fecha_fin: date):
    datetime_inicio = datetime.combine(fecha_inicio, datetime.min.time())
    datetime_fin = datetime.combine(fecha_fin, datetime.max.time())
    
    horarios_establecimiento = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
    
    dias_semana_nombres = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
    mapeo_dias_index = {"Lunes": 0, "Martes": 1, "Miércoles": 2, "Jueves": 3, "Viernes": 4}
    
    especialidades_db = db.query(Activity.specialization).distinct().filter(Activity.specialization.isnot(None)).all()
    lista_especialidades = [esp[0] for esp in especialidades_db if esp[0]]
    
    # ──────────────────────────────────────────────────────────────────────────
    # 2. MAPA DE CALOR DE INFRAESTRUCTURA (Textos Literales X/Y Dinámicos)
    # ──────────────────────────────────────────────────────────────────────────
    total_aulas_reales = db.query(Room).count() or 1
    
    ocurrencias_dias_rango = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
    fecha_aux = fecha_inicio
    while fecha_aux <= fecha_fin:
        ocurrencias_dias_rango[fecha_aux.weekday()] += 1
        fecha_aux += timedelta(days=1)

    mapa_infraestructura_datos = []

    for dia_n in dias_semana_nombres:
        idx_dia = mapeo_dias_index[dia_n]
        ocurrencias_reales_dia = ocurrencias_dias_rango[idx_dia] 
        
        if ocurrencias_reales_dia == 0:
            continue

        cupos_aula_disponibles = ocurrencias_reales_dia * total_aulas_reales
        horas_infraestructura = {}
        
        for hora in horarios_establecimiento:
            h_dos_digitos = f"{int(hora.split(':')[0]):02d}"
            
            q_infra = db.query(Activity).filter(
                Activity.status == "active",
                or_(Activity.time_slot.like(f"{h_dos_digitos}:%"), Activity.schedule.like(f"% {h_dos_digitos}:%"))
            ).all()
            
            acts_dia = [a for a in q_infra if (a.specific_date and fecha_inicio <= a.specific_date <= fecha_fin and a.specific_date.weekday() == idx_dia) or (not a.specific_date and dia_n in str(a.schedule))]
            
            aulas_reservadas_totales = 0
            fecha_iteracion = fecha_inicio
            
            while fecha_iteracion <= fecha_fin:
                if fecha_iteracion.weekday() == idx_dia:
                    aulas_usadas_set = {act.room_id for act in acts_dia if act.room_id and (act.specific_date == fecha_iteracion or not act.specific_date)}
                    aulas_reservadas_totales += len(aulas_usadas_set)
                fecha_iteracion += timedelta(days=1)
            
            horas_infraestructura[hora] = f"{aulas_reservadas_totales}/{cupos_aula_disponibles}"
        
        mapa_infraestructura_datos.append({"dia": dia_n, "horas": horas_infraestructura})

    # ──────────────────────────────────────────────────────────────────────────
    # 2.5 MAPA DE CALOR DE ALUMNOS (Calcula Asistencia General Y Por Especialidad)
    # ──────────────────────────────────────────────────────────────────────────
    mapa_calor_datos = []
    for dia_n in dias_semana_nombres:
        idx_dia = mapeo_dias_index[dia_n]
        ocurrencias_reales_dia = ocurrencias_dias_rango[idx_dia] 
        
        if ocurrencias_reales_dia == 0:
            continue

        horas_alumnos = {}
        for hora in horarios_establecimiento:
            h_dos_digitos = f"{int(hora.split(':')[0]):02d}"
            
            acts_dia = [a for a in db.query(Activity).filter(Activity.status == "active").all() 
                        if a.room_id and (
                            (a.specific_date and fecha_inicio <= a.specific_date <= fecha_fin and a.specific_date.weekday() == idx_dia and f"{h_dos_digitos}:" in str(a.time_slot)) 
                            or (not a.specific_date and dia_n in str(a.schedule) and f"{h_dos_digitos}:" in str(a.schedule))
                        )]
            
            cap_g = sum([a.capacity for a in acts_dia])
            anot_g = 0
            if acts_dia:
                anot_g = db.query(func.count(Attendance.id)).filter(
                    Attendance.activity_id.in_([a.id for a in acts_dia]), 
                    Attendance.timestamp.between(datetime_inicio, datetime_fin)
                ).scalar() or 0
            
            hora_data = {"general": round(min((anot_g / cap_g * 100), 100), 1) if cap_g > 0 else 0.0}
            
            # Cálculo desglosado por especialidad para esta hora
            for esp in lista_especialidades:
                acts_esp = [a for a in acts_dia if a.specialization == esp]
                cap_esp = sum([a.capacity for a in acts_esp])
                anot_esp = 0
                if acts_esp:
                    anot_esp = db.query(func.count(Attendance.id)).filter(
                        Attendance.activity_id.in_([a.id for a in acts_esp]), 
                        Attendance.timestamp.between(datetime_inicio, datetime_fin)
                    ).scalar() or 0
                hora_data[esp] = round(min((anot_esp / cap_esp * 100), 100), 1) if cap_esp > 0 else 0.0
                
            horas_alumnos[hora] = hora_data
        mapa_calor_datos.append({"dia": dia_n, "horas": horas_alumnos})

    # ──────────────────────────────────────────────────────────────────────────
    # 3. OCUPACIÓN FIJA POR SALA
    # ──────────────────────────────────────────────────────────────────────────
    actividades_filtradas_infra = [
        a for a in db.query(Activity).filter(Activity.status == "active").all() 
        if (a.specific_date and fecha_inicio <= a.specific_date <= fecha_fin) 
        or (not a.specific_date and a.activity_type == "fixed")
    ]
    
    total_dias_rango = (fecha_fin - fecha_inicio).days + 1
    dias_habiles = sum(1 for i in range(total_dias_rango) if (fecha_inicio + timedelta(days=i)).weekday() < 5)
    horas_totales_rango = 12 * dias_habiles 
    
    aulas_lista = []
    
    for sala in db.query(Room).order_by(Room.id).all():
        acts_sala = [a for a in actividades_filtradas_infra if a.room_id == sala.id]
        cantidad_usos = len(acts_sala)
        
        porcentaje_reserva = round((cantidad_usos / horas_totales_rango * 100), 1) if horas_totales_rango > 0 else 0.0
        
        capacidad_ofertada_sala = sum([a.capacity for a in acts_sala])
        ids_acts_sala = [a.id for a in acts_sala]
        
        anotados_sala = 0
        presentes_sala = 0
        
        if ids_acts_sala:
            anotados_sala = db.query(func.count(Attendance.id)).filter(
                Attendance.activity_id.in_(ids_acts_sala),
                Attendance.timestamp.between(datetime_inicio, datetime_fin)
            ).scalar() or 0
            
            presentes_sala = db.query(func.count(Attendance.id)).filter(
                Attendance.activity_id.in_(ids_acts_sala),
                Attendance.timestamp.between(datetime_inicio, datetime_fin),
                Attendance.status == 'present'
            ).scalar() or 0
        
        ocupacion_promedio = round((anotados_sala / capacidad_ofertada_sala * 100), 1) if capacidad_ofertada_sala > 0 else 0.0
        porcentaje_presentes = round((presentes_sala / anotados_sala * 100), 1) if anotados_sala > 0 else 0.0
        
        por_especialidad_sala = {}
        for esp in lista_especialidades:
            acts_esp = [a for a in acts_sala if a.specialization == esp]
            usos_esp = len(acts_esp)
            cap_esp = sum([a.capacity for a in acts_esp])
            anotados_esp = 0
            if acts_esp:
                anotados_esp = db.query(func.count(Attendance.id)).filter(
                    Attendance.activity_id.in_([a.id for a in acts_esp]),
                    Attendance.timestamp.between(datetime_inicio, datetime_fin)
                ).scalar() or 0
            por_especialidad_sala[esp] = round((anotados_esp / cap_esp * 100), 1) if cap_esp > 0 else 0.0
            por_especialidad_sala[f"{esp}_cantidad_usos"] = usos_esp

        aulas_lista.append({
            "aula": sala.name, "capacidad": sala.capacity or 0, "cantidad_usos": cantidad_usos,
            "porcentaje_ocupacion": ocupacion_promedio, "porcentaje_presentes": porcentaje_presentes,
            "porcentaje_reserva": porcentaje_reserva, "por_especialidad": por_especialidad_sala
        })

    # ──────────────────────────────────────────────────────────────────────────
    # 4. RANKING TOP CLASES (Corrección de UnboundLocalError aplicada)
    # ──────────────────────────────────────────────────────────────────────────
    clases_agrupadas = {}
    actividades_reservadas = [a for a in actividades_filtradas_infra if a.room_id]
    nombres_por_grupo = {}

    for act in actividades_reservadas:
        prof_id = act.professor.id if hasattr(act.professor, 'id') else (act.professor if act.professor else "Sin asignar")
        key = (act.specialization, act.room_id, prof_id)
        
        if key not in clases_agrupadas:
            clases_agrupadas[key] = {"capacidad_total": 0, "anotados_totales": 0}
            nombres_por_grupo[key] = act.name if hasattr(act, 'name') else "Clase"
        
        clases_agrupadas[key]["capacidad_total"] += act.capacity
        
        anotados = db.query(func.count(Attendance.id)).filter(
            Attendance.activity_id == act.id,
            Attendance.timestamp.between(datetime_inicio, datetime_fin)
        ).scalar() or 0
        clases_agrupadas[key]["anotados_totales"] += anotados

    top_clases_list = []
    for key, data in clases_agrupadas.items():
        esp, rid, pid = key
        ocupacion = round((data["anotados_totales"] / data["capacidad_total"] * 100), 1) if data["capacidad_total"] > 0 else 0.0
        
        sala_obj = db.query(Room).filter(Room.id == rid).first()
        
        nombre_prof = "Sin asignar"
        if pid != "Sin asignar":
            if isinstance(pid, int):
                profesor_obj = db.query(User).filter(User.id == pid).first()
                if profesor_obj:
                    n = getattr(profesor_obj, 'name', '') or getattr(profesor_obj, 'first_name', '')
                    a = getattr(profesor_obj, 'last_name', '')
                    nombre_prof = f"{n} {a}".strip() or profesor_obj.email
            else:
                nombre_prof = str(pid)
            
        top_clases_list.append({
            "nombre_clase": nombres_por_grupo[key],
            "especialidad": esp or "General",
            "aula": sala_obj.name if sala_obj else "-",
            "profesor": nombre_prof,
            "ocupacion": ocupacion
        })
    
    top_clases_list = sorted(top_clases_list, key=lambda x: x["ocupacion"], reverse=True)

    # ──────────────────────────────────────────────────────────────────────────
    # 5. RESUMEN DE LOGÍSTICA
    # ──────────────────────────────────────────────────────────────────────────
    if actividades_reservadas:
        ids_reservadas = [a.id for a in actividades_reservadas]
        capacidad_ofertada = sum([a.capacity for a in actividades_reservadas])
        asistencias_reales = db.query(func.count(Attendance.id)).filter(
            Attendance.activity_id.in_(ids_reservadas),
            Attendance.timestamp.between(datetime_inicio, datetime_fin)
        ).scalar() or 0
        ocupacion_promedio_salas = round((asistencias_reales / capacidad_ofertada * 100), 1) if capacidad_ofertada > 0 else 0.0
    else:
        ocupacion_promedio_salas = 0.0
        ids_reservadas = []

    salas_reservadas_count = len(actividades_reservadas)

    lista_espera_count = 0
    if ids_reservadas:
        try:
            ids_str = ",".join(map(str, ids_reservadas))
            query_espera = text(f"SELECT COUNT(id) FROM waitlist WHERE activity_id IN ({ids_str}) AND status = 'waiting'")
            lista_espera_count = db.execute(query_espera).scalar() or 0
        except Exception as e:
            print(f"Error al consultar la tabla waitlist: {e}")
            lista_espera_count = 0  

    return {
        "resumen": {
            "ocupacion_promedio": ocupacion_promedio_salas,
            "salas_reservadas": salas_reservadas_count,
            "lista_espera": lista_espera_count
        },
        "mapa_infraestructura": mapa_infraestructura_datos,
        "mapa_calor": mapa_calor_datos,
        "ocupacion_aulas": aulas_lista,
        "top_clases": top_clases_list
    }