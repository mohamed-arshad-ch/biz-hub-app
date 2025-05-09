import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer } from '@/types/customer';

// Storage keys
const CUSTOMERS_KEY = 'customers';
const CUSTOMER_ID_COUNTER_KEY = 'customer_id_counter';

// Initialize with sample data if no customers exist
export const initializeCustomers = async (): Promise<void> => {
  const existingCustomers = await AsyncStorage.getItem(CUSTOMERS_KEY);
  
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

    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(initialCustomers));
    await AsyncStorage.setItem(CUSTOMER_ID_COUNTER_KEY, '3');
  }
};

// Get all customers
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    // Initialize if needed
    await initializeCustomers();
    
    // Get customers from storage
    const data = await AsyncStorage.getItem(CUSTOMERS_KEY);
    if (!data) return [];
    
    // Parse the JSON and convert string dates back to Date objects
    const customers: Customer[] = JSON.parse(data);
    return customers.map(customer => ({
      ...customer,
      createdAt: new Date(customer.createdAt),
      updatedAt: new Date(customer.updatedAt),
      lastPurchaseDate: customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate) : undefined
    }));
  } catch (error) {
    console.error('Error retrieving customers:', error);
    return [];
  }
};

// Get customer by ID
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    const customers = await getCustomers();
    const customer = customers.find(c => c.id === id);
    return customer || null;
  } catch (error) {
    console.error('Error retrieving customer by ID:', error);
    return null;
  }
};

// Add a new customer
export const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
  try {
    const customers = await getCustomers();
    
    // Get the next ID
    const counterStr = await AsyncStorage.getItem(CUSTOMER_ID_COUNTER_KEY);
    const counter = counterStr ? parseInt(counterStr, 10) : 0;
    const nextId = (counter + 1).toString();
    
    // Create the new customer
    const newCustomer: Customer = {
      ...customerData,
      id: nextId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to list and save
    const updatedCustomers = [...customers, newCustomer];
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers));
    await AsyncStorage.setItem(CUSTOMER_ID_COUNTER_KEY, nextId);
    
    return newCustomer;
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

// Update a customer
export const updateCustomer = async (id: string, customerData: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer | null> => {
  try {
    const customers = await getCustomers();
    const index = customers.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    const updatedCustomer: Customer = {
      ...customers[index],
      ...customerData,
      updatedAt: new Date()
    };
    
    customers[index] = updatedCustomer;
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    
    return updatedCustomer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

// Delete a customer
export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    const customers = await getCustomers();
    const index = customers.findIndex(c => c.id === id);
    
    if (index === -1) return false;
    
    customers.splice(index, 1);
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    
    return true;
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Search customers
export const searchCustomers = async (query: string, filter: string = 'all'): Promise<Customer[]> => {
  try {
    const customers = await getCustomers();
    const searchLower = query.toLowerCase();
    
    return customers.filter(customer => {
      // Status filter
      if (filter !== 'all' && customer.status !== filter) {
        return false;
      }
      
      // Search query
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower) ||
        (customer.company && customer.company.toLowerCase().includes(searchLower))
      );
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    return [];
  }
}; 