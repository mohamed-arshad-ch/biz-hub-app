import { db, customers } from './index';
import { eq } from 'drizzle-orm';
import { Customer, NewCustomer } from './schema';

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