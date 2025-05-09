import { ExpenseRecord } from "@/types/expenses";

// Mock expenses data
const expensesData: ExpenseRecord[] = [
  {
    id: "e1",
    description: "Office Rent",
    category: "Rent",
    amount: 2500.00,
    date: new Date("2023-05-01"),
    paymentMethod: "Bank Transfer",
    vendor: "Skyline Properties",
    reference: "MAY-2023-RENT",
    notes: "Monthly office space rent."
  },
  {
    id: "e2",
    description: "Internet Service",
    category: "Utilities",
    amount: 89.99,
    date: new Date("2023-05-05"),
    paymentMethod: "Credit Card",
    vendor: "FastNet ISP",
    reference: "INV-458721"
  },
  {
    id: "e3",
    description: "Team Lunch",
    category: "Meals",
    amount: 187.50,
    date: new Date("2023-05-12"),
    paymentMethod: "Credit Card",
    vendor: "Bistro Garden",
    receipt: "https://images.unsplash.com/photo-1572799454197-d3a318b87dc1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    notes: "Monthly team meeting lunch."
  },
  {
    id: "e4",
    description: "Office Supplies",
    category: "Supplies",
    amount: 156.78,
    date: new Date("2023-05-18"),
    paymentMethod: "Credit Card",
    vendor: "Office Depot",
    reference: "PO-2023-042",
    receipt: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "e5",
    description: "Software Subscription",
    category: "Software",
    amount: 49.99,
    date: new Date("2023-05-20"),
    paymentMethod: "Credit Card",
    vendor: "Adobe",
    reference: "SUB-458721",
    notes: "Monthly Creative Cloud subscription."
  },
  {
    id: "e6",
    description: "Client Meeting - Coffee",
    category: "Meals",
    amount: 24.50,
    date: new Date("2023-05-25"),
    paymentMethod: "Cash",
    vendor: "Starbucks",
    receipt: "https://images.unsplash.com/photo-1572799454197-d3a318b87dc1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "e7",
    description: "Marketing Campaign",
    category: "Marketing",
    amount: 500.00,
    date: new Date("2023-06-01"),
    paymentMethod: "Bank Transfer",
    vendor: "Social Ads Inc.",
    reference: "INV-2023-0601"
  },
  {
    id: "e8",
    description: "Phone Bill",
    category: "Utilities",
    amount: 75.00,
    date: new Date("2023-06-05"),
    paymentMethod: "Credit Card",
    vendor: "Verizon",
    reference: "BILL-JUN-2023"
  },
  {
    id: "e9",
    description: "Professional Development Course",
    category: "Training",
    amount: 299.00,
    date: new Date("2023-06-10"),
    paymentMethod: "Credit Card",
    vendor: "Udemy",
    reference: "ORD-987654",
    notes: "React Native Advanced Course for development team."
  }
];

// Function to get all expenses data
export const getExpensesData = (): ExpenseRecord[] => {
  return [...expensesData];
};

// Function to get a specific expense by ID
export const getExpenseById = (id: string): ExpenseRecord | undefined => {
  return expensesData.find(expense => expense.id === id);
};

// Function to delete an expense by ID
export const deleteExpense = (id: string): boolean => {
  const index = expensesData.findIndex(expense => expense.id === id);
  if (index !== -1) {
    expensesData.splice(index, 1);
    return true;
  }
  return false;
};

// Function to add a new expense
export const addExpense = (expense: ExpenseRecord): ExpenseRecord => {
  expensesData.push(expense);
  return expense;
};

// Function to update an existing expense
export const updateExpense = (updatedExpense: ExpenseRecord): ExpenseRecord | null => {
  const index = expensesData.findIndex(expense => expense.id === updatedExpense.id);
  if (index !== -1) {
    expensesData[index] = updatedExpense;
    return updatedExpense;
  }
  return null;
};

// Function to restore a deleted expense
export const restoreExpense = (expense: ExpenseRecord): boolean => {
  if (!expensesData.some(e => e.id === expense.id)) {
    expensesData.push(expense);
    return true;
  }
  return false;
};