import { Vendor } from "@/types/vendor";

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

// Generate random vendor data
const generateRandomVendor = (id: string): Vendor => {
  const createdAt = randomRecentDate();
  const updatedAt = new Date(createdAt);
  updatedAt.setDate(createdAt.getDate() + randomNumber(0, 30));
  
  const outstandingBalance = Math.random() > 0.3 ? randomNumber(0, 10000) : 0;
  const totalPurchases = randomNumber(1000, 100000);
  
  const lastPurchaseDate = Math.random() > 0.1 ? randomRecentDate() : undefined;
  
  const statusOptions: ('active' | 'inactive' | 'blocked')[] = ['active', 'inactive', 'blocked'];
  const statusWeights = [85, 10, 5]; // Probability weights (%)
  
  let status: 'active' | 'inactive' | 'blocked' = 'active';
  const randomValue = Math.random() * 100;
  let cumulativeWeight = 0;
  
  for (let i = 0; i < statusOptions.length; i++) {
    cumulativeWeight += statusWeights[i];
    if (randomValue <= cumulativeWeight) {
      status = statusOptions[i];
      break;
    }
  }
  
  // Generate random company name
  const companyPrefixes = [
    "Global", "Advanced", "Premier", "Elite", "Superior", "Innovative", "Dynamic",
    "Strategic", "Precision", "Reliable", "Unified", "Integrated", "Progressive"
  ];
  
  const companySuffixes = [
    "Solutions", "Systems", "Technologies", "Industries", "Enterprises", "Services",
    "Group", "Associates", "Consultants", "Partners", "International", "Corporation"
  ];
  
  const companyTypes = [
    "Manufacturing", "Distribution", "Supply", "Logistics", "Wholesale", "Production",
    "Materials", "Equipment", "Hardware", "Software", "Electronics", "Packaging"
  ];
  
  const companyPrefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
  const companySuffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
  const companyType = companyTypes[Math.floor(Math.random() * companyTypes.length)];
  
  const company = `${companyPrefix} ${companyType} ${companySuffix}`;
  
  // Generate random contact person
  const firstNames = [
    "John", "Jane", "Michael", "Emily", "David", "Sarah", "Robert", "Lisa",
    "William", "Mary", "James", "Patricia", "Thomas", "Jennifer", "Charles", "Linda"
  ];
  
  const lastNames = [
    "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson",
    "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin"
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const contactPerson = `${firstName} ${lastName}`;
  
  // Generate random name (company name or contact person)
  const name = Math.random() > 0.7 ? contactPerson : company;
  
  // Generate random email
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s/g, '')}.com`;
  
  // Generate random phone number
  const phone = `(${randomNumber(100, 999)}) ${randomNumber(100, 999)}-${randomNumber(1000, 9999)}`;
  
  // Generate random address
  const streets = [
    "Main St", "Oak Ave", "Maple Rd", "Cedar Ln", "Pine St", "Elm Dr",
    "Washington Ave", "Park Rd", "Lake St", "River Rd", "Mountain View"
  ];
  
  const cities = [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville"
  ];
  
  const states = [
    "NY", "CA", "IL", "TX", "AZ", "PA", "FL", "OH", "GA", "NC", "MI", "NJ"
  ];
  
  const address = `${randomNumber(100, 9999)} ${streets[Math.floor(Math.random() * streets.length)]}`;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  const zipCode = `${randomNumber(10000, 99999)}`;
  
  // Generate random website
  const website = `www.${company.toLowerCase().replace(/\s/g, '')}.com`;
  
  // Generate random tags
  const allTags = [
    "Preferred", "New", "International", "Local", "Credit", "Cash",
    "Wholesale", "Manufacturing", "Retail", "Distributor", "Supplier", "Contractor"
  ];
  
  const tags = Math.random() > 0.5 ? 
    Array.from(new Set([
      allTags[Math.floor(Math.random() * allTags.length)],
      allTags[Math.floor(Math.random() * allTags.length)]
    ])) : 
    undefined;
  
  // Generate random categories
  const categories = [
    "Raw Materials", "Equipment", "Office Supplies", "Packaging", "IT Services",
    "Maintenance", "Logistics", "Marketing", "Consulting", "Utilities", "Facilities"
  ];
  
  const category = Math.random() > 0.3 ? 
    categories[Math.floor(Math.random() * categories.length)] : 
    undefined;
  
  // Generate random product categories
  const productCategories = Math.random() > 0.5 ?
    Array.from(new Set([
      categories[Math.floor(Math.random() * categories.length)],
      categories[Math.floor(Math.random() * categories.length)]
    ])) :
    undefined;
  
  // Generate random bank details
  const bankDetails = Math.random() > 0.5 ?
    `Bank: National Bank, Account: XXXX-XXXX-${randomNumber(1000, 9999)}` :
    undefined;
  
  return {
    id,
    name,
    email,
    phone,
    address,
    city,
    state,
    zipCode,
    country: "USA",
    company,
    notes: Math.random() > 0.7 ? "Vendor notes go here..." : undefined,
    outstandingBalance,
    totalPurchases,
    lastPurchaseDate,
    createdAt,
    updatedAt,
    category,
    tags,
    contactPerson,
    taxId: Math.random() > 0.5 ? `TAX-${randomNumber(10000, 99999)}` : undefined,
    paymentTerms: Math.random() > 0.5 ? "Net 30" : undefined,
    creditLimit: Math.random() > 0.5 ? randomNumber(10000, 100000) : undefined,
    status,
    website,
    bankDetails,
    productCategories
  };
};

// Generate a list of vendors
export const getVendorsData = (count: number = 50): Vendor[] => {
  const vendors: Vendor[] = [];
  
  for (let i = 0; i < count; i++) {
    vendors.push(generateRandomVendor(`vend-${i + 1}`));
  }
  
  // Sort by name
  return vendors.sort((a, b) => a.name.localeCompare(b.name));
};

// Get a single vendor by ID
export const getVendorById = (id: string): Vendor | undefined => {
  // For demo purposes, generate a vendor with the given ID
  return generateRandomVendor(id);
};