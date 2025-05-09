import { SaleRecord } from "@/types/sales";

// Mock sales data
const salesData: SaleRecord[] = [
  {
    id: "s1",
    invoiceNumber: "INV-2023-001",
    customer: "Acme Corporation",
    date: new Date("2023-05-15"),
    dueDate: new Date("2023-06-15"),
    amount: 1250.00,
    status: "paid",
    paymentMethod: "Bank Transfer",
    items: [
      {
        id: "i1",
        name: "Web Design Services",
        description: "Homepage redesign",
        quantity: 1,
        unitPrice: 1000.00,
        total: 1000.00
      },
      {
        id: "i2",
        name: "Logo Design",
        description: "Company logo refresh",
        quantity: 1,
        unitPrice: 250.00,
        total: 250.00
      }
    ],
    notes: "Client requested expedited delivery."
  },
  {
    id: "s2",
    invoiceNumber: "INV-2023-002",
    customer: "TechStart Inc.",
    date: new Date("2023-06-02"),
    dueDate: new Date("2023-07-02"),
    amount: 3500.00,
    status: "pending",
    paymentMethod: "Credit Card",
    items: [
      {
        id: "i3",
        name: "Mobile App Development",
        description: "iOS app development - Phase 1",
        quantity: 1,
        unitPrice: 3500.00,
        total: 3500.00
      }
    ]
  },
  {
    id: "s3",
    invoiceNumber: "INV-2023-003",
    customer: "Global Retail Ltd.",
    date: new Date("2023-06-10"),
    dueDate: new Date("2023-07-10"),
    amount: 750.00,
    status: "overdue",
    paymentMethod: "Check",
    items: [
      {
        id: "i4",
        name: "Marketing Consultation",
        description: "2-hour strategy session",
        quantity: 2,
        unitPrice: 375.00,
        total: 750.00
      }
    ],
    notes: "Follow-up meeting scheduled for next month."
  },
  {
    id: "s4",
    invoiceNumber: "INV-2023-004",
    customer: "City Services",
    date: new Date("2023-06-15"),
    dueDate: new Date("2023-07-15"),
    amount: 1800.00,
    status: "paid",
    paymentMethod: "Bank Transfer",
    items: [
      {
        id: "i5",
        name: "SEO Services",
        description: "Monthly SEO package",
        quantity: 1,
        unitPrice: 1200.00,
        total: 1200.00
      },
      {
        id: "i6",
        name: "Content Writing",
        description: "Blog articles (3)",
        quantity: 3,
        unitPrice: 200.00,
        total: 600.00
      }
    ]
  },
  {
    id: "s5",
    invoiceNumber: "INV-2023-005",
    customer: "Sunshine Cafe",
    date: new Date("2023-06-20"),
    dueDate: new Date("2023-07-20"),
    amount: 950.00,
    status: "pending",
    paymentMethod: "Cash",
    items: [
      {
        id: "i7",
        name: "Menu Design",
        description: "Digital and print menu design",
        quantity: 1,
        unitPrice: 450.00,
        total: 450.00
      },
      {
        id: "i8",
        name: "Photography",
        description: "Food photography session",
        quantity: 1,
        unitPrice: 500.00,
        total: 500.00
      }
    ],
    notes: "Client very satisfied with the photography."
  }
];

// Function to get all sales data
export const getSalesData = (): SaleRecord[] => {
  return [...salesData];
};

// Function to get a specific sale by ID
export const getSaleById = (id: string): SaleRecord | undefined => {
  return salesData.find(sale => sale.id === id);
};

// Function to delete a sale by ID
export const deleteSale = (id: string): boolean => {
  const index = salesData.findIndex(sale => sale.id === id);
  if (index !== -1) {
    salesData.splice(index, 1);
    return true;
  }
  return false;
};

// Function to add a new sale
export const addSale = (sale: SaleRecord): SaleRecord => {
  salesData.push(sale);
  return sale;
};

// Function to update an existing sale
export const updateSale = (updatedSale: SaleRecord): SaleRecord | null => {
  const index = salesData.findIndex(sale => sale.id === updatedSale.id);
  if (index !== -1) {
    salesData[index] = updatedSale;
    return updatedSale;
  }
  return null;
};

// Function to restore a deleted sale
export const restoreSale = (sale: SaleRecord): boolean => {
  if (!salesData.some(s => s.id === sale.id)) {
    salesData.push(sale);
    return true;
  }
  return false;
};