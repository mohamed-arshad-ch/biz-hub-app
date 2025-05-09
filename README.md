# InvoiceHub - React Native App

A mobile application for managing invoices, customers, vendors, and products. Built with React Native and Expo.

## AsyncStorage Implementation

The InvoiceHub application uses AsyncStorage for local data persistence, providing a reliable offline-first experience. Key features include:

### Products Module
- Full CRUD operations for product management through AsyncStorage
- Search and filtering capabilities using locally stored data
- Stock management with automatic status updates
- Barcode scanning integration for quick product lookups
- Undo delete functionality with snackbar notifications

### Categories Management
- Income and Expense categories for transaction categorization
- Custom category creation with name, description, and color coding
- Edit and delete functionality for category management
- Persistent storage with AsyncStorage
- Default categories provided for quick setup

### Implementation Details
1. **Utils Structure**: AsyncStorage operations are organized into dedicated utility files like `asyncStorageUtils.ts` and `categoryStorageUtils.ts` for better maintainability.
2. **Type Safety**: Comprehensive TypeScript interfaces ensure consistent data structures.
3. **Error Handling**: Robust error handling with user-friendly feedback for all storage operations.
4. **Performance Optimization**: Efficient storage and retrieval methods to minimize bottlenecks.

### User Settings
- Currency preferences
- Account information management
- Account group settings for financial organization
- Category management for income and expenses

### Future Improvements
- Data synchronization with a backend server when online
- Data export/import functionality
- Batch operations for improved performance
- Data migration utilities for version updates

### Features

- **Customer Management**: Add, edit, view, and delete customers with data persistent in AsyncStorage
- **Vendor Management**: Add, edit, view, and delete vendors with data persistent in AsyncStorage
- **Product Management**: Add, edit, view, and delete products with inventory tracking and stock status management
- **Search and Filtering**: Search, sort, and filter customers, vendors, and products by various criteria
- **Responsive UI**: Modern and intuitive user interface with collapsible sections

### Implementation Details

#### Storage Keys

Storage keys are defined in the `utils/asyncStorageUtils.ts` file:

```javascript
export const STORAGE_KEYS = {
  CUSTOMERS: 'customers',
  CUSTOMER_ID_COUNTER: 'customer_id_counter',
  VENDORS: 'vendors',
  VENDOR_ID_COUNTER: 'vendor_id_counter',
  PRODUCTS: 'products',
  PRODUCT_ID_COUNTER: 'product_id_counter',
};
```

#### Data Initialization

Sample data is initialized if none exists in AsyncStorage:

```javascript
export const initializeCustomers = async (): Promise<void> => {
  const existingCustomers = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  
  if (!existingCustomers) {
    // Sample customer data initialization
    // ...
  }
};

export const initializeVendors = async (): Promise<void> => {
  const existingVendors = await AsyncStorage.getItem(STORAGE_KEYS.VENDORS);
  
  if (!existingVendors) {
    // Sample vendor data initialization
    // ...
  }
};

export const initializeProducts = async (): Promise<void> => {
  const existingProducts = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
  
  if (!existingProducts) {
    // Sample product data initialization
    // ...
  }
};
```

#### Data Operations

AsyncStorage utility functions follow a consistent pattern for customers, vendors, and products:

1. **Get All**: Retrieve all items (`getCustomers()`, `getVendors()`, `getProducts()`)
2. **Get By ID**: Retrieve a single item by ID (`getCustomerById()`, `getVendorById()`, `getProductById()`)
3. **Add**: Add a new item (`addCustomer()`, `addVendor()`, `addProduct()`)
4. **Update**: Update an existing item (`updateCustomer()`, `updateVendor()`, `updateProduct()`)
5. **Delete**: Remove an item (`deleteCustomer()`, `deleteVendor()`, `deleteProduct()`)
6. **Search**: Search for items by query and filter (`searchCustomers()`, `searchVendors()`, `searchProducts()`)

#### ID Management

Item IDs are auto-incremented using separate counters:

```javascript
// Add a new vendor
export const addVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vendor> => {
  // Get existing vendors
  const vendors = await getVendors();
  
  // Generate a new ID
  const counterStr = await AsyncStorage.getItem(STORAGE_KEYS.VENDOR_ID_COUNTER);
  const counter = counterStr ? parseInt(counterStr) : 0;
  const newId = (counter + 1).toString();
  
  // Create the new vendor with ID and timestamps
  // ...
}
```

### Screen Integration

All screens have been updated to use AsyncStorage operations:

1. **List Screens**: Show items with filtering, sorting, and search
2. **Detail Screens**: Show full item details with options to edit or delete
3. **Edit Screens**: Update existing items
4. **New Screens**: Create new items

Each screen includes appropriate loading states, error handling, and success feedback.

### Product Management Features

The product management module includes these specific features:

- **Inventory Tracking**: Track stock levels and automatically update status
- **Stock Status**: Products are classified as "in stock", "low stock", "out of stock", or "discontinued"
- **Stock Adjustments**: Update stock levels with reasons for adjustment
- **Barcode Support**: Generate and scan product barcodes
- **Image Management**: Add multiple product images
- **Category and Tag Filtering**: Organize products by categories and tags
- **Price Management**: Track purchase price, selling price, and profit margins

### Product Edit Implementation

The product edit screen follows a consistent pattern with other edit screens:

1. **Data Loading**: When the screen loads, it fetches the product data from AsyncStorage using the product ID
2. **Form Population**: All form fields are populated with the existing product data
3. **Data Validation**: Before saving, all required fields are validated
4. **Status Determination**: Product stock status is automatically determined based on quantity and reorder level
5. **AsyncStorage Update**: On save, the product data is updated in AsyncStorage
6. **Change Tracking**: The screen tracks changes to form fields to notify users of unsaved changes
7. **Collapsible Sections**: Detailed form is organized into collapsible sections for better usability
8. **Success Feedback**: Users receive confirmation when the product is successfully updated

This ensures a consistent user experience across the application for all data types.

## Running the App

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the Expo project: `npx expo start`

## Future Improvements

- Implement sync capabilities with a backend server
- Add data export/import functionality
- Implement data backup and restore
- Add invoice generation using customer, vendor, and product data
- Implement barcode scanning with device camera 