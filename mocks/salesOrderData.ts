import { SalesOrder } from '../types/sales-order';

export const salesOrderData: SalesOrder[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'John Doe',
    orderNumber: 'SO-001',
    orderDate: '2024-03-15',
    items: [
      {
        productId: '1',
        productName: 'Product A',
        quantity: 2,
        unitPrice: 100.00,
        total: 200.00
      },
      {
        productId: '2',
        productName: 'Product B',
        quantity: 1,
        unitPrice: 150.00,
        total: 150.00
      }
    ],
    subtotal: 350.00,
    tax: 35.00,
    total: 385.00,
    status: 'confirmed',
    notes: 'Regular order',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z'
  },
  {
    id: '2',
    customerId: '2',
    customerName: 'Jane Smith',
    orderNumber: 'SO-002',
    orderDate: '2024-03-14',
    items: [
      {
        productId: '3',
        productName: 'Product C',
        quantity: 3,
        unitPrice: 75.00,
        total: 225.00
      }
    ],
    subtotal: 225.00,
    tax: 22.50,
    total: 247.50,
    status: 'processing',
    createdAt: '2024-03-14T14:30:00Z',
    updatedAt: '2024-03-14T14:30:00Z'
  },
  {
    id: '3',
    customerId: '3',
    customerName: 'Mike Johnson',
    orderNumber: 'SO-003',
    orderDate: '2024-03-13',
    items: [
      {
        productId: '1',
        productName: 'Product A',
        quantity: 1,
        unitPrice: 100.00,
        total: 100.00
      },
      {
        productId: '4',
        productName: 'Product D',
        quantity: 2,
        unitPrice: 200.00,
        total: 400.00
      }
    ],
    subtotal: 500.00,
    tax: 50.00,
    total: 550.00,
    status: 'draft',
    createdAt: '2024-03-13T09:15:00Z',
    updatedAt: '2024-03-13T09:15:00Z'
  }
]; 