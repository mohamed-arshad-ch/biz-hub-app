export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category?: string;
  tags?: string[];
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  unit: string;
  taxRate?: number;
  images?: string[];
  vendor?: string;
  location?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  status: StockStatus;
  createdAt: Date;
  updatedAt: Date;
  expiryDate?: Date;
  notes?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
  parentCategory?: string;
}