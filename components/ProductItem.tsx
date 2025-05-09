import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { Edit, Trash, MoreVertical, CheckSquare, Square } from "lucide-react-native";

import { Product } from "@/types/product";
import { formatCurrency } from "@/utils/formatters";
import SwipeableActions from "@/components/SwipeableActions";

interface ProductItemProps {
  product: Product;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
}

export default function ProductItem({ 
  product, 
  onPress, 
  onEdit, 
  onDelete, 
  isSelected = false,
  isSelectionMode = false
}: ProductItemProps) {
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

  return (
    <SwipeableActions
      leftActions={[
        {
          text: "Edit",
          icon: <Edit size={20} color="#fff" />,
          backgroundColor: "#1a73e8",
          onPress: onEdit,
        }
      ]}
      rightActions={[
        {
          text: "Delete",
          icon: <Trash size={20} color="#fff" />,
          backgroundColor: "#ea4335",
          onPress: onDelete,
          requiresConfirmation: true,
          confirmationMessage: `Are you sure you want to delete "${product.name}"?`
        }
      ]}
      enabled={!isSelectionMode}
    >
      <TouchableOpacity
        style={[
          styles.container,
          isSelected && styles.selectedContainer
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {isSelectionMode && (
          <View style={styles.checkboxContainer}>
            {isSelected ? (
              <CheckSquare size={20} color="#1a73e8" />
            ) : (
              <Square size={20} color="#999" />
            )}
          </View>
        )}
        
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.images?.[0] || defaultImage }} 
            style={styles.image}
          />
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.sku}>SKU: {product.sku}</Text>
          
          <View style={styles.detailsRow}>
            <Text style={styles.price}>{formatCurrency(product.sellingPrice)}</Text>
            <Text style={styles.stock}>Stock: {product.stockQuantity} {product.unit}</Text>
          </View>
          
          <View style={styles.categoryRow}>
            {product.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.category}</Text>
              </View>
            )}
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: `${getStockStatusColor(product.status)}20` }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStockStatusColor(product.status) }
              ]}>
                {getStockStatusText(product.status)}
              </Text>
            </View>
          </View>
        </View>
        
        {!isSelectionMode && (
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => {
              // Show context menu with options
              // This would typically be implemented with a modal or action sheet
              // For simplicity, we'll just call the edit function directly
              onEdit();
            }}
          >
            <MoreVertical size={20} color="#666" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </SwipeableActions>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedContainer: {
    backgroundColor: "#e8f0fe",
    borderWidth: 1,
    borderColor: "#1a73e8",
  },
  checkboxContainer: {
    justifyContent: "center",
    marginRight: 8,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  sku: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  stock: {
    fontSize: 12,
    color: "#666",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryBadge: {
    backgroundColor: "#1a73e810",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#1a73e8",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  moreButton: {
    justifyContent: "center",
    paddingLeft: 8,
  },
});