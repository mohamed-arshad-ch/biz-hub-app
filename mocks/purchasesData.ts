import { PurchaseRecord } from "@/types/purchases";

// Mock purchases data
const purchasesData: PurchaseRecord[] = [
  {
    id: "p1",
    poNumber: "PO-2023-001",
    vendor: "Office Supplies Co.",
    date: new Date("2023-05-10"),
    dueDate: new Date("2023-06-10"),
    amount: 450.75,
    status: "paid",
    paymentMethod: "Credit Card",
    items: [
      {
        id: "pi1",
        name: "Printer Paper",
        description: "A4 size, 5 reams",
        quantity: 5,
        unitPrice: 8.99,
        total: 44.95
      },
      {
        id: "pi2",
        name: "Ink Cartridges",
        description: "Black and color set",
        quantity: 3,
        unitPrice: 65.50,
        total: 196.50
      },
      {
        id: "pi3",
        name: "Office Chairs",
        description: "Ergonomic design",
        quantity: 2,
        unitPrice: 104.65,
        total: 209.30
      }
    ],
    notes: "Delivered to main office reception."
  },
  {
    id: "p2",
    poNumber: "PO-2023-002",
    vendor: "Tech Hardware Inc.",
    date: new Date("2023-05-25"),
    dueDate: new Date("2023-06-25"),
    amount: 2899.97,
    status: "pending",
    paymentMethod: "Bank Transfer",
    items: [
      {
        id: "pi4",
        name: "Laptop Computers",
        description: "15-inch, 16GB RAM, 512GB SSD",
        quantity: 3,
        unitPrice: 966.66,
        total: 2899.97
      }
    ],
    notes: "For new marketing team members."
  },
  {
    id: "p3",
    poNumber: "PO-2023-003",
    vendor: "Catering Services Ltd.",
    date: new Date("2023-06-05"),
    dueDate: new Date("2023-06-20"),
    amount: 750.00,
    status: "overdue",
    paymentMethod: "Check",
    items: [
      {
        id: "pi5",
        name: "Corporate Event Catering",
        description: "Lunch for 30 people",
        quantity: 30,
        unitPrice: 25.00,
        total: 750.00
      }
    ],
    notes: "For quarterly team meeting."
  },
  {
    id: "p4",
    poNumber: "PO-2023-004",
    vendor: "Marketing Materials Co.",
    date: new Date("2023-06-12"),
    dueDate: new Date("2023-07-12"),
    amount: 1250.50,
    status: "paid",
    paymentMethod: "Credit Card",
    items: [
      {
        id: "pi6",
        name: "Brochures",
        description: "Tri-fold, full color, 100lb gloss",
        quantity: 500,
        unitPrice: 1.25,
        total: 625.00
      },
      {
        id: "pi7",
        name: "Business Cards",
        description: "Double-sided, premium stock",
        quantity: 1000,
        unitPrice: 0.15,
        total: 150.00
      },
      {
        id: "pi8",
        name: "Promotional Pens",
        description: "Custom logo, blue ink",
        quantity: 250,
        unitPrice: 1.90,
        total: 475.50
      }
    ]
  },
  {
    id: "p5",
    poNumber: "PO-2023-005",
    vendor: "Software Solutions",
    date: new Date("2023-06-18"),
    dueDate: new Date("2023-07-18"),
    amount: 3600.00,
    status: "cancelled",
    paymentMethod: "Bank Transfer",
    items: [
      {
        id: "pi9",
        name: "CRM Software Licenses",
        description: "Annual subscription, 12 users",
        quantity: 12,
        unitPrice: 300.00,
        total: 3600.00
      }
    ],
    notes: "Order cancelled due to change in requirements."
  },
  {
    id: "p6",
    poNumber: "PO-2023-006",
    vendor: "Office Furniture Inc.",
    date: new Date("2023-06-22"),
    dueDate: new Date("2023-07-22"),
    amount: 1875.25,
    status: "paid",
    paymentMethod: "Credit Card",
    items: [
      {
        id: "pi10",
        name: "Desk",
        description: "Adjustable height, oak finish",
        quantity: 3,
        unitPrice: 425.75,
        total: 1277.25
      },
      {
        id: "pi11",
        name: "Filing Cabinet",
        description: "3-drawer, metal",
        quantity: 2,
        unitPrice: 299.00,
        total: 598.00
      }
    ]
  },
  {
    id: "p7",
    poNumber: "PO-2023-007",
    vendor: "Tech Hardware Inc.",
    date: new Date("2023-06-28"),
    dueDate: new Date("2023-07-28"),
    amount: 1299.95,
    status: "pending",
    paymentMethod: "Bank Transfer",
    items: [
      {
        id: "pi12",
        name: "Monitors",
        description: "27-inch, 4K resolution",
        quantity: 5,
        unitPrice: 259.99,
        total: 1299.95
      }
    ]
  },
  {
    id: "p8",
    poNumber: "PO-2023-008",
    vendor: "Office Supplies Co.",
    date: new Date("2023-07-05"),
    dueDate: new Date("2023-08-05"),
    amount: 325.45,
    status: "paid",
    paymentMethod: "Credit Card",
    items: [
      {
        id: "pi13",
        name: "Notebooks",
        description: "Spiral bound, college ruled",
        quantity: 25,
        unitPrice: 3.99,
        total: 99.75
      },
      {
        id: "pi14",
        name: "Pens",
        description: "Ballpoint, black ink",
        quantity: 100,
        unitPrice: 0.75,
        total: 75.00
      },
      {
        id: "pi15",
        name: "Staplers",
        description: "Desktop, full size",
        quantity: 10,
        unitPrice: 12.95,
        total: 129.50
      },
      {
        id: "pi16",
        name: "Paper Clips",
        description: "Box of 100",
        quantity: 15,
        unitPrice: 1.41,
        total: 21.20
      }
    ]
  },
  {
    id: "p9",
    poNumber: "PO-2023-009",
    vendor: "Cleaning Services LLC",
    date: new Date("2023-07-10"),
    dueDate: new Date("2023-08-10"),
    amount: 850.00,
    status: "pending",
    paymentMethod: "Check",
    items: [
      {
        id: "pi17",
        name: "Office Cleaning",
        description: "Monthly service",
        quantity: 1,
        unitPrice: 850.00,
        total: 850.00
      }
    ]
  },
  {
    id: "p10",
    poNumber: "PO-2023-010",
    vendor: "IT Support Services",
    date: new Date("2023-07-15"),
    dueDate: new Date("2023-08-15"),
    amount: 1200.00,
    status: "paid",
    paymentMethod: "Bank Transfer",
    items: [
      {
        id: "pi18",
        name: "Network Maintenance",
        description: "Monthly service contract",
        quantity: 1,
        unitPrice: 1200.00,
        total: 1200.00
      }
    ]
  },
  {
    id: "p11",
    poNumber: "PO-2023-011",
    vendor: "Marketing Materials Co.",
    date: new Date("2023-07-20"),
    dueDate: new Date("2023-08-20"),
    amount: 2750.00,
    status: "pending",
    paymentMethod: "Credit Card",
    items: [
      {
        id: "pi19",
        name: "Trade Show Booth",
        description: "10x10 custom display",
        quantity: 1,
        unitPrice: 2750.00,
        total: 2750.00
      }
    ]
  },
  {
    id: "p12",
    poNumber: "PO-2023-012",
    vendor: "Office Furniture Inc.",
    date: new Date("2023-07-25"),
    dueDate: new Date("2023-08-25"),
    amount: 3450.75,
    status: "overdue",
    paymentMethod: "Bank Transfer",
    items: [
      {
        id: "pi20",
        name: "Conference Table",
        description: "12-person, oval",
        quantity: 1,
        unitPrice: 2200.00,
        total: 2200.00
      },
      {
        id: "pi21",
        name: "Conference Chairs",
        description: "Ergonomic, adjustable",
        quantity: 12,
        unitPrice: 104.23,
        total: 1250.75
      }
    ]
  },
  {
    id: "p13",
    poNumber: "PO-2023-013",
    vendor: "Tech Hardware Inc.",
    date: new Date("2023-08-01"),
    dueDate: new Date("2023-09-01"),
    amount: 4500.00,
    status: "paid",
    paymentMethod: "Bank Transfer",
    items: [
      {
        id: "pi22",
        name: "Server Equipment",
        description: "Rack-mounted server",
        quantity: 1,
        unitPrice: 4500.00,
        total: 4500.00
      }
    ]
  },
  {
    id: "p14",
    poNumber: "PO-2023-014",
    vendor: "Software Solutions",
    date: new Date("2023-08-05"),
    dueDate: new Date("2023-09-05"),
    amount: 1800.00,
    status: "pending",
    paymentMethod: "Credit Card",
    items: [
      {
        id: "pi23",
        name: "Accounting Software",
        description: "Annual subscription, 6 users",
        quantity: 6,
        unitPrice: 300.00,
        total: 1800.00
      }
    ]
  },
  {
    id: "p15",
    poNumber: "PO-2023-015",
    vendor: "Office Supplies Co.",
    date: new Date("2023-08-10"),
    dueDate: new Date("2023-09-10"),
    amount: 567.85,
    status: "paid",
    paymentMethod: "Credit Card",
    items: [
      {
        id: "pi24",
        name: "Printer Toner",
        description: "Black, high yield",
        quantity: 5,
        unitPrice: 89.99,
        total: 449.95
      },
      {
        id: "pi25",
        name: "Copy Paper",
        description: "Case, letter size",
        quantity: 3,
        unitPrice: 39.30,
        total: 117.90
      }
    ]
  }
];

