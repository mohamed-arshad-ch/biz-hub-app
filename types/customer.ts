export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  company?: string;
  notes?: string;
  outstandingBalance: number;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  category?: string;
  tags?: string[];
  contactPerson?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  status: 'active' | 'inactive' | 'blocked';
}

export interface CustomerCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}