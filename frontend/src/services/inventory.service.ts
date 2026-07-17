import api from './api'
import type { StockItem, AuditLog, BarcodeResult, ProductResponse } from '../types/inventory'

export const inventoryService = {
  async getStock(): Promise<StockItem[]> {
    const res = await api.get<StockItem[]>('/stock/')
    return res.data
  },

  async transferStock(data: any): Promise<{ message: string }> {
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

  async createProduct(data: any): Promise<ProductResponse> {
    const res = await api.post<ProductResponse>('/products/', data)
    return res.data
  },

  async getProducts(search?: string): Promise<any[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    const res = await api.get(`/products/${params}`)
    return res.data
  },

  async getProductDetail(id: number): Promise<any> {
    const res = await api.get(`/products/${id}`)
    return res.data
  },

  async updateProduct(id: number, data: any): Promise<any> {
    const res = await api.put(`/products/${id}`, data)
    return res.data
  },
}
