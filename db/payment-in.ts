import { db } from './index';
import { paymentIns, paymentInItems, transactions } from './schema';
import { eq, and, desc } from 'drizzle-orm';
import { createTransaction } from './transaction';
import { createPaymentInLedgerEntries } from './ledger';

export const createPaymentIn = async (
  userId: number,
  data: {
    paymentNumber: string;
    customerId: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber?: string;
    status: string;
    amount: number;
    notes?: string;
  },
  items: {
    invoiceId: number;
    amount: number;
    notes?: string;
  }[]
) => {
  try {
    const result = await db.transaction(async (tx) => {
      // Insert payment in
      const [payment] = await tx
        .insert(paymentIns)
        .values({
          userId,
          ...data,
        })
        .returning();

      // Insert payment in items
      if (items.length > 0) {
        await tx.insert(paymentInItems).values(
          items.map((item) => ({
            paymentId: payment.id,
            ...item,
          }))
        );
      }

      
      
      // Create transaction record
      await createTransaction({
        userId,
        transactionType: 'payment_in',
        referenceId: payment.id,
        referenceType: 'payment_in',
        amount: data.amount,
        date: data.paymentDate,
        description: `Payment received from customer (${data.paymentNumber})`,
        status: data.status,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
      });

      // Create ledger entries
      await createPaymentInLedgerEntries(
        userId,
        payment.id,
        data.amount,
        data.paymentDate,
        `Payment received from customer (${data.paymentNumber})`
      );

      return payment;
    });

    return result;
  } catch (error) {
    console.error('Error creating payment in:', error);
    throw error;
  }
};

export const getPaymentIns = async (userId: number, sort: 'newest' | 'oldest' = 'newest') => {
  try {
    const payments = await db
      .select({
        id: paymentIns.id,
        paymentNumber: paymentIns.paymentNumber,
        customerId: paymentIns.customerId,
        paymentDate: paymentIns.paymentDate,
        paymentMethod: paymentIns.paymentMethod,
        referenceNumber: paymentIns.referenceNumber,
        status: paymentIns.status,
        amount: paymentIns.amount,
        notes: paymentIns.notes,
        createdAt: paymentIns.createdAt,
        items: paymentInItems,
      })
      .from(paymentIns)
      .leftJoin(paymentInItems, eq(paymentIns.id, paymentInItems.paymentId))
      .where(eq(paymentIns.userId, userId))
      .orderBy(sort === 'newest' ? desc(paymentIns.createdAt) : paymentIns.createdAt);

    // Group items by payment
    const groupedPayments = payments.reduce((acc: any[], payment) => {
      const existingPayment = acc.find((p) => p.id === payment.id);
      if (existingPayment) {
        if (payment.items) {
          existingPayment.items.push(payment.items);
        }
      } else {
        acc.push({
          ...payment,
          items: payment.items ? [payment.items] : [],
        });
      }
      return acc;
    }, []);

    return groupedPayments;
  } catch (error) {
    console.error('Error getting payment ins:', error);
    throw error;
  }
};

export const getPaymentInById = async (id: number, userId: number) => {
  try {
    const payment = await db
      .select({
        id: paymentIns.id,
        paymentNumber: paymentIns.paymentNumber,
        customerId: paymentIns.customerId,
        paymentDate: paymentIns.paymentDate,
        paymentMethod: paymentIns.paymentMethod,
        referenceNumber: paymentIns.referenceNumber,
        status: paymentIns.status,
        amount: paymentIns.amount,
        notes: paymentIns.notes,
        createdAt: paymentIns.createdAt,
        items: paymentInItems,
      })
      .from(paymentIns)
      .leftJoin(paymentInItems, eq(paymentIns.id, paymentInItems.paymentId))
      .where(and(eq(paymentIns.id, id), eq(paymentIns.userId, userId)))
      .orderBy(paymentIns.createdAt);

    if (!payment.length) return null;

    // Group items
    const groupedPayment = {
      ...payment[0],
      items: payment
        .filter((p) => p.items)
        .map((p) => p.items),
    };

    return groupedPayment;
  } catch (error) {
    console.error('Error getting payment in by id:', error);
    throw error;
  }
};

