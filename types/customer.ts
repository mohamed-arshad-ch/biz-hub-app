export interface Customer {
  id: number;
  userId: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  contactPerson: string | null;
  category: string | null;
  status: 'active' | 'inactive' | 'blocked' | null;
  notes: string | null;
  creditLimit: number | null;
  paymentTerms: string | null;
  taxId: string | null;
  tags: string | null;
  outstandingBalance: number | null;
  totalPurchases: number | null;
  createdAt: string | null;
}

export interface CustomerCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
  parentCategory?: string;
}