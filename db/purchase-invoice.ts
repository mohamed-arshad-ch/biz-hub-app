import { db } from './index';
import { purchaseInvoices, purchaseInvoiceItems, transactions, type NewPurchaseInvoice, type NewPurchaseInvoiceItem, products, vendors } from './schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { createPurchaseInvoiceTransaction, updateTransaction } from './transaction';
import { createPurchaseInvoiceLedgerEntries } from './ledger';

// Get all purchase invoices for a user
export const getPurchaseInvoices = async (userId: number, sort: 'newest' | 'oldest' = 'newest') => {
  try {
    const invoices = await db.select().from(purchaseInvoices)
      .where(eq(purchaseInvoices.userId, userId))
      .orderBy(sort === 'newest' ? desc(purchaseInvoices.createdAt) : asc(purchaseInvoices.createdAt));
    return invoices;
  } catch (error) {
    console.error('Error fetching purchase invoices:', error);
    throw error;
  }
};

// Get a single purchase invoice by ID
export const getPurchaseInvoiceById = async (id: number, userId: number) => {
  try {
    const [invoice] = await db.select().from(purchaseInvoices)
      .where(and(eq(purchaseInvoices.id, id), eq(purchaseInvoices.userId, userId)));
    if (!invoice) return null;
    
    const items = await db.select({
      id: purchaseInvoiceItems.id,
      invoiceId: purchaseInvoiceItems.invoiceId,
      productId: purchaseInvoiceItems.productId,
      quantity: purchaseInvoiceItems.quantity,
      unitPrice: purchaseInvoiceItems.unitPrice,
      total: purchaseInvoiceItems.total,
      notes: purchaseInvoiceItems.notes,
      createdAt: purchaseInvoiceItems.createdAt,
      productName: products.productName
    })
    .from(purchaseInvoiceItems)
    .leftJoin(products, eq(purchaseInvoiceItems.productId, products.id))
    .where(eq(purchaseInvoiceItems.invoiceId, id));
    
    return { ...invoice, items };
  } catch (error) {
    console.error('Error fetching purchase invoice:', error);
    throw error;
  }
};

// Create a new purchase invoice
export const createPurchaseInvoice = async (invoice: NewPurchaseInvoice, items: NewPurchaseInvoiceItem[]) => {
  try {
    const result = await db.transaction(async (tx) => {
      const [newInvoice] = await tx.insert(purchaseInvoices).values(invoice).returning();
      const invoiceItems = items.map(item => ({ ...item, invoiceId: newInvoice.id }));
      await tx.insert(purchaseInvoiceItems).values(invoiceItems);

      // Create a transaction record
      await createPurchaseInvoiceTransaction(
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
      await createPurchaseInvoiceLedgerEntries(
        invoice.userId,
        newInvoice.id,
        invoice.total,
        invoice.invoiceDate,
        invoice.notes || `Purchase Invoice #${newInvoice.invoiceNumber}`
      );

      return newInvoice;
    });
    return result;
  } catch (error) {
    console.error('Error creating purchase invoice:', error);
    throw error;
  }
};

// Update a purchase invoice
export const updatePurchaseInvoice = async (
  id: number,
  userId: number,
  invoice: Partial<NewPurchaseInvoice>,
  items?: NewPurchaseInvoiceItem[]
) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the current invoice to check for changes
      const [currentInvoice] = await tx.select().from(purchaseInvoices)
        .where(
          and(
            eq(purchaseInvoices.id, id),
            eq(purchaseInvoices.userId, userId)
          )
        );

      if (!currentInvoice) {
        throw new Error('Purchase invoice not found');
      }

      // Update invoice
      await tx.update(purchaseInvoices)
        .set({ ...invoice, updatedAt: new Date().toISOString() })
        .where(and(eq(purchaseInvoices.id, id), eq(purchaseInvoices.userId, userId)));

      if (items) {
        // Delete old items
        await tx.delete(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.invoiceId, id));
        // Insert new items
        const invoiceItems = items.map(item => ({ ...item, invoiceId: id }));
        await tx.insert(purchaseInvoiceItems).values(invoiceItems);
      }

      // Update the transaction if amount or status changed
      if (invoice.total !== currentInvoice.total || invoice.status !== currentInvoice.status) {
        const invoiceTransactions = await tx.select().from(transactions)
          .where(
            and(
              eq(transactions.referenceType, 'purchase_invoice'),
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
              description: invoice.notes || `Purchase Invoice #${id}`
            }
          );
        }
      }
    });
  } catch (error) {
    console.error('Error updating purchase invoice:', error);
    throw error;
  }
};

