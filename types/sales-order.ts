export interface SalesOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SalesOrder {
  id: number;
  customerId: number;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: SalesOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderFormData {
  customerId: number;
  orderNumber: string;
  orderDate: string;
  items: SalesOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  notes?: string;
} 