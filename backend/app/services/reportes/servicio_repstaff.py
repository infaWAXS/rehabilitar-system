# app/services/servicio_repstaff.py
from datetime import date, datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.activity import Activity
from app.models.attendance import Attendance

def generar_reporte_staff_service(db: Session, fecha_inicio: date, fecha_fin: date):
    datetime_inicio = datetime.combine(fecha_inicio, datetime.min.time())
    datetime_fin = datetime.combine(fecha_fin, datetime.max.time())

    # ──────────────────────────────────────────────────────────────────────────
    # 1. LISTADO DE ESPECIALIDADES (Requerido para el dropdown del Frontend)
    # ──────────────────────────────────────────────────────────────────────────
    especialidades_db = db.query(Activity.specialization).distinct().filter(Activity.specialization.isnot(None)).all()
    lista_especialidades = [esp[0] for esp in especialidades_db if esp[0]]
    
    # El front solo necesita el atributo "tipo" para extraer los nombres
    clases_lista = [{"tipo": esp} for esp in lista_especialidades]

    # ──────────────────────────────────────────────────────────────────────────
    # 2. CONCURRENCIA Y PERFORMANCE DE PROFESORES
    # ──────────────────────────────────────────────────────────────────────────
    profesores_db_lista = db.query(User).filter(User.role == "professor").all()
    profesores_lista = []
    
    for prof in profesores_db_lista:
        nombre_completo = f"{prof.name} {prof.lastname}".strip()
        
        # Actividades activas asignadas a este profesor
        actividades_prof = db.query(Activity).filter(
            Activity.status == "active",
            Activity.professor == nombre_completo
        ).all()
        
        # Filtrado por el rango de fechas seleccionado
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

        # Cálculo global de asistencias y cancelaciones
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
        
        # Ocupación sobre la capacidad ofertada
        uso_cupos_global = round(min((anotados_totales_global / capacidad_total_prof_global * 100), 100), 1) if capacidad_total_prof_global > 0 else 0.0

        # ──────────────────────────────────────────────────────────────────────
        # 3. DESGLOSE POR ESPECIALIDAD (Para la tabla reactiva)
        # ──────────────────────────────────────────────────────────────────────
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
    # 4. EMPAQUETADO FINAL
    # ──────────────────────────────────────────────────────────────────────────
    return {
        "clase": clases_lista,
        "profesores_mayor_concurrencia": profesores_lista
    }