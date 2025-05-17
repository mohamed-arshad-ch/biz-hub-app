import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// Database name
export const DATABASE_NAME = 'bizhub-db';

// Create or open the database (for reference only, use SQLiteContext in components)
const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

// Initialize Drizzle with our schema (for reference only)
export const db = drizzle(expoDb, { schema });

// Export the schema
export * from './schema';

// Export the setup function
export { setupDatabase,setupDefaultData } from './setup'; 