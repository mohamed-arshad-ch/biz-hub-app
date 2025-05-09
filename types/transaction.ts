export type TransactionType = 'sale' | 'purchase';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date;
  description: string;
  customer?: string;
  vendor?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}