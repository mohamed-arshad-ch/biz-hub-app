import { db } from './index';
import { paymentOuts, paymentOutItems, transactions } from './schema';
import { eq, and, desc } from 'drizzle-orm';
import { createTransaction } from './transaction';
import { createPaymentOutLedgerEntries } from './ledger';

export interface PaymentOut {
  id: number;
  userId: number;
  vendorId: number;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOutItem {
  id: number;
  paymentOutId: number;
  invoiceId: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewPaymentOut {
  userId: number;
  vendorId: number;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  status: string;
  items: {
    invoiceId: number;
    amount: number;
  }[];
}

export const createPaymentOut = async (
  userId: number,
  data: {
    paymentNumber: string;
    vendorId: number;
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
      const now = new Date().toISOString();
      
      // Insert payment out
      const [payment] = await tx
        .insert(paymentOuts)
        .values({
          userId,
          ...data,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Insert payment out items
      if (items.length > 0) {
        await tx.insert(paymentOutItems).values(
          items.map((item) => ({
            paymentOutId: payment.id,
            invoiceId: item.invoiceId,
            amount: item.amount,
            notes: item.notes,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }

      // Create transaction record
      await createTransaction({
        userId,
        transactionType: 'payment_out',
        referenceId: payment.id,
        referenceType: 'payment_out',
        amount: data.amount,
        date: data.paymentDate,
        description: `Payment made to vendor (${data.paymentNumber})`,
        status: data.status,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
      });

      // Create ledger entries
      await createPaymentOutLedgerEntries(
        userId,
        payment.id,
        data.amount,
        data.paymentDate,
        `Payment made to vendor (${data.paymentNumber})`
      );

      return payment;
    });

    return result;
  } catch (error) {
    console.error('Error creating payment out:', error);
    throw error;
  }
};

export const getPaymentOuts = async (userId: number, sort: 'newest' | 'oldest' = 'newest') => {
  try {
    const payments = await db
      .select({
        id: paymentOuts.id,
        paymentNumber: paymentOuts.paymentNumber,
        vendorId: paymentOuts.vendorId,
        paymentDate: paymentOuts.paymentDate,
        paymentMethod: paymentOuts.paymentMethod,
        referenceNumber: paymentOuts.referenceNumber,
        status: paymentOuts.status,
        amount: paymentOuts.amount,
        notes: paymentOuts.notes,
        createdAt: paymentOuts.createdAt,
        items: paymentOutItems,
      })
      .from(paymentOuts)
      .leftJoin(paymentOutItems, eq(paymentOuts.id, paymentOutItems.paymentOutId))
      .where(eq(paymentOuts.userId, userId))
      .orderBy(sort === 'newest' ? desc(paymentOuts.createdAt) : paymentOuts.createdAt);

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
    console.error('Error getting payment outs:', error);
    throw error;
  }
};

export const getPaymentOutById = async (id: number, userId: number) => {
  try {
    const payment = await db
      .select({
        id: paymentOuts.id,
        paymentNumber: paymentOuts.paymentNumber,
        vendorId: paymentOuts.vendorId,
        paymentDate: paymentOuts.paymentDate,
        paymentMethod: paymentOuts.paymentMethod,
        referenceNumber: paymentOuts.referenceNumber,
        status: paymentOuts.status,
        amount: paymentOuts.amount,
        notes: paymentOuts.notes,
        createdAt: paymentOuts.createdAt,
        items: paymentOutItems,
      })
      .from(paymentOuts)
      .leftJoin(paymentOutItems, eq(paymentOuts.id, paymentOutItems.paymentOutId))
      .where(and(eq(paymentOuts.id, id), eq(paymentOuts.userId, userId)))
      .orderBy(paymentOuts.createdAt);

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
    console.error('Error getting payment out by id:', error);
    throw error;
  }
};

export const updatePaymentOut = async (
  id: number,
  userId: number,
  data: {
    paymentNumber?: string;
    vendorId?: number;
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
      const now = new Date().toISOString();
      
      // Update payment out
      const [payment] = await tx
        .update(paymentOuts)
        .set({
          ...data,
          updatedAt: now,
        })
        .where(and(eq(paymentOuts.id, id), eq(paymentOuts.userId, userId)))
        .returning();

      // Update items if provided
      if (items) {
        // Delete existing items
        await tx.delete(paymentOutItems).where(eq(paymentOutItems.paymentOutId, id));

        // Insert new items
        if (items.length > 0) {
          await tx.insert(paymentOutItems).values(
            items.map((item) => ({
              paymentOutId: id,
              invoiceId: item.invoiceId,
              amount: item.amount,
              notes: item.notes,
              createdAt: now,
              updatedAt: now,
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
            description: `Payment made to vendor (${data.paymentNumber ?? payment.paymentNumber})`,
            updatedAt: now,
          })
          .where(
            and(
              eq(transactions.referenceId, id),
              eq(transactions.referenceType, 'payment_out')
            )
          );
      }

      return payment;
    });

    return result;
  } catch (error) {
    console.error('Error updating payment out:', error);
    throw error;
  }
};

export const deletePaymentOut = async (id: number, userId: number) => {
  try {
    const result = await db.transaction(async (tx) => {
      // Delete items first
      await tx.delete(paymentOutItems).where(eq(paymentOutItems.paymentOutId, id));

      // Delete transaction record
      await tx
        .delete(transactions)
        .where(
          and(
            eq(transactions.referenceId, id),
            eq(transactions.referenceType, 'payment_out')
          )
        );

      // Delete payment out
      const [payment] = await tx
        .delete(paymentOuts)
        .where(and(eq(paymentOuts.id, id), eq(paymentOuts.userId, userId)))
        .returning();

      return payment;
    });

    return result;
  } catch (error) {
    console.error('Error deleting payment out:', error);
    throw error;
  }
}; 