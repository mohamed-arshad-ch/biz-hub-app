import { db } from './index';
import { expenses, transactions, expenseCategories } from './schema';
import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { createExpenseTransaction, updateTransaction } from './transaction';
import { createExpenseLedgerEntries } from './ledger';

export interface Expense {
  id: number;
  userId: number;
  categoryId: number;
  amount: number;
  date: string;
  description?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewExpense {
  userId: number;
  categoryId: number;
  amount: number;
  date: string;
  description?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  status?: string;
}

export const createExpense = async (expense: {
  userId: number;
  categoryId: number;
  date: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  status: string;
  description?: string;
}) => {
  try {
    const result = await db.transaction(async (tx) => {
      const [newExpense] = await tx.insert(expenses).values(expense).returning();

      // Create a transaction record
      await createExpenseTransaction(
        expense.userId,
        newExpense.id,
        expense.amount,
        expense.date,
        expense.description,
        expense.status || 'pending',
        expense.paymentMethod,
        expense.referenceNumber
      );

      // Create ledger entries
      await createExpenseLedgerEntries(
        expense.userId,
        newExpense.id,
        expense.amount,
        expense.date,
        expense.description || `Expense #${newExpense.id}`,
        expense.categoryId
      );

      return newExpense;
    });
    return result;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

export const getExpenseById = async (id: number, userId: number): Promise<Expense | undefined> => {
  const [expense] = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.id, id),
        eq(expenses.userId, userId)
      )
    );
  
  if (!expense) return undefined;
  
  // Convert null to undefined for optional fields
  return {
    ...expense,
    description: expense.description || undefined,
    paymentMethod: expense.paymentMethod || undefined,
    referenceNumber: expense.referenceNumber || undefined
  };
};

export const getAllExpenses = async (userId: number): Promise<Expense[]> => {
  const results = await db
    .select()
    .from(expenses)
    .where(eq(expenses.userId, userId))
    .orderBy(expenses.date);

  // Convert null to undefined for optional fields
  return results.map(expense => ({
    ...expense,
    description: expense.description || undefined,
    paymentMethod: expense.paymentMethod || undefined,
    referenceNumber: expense.referenceNumber || undefined
  }));
};

export const updateExpense = async (
  id: number,
  userId: number,
  updates: {
    categoryId?: number;
    amount?: number;
    date?: string;
    description?: string;
    paymentMethod?: string;
    referenceNumber?: string;
    status?: string;
  }
) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the current expense to check for changes
      const [currentExpense] = await tx.select().from(expenses)
        .where(
          and(
            eq(expenses.id, id),
            eq(expenses.userId, userId)
          )
        );

      if (!currentExpense) {
        throw new Error('Expense not found');
      }

      // Update expense
      await tx.update(expenses)
        .set({ ...updates, updatedAt: new Date().toISOString() })
        .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));

      // Update the transaction if amount or status changed
      if (updates.amount !== currentExpense.amount || updates.status !== currentExpense.status) {
        const expenseTransactions = await tx.select().from(transactions)
          .where(
            and(
              eq(transactions.referenceType, 'expense'),
              eq(transactions.referenceId, id)
            )
          );

        if (expenseTransactions.length > 0) {
          await updateTransaction(
            expenseTransactions[0].id,
            userId,
            {
              amount: updates.amount,
              status: updates.status || 'pending',
              description: updates.description || `Expense #${id}`,
              paymentMethod: updates.paymentMethod,
              referenceNumber: updates.referenceNumber
            }
          );
        }
      }
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (id: number, userId: number) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the transaction record
      const expenseTransactions = await tx.select().from(transactions)
        .where(
          and(
            eq(transactions.referenceType, 'expense'),
            eq(transactions.referenceId, id)
          )
        );

      // Delete the expense
      await tx.delete(expenses)
        .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));

      // Delete the transaction record
      if (expenseTransactions.length > 0) {
        await tx.delete(transactions)
          .where(eq(transactions.id, expenseTransactions[0].id));
      }
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

export async function getExpenseReportData(userId: number, startDate?: Date, endDate?: Date) {
  const query = db
    .select({
      id: expenses.id,
      date: expenses.date,
      amount: expenses.amount,
      description: expenses.description,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      paymentMethod: expenses.paymentMethod,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(eq(expenses.userId, userId));

  if (startDate && endDate) {
    query.where(
      and(
        gte(expenses.date, startDate.toISOString()),
        lte(expenses.date, endDate.toISOString())
      )
    );
  }

  return query.orderBy(expenses.date);
}

export async function getExpenseSummaryStats(userId: number, startDate?: Date, endDate?: Date) {
  const query = db
    .select({
      totalAmount: sql<number>`sum(${expenses.amount})`,
      count: sql<number>`count(*)`,
      average: sql<number>`avg(${expenses.amount})`,
      max: sql<number>`max(${expenses.amount})`,
      min: sql<number>`min(${expenses.amount})`,
    })
    .from(expenses)
    .where(eq(expenses.userId, userId));

  if (startDate && endDate) {
    query.where(
      and(
        gte(expenses.date, startDate.toISOString()),
        lte(expenses.date, endDate.toISOString())
      )
    );
  }

  return query;
}

export async function getExpenseByCategory(userId: number, startDate?: Date, endDate?: Date) {
  const query = db
    .select({
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      totalAmount: sql<number>`sum(${expenses.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(eq(expenses.userId, userId))
    .groupBy(expenses.categoryId, expenseCategories.name);

  if (startDate && endDate) {
    query.where(
      and(
        gte(expenses.date, startDate.toISOString()),
        lte(expenses.date, endDate.toISOString())
      )
    );
  }

  return query;
}

export async function getExpenseByDateRange(userId: number, startDate?: Date, endDate?: Date) {
  const query = db
    .select({
      date: expenses.date,
      totalAmount: sql<number>`sum(${expenses.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(expenses)
    .where(eq(expenses.userId, userId))
    .groupBy(expenses.date);

  if (startDate && endDate) {
    query.where(
      and(
        gte(expenses.date, startDate.toISOString()),
        lte(expenses.date, endDate.toISOString())
      )
    );
  }

  return query.orderBy(expenses.date);
}

export async function getExpenseByPaymentMethod(userId: number, startDate?: Date, endDate?: Date) {
  const query = db
    .select({
      paymentMethod: expenses.paymentMethod,
      totalAmount: sql<number>`sum(${expenses.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(expenses)
    .where(eq(expenses.userId, userId))
    .groupBy(expenses.paymentMethod);

  if (startDate && endDate) {
    query.where(
      and(
        gte(expenses.date, startDate.toISOString()),
        lte(expenses.date, endDate.toISOString())
      )
    );
  }

  return query;
} 