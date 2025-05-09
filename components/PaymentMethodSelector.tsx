import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Check } from 'lucide-react-native';
import Colors from '@/constants/colors';

// Default payment methods
export const defaultPaymentMethods = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "Check",
  "PayPal",
  "Mobile Payment",
  "Other"
];

interface PaymentMethodSelectorProps {
  paymentMethods?: string[];
  selectedMethod: string;
  onSelectPaymentMethod: (method: string) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethods = defaultPaymentMethods,
  selectedMethod,
  onSelectPaymentMethod
}) => {
  const renderPaymentMethodItem = ({ item }: { item: string }) => {
    const isSelected = selectedMethod === item;
    
    return (
      <TouchableOpacity
        style={[
          styles.paymentMethodItem,
          isSelected && styles.selectedPaymentMethodItem
        ]}
        onPress={() => onSelectPaymentMethod(item)}
      >
        <Text style={[
          styles.paymentMethodText,
          isSelected && styles.selectedPaymentMethodText
        ]}>
          {item}
        </Text>
        {isSelected && (
          <Check size={18} color={Colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Select Payment Method
        </Text>
      </View>
      
      <FlatList
        data={paymentMethods}
        renderItem={renderPaymentMethodItem}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedPaymentMethodItem: {
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
  },
  selectedPaymentMethodText: {
    fontWeight: '500',
    color: Colors.primary,
  }
});

export default PaymentMethodSelector; 