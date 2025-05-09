import { Transaction } from "@/types/transaction";

// Generate random number between min and max
const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Generate random date within the last 30 days
const randomRecentDate = (): Date => {
  const now = new Date();
  const daysAgo = randomNumber(0, 30);
  const result = new Date(now);
  result.setDate(now.getDate() - daysAgo);
  return result;
};

// Generate random transaction description
const getRandomDescription = (type: 'sale' | 'purchase'): string => {
  const saleDescriptions = [
    "Invoice #INV-",
    "Online order #ORD-",
    "Payment from Client ",
    "Service fee from ",
    "Product sale to ",
  ];
  
  const purchaseDescriptions = [
    "Supplier payment #SUP-",
    "Inventory purchase #PO-",
    "Office supplies from ",
    "Equipment purchase from ",
    "Service payment to ",
  ];
  
  const descriptions = type === 'sale' ? saleDescriptions : purchaseDescriptions;
  const randomIndex = Math.floor(Math.random() * descriptions.length);
  
  // Add random number to make it unique
  return descriptions[randomIndex] + randomNumber(1000, 9999);
};

// Generate random client/vendor name
const getRandomName = (): string => {
  const names = [
    "Acme Corp",
    "TechSolutions Inc",
    "Global Services",
    "Smith Enterprises",
    "Johnson & Co",
    "Metro Supplies",
    "City Vendors",
    "Quality Products",
    "First Choice",
    "Prime Distributors",
  ];
  
  return names[Math.floor(Math.random() * names.length)];
};

// Generate random payment method
const getRandomPaymentMethod = (): string => {
  const methods = [
    "Credit Card",
    "Bank Transfer",
    "Cash",
    "Check",
    "PayPal",
    "Venmo",
    "Wire Transfer",
  ];
  
  return methods[Math.floor(Math.random() * methods.length)];
};

// Generate a single random transaction
const generateRandomTransaction = (id: string): Transaction => {
  const type = Math.random() > 0.5 ? 'sale' : 'purchase';
  const amount = type === 'sale' 
    ? randomNumber(100, 5000) 
    : randomNumber(50, 3000);
  
  return {
    id,
    type,
    amount,
    date: randomRecentDate(),
    description: getRandomDescription(type) + getRandomName(),
    customer: type === 'sale' ? getRandomName() : undefined,
    vendor: type === 'purchase' ? getRandomName() : undefined,
    paymentMethod: getRandomPaymentMethod(),
    reference: `REF-${randomNumber(10000, 99999)}`,
    notes: Math.random() > 0.7 ? "Additional notes for this transaction" : undefined,
  };
};

// Generate metrics data
export const getMetricsData = () => {
  // Generate some random but realistic business metrics
  const totalSales = randomNumber(50000, 200000);
  const totalPurchase = randomNumber(30000, 150000);
  
  const monthSales = randomNumber(5000, 20000);
  const monthPurchase = randomNumber(3000, 15000);
  
  const todaySales = randomNumber(500, 2000);
  const todayPurchase = randomNumber(300, 1500);
  
  return {
    totalSales,
    totalPurchase,
    monthSales,
    monthPurchase,
    todaySales,
    todayPurchase,
  };
};

// Generate a list of recent transactions
export const getRecentTransactions = (count: number): Transaction[] => {
  const transactions: Transaction[] = [];
  
  for (let i = 0; i < count; i++) {
    transactions.push(generateRandomTransaction(`trans-${i + 1}`));
  }
  
  // Sort by date, most recent first
  return transactions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

// Generate all transactions (for the transactions list page)
export const getAllTransactions = (count: number = 20): Transaction[] => {
  return getRecentTransactions(count);
};

// Get a single transaction by ID
export const getTransactionById = (id: string): Transaction | undefined => {
  // For demo purposes, generate a transaction with the given ID
  return generateRandomTransaction(id);
};