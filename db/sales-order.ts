import { db } from './index';
import { salesOrders, salesOrderItems, transactions, type NewSalesOrder, type NewSalesOrderItem } from './schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { createSalesOrderTransaction, updateTransaction } from './transaction';

export const createSalesOrder = async (order: NewSalesOrder, items: NewSalesOrderItem[]) => {
  try {
    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Insert the sales order
      const [newOrder] = await tx.insert(salesOrders).values(order).returning();
      
      // Insert all order items
      const orderItems = items.map(item => ({
        ...item,
        orderId: newOrder.id
      }));
      
      await tx.insert(salesOrderItems).values(orderItems);

      // Create a transaction record
      await createSalesOrderTransaction(
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
    console.error('Error creating sales order:', error);
    throw error;
  }
};

export const getSalesOrders = async (userId: number, sort: 'newest' | 'oldest' = 'newest') => {
  try {
    const orders = await db.select().from(salesOrders)
      .where(eq(salesOrders.userId, userId))
      .orderBy(sort === 'newest' ? desc(salesOrders.createdAt) : asc(salesOrders.createdAt));
    return orders;
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    throw error;
  }
};

export const getSalesOrderById = async (id: number, userId: number) => {
  try {
    const [order] = await db.select().from(salesOrders)
      .where(
        and(
          eq(salesOrders.id, id),
          eq(salesOrders.userId, userId)
        )
      );
      
    if (!order) return null;
    
    const items = await db.select().from(salesOrderItems)
      .where(eq(salesOrderItems.orderId, id));
      
    return { ...order, items };
  } catch (error) {
    console.error('Error fetching sales order:', error);
    throw error;
  }
};

export const updateSalesOrder = async (id: number, userId: number, order: Partial<NewSalesOrder>, items?: NewSalesOrderItem[]) => {
  try {
    const result = await db.transaction(async (tx) => {
      // Get the current order to check for changes
      const [currentOrder] = await tx.select().from(salesOrders)
        .where(
          and(
            eq(salesOrders.id, id),
            eq(salesOrders.userId, userId)
          )
        );

      if (!currentOrder) {
        throw new Error('Sales order not found');
      }

      // Update the sales order
      const [updatedOrder] = await tx.update(salesOrders)
        .set({ ...order, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(salesOrders.id, id),
            eq(salesOrders.userId, userId)
          )
        )
        .returning();
        
      // If items are provided, update them
      if (items) {
        // Delete existing items
        await tx.delete(salesOrderItems)
          .where(eq(salesOrderItems.orderId, id));
          
        // Insert new items
        const orderItems = items.map(item => ({
          ...item,
          orderId: id
        }));
        
        await tx.insert(salesOrderItems).values(orderItems);
      }

      // Update the transaction if amount or status changed
      if (order.total !== currentOrder.total || order.status !== currentOrder.status) {
        const orderTransactions = await tx.select().from(transactions)
          .where(
            and(
              eq(transactions.referenceType, 'sales_order'),
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
              description: order.notes || `Sales Order #${id}`
            }
          );
        }
      }
      
      return updatedOrder;
    });
    
    return result;
  } catch (error) {
    console.error('Error updating sales order:', error);
    throw error;
  }
};

export const deleteSalesOrder = async (id: number, userId: number) => {
  try {
    const result = await db.transaction(async (tx) => {
      // Get the transaction record
      const orderTransactions = await tx.select().from(transactions)
        .where(
          and(
            eq(transactions.referenceType, 'sales_order'),
            eq(transactions.referenceId, id)
          )
        );

      // Delete order items first
      await tx.delete(salesOrderItems)
        .where(eq(salesOrderItems.orderId, id));
        
      // Then delete the order
      const [deletedOrder] = await tx.delete(salesOrders)
        .where(
          and(
            eq(salesOrders.id, id),
            eq(salesOrders.userId, userId)
          )
        )
        .returning();

      // Delete the transaction record
      if (orderTransactions.length > 0) {
        await tx.delete(transactions)
          .where(eq(transactions.id, orderTransactions[0].id));
      }
        
      return deletedOrder;
    });
    
    return result;
  } catch (error) {
    console.error('Error deleting sales order:', error);
    throw error;
  }
}; 