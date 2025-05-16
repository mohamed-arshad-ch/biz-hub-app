import { PaymentOut } from '../types/payment-out';

export const paymentOutData: PaymentOut[] = [
  {
    id: '1',
    vendorId: '1',
    vendorName: 'ABC Supplies',
    paymentNumber: 'PO-001',
    paymentDate: '2024-03-16',
    referenceNumber: 'REF-001',
    amount: 1500.00,
    paymentMethod: 'bank_transfer',
    status: 'completed',
    notes: 'Monthly supplies payment',
    createdAt: '2024-03-16T10:00:00Z',
    updatedAt: '2024-03-16T10:00:00Z'
  },
  {
    id: '2',
    vendorId: '2',
    vendorName: 'XYZ Services',
    paymentNumber: 'PO-002',
    paymentDate: '2024-03-15',
    referenceNumber: 'REF-002',
    amount: 2500.00,
    paymentMethod: 'check',
    status: 'pending',
    notes: 'Service fee payment',
    createdAt: '2024-03-15T14:30:00Z',
    updatedAt: '2024-03-15T14:30:00Z'
  },
  {
    id: '3',
    vendorId: '3',
    vendorName: 'Global Imports',
    paymentNumber: 'PO-003',
    paymentDate: '2024-03-14',
    referenceNumber: 'REF-003',
    amount: 5000.00,
    paymentMethod: 'credit_card',
    status: 'draft',
    notes: 'Import payment',
    createdAt: '2024-03-14T09:15:00Z',
    updatedAt: '2024-03-14T09:15:00Z'
  }
]; 