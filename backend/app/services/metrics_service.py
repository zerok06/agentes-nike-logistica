import logging
from datetime import datetime, timedelta
from sqlalchemy import select, func, text, case, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.inventory import (
    Inventory, Product, Warehouse, InventoryMovement,
    TransferOrder, Shipment, SalesOrder, SalesOrderItem,
    PurchaseOrder, Route, Category
)

logger = logging.getLogger(__name__)


class MetricsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_summary(self) -> dict:
        total_stock = 0
        critical_count = 0
        total_value = 0.0
        total_products = 0
        total_warehouses = 0

        result = await self.session.execute(
            select(
                func.sum(Inventory.stock_qty).label("total_stock"),
                func.count(Inventory.inventory_id).label("total_items"),
            )
        )
        row = result.first()
        total_stock = int(row.total_stock or 0)

        result = await self.session.execute(
            select(Inventory, Product)
            .join(Product, Inventory.product_id == Product.product_id)
            .options(selectinload(Inventory.warehouse))
        )
        inventories = result.all()
        for inv, prod in inventories:
            if inv.stock_qty < inv.min_stock:
                critical_count += 1
            total_value += inv.stock_qty * float(prod.unit_price)

        result = await self.session.execute(select(func.count(Product.product_id)))
        total_products = result.scalar()

        result = await self.session.execute(select(func.count(Warehouse.warehouse_id)))
        total_warehouses = result.scalar()

        result = await self.session.execute(
            select(func.sum(Inventory.stock_qty)).where(Inventory.stock_qty < Inventory.min_stock)
        )
        critical_units = int(result.scalar() or 0)

        result = await self.session.execute(
            select(func.sum(Inventory.stock_qty)).where(Inventory.stock_qty >= Inventory.min_stock)
        )
        normal_units = int(result.scalar() or 0)

        result = await self.session.execute(
            select(func.count(SalesOrder.sales_order_id)).where(
                SalesOrder.status.in_(["shipped", "delivered"])
            )
        )
        fulfilled_orders = result.scalar()

        result = await self.session.execute(select(func.count(SalesOrder.sales_order_id)))
        total_orders = result.scalar() or 1

        fulfillment_rate = round((fulfilled_orders / total_orders) * 100, 1)

        result = await self.session.execute(
            select(
                func.sum(case((InventoryMovement.movement_type == "salida", InventoryMovement.quantity), else_=0)).label("total_out"),
                func.sum(case((InventoryMovement.movement_type == "entrada", InventoryMovement.quantity), else_=0)).label("total_in"),
            )
        )
        mov_row = result.first()
        total_out = int(mov_row.total_out or 0)
        total_in = int(mov_row.total_in or 0)

        avg_inventory = total_stock if total_stock > 0 else 1
        inventory_turnover = round(total_out / avg_inventory, 2)

        days_of_inventory = round((total_stock / (total_out / 7)) if total_out > 0 else 0, 1)

        result = await self.session.execute(
            select(
                func.count(Shipment.shipment_id).label("total"),
                func.sum(case((Shipment.status == "en_transito", 1), else_=0)).label("in_transit"),
                func.sum(case((Shipment.status == "preparacion", 1), else_=0)).label("prep"),
                func.sum(case((Shipment.status == "entregado", 1), else_=0)).label("delivered"),
            )
        )
        ship_row = result.first()
        total_shipments = int(ship_row.total or 0)
        in_transit = int(ship_row.in_transit or 0)
        prep_shipments = int(ship_row.prep or 0)
        delivered_shipments = int(ship_row.delivered or 0)

        result = await self.session.execute(
            select(
                func.avg(
                    case(
                        (Shipment.estimated_delivery.isnot(None), Shipment.estimated_delivery - Shipment.shipment_date),
                        else_=None
                    )
                ).label("avg_days")
            )
        )
        avg_cycle_days = float(result.scalar() or 0)
        cycle_time_hours = round(avg_cycle_days * 24, 1)

        result = await self.session.execute(
            select(Warehouse.warehouse_id, Warehouse.capacity, func.sum(Inventory.stock_qty))
            .join(Inventory, Inventory.warehouse_id == Warehouse.warehouse_id, isouter=True)
            .group_by(Warehouse.warehouse_id, Warehouse.capacity)
        )
        capacity_total = 0
        capacity_used = 0
        for r in result.all():
            if r.capacity:
                capacity_total += r.capacity
                capacity_used += int(r[2] or 0)
        capacity_utilization = round((capacity_used / capacity_total) * 100, 1) if capacity_total > 0 else 0

        result = await self.session.execute(
            select(func.count(TransferOrder.transfer_id)).where(
                TransferOrder.status.in_(["pending", "approved"])
            )
        )
        pending_transfers = result.scalar()

        result = await self.session.execute(
            select(func.count(Shipment.shipment_id)).where(
                and_(
                    Shipment.estimated_delivery < func.current_date(),
                    Shipment.status != "entregado"
                )
            )
        )
        delayed_shipments = result.scalar()

        service_level = round(((total_orders - 0) / total_orders) * 100, 1) if total_orders > 0 else 100.0

        return {
            "total_stock": total_stock,
            "critical_count": critical_count,
            "critical_units": critical_units,
            "normal_units": normal_units,
            "total_value": round(total_value, 2),
            "total_products": total_products,
            "total_warehouses": total_warehouses,
            "service_level": service_level,
            "inventory_turnover": inventory_turnover,
            "days_of_inventory": days_of_inventory,
            "fulfillment_rate": fulfillment_rate,
            "cycle_time_hours": cycle_time_hours,
            "capacity_utilization": capacity_utilization,
            "total_shipments": total_shipments,
            "in_transit": in_transit,
            "prep_shipments": prep_shipments,
            "delivered_shipments": delivered_shipments,
            "pending_transfers": pending_transfers,
            "delayed_shipments": delayed_shipments,
            "total_movements_in": total_in,
            "total_movements_out": total_out,
        }

    async def get_warehouse_performance(self) -> list[dict]:
        result = await self.session.execute(
            select(
                Warehouse.warehouse_id,
                Warehouse.warehouse_name,
                Warehouse.city,
                Warehouse.capacity,
                func.sum(Inventory.stock_qty).label("stock"),
                func.count(Inventory.inventory_id).label("products"),
                func.sum(case((Inventory.stock_qty < Inventory.min_stock, 1), else_=0)).label("critical"),
            )
            .join(Inventory, Inventory.warehouse_id == Warehouse.warehouse_id, isouter=True)
            .group_by(Warehouse.warehouse_id, Warehouse.warehouse_name, Warehouse.city, Warehouse.capacity)
            .order_by(Warehouse.warehouse_id)
        )
        warehouses = []
        for r in result.all():
            capacity = r.capacity or 1
            stock = int(r.stock or 0)
            utilization = round((stock / capacity) * 100, 1)
            warehouses.append({
                "warehouse_id": r.warehouse_id,
                "warehouse_name": r.warehouse_name,
                "city": r.city,
                "capacity": capacity,
                "total_stock": stock,
                "product_count": int(r.products or 0),
                "critical_count": int(r.critical or 0),
                "utilization": utilization,
            })
        return warehouses

    async def get_movement_trends(self, days: int = 7) -> list[dict]:
        start_date = datetime.utcnow() - timedelta(days=days)
        result = await self.session.execute(
            select(
                InventoryMovement.movement_date,
                InventoryMovement.movement_type,
                InventoryMovement.quantity,
            )
            .where(InventoryMovement.movement_date >= start_date)
            .order_by(InventoryMovement.movement_date)
        )
        movements = result.all()

        from collections import defaultdict
        daily = defaultdict(lambda: {"entrada": 0, "salida": 0, "ajuste": 0, "transferencia": 0})
        for m in movements:
            date_key = m.movement_date.strftime("%Y-%m-%d")
            daily[date_key][m.movement_type] += abs(m.quantity)

        result_list = []
        for i in range(days):
            d = (datetime.utcnow() - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
            data = daily.get(d, {"entrada": 0, "salida": 0, "ajuste": 0, "transferencia": 0})
            result_list.append({
                "date": d,
                "entradas": data["entrada"],
                "salidas": data["salida"],
                "ajustes": data["ajuste"],
                "transferencias": data["transferencia"],
            })
        return result_list

    async def get_top_products(self, limit: int = 10) -> list[dict]:
        result = await self.session.execute(
            select(
                Product.product_id,
                Product.sku,
                Product.product_name,
                Product.unit_price,
                func.sum(Inventory.stock_qty).label("total_stock"),
                func.sum(InventoryMovement.quantity).label("movement_total"),
            )
            .join(Inventory, Inventory.product_id == Product.product_id)
            .outerjoin(InventoryMovement, InventoryMovement.product_id == Product.product_id)
            .group_by(Product.product_id, Product.sku, Product.product_name, Product.unit_price)
            .order_by(func.sum(Inventory.stock_qty).desc())
            .limit(limit)
        )
        products = []
        for r in result.all():
            products.append({
                "product_id": r.product_id,
                "sku": r.sku,
                "product_name": r.product_name,
                "unit_price": float(r.unit_price),
                "total_stock": int(r.total_stock or 0),
                "movement_total": int(abs(r.movement_total or 0)),
                "value": round(int(r.total_stock or 0) * float(r.unit_price), 2),
            })
        return products

    async def get_category_distribution(self) -> list[dict]:
        result = await self.session.execute(
            select(
                Category.name,
                func.count(Product.product_id).label("count"),
                func.sum(Inventory.stock_qty).label("stock"),
            )
            .join(Product, Product.category_id == Category.category_id)
            .join(Inventory, Inventory.product_id == Product.product_id)
            .group_by(Category.name)
            .order_by(func.sum(Inventory.stock_qty).desc())
        )
        categories = []
        for r in result.all():
            categories.append({
                "name": r.name,
                "product_count": int(r.count or 0),
                "total_stock": int(r.stock or 0),
            })
        return categories

    async def get_alerts(self) -> list[dict]:
        alerts = []

        result = await self.session.execute(
            select(Inventory, Product, Warehouse)
            .join(Product, Inventory.product_id == Product.product_id)
            .join(Warehouse, Inventory.warehouse_id == Warehouse.warehouse_id)
            .where(Inventory.stock_qty < Inventory.min_stock)
            .order_by(Inventory.stock_qty.asc())
        )
        for inv, prod, wh in result.all():
            alerts.append({
                "type": "critical_stock",
                "severity": "high",
                "title": f"Stock critico: {prod.product_name}",
                "description": f"{prod.product_name} en {wh.warehouse_name} tiene {inv.stock_qty} unidades (minimo: {inv.min_stock})",
                "warehouse": wh.warehouse_name,
                "product": prod.product_name,
                "sku": prod.sku,
                "current_stock": inv.stock_qty,
                "min_stock": inv.min_stock,
            })

        result = await self.session.execute(
            select(Shipment, Route)
            .outerjoin(Route, Shipment.route_id == Route.route_id)
            .where(
                and_(
                    Shipment.estimated_delivery < func.current_date(),
                    Shipment.status != "entregado"
                )
            )
        )
        for ship, route in result.all():
            alerts.append({
                "type": "delayed_shipment",
                "severity": "high",
                "title": f"Envio retrasado: {ship.tracking_code}",
                "description": f"Envio {ship.tracking_code} via {ship.carrier} estaba programado para {ship.estimated_delivery}",
                "tracking_code": ship.tracking_code,
                "carrier": ship.carrier,
                "estimated_delivery": str(ship.estimated_delivery) if ship.estimated_delivery else None,
            })

        result = await self.session.execute(
            select(TransferOrder, Product)
            .join(Product, TransferOrder.product_id == Product.product_id)
            .where(TransferOrder.status == "pending")
        )
        for transfer, prod in result.all():
            alerts.append({
                "type": "pending_transfer",
                "severity": "medium",
                "title": f"Traslado pendiente: {prod.product_name}",
                "description": f"Traslado de {transfer.quantity} unidades de {prod.product_name} requiere aprobacion",
                "product": prod.product_name,
                "quantity": transfer.quantity,
            })

        return alerts

    async def get_shipment_stats(self) -> dict:
        result = await self.session.execute(
            select(
                Shipment.status,
                func.count(Shipment.shipment_id).label("count"),
            )
            .group_by(Shipment.status)
        )
        by_status = {r.status: int(r.count) for r in result.all()}

        result = await self.session.execute(
            select(
                Shipment.carrier,
                func.count(Shipment.shipment_id).label("count"),
            )
            .where(Shipment.carrier.isnot(None))
            .group_by(Shipment.carrier)
        )
        by_carrier = {r.carrier: int(r.count) for r in result.all()}

        result = await self.session.execute(
            select(
                Route.route_name,
                Route.origin_city,
                Route.destination_city,
                Route.distance_km,
                Route.estimated_hours,
                Route.carrier,
            )
            .where(Route.is_active == True)
        )
        routes = []
        for r in result.all():
            routes.append({
                "route_name": r.route_name,
                "origin": r.origin_city,
                "destination": r.destination_city,
                "distance_km": float(r.distance_km) if r.distance_km else 0,
                "estimated_hours": float(r.estimated_hours) if r.estimated_hours else 0,
                "carrier": r.carrier,
            })

        return {
            "by_status": by_status,
            "by_carrier": by_carrier,
            "routes": routes,
        }

    async def get_stock_by_warehouse(self) -> list[dict]:
        result = await self.session.execute(
            select(
                Warehouse.warehouse_name,
                Warehouse.city,
                func.sum(Inventory.stock_qty).label("total"),
                func.sum(case((Inventory.stock_qty < Inventory.min_stock, 1), else_=0)).label("critical"),
                func.sum(case((Inventory.stock_qty >= Inventory.min_stock, 1), else_=0)).label("normal"),
            )
            .join(Inventory, Inventory.warehouse_id == Warehouse.warehouse_id)
            .group_by(Warehouse.warehouse_id, Warehouse.warehouse_name, Warehouse.city)
            .order_by(func.sum(Inventory.stock_qty).desc())
        )
        warehouses = []
        for r in result.all():
            warehouses.append({
                "name": r.warehouse_name,
                "city": r.city,
                "total": int(r.total or 0),
                "critical": int(r.critical or 0),
                "normal": int(r.normal or 0),
            })
        return warehouses
