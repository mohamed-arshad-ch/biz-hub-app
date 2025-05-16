export interface SalesReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  reason: string;
}

export interface SalesReturn {
  id: string;
  customerId: string;
  customerName: string;
  returnNumber: string;
  returnDate: string;
  originalOrderId: string;
  originalOrderNumber: string;
  items: SalesReturnItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesReturnFormData {
  customerId: string;
  returnNumber: string;
  returnDate: string;
  originalOrderId: string;
  originalOrderNumber: string;
  items: SalesReturnItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
} 