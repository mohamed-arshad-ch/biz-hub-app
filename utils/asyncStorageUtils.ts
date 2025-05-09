import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer } from '@/types/customer';
import { Vendor } from '@/types/vendor';
import { Product, StockStatus } from '@/types/product';

// AsyncStorage keys
export const STORAGE_KEYS = {
  CUSTOMERS: 'customers',
  CUSTOMER_ID_COUNTER: 'customer_id_counter',
  VENDORS: 'vendors',
  VENDOR_ID_COUNTER: 'vendor_id_counter',
  PRODUCTS: 'products',
  PRODUCT_ID_COUNTER: 'product_id_counter',
};

// Sales storage keys
const SALES_KEY = "sales";

// Purchases storage keys
const PURCHASES_KEY = "purchases";

// Initialize with sample data if no customers exist
export const initializeCustomers = async (): Promise<void> => {
  const existingCustomers = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  
  if (!existingCustomers) {
    // Sample customer data
    const initialCustomers: Customer[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, Anytown, USA',
        company: 'ABC Corporation',
        category: 'retail',
        status: 'active',
        notes: 'Loyal customer since 2020.',
        outstandingBalance: 2500,
        totalPurchases: 15000,
        creditLimit: 10000,
        paymentTerms: 'Net 30',
        tags: ['vip', 'retail'],
        createdAt: new Date('2023-01-15T10:00:00Z'),
        updatedAt: new Date('2023-05-20T14:30:00Z'),
        lastPurchaseDate: new Date('2023-05-15T09:30:00Z'),
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1 (555) 987-6543',
        address: '456 Oak Ave, Somewhere, USA',
        company: 'Smith Enterprises',
        status: 'active',
        outstandingBalance: 1200,
        totalPurchases: 7500,
        creditLimit: 5000,
        paymentTerms: 'Net 15',
        tags: ['new'],
        createdAt: new Date('2023-03-10T09:15:00Z'),
        updatedAt: new Date('2023-04-18T11:45:00Z'),
        lastPurchaseDate: new Date('2023-04-15T14:20:00Z'),
      },
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phone: '+1 (555) 333-2222',
        address: '789 Pine Rd, Elsewhere, USA',
        company: 'Johnson & Co',
        status: 'inactive',
        outstandingBalance: 0,
        totalPurchases: 3000,
        creditLimit: 2000,
        createdAt: new Date('2022-07-20T15:30:00Z'),
        updatedAt: new Date('2023-02-05T10:20:00Z'),
        lastPurchaseDate: new Date('2023-01-10T11:15:00Z'),
      }
    ];

    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMER_ID_COUNTER, '3');
  }
};