// Delete a purchase invoice
export const deletePurchaseInvoice = async (id: number, userId: number) => {
  try {
    return await db.transaction(async (tx) => {
      // Get the transaction record
      const invoiceTransactions = await tx.select().from(transactions)
        .where(
          and(
            eq(transactions.referenceType, 'purchase_invoice'),
            eq(transactions.referenceId, id)
          )
        );

      // Delete invoice items
      await tx.delete(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.invoiceId, id));
      
      // Delete the invoice
      await tx.delete(purchaseInvoices)
        .where(and(eq(purchaseInvoices.id, id), eq(purchaseInvoices.userId, userId)));

      // Delete the transaction record
      if (invoiceTransactions.length > 0) {
        await tx.delete(transactions)
          .where(eq(transactions.id, invoiceTransactions[0].id));
      }
    });
  } catch (error) {
    console.error('Error deleting purchase invoice:', error);
    throw error;
  }
};

// Update purchase invoice status
export const updatePurchaseInvoiceStatus = async (
  id: number,
  userId: number,
  status: string
) => {
  try {
    const [updatedInvoice] = await db
      .update(purchaseInvoices)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(purchaseInvoices.id, id),
          eq(purchaseInvoices.userId, userId)
        )
      )
      .returning();

    return updatedInvoice;
  } catch (error) {
    console.error('Error updating purchase invoice status:', error);
    throw error;
  }
};

// Get purchase report data
export const getPurchaseReportData = async (userId: number, startDate: Date, endDate: Date) => {
  try {
    const purchases = await db.select({
      id: purchaseInvoices.id,
      invoiceNumber: purchaseInvoices.invoiceNumber,
      date: purchaseInvoices.invoiceDate,
      vendorId: purchaseInvoices.vendorId,
      vendorName: vendors.name,
      total: purchaseInvoices.total,
      status: purchaseInvoices.status,
      notes: purchaseInvoices.notes,
      createdAt: purchaseInvoices.createdAt
    })
    .from(purchaseInvoices)
    .leftJoin(vendors, eq(purchaseInvoices.vendorId, vendors.id))
    .where(
      and(
        eq(purchaseInvoices.userId, userId),
        sql`${purchaseInvoices.invoiceDate} >= ${startDate.toISOString()}`,
        sql`${purchaseInvoices.invoiceDate} <= ${endDate.toISOString()}`
      )
    )
    .orderBy(desc(purchaseInvoices.invoiceDate));

    return purchases;
  } catch (error) {
    console.error('Error fetching purchase report data:', error);
    throw error;
  }
};

// Get purchase summary statistics
export const getPurchaseSummaryStats = async (userId: number, startDate: Date, endDate: Date) => {
  try {
    const stats = await db.select({
      totalPurchases: sql`count(${purchaseInvoices.id})`,
      totalAmount: sql`sum(${purchaseInvoices.total})`,
      averageAmount: sql`avg(${purchaseInvoices.total})`,
      totalPaid: sql`sum(case when ${purchaseInvoices.status} = 'paid' then ${purchaseInvoices.total} else 0 end)`,
      totalUnpaid: sql`sum(case when ${purchaseInvoices.status} = 'unpaid' then ${purchaseInvoices.total} else 0 end)`
    })
    .from(purchaseInvoices)
    .where(
      and(
        eq(purchaseInvoices.userId, userId),
        sql`${purchaseInvoices.invoiceDate} >= ${startDate.toISOString()}`,
        sql`${purchaseInvoices.invoiceDate} <= ${endDate.toISOString()}`
      )
    );

    return stats;
  } catch (error) {
    console.error('Error fetching purchase summary stats:', error);
    throw error;
  }
};

