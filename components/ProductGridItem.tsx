import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { Edit, Trash, MoreVertical, CheckSquare, Square } from "lucide-react-native";

import { Product } from "@/types/product";
import { formatCurrency } from "@/utils/formatters";

interface ProductGridItemProps {
  product: Product;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
}

export default function ProductGridItem({ 
  product, 
  onPress, 
  onEdit, 
  onDelete,
  isSelected = false,
  isSelectionMode = false
}: ProductGridItemProps) {
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
        return status.toUpperCase().replace('_', ' ');
    }
  };

  // Default image if none provided
  const defaultImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30";

  const handleLongPress = () => {
    // Show context menu with options
    // This would typically be implemented with a modal or action sheet
    // For simplicity, we'll just call the edit function directly
    onEdit();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer
      ]}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      {isSelectionMode && (
        <View style={styles.checkboxContainer}>
          {isSelected ? (
            <CheckSquare size={20} color="#1a73e8" />
          ) : (
            <Square size={20} color="#fff" />
          )}
        </View>
      )}
      
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: product.images?.[0] || defaultImage }} 
          style={styles.image}
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
      
      <View style={styles.productInfo}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.sku}>SKU: {product.sku}</Text>
        <Text style={styles.price}>{formatCurrency(product.sellingPrice)}</Text>
        <Text style={styles.stock}>Stock: {product.stockQuantity} {product.unit}</Text>
      </View>
      
      {!isSelectionMode && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onEdit}
          >
            <Edit size={16} color="#1a73e8" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onDelete}
          >
            <Trash size={16} color="#ea4335" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 8,
    width: "46%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: "hidden",
  },
  selectedContainer: {
    backgroundColor: "#e8f0fe",
    borderWidth: 1,
    borderColor: "#1a73e8",
  },
  checkboxContainer: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 4,
    padding: 2,
  },
  imageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#fff",
  },
  productInfo: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
    height: 40,
  },
  sku: {
    fontSize: 10,
    color: "#666",
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  stock: {
    fontSize: 10,
    color: "#666",
  },
  actionsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#f0f0f0",
  },
});