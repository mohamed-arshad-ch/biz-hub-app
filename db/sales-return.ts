import { db } from './index';
import { salesReturns, salesReturnItems, transactions, type NewSalesReturn, type NewSalesReturnItem, products } from './schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { createSalesReturnTransaction, updateTransaction } from './transaction';
import { createSalesReturnLedgerEntries } from './ledger';

export const createSalesReturn = async (returnData: NewSalesReturn, items: NewSalesReturnItem[]) => {
  try {
    const result = await db.transaction(async (tx) => {
      const [newReturn] = await tx.insert(salesReturns).values(returnData).returning();
      const returnItems = items.map(item => ({ ...item, returnId: newReturn.id }));
      await tx.insert(salesReturnItems).values(returnItems);

      // Create a transaction record
      await createSalesReturnTransaction(
        returnData.userId,
        newReturn.id,
        returnData.total,
        returnData.returnDate,
        returnData.notes || undefined,
        returnData.status || 'pending'
      );

      // Create ledger entries
      await createSalesReturnLedgerEntries(
        returnData.userId,
        newReturn.id,
        returnData.total,
        returnData.returnDate,
        returnData.notes || `Sales Return #${newReturn.returnNumber}`
      );

      return newReturn;
    });
    return result;
  } catch (error) {
    console.error('Error creating sales return:', error);
    throw error;
  }
};

export const getSalesReturns = async (userId: number, sort: 'newest' | 'oldest' = 'newest') => {
  try {
    const returns = await db.select().from(salesReturns)
      .where(eq(salesReturns.userId, userId))
      .orderBy(sort === 'newest' ? desc(salesReturns.createdAt) : asc(salesReturns.createdAt));
    return returns;
  } catch (error) {
    console.error('Error fetching sales returns:', error);
    throw error;
  }
};

export const getSalesReturnById = async (id: number, userId: number) => {
  try {
    const [returnData] = await db.select().from(salesReturns)
      .where(and(eq(salesReturns.id, id), eq(salesReturns.userId, userId)));
    if (!returnData) return null;
    
    const items = await db.select({
      id: salesReturnItems.id,
      returnId: salesReturnItems.returnId,
      productId: salesReturnItems.productId,
      quantity: salesReturnItems.quantity,
      unitPrice: salesReturnItems.unitPrice,
      total: salesReturnItems.total,
      notes: salesReturnItems.notes,
      createdAt: salesReturnItems.createdAt,
      productName: products.productName
    })
    .from(salesReturnItems)
    .leftJoin(products, eq(salesReturnItems.productId, products.id))
    .where(eq(salesReturnItems.returnId, id));
    
    return { ...returnData, items };
  } catch (error) {
    console.error('Error fetching sales return:', error);
    throw error;
  }
};

export const updateSalesReturn = async (
  id: number,
  userId: number,
  returnData: Partial<NewSalesReturn>,
  items?: NewSalesReturnItem[]
) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the current return to check for changes
      const [currentReturn] = await tx.select().from(salesReturns)
        .where(
          and(
            eq(salesReturns.id, id),
            eq(salesReturns.userId, userId)
          )
        );

      if (!currentReturn) {
        throw new Error('Sales return not found');
      }

      // Update return
      await tx.update(salesReturns)
        .set({ ...returnData, updatedAt: new Date().toISOString() })
        .where(and(eq(salesReturns.id, id), eq(salesReturns.userId, userId)));

      if (items) {
        // Delete old items
        await tx.delete(salesReturnItems).where(eq(salesReturnItems.returnId, id));
        // Insert new items
        const returnItems = items.map(item => ({ ...item, returnId: id }));
        await tx.insert(salesReturnItems).values(returnItems);
      }

      // Update the transaction if amount or status changed
      if (returnData.total !== currentReturn.total || returnData.status !== currentReturn.status) {
        const returnTransactions = await tx.select().from(transactions)
          .where(
            and(
              eq(transactions.referenceType, 'sales_return'),
              eq(transactions.referenceId, id)
            )
          );

        if (returnTransactions.length > 0) {
          await updateTransaction(
            returnTransactions[0].id,
            userId,
            {
              amount: returnData.total,
              status: returnData.status || 'pending',
              description: returnData.notes || `Sales Return #${id}`
            }
          );
        }
      }
    });
  } catch (error) {
    console.error('Error updating sales return:', error);
    throw error;
  }
};

export const deleteSalesReturn = async (id: number, userId: number) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the transaction record
      const returnTransactions = await tx.select().from(transactions)
        .where(
          and(
            eq(transactions.referenceType, 'sales_return'),
            eq(transactions.referenceId, id)
          )
        );

      // Delete return items
      await tx.delete(salesReturnItems).where(eq(salesReturnItems.returnId, id));
      
      // Delete the return
      await tx.delete(salesReturns)
        .where(and(eq(salesReturns.id, id), eq(salesReturns.userId, userId)));

      // Delete the transaction record
      if (returnTransactions.length > 0) {
        await tx.delete(transactions)
          .where(eq(transactions.id, returnTransactions[0].id));
      }
    });
  } catch (error) {
    console.error('Error deleting sales return:', error);
    throw error;
  }
}; 