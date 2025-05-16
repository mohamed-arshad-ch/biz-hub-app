export interface PurchaseReturn {
  id: string;
  vendorId: string;
  vendorName: string;
  returnNumber: string;
  returnDate: string;
  originalOrderId: string;
  originalOrderNumber: string;
  items: PurchaseReturnItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  reason: string;
}

export interface PurchaseReturnFormData {
  vendorId: string;
  returnNumber: string;
  returnDate: string;
  originalOrderId: string;
  originalOrderNumber: string;
  items: PurchaseReturnItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
} 