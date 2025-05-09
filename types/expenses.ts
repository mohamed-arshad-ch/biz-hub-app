export interface ExpenseRecord {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  vendor?: string;
  notes?: string;
  paymentMethod?: string;
  reference?: string;
  receipt?: string; // URL to receipt image
  taxDeductible?: boolean;
  reimbursable?: boolean;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}