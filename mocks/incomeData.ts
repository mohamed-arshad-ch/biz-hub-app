import { IncomeRecord } from "@/types/income";

// Mock income data
const incomeData: IncomeRecord[] = [
  {
    id: "i1",
    source: "Client Payment - ABC Corp",
    category: "Services",
    amount: 2500.00,
    date: new Date("2023-05-05"),
    paymentMethod: "Bank Transfer",
    reference: "INV-2023-001",
    notes: "Payment for web development project."
  },
  {
    id: "i2",
    source: "Consulting - XYZ Ltd.",
    category: "Consulting",
    amount: 1200.00,
    date: new Date("2023-05-12"),
    paymentMethod: "Credit Card",
    reference: "INV-2023-002"
  },
  {
    id: "i3",
    source: "Product Sales - Online Store",
    category: "Sales",
    amount: 3750.50,
    date: new Date("2023-05-20"),
    paymentMethod: "PayPal",
    notes: "Monthly online store revenue."
  },
  {
    id: "i4",
    source: "Workshop - Digital Marketing",
    category: "Training",
    amount: 1800.00,
    date: new Date("2023-06-02"),
    paymentMethod: "Cash",
    reference: "WS-2023-001",
    notes: "15 attendees at $120 each."
  },
  {
    id: "i5",
    source: "Affiliate Commission",
    category: "Commission",
    amount: 450.25,
    date: new Date("2023-06-10"),
    paymentMethod: "Bank Transfer",
    reference: "AF-2023-Q2"
  },
  {
    id: "i6",
    source: "Rental Income - Office Space",
    category: "Rent",
    amount: 2000.00,
    date: new Date("2023-06-15"),
    paymentMethod: "Check",
    reference: "RENT-JUN-2023",
    notes: "Monthly rent from tenant."
  },
  {
    id: "i7",
    source: "Interest - Savings Account",
    category: "Interest",
    amount: 125.75,
    date: new Date("2023-06-30"),
    paymentMethod: "Direct Deposit",
    notes: "Quarterly interest payment."
  }
];

// Function to get all income data
export const getIncomeData = (): IncomeRecord[] => {
  return [...incomeData];
};

// Function to get a specific income record by ID
export const getIncomeById = (id: string): IncomeRecord | undefined => {
  return incomeData.find(income => income.id === id);
};

// Function to delete an income record by ID
export const deleteIncome = (id: string): boolean => {
  const index = incomeData.findIndex(income => income.id === id);
  if (index !== -1) {
    incomeData.splice(index, 1);
    return true;
  }
  return false;
};

// Function to add a new income record
export const addIncome = (income: IncomeRecord): IncomeRecord => {
  incomeData.push(income);
  return income;
};

// Function to update an existing income record
export const updateIncome = (updatedIncome: IncomeRecord): IncomeRecord | null => {
  const index = incomeData.findIndex(income => income.id === updatedIncome.id);
  if (index !== -1) {
    incomeData[index] = updatedIncome;
    return updatedIncome;
  }
  return null;
};

// Function to restore a deleted income record
export const restoreIncome = (income: IncomeRecord): boolean => {
  if (!incomeData.some(i => i.id === income.id)) {
    incomeData.push(income);
    return true;
  }
  return false;
};