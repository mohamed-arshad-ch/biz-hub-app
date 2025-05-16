import { PurchaseOrder } from '../types/purchase-order';

export const purchaseOrderData: PurchaseOrder[] = [
  {
    id: '1',
    vendorId: '1',
    vendorName: 'ABC Supplies',
    orderNumber: 'PO-001',
    orderDate: '2024-03-16',
    items: [
      {
        productId: '1',
        productName: 'Office Chair',
        quantity: 5,
        unitPrice: 150.00,
        total: 750.00
      },
      {
        productId: '2',
        productName: 'Desk Lamp',
        quantity: 3,
        unitPrice: 45.00,
        total: 135.00
      }
    ],
    subtotal: 885.00,
    tax: 88.50,
    total: 973.50,
    status: 'completed',
    notes: 'Regular monthly order',
    createdAt: '2024-03-16T10:00:00Z',
    updatedAt: '2024-03-16T10:00:00Z'
  },
  {
    id: '2',
    vendorId: '2',
    vendorName: 'XYZ Services',
    orderNumber: 'PO-002',
    orderDate: '2024-03-15',
    items: [
      {
        productId: '3',
        productName: 'Storage Cabinet',
        quantity: 2,
        unitPrice: 200.00,
        total: 400.00
      }
    ],
    subtotal: 400.00,
    tax: 40.00,
    total: 440.00,
    status: 'pending',
    notes: 'Urgent delivery required',
    createdAt: '2024-03-15T14:30:00Z',
    updatedAt: '2024-03-15T14:30:00Z'
  },
  {
    id: '3',
    vendorId: '3',
    vendorName: 'Global Imports',
    orderNumber: 'PO-003',
    orderDate: '2024-03-14',
    items: [
      {
        productId: '4',
        productName: 'Computer Monitor',
        quantity: 4,
        unitPrice: 300.00,
        total: 1200.00
      }
    ],
    subtotal: 1200.00,
    tax: 120.00,
    total: 1320.00,
    status: 'draft',
    notes: 'To be confirmed',
    createdAt: '2024-03-14T09:15:00Z',
    updatedAt: '2024-03-14T09:15:00Z'
  }
]; 