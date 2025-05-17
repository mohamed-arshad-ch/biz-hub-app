import { db } from './index';
import { incomeCategories } from './schema';
import { eq, and } from 'drizzle-orm';

export interface IncomeCategory {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewIncomeCategory {
  userId: number;
  name: string;
  description?: string;
  color: string;
  isDefault?: boolean;
}

// Default income categories
const defaultIncomeCategories: Omit<NewIncomeCategory, 'userId'>[] = [
  {
    name: 'Sales Revenue',
    description: 'Income from sales of products or services',
    color: '#4caf50',
    isDefault: true
  },
  {
    name: 'Service Income',
    description: 'Income from providing services',
    color: '#2196f3',
    isDefault: true
  },
  {
    name: 'Interest Income',
    description: 'Income from interest on investments or loans',
    color: '#9c27b0',
    isDefault: true
  },
  {
    name: 'Other Income',
    description: 'Miscellaneous income sources',
    color: '#ff9800',
    isDefault: true
  }
];

export const createIncomeCategory = async (data: NewIncomeCategory): Promise<IncomeCategory> => {
  const now = new Date().toISOString();
  
  const [category] = await db.insert(incomeCategories).values({
    ...data,
    isDefault: data.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return category as IncomeCategory;
};

export const getIncomeCategoryById = async (id: number, userId: number): Promise<IncomeCategory | undefined> => {
  const [category] = await db.select()
    .from(incomeCategories)
    .where(
      and(
        eq(incomeCategories.id, id),
        eq(incomeCategories.userId, userId)
      )
    );
  
  return category as IncomeCategory | undefined;
};

export const getAllIncomeCategories = async (userId: number): Promise<IncomeCategory[]> => {
  const categories = await db.select()
    .from(incomeCategories)
    .where(eq(incomeCategories.userId, userId))
    .orderBy(incomeCategories.name);
  
  return categories as IncomeCategory[];
};

export const updateIncomeCategory = async (
  id: number,
  userId: number,
  data: Partial<NewIncomeCategory>
): Promise<IncomeCategory | undefined> => {
  const now = new Date().toISOString();
  
  const [category] = await db.update(incomeCategories)
    .set({
      ...data,
      isDefault: data.isDefault ?? false,
      updatedAt: now,
    })
    .where(
      and(
        eq(incomeCategories.id, id),
        eq(incomeCategories.userId, userId)
      )
    )
    .returning();

  return category as IncomeCategory | undefined;
};

export const deleteIncomeCategory = async (id: number, userId: number): Promise<void> => {
  await db.delete(incomeCategories)
    .where(
      and(
        eq(incomeCategories.id, id),
        eq(incomeCategories.userId, userId)
      )
    );
};

export const createDefaultIncomeCategories = async (userId: number): Promise<void> => {
  const now = new Date().toISOString();
  
  await db.insert(incomeCategories).values(
    defaultIncomeCategories.map(category => ({
      ...category,
      userId,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    }))
  );
}; 