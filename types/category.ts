export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface IncomeCategory extends Category {}

export interface ExpenseCategory extends Category {} 