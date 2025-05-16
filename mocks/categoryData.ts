import { ExpenseCategory, IncomeCategory } from "@/types/category";

// Mock expense categories
const expenseCategories: ExpenseCategory[] = [
  { id: '1', name: 'Food', description: 'Meals and groceries', color: '#4CAF50' },
  { id: '2', name: 'Transportation', description: 'Public transit and rideshares', color: '#2196F3' },
  { id: '3', name: 'Utilities', description: 'Bills and subscriptions', color: '#FBBC04' },
  { id: '4', name: 'Entertainment', description: 'Movies, games, and leisure', color: '#9C27B0' },
  { id: '5', name: 'Other', description: 'Miscellaneous expenses', color: '#757575' }
];

// Mock income categories
const incomeCategories: IncomeCategory[] = [
  { id: '1', name: 'Salary', description: 'Regular employment income', color: '#4CAF50' },
  { id: '2', name: 'Investment', description: 'Returns from investments', color: '#2196F3' },
  { id: '3', name: 'Business', description: 'Income from business operations', color: '#FBBC04' },
  { id: '4', name: 'Freelance', description: 'Income from freelance work', color: '#9C27B0' },
  { id: '5', name: 'Other', description: 'Miscellaneous income', color: '#757575' }
];

// Function to get expense categories
export const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  return [...expenseCategories];
};

// Function to get income categories
export const getIncomeCategories = async (): Promise<IncomeCategory[]> => {
  return [...incomeCategories];
};

// Function to add expense category
export const addExpenseCategory = async (categoryData: Omit<ExpenseCategory, 'id'> | ExpenseCategory): Promise<ExpenseCategory> => {
  const newCategory = 'id' in categoryData 
    ? categoryData 
    : { ...categoryData, id: Date.now().toString() };
  
  expenseCategories.push(newCategory as ExpenseCategory);
  return newCategory as ExpenseCategory;
};

// Function to update expense category
export const updateExpenseCategory = async (
  id: string, 
  categoryData: Partial<Omit<ExpenseCategory, 'id'>>
): Promise<ExpenseCategory | null> => {
  const index = expenseCategories.findIndex(cat => cat.id === id);
  if (index !== -1) {
    expenseCategories[index] = { ...expenseCategories[index], ...categoryData };
    return expenseCategories[index];
  }
  return null;
};

// Function to delete expense category
export const deleteExpenseCategory = async (categoryId: string): Promise<boolean> => {
  const index = expenseCategories.findIndex(cat => cat.id === categoryId);
  if (index !== -1) {
    expenseCategories.splice(index, 1);
    return true;
  }
  return false;
};

// Function to add income category
export const addIncomeCategory = async (categoryData: Omit<IncomeCategory, 'id'> | IncomeCategory): Promise<IncomeCategory> => {
  const newCategory = 'id' in categoryData 
    ? categoryData 
    : { ...categoryData, id: Date.now().toString() };
  
  incomeCategories.push(newCategory as IncomeCategory);
  return newCategory as IncomeCategory;
};

// Function to update income category
export const updateIncomeCategory = async (
  id: string, 
  categoryData: Partial<Omit<IncomeCategory, 'id'>>
): Promise<IncomeCategory | null> => {
  const index = incomeCategories.findIndex(cat => cat.id === id);
  if (index !== -1) {
    incomeCategories[index] = { ...incomeCategories[index], ...categoryData };
    return incomeCategories[index];
  }
  return null;
};

// Function to delete income category
export const deleteIncomeCategory = async (categoryId: string): Promise<boolean> => {
  const index = incomeCategories.findIndex(cat => cat.id === categoryId);
  if (index !== -1) {
    incomeCategories.splice(index, 1);
    return true;
  }
  return false;
}; 