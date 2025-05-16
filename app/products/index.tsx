import React, { useState, useCallback, useRef, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  SortAsc,
  SortDesc,
  Filter,
  Download,
  Upload,
  Grid,
  List,
  MoreVertical,
  Trash2,
  Edit,
  Barcode,
  CheckSquare,
  Square,
  Copy,
  X,
  ChevronDown,
  Package,
  DollarSign,
  ShoppingBag,
  Info,
  Tag,
  Check
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import EmptyState from "@/components/EmptyState";
import FloatingActionButton from "@/components/FloatingActionButton";
import SnackBar from "@/components/SnackBar";
import { Product } from "@/types/product";

// Mock Products data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Widget Pro',
    sku: 'WID-12345',
    barcode: '123456789012',
    description: 'High-quality widget for professional use.',
    category: 'Electronics',
    tags: ['premium', 'bestseller'],
    purchasePrice: 120,
    sellingPrice: 199.99,
    stockQuantity: 45,
    reorderLevel: 10,
    unit: 'piece',
    taxRate: 10,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30'],
    vendor: 'Global Supplies Inc.',
    location: 'Warehouse A',
    dimensions: {
      length: 15,
      width: 10,
      height: 5,
      weight: 2
    },
    status: 'in_stock',
    createdAt: new Date('2023-03-15T10:00:00Z'),
    updatedAt: new Date('2023-05-20T14:30:00Z')
  },
  {
    id: '2',
    name: 'Standard Gadget X100',
    sku: 'GAD-54321',
    barcode: '098765432109',
    description: 'Versatile gadget suitable for various applications.',
    category: 'Office Supplies',
    tags: ['sale'],
    purchasePrice: 50,
    sellingPrice: 89.99,
    stockQuantity: 8,
    reorderLevel: 15,
    unit: 'piece',
    taxRate: 8,
    vendor: 'Premium Distributors',
    status: 'low_stock',
    createdAt: new Date('2023-04-10T09:15:00Z'),
    updatedAt: new Date('2023-05-18T11:45:00Z')
  },
  {
    id: '3',
    name: 'Deluxe Tool Elite',
    sku: 'TOO-98765',
    description: 'Reliable tool with extended durability.',
    category: 'Hardware',
    purchasePrice: 75,
    sellingPrice: 129.99,
    stockQuantity: 0,
    reorderLevel: 5,
    unit: 'set',
    taxRate: 10,
    images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f'],
    location: 'Warehouse B',
    status: 'out_of_stock',
    createdAt: new Date('2023-02-20T15:30:00Z'),
    updatedAt: new Date('2023-05-05T10:20:00Z')
  }
];

