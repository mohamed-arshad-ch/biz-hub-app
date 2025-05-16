import { db, vendors } from './index';
import { eq } from 'drizzle-orm';
import { Vendor, NewVendor } from './schema';

// Get all vendors
export const getAllVendors = async (): Promise<Vendor[]> => {
  return await db.select().from(vendors).all();
};

// Get a vendor by ID
export const getVendorById = async (id: number): Promise<Vendor | null> => {
  const result = await db.select().from(vendors).where(eq(vendors.id, id)).get();
  return result || null;
};

// Add a new vendor
export const addVendor = async (data: Omit<NewVendor, 'id' | 'createdAt'> & { userId: number }): Promise<Vendor | null> => {
  // Convert tags array to comma-separated string if needed
  const tags = Array.isArray(data.tags) ? data.tags.join(',') : data.tags;
  const result = await db.insert(vendors).values({ ...data, tags }).returning().get();
  return result || null;
};

// Update a vendor
export const updateVendor = async (id: number, data: Partial<NewVendor>): Promise<Vendor | null> => {
  // Convert tags array to comma-separated string if needed
  const tags = Array.isArray(data.tags) ? data.tags.join(',') : data.tags;
  const result = await db.update(vendors)
    .set({ ...data, ...(tags !== undefined ? { tags } : {}) })
    .where(eq(vendors.id, id))
    .returning()
    .get();
  return result || null;
};

// Delete a vendor
export const deleteVendor = async (id: number): Promise<boolean> => {
  const result = await db.delete(vendors).where(eq(vendors.id, id)).run();
  return result.changes > 0;
}; 