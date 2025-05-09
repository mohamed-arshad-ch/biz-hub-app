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
  ScrollView,
  Platform
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  ArrowUpDown,
  Filter,
  Download,
  Upload,
  Grid,
  List,
  MoreVertical,
  Trash,
  Edit,
  Barcode,
  CheckSquare,
  Square,
  Copy
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import EmptyState from "@/components/EmptyState";
import FloatingActionButton from "@/components/FloatingActionButton";
import ProductItem from "@/components/ProductItem";
import ProductGridItem from "@/components/ProductGridItem";
import SnackBar from "@/components/SnackBar";
import { Product } from "@/types/product";
import { getProducts, deleteProduct, searchProducts, addProduct } from "@/utils/productUtils";

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<"name" | "price" | "stock">("name");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
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
  
  const snackbarTimeoutRef = useRef<number | null>(null);

  // Load products on initial render
  useEffect(() => {
    loadProducts();
  }, []);

  // Load products from AsyncStorage
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getProducts();
      setProducts(data);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(
          data
            .filter(product => product.category)
            .map(product => product.category as string)
        )
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error loading products:", error);
      setSnackbarMessage("Failed to load products");
      setSnackbarVisible(true);
    } finally {
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
      const filteredProducts = await searchProducts(text, activeFilter, activeCategory);
      
      // Apply sorting
      const sortedProducts = sortProducts(filteredProducts, sortOrder);
      setProducts(sortedProducts);
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  const sortProducts = (productsToSort: Product[], order: "name" | "price" | "stock") => {
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

  const handleSort = async (order: "name" | "price" | "stock") => {
    setSortOrder(order);
    setShowSortOptions(false);
    
    // Sort current products list
    const sortedProducts = sortProducts(products, order);
    setProducts(sortedProducts);
  };

  const handleFilter = async (filter: "all" | "in_stock" | "low_stock" | "out_of_stock") => {
    setActiveFilter(filter);
    setShowFilterOptions(false);
    
    try {
      const filteredProducts = await searchProducts(searchQuery, filter, activeCategory);
      
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
      const filteredProducts = await searchProducts(searchQuery, activeFilter, category);
      
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
      `Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`,
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
              // Delete product from AsyncStorage
              await deleteProduct(id);
              
              // Update local state
              const updatedProducts = products.filter(product => product.id !== id);
              setProducts(updatedProducts);
              
              // Store the deleted product for potential undo
              if (productToDelete) {
                setDeletedProduct(productToDelete);
              }
              
              // Show snackbar with undo option
              setSnackbarMessage(`Product "${productToDelete?.name}" deleted`);
              setSnackbarVisible(true);
              
              // Clear any existing timeout
              if (snackbarTimeoutRef.current) {
                clearTimeout(snackbarTimeoutRef.current);
              }
              
              // Set timeout to hide snackbar after 5 seconds
              snackbarTimeoutRef.current = setTimeout(() => {
                setSnackbarVisible(false);
                setDeletedProduct(null);
              }, 5000);
            } catch (error) {
              console.error("Error deleting product:", error);
              setSnackbarMessage("Failed to delete product");
              setSnackbarVisible(true);
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
        // Add back the deleted product
        const { id, createdAt, updatedAt, ...productData } = deletedProduct;
        const addedProduct = await addProduct(productData);
        
        // Update local state
        setProducts([...products, addedProduct]);
        
        // Show success message
        setSnackbarMessage("Product restored successfully");
        setSnackbarVisible(true);
      } catch (error) {
        console.error("Error restoring product:", error);
        setSnackbarMessage("Failed to restore product");
        setSnackbarVisible(true);
      }
      
      // Clear the deleted product
      setDeletedProduct(null);
      
      // Clear the timeout
      if (snackbarTimeoutRef.current) {
        clearTimeout(snackbarTimeoutRef.current);
        snackbarTimeoutRef.current = null;
      }
    }
  };

  const handleViewProduct = (id: string) => {
    router.push(`/products/${id}`);
  };

  const handleImport = () => {
    // Implement import functionality
    Alert.alert(
      "Import Products",
      "You can import products from a CSV file. Would you like to proceed?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Import",
          onPress: () => {
            // Show success message
            setSnackbarMessage("Import functionality will be available soon");
            setSnackbarVisible(true);
            
            // Hide snackbar after 3 seconds
            if (snackbarTimeoutRef.current) {
              clearTimeout(snackbarTimeoutRef.current);
            }
            
            snackbarTimeoutRef.current = setTimeout(() => {
              setSnackbarVisible(false);
            }, 3000);
          }
        }
      ]
    );
  };

  const handleExport = () => {
    // Implement export functionality
    Alert.alert(
      "Export Products",
      "You can export products to a CSV file. Would you like to proceed?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Export",
          onPress: () => {
            // Show success message
            setSnackbarMessage("Export functionality will be available soon");
            setSnackbarVisible(true);
            
            // Hide snackbar after 3 seconds
            if (snackbarTimeoutRef.current) {
              clearTimeout(snackbarTimeoutRef.current);
            }
            
            snackbarTimeoutRef.current = setTimeout(() => {
              setSnackbarVisible(false);
            }, 3000);
          }
        }
      ]
    );
  };

  const handleBarcodeScanner = () => {
    Alert.alert(
      "Barcode Scanner",
      "Scan a barcode to quickly find a product",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Scan",
          onPress: () => {
            // Show message
            setSnackbarMessage("Barcode scanner will be available soon");
            setSnackbarVisible(true);
            
            // Hide snackbar after 3 seconds
            if (snackbarTimeoutRef.current) {
              clearTimeout(snackbarTimeoutRef.current);
            }
            
            snackbarTimeoutRef.current = setTimeout(() => {
              setSnackbarVisible(false);
            }, 3000);
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
    if (selectedProducts.length === 0) return;
    
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
          onPress: () => {
            // Filter out the selected products
            setProducts(products.filter(product => !selectedProducts.includes(product.id)));
            
            // Show success message
            setSnackbarMessage(`${selectedProducts.length} products deleted`);
            setSnackbarVisible(true);
            
            // Hide snackbar after 3 seconds
            if (snackbarTimeoutRef.current) {
              clearTimeout(snackbarTimeoutRef.current);
            }
            
            snackbarTimeoutRef.current = setTimeout(() => {
              setSnackbarVisible(false);
            }, 3000);
            
            // Clear selection
            setSelectedProducts([]);
            setIsSelectionMode(false);
          }
        }
      ]
    );
  };

  const handleBulkDuplicate = () => {
    if (selectedProducts.length === 0) return;
    
    // Create duplicates of selected products
    const duplicatedProducts = selectedProducts.map(id => {
      const original = products.find(product => product.id === id);
      if (!original) return null;
      
      return {
        ...original,
        id: `${original.id}-copy-${Date.now()}`,
        name: `${original.name} (Copy)`,
        sku: `${original.sku}-COPY`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }).filter(Boolean) as Product[];
    
    // Add duplicates to products list
    setProducts([...products, ...duplicatedProducts]);
    
    // Show success message
    setSnackbarMessage(`${duplicatedProducts.length} products duplicated`);
    setSnackbarVisible(true);
    
    // Hide snackbar after 3 seconds
    if (snackbarTimeoutRef.current) {
      clearTimeout(snackbarTimeoutRef.current);
    }
    
    snackbarTimeoutRef.current = setTimeout(() => {
      setSnackbarVisible(false);
    }, 3000);
    
    // Clear selection
    setSelectedProducts([]);
    setIsSelectionMode(false);
  };

  // Filter and sort products
  const filterAndSortProducts = async () => {
    try {
      const filteredProducts = await searchProducts(searchQuery, activeFilter, activeCategory);
      const sortedProducts = sortProducts(filteredProducts, sortOrder);
      setProducts(sortedProducts);
    } catch (error) {
      console.error("Error filtering and sorting products:", error);
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    if (viewMode === "grid") {
      return (
        <ProductGridItem
          product={item}
          onPress={() => isSelectionMode ? toggleProductSelection(item.id) : handleViewProduct(item.id)}
          onEdit={() => handleEditProduct(item.id)}
          onDelete={() => handleDeleteProduct(item.id)}
          isSelected={selectedProducts.includes(item.id)}
          isSelectionMode={isSelectionMode}
        />
      );
    } else {
      return (
        <ProductItem
          product={item}
          onPress={() => isSelectionMode ? toggleProductSelection(item.id) : handleViewProduct(item.id)}
          onEdit={() => handleEditProduct(item.id)}
          onDelete={() => handleDeleteProduct(item.id)}
          isSelected={selectedProducts.includes(item.id)}
          isSelectionMode={isSelectionMode}
        />
      );
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Products",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              {isSelectionMode ? (
                <>
                  <Text style={styles.selectedCount}>
                    {selectedProducts.length} selected
                  </Text>
                  <TouchableOpacity 
                    onPress={handleBulkDuplicate}
                    style={styles.headerButton}
                    disabled={selectedProducts.length === 0}
                  >
                    <Copy size={20} color={selectedProducts.length > 0 ? "#333" : "#ccc"} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleBulkDelete}
                    style={styles.headerButton}
                    disabled={selectedProducts.length === 0}
                  >
                    <Trash size={20} color={selectedProducts.length > 0 ? "#ea4335" : "#ccc"} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={toggleSelectionMode}
                    style={styles.headerButton}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    onPress={toggleSelectionMode}
                    style={styles.headerButton}
                  >
                    <CheckSquare size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleBarcodeScanner}
                    style={styles.headerButton}
                  >
                    <Barcode size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={toggleViewMode}
                    style={styles.headerButton}
                  >
                    {viewMode === "list" ? (
                      <Grid size={20} color="#333" />
                    ) : (
                      <List size={20} color="#333" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowFilterOptions(!showFilterOptions)}
                    style={styles.headerButton}
                  >
                    <Filter size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowSortOptions(!showSortOptions)}
                    style={styles.headerButton}
                  >
                    <ArrowUpDown size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleImport}
                    style={styles.headerButton}
                  >
                    <Upload size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleExport}
                    style={styles.headerButton}
                  >
                    <Download size={20} color="#333" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
        }} 
      />
      
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {showFilterOptions && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.optionButton, activeFilter === "all" && styles.activeOptionButton]}
              onPress={() => handleFilter("all")}
            >
              <Text style={[styles.optionText, activeFilter === "all" && styles.activeOptionText]}>
                All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, activeFilter === "in_stock" && styles.activeOptionButton]}
              onPress={() => handleFilter("in_stock")}
            >
              <Text style={[styles.optionText, activeFilter === "in_stock" && styles.activeOptionText]}>
                In Stock
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, activeFilter === "low_stock" && styles.activeOptionButton]}
              onPress={() => handleFilter("low_stock")}
            >
              <Text style={[styles.optionText, activeFilter === "low_stock" && styles.activeOptionText]}>
                Low Stock
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, activeFilter === "out_of_stock" && styles.activeOptionButton]}
              onPress={() => handleFilter("out_of_stock")}
            >
              <Text style={[styles.optionText, activeFilter === "out_of_stock" && styles.activeOptionText]}>
                Out of Stock
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {showSortOptions && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.optionButton, sortOrder === "name" && styles.activeOptionButton]}
              onPress={() => handleSort("name")}
            >
              <Text style={[styles.optionText, sortOrder === "name" && styles.activeOptionText]}>
                Name
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, sortOrder === "price" && styles.activeOptionButton]}
              onPress={() => handleSort("price")}
            >
              <Text style={[styles.optionText, sortOrder === "price" && styles.activeOptionText]}>
                Price
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, sortOrder === "stock" && styles.activeOptionButton]}
              onPress={() => handleSort("stock")}
            >
              <Text style={[styles.optionText, sortOrder === "stock" && styles.activeOptionText]}>
                Stock
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Category filter chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsContainer}
        >
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryChip,
                activeCategory === category && styles.activeCategoryChip
              ]}
              onPress={() => handleCategoryFilter(category)}
            >
              <Text 
                style={[
                  styles.categoryChipText,
                  activeCategory === category && styles.activeCategoryChipText
                ]}
              >
                {category === "all" ? "All Categories" : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {products.filter(p => p.status === "in_stock").length}
            </Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {products.filter(p => p.status === "low_stock").length}
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {products.filter(p => p.status === "out_of_stock").length}
            </Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={viewMode === "grid" ? 2 : 1}
            key={viewMode} // Force re-render when view mode changes
            contentContainerStyle={[
              styles.listContent,
              viewMode === "grid" && styles.gridContent,
              products.length === 0 && styles.emptyListContent
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                title="No products found"
                description="Add your first product by clicking the + button below"
                icon="package"
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
          onActionPress={deletedProduct ? handleUndoDelete : undefined}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerButton: {
    padding: 8,
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedCount: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#666",
  },
  optionsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    borderRadius: 4,
  },
  activeOptionButton: {
    backgroundColor: `${Colors.primary}10`,
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  activeOptionText: {
    color: Colors.primary,
    fontWeight: "500",
  },
  categoryChipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  categoryChip: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeCategoryChip: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    color: "#333",
  },
  activeCategoryChipText: {
    color: "#fff",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  gridContent: {
    paddingHorizontal: 8,
  },
  emptyListContent: {
    flexGrow: 1,
  },
});