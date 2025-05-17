import { db } from './index';
import { ledger, type NewLedger, accountGroups } from './schema';
import { eq, and } from 'drizzle-orm';

// Helper function to get account group ID by name
const getAccountGroupId = async (userId: number, name: string): Promise<number> => {
  const [group] = await db
    .select()
    .from(accountGroups)
    .where(
      and(
        eq(accountGroups.userId, userId),
        eq(accountGroups.name, name)
      )
    );
  
  if (!group) {
    throw new Error(`Account group "${name}" not found`);
  }
  
  return group.id;
};

// Function to create ledger entries for payment-in
export const createPaymentInLedgerEntries = async (
  userId: number,
  paymentInId: number,
  amount: number,
  date: string,
  description: string
) => {
  const bankAccountId = await getAccountGroupId(userId, 'Bank/Cash');
  const accountsReceivableId = await getAccountGroupId(userId, 'Accounts Receivable');

  // Debit Bank/Cash account
  const debitEntry: NewLedger = {
    userId,
    date,
    referenceType: 'payment_in',
    referenceId: paymentInId,
    accountId: bankAccountId,
    entryType: 'debit',
    amount,
    description: `Payment received: ${description}`
  };

  // Credit Accounts Receivable
  const creditEntry: NewLedger = {
    userId,
    date,
    referenceType: 'payment_in',
    referenceId: paymentInId,
    accountId: accountsReceivableId,
    entryType: 'credit',
    amount,
    description: `Payment received: ${description}`
  };
 
  await db.insert(ledger).values([debitEntry, creditEntry]);
};

// Function to create ledger entries for sales invoice
export const createSalesInvoiceLedgerEntries = async (
  userId: number,
  invoiceId: number,
  amount: number,
  date: string,
  description: string
) => {
  const accountsReceivableId = await getAccountGroupId(userId, 'Accounts Receivable');
  const salesRevenueId = await getAccountGroupId(userId, 'Sales Revenue');

  // Debit Accounts Receivable
  const debitEntry: NewLedger = {
    userId,
    date,
    referenceType: 'sales_invoice',
    referenceId: invoiceId,
    accountId: accountsReceivableId,
    entryType: 'debit',
    amount,
    description: `Sales invoice: ${description}`
  };

  // Credit Sales Revenue
  const creditEntry: NewLedger = {
    userId,
    date,
    referenceType: 'sales_invoice',
    referenceId: invoiceId,
    accountId: salesRevenueId,
    entryType: 'credit',
    amount,
    description: `Sales invoice: ${description}`
  };

  await db.insert(ledger).values([debitEntry, creditEntry]);
};

// Function to create ledger entries for sales return
export const createSalesReturnLedgerEntries = async (
  userId: number,
  returnId: number,
  amount: number,
  date: string,
  description: string
) => {
  const salesReturnsId = await getAccountGroupId(userId, 'Sales Returns');
  const accountsReceivableId = await getAccountGroupId(userId, 'Accounts Receivable');

  // Debit Sales Returns
  const debitEntry: NewLedger = {
    userId,
    date,
    referenceType: 'sales_return',
    referenceId: returnId,
    accountId: salesReturnsId,
    entryType: 'debit',
    amount,
    description: `Sales return: ${description}`
  };

  // Credit Accounts Receivable
  const creditEntry: NewLedger = {
    userId,
    date,
    referenceType: 'sales_return',
    referenceId: returnId,
    accountId: accountsReceivableId,
    entryType: 'credit',
    amount,
    description: `Sales return: ${description}`
  };

  await db.insert(ledger).values([debitEntry, creditEntry]);
};

// Function to create ledger entries for payment-out
export const createPaymentOutLedgerEntries = async (
  userId: number,
  paymentOutId: number,
  amount: number,
  date: string,
  description: string
) => {
  const accountsPayableId = await getAccountGroupId(userId, 'Accounts Payable');
  const bankAccountId = await getAccountGroupId(userId, 'Bank/Cash');

  // Debit Accounts Payable
  const debitEntry: NewLedger = {
    userId,
    date,
    referenceType: 'payment_out',
    referenceId: paymentOutId,
    accountId: accountsPayableId,
    entryType: 'debit',
    amount,
    description: `Payment made: ${description}`
  };

  // Credit Bank/Cash
  const creditEntry: NewLedger = {
    userId,
    date,
    referenceType: 'payment_out',
    referenceId: paymentOutId,
    accountId: bankAccountId,
    entryType: 'credit',
    amount,
    description: `Payment made: ${description}`
  };

  await db.insert(ledger).values([debitEntry, creditEntry]);
};

