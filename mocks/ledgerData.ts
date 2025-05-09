import { formatDateShort } from '@/utils/formatters';

// Define the LedgerEntry type
export interface LedgerEntry {
  id: number;
  date: string;
  reference: string;
  type: 'Sale' | 'Purchase' | 'Income' | 'Expense' | 'Transfer' | 'Adjustment';
  account: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reconciled: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy?: string;
  modifiedDate?: string;
}

// Generate random number between min and max
const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Generate random date within the last 90 days
const randomRecentDate = (): string => {
  const now = new Date();
  const daysAgo = randomNumber(0, 90);
  const result = new Date(now);
  result.setDate(now.getDate() - daysAgo);
  
  // Format as YYYY-MM-DD
  return result.toISOString().split('T')[0];
};

// Generate random transaction type
const getRandomTransactionType = (): 'Sale' | 'Purchase' | 'Income' | 'Expense' | 'Transfer' | 'Adjustment' => {
  const types = ['Sale', 'Purchase', 'Income', 'Expense', 'Transfer', 'Adjustment'];
  return types[Math.floor(Math.random() * types.length)] as any;
};

// Generate random account based on transaction type
const getRandomAccount = (type: string): string => {
  const accounts = {
    Sale: ['Sales Revenue', 'Service Revenue', 'Product Sales'],
    Purchase: ['Inventory', 'Cost of Goods Sold', 'Supplies'],
    Income: ['Interest Income', 'Rental Income', 'Miscellaneous Income'],
    Expense: ['Rent Expense', 'Utilities', 'Salaries', 'Office Supplies'],
    Transfer: ['Cash', 'Bank Account', 'Savings Account'],
    Adjustment: ['Inventory Adjustment', 'Accounts Receivable', 'Accounts Payable']
  };
  
  const accountList = accounts[type] || ['Cash'];
  return accountList[Math.floor(Math.random() * accountList.length)];
};

// Generate random reference number based on transaction type
const getRandomReference = (type: string): string => {
  const prefixes = {
    Sale: 'INV-',
    Purchase: 'PO-',
    Income: 'INC-',
    Expense: 'EXP-',
    Transfer: 'TRF-',
    Adjustment: 'ADJ-'
  };
  
  const prefix = prefixes[type] || 'REF-';
  return prefix + randomNumber(10000, 99999);
};

// Generate random description based on transaction type
const getRandomDescription = (type: string, account: string): string => {
  const descriptions = {
    Sale: [
      `Invoice for customer order`,
      `Product sale to customer`,
      `Service fee for client`,
      `Sales receipt #${randomNumber(1000, 9999)}`,
      `Customer payment for ${account}`
    ],
    Purchase: [
      `Purchase from supplier`,
      `Inventory restock`,
      `Vendor payment for supplies`,
      `Purchase order #${randomNumber(1000, 9999)}`,
      `Payment for ${account}`
    ],
    Income: [
      `Income from investments`,
      `Rental income received`,
      `Interest earned on account`,
      `Miscellaneous income`,
      `${account} received`
    ],
    Expense: [
      `Monthly payment for ${account}`,
      `Expense payment`,
      `Operating expense`,
      `Payment for services`,
      `${account} payment`
    ],
    Transfer: [
      `Fund transfer between accounts`,
      `Transfer from ${account}`,
      `Transfer to ${account}`,
      `Internal fund movement`,
      `Account balance adjustment`
    ],
    Adjustment: [
      `Adjustment for ${account}`,
      `Balance correction`,
      `Reconciliation adjustment`,
      `Accounting correction`,
      `Year-end adjustment`
    ]
  };
  
  const descList = descriptions[type] || ['Transaction'];
  return descList[Math.floor(Math.random() * descList.length)];
};

// Generate a single random ledger entry
const generateRandomLedgerEntry = (id: number, previousBalance: number): LedgerEntry => {
  const date = randomRecentDate();
  const type = getRandomTransactionType();
  const account = getRandomAccount(type);
  const reference = getRandomReference(type);
  const description = getRandomDescription(type, account);
  
  // Determine if this is a debit or credit entry
  const isDebit = type === 'Purchase' || type === 'Expense' || (type === 'Transfer' && Math.random() > 0.5);
  
  // Generate amount based on transaction type
  let amount = 0;
  switch (type) {
    case 'Sale':
      amount = randomNumber(100, 5000);
      break;
    case 'Purchase':
      amount = randomNumber(50, 3000);
      break;
    case 'Income':
      amount = randomNumber(50, 1000);
      break;
    case 'Expense':
      amount = randomNumber(10, 500);
      break;
    case 'Transfer':
      amount = randomNumber(100, 2000);
      break;
    case 'Adjustment':
      amount = randomNumber(10, 200);
      break;
    default:
      amount = randomNumber(10, 1000);
  }
  
  // Round to 2 decimal places
  amount = Math.round(amount * 100) / 100;
  
  const debit = isDebit ? amount : 0;
  const credit = isDebit ? 0 : amount;
  
  // Calculate new balance
  const balance = previousBalance + credit - debit;
  
  // Random reconciliation status
  const reconciled = Math.random() > 0.3;
  
  // Created date (slightly before transaction date)
  const createdDate = new Date(date);
  createdDate.setHours(randomNumber(8, 17), randomNumber(0, 59));
  
  // Modified date (if applicable)
  let modifiedBy, modifiedDate;
  if (Math.random() > 0.7) {
    modifiedBy = "Jane Smith";
    const modDate = new Date(createdDate);
    modDate.setDate(modDate.getDate() + randomNumber(1, 5));
    modifiedDate = modDate.toISOString();
  }
  
  return {
    id,
    date,
    reference,
    type,
    account,
    description,
    debit,
    credit,
    balance,
    reconciled,
    createdBy: "John Doe",
    createdDate: createdDate.toISOString(),
    modifiedBy,
    modifiedDate
  };
};

// Generate a list of ledger entries
export const getLedgerEntries = (count: number = 20): LedgerEntry[] => {
  const entries: LedgerEntry[] = [];
  let balance = 0;
  
  for (let i = 0; i < count; i++) {
    const entry = generateRandomLedgerEntry(i + 1, balance);
    balance = entry.balance;
    entries.push(entry);
  }
  
  // Sort by date, oldest first
  return entries.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

// Get a single ledger entry by ID
export const getLedgerEntryById = (id: number): LedgerEntry | undefined => {
  const entries = getLedgerEntries(50);
  return entries.find(entry => entry.id === id);
};