import { db } from './index';
import { purchaseReturns, purchaseReturnItems, transactions, type NewPurchaseReturn, type NewPurchaseReturnItem, products } from './schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { createPurchaseReturnTransaction, updateTransaction } from './transaction';
import { createPurchaseReturnLedgerEntries } from './ledger';

type PurchaseReturnStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';

export const createPurchaseReturn = async (returnData: NewPurchaseReturn, items: NewPurchaseReturnItem[]) => {
  try {
    const result = await db.transaction(async (tx) => {
      const [newReturn] = await tx.insert(purchaseReturns).values(returnData).returning();
      const returnItems = items.map(item => ({ ...item, returnId: newReturn.id }));
      await tx.insert(purchaseReturnItems).values(returnItems);

      // Create a transaction record
      await createPurchaseReturnTransaction(
        returnData.userId,
        newReturn.id,
        returnData.total,
        returnData.returnDate,
        returnData.notes || undefined,
        returnData.status || 'pending'
      );

      // Create ledger entries
      await createPurchaseReturnLedgerEntries(
        returnData.userId,
        newReturn.id,
        returnData.total,
        returnData.returnDate,
        returnData.notes || `Purchase Return #${newReturn.returnNumber}`
      );

      return newReturn;
    });
    return result;
  } catch (error) {
    console.error('Error creating purchase return:', error);
    throw error;
  }
};

export const getPurchaseReturns = async (userId: number, sort: 'newest' | 'oldest' = 'newest') => {
  try {
    const returns = await db.select().from(purchaseReturns)
      .where(eq(purchaseReturns.userId, userId))
      .orderBy(sort === 'newest' ? desc(purchaseReturns.createdAt) : asc(purchaseReturns.createdAt));
    return returns;
  } catch (error) {
    console.error('Error fetching purchase returns:', error);
    throw error;
  }
};

export const getPurchaseReturnById = async (id: number, userId: number) => {
  try {
    const [returnData] = await db.select().from(purchaseReturns)
      .where(and(eq(purchaseReturns.id, id), eq(purchaseReturns.userId, userId)));
    if (!returnData) return null;
    
    const items = await db.select({
      id: purchaseReturnItems.id,
      returnId: purchaseReturnItems.returnId,
      productId: purchaseReturnItems.productId,
      quantity: purchaseReturnItems.quantity,
      unitPrice: purchaseReturnItems.unitPrice,
      total: purchaseReturnItems.total,
      notes: purchaseReturnItems.notes,
      createdAt: purchaseReturnItems.createdAt,
      productName: products.productName
    })
    .from(purchaseReturnItems)
    .leftJoin(products, eq(purchaseReturnItems.productId, products.id))
    .where(eq(purchaseReturnItems.returnId, id));
    
    return { ...returnData, items };
  } catch (error) {
    console.error('Error fetching purchase return:', error);
    throw error;
  }
};

export const updatePurchaseReturn = async (
  id: number,
  userId: number,
  returnData: Partial<NewPurchaseReturn>,
  items?: NewPurchaseReturnItem[]
) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the current return to check for changes
      const [currentReturn] = await tx.select().from(purchaseReturns)
        .where(
          and(
            eq(purchaseReturns.id, id),
            eq(purchaseReturns.userId, userId)
          )
        );

      if (!currentReturn) {
        throw new Error('Purchase return not found');
      }

      // Update return
      await tx.update(purchaseReturns)
        .set({ ...returnData, updatedAt: new Date().toISOString() })
        .where(and(eq(purchaseReturns.id, id), eq(purchaseReturns.userId, userId)));

      if (items) {
        // Delete old items
        await tx.delete(purchaseReturnItems).where(eq(purchaseReturnItems.returnId, id));
        // Insert new items
        const returnItems = items.map(item => ({ ...item, returnId: id }));
        await tx.insert(purchaseReturnItems).values(returnItems);
      }

      // Update the transaction if amount or status changed
      if (returnData.total !== currentReturn.total || returnData.status !== currentReturn.status) {
        const returnTransactions = await tx.select().from(transactions)
          .where(
            and(
              eq(transactions.referenceType, 'purchase_return'),
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
              description: returnData.notes || `Purchase Return #${id}`
            }
          );
        }
      }
    });
  } catch (error) {
    console.error('Error updating purchase return:', error);
    throw error;
  }
};

export const deletePurchaseReturn = async (id: number, userId: number) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the transaction record
      const returnTransactions = await tx.select().from(transactions)
        .where(
          and(
            eq(transactions.referenceType, 'purchase_return'),
            eq(transactions.referenceId, id)
          )
        );

      // Delete return items
      await tx.delete(purchaseReturnItems).where(eq(purchaseReturnItems.returnId, id));
      
      // Delete the return
      await tx.delete(purchaseReturns)
        .where(and(eq(purchaseReturns.id, id), eq(purchaseReturns.userId, userId)));

      // Delete the transaction record
      if (returnTransactions.length > 0) {
        await tx.delete(transactions)
          .where(eq(transactions.id, returnTransactions[0].id));
      }
    });
  } catch (error) {
    console.error('Error deleting purchase return:', error);
    throw error;
  }
}; 