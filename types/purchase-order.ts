export interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  orderNumber: string;
  orderDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrderFormData {
  vendorId: string;
  orderNumber: string;
  orderDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
} 