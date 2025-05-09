import { Product, StockStatus } from "@/types/product";

// Generate random number between min and max
const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Generate random date within the last 180 days
const randomRecentDate = (): Date => {
  const now = new Date();
  const daysAgo = randomNumber(0, 180);
  const result = new Date(now);
  result.setDate(now.getDate() - daysAgo);
  return result;
};

// Generate random future date (for expiry)
const randomFutureDate = (): Date => {
  const now = new Date();
  const daysAhead = randomNumber(30, 365);
  const result = new Date(now);
  result.setDate(now.getDate() + daysAhead);
  return result;
};

// Generate random product data
const generateRandomProduct = (id: string): Product => {
  const createdAt = randomRecentDate();
  const updatedAt = new Date(createdAt);
  updatedAt.setDate(createdAt.getDate() + randomNumber(0, 30));
  
  // Generate random stock quantity and reorder level
  const stockQuantity = randomNumber(0, 1000);
  const reorderLevel = randomNumber(10, 100);
  
  // Determine stock status based on quantity
  let status: StockStatus;
  if (stockQuantity === 0) {
    status = 'out_of_stock';
  } else if (stockQuantity < reorderLevel) {
    status = 'low_stock';
  } else if (Math.random() > 0.95) {
    status = 'discontinued';
  } else {
    status = 'in_stock';
  }
  
  // Generate random prices
  const purchasePrice = randomNumber(10, 500);
  const sellingPrice = purchasePrice * (1 + (randomNumber(10, 50) / 100)); // 10-50% markup
  
  // Generate random product name
  const adjectives = [
    "Premium", "Deluxe", "Standard", "Basic", "Professional", "Advanced",
    "Essential", "Classic", "Modern", "Compact", "Portable", "Durable"
  ];
  
  const productTypes = [
    "Widget", "Gadget", "Tool", "Device", "Appliance", "Component",
    "System", "Kit", "Set", "Package", "Solution", "Equipment"
  ];
  
  const models = [
    "X100", "Pro", "Plus", "Max", "Ultra", "Lite", "Mini", "XL",
    "2000", "Elite", "Prime", "Select", "V2", "Next", "Smart"
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
  const model = models[Math.floor(Math.random() * models.length)];
  
  const name = `${adjective} ${productType} ${model}`;
  
  // Generate random SKU
  const skuPrefix = productType.substring(0, 3).toUpperCase();
  const sku = `${skuPrefix}-${randomNumber(10000, 99999)}`;
  
  // Generate random barcode
  const barcode = Math.random() > 0.3 ? `${randomNumber(100000000000, 999999999999)}` : undefined;
  
  // Generate random description
  const descriptions = [
    `High-quality ${productType.toLowerCase()} for professional use.`,
    `Versatile ${productType.toLowerCase()} suitable for various applications.`,
    `Reliable ${productType.toLowerCase()} with extended durability.`,
    `Cost-effective ${productType.toLowerCase()} with essential features.`,
    `Advanced ${productType.toLowerCase()} with innovative technology.`
  ];
  
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  // Generate random categories
  const categories = [
    "Electronics", "Office Supplies", "Hardware", "Tools", "Furniture",
    "Kitchen", "Bathroom", "Outdoor", "Automotive", "Industrial", "Medical"
  ];
  
  const category = Math.random() > 0.2 ? 
    categories[Math.floor(Math.random() * categories.length)] : 
    undefined;
  
  // Generate random tags
  const allTags = [
    "New", "Bestseller", "Sale", "Clearance", "Limited", "Exclusive",
    "Imported", "Eco-friendly", "Handmade", "Organic", "Recyclable", "Premium"
  ];
  
  const tags = Math.random() > 0.5 ? 
    Array.from(new Set([
      allTags[Math.floor(Math.random() * allTags.length)],
      allTags[Math.floor(Math.random() * allTags.length)]
    ])) : 
    undefined;
  
  // Generate random units
  const units = [
    "piece", "set", "pair", "box", "pack", "case", "pallet",
    "kg", "g", "lb", "oz", "l", "ml", "gal", "m", "cm", "in"
  ];
  
  const unit = units[Math.floor(Math.random() * units.length)];
  
  // Generate random tax rate
  const taxRate = Math.random() > 0.3 ? randomNumber(5, 20) : undefined;
  
  // Generate random images
  const imageUrls = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a",
    "https://images.unsplash.com/photo-1564466809058-bf4114d55352"
  ];
  
  const images = Math.random() > 0.3 ? 
    [imageUrls[Math.floor(Math.random() * imageUrls.length)]] : 
    undefined;
  
  // Generate random vendor
  const vendors = [
    "Global Supplies Inc.", "Premium Distributors", "Quality Products Co.",
    "Wholesale Solutions", "Direct Manufacturers", "International Imports"
  ];
  
  const vendor = Math.random() > 0.3 ? 
    vendors[Math.floor(Math.random() * vendors.length)] : 
    undefined;
  
  // Generate random location
  const locations = [
    "Warehouse A", "Warehouse B", "Store Room", "Main Storage",
    "Back Office", "Display Area", "Section 1", "Section 2"
  ];
  
  const location = Math.random() > 0.3 ? 
    locations[Math.floor(Math.random() * locations.length)] : 
    undefined;
  
  // Generate random dimensions
  const dimensions = Math.random() > 0.5 ? {
    length: randomNumber(1, 100),
    width: randomNumber(1, 100),
    height: randomNumber(1, 100),
    weight: randomNumber(1, 50)
  } : undefined;
  
  // Generate random expiry date for applicable products
  const expiryDate = Math.random() > 0.7 ? randomFutureDate() : undefined;
  
  return {
    id,
    name,
    sku,
    barcode,
    description,
    category,
    tags,
    purchasePrice,
    sellingPrice,
    stockQuantity,
    reorderLevel,
    unit,
    taxRate,
    images,
    vendor,
    location,
    dimensions,
    status,
    createdAt,
    updatedAt,
    expiryDate,
    notes: Math.random() > 0.7 ? "Product notes go here..." : undefined
  };
};

// Generate a list of products
export const getProductsData = (count: number = 50): Product[] => {
  const products: Product[] = [];
  
  for (let i = 0; i < count; i++) {
    products.push(generateRandomProduct(`prod-${i + 1}`));
  }
  
  // Sort by name
  return products.sort((a, b) => a.name.localeCompare(b.name));
};

// Get a single product by ID
export const getProductById = (id: string): Product | undefined => {
  // For demo purposes, generate a product with the given ID
  return generateRandomProduct(id);
};