// Initialize with sample data if no vendors exist
export const initializeVendors = async (): Promise<void> => {
  const existingVendors = await AsyncStorage.getItem(STORAGE_KEYS.VENDORS);
  
  if (!existingVendors) {
    // Sample vendor data
    const initialVendors: Vendor[] = [
      {
        id: '1',
        name: 'Acme Supplies',
        email: 'info@acmesupplies.com',
        phone: '+1 (555) 444-3333',
        address: '789 Industrial Blvd, Downtown, USA',
        company: 'Acme Supplies Inc.',
        category: 'wholesale',
        status: 'active',
        notes: 'Primary supplier for office equipment.',
        outstandingBalance: 3500,
        totalPurchases: 45000,
        creditLimit: 25000,
        paymentTerms: 'Net 45',
        tags: ['preferred', 'wholesale'],
        createdAt: new Date('2022-10-15T10:00:00Z'),
        updatedAt: new Date('2023-06-20T14:30:00Z'),
        lastPurchaseDate: new Date('2023-06-15T09:30:00Z'),
        website: 'www.acmesupplies.com',
        bankDetails: 'Bank of America - 123456789',
        productCategories: ['Office Supplies', 'Furniture'],
      },
      {
        id: '2',
        name: 'Global Manufacturing',
        email: 'sales@globalmanufacturing.com',
        phone: '+1 (555) 777-8888',
        address: '456 Production Ave, Factory Town, USA',
        company: 'Global Manufacturing Ltd.',
        status: 'active',
        outstandingBalance: 5200,
        totalPurchases: 87500,
        creditLimit: 50000,
        paymentTerms: 'Net 60',
        tags: ['manufacturing'],
        createdAt: new Date('2022-11-10T09:15:00Z'),
        updatedAt: new Date('2023-05-18T11:45:00Z'),
        lastPurchaseDate: new Date('2023-05-12T14:20:00Z'),
        website: 'www.globalmanufacturing.com',
      },
      {
        id: '3',
        name: 'Tech Solutions',
        email: 'support@techsolutions.com',
        phone: '+1 (555) 999-2222',
        address: '123 Tech Park, Silicon Valley, USA',
        company: 'Tech Solutions LLC',
        status: 'inactive',
        outstandingBalance: 0,
        totalPurchases: 13000,
        creditLimit: 15000,
        createdAt: new Date('2022-08-20T15:30:00Z'),
        updatedAt: new Date('2023-01-05T10:20:00Z'),
        lastPurchaseDate: new Date('2023-01-01T11:15:00Z'),
        category: 'technology',
        productCategories: ['Software', 'Hardware', 'Services'],
      }
    ];

    await AsyncStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(initialVendors));
    await AsyncStorage.setItem(STORAGE_KEYS.VENDOR_ID_COUNTER, '3');
  }
};

// Initialize with sample data if no products exist
export const initializeProducts = async (): Promise<void> => {
  const existingProducts = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
  
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

    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCT_ID_COUNTER, '3');
  }
};

// Get all customers
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    // Initialize if needed
    await initializeCustomers();
    
    // Get customers from storage
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!data) return [];
    
    // Parse the JSON and convert string dates back to Date objects
    const customers: Customer[] = JSON.parse(data);
    return customers.map(customer => ({
      ...customer,
      createdAt: new Date(customer.createdAt),
      updatedAt: new Date(customer.updatedAt),
      lastPurchaseDate: customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate) : undefined,
    }));
  } catch (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
};

// Get all vendors
export const getVendors = async (): Promise<Vendor[]> => {
  try {
    // Initialize if needed
    await initializeVendors();
    
    // Get vendors from storage
    const data = await AsyncStorage.getItem(STORAGE_KEYS.VENDORS);
    if (!data) return [];
    
    // Parse the JSON and convert string dates back to Date objects
    const vendors: Vendor[] = JSON.parse(data);
    return vendors.map(vendor => ({
      ...vendor,
      createdAt: new Date(vendor.createdAt),
      updatedAt: new Date(vendor.updatedAt),
      lastPurchaseDate: vendor.lastPurchaseDate ? new Date(vendor.lastPurchaseDate) : undefined,
    }));
  } catch (error) {
    console.error('Error getting vendors:', error);
    throw error;
  }
};

// Get a single customer by ID
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    const customers = await getCustomers();
    const customer = customers.find(c => c.id === id);
    return customer || null;
  } catch (error) {
    console.error(`Error getting customer with id ${id}:`, error);
    throw error;
  }
};

// Get a single vendor by ID
export const getVendorById = async (id: string): Promise<Vendor | null> => {
  try {
    const vendors = await getVendors();
    const vendor = vendors.find(v => v.id === id);
    return vendor || null;
  } catch (error) {
    console.error(`Error getting vendor with id ${id}:`, error);
    throw error;
  }
};

// Add a new customer
export const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
  try {
    // Get existing customers
    const customers = await getCustomers();
    
    // Generate a new ID
    const counterStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMER_ID_COUNTER);
    const counter = counterStr ? parseInt(counterStr) : 0;
    const newId = (counter + 1).toString();
    
    // Create the new customer
    const newCustomer: Customer = {
      ...customerData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add to the list and save
    const updatedCustomers = [...customers, newCustomer];
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMER_ID_COUNTER, newId);
    
    return newCustomer;
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

