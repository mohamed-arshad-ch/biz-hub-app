import { db, customers } from './index';
import { eq, and } from 'drizzle-orm';
import { Customer, NewCustomer, ledger, accountGroups, salesInvoices, paymentIns, paymentInItems, salesReturns } from './schema';

// Get all customers
export const getAllCustomers = async (): Promise<Customer[]> => {
  return await db.select().from(customers).all();
};

// Get a customer by ID
export const getCustomerById = async (id: number): Promise<Customer | null> => {
  const result = await db.select().from(customers).where(eq(customers.id, id)).get();
  return result || null;
};

// Add a new customer
export const addCustomer = async (data: Omit<NewCustomer, 'id' | 'createdAt'> & { userId: number }): Promise<Customer | null> => {
  // Convert tags array to comma-separated string if needed
  const tags = Array.isArray(data.tags) ? data.tags.join(',') : data.tags;
  const result = await db.insert(customers).values({ ...data, tags }).returning().get();
  return result || null;
};

// Update a customer
export const updateCustomer = async (id: number, data: Partial<NewCustomer>): Promise<Customer | null> => {
  // Convert tags array to comma-separated string if needed
  const tags = Array.isArray(data.tags) ? data.tags.join(',') : data.tags;
  const result = await db.update(customers)
    .set({ ...data, ...(tags !== undefined ? { tags } : {}) })
    .where(eq(customers.id, id))
    .returning()
    .get();
  return result || null;
};

// Delete a customer
export const deleteCustomer = async (id: number): Promise<boolean> => {
  const result = await db.delete(customers).where(eq(customers.id, id)).run();
  return result.changes > 0;
};

// Calculate customer balance from ledger entries
export const getCustomerBalanceFromLedger = async (userId: number, customerId: number): Promise<number> => {
  try {
    // Get the Accounts Receivable account ID
    const [accountsReceivableAccount] = await db
      .select()
      .from(accountGroups)
      .where(
        and(
          eq(accountGroups.userId, userId),
          eq(accountGroups.name, 'Accounts Receivable')
        )
      );
    
    if (!accountsReceivableAccount) {
      console.error('Accounts Receivable account not found');
      return 0;
    }
    
    // Get all sales invoices for this customer
    const customerInvoices = await db
      .select({ id: salesInvoices.id })
      .from(salesInvoices)
      .where(
        and(
          eq(salesInvoices.userId, userId),
          eq(salesInvoices.customerId, customerId)
        )
      );
    
    const invoiceIds = customerInvoices.map(inv => inv.id);
    
    // Get all payments for this customer
    const customerPayments = await db
      .select({ id: paymentIns.id })
      .from(paymentIns)
      .where(
        and(
          eq(paymentIns.userId, userId),
          eq(paymentIns.customerId, customerId)
        )
      );
    
    const paymentIds = customerPayments.map(payment => payment.id);
    
    // Get all sales returns for this customer (through invoices)
    const customerReturns = await db
      .select({ id: salesReturns.id })
      .from(salesReturns)
      .where(
        and(
          eq(salesReturns.userId, userId),
          eq(salesReturns.status, 'completed')
        )
      )
      .innerJoin(
        salesInvoices,
        and(
          eq(salesReturns.invoiceId, salesInvoices.id),
          eq(salesInvoices.customerId, customerId)
        )
      );
    
    const returnIds = customerReturns.map(ret => ret.id);
    
    // Get all ledger entries for this customer's Accounts Receivable
    const ledgerEntries = await db
      .select({
        referenceType: ledger.referenceType,
        referenceId: ledger.referenceId,
        entryType: ledger.entryType,
        amount: ledger.amount
      })
      .from(ledger)
      .where(
        and(
          eq(ledger.userId, userId),
          eq(ledger.accountId, accountsReceivableAccount.id)
        )
      );
    
    // Filter and calculate balance
    let balance = 0;
    for (const entry of ledgerEntries) {
      // Process sales invoice entries (debit entries)
      if (entry.referenceType === 'sales_invoice' && 
          entry.entryType === 'debit' && 
          invoiceIds.includes(entry.referenceId)) {
        balance += entry.amount;
      }
      
      // Process payment entries (credit entries)
      else if (entry.referenceType === 'payment_in' && 
               entry.entryType === 'credit' && 
               paymentIds.includes(entry.referenceId)) {
        balance -= entry.amount;
      }
      
      // Process sales return entries (credit entries)
      else if (entry.referenceType === 'sales_return' && 
               entry.entryType === 'credit' && 
               returnIds.includes(entry.referenceId)) {
        balance -= entry.amount;
      }
    }
    
    return balance;
  } catch (error) {
    console.error('Error calculating customer balance:', error);
    return 0;
  }
}; 