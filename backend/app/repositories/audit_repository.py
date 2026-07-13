import uuid
from typing import Any, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog

class AuditRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_log(
        self,
        action: str,
        user_id: uuid.UUID | None = None,
        organization_id: uuid.UUID | None = None,
        entity_name: str | None = None,
        entity_id: str | None = None,
        details: dict[str, Any] | None = None
    ) -> AuditLog:
        """Inserta un registro de auditoría inmutable."""
        log = AuditLog(
            organization_id=organization_id,
            user_id=user_id,
            action=action,
            entity_name=entity_name,
            entity_id=entity_id,
            details=details or {}
        )
        self.session.add(log)
        await self.session.flush()
        return log

    async def get_logs(
        self,
        limit: int = 100,
        offset: int = 0
    ) -> Sequence[AuditLog]:
        """Obtiene registros de auditoría ordenados descendentemente por marca de tiempo."""
        stmt = (
            select(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
