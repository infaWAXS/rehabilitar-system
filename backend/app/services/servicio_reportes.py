from datetime import date, datetime
from sqlalchemy import func
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
    # CONSULTA 1: RESUMEN
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

    # ──────────────────────────────────────────────────────────────────────────
    # CONSULTA 2: CLASES (Separando la métrica por tipos existentes)
    # ──────────────────────────────────────────────────────────────────────────
    # Primero obtenemos las especialidades que tienen movimiento
    especialidades = db.query(Activity.specialization).distinct().filter(Activity.specialization.isnot(None)).all()
    
    clases_lista = []
    for (esp,) in especialidades:
        if not esp:
            continue
            
        # Asistencias pasadas
        asist_fijas = db.query(func.count(Attendance.id)).join(Activity).\
            filter(Activity.specialization == esp, Activity.activity_type == 'fixed', Attendance.status == 'present', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
            
        asist_indiv = db.query(func.count(Attendance.id)).join(Activity).\
            filter(Activity.specialization == esp, Activity.activity_type == 'individual', Attendance.status == 'present', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0

        # Cancelaciones pasadas
        canc_fijas = db.query(func.count(Attendance.id)).join(Activity).\
            filter(Activity.specialization == esp, Activity.activity_type == 'fixed', Attendance.status == 'absent', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
            
        canc_indiv = db.query(func.count(Attendance.id)).join(Activity).\
            filter(Activity.specialization == esp, Activity.activity_type == 'individual', Attendance.status == 'absent', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0

        # Cantidad de clases ofertadas en el periodo
        cant_fijas = db.query(func.count(Activity.id)).\
            filter(Activity.specialization == esp, Activity.activity_type == 'fixed', Activity.status == 'active').scalar() or 0
            
        cant_indiv = db.query(func.count(Activity.id)).\
            filter(Activity.specialization == esp, Activity.activity_type == 'individual', Activity.specific_date.between(fecha_inicio, fecha_fin)).scalar() or 0

        clases_lista.append({
            "tipo": esp,
            "asistencias_fijas": asist_fijas,
            "asistencias_individuales": asist_indiv,
            "cant_fijas": cant_fijas,
            "cant_individuales": cant_indiv,
            "cancelaciones_fijas": canc_fijas,
            "cancelaciones_individuales": canc_indiv
        })

    # ──────────────────────────────────────────────────────────────────────────
    # CONSULTA 3: OCUPACIÓN DE AULAS
    # ──────────────────────────────────────────────────────────────────────────
    aulas = db.query(Room).all()
    aulas_lista = []
    
    for aula in aulas:
        total_anotados = db.query(func.count(Attendance.id)).join(Activity).\
            filter(Activity.room_id == aula.id, Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
            
        capacidad_ofertada = db.query(func.sum(Activity.capacity)).\
            join(Attendance, Attendance.activity_id == Activity.id).\
            filter(Activity.room_id == aula.id, Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0

        porcentaje = (total_anotados / capacidad_ofertada * 100) if capacidad_ofertada > 0 else 0.0
        
        aulas_lista.append({
            "aula": aula.name,
            "porcentaje_ocupacion": round(porcentaje, 2)
        })

    # ──────────────────────────────────────────────────────────────────────────
    # CONSULTA 4: PROFESORES Y CONCURRENCIA
    # ──────────────────────────────────────────────────────────────────────────
    profesores_nombres = db.query(Activity.professor).distinct().\
        filter(Activity.professor.isnot(None), Activity.professor != "").all()
        
    profesores_lista = []
    for (prof_nombre,) in profesores_nombres:
        alumnos_atendidos = db.query(func.count(Attendance.id)).join(Activity).\
            filter(Activity.professor == prof_nombre, Attendance.status == 'present', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
            
        cancelaciones_recibidas = db.query(func.count(Attendance.id)).join(Activity).\
            filter(Activity.professor == prof_nombre, Attendance.status == 'absent', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
            
        total_reservas = db.query(func.count(Attendance.id)).join(Activity).\
            filter(Activity.professor == prof_nombre, Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
            
        capacidad_total = db.query(func.sum(Activity.capacity)).\
            join(Attendance, Attendance.activity_id == Activity.id).\
            filter(Activity.professor == prof_nombre, Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0

        ocupacion = (total_reservas / capacidad_total * 100) if capacidad_total > 0 else 0.0

        profesores_lista.append({
            "nombre": prof_nombre,
            "total_alumnos_atendidos": alumnos_atendidos,
            "total_cancelaciones_recibidas": cancelaciones_recibidas,
            "porcentaje_ocupacion_clases": round(ocupacion, 2)
        })

    # Ordenar profesores por mayor concurrencia
    profesores_lista.sort(key=lambda x: x["total_alumnos_atendidos"], reverse=True)

    # ──────────────────────────────────────────────────────────────────────────
    # RETORNO ESTRUCTURADO FINAL
    # ──────────────────────────────────────────────────────────────────────────
    return {
        "resumen": {
            "nuevos_registros": nuevos_registros,
            "ingresos_totales": float(ingresos_totales),
            "clientes_suspendidos": clientes_suspendidos
        },
        "clase": clases_lista,
        "ocupacion_aulas": aulas_lista,
        "profesores_mayor_concurrencia": profesores_lista
    }