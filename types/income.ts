export interface IncomeRecord {
  id: string;
  source: string;
  amount: number;
  date: Date;
  category: string;
  notes?: string;
  paymentMethod?: string;
  reference?: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
  color: string;
}