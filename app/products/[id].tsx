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
  useWindowDimensions,
  StatusBar,
  Share,
  Platform
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
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
  AlertCircle,
  DollarSign,
  Share2,
  MoreVertical,
  ShoppingBag,
  BookOpen,
  Clipboard,
  BarChart2,
  TrendingUp,
  Box
} from "lucide-react-native";
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as dbProduct from '@/db/product';
import * as schema from '@/db/schema';
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { formatCurrency, formatDate } from "@/utils/formatters";
import SnackBar from "@/components/SnackBar";
import { Product, StockStatus } from '@/types/product';

// Mock product data for demonstration
const mockProducts: { [key: string]: Product } = {
  '1': {
    id: '1',
    name: 'Laptop Computer',
    sku: 'LAP-10001',
    barcode: '8901234567890',
    description: 'High-performance laptop with SSD storage and dedicated graphics',
    category: 'Electronics',
    sellingPrice: 1299.99,
    purchasePrice: 899.99,
    stockQuantity: 24,
    reorderLevel: 5,
    unit: 'piece',
    status: 'in_stock',
    taxRate: 10,
    vendor: 'TechSuppliers Inc.',
    location: 'Warehouse A',
    dimensions: {
      weight: 2.5,
      length: 35,
      width: 25,
      height: 2
    },
    tags: ['electronics', 'computer', 'laptop'],
    images: [],
    notes: 'Popular item during back-to-school season',
    createdAt: new Date('2023-06-12'),
    updatedAt: new Date('2023-10-01')
  },
  '2': {
    id: '2',
    name: 'Office Desk Chair',
    sku: 'CHR-20050',
    barcode: '7890123456789',
    description: 'Ergonomic office chair with adjustable height and lumbar support',
    category: 'Furniture',
    sellingPrice: 249.99,
    purchasePrice: 149.99,
    stockQuantity: 15,
    reorderLevel: 3,
    unit: 'piece',
    status: 'in_stock',
    taxRate: 8,
    vendor: 'FurniturePlus',
    location: 'Warehouse B',
    dimensions: {
      weight: 15,
      length: 60,
      width: 60,
      height: 120
    },
    tags: ['furniture', 'office', 'chair'],
    images: [],
    notes: 'Available in black and gray',
    createdAt: new Date('2023-05-20'),
    updatedAt: new Date('2023-09-15')
  },
  '3': {
    id: '3',
    name: 'Smartphone',
    sku: 'PHN-30200',
    barcode: '6789012345678',
    description: '5G smartphone with high-resolution camera and fast charging',
    category: 'Electronics',
    sellingPrice: 899.99,
    purchasePrice: 599.99,
    stockQuantity: 42,
    reorderLevel: 10,
    unit: 'piece',
    status: 'in_stock',
    taxRate: 10,
    vendor: 'MobileTech Distributors',
    location: 'Warehouse A',
    dimensions: {
      weight: 0.18,
      length: 15,
      width: 7,
      height: 0.8
    },
    tags: ['electronics', 'phone', 'mobile'],
    images: [],
    notes: 'High demand item during holiday season',
    createdAt: new Date('2023-07-05'),
    updatedAt: new Date('2023-10-10')
  },
  '4': {
    id: '4',
    name: 'Wireless Headphones',
    sku: 'AUD-40075',
    barcode: '5678901234567',
    description: 'Noise-cancelling wireless headphones with long battery life',
    category: 'Audio',
    sellingPrice: 199.99,
    purchasePrice: 119.99,
    stockQuantity: 38,
    reorderLevel: 8,
    unit: 'piece',
    status: 'in_stock',
    taxRate: 10,
    vendor: 'AudioPlus Supplies',
    location: 'Warehouse A',
    dimensions: {
      weight: 0.3,
      length: 18,
      width: 16,
      height: 8
    },
    tags: ['electronics', 'audio', 'headphones'],
    images: [],
    notes: 'Available in multiple colors',
    createdAt: new Date('2023-04-15'),
    updatedAt: new Date('2023-08-20')
  },
  '5': {
    id: '5',
    name: 'Coffee Maker',
    sku: 'KIT-50100',
    barcode: '4567890123456',
    description: 'Programmable coffee maker with thermal carafe',
    category: 'Kitchen Appliances',
    sellingPrice: 129.99,
    purchasePrice: 79.99,
    stockQuantity: 25,
    reorderLevel: 5,
    unit: 'piece',
    status: 'in_stock',
    taxRate: 8,
    vendor: 'HomeGoods Supply',
    location: 'Warehouse B',
    dimensions: {
      weight: 5,
      length: 25,
      width: 20,
      height: 35
    },
    tags: ['appliances', 'kitchen', 'coffee'],
    images: [],
    notes: 'Bestseller in kitchen category',
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-09-05')
  }
};

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { width } = useWindowDimensions();
  const [showOptions, setShowOptions] = useState(false);
  
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
      const dbProductData = await dbProduct.getProductById(Number(id));
      
      if (dbProductData) {
        setProduct({
          id: dbProductData.id.toString(),
          name: dbProductData.productName,
          sku: dbProductData.sku,
          barcode: dbProductData.barcode || undefined,
          description: dbProductData.fullDescription || undefined,
          category: dbProductData.category || undefined,
          tags: dbProductData.tags ? dbProductData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          purchasePrice: dbProductData.costPrice || 0,
          sellingPrice: dbProductData.sellingPrice || 0,
          stockQuantity: dbProductData.stockQuantity || 0,
          reorderLevel: dbProductData.reorderLevel || 0,
          unit: dbProductData.unit || 'piece',
          taxRate: dbProductData.taxRate || undefined,
          images: dbProductData.images ? dbProductData.images.split(',').map(i => i.trim()).filter(Boolean) : [],
          vendor: dbProductData.vendor || undefined,
          location: dbProductData.location || undefined,
          dimensions: {
            length: dbProductData.length || undefined,
            width: dbProductData.width || undefined,
            height: dbProductData.height || undefined,
            weight: dbProductData.weight || undefined,
          },
          status: getStockStatus(dbProductData.stockQuantity || 0, dbProductData.reorderLevel || 0, Boolean(dbProductData.isActive)),
          createdAt: dbProductData.createdAt ? new Date(dbProductData.createdAt) : new Date(),
          updatedAt: dbProductData.updatedAt ? new Date(dbProductData.updatedAt) : new Date(),
          notes: dbProductData.notes || undefined,
        });
      } else {
        console.error("Product not found");
        setSnackbarMessage("Failed to load product details");
        setSnackbarVisible(true);
      }
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
              await dbProduct.deleteProduct(Number(id));
              showSnackbar("Product deleted successfully");
              setTimeout(() => {
                router.replace("/products");
              }, 500);
            } catch (error) {
              console.error("Error deleting product:", error);
              showSnackbar("Failed to delete product");
            } finally {
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
                
                // Update product in mock data instead of AsyncStorage
                const updatedProduct = {
                  ...product,
                  stockQuantity: newStockQuantity,
                  status: newStatus,
                  updatedAt: new Date()
                };
                
                // Simulate update
                setTimeout(() => {
                  // Update state with the updated product
                  setProduct(updatedProduct);
                  
                  showSnackbar(`Stock updated by ${parsedQuantity > 0 ? '+' : ''}${parsedQuantity}`);
                }, 300);
              }
            } catch (error) {
              console.error("Error adjusting stock:", error);
              showSnackbar("Failed to adjust stock");
            }
          }
        }
      ]
    );
  };
  
  const handlePrintBarcode = () => {
    Alert.alert("Print Barcode", "Barcode printing functionality will be available soon.");
  };

  const handleShare = async () => {
    if (!product) return;
    
    try {
      const productInfo = `
Product: ${product.name}
SKU: ${product.sku}
Price: ${formatCurrency(product.sellingPrice)}
Stock: ${product.stockQuantity} ${product.unit || 'units'}
${product.description ? `Description: ${product.description}` : ''}
      `.trim();
      
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        await Share.share({
          message: productInfo,
          title: `Product: ${product.name}`
        });
      } else {
        // For web or other platforms
        Alert.alert(
          "Share Product",
          "Copy this information to share:",
          [
            {
              text: "OK",
              onPress: () => {
                // In a real app, this would copy to clipboard
                console.log(productInfo);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("Error sharing product:", error);
      showSnackbar("Failed to share product");
    }
  };
  
  const getStockStatus = (quantity: number, reorderLevel: number, isActive: boolean): StockStatus => {
    if (!isActive) return 'discontinued';
    if (quantity <= 0) return 'out_of_stock';
    if (quantity <= reorderLevel) return 'low_stock';
    return 'in_stock';
  };
  
  const getStockStatusColor = (status: StockStatus) => {
    switch (status) {
      case 'in_stock':
        return Colors.status.active;
      case 'low_stock':
        return Colors.status.pending;
      case 'out_of_stock':
        return Colors.status.blocked;
      case 'discontinued':
        return Colors.negative;
      default:
        return Colors.text.tertiary;
    }
  };
  
  const getStockStatusText = (status: StockStatus) => {
    switch (status) {
      case 'in_stock':
        return 'IN STOCK';
      case 'low_stock':
        return 'LOW STOCK';
      case 'out_of_stock':
        return 'OUT OF STOCK';
      case 'discontinued':
        return 'DISCONTINUED';
      default:
        return 'UNKNOWN';
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
    setTimeout(() => {
      setSnackbarVisible(false);
    }, 3000);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <AlertCircle size={48} color={Colors.negative} />
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <Text style={styles.errorMessage}>
          The product you're looking for could not be found or may have been deleted.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/products")}
        >
          <Text style={styles.backButtonText}>Back to Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Share2 size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowOptions(!showOptions)}
          >
            <MoreVertical size={22} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Options Menu */}
        {showOptions && (
          <View style={styles.optionsMenu}>
            <TouchableOpacity 
              style={styles.optionItem} 
              onPress={() => {
                setShowOptions(false);
                handleEdit();
              }}
            >
              <Edit size={20} color={Colors.text.primary} />
              <Text style={styles.optionText}>Edit Product</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionItem} 
              onPress={() => {
                setShowOptions(false);
                handlePrintBarcode();
              }}
            >
              <Printer size={20} color={Colors.text.primary} />
              <Text style={styles.optionText}>Print Barcode</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionItem} 
              onPress={() => {
                setShowOptions(false);
                handleAdjustStock();
              }}
            >
              <Package size={20} color={Colors.text.primary} />
              <Text style={styles.optionText}>Adjust Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.optionItem, styles.deleteOption]} 
              onPress={() => {
                setShowOptions(false);
                handleDelete();
              }}
            >
              <Trash2 size={20} color={Colors.negative} />
              <Text style={[styles.optionText, styles.deleteText]}>Delete Product</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Overview Card */}
        <View style={styles.card}>
          <View style={styles.productHeader}>
            <View style={styles.productImageContainer}>
              {product.images && product.images.length > 0 ? (
                <Image 
                  source={{ uri: product.images[0] }} 
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Package size={40} color={Colors.text.tertiary} />
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.productMeta}>
                <View style={styles.skuContainer}>
                  <Text style={styles.skuLabel}>SKU:</Text>
                  <Text style={styles.skuValue}>{product.sku}</Text>
                </View>
                {product.barcode && (
                  <View style={styles.barcodeContainer}>
                    <Text style={styles.barcodeLabel}>Barcode:</Text>
                    <Text style={styles.barcodeValue}>{product.barcode}</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceStockRow}>
                <View style={styles.priceContainer}>
                  <DollarSign size={16} color={Colors.primary} />
                  <Text style={styles.priceValue}>
                    {formatCurrency(product.sellingPrice)}
                  </Text>
                </View>
                <View style={[
                  styles.stockBadge, 
                  { backgroundColor: `${getStockStatusColor(product.status)}15` }
                ]}>
                  <Text style={[
                    styles.stockBadgeText, 
                    { color: getStockStatusColor(product.status) }
                  ]}>
                    {getStockStatusText(product.status)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}
          
          {product.category && (
            <View style={styles.tagContainer}>
              <Tag size={16} color={Colors.text.secondary} style={styles.tagIcon} />
              <Text style={styles.tagText}>{product.category}</Text>
            </View>
          )}
        </View>
        
        {/* Stock Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ShoppingBag size={20} color={Colors.text.primary} />
            <Text style={styles.cardTitle}>Stock Information</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Stock:</Text>
              <Text style={styles.infoValue}>
                {product.stockQuantity} {product.unit || 'units'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reorder Level:</Text>
              <Text style={styles.infoValue}>
                {product.reorderLevel || 0} {product.unit || 'units'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Measurement Unit:</Text>
              <Text style={styles.infoValue}>{product.unit || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{product.location || 'N/A'}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.adjustStockButton}
              onPress={handleAdjustStock}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.adjustStockButtonText}>Adjust Stock</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Pricing Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <DollarSign size={20} color={Colors.text.primary} />
            <Text style={styles.cardTitle}>Pricing</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cost Price:</Text>
              <Text style={styles.infoValue}>{formatCurrency(product.purchasePrice || 0)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Selling Price:</Text>
              <Text style={[styles.infoValue, styles.sellingPriceValue]}>
                {formatCurrency(product.sellingPrice)}
              </Text>
            </View>
            
            {product.purchasePrice && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Profit Margin:</Text>
                <Text style={[
                  styles.infoValue,
                  { color: Colors.status.active }
                ]}>
                  {Math.round(((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100)}%
                </Text>
              </View>
            )}
            
            {product.taxRate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tax Rate:</Text>
                <Text style={styles.infoValue}>{product.taxRate}%</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Stock Movement Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TrendingUp size={20} color={Colors.text.primary} />
            <Text style={styles.cardTitle}>Recent Stock Movements</Text>
          </View>
          
          <View style={styles.cardContent}>
            {stockMovements.length > 0 ? (
              <View style={styles.movementsContainer}>
                <View style={styles.movementsHeader}>
                  <Text style={styles.movementHeaderDate}>Date</Text>
                  <Text style={styles.movementHeaderType}>Type</Text>
                  <Text style={styles.movementHeaderQuantity}>Qty</Text>
                  <Text style={styles.movementHeaderBalance}>Balance</Text>
                </View>
                
                {stockMovements.map((movement) => (
                  <View key={movement.id} style={styles.movementRow}>
                    <Text style={styles.movementDate}>{formatDate(movement.date)}</Text>
                    <Text style={styles.movementType}>
                      {movement.type.charAt(0).toUpperCase() + movement.type.slice(1)}
                    </Text>
                    <Text style={[
                      styles.movementQuantity,
                      { 
                        color: movement.quantity > 0 
                          ? Colors.status.active 
                          : Colors.negative 
                      }
                    ]}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </Text>
                    <Text style={styles.movementBalance}>{movement.balance}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Box size={32} color={Colors.text.tertiary} />
                <Text style={styles.emptyStateText}>No stock movements recorded yet</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Additional Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Info size={20} color={Colors.text.primary} />
            <Text style={styles.cardTitle}>Additional Details</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weight:</Text>
              <Text style={styles.infoValue}>
                {product.dimensions?.weight ? `${product.dimensions.weight} kg` : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dimensions:</Text>
              <Text style={styles.infoValue}>
                {product.dimensions ? 
                  `${product.dimensions.length || 0} × ${product.dimensions.width || 0} × ${product.dimensions.height || 0} cm` 
                  : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vendor:</Text>
              <Text style={styles.infoValue}>{product.vendor || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date Added:</Text>
              <Text style={styles.infoValue}>
                {product.createdAt ? formatDate(new Date(product.createdAt)) : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoValue}>
                {product.updatedAt ? formatDate(new Date(product.updatedAt)) : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Action buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEdit}
        >
          <Edit size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Trash2 size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <SnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background.default,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
  },
  optionsMenu: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: Colors.background.default,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  deleteOption: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    marginTop: 8,
    paddingTop: 12,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 12,
  },
  deleteText: {
    color: Colors.negative,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.background.tertiary,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  productMeta: {
    marginBottom: 8,
  },
  skuContainer: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  skuLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginRight: 4,
  },
  skuValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  barcodeContainer: {
    flexDirection: 'row',
  },
  barcodeLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginRight: 4,
  },
  barcodeValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 4,
  },
  stockBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  tagIcon: {
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  cardContent: {
    
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  sellingPriceValue: {
    color: Colors.primary,
    fontWeight: '600',
  },
  adjustStockButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  adjustStockButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  movementsContainer: {
    marginTop: 8,
  },
  movementsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    paddingBottom: 8,
    marginBottom: 8,
  },
  movementHeaderDate: {
    flex: 2,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  movementHeaderType: {
    flex: 2,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  movementHeaderQuantity: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'right',
  },
  movementHeaderBalance: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'right',
  },
  movementRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  movementDate: {
    flex: 2,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  movementType: {
    flex: 2,
    fontSize: 14,
    color: Colors.text.primary,
  },
  movementQuantity: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  movementBalance: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: 8,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  editButton: {
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: Colors.negative,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});