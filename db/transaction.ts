import { db } from './index';
import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { transactions } from './schema';
import { eq, and } from 'drizzle-orm';

// Define the transactions table schema
export const transactionsTable = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  transactionType: text('transaction_type').notNull(),
  referenceId: integer('reference_id').notNull(),
  referenceType: text('reference_type').notNull(),
  amount: integer('amount').notNull(),
  date: text('date').notNull(),
  description: text('description'),
  status: text('status').default('pending'),
  paymentMethod: text('payment_method'),
  referenceNumber: text('reference_number'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Types for transaction operations
export type TransactionType = 
  | 'payment_in'
  | 'payment_out'
  | 'sales_invoice'
  | 'sales_order'
  | 'sales_return'
  | 'purchase_invoice'
  | 'purchase_order'
  | 'purchase_return'
  | 'income'
  | 'expense';

export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;

// Function to create a new transaction
export const createTransaction = async (transaction: NewTransaction) => {
  try {
    const result = await db.insert(transactionsTable).values(transaction).returning();
   

    return result[0];
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Function to get transactions by type
export const getTransactionsByType = async (userId: number, type: TransactionType) => {
  try {
    return await db
      .select()
      .from(transactionsTable)
      .where(sql`user_id = ${userId} AND transaction_type = ${type}`)
      .orderBy(sql`date DESC`);
  } catch (error) {
    console.error('Error getting transactions by type:', error);
    throw error;
  }
};

// Function to get transactions by date range
export const getTransactionsByDateRange = async (
  userId: number,
  startDate: string,
  endDate: string
) => {
  try {
    return await db
      .select()
      .from(transactionsTable)
      .where(sql`user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}`)
      .orderBy(sql`date DESC`);
  } catch (error) {
    console.error('Error getting transactions by date range:', error);
    throw error;
  }
};

// Function to get transaction summary by type
export const getTransactionSummaryByType = async (userId: number) => {
  try {
    return await db
      .select({
        type: transactionsTable.transactionType,
        total: sql<number>`SUM(amount)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactionsTable)
      .where(sql`user_id = ${userId}`)
      .groupBy(transactionsTable.transactionType);
  } catch (error) {
    console.error('Error getting transaction summary:', error);
    throw error;
  }
};

// Function to get transaction summary by date range
export const getTransactionSummaryByDateRange = async (
  userId: number,
  startDate: string,
  endDate: string
) => {
  try {
    return await db
      .select({
        type: transactionsTable.transactionType,
        total: sql<number>`SUM(amount)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactionsTable)
      .where(sql`user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}`)
      .groupBy(transactionsTable.transactionType);
  } catch (error) {
    console.error('Error getting transaction summary by date range:', error);
    throw error;
  }
};

// Function to update transaction status
export const updateTransactionStatus = async (
  transactionId: number,
  status: string
) => {
  try {
    return await db
      .update(transactionsTable)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(sql`id = ${transactionId}`)
      .returning();
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
};

// Function to delete a transaction
export const deleteTransaction = async (transactionId: number, userId: number) => {
  try {
    const result = await db
      .delete(transactionsTable)
      .where(
        and(
          eq(transactionsTable.id, transactionId),
          eq(transactionsTable.userId, userId)
        )
      );

    return result;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// Create a transaction for a sales order
export const createSalesOrderTransaction = async (
  userId: number,
  orderId: number,
  amount: number,
  date: string,
  description?: string,
  status: string = 'pending'
) => {
  try {
    const result = await db.insert(transactionsTable).values({
      userId,
      transactionType: 'sales_order',
      referenceId: orderId,
      referenceType: 'sales_order',
      amount,
      date,
      description: description || `Sales Order #${orderId}`,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error creating sales order transaction:', error);
    throw error;
  }
};

// Create a transaction for a sales invoice
export const createSalesInvoiceTransaction = async (
  userId: number,
  invoiceId: number,
  amount: number,
  date: string,
  description?: string,
  status: string = 'pending',
  paymentMethod?: string,
  referenceNumber?: string
) => {
  try {
    const result = await db.insert(transactionsTable).values({
      userId,
      transactionType: 'sales_invoice',
      referenceId: invoiceId,
      referenceType: 'sales_invoice',
      amount,
      date,
      description: description || `Sales Invoice #${invoiceId}`,
      status,
      paymentMethod,
      referenceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error creating sales invoice transaction:', error);
    throw error;
  }
};

// Create a transaction for a sales return
export const createSalesReturnTransaction = async (
  userId: number,
  returnId: number,
  amount: number,
  date: string,
  description?: string,
  status: string = 'pending',
  paymentMethod?: string,
  referenceNumber?: string
) => {
  try {
    const result = await db.insert(transactionsTable).values({
      userId,
      transactionType: 'sales_return',
      referenceId: returnId,
      referenceType: 'sales_return',
      amount: -amount, // Negative amount for returns
      date,
      description: description || `Sales Return #${returnId}`,
      status,
      paymentMethod,
      referenceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error creating sales return transaction:', error);
    throw error;
  }
};

// Create a transaction for a purchase order
export const createPurchaseOrderTransaction = async (
  userId: number,
  orderId: number,
  amount: number,
  date: string,
  description?: string,
  status: string = 'pending'
) => {
  try {
    const result = await db.insert(transactionsTable).values({
      userId,
      transactionType: 'purchase_order',
      referenceId: orderId,
      referenceType: 'purchase_order',
      amount: -amount, // Negative amount for purchases
      date,
      description: description || `Purchase Order #${orderId}`,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error creating purchase order transaction:', error);
    throw error;
  }
};

// Create a transaction for a purchase invoice
export const createPurchaseInvoiceTransaction = async (
  userId: number,
  invoiceId: number,
  amount: number,
  date: string,
  description?: string,
  status: string = 'pending',
  paymentMethod?: string,
  referenceNumber?: string
) => {
  try {
    const result = await db.insert(transactionsTable).values({
      userId,
      transactionType: 'purchase_invoice',
      referenceId: invoiceId,
      referenceType: 'purchase_invoice',
      amount: -amount, // Negative amount for purchases
      date,
      description: description || `Purchase Invoice #${invoiceId}`,
      status,
      paymentMethod,
      referenceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error creating purchase invoice transaction:', error);
    throw error;
  }
};

// Create a transaction for a purchase return
export const createPurchaseReturnTransaction = async (
  userId: number,
  returnId: number,
  amount: number,
  date: string,
  description?: string,
  status: string = 'pending',
  paymentMethod?: string,
  referenceNumber?: string
) => {
  try {
    const result = await db.insert(transactionsTable).values({
      userId,
      transactionType: 'purchase_return',
      referenceId: returnId,
      referenceType: 'purchase_return',
      amount, // Positive amount for returns (refunds)
      date,
      description: description || `Purchase Return #${returnId}`,
      status,
      paymentMethod,
      referenceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error creating purchase return transaction:', error);
    throw error;
  }
};

// Update a transaction
export const updateTransaction = async (
  transactionId: number,
  userId: number,
  updates: {
    amount?: number;
    date?: string;
    description?: string;
    status?: string;
    paymentMethod?: string;
    referenceNumber?: string;
  }
) => {
  try {
    const result = await db
      .update(transactionsTable)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(transactionsTable.id, transactionId),
          eq(transactionsTable.userId, userId)
        )
      );

    return result;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

// Get transactions by reference
export const getTransactionsByReference = async (
  userId: number,
  referenceType: string,
  referenceId: number
) => {
  try {
    const result = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.userId, userId),
          eq(transactionsTable.referenceType, referenceType),
          eq(transactionsTable.referenceId, referenceId)
        )
      );

    return result;
  } catch (error) {
    console.error('Error getting transactions by reference:', error);
    throw error;
  }
};

// Create a transaction for income
export const createIncomeTransaction = async (
  userId: number,
  incomeId: number,
  amount: number,
  date: string,
  description?: string,
  status: string = 'pending',
  paymentMethod?: string,
  referenceNumber?: string
) => {
  try {
    const result = await db.insert(transactionsTable).values({
      userId,
      transactionType: 'income',
      referenceId: incomeId,
      referenceType: 'income',
      amount,
      date,
      description: description || `Income #${incomeId}`,
      status,
      paymentMethod,
      referenceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error creating income transaction:', error);
    throw error;
  }
};

// Create a transaction for expense
export const createExpenseTransaction = async (
  userId: number,
  expenseId: number,
  amount: number,
  date: string,
  description?: string,
  status: string = 'pending',
  paymentMethod?: string,
  referenceNumber?: string
) => {
  try {
    const result = await db.insert(transactionsTable).values({
      userId,
      transactionType: 'expense',
      referenceId: expenseId,
      referenceType: 'expense',
      amount: -amount, // Negative amount for expenses
      date,
      description: description || `Expense #${expenseId}`,
      status,
      paymentMethod,
      referenceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error creating expense transaction:', error);
    throw error;
  }
}; 