// Add a new vendor
export const addVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vendor> => {
  try {
    // Get existing vendors
    const vendors = await getVendors();
    
    // Generate a new ID
    const counterStr = await AsyncStorage.getItem(STORAGE_KEYS.VENDOR_ID_COUNTER);
    const counter = counterStr ? parseInt(counterStr) : 0;
    const newId = (counter + 1).toString();
    
    // Create the new vendor
    const newVendor: Vendor = {
      ...vendorData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add to the list and save
    const updatedVendors = [...vendors, newVendor];
    await AsyncStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(updatedVendors));
    await AsyncStorage.setItem(STORAGE_KEYS.VENDOR_ID_COUNTER, newId);
    
    return newVendor;
  } catch (error) {
    console.error('Error adding vendor:', error);
    throw error;
  }
};

// Update an existing customer
export const updateCustomer = async (id: string, customerData: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer | null> => {
  try {
    // Get existing customers
    const customers = await getCustomers();
    
    // Find the customer to update
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    // Create updated customer object
    const updatedCustomer: Customer = {
      ...customers[index],
      ...customerData,
      updatedAt: new Date(),
    };
    
    // Replace in the array and save
    customers[index] = updatedCustomer;
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    
    return updatedCustomer;
  } catch (error) {
    console.error(`Error updating customer with id ${id}:`, error);
    throw error;
  }
};

// Update an existing vendor
export const updateVendor = async (id: string, vendorData: Partial<Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Vendor | null> => {
  try {
    // Get existing vendors
    const vendors = await getVendors();
    
    // Find the vendor to update
    const index = vendors.findIndex(v => v.id === id);
    if (index === -1) return null;
    
    // Create updated vendor object
    const updatedVendor: Vendor = {
      ...vendors[index],
      ...vendorData,
      updatedAt: new Date(),
    };
    
    // Replace in the array and save
    vendors[index] = updatedVendor;
    await AsyncStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
    
    return updatedVendor;
  } catch (error) {
    console.error(`Error updating vendor with id ${id}:`, error);
    throw error;
  }
};

// Delete a customer
export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    // Get existing customers
    const customers = await getCustomers();
    
    // Filter out the customer to delete
    const updatedCustomers = customers.filter(c => c.id !== id);
    
    // Check if any customer was removed
    if (updatedCustomers.length === customers.length) {
      return false; // No customer was removed
    }
    
    // Save the updated list
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
    return true;
  } catch (error) {
    console.error(`Error deleting customer with id ${id}:`, error);
    throw error;
  }
};

// Delete a vendor
export const deleteVendor = async (id: string): Promise<boolean> => {
  try {
    // Get existing vendors
    const vendors = await getVendors();
    
    // Filter out the vendor to delete
    const updatedVendors = vendors.filter(v => v.id !== id);
    
    // Check if any vendor was removed
    if (updatedVendors.length === vendors.length) {
      return false; // No vendor was removed
    }
    
    // Save the updated list
    await AsyncStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(updatedVendors));
    return true;
  } catch (error) {
    console.error(`Error deleting vendor with id ${id}:`, error);
    throw error;
  }
};

