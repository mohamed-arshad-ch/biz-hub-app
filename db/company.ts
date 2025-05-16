import { db, companies } from './index';
import { eq } from 'drizzle-orm';
import { Company, NewCompany } from './schema';

// Create a new company
export const createCompany = async (companyData: Omit<NewCompany, 'id' | 'createdAt'>): Promise<Company | null> => {
  try {
    const result = await db.insert(companies).values(companyData).returning().get();
    return result || null;
  } catch (error) {
    console.error('Failed to create company:', error);
    return null;
  }
};

// Get a company by user ID
export const getCompanyByUserId = async (userId: number): Promise<Company | null> => {
  try {
    const company = await db.select().from(companies).where(eq(companies.userId, userId)).get();
    return company || null;
  } catch (error) {
    console.error('Failed to get company by user ID:', error);
    return null;
  }
};

// Update a company
export const updateCompany = async (id: number, companyData: Partial<NewCompany>): Promise<Company | null> => {
  try {
    const result = await db
      .update(companies)
      .set(companyData)
      .where(eq(companies.id, id))
      .returning()
      .get();
    return result || null;
  } catch (error) {
    console.error('Failed to update company:', error);
    return null;
  }
}; 