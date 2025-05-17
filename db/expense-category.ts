import { db } from './index';
import { expenseCategories } from './schema';
import { eq, and } from 'drizzle-orm';

export interface ExpenseCategory {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewExpenseCategory {
  userId: number;
  name: string;
  description?: string;
  color: string;
  isDefault?: boolean;
}

// Default expense categories
const defaultExpenseCategories: Omit<NewExpenseCategory, 'userId'>[] = [
  {
    name: 'Cost of Goods Sold',
    description: 'Direct costs of producing goods or services',
    color: '#e74c3c',
    isDefault: true
  },
  {
    name: 'Operating Expenses',
    description: 'Day-to-day business expenses',
    color: '#3498db',
    isDefault: true
  },
  {
    name: 'Payroll',
    description: 'Employee salaries and benefits',
    color: '#9b59b6',
    isDefault: true
  },
  {
    name: 'Rent & Utilities',
    description: 'Office space and utility expenses',
    color: '#f39c12',
    isDefault: true
  },
  {
    name: 'Marketing',
    description: 'Advertising and promotional expenses',
    color: '#1abc9c',
    isDefault: true
  },
  {
    name: 'Other Expenses',
    description: 'Miscellaneous business expenses',
    color: '#e67e22',
    isDefault: true
  }
];

export async function createExpenseCategory(category: NewExpenseCategory): Promise<ExpenseCategory> {
  const now = new Date().toISOString();
  const [createdCategory] = await db.insert(expenseCategories).values({
    ...category,
    isDefault: category.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  }).returning();
  
  return {
    ...createdCategory,
    isDefault: createdCategory.isDefault ?? false,
    createdAt: createdCategory.createdAt ?? now,
    updatedAt: createdCategory.updatedAt ?? now,
  };
}

export async function getExpenseCategoryById(id: number, userId: number): Promise<ExpenseCategory | undefined> {
  const [category] = await db.select().from(expenseCategories).where(
    and(eq(expenseCategories.id, id), eq(expenseCategories.userId, userId))
  );
  
  if (!category) return undefined;
  
  return {
    ...category,
    isDefault: category.isDefault ?? false,
    createdAt: category.createdAt ?? new Date().toISOString(),
    updatedAt: category.updatedAt ?? new Date().toISOString(),
  };
}

export async function getAllExpenseCategories(userId: number): Promise<ExpenseCategory[]> {
  const categories = await db.select().from(expenseCategories).where(
    eq(expenseCategories.userId, userId)
  ).orderBy(expenseCategories.name);
  
  const now = new Date().toISOString();
  return categories.map(category => ({
    ...category,
    isDefault: category.isDefault ?? false,
    createdAt: category.createdAt ?? now,
    updatedAt: category.updatedAt ?? now,
  }));
}

export async function updateExpenseCategory(id: number, userId: number, updates: Partial<NewExpenseCategory>): Promise<ExpenseCategory | undefined> {
  const now = new Date().toISOString();
  const [updatedCategory] = await db.update(expenseCategories)
    .set({
      ...updates,
      isDefault: updates.isDefault ?? false,
      updatedAt: now,
    })
    .where(
      and(eq(expenseCategories.id, id), eq(expenseCategories.userId, userId))
    )
    .returning();
  
  if (!updatedCategory) return undefined;
  
  return {
    ...updatedCategory,
    isDefault: updatedCategory.isDefault ?? false,
    createdAt: updatedCategory.createdAt ?? now,
    updatedAt: updatedCategory.updatedAt ?? now,
  };
}

export async function deleteExpenseCategory(id: number, userId: number): Promise<void> {
  await db.delete(expenseCategories).where(
    and(eq(expenseCategories.id, id), eq(expenseCategories.userId, userId))
  );
}

export const createDefaultExpenseCategories = async (userId: number): Promise<void> => {
  const now = new Date().toISOString();
  
  await db.insert(expenseCategories).values(
    defaultExpenseCategories.map(category => ({
      ...category,
      userId,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    }))
  );
}; 