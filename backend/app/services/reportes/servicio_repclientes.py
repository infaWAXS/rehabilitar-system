# app/services/servicio_repclientes.py
from datetime import date, datetime, timedelta
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.activity import Activity
from app.models.attendance import Attendance
from app.models.user_suspension import UserSuspension
from app.models.reservation import Reservation
from app.models.waitlist import Waitlist


def generar_reporte_clientes_service(db: Session, fecha_inicio: date, fecha_fin: date):
    datetime_inicio = datetime.combine(fecha_inicio, datetime.min.time())
    datetime_fin = datetime.combine(fecha_fin, datetime.max.time())

    # ──────────────────────────────────────────────────────────────────────────
    # 1. RESUMEN Y TOTALES
    # ──────────────────────────────────────────────────────────────────────────
    clientes_totales = db.query(func.count(User.id)).filter(
        User.role == "client"
    ).scalar() or 0

    nuevos_registros = db.query(func.count(User.id)).filter(
        User.role == "client",
        User.created_at.between(datetime_inicio, datetime_fin)
    ).scalar() or 0

    clientes_suspendidos_rango = db.query(func.count(UserSuspension.id)).join(User).filter(
        User.role == "client",
        UserSuspension.suspension_date.between(datetime_inicio, datetime_fin),
        or_(
            UserSuspension.is_active == True,
            UserSuspension.reinstatement_date > datetime_fin
        )
    ).scalar() or 0

# Computamos asistencias uniendo con Activity para asegurar que la clase esté activa
    total_asistencias = db.query(func.count(Attendance.id)).\
        join(Activity, Attendance.activity_id == Activity.id).\
        filter(
            Activity.status == "active",
            Attendance.timestamp.between(datetime_inicio, datetime_fin)
        ).scalar() or 0
    
    # Computamos ausencias bajo el mismo criterio de clase activa
    total_ausentes = db.query(func.count(Attendance.id)).\
        join(Activity, Attendance.activity_id == Activity.id).\
        filter(
            Attendance.status == 'absent',
            Activity.status == "active",
            Attendance.timestamp.between(datetime_inicio, datetime_fin)
        ).scalar() or 0
    
    tasa_ausentismo = round((total_ausentes / total_asistencias * 100), 1) if total_asistencias > 0 else 0.0

