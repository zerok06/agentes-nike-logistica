import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_central_db
from app.api.deps.auth import require_roles, get_current_user
from app.schemas.auth import AuthenticatedUser, UserRole
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.audit_repository import AuditRepository

router = APIRouter(
    prefix="/stock",
    tags=["Stock"]
)

# Pydantic Schemas
class InventoryItemResponse(BaseModel):
    inventory_id: uuid.UUID
    sku: str
    product_name: str
    warehouse_name: str
    city: str | None
    stock_qty: int
    min_stock: int
    max_stock: int | None

    class Config:
        from_attributes = True

class TransferRequest(BaseModel):
    product_id: uuid.UUID
    from_warehouse_id: uuid.UUID
    to_warehouse_id: uuid.UUID
    quantity: int = Field(..., gt=0, description="Cantidad a transferir (debe ser mayor a 0)")

class AuditLogResponse(BaseModel):
    audit_id: int
    action: str
    user_email: str | None
    details: dict[str, Any]
    created_at: Any

    class Config:
        from_attributes = True


@router.get("/", response_model=list[InventoryItemResponse])
async def list_stock(
    db: AsyncSession = Depends(get_central_db),
    current_user: AuthenticatedUser = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR))
) -> list[InventoryItemResponse]:
    """Obtiene la lista completa de stock disponible."""
    inv_repo = InventoryRepository(db)
    items = await inv_repo.get_all_inventory()
    
    response = []
    for item in items:
        response.append(
            InventoryItemResponse(
                inventory_id=item.inventory_id,
                sku=item.product.sku,
                product_name=item.product.product_name,
                warehouse_name=item.warehouse.warehouse_name,
                city=item.warehouse.city,
                stock_qty=item.stock_qty,
                min_stock=item.min_stock,
                max_stock=item.max_stock
            )
        )
    return response


@router.post("/transfer")
async def transfer_stock(
    payload: TransferRequest,
    db: AsyncSession = Depends(get_central_db),
    # Solo Administrador y Supervisor pueden modificar stock. Operador recibe 403.
    current_user: AuthenticatedUser = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR))
) -> dict[str, str]:
    """Realiza la transferencia de stock entre almacenes y registra la auditoría (requiere Admin o Supervisor)."""
    inv_repo = InventoryRepository(db)
    audit_repo = AuditRepository(db)
    
    # 1. Verificar stock en origen
    origin_stock = await inv_repo.get_stock(payload.product_id, payload.from_warehouse_id)
    if not origin_stock or origin_stock.stock_qty < payload.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuficiente en el almacén de origen. Disponible: {origin_stock.stock_qty if origin_stock else 0}"
        )
        
    # 2. Descontar en origen
    await inv_repo.update_stock(
        payload.product_id,
        payload.from_warehouse_id,
        origin_stock.stock_qty - payload.quantity
    )
    
    # 3. Incrementar en destino
    dest_stock = await inv_repo.get_stock(payload.product_id, payload.to_warehouse_id)
    dest_qty = (dest_stock.stock_qty if dest_stock else 0) + payload.quantity
    await inv_repo.update_stock(
        payload.product_id,
        payload.to_warehouse_id,
        dest_qty
    )
    
    # 4. Registrar en Auditoría (Detalles en JSONB como requiere el SDD/Prompt)
    audit_details = {
        "product_id": str(payload.product_id),
        "from_warehouse_id": str(payload.from_warehouse_id),
        "to_warehouse_id": str(payload.to_warehouse_id),
        "quantity": payload.quantity,
        "user_email": current_user.email
    }
    
    await audit_repo.create_log(
        action="TRASLADO_CONFIRMADO",
        user_id=uuid.UUID(current_user.subject.replace("demo-", "")) if current_user.is_demo and len(current_user.subject) > 10 else None,
        entity_name="inventory",
        entity_id=str(payload.product_id),
        details=audit_details
    )
    
    await db.commit()
    return {"message": "Transferencia realizada con éxito y registrada en auditoría."}


@router.get("/audit-logs", response_model=list[AuditLogResponse])
async def get_audit_trail(
    db: AsyncSession = Depends(get_central_db),
    # Solo accesible para Admin y Supervisor
    current_user: AuthenticatedUser = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR))
) -> list[AuditLogResponse]:
    """Obtiene el historial inmutable de auditoría (solo Admin y Supervisor)."""
    audit_repo = AuditRepository(db)
    logs = await audit_repo.get_logs()
    
    response = []
    for log in logs:
        # Extraemos el email del usuario desde los detalles o dejamos un default
        user_email = log.details.get("user_email") if log.details else "Sistema"
        response.append(
            AuditLogResponse(
                audit_id=log.audit_id,
                action=log.action,
                user_email=user_email,
                details=log.details or {},
                created_at=log.created_at
            )
        )
    return response
