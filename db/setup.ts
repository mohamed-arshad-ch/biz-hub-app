import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { sql } from 'drizzle-orm';
import { DATABASE_NAME } from './index';
import * as schema from './schema';

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
    
    console.log('Database set up successfully!');
    return true;
  } catch (error) {
    console.error('Database setup failed:', error);
    return false;
  }
}; 