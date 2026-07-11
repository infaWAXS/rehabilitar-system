# app/services/reportes/servicio_repstaff.py
from datetime import date, datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.activity import Activity
from app.models.attendance import Attendance

def generar_reporte_staff_service(db: Session, fecha_inicio: date, fecha_fin: date):
    datetime_inicio = datetime.combine(fecha_inicio, datetime.min.time())
    datetime_fin = datetime.combine(fecha_fin, datetime.max.time())

    # ──────────────────────────────────────────────────────────────────────────
    # 1. LISTADO DE ESPECIALIDADES Y RESUMEN (Previo a los filtros)
    # ──────────────────────────────────────────────────────────────────────────
    especialidades_db = db.query(Activity.specialization).distinct().filter(Activity.specialization.isnot(None)).all()
    lista_especialidades = [esp[0] for esp in especialidades_db if esp[0]]
    clases_lista = [{"tipo": esp} for esp in lista_especialidades]

    # Cálculos para el nuevo resumen superior
    prof_superior = db.query(Activity.professor).filter(Activity.status == "active", func.lower(Activity.specialization).like("%superior%")).distinct().count()
    prof_inferior = db.query(Activity.professor).filter(Activity.status == "active", func.lower(Activity.specialization).like("%inferior%")).distinct().count()
    prof_medio = db.query(Activity.professor).filter(Activity.status == "active", func.lower(Activity.specialization).like("%medio%")).distinct().count()

    resumen = {
        "tren_superior": prof_superior,
        "tren_inferior": prof_inferior,
        "tren_medio": prof_medio
    }

    # ──────────────────────────────────────────────────────────────────────────
    # 2. CONCURRENCIA Y PERFORMANCE DE PROFESORES
    # ──────────────────────────────────────────────────────────────────────────
    profesores_db_lista = db.query(User).filter(User.role == "professor").all()

    profesores_eliminados = db.query(User).filter(
        User.role == "professor",
        User.is_deleted == True,
        User.deleted_at < datetime_inicio # Eliminado antes del primer día del rango
    ).all()

    profesores_lista = []
    
    for prof in profesores_db_lista:
        nombre_completo = f"{prof.name} {prof.lastname}".strip()
        
        actividades_prof = db.query(Activity).filter(
            Activity.status == "active",
            Activity.professor == nombre_completo
        ).all()
        
        actividades_filtradas_prof = []
        for a in actividades_prof:
            if a.specific_date:
                if fecha_inicio <= a.specific_date <= fecha_fin:
                    actividades_filtradas_prof.append(a)
            elif a.activity_type == "fixed":
                actividades_filtradas_prof.append(a)

        cantidad_clases_global = len(actividades_filtradas_prof)
        total_presentes_prof_global = 0
        total_ausentes_prof_global = 0

        if actividades_filtradas_prof:
            ids_actividades = [a.id for a in actividades_filtradas_prof]
            
            total_presentes_prof_global = db.query(func.count(Attendance.id)).filter(
                Attendance.activity_id.in_(ids_actividades),
                Attendance.status == 'present',
                Attendance.timestamp.between(datetime_inicio, datetime_fin)
            ).scalar() or 0
            
            total_ausentes_prof_global = db.query(func.count(Attendance.id)).filter(
                Attendance.activity_id.in_(ids_actividades),
                Attendance.status == 'absent',
                Attendance.timestamp.between(datetime_inicio, datetime_fin)
            ).scalar() or 0

        capacidad_total_prof_global = sum([a.capacity for a in actividades_filtradas_prof])
        anotados_totales_global = total_presentes_prof_global + total_ausentes_prof_global
        uso_cupos_global = round(min((anotados_totales_global / capacidad_total_prof_global * 100), 100), 1) if capacidad_total_prof_global > 0 else 0.0

        # DESGLOSE POR ESPECIALIDAD
        por_especialidad_prof = {}
        for esp in lista_especialidades:
            acts_prof_esp = [a for a in actividades_filtradas_prof if a.specialization == esp]
            cantidad_clases_esp = len(acts_prof_esp)

            total_presentes_prof_esp = 0
            total_ausentes_prof_esp = 0
            
            if acts_prof_esp:
                ids_esp = [a.id for a in acts_prof_esp]
                total_presentes_prof_esp = db.query(func.count(Attendance.id)).filter(
                    Attendance.activity_id.in_(ids_esp),
                    Attendance.status == 'present',
                    Attendance.timestamp.between(datetime_inicio, datetime_fin)
                ).scalar() or 0
                
                total_ausentes_prof_esp = db.query(func.count(Attendance.id)).filter(
                    Attendance.activity_id.in_(ids_esp),
                    Attendance.status == 'absent',
                    Attendance.timestamp.between(datetime_inicio, datetime_fin)
                ).scalar() or 0

            capacidad_total_prof_esp = sum([a.capacity for a in acts_prof_esp])
            anotados_totales_esp = total_presentes_prof_esp + total_ausentes_prof_esp
            uso_cupos_esp = round(min((anotados_totales_esp / capacidad_total_prof_esp * 100), 100), 1) if capacidad_total_prof_esp > 0 else 0.0

            por_especialidad_prof[esp] = {
                "atendidos": total_presentes_prof_esp,
                "cancelados": total_ausentes_prof_esp,
                "uso_cupos": uso_cupos_esp,
                "cantidad_clases_dictadas": cantidad_clases_esp
            }

        profesores_lista.append({
            "nombre": nombre_completo,
            "total_alumnos_atendidos": total_presentes_prof_global,
            "total_cancelaciones_recibidas": total_ausentes_prof_global,
            "porcentaje_ocupacion_clases": uso_cupos_global,
            "cantidad_clases_dictadas": cantidad_clases_global,
            "por_especialidad": por_especialidad_prof
        })

