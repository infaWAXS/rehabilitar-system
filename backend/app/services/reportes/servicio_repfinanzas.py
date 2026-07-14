# app/services/reportes/servicio_repfinanzas.py
import calendar
from datetime import date, datetime, timedelta
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.user_plan import UserPlan
from app.models.plan import Plan
from app.models.activity import Activity
from app.models.reservation import Reservation

def generar_reporte_financiero_service(db: Session, fecha_inicio: date, fecha_fin: date):
    datetime_inicio = datetime.combine(fecha_inicio, datetime.min.time())
    datetime_fin = datetime.combine(fecha_fin, datetime.max.time())

    # Obtenemos las especialidades disponibles para el filtro
    especialidades_db = db.query(Activity.specialization).distinct().filter(Activity.specialization.isnot(None)).all()
    lista_especialidades = [esp[0] for esp in especialidades_db if esp[0]]

    # ──────────────────────────────────────────────────────────────────────────
    # EXPRESIÓN MATEMÁTICA CENTRAL PARA EL CÁLCULO DE INGRESOS POR RESERVA
    # ──────────────────────────────────────────────────────────────────────────
    monto_reserva_expr = case(
        (Reservation.payment_status.in_(['paid', 'completed']), Activity.price),
        (Reservation.payment_status == 'partial', Activity.price * (func.coalesce(Reservation.deposit_percent, 0) / 100.0)),
        else_=0.0
    )

    # ──────────────────────────────────────────────────────────────────────────
    # 1. TARJETAS DE RESUMEN Y DESGLOSE GLOBAL
    # ──────────────────────────────────────────────────────────────────────────
    suscripciones_activas = db.query(func.count(UserPlan.id)).filter(
        UserPlan.start_date <= fecha_fin,
        UserPlan.end_date >= fecha_inicio
    ).scalar() or 0

    clientes_activos = db.query(func.count(User.id)).filter(
        User.role == 'client',
        User.account_status == 'active'
    ).scalar() or 0

    ingresos_planes_db = db.query(func.sum(Plan.price)).join(UserPlan, UserPlan.plan_id == Plan.id).filter(
        UserPlan.start_date.between(fecha_inicio, fecha_fin)
    ).scalar()
    ingresos_planes = float(ingresos_planes_db) if ingresos_planes_db else 0.0
        
    # FIX: Se cambia reservation_date por created_at (Contabilidad de Caja)
    ingresos_individuales_db = db.query(func.sum(monto_reserva_expr)).select_from(Reservation).join(Activity, Reservation.activity_id == Activity.id).filter(
        Reservation.status != 'cancelled',
        Reservation.payment_status.in_(['paid', 'completed']),
        Reservation.created_at.between(datetime_inicio, datetime_fin)
    ).scalar()
    ingresos_individuales = float(ingresos_individuales_db) if ingresos_individuales_db else 0.0
        
    # FIX: Se cambia reservation_date por created_at (Contabilidad de Caja)
    ingresos_senas_db = db.query(func.sum(monto_reserva_expr)).select_from(Reservation).join(Activity, Reservation.activity_id == Activity.id).filter(
        Reservation.status != 'cancelled',
        Reservation.payment_status == 'partial',
        Reservation.created_at.between(datetime_inicio, datetime_fin)
    ).scalar()
    ingresos_senas = float(ingresos_senas_db) if ingresos_senas_db else 0.0

    ingresos_totales_reales = ingresos_planes + ingresos_individuales + ingresos_senas
    ingreso_promedio = (ingresos_totales_reales / clientes_activos) if clientes_activos > 0 else 0.0

    ing_indiv_global_esp_db = db.query(
        Activity.specialization, func.sum(monto_reserva_expr)
    ).select_from(Reservation).join(Activity, Reservation.activity_id == Activity.id).filter(
        Reservation.status != 'cancelled',
        Reservation.created_at.between(datetime_inicio, datetime_fin)
    ).group_by(Activity.specialization).all()
    
    ingresos_individuales_por_esp = {e[0] or "General": float(e[1] or 0.0) for e in ing_indiv_global_esp_db}

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

            ing_planes_dia_db = db.query(func.sum(Plan.price)).join(UserPlan, UserPlan.plan_id == Plan.id).filter(UserPlan.start_date == dia_evaluado).scalar()
            ing_planes_dia = float(ing_planes_dia_db) if ing_planes_dia_db else 0.0

            ing_indiv_dia_db = db.query(func.sum(monto_reserva_expr)).select_from(Reservation).join(Activity, Reservation.activity_id == Activity.id).filter(
                Reservation.status != 'cancelled', 
                Reservation.created_at.between(dt_ini, dt_fin)
            ).scalar()
            ing_indiv_dia = float(ing_indiv_dia_db) if ing_indiv_dia_db else 0.0

            ing_esp_dia_db = db.query(Activity.specialization, func.sum(monto_reserva_expr)).select_from(Reservation).join(Activity, Reservation.activity_id == Activity.id).filter(
                Reservation.status != 'cancelled', 
                Reservation.created_at.between(dt_ini, dt_fin)
            ).group_by(Activity.specialization).all()
            ing_esp_dia = {e[0] or "General": float(e[1] or 0.0) for e in ing_esp_dia_db}

            cronologia_lista.append({
                "mes_corto": f"{dia_evaluado.day} {meses_mapeo[dia_evaluado.month]}",
                "ingresos_brutos": ing_planes_dia + ing_indiv_dia,
                "por_especialidad": ing_esp_dia
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

            ing_indiv_mes_db = db.query(func.sum(monto_reserva_expr)).select_from(Reservation).join(Activity, Reservation.activity_id == Activity.id).filter(
                Reservation.status != 'cancelled', 
                Reservation.created_at.between(dt_ini, dt_fin)
            ).scalar()
            ing_indiv_mes = float(ing_indiv_mes_db) if ing_indiv_mes_db else 0.0

            ing_esp_mes_db = db.query(Activity.specialization, func.sum(monto_reserva_expr)).select_from(Reservation).join(Activity, Reservation.activity_id == Activity.id).filter(
                Reservation.status != 'cancelled', 
                Reservation.created_at.between(dt_ini, dt_fin)
            ).group_by(Activity.specialization).all()
            ing_esp_mes = {e[0] or "General": float(e[1] or 0.0) for e in ing_esp_mes_db}

            cronologia_lista.append({
                "mes_corto": f"{meses_mapeo[fecha_iter_ini.month]} {str(fecha_iter_ini.year)[2:]}",
                "ingresos_brutos": ing_planes_mes + ing_indiv_mes,
                "por_especialidad": ing_esp_mes
            })

            if fecha_iter_ini.month == 12:
                fecha_iter_ini = date(fecha_iter_ini.year + 1, 1, 1)
            else:
                fecha_iter_ini = date(fecha_iter_ini.year, fecha_iter_ini.month + 1, 1)

   # ──────────────────────────────────────────────────────────────────────────
    # 3. RANKINGS DE RECAUDACIÓN (BASADO EN INGRESOS DE RESERVAS)
    # ──────────────────────────────────────────────────────────────────────────
    todas_clases_db = db.query(
        Activity.name.label('nombre'),
        Activity.specialization.label('especialidad'),
        func.sum(monto_reserva_expr).label('recaudacion')
    ).select_from(Reservation).join(Activity, Reservation.activity_id == Activity.id).filter(
        Reservation.status != 'cancelled',
        Reservation.created_at.between(datetime_inicio, datetime_fin)
    ).group_by(Activity.name, Activity.specialization).all()

    todas_clases = [{"nombre": c.nombre or "Clase", "especialidad": c.especialidad or "General", "recaudacion": float(c.recaudacion or 0.0)} for c in todas_clases_db]

    # FIX: Se agregan filtros explícitos para ignorar actividades sin profesor asignado
    todos_profesores_db = db.query(
        Activity.professor.label('nombre'),
        Activity.specialization.label('especialidad'),
        func.sum(monto_reserva_expr).label('recaudacion')
    ).select_from(Reservation).join(Activity, Reservation.activity_id == Activity.id).filter(
        Reservation.status != 'cancelled',
        Reservation.created_at.between(datetime_inicio, datetime_fin),
        Activity.professor.isnot(None),  # Ignora los nulos
        Activity.professor != ""         # Ignora los strings vacíos
    ).group_by(Activity.professor, Activity.specialization).all()

    # Ya no hace falta el 'or "Profesor"' porque garantizamos que siempre hay un nombre real
    todos_profesores = [{"nombre": p.nombre, "especialidad": p.especialidad or "General", "recaudacion": float(p.recaudacion or 0.0)} for p in todos_profesores_db]

    # ──────────────────────────────────────────────────────────────────────────
    # 4. EMPAQUETADO FINAL
    # ──────────────────────────────────────────────────────────────────────────
    return {
        "especialidades": lista_especialidades,
        "finanzas": {
            "ingresos_totales": ingresos_totales_reales,
            "suscripciones_activas": suscripciones_activas,
            "ingreso_promedio": ingreso_promedio,
            "desglose": {
                "planes": ingresos_planes,
                "individuales": ingresos_individuales,
                "individuales_por_especialidad": ingresos_individuales_por_esp,
                "senas": ingresos_senas
            },
            "todas_clases": todas_clases,
            "todos_profesores": todos_profesores
        },
        "evolucion_temporal": {
            "granularidad": granularidad_texto,
            "datos": cronologia_lista
        }
    }