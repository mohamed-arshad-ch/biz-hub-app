import { db } from './index';
import { accountGroups } from './schema';
import { eq, and } from 'drizzle-orm';

export interface AccountGroup {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewAccountGroup {
  userId: number;
  name: string;
  description?: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  isDefault?: boolean;
}

// Default account groups
const defaultAccountGroups: Omit<NewAccountGroup, 'userId'>[] = [
  {
    name: 'Bank/Cash',
    description: 'Cash and bank accounts for business transactions',
    type: 'asset',
    isDefault: true
  },
  {
    name: 'Accounts Receivable',
    description: 'Amounts owed by customers for sales on credit',
    type: 'asset',
    isDefault: true
  },
  {
    name: 'Inventory',
    description: 'Goods held for sale or raw materials',
    type: 'asset',
    isDefault: true
  },
  {
    name: 'Purchase Returns',
    description: 'Returns of goods to suppliers',
    type: 'asset',
    isDefault: true
  },
  {
    name: 'Accounts Payable',
    description: 'Amounts owed to suppliers for purchases on credit',
    type: 'liability',
    isDefault: true
  },
  {
    name: 'Sales Revenue',
    description: 'Income from sales of products or services',
    type: 'revenue',
    isDefault: true
  },
  {
    name: 'Sales Returns',
    description: 'Returns from customers for sold goods',
    type: 'revenue',
    isDefault: true
  },
  {
    name: 'Income',
    description: 'Other income sources not related to sales',
    type: 'revenue',
    isDefault: true
  },
  {
    name: 'Expenses',
    description: 'Business operating expenses',
    type: 'expense',
    isDefault: true
  }
];

export const createAccountGroup = async (data: NewAccountGroup): Promise<AccountGroup> => {
  const now = new Date().toISOString();
  
  const [group] = await db.insert(accountGroups).values({
    ...data,
    isDefault: data.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return group as AccountGroup;
};

export const getAccountGroupById = async (id: number, userId: number): Promise<AccountGroup | undefined> => {
  const [group] = await db.select()
    .from(accountGroups)
    .where(
      and(
        eq(accountGroups.id, id),
        eq(accountGroups.userId, userId)
      )
    );
  
  return group as AccountGroup | undefined;
};

export const getAllAccountGroups = async (userId: number): Promise<AccountGroup[]> => {
  const groups = await db.select()
    .from(accountGroups)
    .where(eq(accountGroups.userId, userId))
    .orderBy(accountGroups.name);
  
  return groups as AccountGroup[];
};

export const getAccountGroupsByType = async (
  userId: number,
  type: AccountGroup['type']
): Promise<AccountGroup[]> => {
  const groups = await db.select()
    .from(accountGroups)
    .where(
      and(
        eq(accountGroups.userId, userId),
        eq(accountGroups.type, type)
      )
    )
    .orderBy(accountGroups.name);
  
  return groups as AccountGroup[];
};

export const updateAccountGroup = async (
  id: number,
  userId: number,
  data: Partial<NewAccountGroup>
): Promise<AccountGroup | undefined> => {
  const now = new Date().toISOString();
  
  const [group] = await db.update(accountGroups)
    .set({
      ...data,
      isDefault: data.isDefault ?? false,
      updatedAt: now,
    })
    .where(
      and(
        eq(accountGroups.id, id),
        eq(accountGroups.userId, userId)
      )
    )
    .returning();

  return group as AccountGroup | undefined;
};

export const deleteAccountGroup = async (id: number, userId: number): Promise<void> => {
  await db.delete(accountGroups)
    .where(
      and(
        eq(accountGroups.id, id),
        eq(accountGroups.userId, userId)
      )
    );
};

export const createDefaultAccountGroups = async (userId: number): Promise<void> => {
  const now = new Date().toISOString();
  
  await db.insert(accountGroups).values(
    defaultAccountGroups.map(group => ({
      ...group,
      userId,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    }))
  );
}; 