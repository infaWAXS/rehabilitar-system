# app/services/servicio_repclientes.py
from datetime import date, datetime, timedelta
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.activity import Activity
from app.models.attendance import Attendance
from app.models.user_suspension import UserSuspension

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

    clientes_suspendidos_rango = db.query(func.count(User.id)).filter(
        User.role == "client",
        User.account_status == "disabled",
        User.created_at.between(datetime_inicio, datetime_fin) 
    ).scalar() or 0

    total_asistencias = db.query(func.count(Attendance.id)).filter(
        Attendance.timestamp.between(datetime_inicio, datetime_fin)
    ).scalar() or 0
    
    total_ausentes = db.query(func.count(Attendance.id)).filter(
        Attendance.status == 'absent', 
        Attendance.timestamp.between(datetime_inicio, datetime_fin)
    ).scalar() or 0
    
    tasa_ausentismo = round((total_ausentes / total_asistencias * 100), 1) if total_asistencias > 0 else 0.0

    # ──────────────────────────────────────────────────────────────────────────
    # 2. RENDIMIENTO POR ESPECIALIDAD (TABLA DE CONCURRENCIA)
    # ──────────────────────────────────────────────────────────────────────────
    especialidades_db = db.query(Activity.specialization).distinct().filter(Activity.specialization.isnot(None)).all()
    lista_especialidades = [esp[0] for esp in especialidades_db if esp[0]]

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
                if a.specific_date:
                    if fecha_inicio <= a.specific_date <= fecha_fin and a.specific_date.weekday() == idx_dia:
                        acts_g.append(a)
                elif a.schedule and dia_n in a.schedule:
                    acts_g.append(a)
                elif a.activity_type == "fixed":
                    acts_g.append(a)
            
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

        mapa_calor_datos.append({"dia": dia_n, "horas": horas_alumnos})

    # ──────────────────────────────────────────────────────────────────────────
    # 4. SANCIONES ESTADÍSTICAS Y LISTADO
    # ──────────────────────────────────────────────────────────────────────────
    sanciones_query = db.query(UserSuspension).join(User).filter(
        User.role == "client",
        UserSuspension.suspension_date.between(datetime_inicio, datetime_fin)
    ).all()

    sancionados_lista = []
    
    for sancion in sanciones_query:
        if sancion.is_active:
            sancionados_lista.append({
                "nombre": f"{sancion.user.name} {sancion.user.lastname}", 
                "motivo": sancion.suspension_reason.replace("_", " ").title(),
                "fecha_inicio": sancion.suspension_date.strftime("%d/%m/%Y")
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
        "clase": clases_lista, 
        "sancionados": sancionados_lista, 
        "sanciones_estadisticas": sanciones_estadisticas,
        "mapa_calor": mapa_calor_datos
    }