export type PurchaseStatus = "paid" | "pending" | "overdue" | "cancelled";

export interface PurchaseRecord {
  id: string;
  poNumber: string;
  vendor: string;
  amount: number;
  date: Date;
  dueDate?: Date;
  status: PurchaseStatus;
  paymentMethod?: string;
  notes?: string;
  items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description?: string;
}

export interface PurchaseFilter {
  vendors?: string[];
  paymentMethods?: string[];
  statuses?: PurchaseStatus[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  searchQuery?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PurchaseSummary {
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  vendorCount: number;
  byVendor: Record<string, {
    transactions: number;
    amount: number;
    percentage: number;
  }>;
  byProduct: Record<string, {
    quantity: number;
    amount: number;
    percentage: number;
  }>;
  byStatus: Record<string, {
    transactions: number;
    amount: number;
    percentage: number;
  }>;
  byPaymentMethod: Record<string, {
    transactions: number;
    amount: number;
    percentage: number;
  }>;
}

export interface PurchaseReportConfig {
  filters: PurchaseFilter;
  sortField: string;
  sortDirection: 'asc' | 'desc' | 'none';
  viewMode: 'summary' | 'detailed';
  pageSize: number;
  hiddenColumns?: string[];
  savedName?: string;
}