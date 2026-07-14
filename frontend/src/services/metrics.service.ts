import api from './api'
import type {
  MetricsSummary,
  WarehousePerformance,
  MovementTrend,
  TopProduct,
  CategoryDistribution,
  Alert,
  ShipmentStats,
  StockByWarehouse,
} from '../types/metrics'

export const metricsService = {
  async getSummary(): Promise<MetricsSummary> {
    const res = await api.get<MetricsSummary>('/metrics/summary')
    return res.data
  },

  async getWarehousePerformance(): Promise<WarehousePerformance[]> {
    const res = await api.get<WarehousePerformance[]>('/metrics/warehouse-performance')
    return res.data
  },

  async getTrends(days: number = 7): Promise<MovementTrend[]> {
    const res = await api.get<MovementTrend[]>(`/metrics/trends?days=${days}`)
    return res.data
  },

  async getTopProducts(limit: number = 10): Promise<TopProduct[]> {
    const res = await api.get<TopProduct[]>(`/metrics/top-products?limit=${limit}`)
    return res.data
  },

  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    const res = await api.get<CategoryDistribution[]>('/metrics/category-distribution')
    return res.data
  },

  async getAlerts(): Promise<Alert[]> {
    const res = await api.get<Alert[]>('/metrics/alerts')
    return res.data
  },

  async getShipmentStats(): Promise<ShipmentStats> {
    const res = await api.get<ShipmentStats>('/metrics/shipments')
    return res.data
  },

  async getStockByWarehouse(): Promise<StockByWarehouse[]> {
    const res = await api.get<StockByWarehouse[]>('/metrics/stock-by-warehouse')
    return res.data
  },

  async exportCSV(type: 'inventory' | 'logistics' | 'all' = 'all'): Promise<Blob> {
    const res = await api.get(`/metrics/export/csv?type=${type}`, {
      responseType: 'blob',
    })
    return res.data
  },
}
