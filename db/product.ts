import { db, products } from './index';
import { eq } from 'drizzle-orm';
import { Product, NewProduct } from './schema';

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  return await db.select().from(products).all();
};

// Get a product by ID
export const getProductById = async (id: number): Promise<Product | null> => {
  const result = await db.select().from(products).where(eq(products.id, id)).get();
  return result || null;
};

// Add a new product
export const addProduct = async (data: Omit<NewProduct, 'id' | 'createdAt' | 'updatedAt'> & { userId: number }): Promise<Product | null> => {
  // Convert tags and images arrays to comma-separated strings if needed
  const tags = Array.isArray(data.tags) ? data.tags.join(',') : data.tags;
  const images = Array.isArray(data.images) ? data.images.join(',') : data.images;
  const result = await db.insert(products).values({ ...data, tags, images }).returning().get();
  return result || null;
};

// Update a product
export const updateProduct = async (id: number, data: Partial<NewProduct>): Promise<Product | null> => {
  // Convert tags and images arrays to comma-separated strings if needed
  const tags = Array.isArray(data.tags) ? data.tags.join(',') : data.tags;
  const images = Array.isArray(data.images) ? data.images.join(',') : data.images;
  const result = await db.update(products)
    .set({ ...data, ...(tags !== undefined ? { tags } : {}), ...(images !== undefined ? { images } : {}) })
    .where(eq(products.id, id))
    .returning()
    .get();
  return result || null;
};

// Delete a product
export const deleteProduct = async (id: number): Promise<boolean> => {
  const result = await db.delete(products).where(eq(products.id, id)).run();
  return result.changes > 0;
}; 