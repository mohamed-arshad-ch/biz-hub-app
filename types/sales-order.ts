export interface SalesOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  customerId: string;
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
  customerId: string;
  orderNumber: string;
  orderDate: string;
  items: SalesOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  notes?: string;
} 