import { db } from './index';
import { incomes, transactions } from './schema';
import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { createIncomeTransaction, updateTransaction } from './transaction';
import { createIncomeLedgerEntries } from './ledger';

export interface Income {
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

export interface NewIncome {
  userId: number;
  categoryId: number;
  amount: number;
  date: string;
  description?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  status?: string;
}

export const createIncome = async (income: {
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
      const [newIncome] = await tx.insert(incomes).values(income).returning();

      // Create a transaction record
      await createIncomeTransaction(
        income.userId,
        newIncome.id,
        income.amount,
        income.date,
        income.description,
        income.status || 'pending',
        income.paymentMethod,
        income.referenceNumber
      );

      // Create ledger entries
      await createIncomeLedgerEntries(
        income.userId,
        newIncome.id,
        income.amount,
        income.date,
        income.description || `Income #${newIncome.id}`,
        income.categoryId
      );

      return newIncome;
    });
    return result;
  } catch (error) {
    console.error('Error creating income:', error);
    throw error;
  }
};

export const getIncomeById = async (id: number, userId: number): Promise<Income | undefined> => {
  const [income] = await db
    .select()
    .from(incomes)
    .where(
      and(
        eq(incomes.id, id),
        eq(incomes.userId, userId)
      )
    );
  
  if (!income) return undefined;
  
  // Convert null to undefined for optional fields
  return {
    ...income,
    description: income.description || undefined,
    paymentMethod: income.paymentMethod || undefined,
    referenceNumber: income.referenceNumber || undefined
  };
};

export const getAllIncomes = async (userId: number): Promise<Income[]> => {
  const results = await db
    .select()
    .from(incomes)
    .where(eq(incomes.userId, userId))
    .orderBy(incomes.date);

  // Convert null to undefined for optional fields
  return results.map(income => ({
    ...income,
    description: income.description || undefined,
    paymentMethod: income.paymentMethod || undefined,
    referenceNumber: income.referenceNumber || undefined
  }));
};

export const updateIncome = async (
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
      // Get the current income to check for changes
      const [currentIncome] = await tx.select().from(incomes)
        .where(
          and(
            eq(incomes.id, id),
            eq(incomes.userId, userId)
          )
        );

      if (!currentIncome) {
        throw new Error('Income not found');
      }

      // Update income
      await tx.update(incomes)
        .set({ ...updates, updatedAt: new Date().toISOString() })
        .where(and(eq(incomes.id, id), eq(incomes.userId, userId)));

      // Update the transaction if amount or status changed
      if (updates.amount !== currentIncome.amount || updates.status !== currentIncome.status) {
        const incomeTransactions = await tx.select().from(transactions)
          .where(
            and(
              eq(transactions.referenceType, 'income'),
              eq(transactions.referenceId, id)
            )
          );

        if (incomeTransactions.length > 0) {
          await updateTransaction(
            incomeTransactions[0].id,
            userId,
            {
              amount: updates.amount,
              status: updates.status || 'pending',
              description: updates.description || `Income #${id}`,
              paymentMethod: updates.paymentMethod,
              referenceNumber: updates.referenceNumber
            }
          );
        }
      }
    });
  } catch (error) {
    console.error('Error updating income:', error);
    throw error;
  }
};

export const deleteIncome = async (id: number, userId: number) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the transaction record
      const incomeTransactions = await tx.select().from(transactions)
        .where(
          and(
            eq(transactions.referenceType, 'income'),
            eq(transactions.referenceId, id)
          )
        );

      // Delete the income
      await tx.delete(incomes)
        .where(and(eq(incomes.id, id), eq(incomes.userId, userId)));

      // Delete the transaction record
      if (incomeTransactions.length > 0) {
        await tx.delete(transactions)
          .where(eq(transactions.id, incomeTransactions[0].id));
      }
    });
  } catch (error) {
    console.error('Error deleting income:', error);
    throw error;
  }
};

// Get income data for reports
export const getIncomeReportData = async (
  userId: number,
  startDate?: string,
  endDate?: string
) => {
  const conditions = [eq(incomes.userId, userId)];
  
  if (startDate) {
    conditions.push(gte(incomes.date, startDate));
  }
  
  if (endDate) {
    conditions.push(lte(incomes.date, endDate));
  }

  return await db
    .select()
    .from(incomes)
    .where(and(...conditions))
    .orderBy(incomes.date);
};

// Get income summary statistics
export const getIncomeSummaryStats = async (
  userId: number,
  startDate?: string,
  endDate?: string
) => {
  const conditions = [eq(incomes.userId, userId)];
  
  if (startDate) {
    conditions.push(gte(incomes.date, startDate));
  }
  
  if (endDate) {
    conditions.push(lte(incomes.date, endDate));
  }

  const result = await db
    .select({
      totalAmount: sql<number>`sum(${incomes.amount})`,
      count: sql<number>`count(*)`,
      averageAmount: sql<number>`avg(${incomes.amount})`,
      maxAmount: sql<number>`max(${incomes.amount})`,
      minAmount: sql<number>`min(${incomes.amount})`
    })
    .from(incomes)
    .where(and(...conditions));

  return result[0];
};

// Get income by category
export const getIncomeByCategory = async (
  userId: number,
  startDate?: string,
  endDate?: string
) => {
  const conditions = [eq(incomes.userId, userId)];
  
  if (startDate) {
    conditions.push(gte(incomes.date, startDate));
  }
  
  if (endDate) {
    conditions.push(lte(incomes.date, endDate));
  }

  return await db
    .select({
      categoryId: incomes.categoryId,
      totalAmount: sql<number>`sum(${incomes.amount})`,
      count: sql<number>`count(*)`
    })
    .from(incomes)
    .where(and(...conditions))
    .groupBy(incomes.categoryId)
    .orderBy(sql<number>`sum(${incomes.amount}) desc`);
};

// Get income by date range
export const getIncomeByDateRange = async (
  userId: number,
  startDate?: string,
  endDate?: string
) => {
  const conditions = [eq(incomes.userId, userId)];
  
  if (startDate) {
    conditions.push(gte(incomes.date, startDate));
  }
  
  if (endDate) {
    conditions.push(lte(incomes.date, endDate));
  }

  return await db
    .select({
      date: incomes.date,
      totalAmount: sql<number>`sum(${incomes.amount})`,
      count: sql<number>`count(*)`
    })
    .from(incomes)
    .where(and(...conditions))
    .groupBy(incomes.date)
    .orderBy(incomes.date);
};

// Get income by payment method
export const getIncomeByPaymentMethod = async (
  userId: number,
  startDate?: string,
  endDate?: string
) => {
  const conditions = [eq(incomes.userId, userId)];
  
  if (startDate) {
    conditions.push(gte(incomes.date, startDate));
  }
  
  if (endDate) {
    conditions.push(lte(incomes.date, endDate));
  }

  return await db
    .select({
      paymentMethod: incomes.paymentMethod,
      totalAmount: sql<number>`sum(${incomes.amount})`,
      count: sql<number>`count(*)`
    })
    .from(incomes)
    .where(and(...conditions))
    .groupBy(incomes.paymentMethod)
    .orderBy(sql<number>`sum(${incomes.amount}) desc`);
}; 