import { db, users } from './index';
import { eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { User, NewUser } from './schema';

// Hash password using SHA-256
const hashPassword = async (password: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
};

// Register a new user
export const registerUser = async (userData: Omit<NewUser, 'id' | 'createdAt'>): Promise<User | null> => {
  try {
    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).get();
    
    if (existingUser) {
      return null; // User already exists
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Insert user with hashed password
    const result = await db.insert(users).values({
      ...userData,
      password: hashedPassword,
    }).returning().get();
    
    return result;
  } catch (error) {
    console.error('Failed to register user:', error);
    return null;
  }
};

// Login a user
export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    // Hash the provided password
    const hashedPassword = await hashPassword(password);
    
    // Get user by email and password
    const user = await db.select().from(users)
      .where(eq(users.email, email))
      .get();
    
    // Verify password
    if (user && user.password === hashedPassword) {
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to login:', error);
    return null;
  }
};

// Get user by ID
export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).get();
    
    if (user) {
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get user by ID:', error);
    return null;
  }
}; 