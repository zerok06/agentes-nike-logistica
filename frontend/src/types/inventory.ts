export interface StockItem {
  inventory_id: number
  sku: string
  product_name: string
  warehouse_name: string
  city: string | null
  stock_qty: number
  min_stock: number
  max_stock: number | null
}

export interface TransferRequest {
  product_id: number
  from_warehouse_id: number
  to_warehouse_id: number
  quantity: number
}

export interface AuditLog {
  audit_id: number
  action: string
  user_email: string | null
  details: {
    product_id?: string
    from_warehouse_id?: string
    to_warehouse_id?: string
    quantity?: number
    user_email?: string
  }
  created_at: string
}

export interface ChatMessage {
  sender: 'user' | 'bot'
  text: string
  timestamp: Date
}