// Search customers based on query and filter
export const searchCustomers = async (query: string, filter: string = 'all'): Promise<Customer[]> => {
  try {
    const customers = await getCustomers();
    
    return customers.filter(customer => {
      // Filter by search query
      const searchLower = query.toLowerCase();
      const matchesSearch = !query || 
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchLower)) ||
        (customer.company && customer.company.toLowerCase().includes(searchLower));
      
      // Filter by status
      const matchesFilter = 
        filter === 'all' || 
        customer.status === filter;
      
      return matchesSearch && matchesFilter;
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
};

// Search vendors based on query and filter
export const searchVendors = async (query: string, filter: string = 'all'): Promise<Vendor[]> => {
  try {
    const vendors = await getVendors();
    
    return vendors.filter(vendor => {
      // Filter by search query
      const searchLower = query.toLowerCase();
      const matchesSearch = !query || 
        vendor.name.toLowerCase().includes(searchLower) ||
        (vendor.email && vendor.email.toLowerCase().includes(searchLower)) ||
        (vendor.phone && vendor.phone.toLowerCase().includes(searchLower)) ||
        (vendor.company && vendor.company.toLowerCase().includes(searchLower)) ||
        (vendor.category && vendor.category.toLowerCase().includes(searchLower));
      
      // Filter by status
      const matchesFilter = 
        filter === 'all' || 
        vendor.status === filter;
      
      return matchesSearch && matchesFilter;
    });
  } catch (error) {
    console.error('Error searching vendors:', error);
    throw error;
  }
};

// Get all products
export const getProducts = async (): Promise<Product[]> => {
  try {
    // Initialize if needed
    await initializeProducts();
    
    // Get products from storage
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) return [];
    
    // Parse the JSON and convert string dates back to Date objects
    const products: Product[] = JSON.parse(data);
    return products.map(product => ({
      ...product,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt),
      expiryDate: product.expiryDate ? new Date(product.expiryDate) : undefined,
    }));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Get a single product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const products = await getProducts();
    const product = products.find(p => p.id === id);
    return product || null;
  } catch (error) {
    console.error(`Error getting product with id ${id}:`, error);
    throw error;
  }
};

// Add a new product
export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  try {
    // Get existing products
    const products = await getProducts();
    
    // Generate a new ID
    const counterStr = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCT_ID_COUNTER);
    const counter = counterStr ? parseInt(counterStr) : 0;
    const newId = (counter + 1).toString();
    
    // Create the new product
    const newProduct: Product = {
      ...productData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add to the list and save
    const updatedProducts = [...products, newProduct];
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCT_ID_COUNTER, newId);
    
    return newProduct;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update an existing product
export const updateProduct = async (id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> => {
  try {
    // Get existing products
    const products = await getProducts();
    
    // Find the product to update
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    // Create updated product object
    const updatedProduct: Product = {
      ...products[index],
      ...productData,
      updatedAt: new Date(),
    };
    
    // Replace in the array and save
    products[index] = updatedProduct;
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    
    return updatedProduct;
  } catch (error) {
    console.error(`Error updating product with id ${id}:`, error);
    throw error;
  }
};

// Delete a product
export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    // Get existing products
    const products = await getProducts();
    
    // Filter out the product to delete
    const updatedProducts = products.filter(p => p.id !== id);
    
    // Check if any product was removed
    if (updatedProducts.length === products.length) {
      return false; // No product was removed
    }
    
    // Save the updated list
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    return true;
  } catch (error) {
    console.error(`Error deleting product with id ${id}:`, error);
    throw error;
  }
};

