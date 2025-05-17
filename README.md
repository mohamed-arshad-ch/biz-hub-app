# InvoiceHub - React Native App

A comprehensive mobile application for managing business finances, inventory, and transactions. Built with React Native, Expo, and SQLite (Drizzle ORM).

## Features

### Sales Management
- **Sales Orders**: Create and manage sales orders
- **Sales Invoices**: Generate and track sales invoices
- **Sales Returns**: Handle customer returns and refunds
- **Payment In**: Record and track incoming payments

### Purchase Management
- **Purchase Orders**: Create and manage purchase orders
- **Purchase Invoices**: Track vendor invoices
- **Purchase Returns**: Handle returns to vendors
- **Payment Out**: Record and track outgoing payments

### Financial Management
- **Income**: Track various income sources
- **Expenses**: Manage business expenses
- **Transactions**: Record and monitor all financial transactions
- **Ledger**: Double-entry bookkeeping system

### Reports
- **Transaction Report**: View all financial transactions
- **Ledger Report**: Detailed ledger entries
- **Income Report**: Track income sources and trends
- **Expense Report**: Monitor expense categories
- **Sales Report**: Analyze sales performance
- **Purchase Report**: Track purchase activities
- **Balance Sheet**: View financial position

### Master Data Management
- **Customers**: Manage customer information
- **Vendors**: Track vendor details
- **Products**: Inventory management
- **Account Groups**: Organize financial accounts
- **Income Categories**: Categorize income sources
- **Expense Categories**: Classify expenses

## Technical Stack

- React Native
- Expo
- SQLite (Drizzle ORM)
- TypeScript
- React Navigation
- React Native Paper
- Lucide Icons

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/InvoiceHub.git
cd InvoiceHub
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Install Expo CLI globally (if not already installed):
```bash
npm install -g expo-cli
# or
yarn global add expo-cli
```

4. Generate Drizzle migrations:
```bash
npm run generate
# or
yarn generate
```

5. Run database migrations:
```bash
npm run migrate
# or
yarn migrate
```

## Running the App

1. Start the development server:
```bash
npx expo start
```

2. Run on specific platform:
```bash
# For Android
npx expo start --android

# For iOS
npx expo start --ios

# For web
npx expo start --web
```

## Database Structure

The application uses SQLite with Drizzle ORM for data persistence. Key tables include:

- users
- companies
- customers
- vendors
- products
- sales_orders
- sales_invoices
- sales_returns
- purchase_orders
- purchase_invoices
- purchase_returns
- payment_ins
- payment_outs
- income_categories
- expense_categories
- account_groups
- ledger
- transactions

## Authentication

- User registration and login
- Secure password storage
- Session management
- Protected routes

## Data Management

### Sales Module
- Create and manage sales orders
- Generate sales invoices
- Process sales returns
- Track customer payments
- View sales history

### Purchase Module
- Create and manage purchase orders
- Process purchase invoices
- Handle purchase returns
- Track vendor payments
- View purchase history

### Financial Module
- Record income and expenses
- Track transactions
- Maintain ledger entries
- Generate financial reports
- View balance sheet

### Inventory Module
- Manage product inventory
- Track stock levels
- Monitor product movements
- Set reorder levels
- View stock reports

## Reports

### Financial Reports
- Transaction reports with filtering
- Detailed ledger reports
- Income statement
- Expense analysis
- Balance sheet

### Business Reports
- Sales performance analysis
- Purchase activity reports
- Customer transaction history
- Vendor payment status
- Product movement reports

## Future Improvements

- Cloud synchronization
- Multi-currency support
- Barcode scanning
- Receipt scanning
- Data export/import
- Backup and restore
- User roles and permissions
- Multi-branch support
- Tax management
- Invoice templates
- Email notifications
- Mobile app notifications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@invoicehub.com or create an issue in the repository. 