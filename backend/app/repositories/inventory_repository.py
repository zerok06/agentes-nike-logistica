import uuid
from typing import Sequence
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.inventory import Inventory, Product, Warehouse, ProductEmbedding

class InventoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_inventory(self, limit: int = 100, offset: int = 0) -> Sequence[Inventory]:
        """Obtiene todo el inventario con sus relaciones cargadas."""
        stmt = (
            select(Inventory)
            .options(
                selectinload(Inventory.product),
                selectinload(Inventory.warehouse)
            )
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_inventory_by_warehouse(self, warehouse_id: uuid.UUID) -> Sequence[Inventory]:
        """Obtiene el inventario de un almacén específico."""
        stmt = (
            select(Inventory)
            .where(Inventory.warehouse_id == warehouse_id)
            .options(selectinload(Inventory.product))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_stock(self, product_id: uuid.UUID, warehouse_id: uuid.UUID) -> Inventory | None:
        """Obtiene el registro de inventario para un producto y almacén específico."""
        stmt = (
            select(Inventory)
            .where(
                Inventory.product_id == product_id,
                Inventory.warehouse_id == warehouse_id
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def search_similar_products(self, query_vector: list[float], limit: int = 5) -> Sequence[ProductEmbedding]:
        """Busca productos similares semánticamente utilizando pgvector."""
        # cosine_distance se ordena de menor a mayor (menor distancia = mayor similitud)
        stmt = (
            select(ProductEmbedding)
            .options(selectinload(ProductEmbedding.product))
            .order_by(ProductEmbedding.description_vector.cosine_distance(query_vector))
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update_stock(self, product_id: uuid.UUID, warehouse_id: uuid.UUID, quantity: int) -> Inventory:
        """Actualiza el stock directo o crea el registro si no existe."""
        db_inventory = await self.get_stock(product_id, warehouse_id)
        if db_inventory:
            db_inventory.stock_qty = quantity
        else:
            # Obtener organización del producto para mantener consistencia
            product_stmt = select(Product.organization_id).where(Product.product_id == product_id)
            product_org = (await self.session.execute(product_stmt)).scalar_one()
            
            db_inventory = Inventory(
                organization_id=product_org,
                product_id=product_id,
                warehouse_id=warehouse_id,
                stock_qty=quantity
            )
            self.session.add(db_inventory)
        
        await self.session.flush()
        return db_inventory