type SortOption = "name" | "price" | "stock";
type FilterOption = "all" | "in_stock" | "low_stock" | "out_of_stock";

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOption>("name");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [deletedProduct, setDeletedProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  const snackbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load products on initial render
  useEffect(() => {
    loadProducts();
  }, []);

  // Load products from mock data
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      // Simulate API call with timeout
      setTimeout(() => {
        setProducts(mockProducts);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(
            mockProducts
              .filter(product => product.category)
              .map(product => product.category as string)
          )
        );
        setCategories(uniqueCategories);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error loading products:", error);
      setSnackbarMessage("Failed to load products");
      setSnackbarVisible(true);
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, []);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    try {
      // Filter products based on search text
      const searchLower = text.toLowerCase();
      let filteredProducts = mockProducts.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
        (product.description && product.description.toLowerCase().includes(searchLower))
      );
      
      // Apply filters
      if (activeFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.status === activeFilter);
      }
      
      // Apply category filter
      if (activeCategory !== 'all') {
        filteredProducts = filteredProducts.filter(
          product => product.category === activeCategory
        );
      }
      
      // Apply sorting
      const sortedProducts = sortProducts(filteredProducts, sortOrder);
      setProducts(sortedProducts);
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  const sortProducts = (productsToSort: Product[], order: SortOption) => {
    return [...productsToSort].sort((a, b) => {
      switch (order) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return b.sellingPrice - a.sellingPrice;
        case "stock":
          return b.stockQuantity - a.stockQuantity;
        default:
          return 0;
      }
    });
  };

  const handleSort = async (order: SortOption) => {
    setSortOrder(order);
    setShowSortOptions(false);
    
    // Sort current products list
    const sortedProducts = sortProducts(products, order);
    setProducts(sortedProducts);
  };

  const handleFilter = async (filter: FilterOption) => {
    setActiveFilter(filter);
    setShowFilterOptions(false);
    
    try {
      // Filter products
      let filteredProducts = mockProducts;
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchLower) ||
          (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
          (product.description && product.description.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply status filter
      if (filter !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.status === filter);
      }
      
      // Apply category filter
      if (activeCategory !== 'all') {
        filteredProducts = filteredProducts.filter(
          product => product.category === activeCategory
        );
      }
      
      // Apply sorting
      const sortedProducts = sortProducts(filteredProducts, sortOrder);
      setProducts(sortedProducts);
    } catch (error) {
      console.error("Error filtering products:", error);
    }
  };

  const handleCategoryFilter = async (category: string) => {
    setActiveCategory(category);
    setShowCategoryFilter(false);
    
    try {
      // Filter products
      let filteredProducts = mockProducts;
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchLower) ||
          (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
          (product.description && product.description.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply status filter
      if (activeFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.status === activeFilter);
      }
      
      // Apply category filter
      if (category !== 'all') {
        filteredProducts = filteredProducts.filter(
          product => product.category === category
        );
      }
      
      // Apply sorting
      const sortedProducts = sortProducts(filteredProducts, sortOrder);
      setProducts(sortedProducts);
    } catch (error) {
      console.error("Error filtering products by category:", error);
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "list" ? "grid" : "list");
  };

  const handleAddProduct = () => {
    router.push("/products/new");
  };

  const handleEditProduct = (id: string) => {
    router.push(`/products/edit/${id}`);
  };

  const handleDeleteProduct = async (id: string) => {
    setIsDeleting(true);
    
    // Find the product to be deleted (for undo functionality)
    const productToDelete = products.find(product => product.id === id);
    
    // Show confirmation dialog
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${productToDelete?.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setIsDeleting(false)
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Store the deleted product for potential undo
              setDeletedProduct(productToDelete || null);
              
              // Remove from list
              const updatedProducts = products.filter(p => p.id !== id);
              setProducts(updatedProducts);
              
              // Show snackbar
              setSnackbarMessage("Product deleted");
              setSnackbarVisible(true);
              
              // Clear the snackbar after 5 seconds
              if (snackbarTimeoutRef.current) {
                clearTimeout(snackbarTimeoutRef.current);
              }
              
              snackbarTimeoutRef.current = setTimeout(() => {
                setSnackbarVisible(false);
                setDeletedProduct(null);
              }, 5000);
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert("Error", "Failed to delete product");
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleUndoDelete = async () => {
    if (deletedProduct) {
      try {
        // Re-add the deleted product
        await loadProducts();
        
        setSnackbarVisible(false);
        setDeletedProduct(null);
        
        if (snackbarTimeoutRef.current) {
          clearTimeout(snackbarTimeoutRef.current);
          snackbarTimeoutRef.current = null;
        }
      } catch (error) {
        console.error("Error undoing delete:", error);
        setSnackbarMessage("Failed to restore product");
        setSnackbarVisible(true);
      }
    }
  };

  const handleViewProduct = (id: string) => {
    router.push(`/products/${id}`);
  };

  const handleImport = () => {
    Alert.alert(
      "Import Products",
      "This will allow you to import products from a CSV or Excel file.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Import",
          onPress: () => {
            // In a real app, this would open a file picker
            Alert.alert("Coming Soon", "This feature is coming soon.");
          }
        }
      ]
    );
  };

  const handleExport = () => {
    Alert.alert(
      "Export Products",
      "This will export your products to a CSV or Excel file.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Export",
          onPress: () => {
            // In a real app, this would generate and download a file
            Alert.alert("Coming Soon", "This feature is coming soon.");
          }
        }
      ]
    );
  };

  const handleBarcodeScanner = () => {
    Alert.alert(
      "Scan Barcode",
      "This will open the camera to scan product barcodes.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Scan",
          onPress: () => {
            // In a real app, this would open the camera with barcode scanning
            Alert.alert("Coming Soon", "This feature is coming soon.");
          }
        }
      ]
    );
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedProducts([]);
  };

  const toggleProductSelection = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(productId => productId !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) {
      Alert.alert("No Products Selected", "Please select at least one product to delete.");
      return;
    }
    
    Alert.alert(
      "Delete Selected Products",
      `Are you sure you want to delete ${selectedProducts.length} selected products? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Delete each selected product
              for (const productId of selectedProducts) {
                await handleDeleteProduct(productId);
              }
              
              // Reset selection mode
              setIsSelectionMode(false);
              setSelectedProducts([]);
              
              // Show success message
              setSnackbarMessage(`${selectedProducts.length} products deleted`);
              setSnackbarVisible(true);
              
              // Auto-hide snackbar after 2 seconds
              if (snackbarTimeoutRef.current) {
                clearTimeout(snackbarTimeoutRef.current);
              }
              snackbarTimeoutRef.current = setTimeout(() => {
                setSnackbarVisible(false);
              }, 2000);
            } catch (error) {
              console.error("Error deleting products:", error);
              setSnackbarMessage("Failed to delete products");
              setSnackbarVisible(true);
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleBulkDuplicate = () => {
    if (selectedProducts.length === 0) {
      Alert.alert("No Products Selected", "Please select at least one product to duplicate.");
      return;
    }
    
    Alert.alert(
      "Duplicate Selected Products",
      `Are you sure you want to duplicate ${selectedProducts.length} selected products?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Duplicate",
          onPress: async () => {
            try {
              // Find selected products
              const productsToDuplicate = products.filter(product => 
                selectedProducts.includes(product.id)
              );
              
              // Create duplicates with new IDs
              for (const product of productsToDuplicate) {
                const newProduct: Product = {
                  ...product,
                  id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                  name: `${product.name} (Copy)`,
                  sku: `${product.sku}-COPY`,
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                
                await loadProducts();
              }
              
              // Reset selection mode
              setIsSelectionMode(false);
              setSelectedProducts([]);
              
              // Show success message
              setSnackbarMessage(`${selectedProducts.length} products duplicated`);
              setSnackbarVisible(true);
              
              // Auto-hide snackbar after 2 seconds
              if (snackbarTimeoutRef.current) {
                clearTimeout(snackbarTimeoutRef.current);
              }
              snackbarTimeoutRef.current = setTimeout(() => {
                setSnackbarVisible(false);
              }, 2000);
            } catch (error) {
              console.error("Error duplicating products:", error);
              setSnackbarMessage("Failed to duplicate products");
              setSnackbarVisible(true);
            }
          }
        }
      ]
    );
  };

  const filterAndSortProducts = async () => {
    try {
      // Filter products
      let filteredProducts = mockProducts;
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchLower) ||
          (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
          (product.description && product.description.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply status filter
      if (activeFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.status === activeFilter);
      }
      
      // Apply category filter
      if (activeCategory !== 'all') {
        filteredProducts = filteredProducts.filter(
          product => product.category === activeCategory
        );
      }
      
      const sortedProducts = sortProducts(filteredProducts, sortOrder);
      setProducts(sortedProducts);
    } catch (error) {
      console.error("Error filtering and sorting products:", error);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => isSelectionMode ? toggleProductSelection(item.id) : handleViewProduct(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.productContent}>
        <View style={styles.productMainInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>{formatCurrency(item.sellingPrice)}</Text>
        </View>
        
        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <Package size={16} color={Colors.text.secondary} style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.sku}</Text>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>
          <View style={styles.detailRow}>
            <ShoppingBag size={16} color={Colors.text.secondary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              Stock: {item.stockQuantity} {item.unit}
            </Text>
            <View style={[
              styles.statusBadge,
              { 
                backgroundColor: item.status === 'in_stock' 
                  ? 'rgba(76, 175, 80, 0.1)' 
                  : item.status === 'low_stock' 
                    ? 'rgba(251, 188, 4, 0.1)' 
                    : 'rgba(234, 67, 53, 0.1)'
              }
            ]}>
              <Text style={[
                styles.statusText,
                { 
                  color: item.status === 'in_stock' 
                    ? Colors.status.active 
                    : item.status === 'low_stock' 
                      ? Colors.status.pending 
                      : Colors.status.blocked
                }
              ]}>
                {item.status === 'in_stock' 
                  ? 'IN STOCK' 
                  : item.status === 'low_stock' 
                    ? 'LOW STOCK' 
                    : 'OUT OF STOCK'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionContainer}>
          {isSelectionMode ? (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => toggleProductSelection(item.id)}
            >
              {selectedProducts.includes(item.id) ? (
                <CheckSquare size={22} color={Colors.primary} />
              ) : (
                <Square size={22} color={Colors.text.secondary} />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleEditProduct(item.id)}
              >
                <Edit size={18} color={Colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleDeleteProduct(item.id)}
              >
                <Trash2 size={18} color={Colors.negative} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const getSortLabel = () => {
    switch (sortOrder) {
      case "name":
        return "Name (A-Z)";
      case "price":
        return "Price (High-Low)";
      case "stock":
        return "Stock (High-Low)";
      default:
        return "Sort";
    }
  };

  const getFilterLabel = () => {
    switch (activeFilter) {
      case "all":
        return "All Products";
      case "in_stock":
        return "In Stock";
      case "low_stock":
        return "Low Stock";
      case "out_of_stock":
        return "Out of Stock";
      default:
        return "Filter";
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Products</Text>
        <View style={{width: 40}} />
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <X size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Filter & Sort Options */}
      <View style={styles.filterSortContainer}>
        <View style={styles.filterSortWrapper}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {
              setShowFilterOptions(!showFilterOptions);
              setShowSortOptions(false);
              setShowCategoryFilter(false);
            }}
          >
            <Filter size={16} color={Colors.text.secondary} />
            <Text style={styles.filterSortText}>{getFilterLabel()}</Text>
            <ChevronDown size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              setShowSortOptions(!showSortOptions);
              setShowFilterOptions(false);
              setShowCategoryFilter(false);
            }}
          >
            {sortOrder === "name" ? (
              <SortAsc size={16} color={Colors.text.secondary} />
            ) : (
              <SortDesc size={16} color={Colors.text.secondary} />
            )}
            <Text style={styles.filterSortText}>{getSortLabel()}</Text>
            <ChevronDown size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        {/* Filter Options Dropdown */}
        {showFilterOptions && (
          <View style={styles.dropdown}>
            {(["all", "in_stock", "low_stock", "out_of_stock"] as FilterOption[]).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dropdownItem,
                  activeFilter === option && styles.activeDropdownItem
                ]}
                onPress={() => handleFilter(option)}
              >
                <Text style={[
                  styles.dropdownText,
                  activeFilter === option && styles.activeDropdownText
                ]}>
                  {option === "all" ? "All Products" : 
                   option === "in_stock" ? "In Stock" : 
                   option === "low_stock" ? "Low Stock" : "Out of Stock"}
                </Text>
                {activeFilter === option && (
                  <Check size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Sort Options Dropdown */}
        {showSortOptions && (
          <View style={styles.dropdown}>
            {(["name", "price", "stock"] as SortOption[]).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dropdownItem,
                  sortOrder === option && styles.activeDropdownItem
                ]}
                onPress={() => handleSort(option)}
              >
                <Text style={[
                  styles.dropdownText,
                  sortOrder === option && styles.activeDropdownText
                ]}>
                  {option === "name" ? "Name (A-Z)" : 
                   option === "price" ? "Price (High-Low)" : "Stock (High-Low)"}
                </Text>
                {sortOrder === option && (
                  <Check size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Category Filter Dropdown */}
        {showCategoryFilter && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                activeCategory === "all" && styles.activeDropdownItem
              ]}
              onPress={() => handleCategoryFilter("all")}
            >
              <Text style={[
                styles.dropdownText,
                activeCategory === "all" && styles.activeDropdownText
              ]}>
                All Categories
              </Text>
              {activeCategory === "all" && (
                <Check size={18} color={Colors.primary} />
              )}
            </TouchableOpacity>
            
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.dropdownItem,
                  activeCategory === category && styles.activeDropdownItem
                ]}
                onPress={() => handleCategoryFilter(category)}
              >
                <Text style={[
                  styles.dropdownText,
                  activeCategory === category && styles.activeDropdownText
                ]}>
                  {category}
                </Text>
                {activeCategory === category && (
                  <Check size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      {/* Action Bar */}
      <View style={styles.actionBar}>
        {isSelectionMode ? (
          <View style={styles.selectionModeBar}>
            <Text style={styles.selectedCount}>
              {selectedProducts.length} items selected
            </Text>
            <View style={styles.selectionActions}>
              <TouchableOpacity
                style={styles.selectionAction}
                onPress={handleBulkDelete}
              >
                <Trash2 size={20} color={Colors.negative} />
                <Text style={styles.selectionActionText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionAction}
                onPress={handleBulkDuplicate}
              >
                <Copy size={20} color={Colors.text.primary} />
                <Text style={styles.selectionActionText}>Duplicate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionAction}
                onPress={toggleSelectionMode}
              >
                <X size={20} color={Colors.text.primary} />
                <Text style={styles.selectionActionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={toggleSelectionMode}
            >
              <CheckSquare size={20} color={Colors.text.primary} />
              <Text style={styles.actionText}>Select</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={toggleViewMode}
            >
              {viewMode === "list" ? (
                <>
                  <Grid size={20} color={Colors.text.primary} />
                  <Text style={styles.actionText}>Grid</Text>
                </>
              ) : (
                <>
                  <List size={20} color={Colors.text.primary} />
                  <Text style={styles.actionText}>List</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={handleBarcodeScanner}
            >
              <Barcode size={20} color={Colors.text.primary} />
              <Text style={styles.actionText}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => setShowCategoryFilter(!showCategoryFilter)}
            >
              <Tag size={20} color={Colors.text.primary} />
              <Text style={styles.actionText}>Categories</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Product List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Package size={48} color={Colors.text.secondary} />}
              title="No products found"
              description={searchQuery ? "Try a different search term or filter" : "Add your first product to get started"}
              actionLabel={searchQuery ? "Clear search" : "Add Product"}
              onAction={searchQuery ? () => handleSearch("") : handleAddProduct}
            />
          }
        />
      )}
      
      {!isSelectionMode && (
        <FloatingActionButton
          icon={<Plus size={24} color="#fff" />}
          onPress={handleAddProduct}
        />
      )}
      
      <SnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
        action={deletedProduct ? "UNDO" : undefined}
        onAction={deletedProduct ? handleUndoDelete : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  searchContainer: {
    backgroundColor: Colors.background.default,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: Colors.text.primary,
  },
  filterSortContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  filterSortWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    marginRight: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
  },
  filterSortText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginHorizontal: 6,
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    backgroundColor: Colors.background.default,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  activeDropdownItem: {
    backgroundColor: `${Colors.primary}10`,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  activeDropdownText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  actionBar: {
    backgroundColor: Colors.background.default,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 12,
    color: Colors.text.primary,
    marginTop: 4,
  },
  selectionModeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
  },
  selectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  selectionActionText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  productItem: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productContent: {
    padding: 16,
  },
  productMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  productDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: 12,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginLeft: 8,
  },
  selectButton: {
    alignSelf: 'flex-end',
  },
});