// Function to create ledger entries for purchase invoice
export const createPurchaseInvoiceLedgerEntries = async (
  userId: number,
  invoiceId: number,
  amount: number,
  date: string,
  description: string
) => {
  const inventoryId = await getAccountGroupId(userId, 'Inventory');
  const accountsPayableId = await getAccountGroupId(userId, 'Accounts Payable');

  // Debit Inventory
  const debitEntry: NewLedger = {
    userId,
    date,
    referenceType: 'purchase_invoice',
    referenceId: invoiceId,
    accountId: inventoryId,
    entryType: 'debit',
    amount,
    description: `Purchase invoice: ${description}`
  };

  // Credit Accounts Payable
  const creditEntry: NewLedger = {
    userId,
    date,
    referenceType: 'purchase_invoice',
    referenceId: invoiceId,
    accountId: accountsPayableId,
    entryType: 'credit',
    amount,
    description: `Purchase invoice: ${description}`
  };

  await db.insert(ledger).values([debitEntry, creditEntry]);
};

// Function to create ledger entries for purchase return
export const createPurchaseReturnLedgerEntries = async (
  userId: number,
  returnId: number,
  amount: number,
  date: string,
  description: string
) => {
  const accountsPayableId = await getAccountGroupId(userId, 'Accounts Payable');
  const purchaseReturnsId = await getAccountGroupId(userId, 'Purchase Returns');

  // Debit Accounts Payable
  const debitEntry: NewLedger = {
    userId,
    date,
    referenceType: 'purchase_return',
    referenceId: returnId,
    accountId: accountsPayableId,
    entryType: 'debit',
    amount,
    description: `Purchase return: ${description}`
  };

  // Credit Purchase Returns
  const creditEntry: NewLedger = {
    userId,
    date,
    referenceType: 'purchase_return',
    referenceId: returnId,
    accountId: purchaseReturnsId,
    entryType: 'credit',
    amount,
    description: `Purchase return: ${description}`
  };

  await db.insert(ledger).values([debitEntry, creditEntry]);
};

// Function to create ledger entries for income
export const createIncomeLedgerEntries = async (
  userId: number,
  incomeId: number,
  amount: number,
  date: string,
  description: string,
  categoryId: number
) => {
  const bankAccountId = await getAccountGroupId(userId, 'Bank/Cash');
  const incomeAccountId = await getAccountGroupId(userId, 'Income');

  // Debit Bank/Cash
  const debitEntry: NewLedger = {
    userId,
    date,
    referenceType: 'income',
    referenceId: incomeId,
    accountId: bankAccountId,
    entryType: 'debit',
    amount,
    description: `Income: ${description}`
  };

  // Credit Income Category
  const creditEntry: NewLedger = {
    userId,
    date,
    referenceType: 'income',
    referenceId: incomeId,
    accountId: incomeAccountId,
    entryType: 'credit',
    amount,
    description: `Income: ${description}`
  };

  await db.insert(ledger).values([debitEntry, creditEntry]);
};

// Function to create ledger entries for expense
export const createExpenseLedgerEntries = async (
  userId: number,
  expenseId: number,
  amount: number,
  date: string,
  description: string,
  categoryId: number
) => {
  const expensesId = await getAccountGroupId(userId, 'Expenses');
  const bankAccountId = await getAccountGroupId(userId, 'Bank/Cash');

  // Debit Expense Category
  const debitEntry: NewLedger = {
    userId,
    date,
    referenceType: 'expense',
    referenceId: expenseId,
    accountId: expensesId,
    entryType: 'debit',
    amount,
    description: `Expense: ${description}`
  };

  // Credit Bank/Cash
  const creditEntry: NewLedger = {
    userId,
    date,
    referenceType: 'expense',
    referenceId: expenseId,
    accountId: bankAccountId,
    entryType: 'credit',
    amount,
    description: `Expense: ${description}`
  };

  await db.insert(ledger).values([debitEntry, creditEntry]);
};

// Function to get ledger entries for a specific reference
export const getLedgerEntriesByReference = async (
  userId: number,
  referenceType: string,
  referenceId: number
) => {
  return await db
    .select()
    .from(ledger)
    .where(
      and(
        eq(ledger.userId, userId),
        eq(ledger.referenceType, referenceType),
        eq(ledger.referenceId, referenceId)
      )
    );
};

// Function to get ledger entries for an account
export const getLedgerEntriesByAccount = async (
  userId: number,
  accountId: number
) => {
  const conditions = [eq(ledger.userId, userId)];
  
  // Add account filter if not requesting all accounts
  if (accountId !== 0) {
    conditions.push(eq(ledger.accountId, accountId));
  }

  return await db
    .select({
      id: ledger.id,
      userId: ledger.userId,
      date: ledger.date,
      referenceType: ledger.referenceType,
      referenceId: ledger.referenceId,
      accountId: ledger.accountId,
      entryType: ledger.entryType,
      amount: ledger.amount,
      description: ledger.description,
      createdAt: ledger.createdAt,
      accountName: accountGroups.name,
      accountType: accountGroups.type
    })
    .from(ledger)
    .leftJoin(accountGroups, eq(ledger.accountId, accountGroups.id))
    .where(and(...conditions))
    .orderBy(ledger.date);
}; 