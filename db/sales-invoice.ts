import { db } from './index';
import { salesInvoices, salesInvoiceItems, transactions, type NewSalesInvoice, type NewSalesInvoiceItem, products, customers } from './schema';
import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { createSalesInvoiceTransaction, updateTransaction } from './transaction';
import { createSalesInvoiceLedgerEntries } from './ledger';

export const createSalesInvoice = async (invoice: NewSalesInvoice, items: NewSalesInvoiceItem[]) => {
  try {
    const result = await db.transaction(async (tx) => {
      const [newInvoice] = await tx.insert(salesInvoices).values(invoice).returning();
      const invoiceItems = items.map(item => ({ ...item, invoiceId: newInvoice.id }));
      await tx.insert(salesInvoiceItems).values(invoiceItems);

      // Create a transaction record
      await createSalesInvoiceTransaction(
        invoice.userId,
        newInvoice.id,
        invoice.total,
        invoice.invoiceDate,
        invoice.notes || undefined,
        invoice.status || 'unpaid',
        undefined,
        undefined
      );

      // Create ledger entries
      await createSalesInvoiceLedgerEntries(
        invoice.userId,
        newInvoice.id,
        invoice.total,
        invoice.invoiceDate,
        invoice.notes || `Sales Invoice #${newInvoice.invoiceNumber}`
      );

      return newInvoice;
    });
    return result;
  } catch (error) {
    console.error('Error creating sales invoice:', error);
    throw error;
  }
};

export const getSalesInvoices = async (userId: number, sort: 'newest' | 'oldest' = 'newest') => {
  try {
    const invoices = await db.select().from(salesInvoices)
      .where(eq(salesInvoices.userId, userId))
      .orderBy(sort === 'newest' ? desc(salesInvoices.createdAt) : asc(salesInvoices.createdAt));
    return invoices;
  } catch (error) {
    console.error('Error fetching sales invoices:', error);
    throw error;
  }
};

export const getSalesInvoiceById = async (id: number, userId: number) => {
  try {
    const [invoice] = await db.select().from(salesInvoices)
      .where(and(eq(salesInvoices.id, id), eq(salesInvoices.userId, userId)));
    if (!invoice) return null;
    
    const items = await db.select({
      id: salesInvoiceItems.id,
      invoiceId: salesInvoiceItems.invoiceId,
      productId: salesInvoiceItems.productId,
      quantity: salesInvoiceItems.quantity,
      unitPrice: salesInvoiceItems.unitPrice,
      total: salesInvoiceItems.total,
      notes: salesInvoiceItems.notes,
      createdAt: salesInvoiceItems.createdAt,
      productName: products.productName
    })
    .from(salesInvoiceItems)
    .leftJoin(products, eq(salesInvoiceItems.productId, products.id))
    .where(eq(salesInvoiceItems.invoiceId, id));
    
    return { ...invoice, items };
  } catch (error) {
    console.error('Error fetching sales invoice:', error);
    throw error;
  }
};

// Update a sales invoice and its items
export const updateSalesInvoice = async (
  id: number,
  userId: number,
  invoice: Partial<NewSalesInvoice>,
  items?: NewSalesInvoiceItem[]
) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the current invoice to check for changes
      const [currentInvoice] = await tx.select().from(salesInvoices)
        .where(
          and(
            eq(salesInvoices.id, id),
            eq(salesInvoices.userId, userId)
          )
        );

      if (!currentInvoice) {
        throw new Error('Sales invoice not found');
      }

      // Update invoice
      await tx.update(salesInvoices)
        .set({ ...invoice, updatedAt: new Date().toISOString() })
        .where(and(eq(salesInvoices.id, id), eq(salesInvoices.userId, userId)));

      if (items) {
        // Delete old items
        await tx.delete(salesInvoiceItems).where(eq(salesInvoiceItems.invoiceId, id));
        // Insert new items
        const invoiceItems = items.map(item => ({ ...item, invoiceId: id }));
        await tx.insert(salesInvoiceItems).values(invoiceItems);
      }

      // Update the transaction if amount or status changed
      if (invoice.total !== currentInvoice.total || invoice.status !== currentInvoice.status) {
        const invoiceTransactions = await tx.select().from(transactions)
          .where(
            and(
              eq(transactions.referenceType, 'sales_invoice'),
              eq(transactions.referenceId, id)
            )
          );

        if (invoiceTransactions.length > 0) {
          await updateTransaction(
            invoiceTransactions[0].id,
            userId,
            {
              amount: invoice.total,
              status: invoice.status || 'unpaid',
              description: invoice.notes || `Sales Invoice #${id}`
            }
          );
        }
      }
    });
  } catch (error) {
    console.error('Error updating sales invoice:', error);
    throw error;
  }
};

