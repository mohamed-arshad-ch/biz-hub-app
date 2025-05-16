import { PurchaseReturn } from '../types/purchase-return';

export const purchaseReturnData: PurchaseReturn[] = [
  {
    id: '1',
    vendorId: '1',
    vendorName: 'ABC Supplies',
    returnNumber: 'PR-001',
    returnDate: '2024-03-16',
    originalOrderId: 'PO-001',
    originalOrderNumber: 'PO-001',
    items: [
      {
        productId: '1',
        productName: 'Office Chair',
        quantity: 2,
        unitPrice: 150.00,
        total: 300.00,
        reason: 'Defective product'
      }
    ],
    subtotal: 300.00,
    tax: 30.00,
    total: 330.00,
    status: 'completed',
    notes: 'Returned due to manufacturing defects',
    createdAt: '2024-03-16T10:00:00Z',
    updatedAt: '2024-03-16T10:00:00Z'
  },
  {
    id: '2',
    vendorId: '2',
    vendorName: 'XYZ Services',
    returnNumber: 'PR-002',
    returnDate: '2024-03-15',
    originalOrderId: 'PO-002',
    originalOrderNumber: 'PO-002',
    items: [
      {
        productId: '2',
        productName: 'Desk Lamp',
        quantity: 1,
        unitPrice: 45.00,
        total: 45.00,
        reason: 'Wrong color received'
      }
    ],
    subtotal: 45.00,
    tax: 4.50,
    total: 49.50,
    status: 'pending',
    notes: 'Color mismatch with order',
    createdAt: '2024-03-15T14:30:00Z',
    updatedAt: '2024-03-15T14:30:00Z'
  },
  {
    id: '3',
    vendorId: '3',
    vendorName: 'Global Imports',
    returnNumber: 'PR-003',
    returnDate: '2024-03-14',
    originalOrderId: 'PO-003',
    originalOrderNumber: 'PO-003',
    items: [
      {
        productId: '3',
        productName: 'Storage Cabinet',
        quantity: 1,
        unitPrice: 200.00,
        total: 200.00,
        reason: 'Damaged during shipping'
      }
    ],
    subtotal: 200.00,
    tax: 20.00,
    total: 220.00,
    status: 'draft',
    notes: 'Package arrived damaged',
    createdAt: '2024-03-14T09:15:00Z',
    updatedAt: '2024-03-14T09:15:00Z'
  }
]; 