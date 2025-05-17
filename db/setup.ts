import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { sql } from 'drizzle-orm';
import { DATABASE_NAME } from './index';
import * as schema from './schema';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { createDefaultIncomeCategories } from './income-category';
import { createDefaultExpenseCategories } from './expense-category';
import { createDefaultAccountGroups } from './account-group';
import { db } from './index';
import { 
  incomeCategories, 
  expenseCategories, 
  accountGroups 
} from './schema';
import { eq, and } from 'drizzle-orm';

// Function to set up the database and run migrations
export const setupDatabase = async () => {
  try {
    console.log('Setting up database...');
    
    // Open the database
    const expoDb = openDatabaseSync(DATABASE_NAME);
    
    // Initialize Drizzle with our schema
    const db = drizzle(expoDb, { schema });
    
    // Create tables if they don't exist using raw SQL
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        avatar_url TEXT,
        notifications_enabled INTEGER DEFAULT 1,
        email_notifications INTEGER DEFAULT 1,
        push_notifications INTEGER DEFAULT 1,
        language TEXT DEFAULT 'en',
        theme TEXT DEFAULT 'light',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        logo TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        country TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        tax_id TEXT,
        industry TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Add customers table creation
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        company TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        country TEXT,
        contact_person TEXT,
        category TEXT,
        status TEXT DEFAULT 'active',
        notes TEXT,
        credit_limit INTEGER DEFAULT 0,
        payment_terms TEXT,
        tax_id TEXT,
        tags TEXT,
        outstanding_balance INTEGER DEFAULT 0,
        total_purchases INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Add products table creation
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        barcode TEXT,
        category TEXT,
        brand TEXT,
        is_active INTEGER DEFAULT 1,
        cost_price INTEGER NOT NULL,
        selling_price INTEGER NOT NULL,
        tax_rate INTEGER DEFAULT 0,
        stock_quantity INTEGER NOT NULL,
        unit TEXT DEFAULT 'piece',
        reorder_level INTEGER DEFAULT 0,
        vendor TEXT,
        location TEXT,
        short_description TEXT,
        full_description TEXT,
        weight INTEGER DEFAULT 0,
        length INTEGER DEFAULT 0,
        width INTEGER DEFAULT 0,
        height INTEGER DEFAULT 0,
        tags TEXT,
        notes TEXT,
        images TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Ensure 'discount' column exists in 'sales_orders' table
    try {
      const pragmaResult = await expoDb.execAsync(`PRAGMA table_info(sales_orders);`) as unknown as { rows: any[] };
      const columns = Array.isArray(pragmaResult?.rows) ? pragmaResult.rows : [];
      
      // Check and add discount column if needed
      const hasDiscount = columns.some((col: any) => col.name === 'discount');
      if (!hasDiscount) {
        await expoDb.execAsync(`ALTER TABLE sales_orders ADD COLUMN discount INTEGER DEFAULT 0;`);
      }

      // Check and add shipping_address column if needed
      const hasShippingAddress = columns.some((col: any) => col.name === 'shipping_address');
      if (!hasShippingAddress) {
        await expoDb.execAsync(`ALTER TABLE sales_orders ADD COLUMN shipping_address TEXT;`);
      }

      // Check and add billing_address column if needed
      const hasBillingAddress = columns.some((col: any) => col.name === 'billing_address');
      if (!hasBillingAddress) {
        await expoDb.execAsync(`ALTER TABLE sales_orders ADD COLUMN billing_address TEXT;`);
      }

      // Check and add payment_terms column if needed
      const hasPaymentTerms = columns.some((col: any) => col.name === 'payment_terms');
      if (!hasPaymentTerms) {
        await expoDb.execAsync(`ALTER TABLE sales_orders ADD COLUMN payment_terms TEXT;`);
      }

      // Check and add due_date column if needed
      const hasDueDate = columns.some((col: any) => col.name === 'due_date');
      if (!hasDueDate) {
        await expoDb.execAsync(`ALTER TABLE sales_orders ADD COLUMN due_date TEXT;`);
      }
    } catch (e) {
      // Ignore errors if table doesn't exist yet
    }

    // Add sales orders table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        order_number TEXT NOT NULL,
        customer_id INTEGER NOT NULL,
        order_date TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        total INTEGER NOT NULL,
        subtotal INTEGER NOT NULL,
        tax INTEGER DEFAULT 0,
        discount INTEGER DEFAULT 0,
        notes TEXT,
        shipping_address TEXT,
        billing_address TEXT,
        payment_terms TEXT,
        due_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );
    `);

    // Add sales order items table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS sales_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        total INTEGER NOT NULL,
        discount INTEGER DEFAULT 0,
        tax INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES sales_orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    // Add sales invoices table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS sales_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        invoice_number TEXT NOT NULL,
        customer_id INTEGER NOT NULL,
        invoice_date TEXT NOT NULL,
        due_date TEXT,
        status TEXT DEFAULT 'unpaid',
        subtotal INTEGER NOT NULL,
        tax INTEGER DEFAULT 0,
        total INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );
    `);

    // Add sales invoice items table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS sales_invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        invoice_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        total INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    // Add sales returns table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS sales_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        return_number TEXT NOT NULL,
        invoice_id INTEGER NOT NULL,
        return_date TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        subtotal INTEGER NOT NULL,
        tax INTEGER DEFAULT 0,
        total INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id)
      );
    `);

    // Add sales return items table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS sales_return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        return_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        total INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (return_id) REFERENCES sales_returns(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    // Add payment ins table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS payment_ins (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        payment_number TEXT NOT NULL,
        customer_id INTEGER NOT NULL,
        payment_date TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        reference_number TEXT,
        status TEXT DEFAULT 'pending',
        amount INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );
    `);

    // Add payment in items table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS payment_in_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        payment_id INTEGER NOT NULL,
        invoice_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES payment_ins(id),
        FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id)
      );
    `);

    // Add vendors table creation
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        company TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        country TEXT,
        contact_person TEXT,
        category TEXT,
        status TEXT DEFAULT 'active',
        notes TEXT,
        payment_terms TEXT,
        tax_id TEXT,
        tags TEXT,
        total_purchases INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Add purchase orders table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        order_number TEXT NOT NULL,
        vendor_id INTEGER NOT NULL,
        order_date TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        total INTEGER NOT NULL,
        subtotal INTEGER NOT NULL,
        tax INTEGER DEFAULT 0,
        discount INTEGER DEFAULT 0,
        notes TEXT,
        shipping_address TEXT,
        billing_address TEXT,
        payment_terms TEXT,
        due_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
      );
    `);

    // Add purchase order items table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        total INTEGER NOT NULL,
        discount INTEGER DEFAULT 0,
        tax INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    // Add purchase invoice items table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS purchase_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        invoice_number TEXT NOT NULL,
        vendor_id INTEGER NOT NULL,
        invoice_date TEXT NOT NULL,
        due_date TEXT,
        status TEXT DEFAULT 'unpaid',
        subtotal INTEGER NOT NULL,
        tax INTEGER DEFAULT 0,
        total INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
      );
    `);

    // Add purchase invoice items table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS purchase_invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        invoice_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        total INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    // Add purchase returns table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS purchase_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        return_number TEXT NOT NULL,
        invoice_id INTEGER NOT NULL,
        return_date TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        subtotal INTEGER NOT NULL,
        tax INTEGER DEFAULT 0,
        total INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id)
      );
    `);

    // Add purchase return items table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS purchase_return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        return_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        total INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (return_id) REFERENCES purchase_returns(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    // Add payment out table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS payment_out (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        vendor_id INTEGER NOT NULL,
        payment_number TEXT NOT NULL,
        payment_date TEXT NOT NULL,
        amount INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        reference_number TEXT,
        notes TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
      );
    `);

    // Add payment out items table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS payment_out_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        payment_out_id INTEGER NOT NULL,
        invoice_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (payment_out_id) REFERENCES payment_out(id),
        FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id)
      );
    `);

    // Add income categories table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS income_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Add expense categories table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Add account groups table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS account_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Add income table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS incomes (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        payment_method TEXT,
        reference_number TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (category_id) REFERENCES income_categories(id)
      );
    `);
    
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        payment_method TEXT,
        reference_number TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (category_id) REFERENCES expense_categories(id)
      );
    `);

    // Add transactions table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL,
        reference_id INTEGER NOT NULL,
        reference_type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        reference_number TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Add ledger table for double-entry bookkeeping
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        reference_type TEXT NOT NULL,
        reference_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        entry_type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (account_id) REFERENCES account_groups(id)
      );
    `);
    
    console.log('Database set up successfully!');
    return true;
  } catch (error) {
    console.error('Database setup failed:', error);
    return false;
  }
};

// Function to set up default data for a new user
export const setupDefaultData = async (userId: number) => {
  try {
    console.log('Setting up default data for user:', userId);

    // Check if default data already exists for this user
    const existingIncomeCategories = await db
      .select()
      .from(incomeCategories)
      .where(and(
        eq(incomeCategories.userId, userId),
        eq(incomeCategories.isDefault, true)
      ));

    const existingExpenseCategories = await db
      .select()
      .from(expenseCategories)
      .where(and(
        eq(expenseCategories.userId, userId),
        eq(expenseCategories.isDefault, true)
      ));

    const existingAccountGroups = await db
      .select()
      .from(accountGroups)
      .where(and(
        eq(accountGroups.userId, userId),
        eq(accountGroups.isDefault, true)
      ));

    // Only create default data if none exists
    if (existingIncomeCategories.length === 0) {
      // Create default income categories
      const defaultIncomeCategories = [
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

      // Insert default income categories
      for (const category of defaultIncomeCategories) {
        await db.insert(incomeCategories).values({
          userId,
          name: category.name,
          description: category.description,
          color: category.color,
          isDefault: category.isDefault,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      console.log('Default income categories created for user:', userId);
    }

    if (existingExpenseCategories.length === 0) {
      // Create default expense categories
      const defaultExpenseCategories = [
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

      // Insert default expense categories
      for (const category of defaultExpenseCategories) {
        await db.insert(expenseCategories).values({
          userId,
          name: category.name,
          description: category.description,
          color: category.color,
          isDefault: category.isDefault,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      console.log('Default expense categories created for user:', userId);
    }

    if (existingAccountGroups.length === 0) {
      // Create default account groups
      const defaultAccountGroups = [
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

      // Insert default account groups
      for (const group of defaultAccountGroups) {
        await db.insert(accountGroups).values({
          userId,
          name: group.name,
          description: group.description,
          type: group.type,
          isDefault: group.isDefault,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      console.log('Default account groups created for user:', userId);
    }

    console.log('Default data setup completed for user:', userId);
  } catch (error) {
    console.error('Error creating default data:', error);
    throw error;
  }
};


