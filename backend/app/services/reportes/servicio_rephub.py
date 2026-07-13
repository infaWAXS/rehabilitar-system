# app/services/reportes/servicio_rephub.py
from datetime import date, datetime
from sqlalchemy import func, extract, or_
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.user_plan import UserPlan
from app.models.plan import Plan
from app.models.activity import Activity
from app.models.attendance import Attendance
from app.models.room import Room
from app.models.credit_transaction import CreditTransaction

def generar_reporte_hub_service(db: Session, fecha_inicio: date, fecha_fin: date):
    """
    Servicio exclusivo y optimizado para el Hub Estadístico.
    Calcula ingresos combinados, mapas de calor, ocupación base y concurrencia.
    """
    datetime_inicio = datetime.combine(fecha_inicio, datetime.min.time())
    datetime_fin = datetime.combine(fecha_fin, datetime.max.time())
    anio_actual = fecha_inicio.year

    # ──────────────────────────────────────────────────────────────────────────
    # 1. RESUMEN GLOBAL (Tarjetas superiores)
    # ──────────────────────────────────────────────────────────────────────────
    clientes_totales = db.query(func.count(User.id)).filter(User.role == "client").scalar() or 0
    profesores_totales = db.query(func.count(User.id)).filter(User.role == "professor").scalar() or 0

    # Ingresos totales en el rango: Planes (Suscripciones) + Transacciones (Individuales/Señas)
    ingresos_planes_rango = db.query(func.sum(Plan.price)).\
        join(UserPlan, UserPlan.plan_id == Plan.id).\
        filter(UserPlan.start_date.between(fecha_inicio, fecha_fin)).scalar() or 0.0
        
    ingresos_transacciones_rango = db.query(func.sum(CreditTransaction.amount)).\
        filter(CreditTransaction.created_at.between(datetime_inicio, datetime_fin)).scalar() or 0.0
        
    ingresos_totales = float(ingresos_planes_rango) + float(ingresos_transacciones_rango)

    # Cálculo de Ausentismo/Presentismo global en el rango
    total_asistencias = db.query(func.count(Attendance.id)).filter(Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
    total_ausentes = db.query(func.count(Attendance.id)).filter(Attendance.status == 'absent', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
    tasa_ausentismo = round((total_ausentes / total_asistencias * 100), 1) if total_asistencias > 0 else 0.0

   # ──────────────────────────────────────────────────────────────────────────
    # 2. EVOLUCIÓN FINANCIERA MENSUAL (Gráfico de barras de los 12 meses)
    # ──────────────────────────────────────────────────────────────────────────
    cronologia_lista = []
    meses_mapeo = {1:"Ene", 2:"Feb", 3:"Mar", 4:"Abr", 5:"May", 6:"Jun", 7:"Jul", 8:"Ago", 9:"Sep", 10:"Oct", 11:"Nov", 12:"Dic"}
    
    from datetime import timedelta # Aseguramos la importación aquí

    for m in range(1, 13):
        # 1. Definimos dinámicamente el primer y último día del mes iterado
        fecha_ini_mes = date(anio_actual, m, 1)
        if m == 12:
            fecha_fin_mes = date(anio_actual, 12, 31)
        else:
            fecha_fin_mes = date(anio_actual, m + 1, 1) - timedelta(days=1)
            
        # 2. Convertimos a datetime (00:00:00 a 23:59:59) para atrapar las transacciones con hora exacta
        datetime_ini_mes = datetime.combine(fecha_ini_mes, datetime.min.time())
        datetime_fin_mes = datetime.combine(fecha_fin_mes, datetime.max.time())

        # 3. Ingresos por Planes en el mes 'm'
        ingresos_planes_mes = db.query(func.sum(Plan.price)).\
            join(UserPlan, UserPlan.plan_id == Plan.id).\
            filter(UserPlan.start_date.between(fecha_ini_mes, fecha_fin_mes)).\
            scalar() or 0.0
            
        # 4. Ingresos por Transacciones/Señas en el mes 'm'
        ingresos_transacciones_mes = db.query(func.sum(CreditTransaction.amount)).\
            filter(CreditTransaction.created_at.between(datetime_ini_mes, datetime_fin_mes)).\
            scalar() or 0.0

        # Unificamos ambas fuentes de ingresos
        ingresos_mes_total = float(ingresos_planes_mes) + float(ingresos_transacciones_mes)

        cronologia_lista.append({
            "mes_corto": meses_mapeo[m],
            "ingresos_brutos": round(ingresos_mes_total, 2)
        })

    # ──────────────────────────────────────────────────────────────────────────
    # 3. OCUPACIÓN DE SALAS
    # ──────────────────────────────────────────────────────────────────────────
    actividades_infra = db.query(Activity).filter(Activity.status == "active").all()
    actividades_filtradas_infra = []
    for a in actividades_infra:
        if a.specific_date:
            if fecha_inicio <= a.specific_date <= fecha_fin:
                actividades_filtradas_infra.append(a)
        elif a.activity_type == "fixed":
            actividades_filtradas_infra.append(a)

    aulas_lista = []
    todas_las_salas = db.query(Room).order_by(Room.id).all()
    for sala in todas_las_salas:
        acts_sala_global = [a for a in actividades_filtradas_infra if a.room_id == sala.id]
        aulas_lista.append({
            "aula": sala.name,
            "capacidad_maxima": sala.capacity,
            "cantidad_usos": len(acts_sala_global)
        })

    # ──────────────────────────────────────────────────────────────────────────
    # 4. CONCURRENCIA DE PROFESORES
    # ──────────────────────────────────────────────────────────────────────────
    profesores_db_lista = db.query(User).filter(User.role == "professor").all()
    profesores_lista = []
    
    for prof in profesores_db_lista:
        nombre_completo = f"{prof.name} {prof.lastname}".strip()
        actividades_prof = [a for a in actividades_filtradas_infra if a.professor == nombre_completo]
        cantidad_clases = len(actividades_prof)

        total_alumnos = 0
        if cantidad_clases > 0:
            total_alumnos = db.query(func.count(Attendance.id)).filter(
                Attendance.activity_id.in_([a.id for a in actividades_prof]),
                Attendance.timestamp.between(datetime_inicio, datetime_fin)
            ).scalar() or 0

        profesores_lista.append({
            "nombre": nombre_completo,
            "total_alumnos_atendidos": total_alumnos,
            "cantidad_clases_dictadas": cantidad_clases
        })

    # ──────────────────────────────────────────────────────────────────────────
    # 5. MAPA DE CALOR (Concurrencia Alumnos)
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
        
        mapa_calor_datos.append({"dia": dia_n, "horas": horas_alumnos})

    # EMPAQUETADO FINAL EXACTO QUE ESPERA EL HUB
    return {
        "resumen": {
            "clientes_totales": clientes_totales, 
            "profesores_totales": profesores_totales,
            "ingresos_totales": ingresos_totales, 
            "tasa_ausentismo": tasa_ausentismo
        },
        "ocupacion_aulas": aulas_lista, 
        "profesores_mayor_concurrencia": profesores_lista,
        "evolucion_temporal": {
            "datos": cronologia_lista
        },
        "mapa_calor": mapa_calor_datos
    }