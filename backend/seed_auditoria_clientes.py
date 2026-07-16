from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.user_suspension import UserSuspension
from app.models.credit_transaction import CreditTransaction
from app.models.audit_log import AuditLog, AuditType, AuditAction, AuditResult

def seed_auditoria_clientes(db: Session):
    print("⏳ [Auditoría] Generando registros de auditoría de clientes...")

    # 1. Buscamos o creamos un Administrador para asociar como autor de los cambios
    admin = db.query(User).filter(User.role == "admin").first()
    if not admin:
        # Si no existe, creamos un administrador temporal para la auditoría
        admin = User(
            name="Admin",
            lastname="Sistema",
            email="admin@rehabilitar.com",
            password="pwd",
            role="admin",
            account_status="active",
            created_at=datetime(2025, 12, 1)
        )
        db.add(admin)
        db.flush()

    # 2. Traemos todos los clientes creados en la seed de estadísticas
    clientes = db.query(User).filter(User.role == "client").all()

    # ──────────────────────────────────────────────────────────────────────────
    # REGISTRO DE NUEVOS CLIENTES (ACCOUNT -> CREATE)
    # ──────────────────────────────────────────────────────────────────────────
    print(f"⏳ [Auditoría] Procesando {len(clientes)} registros de creación de usuarios...")
    for cliente in clientes:
        # Verificamos si ya existe el log de creación para evitar duplicados
        existe_log = db.query(AuditLog).filter(
            AuditLog.user_id == admin.id,
            AuditLog.action == AuditAction.CREATE,
            AuditLog.detail.like(f"%{cliente.email}%")
        ).first()

        if not existe_log:
            # El timestamp de la auditoría debe coincidir con la creación del usuario
            log_creacion = AuditLog(
                user_id=admin.id,
                type=AuditType.ACCOUNT,
                action=AuditAction.CREATE,
                result=AuditResult.SUCCESS,
                detail=f"El administrador registró al nuevo cliente: {cliente.name} {cliente.lastname} ({cliente.email})",
                timestamp=cliente.created_at
            )
            db.add(log_creacion)
    db.flush()

    # ──────────────────────────────────────────────────────────────────────────
    # REGISTRO DE HISTORIAL DE SUSPENSIONES (SUSPEND_ACCOUNT / REINTEGRATE_ACCOUNT)
    # ──────────────────────────────────────────────────────────────────────────
    # Traemos todas las suspensiones de la base de datos
    suspensiones = db.query(UserSuspension).all()
    print(f"⏳ [Auditoría] Procesando {len(suspensiones)} logs de suspensiones y reintegros...")

    for susp in suspensiones:
        # Recuperamos los datos del cliente asociado a la suspensión
        cliente_asociado = db.query(User).filter(User.id == susp.user_id).first()
        if not cliente_asociado:
            continue

        # A. REGISTRO DE LA SUSPENSIÓN (SUSPEND_ACCOUNT)
        # Verificamos si ya está auditado el bloqueo
        existe_susp = db.query(AuditLog).filter(
            AuditLog.user_id == admin.id,
            AuditLog.action == AuditAction.SUSPEND_ACCOUNT,
            AuditLog.detail.like(f"%id {susp.id}%")
        ).first()

        if not existe_susp:
            motivo_legible = susp.suspension_reason.replace("_", " ").title()
            log_suspension = AuditLog(
                user_id=admin.id,
                type=AuditType.ACCOUNT,
                action=AuditAction.SUSPEND_ACCOUNT,
                result=AuditResult.SUCCESS,
                detail=f"Cuenta suspendida temporalmente. Cliente: {cliente_asociado.name} {cliente_asociado.lastname}. Motivo: {motivo_legible} (susp_id {susp.id})",
                timestamp=susp.suspension_date
            )
            db.add(log_suspension)

        # B. REGISTRO DEL LEVANTAMIENTO DE SUSPENSIÓN / REINTEGRO (REINTEGRATE_ACCOUNT)
        # Si la suspensión ya no está activa (is_active=False) y tiene fecha de reincorporación
        if not susp.is_active and susp.reinstatement_date:
            # Verificamos si ya está auditado el reintegro
            existe_reintegro = db.query(AuditLog).filter(
                AuditLog.user_id == admin.id,
                AuditLog.action == AuditAction.REINTEGRATE_ACCOUNT,
                AuditLog.detail.like(f"%id {susp.id}%")
            ).first()

            if not existe_reintegro:
                log_reintegro = AuditLog(
                    user_id=admin.id,
                    type=AuditType.ACCOUNT,
                    action=AuditAction.REINTEGRATE_ACCOUNT,
                    result=AuditResult.SUCCESS,
                    detail=f"Sanción finalizada. Cuenta reintegrada y activa. Cliente: {cliente_asociado.name} {cliente_asociado.lastname} (susp_id {susp.id})",
                    timestamp=susp.reinstatement_date
                )
                db.add(log_reintegro)
# ──────────────────────────────────────────────────────────────────────────
    # REGISTRO DE TRANSACCIONES DE PAGO (PAYMENT -> SUBSCRIPTION / INDIVIDUAL)
    # ──────────────────────────────────────────────────────────────────────────
    print("⏳ [Auditoría] Sincronizando transacciones de pago con la tabla de auditoría...")
    
    # Traemos todas las transacciones financieras que ya generó seed_estadisticas
    transacciones = db.query(CreditTransaction).all()

    for tx in transacciones:
        cliente_pago = db.query(User).filter(User.id == tx.user_id).first()
        if not cliente_pago:
            continue

        # Clasificamos según la actividad registrada en la transacción
        if tx.activity_type == "plan_purchase":
            accion_tipo = AuditAction.SUBSCRIPTION  # Compra de un plan (Suscripción)
            detalle_txt = f"Pago de suscripción mensual recibido. Cliente: {cliente_pago.name} {cliente_pago.lastname}. Detalle: {tx.reason} - Monto: ${tx.amount:.2f}"
        elif tx.activity_type == "class_reservation":
            accion_tipo = AuditAction.INDIVIDUAL    # Pago/Seña de clase individual
            detalle_txt = f"Pago por reserva de actividad individual procesado. Cliente: {cliente_pago.name} {cliente_pago.lastname}. Clase: {tx.reason} - Monto: ${tx.amount:.2f}"
        else:
            continue

        # Evitamos duplicar el log buscando si ya existe uno con el mismo monto para ese usuario
        existe_pago_log = db.query(AuditLog).filter(
            AuditLog.user_id == cliente_pago.id,
            AuditLog.action == accion_tipo,
            AuditLog.detail.like(f"%Monto: ${tx.amount:.2f}%")
        ).first()

        if not existe_pago_log:
            log_pago = AuditLog(
                user_id=cliente_pago.id,  # El log queda asociado al cliente que pagó
                type=AuditType.PAYMENT,
                action=accion_tipo,
                result=AuditResult.SUCCESS,
                detail=detalle_txt,
                timestamp=tx.created_at
            )
            db.add(log_pago)
            db.flush()


    db.commit()
    print("✅ [Auditoría] Logs de cuentas de clientes sincronizados con éxito.")