# ──────────────────────────────────────────────────────────────────────────
    # 3. RETENCIÓN DE ALUMNO POR PROFESOR (Ajustado para formato "-" y filtros)
    # ──────────────────────────────────────────────────────────────────────────
    retencion_lista = []
    actividades_fijas = db.query(Activity).filter(Activity.activity_type == "fixed", Activity.status == "active").all()
    
    now_dt = datetime.now()
    # Definimos los rangos de semanas
    rango_semanas = [
        (now_dt - timedelta(days=28), now_dt - timedelta(days=21)), # Semana 1
        (now_dt - timedelta(days=21), now_dt - timedelta(days=14)), # Semana 2
        (now_dt - timedelta(days=14), now_dt - timedelta(days=7)),  # Semana 3
        (now_dt - timedelta(days=7), now_dt)                        # Semana 4
    ]

    for act in actividades_fijas:
        semanas_data = []
        total_presentes = 0
        
        for s_start, s_end in rango_semanas:
            # Verificamos si la actividad existía en ese rango de tiempo
            count = db.query(func.count(Attendance.id)).filter(
                Attendance.activity_id == act.id,
                Attendance.status == 'present',
                Attendance.timestamp >= s_start,
                Attendance.timestamp < s_end
            ).scalar() or 0
            
            # Si count es 0, enviamos "-" para el front
            semanas_data.append(count if count > 0 else "-")
            total_presentes += (count if count != "-" else 0)

        # FILTRO: Solo incluir si tiene al menos 2 presentes en total en las 4 semanas
        if total_presentes >= 2:
            prof_name = act.professor if act.professor else "Sin asignar"
            clase_name = getattr(act, 'name', act.specialization) or "Clase Fija"

            retencion_lista.append({
                "profesor": prof_name,
                "clase": clase_name,
                "semana_1": semanas_data[0],
                "semana_2": semanas_data[1],
                "semana_3": semanas_data[2],
                "semana_4": semanas_data[3]
            })

    # ──────────────────────────────────────────────────────────────────────────
    # 4. EMPAQUETADO FINAL
    # ──────────────────────────────────────────────────────────────────────────
    return {
        "resumen": resumen,
        "clases_lista": clases_lista,
        "profesores_mayor_concurrencia": profesores_lista,
        "profesores_eliminados": [{"nombre": f"{p.name} {p.lastname}".strip(), "fecha_baja": p.deleted_at} for p in profesores_eliminados],
        "retencion": retencion_lista
    }