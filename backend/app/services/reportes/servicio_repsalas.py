# app/services/servicio_repsalas.py
from datetime import date, datetime, timedelta
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.models.activity import Activity
from app.models.attendance import Attendance
from app.models.room import Room

def generar_reporte_salas_service(db: Session, fecha_inicio: date, fecha_fin: date):
    datetime_inicio = datetime.combine(fecha_inicio, datetime.min.time())
    datetime_fin = datetime.combine(fecha_fin, datetime.max.time())
    
    # ──────────────────────────────────────────────────────────────────────────
    # 1. PREPARACIÓN DE DATOS BASE
    # ──────────────────────────────────────────────────────────────────────────
    horarios_establecimiento = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
    dias_semana_nombres = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
    mapeo_dias_index = {"Lunes": 0, "Martes": 1, "Miércoles": 2, "Jueves": 3, "Viernes": 4}
    
    especialidades_db = db.query(Activity.specialization).distinct().filter(Activity.specialization.isnot(None)).all()
    lista_especialidades = [esp[0] for esp in especialidades_db if esp[0]]
    
    TOTAL_AULAS_SEED = 7 
    mapa_infraestructura_datos = []
    
    # ──────────────────────────────────────────────────────────────────────────
    # 2. MAPA DE CALOR DE INFRAESTRUCTURA (Promedio temporal por hora)
    # ──────────────────────────────────────────────────────────────────────────
    ocurrencias_dias_rango = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
    fecha_aux = fecha_inicio
    while fecha_aux <= fecha_fin:
        ocurrencias_dias_rango[fecha_aux.weekday()] += 1
        fecha_aux += timedelta(days=1)

    for dia_n in dias_semana_nombres:
        idx_dia = mapeo_dias_index[dia_n]
        total_dias_especificos = max(1, ocurrencias_dias_rango[idx_dia])
        horas_infraestructura = {}
        
        for hora in horarios_establecimiento:
            h_dos_digitos = f"{int(hora.split(':')[0]):02d}"
            
            # Buscar actividades activas en ese slot
            q_infra = db.query(Activity).filter(
                Activity.status == "active",
                or_(Activity.time_slot.like(f"{h_dos_digitos}:%"), Activity.schedule.like(f"% {h_dos_digitos}:%"))
            ).all()
            
            acts_dia = [a for a in q_infra if (a.specific_date and fecha_inicio <= a.specific_date <= fecha_fin and a.specific_date.weekday() == idx_dia) or (not a.specific_date and dia_n in str(a.schedule))]
            
            suma_aulas_ocupadas_periodo = 0
            fecha_iteracion = fecha_inicio
            while fecha_iteracion <= fecha_fin:
                if fecha_iteracion.weekday() == idx_dia:
                    aulas_usadas_set = {act.room_id for act in acts_dia if (act.specific_date == fecha_iteracion or not act.specific_date)}
                    suma_aulas_ocupadas_periodo += len([rid for rid in aulas_usadas_set if rid])
                fecha_iteracion += timedelta(days=1)
            
            pct_infra = round((suma_aulas_ocupadas_periodo / total_dias_especificos / TOTAL_AULAS_SEED * 100), 1)
            horas_infraestructura[hora] = min(pct_infra, 100.0)
        
        mapa_infraestructura_datos.append({"dia": dia_n, "horas": horas_infraestructura})

    # ──────────────────────────────────────────────────────────────────────────
        # 2.5 MAPA DE CALOR DE ALUMNOS (Faltante en tu reporte)
        # ──────────────────────────────────────────────────────────────────────────
        mapa_calor_datos = []
        for dia_n in dias_semana_nombres:
            idx_dia = mapeo_dias_index[dia_n]
            horas_alumnos = {}
            for hora in horarios_establecimiento:
                h_dos_digitos = f"{int(hora.split(':')[0]):02d}"
                # Filtramos actividades que ocurren en esta hora y día
                acts_dia = [a for a in db.query(Activity).filter(Activity.status == "active").all() 
                            if (a.specific_date and fecha_inicio <= a.specific_date <= fecha_fin and a.specific_date.weekday() == idx_dia and f"{h_dos_digitos}:" in str(a.time_slot)) 
                            or (not a.specific_date and dia_n in str(a.schedule) and f"{h_dos_digitos}:" in str(a.schedule))]
                
                cap_g = sum([a.capacity for a in acts_dia])
                anot_g = db.query(func.count(Attendance.id)).filter(
                    Attendance.activity_id.in_([a.id for a in acts_dia]), 
                    Attendance.timestamp.between(datetime_inicio, datetime_fin)
                ).scalar() or 0
                
                horas_alumnos[hora] = {"general": round(min((anot_g / cap_g * 100), 100), 1) if cap_g > 0 else 0.0}
            mapa_calor_datos.append({"dia": dia_n, "horas": horas_alumnos})


    # ──────────────────────────────────────────────────────────────────────────
    # 3. OCUPACIÓN FIJA POR SALA
    # ──────────────────────────────────────────────────────────────────────────
    actividades_filtradas_infra = [a for a in db.query(Activity).filter(Activity.status == "active").all() 
                                   if (a.specific_date and fecha_inicio <= a.specific_date <= fecha_fin) or a.activity_type == "fixed"]
    
    total_dias_rango = (fecha_fin - fecha_inicio).days + 1
    horas_disponibles_teoricas = 12 * total_dias_rango
    aulas_lista = []
    
    for sala in db.query(Room).order_by(Room.id).all():
        acts_sala = [a for a in actividades_filtradas_infra if a.room_id == sala.id]
        
        por_especialidad_sala = {}
        for esp in lista_especialidades:
            usos_esp = len([a for a in acts_sala if a.specialization == esp])
            por_especialidad_sala[esp] = round(min((usos_esp / horas_disponibles_teoricas * 100), 100), 1) if horas_disponibles_teoricas > 0 else 0.0
            por_especialidad_sala[f"{esp}_cantidad_usos"] = usos_esp

        aulas_lista.append({
            "aula": sala.name,
            "porcentaje_ocupacion": round(min((len(acts_sala) / horas_disponibles_teoricas * 100), 100), 1) if horas_disponibles_teoricas > 0 else 0.0,
            "cantidad_usos": len(acts_sala),
            "por_especialidad": por_especialidad_sala
        })

    return {
        "mapa_infraestructura": mapa_infraestructura_datos,
        "mapa_calor": mapa_calor_datos,
        "ocupacion_aulas": aulas_lista
    }