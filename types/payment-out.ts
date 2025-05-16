export interface PaymentOut {
  id: string;
  vendorId: string;
  vendorName: string;
  paymentNumber: string;
  paymentDate: string;
  referenceNumber: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOutFormData {
  vendorId: string;
  paymentNumber: string;
  paymentDate: string;
  referenceNumber: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
} 