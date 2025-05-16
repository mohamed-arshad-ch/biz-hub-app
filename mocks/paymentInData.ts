import { PaymentIn } from '../types/payment-in';

export const paymentInData: PaymentIn[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'John Doe',
    amount: 1500.00,
    paymentDate: '2024-03-15',
    paymentMethod: 'Bank Transfer',
    referenceNumber: 'TRX123456',
    notes: 'Payment for invoice #INV001',
    status: 'completed',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z'
  },
  {
    id: '2',
    customerId: '2',
    customerName: 'Jane Smith',
    amount: 2500.00,
    paymentDate: '2024-03-14',
    paymentMethod: 'Cash',
    notes: 'Advance payment',
    status: 'completed',
    createdAt: '2024-03-14T14:30:00Z',
    updatedAt: '2024-03-14T14:30:00Z'
  },
  {
    id: '3',
    customerId: '3',
    customerName: 'Mike Johnson',
    amount: 3000.00,
    paymentDate: '2024-03-13',
    paymentMethod: 'Credit Card',
    referenceNumber: 'CC789012',
    status: 'pending',
    createdAt: '2024-03-13T09:15:00Z',
    updatedAt: '2024-03-13T09:15:00Z'
  }
]; 