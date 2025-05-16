import { SalesReturn } from '../types/sales-return';

export const salesReturnData: SalesReturn[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'John Doe',
    returnNumber: 'SR-001',
    returnDate: '2024-03-16',
    originalOrderId: '1',
    originalOrderNumber: 'SO-001',
    items: [
      {
        productId: '1',
        productName: 'Product A',
        quantity: 1,
        unitPrice: 100.00,
        total: 100.00,
        reason: 'Defective product'
      }
    ],
    subtotal: 100.00,
    tax: 10.00,
    total: 110.00,
    status: 'pending',
    notes: 'Customer reported product defect',
    createdAt: '2024-03-16T10:00:00Z',
    updatedAt: '2024-03-16T10:00:00Z'
  },
  {
    id: '2',
    customerId: '2',
    customerName: 'Jane Smith',
    returnNumber: 'SR-002',
    returnDate: '2024-03-15',
    originalOrderId: '2',
    originalOrderNumber: 'SO-002',
    items: [
      {
        productId: '3',
        productName: 'Product C',
        quantity: 2,
        unitPrice: 75.00,
        total: 150.00,
        reason: 'Wrong size'
      }
    ],
    subtotal: 150.00,
    tax: 15.00,
    total: 165.00,
    status: 'approved',
    createdAt: '2024-03-15T14:30:00Z',
    updatedAt: '2024-03-15T14:30:00Z'
  },
  {
    id: '3',
    customerId: '3',
    customerName: 'Mike Johnson',
    returnNumber: 'SR-003',
    returnDate: '2024-03-14',
    originalOrderId: '3',
    originalOrderNumber: 'SO-003',
    items: [
      {
        productId: '4',
        productName: 'Product D',
        quantity: 1,
        unitPrice: 200.00,
        total: 200.00,
        reason: 'Not as described'
      }
    ],
    subtotal: 200.00,
    tax: 20.00,
    total: 220.00,
    status: 'completed',
    createdAt: '2024-03-14T09:15:00Z',
    updatedAt: '2024-03-14T09:15:00Z'
  }
]; 