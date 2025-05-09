import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, StockStatus } from '@/types/product';

// Storage keys
const PRODUCTS_KEY = 'products';
const PRODUCT_ID_COUNTER_KEY = 'product_id_counter';

// Initialize with sample data if no products exist
export const initializeProducts = async (): Promise<void> => {
  const existingProducts = await AsyncStorage.getItem(PRODUCTS_KEY);
  
  if (!existingProducts) {
    // Sample product data
    const initialProducts: Product[] = [
      {
        id: '1',
        name: 'Premium Widget Pro',
        sku: 'WID-12345',
        barcode: '123456789012',
        description: 'High-quality widget for professional use.',
        category: 'Electronics',
        tags: ['premium', 'bestseller'],
        purchasePrice: 120,
        sellingPrice: 199.99,
        stockQuantity: 45,
        reorderLevel: 10,
        unit: 'piece',
        taxRate: 10,
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30'],
        vendor: 'Global Supplies Inc.',
        location: 'Warehouse A',
        dimensions: {
          length: 15,
          width: 10,
          height: 5,
          weight: 2
        },
        status: 'in_stock',
        createdAt: new Date('2023-03-15T10:00:00Z'),
        updatedAt: new Date('2023-05-20T14:30:00Z')
      },
      {
        id: '2',
        name: 'Standard Gadget X100',
        sku: 'GAD-54321',
        barcode: '098765432109',
        description: 'Versatile gadget suitable for various applications.',
        category: 'Office Supplies',
        tags: ['sale'],
        purchasePrice: 50,
        sellingPrice: 89.99,
        stockQuantity: 8,
        reorderLevel: 15,
        unit: 'piece',
        taxRate: 8,
        vendor: 'Premium Distributors',
        status: 'low_stock',
        createdAt: new Date('2023-04-10T09:15:00Z'),
        updatedAt: new Date('2023-05-18T11:45:00Z')
      },
      {
        id: '3',
        name: 'Deluxe Tool Elite',
        sku: 'TOO-98765',
        description: 'Reliable tool with extended durability.',
        category: 'Hardware',
        purchasePrice: 75,
        sellingPrice: 129.99,
        stockQuantity: 0,
        reorderLevel: 5,
        unit: 'set',
        taxRate: 10,
        images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f'],
        location: 'Warehouse B',
        status: 'out_of_stock',
        createdAt: new Date('2023-02-20T15:30:00Z'),
        updatedAt: new Date('2023-05-05T10:20:00Z')
      }
    ];

    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(initialProducts));
    await AsyncStorage.setItem(PRODUCT_ID_COUNTER_KEY, '3');
  }
};

// Get all products
export const getProducts = async (): Promise<Product[]> => {
  try {
    // Initialize if needed
    await initializeProducts();
    
    // Get products from storage
    const data = await AsyncStorage.getItem(PRODUCTS_KEY);
    if (!data) return [];
    
    // Parse the JSON and convert string dates back to Date objects
    const products: Product[] = JSON.parse(data);
    return products.map(product => ({
      ...product,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt),
      expiryDate: product.expiryDate ? new Date(product.expiryDate) : undefined
    }));
  } catch (error) {
    console.error('Error retrieving products:', error);
    return [];
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const products = await getProducts();
    const product = products.find(p => p.id === id);
    return product || null;
  } catch (error) {
    console.error('Error retrieving product by ID:', error);
    return null;
  }
};

// Add a new product
export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  try {
    const products = await getProducts();
    
    // Get the next ID
    const counterStr = await AsyncStorage.getItem(PRODUCT_ID_COUNTER_KEY);
    const counter = counterStr ? parseInt(counterStr, 10) : 0;
    const nextId = (counter + 1).toString();
    
    // Create the new product
    const newProduct: Product = {
      ...productData,
      id: nextId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to list and save
    const updatedProducts = [...products, newProduct];
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
    await AsyncStorage.setItem(PRODUCT_ID_COUNTER_KEY, nextId);
    
    return newProduct;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update a product
export const updateProduct = async (id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> => {
  try {
    const products = await getProducts();
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    const updatedProduct: Product = {
      ...products[index],
      ...productData,
      updatedAt: new Date()
    };
    
    products[index] = updatedProduct;
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    
    return updatedProduct;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete a product
export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const products = await getProducts();
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) return false;
    
    products.splice(index, 1);
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Search products with filters
export const searchProducts = async (
  query: string = '', 
  filter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' = 'all',
  category: string = 'all'
): Promise<Product[]> => {
  try {
    const products = await getProducts();
    const searchLower = query.toLowerCase();
    
    return products.filter(product => {
      // Stock status filter
      if (filter !== 'all') {
        if (filter === 'in_stock' && product.status !== 'in_stock') return false;
        if (filter === 'low_stock' && product.status !== 'low_stock') return false;
        if (filter === 'out_of_stock' && product.status !== 'out_of_stock') return false;
      }
      
      // Category filter
      if (category !== 'all' && product.category !== category) {
        return false;
      }
      
      // Search query
      if (!searchLower) return true; // If no search query, return all filtered products
      
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchLower)) ||
        (product.description && product.description.toLowerCase().includes(searchLower)) ||
        (product.vendor && product.vendor.toLowerCase().includes(searchLower))
      );
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}; 