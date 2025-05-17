export interface Product {
  id: number;
  userId: number;
  productName: string;
  sku: string;
  barcode: string | null;
  category: string | null;
  brand: string | null;
  isActive: boolean;
  costPrice: number;
  sellingPrice: number;
  taxRate: number | null;
  stockQuantity: number;
  unit: string | null;
  reorderLevel: number | null;
  vendor: string | null;
  location: string | null;
  shortDescription: string | null;
  fullDescription: string | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  tags: string | null;
  notes: string | null;
  images: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
  parentCategory?: string;
}