// Delete a sales invoice and its items
export const deleteSalesInvoice = async (id: number, userId: number) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the transaction record
      const invoiceTransactions = await tx.select().from(transactions)
        .where(
          and(
            eq(transactions.referenceType, 'sales_invoice'),
            eq(transactions.referenceId, id)
          )
        );

      // Delete invoice items
      await tx.delete(salesInvoiceItems).where(eq(salesInvoiceItems.invoiceId, id));
      
      // Delete the invoice
      await tx.delete(salesInvoices)
        .where(and(eq(salesInvoices.id, id), eq(salesInvoices.userId, userId)));

      // Delete the transaction record
      if (invoiceTransactions.length > 0) {
        await tx.delete(transactions)
          .where(eq(transactions.id, invoiceTransactions[0].id));
      }
    });
  } catch (error) {
    console.error('Error deleting sales invoice:', error);
    throw error;
  }
};

// Get sales report data
export async function getSalesReportData(userId: number, startDate?: Date, endDate?: Date) {
  const whereCondition = startDate && endDate
    ? and(
        eq(salesInvoices.userId, userId),
        gte(salesInvoices.invoiceDate, startDate.toISOString()),
        lte(salesInvoices.invoiceDate, endDate.toISOString())
      )
    : eq(salesInvoices.userId, userId);

  return db.select({
    id: salesInvoices.id,
    date: salesInvoices.invoiceDate,
    invoiceNumber: salesInvoices.invoiceNumber,
    customer: customers.name,
    customerId: salesInvoices.customerId,
    amount: salesInvoices.total,
    subtotal: salesInvoices.subtotal,
    taxAmount: salesInvoices.tax,
    status: salesInvoices.status,
    notes: salesInvoices.notes,
    createdAt: salesInvoices.createdAt,
    updatedAt: salesInvoices.updatedAt
  })
  .from(salesInvoices)
  .leftJoin(customers, eq(salesInvoices.customerId, customers.id))
  .where(whereCondition);
}

// Get sales summary statistics
export async function getSalesSummaryStats(userId: number, startDate?: Date, endDate?: Date) {
  const whereCondition = startDate && endDate
    ? and(
        eq(salesInvoices.userId, userId),
        gte(salesInvoices.invoiceDate, startDate.toISOString()),
        lte(salesInvoices.invoiceDate, endDate.toISOString())
      )
    : eq(salesInvoices.userId, userId);

  return db.select({
    totalAmount: sql<number>`sum(${salesInvoices.total})`,
    totalSubtotal: sql<number>`sum(${salesInvoices.subtotal})`,
    totalTax: sql<number>`sum(${salesInvoices.tax})`,
    count: sql<number>`count(*)`,
    average: sql<number>`avg(${salesInvoices.total})`
  })
  .from(salesInvoices)
  .where(whereCondition);
}

// Get sales by customer
export async function getSalesByCustomer(userId: number, startDate?: Date, endDate?: Date) {
  const whereCondition = startDate && endDate
    ? and(
        eq(salesInvoices.userId, userId),
        gte(salesInvoices.invoiceDate, startDate.toISOString()),
        lte(salesInvoices.invoiceDate, endDate.toISOString())
      )
    : eq(salesInvoices.userId, userId);

  return db.select({
    customerId: salesInvoices.customerId,
    customerName: customers.name,
    transactionCount: sql<number>`count(*)`,
    totalAmount: sql<number>`sum(${salesInvoices.total})`,
    averageAmount: sql<number>`avg(${salesInvoices.total})`
  })
  .from(salesInvoices)
  .leftJoin(customers, eq(salesInvoices.customerId, customers.id))
  .where(whereCondition)
  .groupBy(salesInvoices.customerId, customers.name);
}

// Get sales by product
export async function getSalesByProduct(userId: number, startDate?: Date, endDate?: Date) {
  const whereCondition = startDate && endDate
    ? and(
        eq(salesInvoices.userId, userId),
        gte(salesInvoices.invoiceDate, startDate.toISOString()),
        lte(salesInvoices.invoiceDate, endDate.toISOString())
      )
    : eq(salesInvoices.userId, userId);

  return db.select({
    productId: salesInvoiceItems.productId,
    productName: products.productName,
    quantitySold: sql<number>`sum(${salesInvoiceItems.quantity})`,
    totalAmount: sql<number>`sum(${salesInvoiceItems.total})`,
    costOfGoodsSold: sql<number>`sum(${salesInvoiceItems.quantity} * ${products.costPrice})`,
  })
  .from(salesInvoiceItems)
  .leftJoin(salesInvoices, eq(salesInvoiceItems.invoiceId, salesInvoices.id))
  .leftJoin(products, eq(salesInvoiceItems.productId, products.id))
  .where(whereCondition)
  .groupBy(salesInvoiceItems.productId, products.productName);
}

// Get sales by date range
export async function getSalesByDateRange(userId: number, startDate?: Date, endDate?: Date) {
  const whereCondition = startDate && endDate
    ? and(
        eq(salesInvoices.userId, userId),
        gte(salesInvoices.invoiceDate, startDate.toISOString()),
        lte(salesInvoices.invoiceDate, endDate.toISOString())
      )
    : eq(salesInvoices.userId, userId);

  return db.select({
    date: salesInvoices.invoiceDate,
    totalAmount: sql<number>`sum(${salesInvoices.total})`,
    count: sql<number>`count(*)`
  })
  .from(salesInvoices)
  .where(whereCondition)
  .groupBy(salesInvoices.invoiceDate);
} 