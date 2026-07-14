import api from './api'
import type { StockItem, TransferRequest, AuditLog, BarcodeResult } from '../types/inventory'

export const inventoryService = {
  async getStock(): Promise<StockItem[]> {
    const res = await api.get<StockItem[]>('/stock/')
    return res.data
  },

  async transferStock(data: TransferRequest): Promise<{ message: string }> {
    const res = await api.post<{ message: string }>('/stock/transfer', data)
    return res.data
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await api.get<AuditLog[]>('/stock/audit-logs')
    return res.data
  },

  async sendChatMessage(message: string): Promise<{ response: string }> {
    const res = await api.post<{ response: string }>('/chat/', { message })
    return res.data
  },

  async searchByBarcode(barcode: string): Promise<BarcodeResult[]> {
    const res = await api.post<BarcodeResult[]>('/chat/barcode', { barcode })
    return res.data
  },
}
