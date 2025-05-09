import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Edit, Trash, Mail, Phone } from "lucide-react-native";

import { Customer } from "@/types/customer";
import { formatCurrency } from "@/utils/formatters";
import SwipeableActions from "@/components/SwipeableActions";

interface CustomerItemProps {
  customer: Customer;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CustomerItem({ customer, onPress, onEdit, onDelete }: CustomerItemProps) {
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
        }
      ]}
    >
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.customerInfo}>
          <Text style={styles.name}>{customer.name}</Text>
          
          {customer.company && (
            <Text style={styles.company}>{customer.company}</Text>
          )}
          
          <View style={styles.contactRow}>
            {customer.email && (
              <View style={styles.contactItem}>
                <Mail size={12} color="#666" style={styles.contactIcon} />
                <Text style={styles.contactText} numberOfLines={1}>{customer.email}</Text>
              </View>
            )}
            
            {customer.phone && (
              <View style={styles.contactItem}>
                <Phone size={12} color="#666" style={styles.contactIcon} />
                <Text style={styles.contactText}>{customer.phone}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.customerMeta}>
          <Text style={styles.balance}>
            {formatCurrency(customer.outstandingBalance)}
          </Text>
          
          <View style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(customer.status)}20` }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(customer.status) }
            ]}>
              {customer.status.toUpperCase()}
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
  customerInfo: {
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
  customerMeta: {
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