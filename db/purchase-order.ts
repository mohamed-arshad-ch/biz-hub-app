import { db } from './index';
import { purchaseOrders, purchaseOrderItems, transactions, type NewPurchaseOrder, type NewPurchaseOrderItem } from './schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { createPurchaseOrderTransaction, updateTransaction } from './transaction';

export const createPurchaseOrder = async (order: NewPurchaseOrder, items: NewPurchaseOrderItem[]) => {
  try {
    const result = await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(purchaseOrders).values(order).returning();
      const orderItems = items.map(item => ({ ...item, orderId: newOrder.id }));
      await tx.insert(purchaseOrderItems).values(orderItems);

      // Create a transaction record
      await createPurchaseOrderTransaction(
        order.userId,
        newOrder.id,
        order.total,
        order.orderDate,
        order.notes || undefined,
        order.status || 'draft'
      );

      return newOrder;
    });
    return result;
  } catch (error) {
    console.error('Error creating purchase order:', error);
    throw error;
  }
};

export const getPurchaseOrders = async (userId: number, sort: 'newest' | 'oldest' = 'newest') => {
  try {
    const orders = await db.select().from(purchaseOrders)
      .where(eq(purchaseOrders.userId, userId))
      .orderBy(sort === 'newest' ? desc(purchaseOrders.createdAt) : asc(purchaseOrders.createdAt));
    return orders;
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    throw error;
  }
};

export const getPurchaseOrderById = async (id: number, userId: number) => {
  try {
    const [order] = await db.select().from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
    if (!order) return null;
    
    const items = await db.select().from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.orderId, id));
      
    return { ...order, items };
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    throw error;
  }
};

export const updatePurchaseOrder = async (
  id: number,
  userId: number,
  order: Partial<NewPurchaseOrder>,
  items?: NewPurchaseOrderItem[]
) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the current order to check for changes
      const [currentOrder] = await tx.select().from(purchaseOrders)
        .where(
          and(
            eq(purchaseOrders.id, id),
            eq(purchaseOrders.userId, userId)
          )
        );

      if (!currentOrder) {
        throw new Error('Purchase order not found');
      }

      // Update order
      await tx.update(purchaseOrders)
        .set({ ...order, updatedAt: new Date().toISOString() })
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));

      if (items) {
        // Delete old items
        await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, id));
        // Insert new items
        const orderItems = items.map(item => ({ ...item, orderId: id }));
        await tx.insert(purchaseOrderItems).values(orderItems);
      }

      // Update the transaction if amount or status changed
      if (order.total !== currentOrder.total || order.status !== currentOrder.status) {
        const orderTransactions = await tx.select().from(transactions)
          .where(
            and(
              eq(transactions.referenceType, 'purchase_order'),
              eq(transactions.referenceId, id)
            )
          );

        if (orderTransactions.length > 0) {
          await updateTransaction(
            orderTransactions[0].id,
            userId,
            {
              amount: order.total,
              status: order.status || 'draft',
              description: order.notes || `Purchase Order #${id}`
            }
          );
        }
      }
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    throw error;
  }
};

export const deletePurchaseOrder = async (id: number, userId: number) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the transaction record
      const orderTransactions = await tx.select().from(transactions)
        .where(
          and(
            eq(transactions.referenceType, 'purchase_order'),
            eq(transactions.referenceId, id)
          )
        );

      // Delete order items
      await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, id));
      
      // Delete the order
      await tx.delete(purchaseOrders)
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));

      // Delete the transaction record
      if (orderTransactions.length > 0) {
        await tx.delete(transactions)
          .where(eq(transactions.id, orderTransactions[0].id));
      }
    });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    throw error;
  }
}; 