# ──────────────────────────────────────────────────────────────────────────
    # 2. RENDIMIENTO POR ESPECIALIDAD Y DESGLOSE DE CLASES INDIVIDUALES
    # ──────────────────────────────────────────────────────────────────────────
    especialidades_db = db.query(Activity.specialization).distinct().filter(Activity.specialization.isnot(None)).all()
    lista_especialidades = [esp[0] for esp in especialidades_db if esp[0]]

    # 🚨 FILTRO GLOBAL: Solo clases que ya ocurrieron (fecha <= hoy) dentro del rango
    hoy = date.today()
    actividades_filtradas = db.query(Activity).filter(
        Activity.status == "active",
        Activity.specific_date.between(fecha_inicio, fecha_fin),
        Activity.specific_date <= hoy
    ).all()

    clases_lista = []
    desglose_clases_lista = []
    
    for esp in lista_especialidades:
        acts_esp = [a for a in actividades_filtradas if a.specialization == esp]
        
        # --- A. CÁLCULO AGRUPADO POR ESPECIALIDAD (VISTA GLOBAL) ---
        cant_clases = len(acts_esp)
        cupos_iniciales = sum([a.capacity for a in acts_esp])
        
        asistencias = 0
        inasistencias = 0
        cancelaciones = 0
        lista_espera = 0
        
        if acts_esp:
            ids_actividades = [a.id for a in acts_esp]
            
            asistencias = db.query(func.count(Attendance.id)).filter(
                Attendance.activity_id.in_(ids_actividades),
                Attendance.status == 'present',
                Attendance.timestamp.between(datetime_inicio, datetime_fin)
            ).scalar() or 0
            
            inasistencias = db.query(func.count(Attendance.id)).filter(
                Attendance.activity_id.in_(ids_actividades),
                Attendance.status == 'absent',
                Attendance.timestamp.between(datetime_inicio, datetime_fin)
            ).scalar() or 0
            
            cancelaciones = db.query(func.count(Reservation.id)).filter(
                Reservation.activity_id.in_(ids_actividades),
                Reservation.status == 'cancelled',
                ~Reservation.user_id.in_(
                    db.query(Attendance.user_id).filter(Attendance.activity_id.in_(ids_actividades))
                )
            ).scalar() or 0
            
            lista_espera = db.query(func.count(Waitlist.id)).filter(
                Waitlist.activity_id.in_(ids_actividades),
                Waitlist.status == 'waiting' 
            ).scalar() or 0

        clases_lista.append({
            "tipo": esp,
            "is_clase_individual": False,
            "cant_clases": cant_clases,
            "cupos_iniciales": cupos_iniciales,
            "asistencias": asistencias,
            "inasistencias": inasistencias,
            "cancelaciones": cancelaciones,
            "lista_espera": lista_espera
        })

        # --- B. CÁLCULO DETALLADO CLASE POR CLASE (CON FILTRO APLICADO) ---
        # 🚨 FILTRO DETALLADO: Solo buscamos clases en el rango que ya hayan pasado (fecha <= hoy)
        clases_recientes = db.query(Activity).filter(
            Activity.specialization == esp,
            Activity.status == "active",
            Activity.specific_date.between(fecha_inicio, fecha_fin),
            Activity.specific_date <= hoy  # 👈 AGREGADO ACÁ TAMBIÉN para bloquear la tabla con filtro
        ).order_by(Activity.specific_date.desc()).limit(10).all()

        for cl in clases_recientes:
            c_asist = db.query(func.count(Attendance.id)).filter(Attendance.activity_id == cl.id, Attendance.status == 'present').scalar() or 0
            c_inasist = db.query(func.count(Attendance.id)).filter(Attendance.activity_id == cl.id, Attendance.status == 'absent').scalar() or 0
            c_cancel = db.query(func.count(Reservation.id)).filter(
                Reservation.activity_id == cl.id,
                Reservation.status == 'cancelled',
                ~Reservation.user_id.in_(db.query(Attendance.user_id).filter(Attendance.activity_id == cl.id))
            ).scalar() or 0
            c_espera = db.query(func.count(Waitlist.id)).filter(Waitlist.activity_id == cl.id, Waitlist.status == 'waiting').scalar() or 0

            fecha_legible = cl.specific_date.strftime("%d/%m")
            desglose_clases_lista.append({
                "tipo": esp,
                "is_clase_individual": True,
                "nombre_clase": f"{cl.name} ({fecha_legible})",
                "cant_clases": 1,
                "cupos_iniciales": cl.capacity,
                "asistencias": c_asist,
                "inasistencias": c_inasist,
                "cancelaciones": c_cancel,
                "lista_espera": c_espera
            })

    # ──────────────────────────────────────────────────────────────────────────
    # 3. MATRIZ DE MAPA DE CALOR (SOLO ALUMNOS)
    # ──────────────────────────────────────────────────────────────────────────
    horarios_establecimiento = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
    dias_semana_nombres = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
    mapeo_dias_index = {"Lunes": 0, "Martes": 1, "Miércoles": 2, "Jueves": 3, "Viernes": 4}
    
    mapa_calor_datos = []

    for dia_n in dias_semana_nombres:
        idx_dia = mapeo_dias_index[dia_n]
        horas_alumnos = {}
        
        for hora in horarios_establecimiento:
            h_dos_digitos = f"{int(hora.split(':')[0]):02d}"
            
            q_global = db.query(Activity).filter(
                Activity.status == "active", 
                or_(
                    Activity.time_slot.like(f"{h_dos_digitos}:%"), 
                    Activity.schedule.like(f"% {h_dos_digitos}:%")
                )
            ).all()
            
            acts_g = []
            for a in q_global:
                # Tratamos todas las clases por igual: validamos que tengan specific_date dentro del rango
                # y que coincidan con el día de la semana iterado (idx_dia)
                if a.specific_date and (fecha_inicio <= a.specific_date <= fecha_fin) and (a.specific_date.weekday() == idx_dia):
                    acts_g.append(a)
            
            cap_g = sum([a.capacity for a in acts_g])
            # Si no hay clases planificadas para el módulo general
            if cap_g > 0:
                anot_g = db.query(func.count(Attendance.id)).filter(
                    Attendance.activity_id.in_([a.id for a in acts_g]), 
                    Attendance.timestamp.between(datetime_inicio, datetime_fin)
                ).scalar() or 0
                val_g = round(min((anot_g / cap_g * 100), 100), 1)
            else:
                val_g = None  # Indica que no hubo clases planificadas en este horario

            horas_alumnos[hora] = {"general": val_g}
            
            for esp in lista_especialidades:
                acts_e = [a for a in acts_g if a.specialization == esp]
                cap_e = sum([a.capacity for a in acts_e])
                
                # Si no hay clases planificadas para esta especialidad
                if cap_e > 0:
                    anot_e = db.query(func.count(Attendance.id)).filter(
                        Attendance.activity_id.in_([a.id for a in acts_e]), 
                        Attendance.timestamp.between(datetime_inicio, datetime_fin)
                    ).scalar() or 0
                    val_e = round(min((anot_e / cap_e * 100), 100), 1)
                else:
                    val_e = None  # Indica que no hubo clases de la especialidad en este horario
                    
                horas_alumnos[hora][esp] = val_e

        mapa_calor_datos.append({"dia": dia_n, "horas": horas_alumnos})

    # ──────────────────────────────────────────────────────────────────────────
    # 4. SANCIONES ESTADÍSTICAS Y LISTADO
    # ──────────────────────────────────────────────────────────────────────────
    sanciones_query = db.query(UserSuspension).join(User).filter(
        User.role == "client",
        UserSuspension.suspension_date.between(datetime_inicio, datetime_fin),
        or_(
            UserSuspension.is_active == True,
            UserSuspension.reinstatement_date > datetime_fin
        )
    ).all()

    sancionados_lista = []
    
    for sancion in sanciones_query:
        sancionados_lista.append({
            "nombre": f"{sancion.user.name} {sancion.user.lastname}", 
            "motivo": sancion.suspension_reason.replace("_", " ").title(),
            "fecha_inicio": sancion.suspension_date.strftime("%d/%m/%Y"),
            "fecha_fin": sancion.reinstatement_date.strftime("%d/%m/%Y") if sancion.reinstatement_date else "Permanente"
        })

    reincidentes = db.query(UserSuspension.user_id).group_by(UserSuspension.user_id).having(func.count(UserSuspension.id) > 1).count()
    sancion_mas_antigua = db.query(UserSuspension).filter(UserSuspension.is_active == True).order_by(UserSuspension.suspension_date.asc()).first()
    sancion_mas_reciente = db.query(UserSuspension).filter(UserSuspension.is_active == True).order_by(UserSuspension.suspension_date.desc()).first()

    obj_antiguo = {
        "nombre": f"{sancion_mas_antigua.user.name} {sancion_mas_antigua.user.lastname}" if sancion_mas_antigua else "-", 
        "fecha": sancion_mas_antigua.suspension_date.strftime("%d/%m/%Y") if sancion_mas_antigua else "-"
    }
    obj_reciente = {
        "nombre": f"{sancion_mas_reciente.user.name} {sancion_mas_reciente.user.lastname}" if sancion_mas_reciente else "-", 
        "fecha": sancion_mas_reciente.suspension_date.strftime("%d/%m/%Y") if sancion_mas_reciente else "-"
    }

    sanciones_estadisticas = {
        "reincidentes": reincidentes,
        "masAntiguo": obj_antiguo,
        "masReciente": obj_reciente
    }

    # ──────────────────────────────────────────────────────────────────────────
    # 5. EMPAQUETADO FINAL
    # ──────────────────────────────────────────────────────────────────────────
    return {
        "resumen": {
            "clientes_totales": clientes_totales, 
            "nuevos_registros": nuevos_registros,
            "clientes_suspendidos_rango": clientes_suspendidos_rango,
            "tasa_ausentismo": tasa_ausentismo
        },
        "clase": clases_lista + desglose_clases_lista, 
        "sancionados": sancionados_lista, 
        "sanciones_estadisticas": sanciones_estadisticas,
        "mapa_calor": mapa_calor_datos
    }