// Search products based on query and filter
export const searchProducts = async (
  query: string = '', 
  filter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' = 'all',
  category: string = 'all'
): Promise<Product[]> => {
  try {
    const products = await getProducts();
    
    return products.filter(product => {
      // Filter by search query
      const searchLower = query.toLowerCase();
      const matchesSearch = !query || 
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        (product.barcode && product.barcode.includes(searchLower)) ||
        (product.description && product.description.toLowerCase().includes(searchLower)) ||
        (product.category && product.category.toLowerCase().includes(searchLower));
      
      // Filter by stock status
      const matchesFilter = 
        filter === 'all' || 
        product.status === filter;
      
      // Filter by category
      const matchesCategory =
        category === 'all' ||
        product.category === category;
      
      return matchesSearch && matchesFilter && matchesCategory;
    });
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Sale related functions
export const getSales = async () => {
  try {
    const salesJson = await AsyncStorage.getItem(SALES_KEY);
    if (salesJson) {
      return JSON.parse(salesJson);
    }
    return [];
  } catch (error) {
    console.error("Error getting sales:", error);
    return [];
  }
};

export const getSale = async (id: string) => {
  try {
    const sales = await getSales();
    return sales.find((sale: any) => sale.id === id) || null;
  } catch (error) {
    console.error(`Error getting sale with id ${id}:`, error);
    return null;
  }
};

export const addSale = async (sale: any) => {
  try {
    const sales = await getSales();
    
    // Generate ID if not provided
    if (!sale.id) {
      sale.id = `sale-${Date.now()}`;
    }
    
    // Add timestamps
    sale.createdAt = new Date().toISOString();
    sale.updatedAt = new Date().toISOString();
    
    const updatedSales = [sale, ...sales];
    await AsyncStorage.setItem(SALES_KEY, JSON.stringify(updatedSales));
    
    return sale;
  } catch (error) {
    console.error("Error adding sale:", error);
    throw error;
  }
};

export const updateSale = async (updatedSale: any) => {
  try {
    const sales = await getSales();
    const index = sales.findIndex((s: any) => s.id === updatedSale.id);
    
    if (index === -1) {
      throw new Error(`Sale with ID ${updatedSale.id} not found`);
    }
    
    // Update the timestamp
    updatedSale.updatedAt = new Date().toISOString();
    
    sales[index] = updatedSale;
    await AsyncStorage.setItem(SALES_KEY, JSON.stringify(sales));
    
    return updatedSale;
  } catch (error) {
    console.error(`Error updating sale with id ${updatedSale.id}:`, error);
    throw error;
  }
};

export const deleteSale = async (id: string) => {
  try {
    const sales = await getSales();
    const updatedSales = sales.filter((sale: any) => sale.id !== id);
    
    if (sales.length === updatedSales.length) {
      throw new Error(`Sale with ID ${id} not found`);
    }
    
    await AsyncStorage.setItem(SALES_KEY, JSON.stringify(updatedSales));
    
    return id;
  } catch (error) {
    console.error(`Error deleting sale with id ${id}:`, error);
    throw error;
  }
};

// Purchase related functions
export const getPurchases = async () => {
  try {
    const purchasesJson = await AsyncStorage.getItem(PURCHASES_KEY);
    if (purchasesJson) {
      return JSON.parse(purchasesJson);
    }
    return [];
  } catch (error) {
    console.error("Error getting purchases:", error);
    return [];
  }
};

export const getPurchase = async (id: string) => {
  try {
    const purchases = await getPurchases();
    return purchases.find((purchase: any) => purchase.id === id) || null;
  } catch (error) {
    console.error(`Error getting purchase with id ${id}:`, error);
    return null;
  }
};

export const addPurchase = async (purchase: any) => {
  try {
    const purchases = await getPurchases();
    
    // Generate ID if not provided
    if (!purchase.id) {
      purchase.id = `purchase-${Date.now()}`;
    }
    
    // Add timestamps
    purchase.createdAt = new Date().toISOString();
    purchase.updatedAt = new Date().toISOString();
    
    const updatedPurchases = [purchase, ...purchases];
    await AsyncStorage.setItem(PURCHASES_KEY, JSON.stringify(updatedPurchases));
    
    return purchase;
  } catch (error) {
    console.error("Error adding purchase:", error);
    throw error;
  }
};

export const updatePurchase = async (updatedPurchase: any) => {
  try {
    const purchases = await getPurchases();
    const index = purchases.findIndex((p: any) => p.id === updatedPurchase.id);
    
    if (index === -1) {
      throw new Error(`Purchase with ID ${updatedPurchase.id} not found`);
    }
    
    // Update the timestamp
    updatedPurchase.updatedAt = new Date().toISOString();
    
    purchases[index] = updatedPurchase;
    await AsyncStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
    
    return updatedPurchase;
  } catch (error) {
    console.error(`Error updating purchase with id ${updatedPurchase.id}:`, error);
    throw error;
  }
};

export const deletePurchase = async (id: string) => {
  try {
    const purchases = await getPurchases();
    const updatedPurchases = purchases.filter((purchase: any) => purchase.id !== id);
    
    if (purchases.length === updatedPurchases.length) {
      throw new Error(`Purchase with ID ${id} not found`);
    }
    
    await AsyncStorage.setItem(PURCHASES_KEY, JSON.stringify(updatedPurchases));
    
    return id;
  } catch (error) {
    console.error(`Error deleting purchase with id ${id}:`, error);
    throw error;
  }
}; 