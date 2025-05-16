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

// Export types for use in the app
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert; 