export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  company: string;
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
  website?: string;
  bankDetails?: string;
  productCategories?: string[];
}

export interface VendorCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  inactiveVendors: number;
  blockedVendors: number;
  totalOutstanding: number;
  averageOutstanding: number;
  topVendorsByPurchase: Vendor[];
  recentlyAddedVendors: Vendor[];
}

export interface VendorFilter {
  search: string;
  status: 'all' | 'active' | 'inactive' | 'blocked';
  category?: string;
  sortBy: 'name' | 'balance' | 'recent';
  sortOrder: 'asc' | 'desc';
}