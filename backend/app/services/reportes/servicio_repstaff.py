# app/services/reportes/servicio_repstaff.py
from datetime import date, datetime, timedelta
from sqlalchemy import func, text, or_
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.activity import Activity
from app.models.attendance import Attendance
import re

def generar_reporte_staff_service(db: Session, fecha_inicio: date, fecha_fin: date):
    datetime_inicio = datetime.combine(fecha_inicio, datetime.min.time())
    datetime_fin = datetime.combine(fecha_fin, datetime.max.time())

# ──────────────────────────────────────────────────────────────────────────
    # 1. LISTADO DE ESPECIALIDADES FIJAS Y RESUMEN (TOP 3 ESPECIALIDADES DINÁMICAS)
    # ──────────────────────────────────────────────────────────────────────────
    # Mantenemos ambos nombres para no romper las referencias inferiores del archivo
    lista_especialidades = ["Tren Superior", "Tren Medio", "Tren Inferior"]
    lista_especialidades_fijas = ["Tren Superior", "Tren Medio", "Tren Inferior"]
    clases_lista = [{"tipo": esp} for esp in lista_especialidades_fijas]

    # Obtenemos la fecha actual para la regla de rango
    fecha_actual = date.today()
    profesores_activos_en_rango = []

    # REGLA: El día de inicio del rango debe ser estrictamente anterior a la fecha actual
    if fecha_inicio < fecha_actual:
        profesores_activos_en_rango = db.query(User).filter(
            User.role == "professor",
            # Comparamos estrictamente a nivel de FECHA (ignorando horas/zonas horarias)
            or_(
                User.created_at.is_(None),
                func.date(User.created_at) <= fecha_fin
            ),
            # Filtro estricto de baja lógica
            or_(
                User.is_deleted == False,
                User.is_deleted.is_(None),
                func.date(User.deleted_at) > fecha_fin # Si fue borrado, la fecha de baja fue posterior al fin del reporte
            )
        ).all()



    # Si no se encontraron profesores válidos, forzamos resumen a None para que el frontend oculte el módulo
    if not profesores_activos_en_rango:
        resumen = None
    else:
        # Buscamos actividades activas en el rango asociadas a estos profesores
        prof_nombres_validos = [f"{p.name} {p.lastname}".strip() for p in profesores_activos_en_rango]
        
        actividades_profesores = db.query(Activity).filter(
            Activity.status == "active",
            Activity.professor.in_(prof_nombres_validos),
            Activity.specialization.isnot(None)
        ).all()

        # Agrupamos profesores únicos por especialidad (evitando duplicar si dictan más de una clase)
        especialidad_profesores = {}
        for act in actividades_profesores:
            esp = act.specialization
            if esp not in especialidad_profesores:
                especialidad_profesores[esp] = set()
            especialidad_profesores[esp].add(act.professor)

        # Mapeamos a una estructura de ranking y ordenamos de mayor a menor para tomar el Top 3
        ranking_especialidades = []
        for esp, profs in especialidad_profesores.items():
            ranking_especialidades.append({
                "especialidad": esp,
                "cantidad_profesores": len(profs)
            })

        ranking_especialidades = sorted(ranking_especialidades, key=lambda x: x["cantidad_profesores"], reverse=True)[:3]

        # Estructuramos el resumen con el ranking dinámico
        resumen = {
            "ranking_especialidades": ranking_especialidades,
            "total_profesores_activos": len(profesores_activos_en_rango)
        }
    # ──────────────────────────────────────────────────────────────────────────
    # 2. CONCURRENCIA Y PERFORMANCE DE PROFESORES
    # ──────────────────────────────────────────────────────────────────────────
    profesores_db_lista = db.query(User).filter(User.role == "professor").all()

    profesores_eliminados = db.query(User).filter(
        User.role == "professor",
        User.is_deleted == True,
        User.deleted_at < datetime_inicio
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
            total_presentes_prof_global = db.query(func.count(Attendance.id)).filter(Attendance.activity_id.in_(ids_actividades), Attendance.status == 'present', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
            total_ausentes_prof_global = db.query(func.count(Attendance.id)).filter(Attendance.activity_id.in_(ids_actividades), Attendance.status == 'absent', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0

        capacidad_total_prof_global = sum([a.capacity for a in actividades_filtradas_prof])
        anotados_totales_global = total_presentes_prof_global + total_ausentes_prof_global
        uso_cupos_global = round(min((anotados_totales_global / capacidad_total_prof_global * 100), 100), 1) if capacidad_total_prof_global > 0 else 0.0

        por_especialidad_prof = {}
        for esp in lista_especialidades:
            acts_prof_esp = [a for a in actividades_filtradas_prof if a.specialization == esp]
            cantidad_clases_esp = len(acts_prof_esp)
            total_presentes_prof_esp = 0
            total_ausentes_prof_esp = 0
            
            if acts_prof_esp:
                ids_esp = [a.id for a in acts_prof_esp]
                total_presentes_prof_esp = db.query(func.count(Attendance.id)).filter(Attendance.activity_id.in_(ids_esp), Attendance.status == 'present', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0
                total_ausentes_prof_esp = db.query(func.count(Attendance.id)).filter(Attendance.activity_id.in_(ids_esp), Attendance.status == 'absent', Attendance.timestamp.between(datetime_inicio, datetime_fin)).scalar() or 0

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
    # 3. RETENCIÓN REAL POR SESIONES (AGRUPADO POR NOMBRE DE CLASE)
    # ──────────────────────────────────────────────────────────────────────────
    retencion_lista = []
    
    # 1. Agrupamos por nombre de clase y profesor (ignoramos IDs individuales)
    clases_unicas = db.query(
        Activity.name, 
        Activity.professor, 
        Activity.specialization
    ).filter(
        Activity.status == "active",
        Activity.name.isnot(None),
        Activity.name != ""
    ).distinct().all()

    for c_name, c_prof, c_esp in clases_unicas:
        # 2. Buscamos todas las fechas en las que se tomó asistencia para esta combinación exacta
        query_fechas = db.query(func.date(Attendance.timestamp)).join(
            Activity, Attendance.activity_id == Activity.id
        ).filter(
            Activity.name == c_name,
            Activity.professor == c_prof,
            Activity.status == "active"
        ).group_by(func.date(Attendance.timestamp)).order_by(func.date(Attendance.timestamp).desc()).all()
        
        fechas_clase = []
        for f in query_fechas:
            if f[0]:
                val = f[0]
                if isinstance(val, str):
                    try:
                        val = datetime.strptime(val, "%Y-%m-%d").date()
                    except ValueError:
                        continue
                elif isinstance(val, datetime):
                    val = val.date()
                fechas_clase.append(val)
                
        # 3. Filtramos para ver si al menos una clase cayó en el rango seleccionado
        fechas_en_rango = [f for f in fechas_clase if fecha_inicio <= f <= fecha_fin]
        
        if not fechas_en_rango:
            continue
            
        # 4. Tomamos la clase más reciente que cayó en el rango
        idx = fechas_clase.index(fechas_en_rango[0])
        
        # 5. Extraemos hasta 4 sesiones hacia atrás, validando la "distancia temporal"
        MAX_DIAS_BRECHA = 40 # Si pasan más de 40 días entre una clase y la anterior, se corta la racha
        
        sesiones_validas = [fechas_clase[idx]]
        
        for i in range(idx + 1, min(idx + 4, len(fechas_clase))):
            fecha_actual = sesiones_validas[-1]
            fecha_anterior = fechas_clase[i]
            
            # Validamos que no sea una clase del año pasado con el mismo nombre
            diferencia_dias = (fecha_actual - fecha_anterior).days
            if diferencia_dias > MAX_DIAS_BRECHA:
                break # Rompemos el ciclo, no sumamos más clases antiguas
                
            sesiones_validas.append(fecha_anterior)
            
        sesiones_validas.reverse() # Invertimos para orden cronológico (Sesión 1 -> 2 -> 3 -> 4)
        
        # REGLA DE NEGOCIO: Exigimos al menos 2 sesiones para medir retención
        if len(sesiones_validas) < 2:
            continue
            
        sesiones_data = []
        for d in sesiones_validas:
            # Contamos los presentes de ese día sumando todos los IDs que compartan el nombre
            count = db.query(func.count(Attendance.id)).join(
                Activity, Attendance.activity_id == Activity.id
            ).filter(
                Activity.name == c_name,
                Activity.professor == c_prof,
                Attendance.status == 'present',
                func.date(Attendance.timestamp) == str(d) 
            ).scalar() or 0
            
            in_range = (fecha_inicio <= d <= fecha_fin)
            sesiones_data.append({
                "fecha": d.strftime("%d/%m"),
                "presentes": count,
                "in_range": in_range
            })
            
        # Rellenamos con nulos a la izquierda si hubo menos de 4 clases en la racha
        while len(sesiones_data) < 4:
            sesiones_data.insert(0, None)
            
        retencion_lista.append({
            "profesor": c_prof if c_prof else "Sin asignar",
            "clase": c_name,
            "especialidad": c_esp or "General",
            "sesiones": sesiones_data
        })

    # ──────────────────────────────────────────────────────────────────────────
    # 4. ABSENTISMO DEL STAFF (Basado en audit_logs con Fecha Actividad)
    # ──────────────────────────────────────────────────────────────────────────
    absentismo_lista = []
    try:
        query_audit = text("""
            SELECT user_id, action, detail, timestamp 
            FROM audit_logs 
            WHERE type = 'ACTIVITY' 
            AND action IN ('CLAIM_ACTIVITY', 'RESIGN_ACTIVITY')
            AND timestamp >= :start AND timestamp <= :end
            ORDER BY timestamp ASC
        """)
        result_audit = db.execute(query_audit, {"start": datetime_inicio, "end": datetime_fin}).fetchall()
        
        tracking_faltas = {}
        
        # Pre-cargamos especialidades y FECHAS DE ACTIVIDAD para join rápido
        actividades_info = db.query(Activity.id, Activity.specialization, Activity.specific_date, Activity.schedule).all()
        act_info_map = {}
        for a in actividades_info:
            # Si es específica guardamos su fecha, si es fija guardamos su horario/cronograma
            fecha_act = a.specific_date.strftime("%d/%m/%Y") if a.specific_date else (str(a.schedule) if a.schedule else "Fija")
            act_info_map[str(a.id)] = {
                "specialization": a.specialization or "General",
                "fecha_actividad": fecha_act
            }

        for row in result_audit:
            u_id = row.user_id if hasattr(row, 'user_id') else row[0]
            action = row.action if hasattr(row, 'action') else row[1]
            detail = row.detail if hasattr(row, 'detail') else row[2]
            ts = row.timestamp if hasattr(row, 'timestamp') else row[3]

            match = re.search(r"actividad '(.*?)' \(id (\d+)\)", detail)
            if match:
                act_name = match.group(1)
                act_id = match.group(2)
                key = (u_id, act_id)

                prof_match = re.search(r"Profesor (.*?) (asumió|renunció)", detail)
                prof_name = prof_match.group(1) if prof_match else f"ID {u_id}"

                info = act_info_map.get(str(act_id), {"specialization": "General", "fecha_actividad": "Desconocida"})

                tracking_faltas[key] = {
                    "profesor": prof_name,
                    "clase": act_name,
                    "especialidad": info["specialization"],
                    "fecha_actividad": info["fecha_actividad"],
                    "last_action": action,
                    "fecha": ts.strftime("%Y-%m-%d %H:%M:%S") if isinstance(ts, datetime) else str(ts)
                }

        for key, data in tracking_faltas.items():
            if data["last_action"] == 'RESIGN_ACTIVITY':
                absentismo_lista.append({
                    "profesor": data["profesor"],
                    "clase": data["clase"],
                    "especialidad": data["especialidad"],
                    "fecha_actividad": data["fecha_actividad"],
                    "fecha_baja": data["fecha"]
                })
    except Exception as e:
        print(f"Error procesando audit_logs para absentismo: {e}")

    # ──────────────────────────────────────────────────────────────────────────
    # 5. EMPAQUETADO FINAL
    # ──────────────────────────────────────────────────────────────────────────
    return {
        "resumen": resumen,  # Mantiene de forma limpia el valor calculado arriba (será dict o None)
        "clases_lista": clases_lista,
        "profesores_mayor_concurrencia": profesores_lista,
        "profesores_eliminados": [{"nombre": f"{p.name} {p.lastname}".strip(), "fecha_baja": p.deleted_at} for p in profesores_eliminados],
        "retencion": retencion_lista,
        "absentismo": absentismo_lista
    }