export const updatePaymentIn = async (
  id: number,
  userId: number,
  data: {
    paymentNumber?: string;
    customerId?: number;
    paymentDate?: string;
    paymentMethod?: string;
    referenceNumber?: string;
    status?: string;
    amount?: number;
    notes?: string;
  },
  items?: {
    invoiceId: number;
    amount: number;
    notes?: string;
  }[]
) => {
  try {
    const result = await db.transaction(async (tx) => {
      // Update payment in
      const [payment] = await tx
        .update(paymentIns)
        .set({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(paymentIns.id, id), eq(paymentIns.userId, userId)))
        .returning();

      // Update items if provided
      if (items) {
        // Delete existing items
        await tx.delete(paymentInItems).where(eq(paymentInItems.paymentId, id));

        // Insert new items
        if (items.length > 0) {
          await tx.insert(paymentInItems).values(
            items.map((item) => ({
              paymentId: id,
              ...item,
            }))
          );
        }
      }

      // Update transaction record
      if (data.amount || data.status || data.paymentDate || data.paymentMethod) {
        await tx
          .update(transactions)
          .set({
            amount: data.amount ?? payment.amount,
            status: data.status ?? payment.status,
            date: data.paymentDate ?? payment.paymentDate,
            paymentMethod: data.paymentMethod ?? payment.paymentMethod,
            description: `Payment received from customer (${data.paymentNumber ?? payment.paymentNumber})`,
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(transactions.referenceId, id),
              eq(transactions.referenceType, 'payment_in')
            )
          );
      }

      return payment;
    });

    return result;
  } catch (error) {
    console.error('Error updating payment in:', error);
    throw error;
  }
};

export const deletePaymentIn = async (id: number, userId: number) => {
  try {
    const result = await db.transaction(async (tx) => {
      // Delete items first
      await tx.delete(paymentInItems).where(eq(paymentInItems.paymentId, id));

      // Delete transaction record
      await tx
        .delete(transactions)
        .where(
          and(
            eq(transactions.referenceId, id),
            eq(transactions.referenceType, 'payment_in')
          )
        );

      // Delete payment in
      const [payment] = await tx
        .delete(paymentIns)
        .where(and(eq(paymentIns.id, id), eq(paymentIns.userId, userId)))
        .returning();

      return payment;
    });

    return result;
  } catch (error) {
    console.error('Error deleting payment in:', error);
    throw error;
  }
};

// Function to get all payment items for a specific invoice
export const getPaymentsForInvoice = async (invoiceId: number, userId: number) => {
  try {
    // Join payment items with payments to get only items from this user
    const paymentItems = await db
      .select({
        id: paymentInItems.id,
        paymentId: paymentInItems.paymentId,
        invoiceId: paymentInItems.invoiceId,
        amount: paymentInItems.amount,
        paymentDate: paymentIns.paymentDate,
        status: paymentIns.status
      })
      .from(paymentInItems)
      .innerJoin(paymentIns, and(
        eq(paymentInItems.paymentId, paymentIns.id),
        eq(paymentIns.userId, userId)
      ))
      .where(eq(paymentInItems.invoiceId, invoiceId));

    return paymentItems;
  } catch (error) {
    console.error('Error getting payments for invoice:', error);
    throw error;
  }
};

// Function to get the total amount paid for a specific invoice
export const getTotalPaidForInvoice = async (invoiceId: number, userId: number) => {
  try {
    const paymentItems = await getPaymentsForInvoice(invoiceId, userId);
    
    // Sum all payment amounts for this invoice where payment status is not 'cancelled'
    const totalPaid = paymentItems
      .filter(item => item.status !== 'cancelled')
      .reduce((sum, item) => sum + item.amount, 0);
    
    return totalPaid;
  } catch (error) {
    console.error('Error calculating total paid for invoice:', error);
    throw error;
  }
}; 