// Get purchases by vendor
export const getPurchasesByVendor = async (userId: number, startDate: Date, endDate: Date) => {
  try {
    const vendorStats = await db.select({
      vendorId: purchaseInvoices.vendorId,
      vendorName: vendors.name,
      totalPurchases: sql`count(${purchaseInvoices.id})`,
      totalAmount: sql`sum(${purchaseInvoices.total})`,
      averageAmount: sql`avg(${purchaseInvoices.total})`
    })
    .from(purchaseInvoices)
    .leftJoin(vendors, eq(purchaseInvoices.vendorId, vendors.id))
    .where(
      and(
        eq(purchaseInvoices.userId, userId),
        sql`${purchaseInvoices.invoiceDate} >= ${startDate.toISOString()}`,
        sql`${purchaseInvoices.invoiceDate} <= ${endDate.toISOString()}`
      )
    )
    .groupBy(purchaseInvoices.vendorId, vendors.name)
    .orderBy(sql`sum(${purchaseInvoices.total}) desc`);

    return vendorStats;
  } catch (error) {
    console.error('Error fetching purchases by vendor:', error);
    throw error;
  }
};

// Get purchases by product
export const getPurchasesByProduct = async (userId: number, startDate: Date, endDate: Date) => {
  try {
    const productStats = await db.select({
      productId: purchaseInvoiceItems.productId,
      productName: products.productName,
      quantitySold: sql`sum(${purchaseInvoiceItems.quantity})`,
      totalAmount: sql`sum(${purchaseInvoiceItems.total})`,
      averageAmount: sql`avg(${purchaseInvoiceItems.total})`
    })
    .from(purchaseInvoiceItems)
    .leftJoin(products, eq(purchaseInvoiceItems.productId, products.id))
    .leftJoin(purchaseInvoices, eq(purchaseInvoiceItems.invoiceId, purchaseInvoices.id))
    .where(
      and(
        eq(purchaseInvoices.userId, userId),
        sql`${purchaseInvoices.invoiceDate} >= ${startDate.toISOString()}`,
        sql`${purchaseInvoices.invoiceDate} <= ${endDate.toISOString()}`
      )
    )
    .groupBy(purchaseInvoiceItems.productId, products.productName)
    .orderBy(sql`sum(${purchaseInvoiceItems.total}) desc`);

    return productStats;
  } catch (error) {
    console.error('Error fetching purchases by product:', error);
    throw error;
  }
};

// Get purchases by date range
export const getPurchasesByDateRange = async (userId: number, startDate: Date, endDate: Date) => {
  try {
    const dateStats = await db.select({
      date: purchaseInvoices.invoiceDate,
      totalPurchases: sql`count(${purchaseInvoices.id})`,
      totalAmount: sql`sum(${purchaseInvoices.total})`,
      averageAmount: sql`avg(${purchaseInvoices.total})`
    })
    .from(purchaseInvoices)
    .where(
      and(
        eq(purchaseInvoices.userId, userId),
        sql`${purchaseInvoices.invoiceDate} >= ${startDate.toISOString()}`,
        sql`${purchaseInvoices.invoiceDate} <= ${endDate.toISOString()}`
      )
    )
    .groupBy(purchaseInvoices.invoiceDate)
    .orderBy(purchaseInvoices.invoiceDate);

    return dateStats;
  } catch (error) {
    console.error('Error fetching purchases by date range:', error);
    throw error;
  }
}; 