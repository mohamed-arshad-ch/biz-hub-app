import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  notificationsEnabled: integer('notifications_enabled', { mode: 'boolean' }).default(true),
  emailNotifications: integer('email_notifications', { mode: 'boolean' }).default(true),
  pushNotifications: integer('push_notifications', { mode: 'boolean' }).default(true),
  language: text('language').default('en'),
  theme: text('theme').default('light'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Companies table
export const companies = sqliteTable('companies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  logo: text('logo'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  country: text('country'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  taxId: text('tax_id'),
  industry: text('industry'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Customers table
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  company: text('company'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  country: text('country'),
  contactPerson: text('contact_person'),
  category: text('category'),
  status: text('status').default('active'),
  notes: text('notes'),
  creditLimit: integer('credit_limit').default(0),
  paymentTerms: text('payment_terms'),
  taxId: text('tax_id'),
  tags: text('tags'), // store as comma-separated string
  outstandingBalance: integer('outstanding_balance').default(0),
  totalPurchases: integer('total_purchases').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Vendors table
export const vendors = sqliteTable('vendors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  company: text('company'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  country: text('country'),
  contactPerson: text('contact_person'),
  category: text('category'),
  status: text('status').default('active'),
  notes: text('notes'),
  paymentTerms: text('payment_terms'),
  taxId: text('tax_id'),
  tags: text('tags'), // store as comma-separated string
  totalPurchases: integer('total_purchases').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Products table
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  productName: text('product_name').notNull(),
  sku: text('sku').notNull().unique(),
  barcode: text('barcode'),
  category: text('category'),
  brand: text('brand'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  costPrice: integer('cost_price').notNull(),
  sellingPrice: integer('selling_price').notNull(),
  taxRate: integer('tax_rate').default(0),
  stockQuantity: integer('stock_quantity').notNull(),
  unit: text('unit').default('piece'),
  reorderLevel: integer('reorder_level').default(0),
  vendor: text('vendor'),
  location: text('location'),
  shortDescription: text('short_description'),
  fullDescription: text('full_description'),
  weight: integer('weight').default(0),
  length: integer('length').default(0),
  width: integer('width').default(0),
  height: integer('height').default(0),
  tags: text('tags'), // comma-separated
  notes: text('notes'),
  images: text('images'), // comma-separated
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Sales Orders table
export const salesOrders = sqliteTable('sales_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  orderNumber: text('order_number').notNull(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  orderDate: text('order_date').notNull(),
  status: text('status').default('draft'),
  total: integer('total').notNull(),
  subtotal: integer('subtotal').notNull(),
  tax: integer('tax').default(0),
  discount: integer('discount').default(0),
  notes: text('notes'),
  shippingAddress: text('shipping_address'),
  billingAddress: text('billing_address'),
  paymentTerms: text('payment_terms'),
  dueDate: text('due_date'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Sales Order Items table
export const salesOrderItems = sqliteTable('sales_order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => salesOrders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  total: integer('total').notNull(),
  discount: integer('discount').default(0),
  tax: integer('tax').default(0),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Sales Invoices table
export const salesInvoices = sqliteTable('sales_invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  invoiceNumber: text('invoice_number').notNull(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  invoiceDate: text('invoice_date').notNull(),
  dueDate: text('due_date'),
  status: text('status').default('unpaid'),
  subtotal: integer('subtotal').notNull(),
  tax: integer('tax').default(0),
  total: integer('total').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Sales Invoice Items table
export const salesInvoiceItems = sqliteTable('sales_invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').notNull().references(() => salesInvoices.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  total: integer('total').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Sales Returns table
export const salesReturns = sqliteTable('sales_returns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  returnNumber: text('return_number').notNull(),
  invoiceId: integer('invoice_id').notNull().references(() => salesInvoices.id),
  returnDate: text('return_date').notNull(),
  status: text('status', { enum: ['draft', 'pending', 'approved', 'rejected', 'completed'] }).default('draft'),
  subtotal: integer('subtotal').notNull(),
  tax: integer('tax').default(0),
  total: integer('total').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Sales Return Items table
export const salesReturnItems = sqliteTable('sales_return_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  returnId: integer('return_id').notNull().references(() => salesReturns.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  total: integer('total').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Payment In tables
export const paymentIns = sqliteTable('payment_ins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  paymentNumber: text('payment_number').notNull(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  paymentDate: text('payment_date').notNull(),
  paymentMethod: text('payment_method').notNull(),
  referenceNumber: text('reference_number'),
  status: text('status').notNull().default('pending'),
  amount: integer('amount').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const paymentInItems = sqliteTable('payment_in_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  paymentId: integer('payment_id').notNull().references(() => paymentIns.id),
  invoiceId: integer('invoice_id').notNull().references(() => salesInvoices.id),
  amount: integer('amount').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Purchase Orders table
export const purchaseOrders = sqliteTable('purchase_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  orderNumber: text('order_number').notNull(),
  vendorId: integer('vendor_id').notNull().references(() => vendors.id),
  orderDate: text('order_date').notNull(),
  status: text('status').default('draft'),
  total: integer('total').notNull(),
  subtotal: integer('subtotal').notNull(),
  tax: integer('tax').default(0),
  discount: integer('discount').default(0),
  notes: text('notes'),
  shippingAddress: text('shipping_address'),
  billingAddress: text('billing_address'),
  paymentTerms: text('payment_terms'),
  dueDate: text('due_date'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Purchase Order Items table
export const purchaseOrderItems = sqliteTable('purchase_order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => purchaseOrders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  total: integer('total').notNull(),
  discount: integer('discount').default(0),
  tax: integer('tax').default(0),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Purchase Invoices table
export const purchaseInvoices = sqliteTable('purchase_invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  invoiceNumber: text('invoice_number').notNull(),
  vendorId: integer('vendor_id').notNull().references(() => vendors.id),
  invoiceDate: text('invoice_date').notNull(),
  dueDate: text('due_date'),
  status: text('status').default('unpaid'),
  subtotal: integer('subtotal').notNull(),
  tax: integer('tax').default(0),
  total: integer('total').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Purchase Invoice Items table
export const purchaseInvoiceItems = sqliteTable('purchase_invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').notNull().references(() => purchaseInvoices.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  total: integer('total').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Purchase Returns table
export const purchaseReturns = sqliteTable('purchase_returns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  returnNumber: text('return_number').notNull(),
  invoiceId: integer('invoice_id').notNull().references(() => purchaseInvoices.id),
  returnDate: text('return_date').notNull(),
  status: text('status', { enum: ['draft', 'pending', 'approved', 'rejected', 'completed'] }).default('draft'),
  subtotal: integer('subtotal').notNull(),
  tax: integer('tax').default(0),
  total: integer('total').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Purchase Return Items table
export const purchaseReturnItems = sqliteTable('purchase_return_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  returnId: integer('return_id').notNull().references(() => purchaseReturns.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  total: integer('total').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Payment Out tables
export const paymentOuts = sqliteTable('payment_out', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  paymentNumber: text('payment_number').notNull(),
  vendorId: integer('vendor_id').notNull().references(() => vendors.id),
  paymentDate: text('payment_date').notNull(),
  paymentMethod: text('payment_method').notNull(),
  referenceNumber: text('reference_number'),
  status: text('status').notNull().default('pending'),
  amount: integer('amount').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const paymentOutItems = sqliteTable('payment_out_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  paymentOutId: integer('payment_out_id').notNull().references(() => paymentOuts.id),
  invoiceId: integer('invoice_id').notNull().references(() => purchaseInvoices.id),
  amount: integer('amount').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});


export const incomeCategories = sqliteTable('income_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Expense Categories table
export const expenseCategories = sqliteTable('expense_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Account Groups table
export const accountGroups = sqliteTable('account_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'asset', 'liability', 'equity', 'revenue', 'expense'
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const incomes = sqliteTable('incomes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  categoryId: integer('category_id').notNull().references(() => incomeCategories.id),
  amount: integer('amount').notNull(),
  date: text('date').notNull(),
  description: text('description'),
  paymentMethod: text('payment_method'),
  referenceNumber: text('reference_number'),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  categoryId: integer('category_id').notNull().references(() => expenseCategories.id),
  amount: integer('amount').notNull(),
  date: text('date').notNull(),
  description: text('description'),
  paymentMethod: text('payment_method'),
  referenceNumber: text('reference_number'),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const transactions = sqliteTable('transactions', {
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

// Ledger table for double-entry bookkeeping
export const ledger = sqliteTable('ledger', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  date: text('date').notNull(),
  referenceType: text('reference_type').notNull(), // e.g., 'payment_in', 'sales_invoice', 'sales_return'
  referenceId: integer('reference_id').notNull(), // ID of the related document
  accountId: integer('account_id').notNull(), // References account_groups.id
  entryType: text('entry_type').notNull(), // 'debit' or 'credit'
  amount: integer('amount').notNull(),
  description: text('description'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Export types for use in the app
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type SalesOrder = typeof salesOrders.$inferSelect;
export type NewSalesOrder = typeof salesOrders.$inferInsert;

export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type NewSalesOrderItem = typeof salesOrderItems.$inferInsert;

export type SalesInvoice = typeof salesInvoices.$inferSelect;
export type NewSalesInvoice = typeof salesInvoices.$inferInsert;
export type SalesInvoiceItem = typeof salesInvoiceItems.$inferSelect;
export type NewSalesInvoiceItem = typeof salesInvoiceItems.$inferInsert;

export type SalesReturn = typeof salesReturns.$inferSelect;
export type NewSalesReturn = typeof salesReturns.$inferInsert;
export type SalesReturnItem = typeof salesReturnItems.$inferSelect;
export type NewSalesReturnItem = typeof salesReturnItems.$inferInsert;

// Types
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

export type PurchaseInvoice = typeof purchaseInvoices.$inferSelect;
export type NewPurchaseInvoice = typeof purchaseInvoices.$inferInsert;
export type PurchaseInvoiceItem = typeof purchaseInvoiceItems.$inferSelect;
export type NewPurchaseInvoiceItem = typeof purchaseInvoiceItems.$inferInsert;

export type PurchaseReturn = typeof purchaseReturns.$inferSelect;
export type NewPurchaseReturn = typeof purchaseReturns.$inferInsert;
export type PurchaseReturnItem = typeof purchaseReturnItems.$inferSelect;
export type NewPurchaseReturnItem = typeof purchaseReturnItems.$inferInsert;

// Add types for Drizzle ORM
export type PaymentOut = typeof paymentOuts.$inferSelect;
export type NewPaymentOut = typeof paymentOuts.$inferInsert;
export type PaymentOutItem = typeof paymentOutItems.$inferSelect;
export type NewPaymentOutItem = typeof paymentOutItems.$inferInsert;

// Income Categories table

// Add type definitions for new tables
export type IncomeCategory = typeof incomeCategories.$inferSelect;
export type NewIncomeCategory = typeof incomeCategories.$inferInsert;

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type NewExpenseCategory = typeof expenseCategories.$inferInsert;

export type AccountGroup = typeof accountGroups.$inferSelect;
export type NewAccountGroup = typeof accountGroups.$inferInsert;



export type Income = typeof incomes.$inferSelect;
export type NewIncome = typeof incomes.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

// Add ledger types
export type Ledger = typeof ledger.$inferSelect;
export type NewLedger = typeof ledger.$inferInsert;