// Function to get all purchases data
export const getPurchasesData = (): PurchaseRecord[] => {
  return [...purchasesData];
};

// Function to get a specific purchase by ID
export const getPurchaseById = (id: string): PurchaseRecord | undefined => {
  return purchasesData.find(purchase => purchase.id === id);
};

// Function to delete a purchase by ID
export const deletePurchase = (id: string): boolean => {
  const index = purchasesData.findIndex(purchase => purchase.id === id);
  if (index !== -1) {
    purchasesData.splice(index, 1);
    return true;
  }
  return false;
};

// Function to add a new purchase
export const addPurchase = (purchase: PurchaseRecord): PurchaseRecord => {
  purchasesData.push(purchase);
  return purchase;
};

// Function to update an existing purchase
export const updatePurchase = (updatedPurchase: PurchaseRecord): PurchaseRecord | null => {
  const index = purchasesData.findIndex(purchase => purchase.id === updatedPurchase.id);
  if (index !== -1) {
    purchasesData[index] = updatedPurchase;
    return updatedPurchase;
  }
  return null;
};

// Function to get purchases by vendor
export const getPurchasesByVendor = (vendorName: string): PurchaseRecord[] => {
  return purchasesData.filter(purchase => purchase.vendor === vendorName);
};

// Function to get purchases by status
export const getPurchasesByStatus = (status: string): PurchaseRecord[] => {
  return purchasesData.filter(purchase => purchase.status === status);
};

// Function to get purchases by date range
export const getPurchasesByDateRange = (startDate: Date, endDate: Date): PurchaseRecord[] => {
  return purchasesData.filter(purchase => {
    const purchaseDate = new Date(purchase.date);
    return purchaseDate >= startDate && purchaseDate <= endDate;
  });
};

// Function to get total purchase amount
export const getTotalPurchaseAmount = (): number => {
  return purchasesData.reduce((total, purchase) => total + purchase.amount, 0);
};

// Function to get total purchase amount by vendor
export const getTotalPurchaseAmountByVendor = (vendorName: string): number => {
  return purchasesData
    .filter(purchase => purchase.vendor === vendorName)
    .reduce((total, purchase) => total + purchase.amount, 0);
};

// Function to restore a deleted purchase
export const restorePurchase = (purchase: PurchaseRecord): boolean => {
  if (!purchasesData.some(p => p.id === purchase.id)) {
    purchasesData.push(purchase);
    return true;
  }
  return false;
};