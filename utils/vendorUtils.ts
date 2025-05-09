import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vendor } from '@/types/vendor';

// Storage keys
const VENDORS_KEY = 'vendors';
const VENDOR_ID_COUNTER_KEY = 'vendor_id_counter';

// Initialize with sample data if no vendors exist
export const initializeVendors = async (): Promise<void> => {
  const existingVendors = await AsyncStorage.getItem(VENDORS_KEY);
  
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

    await AsyncStorage.setItem(VENDORS_KEY, JSON.stringify(initialVendors));
    await AsyncStorage.setItem(VENDOR_ID_COUNTER_KEY, '3');
  }
};

// Get all vendors
export const getVendors = async (): Promise<Vendor[]> => {
  try {
    // Initialize if needed
    await initializeVendors();
    
    // Get vendors from storage
    const data = await AsyncStorage.getItem(VENDORS_KEY);
    if (!data) return [];
    
    // Parse the JSON and convert string dates back to Date objects
    const vendors: Vendor[] = JSON.parse(data);
    return vendors.map(vendor => ({
      ...vendor,
      createdAt: new Date(vendor.createdAt),
      updatedAt: new Date(vendor.updatedAt),
      lastPurchaseDate: vendor.lastPurchaseDate ? new Date(vendor.lastPurchaseDate) : undefined
    }));
  } catch (error) {
    console.error('Error retrieving vendors:', error);
    return [];
  }
};

// Get vendor by ID
export const getVendorById = async (id: string): Promise<Vendor | null> => {
  try {
    const vendors = await getVendors();
    const vendor = vendors.find(v => v.id === id);
    return vendor || null;
  } catch (error) {
    console.error('Error retrieving vendor by ID:', error);
    return null;
  }
};

// Add a new vendor
export const addVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vendor> => {
  try {
    const vendors = await getVendors();
    
    // Get the next ID
    const counterStr = await AsyncStorage.getItem(VENDOR_ID_COUNTER_KEY);
    const counter = counterStr ? parseInt(counterStr, 10) : 0;
    const nextId = (counter + 1).toString();
    
    // Create the new vendor
    const newVendor: Vendor = {
      ...vendorData,
      id: nextId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to list and save
    const updatedVendors = [...vendors, newVendor];
    await AsyncStorage.setItem(VENDORS_KEY, JSON.stringify(updatedVendors));
    await AsyncStorage.setItem(VENDOR_ID_COUNTER_KEY, nextId);
    
    return newVendor;
  } catch (error) {
    console.error('Error adding vendor:', error);
    throw error;
  }
};

// Update a vendor
export const updateVendor = async (id: string, vendorData: Partial<Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Vendor | null> => {
  try {
    const vendors = await getVendors();
    const index = vendors.findIndex(v => v.id === id);
    
    if (index === -1) return null;
    
    const updatedVendor: Vendor = {
      ...vendors[index],
      ...vendorData,
      updatedAt: new Date()
    };
    
    vendors[index] = updatedVendor;
    await AsyncStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
    
    return updatedVendor;
  } catch (error) {
    console.error('Error updating vendor:', error);
    throw error;
  }
};

// Delete a vendor
export const deleteVendor = async (id: string): Promise<boolean> => {
  try {
    const vendors = await getVendors();
    const index = vendors.findIndex(v => v.id === id);
    
    if (index === -1) return false;
    
    vendors.splice(index, 1);
    await AsyncStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
    
    return true;
  } catch (error) {
    console.error('Error deleting vendor:', error);
    throw error;
  }
};

// Search vendors
export const searchVendors = async (query: string, filter: string = 'all'): Promise<Vendor[]> => {
  try {
    const vendors = await getVendors();
    const searchLower = query.toLowerCase();
    
    return vendors.filter(vendor => {
      // Status filter
      if (filter !== 'all' && vendor.status !== filter) {
        return false;
      }
      
      // Search query
      return (
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.email.toLowerCase().includes(searchLower) ||
        vendor.phone.toLowerCase().includes(searchLower) ||
        vendor.company.toLowerCase().includes(searchLower)
      );
    });
  } catch (error) {
    console.error('Error searching vendors:', error);
    return [];
  }
}; 