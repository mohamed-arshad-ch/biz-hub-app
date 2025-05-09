import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Edit, Trash, Mail, Phone, Globe, CheckCircle } from "lucide-react-native";

import { Vendor } from "@/types/vendor";
import { formatCurrency } from "@/utils/formatters";
import SwipeableActions from "@/components/SwipeableActions";

interface VendorItemProps {
  vendor: Vendor;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  selectionMode?: boolean;
}

export default function VendorItem({ 
  vendor, 
  onPress, 
  onEdit, 
  onDelete, 
  isSelected = false,
  selectionMode = false
}: VendorItemProps) {
  const getStatusColor = (status: 'active' | 'inactive' | 'blocked') => {
    switch (status) {
      case 'active':
        return '#34a853';
      case 'inactive':
        return '#fbbc04';
      case 'blocked':
        return '#ea4335';
      default:
        return '#999';
    }
  };

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
          confirmationMessage: `Are you sure you want to delete ${vendor.name}?`
        }
      ]}
      enabled={!selectionMode}
    >
      <TouchableOpacity
        style={[
          styles.container, 
          selectionMode && styles.selectionModeContainer,
          isSelected && styles.selectedContainer
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {selectionMode && (
          <View style={[styles.checkbox, isSelected && styles.checkedCheckbox]}>
            {isSelected && <CheckCircle size={20} color="#fff" />}
          </View>
        )}
        
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>{vendor.name.charAt(0)}</Text>
        </View>
        
        <View style={styles.vendorInfo}>
          <Text style={styles.name}>{vendor.name}</Text>
          
          <Text style={styles.company}>{vendor.company}</Text>
          
          <View style={styles.contactRow}>
            {vendor.email && (
              <View style={styles.contactItem}>
                <Mail size={12} color="#666" style={styles.contactIcon} />
                <Text style={styles.contactText} numberOfLines={1}>{vendor.email}</Text>
              </View>
            )}
            
            {vendor.phone && (
              <View style={styles.contactItem}>
                <Phone size={12} color="#666" style={styles.contactIcon} />
                <Text style={styles.contactText}>{vendor.phone}</Text>
              </View>
            )}
            
            {vendor.website && (
              <View style={styles.contactItem}>
                <Globe size={12} color="#666" style={styles.contactIcon} />
                <Text style={styles.contactText} numberOfLines={1}>{vendor.website}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.vendorMeta}>
          <Text style={styles.balance}>
            {formatCurrency(vendor.outstandingBalance)}
          </Text>
          
          <View style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(vendor.status)}20` }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(vendor.status) }
            ]}>
              {vendor.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </SwipeableActions>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectionModeContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedContainer: {
    borderWidth: 1,
    borderColor: "#1a73e8",
    backgroundColor: "#f5f9ff",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedCheckbox: {
    backgroundColor: "#1a73e8",
    borderColor: "#1a73e8",
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a73e820",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a73e8",
  },
  vendorInfo: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "column",
    marginTop: 4,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactIcon: {
    marginRight: 4,
  },
  contactText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  vendorMeta: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  balance: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
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
});