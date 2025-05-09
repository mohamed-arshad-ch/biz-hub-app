export interface SaleItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  amountPaid: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}