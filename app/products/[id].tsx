import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  ActivityIndicator,
  useWindowDimensions
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Package, 
  Tag, 
  Truck, 
  Printer,
  BarChart,
  Plus,
  Minus,
  ShoppingCart,
  Calendar,
  Clock,
  MapPin,
  Info,
  AlertCircle
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { formatCurrency, formatDate } from "@/utils/formatters";
import SnackBar from "@/components/SnackBar";
import { getProductById, updateProduct, deleteProduct } from "@/utils/asyncStorageUtils";
import { Product } from "@/types/product";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { width } = useWindowDimensions();
  
  // Mock stock movement data - in a real app, this would come from the database
  const stockMovements = [
    { 
      id: "sm1", 
      date: new Date(2023, 9, 15), 
      type: "purchase", 
      reference: "PO-1001", 
      quantity: 50, 
      balance: 50 
    },
    { 
      id: "sm2", 
      date: new Date(2023, 9, 20), 
      type: "sale", 
      reference: "INV-2001", 
      quantity: -10, 
      balance: 40 
    },
    { 
      id: "sm3", 
      date: new Date(2023, 9, 25), 
      type: "adjustment", 
      reference: "ADJ-101", 
      quantity: -2, 
      balance: 38 
    },
    { 
      id: "sm4", 
      date: new Date(2023, 10, 5), 
      type: "purchase", 
      reference: "PO-1015", 
      quantity: 25, 
      balance: 63 
    },
    { 
      id: "sm5", 
      date: new Date(2023, 10, 12), 
      type: "sale", 
      reference: "INV-2025", 
      quantity: -15, 
      balance: 48 
    }
  ];
  
  // Mock sales data for chart - in a real app, this would come from the database
  const salesData = [
    { month: "Jan", quantity: 12 },
    { month: "Feb", quantity: 18 },
    { month: "Mar", quantity: 15 },
    { month: "Apr", quantity: 22 },
    { month: "May", quantity: 28 },
    { month: "Jun", quantity: 32 }
  ];
  
  useEffect(() => {
    loadProductData();
  }, [id]);
  
  const loadProductData = async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const productData = await getProductById(id);
      setProduct(productData);
    } catch (error) {
      console.error("Error loading product:", error);
      setSnackbarMessage("Failed to load product details");
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = () => {
    router.push(`/products/edit/${id}`);
  };
  
  const handleDelete = async () => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product?.name}"? This action cannot be undone.`,
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
              await deleteProduct(id);
              setSnackbarMessage("Product deleted successfully");
              setSnackbarVisible(true);
              
              // Navigate back after a short delay
              setTimeout(() => {
                router.replace("/products");
              }, 1000);
            } catch (error) {
              console.error("Error deleting product:", error);
              setSnackbarMessage("Failed to delete product");
              setSnackbarVisible(true);
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };
  
  const handleAdjustStock = () => {
    Alert.prompt(
      "Adjust Stock",
      "Enter the quantity to add or subtract:",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Adjust",
          onPress: async (quantity) => {
            if (!quantity) return;
            
            const parsedQuantity = parseInt(quantity);
            if (isNaN(parsedQuantity)) {
              Alert.alert("Invalid Quantity", "Please enter a valid number");
              return;
            }
            
            try {
              if (product) {
                const newStockQuantity = product.stockQuantity + parsedQuantity;
                
                // Determine new status based on stock level
                let newStatus = product.status;
                if (newStockQuantity <= 0) {
                  newStatus = "out_of_stock";
                } else if (newStockQuantity <= product.reorderLevel) {
                  newStatus = "low_stock";
                } else {
                  newStatus = "in_stock";
                }
                
                // Update product in AsyncStorage
                const updatedProduct = await updateProduct(id, {
                  stockQuantity: newStockQuantity,
                  status: newStatus
                });
                
                if (updatedProduct) {
                  setProduct(updatedProduct);
                  setSnackbarMessage(`Stock adjusted by ${parsedQuantity > 0 ? '+' : ''}${parsedQuantity}`);
                  setSnackbarVisible(true);
                }
              }
            } catch (error) {
              console.error("Error adjusting stock:", error);
              setSnackbarMessage("Failed to adjust stock");
              setSnackbarVisible(true);
            }
          }
        }
      ],
      "plain-text",
      "0"
    );
  };
  
  const handlePrintBarcode = () => {
    setSnackbarMessage("Barcode printing will be available soon");
    setSnackbarVisible(true);
  };
  
  const getStockStatusColor = (status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued') => {
    switch (status) {
      case 'in_stock':
        return '#34a853';
      case 'low_stock':
        return '#fbbc04';
      case 'out_of_stock':
        return '#ea4335';
      case 'discontinued':
        return '#9e9e9e';
      default:
        return '#999';
    }
  };

  const getStockStatusText = (status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued') => {
    // Explicitly handle each possible status value
    if (status === 'in_stock') return 'IN STOCK';
    if (status === 'low_stock') return 'LOW STOCK';
    if (status === 'out_of_stock') return 'OUT OF STOCK';
    if (status === 'discontinued') return 'DISCONTINUED';
    
    // Default fallback - should never happen with the typed parameter
    return 'UNKNOWN';
  };
  
  // Calculate profit margin only if product exists
  const profitMargin = product ? ((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100 : 0;
  
  // Default image if none provided
  const defaultImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30";
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }
  
  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: "Product Details",
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
              <TouchableOpacity 
                onPress={handleEdit}
                style={styles.headerButton}
              >
                <Edit size={20} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleDelete}
                style={styles.headerButton}
              >
                <Trash size={20} color="#ea4335" />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView style={styles.container}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.images?.[0] || defaultImage }} 
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStockStatusColor(product.status) }
          ]}>
            <Text style={styles.statusText}>
              {getStockStatusText(product.status)}
            </Text>
          </View>
        </View>
        
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SKU:</Text>
            <Text style={styles.infoValue}>{product.sku}</Text>
          </View>
          {product.barcode && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Barcode:</Text>
              <Text style={styles.infoValue}>{product.barcode}</Text>
            </View>
          )}
          {product.category && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category:</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.category}</Text>
              </View>
            </View>
          )}
          {product.vendor && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vendor:</Text>
              <Text style={styles.infoValue}>{product.vendor}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{formatDate(product.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>{formatDate(product.updatedAt)}</Text>
          </View>
        </View>
        
        {/* Pricing Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Tag size={18} color="#333" />
            <Text style={styles.sectionTitle}>Pricing</Text>
          </View>
          
          <View style={styles.priceContainer}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Selling Price</Text>
              <Text style={styles.priceValue}>{formatCurrency(product.sellingPrice)}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Cost Price</Text>
              <Text style={styles.priceValue}>{formatCurrency(product.purchasePrice)}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Profit Margin</Text>
              <Text style={styles.priceValue}>{profitMargin.toFixed(2)}%</Text>
            </View>
          </View>
          
          {product.taxRate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tax Rate:</Text>
              <Text style={styles.infoValue}>{product.taxRate}%</Text>
            </View>
          )}
        </View>
        
        {/* Inventory Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={18} color="#333" />
            <Text style={styles.sectionTitle}>Inventory</Text>
          </View>
          
          <View style={styles.inventoryContainer}>
            <View style={styles.inventoryItem}>
              <Text style={styles.inventoryLabel}>Current Stock</Text>
              <Text style={[
                styles.inventoryValue,
                { color: getStockStatusColor(product.status) }
              ]}>
                {product.stockQuantity} {product.unit}
              </Text>
            </View>
            <View style={styles.inventoryItem}>
              <Text style={styles.inventoryLabel}>Reorder Level</Text>
              <Text style={styles.inventoryValue}>{product.reorderLevel} {product.unit}</Text>
            </View>
          </View>
          
          {product.location && (
            <View style={styles.infoRow}>
              <MapPin size={16} color="#666" style={styles.infoIcon} />
              <Text style={styles.infoValue}>{product.location}</Text>
            </View>
          )}
          
          {product.expiryDate && (
            <View style={styles.infoRow}>
              <Calendar size={16} color="#666" style={styles.infoIcon} />
              <Text style={styles.infoValue}>Expires: {formatDate(product.expiryDate)}</Text>
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleAdjustStock}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Adjust Stock</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handlePrintBarcode}
          >
            <Printer size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Print Barcode</Text>
          </TouchableOpacity>
        </View>
        
        {/* Product Description */}
        {product.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Info size={18} color="#333" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}
        
        {/* Product Dimensions */}
        {product.dimensions && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={18} color="#333" />
              <Text style={styles.sectionTitle}>Dimensions</Text>
            </View>
            
            <View style={styles.dimensionsContainer}>
              {product.dimensions.length && (
                <View style={styles.dimensionItem}>
                  <Text style={styles.dimensionLabel}>Length</Text>
                  <Text style={styles.dimensionValue}>{product.dimensions.length} cm</Text>
                </View>
              )}
              
              {product.dimensions.width && (
                <View style={styles.dimensionItem}>
                  <Text style={styles.dimensionLabel}>Width</Text>
                  <Text style={styles.dimensionValue}>{product.dimensions.width} cm</Text>
                </View>
              )}
              
              {product.dimensions.height && (
                <View style={styles.dimensionItem}>
                  <Text style={styles.dimensionLabel}>Height</Text>
                  <Text style={styles.dimensionValue}>{product.dimensions.height} cm</Text>
                </View>
              )}
              
              {product.dimensions.weight && (
                <View style={styles.dimensionItem}>
                  <Text style={styles.dimensionLabel}>Weight</Text>
                  <Text style={styles.dimensionValue}>{product.dimensions.weight} kg</Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Stock Movement History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color="#333" />
            <Text style={styles.sectionTitle}>Stock Movement History</Text>
          </View>
          
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Date</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Type</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Reference</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Balance</Text>
          </View>
          
          {stockMovements.map((movement) => (
            <View key={movement.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{formatDate(movement.date)}</Text>
              <Text style={[styles.tableCell, { flex: 2, textTransform: "capitalize" }]}>{movement.type}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{movement.reference}</Text>
              <Text style={[
                styles.tableCell, 
                { 
                  flex: 1, 
                  textAlign: "right",
                  color: movement.quantity > 0 ? "#34a853" : "#ea4335"
                }
              ]}>
                {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{movement.balance}</Text>
            </View>
          ))}
        </View>
        
        {/* Sales Statistics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart size={18} color="#333" />
            <Text style={styles.sectionTitle}>Sales Statistics</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>127</Text>
              <Text style={styles.statLabel}>Total Sold</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(127 * product.sellingPrice)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>32</Text>
              <Text style={styles.statLabel}>Last 30 Days</Text>
            </View>
          </View>
          
          {/* Simple bar chart visualization */}
          <View style={styles.chartContainer}>
            {salesData.map((data, index) => (
              <View key={index} style={styles.chartColumn}>
                <View 
                  style={[
                    styles.chartBar, 
                    { height: data.quantity * 3 }
                  ]} 
                />
                <Text style={styles.chartLabel}>{data.month}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Notes */}
        {product.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Info size={18} color="#333" />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <Text style={styles.notes}>{product.notes}</Text>
          </View>
        )}
        
        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Tag size={18} color="#333" />
              <Text style={styles.sectionTitle}>Tags</Text>
            </View>
            <View style={styles.tagsContainer}>
              {product.tags.map((tag, index) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
      
      {isDeleting && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.deletingText}>Deleting product...</Text>
        </View>
      )}
      
      <SnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  imageContainer: {
    width: "100%",
    height: 250,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  infoIcon: {
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: "#1a73e810",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1a73e8",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  priceItem: {
    flex: 1,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  inventoryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  inventoryItem: {
    alignItems: "center",
  },
  inventoryLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  inventoryValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 16,
    marginBottom: 0,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  dimensionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dimensionItem: {
    width: "50%",
    marginBottom: 12,
  },
  dimensionLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  dimensionValue: {
    fontSize: 14,
    color: "#333",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableCell: {
    fontSize: 14,
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
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
  chartContainer: {
    height: 150,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 16,
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
  },
  chartBar: {
    width: 20,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  notes: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#666",
  },
  deletingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  deletingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  loadingText: {
    color: "#666",
    fontSize: 16,
    marginTop: 16,
  },
});