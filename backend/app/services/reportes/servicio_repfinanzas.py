# app/services/servicio_repfinanzas.py
import calendar
from datetime import date, datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.user_plan import UserPlan
from app.models.plan import Plan
from app.models.activity import Activity
from app.models.attendance import Attendance

def generar_reporte_financiero_service(db: Session, fecha_inicio: date, fecha_fin: date):
    datetime_inicio = datetime.combine(fecha_inicio, datetime.min.time())
    datetime_fin = datetime.combine(fecha_fin, datetime.max.time())

    # ──────────────────────────────────────────────────────────────────────────
    # 1. TARJETAS DE RESUMEN Y DESGLOSE
    # ──────────────────────────────────────────────────────────────────────────
    suscripciones_activas = db.query(func.count(UserPlan.id)).filter(
        UserPlan.start_date <= fecha_fin,
        UserPlan.end_date >= fecha_inicio
    ).scalar() or 0

    ingresos_planes_db = db.query(func.sum(Plan.price)).join(UserPlan, UserPlan.plan_id == Plan.id).filter(UserPlan.start_date.between(fecha_inicio, fecha_fin)).scalar()
    ingresos_planes = float(ingresos_planes_db) if ingresos_planes_db else 0.0
        
    ingresos_individuales_db = db.query(func.sum(Activity.price)).join(Attendance, Attendance.activity_id == Activity.id).filter(
        Activity.activity_type == 'individual',
        Attendance.status == 'present',
        Attendance.timestamp.between(datetime_inicio, datetime_fin)
    ).scalar()
    ingresos_individuales = float(ingresos_individuales_db) if ingresos_individuales_db else 0.0
        
    ingresos_senas = 0.0 
    ingresos_totales_reales = ingresos_planes + ingresos_individuales + ingresos_senas
    ingreso_promedio = (ingresos_totales_reales / suscripciones_activas) if suscripciones_activas > 0 else 0.0

    # ──────────────────────────────────────────────────────────────────────────
    # 2. EVOLUCIÓN FINANCIERA TEMPORAL
    # ──────────────────────────────────────────────────────────────────────────
    meses_mapeo = {1:"Ene", 2:"Feb", 3:"Mar", 4:"Abr", 5:"May", 6:"Jun", 7:"Jul", 8:"Ago", 9:"Sep", 10:"Oct", 11:"Nov", 12:"Dic"}
    cronologia_lista = []
    dias_rango = (fecha_fin - fecha_inicio).days

    if dias_rango <= 31:
        granularidad_texto = "Diaria"
        for i in range(dias_rango + 1):
            dia_evaluado = fecha_inicio + timedelta(days=i)
            dt_ini = datetime.combine(dia_evaluado, datetime.min.time())
            dt_fin = datetime.combine(dia_evaluado, datetime.max.time())

            # Validación de nulos (None) en bucle diario
            ing_planes_dia_db = db.query(func.sum(Plan.price)).join(UserPlan, UserPlan.plan_id == Plan.id).filter(UserPlan.start_date == dia_evaluado).scalar()
            ing_planes_dia = float(ing_planes_dia_db) if ing_planes_dia_db else 0.0

            ing_indiv_dia_db = db.query(func.sum(Activity.price)).join(Attendance, Attendance.activity_id == Activity.id).filter(
                Activity.activity_type == 'individual', 
                Attendance.status == 'present', 
                Attendance.timestamp.between(dt_ini, dt_fin)
            ).scalar()
            ing_indiv_dia = float(ing_indiv_dia_db) if ing_indiv_dia_db else 0.0

            cronologia_lista.append({
                "mes_corto": f"{dia_evaluado.day} {meses_mapeo[dia_evaluado.month]}",
                "ingresos_brutos": ing_planes_dia + ing_indiv_dia
            })
    else:
        granularidad_texto = "Mensual"
        fecha_iter_ini = fecha_inicio.replace(day=1)
        fecha_fin_tope = fecha_fin.replace(day=1)

        while fecha_iter_ini <= fecha_fin_tope:
            ultimo_dia_mes = calendar.monthrange(fecha_iter_ini.year, fecha_iter_ini.month)[1]
            fecha_iter_fin = date(fecha_iter_ini.year, fecha_iter_ini.month, ultimo_dia_mes)

            rango_real_ini = max(fecha_inicio, fecha_iter_ini)
            rango_real_fin = min(fecha_fin, fecha_iter_fin)
            dt_ini = datetime.combine(rango_real_ini, datetime.min.time())
            dt_fin = datetime.combine(rango_real_fin, datetime.max.time())

            ing_planes_mes_db = db.query(func.sum(Plan.price)).join(UserPlan, UserPlan.plan_id == Plan.id).filter(UserPlan.start_date.between(rango_real_ini, rango_real_fin)).scalar()
            ing_planes_mes = float(ing_planes_mes_db) if ing_planes_mes_db else 0.0

            ing_indiv_mes_db = db.query(func.sum(Activity.price)).join(Attendance, Attendance.activity_id == Activity.id).filter(
                Activity.activity_type == 'individual', 
                Attendance.status == 'present', 
                Attendance.timestamp.between(dt_ini, dt_fin)
            ).scalar()
            ing_indiv_mes = float(ing_indiv_mes_db) if ing_indiv_mes_db else 0.0

            cronologia_lista.append({
                "mes_corto": f"{meses_mapeo[fecha_iter_ini.month]} {str(fecha_iter_ini.year)[2:]}",
                "ingresos_brutos": ing_planes_mes + ing_indiv_mes
            })

            if fecha_iter_ini.month == 12:
                fecha_iter_ini = date(fecha_iter_ini.year + 1, 1, 1)
            else:
                fecha_iter_ini = date(fecha_iter_ini.year, fecha_iter_ini.month + 1, 1)

    # ──────────────────────────────────────────────────────────────────────────
    # 3. RANKINGS (TOP 5)
    # ──────────────────────────────────────────────────────────────────────────
    top_clases_db = db.query(
        Activity.name.label('nombre'),
        func.sum(Activity.price).label('recaudacion')
    ).join(Attendance, Attendance.activity_id == Activity.id).filter(
        Activity.activity_type == 'individual',
        Attendance.status == 'present',
        Attendance.timestamp.between(datetime_inicio, datetime_fin)
    ).group_by(Activity.name).order_by(func.sum(Activity.price).desc()).limit(5).all()

    # Validación de nulos (None) en los Rankings
    top_clases = [{"nombre": c.nombre or "Clase sin nombre", "recaudacion": float(c.recaudacion) if c.recaudacion else 0.0} for c in top_clases_db]

    top_profesores_db = db.query(
        Activity.professor.label('nombre'),
        func.sum(Activity.price).label('recaudacion')
    ).join(Attendance, Attendance.activity_id == Activity.id).filter(
        Activity.activity_type == 'individual',
        Attendance.status == 'present',
        Attendance.timestamp.between(datetime_inicio, datetime_fin)
    ).group_by(Activity.professor).order_by(func.sum(Activity.price).desc()).limit(5).all()

    top_profesores = [{"nombre": p.nombre or "Profesor no asignado", "recaudacion": float(p.recaudacion) if p.recaudacion else 0.0} for p in top_profesores_db]

    # ──────────────────────────────────────────────────────────────────────────
    # 4. EMPAQUETADO FINAL
    # ──────────────────────────────────────────────────────────────────────────
    return {
        "finanzas": {
            "ingresos_totales": ingresos_totales_reales,
            "suscripciones_activas": suscripciones_activas,
            "ingreso_promedio": ingreso_promedio,
            "desglose": {
                "planes": ingresos_planes,
                "individuales": ingresos_individuales,
                "senas": ingresos_senas
            },
            "top_clases": top_clases,
            "top_profesores": top_profesores
        },
        "evolucion_temporal": {
            "granularidad": granularidad_texto,
            "datos": cronologia_lista
        }
    }