import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SalesOrderFormData, SalesOrderItem } from '@/types/sales-order';
import { salesOrderData } from '@/mocks/salesOrderData';
import { getCustomersData } from '@/mocks/customersData';
import { getProductsData } from '@/mocks/productsData';
import { Customer } from '@/types/customer';
import { Product } from '@/types/product';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function EditSalesOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [formData, setFormData] = useState<SalesOrderFormData>({
    customerId: '',
    orderNumber: '',
    orderDate: new Date().toISOString().split('T')[0],
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'draft',
    notes: ''
  });

  useEffect(() => {
    // In a real app, you would fetch the order data from your backend
    const order = salesOrderData.find(o => o.id === id);
    if (order) {
      setFormData({
        customerId: order.customerId,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        status: order.status,
        notes: order.notes || ''
      });
    } else {
      Alert.alert('Error', 'Sales order not found');
      router.back();
    }
  }, [id]);

  const handleAddItem = () => {
    const newItem: SalesOrderItem = {
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
  };

  const handleItemChange = (index: number, field: keyof SalesOrderItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
      total: field === 'quantity' || field === 'unitPrice'
        ? (field === 'quantity' ? Number(value) : newItems[index].quantity) *
          (field === 'unitPrice' ? Number(value) : newItems[index].unitPrice)
        : newItems[index].total
    };

    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax rate

    setFormData({
      ...formData,
      items: newItems,
      subtotal,
      tax,
      total: subtotal + tax
    });
  };

  const handleSave = () => {
    // Validate form data
    if (!formData.customerId || formData.items.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Here you would typically update the data in your backend
    Alert.alert(
      'Success',
      'Sales order updated successfully',
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Sales Order</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Save size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Customer *</Text>
          <View style={styles.select}>
            <TextInput
              style={styles.selectInput}
              placeholder="Select customer"
              value={getCustomersData().find((c: Customer) => c.id === formData.customerId)?.name || ''}
              editable={false}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Order Number</Text>
          <TextInput
            style={styles.input}
            value={formData.orderNumber}
            editable={false}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Order Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={formData.orderDate}
            onChangeText={(value) => setFormData({ ...formData, orderDate: value })}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <TouchableOpacity onPress={handleAddItem} style={styles.addItemButton}>
              <Plus size={20} color={Colors.light.background} />
            </TouchableOpacity>
          </View>

          {formData.items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product *</Text>
                <View style={styles.select}>
                  <TextInput
                    style={styles.selectInput}
                    placeholder="Select product"
                    value={getProductsData().find((p: Product) => p.id === item.productId)?.name || ''}
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter quantity"
                    keyboardType="numeric"
                    value={item.quantity.toString()}
                    onChangeText={(value) => handleItemChange(index, 'quantity', Number(value) || 0)}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Unit Price *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter unit price"
                    keyboardType="numeric"
                    value={item.unitPrice.toString()}
                    onChangeText={(value) => handleItemChange(index, 'unitPrice', Number(value) || 0)}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Total</Text>
                <TextInput
                  style={styles.input}
                  value={`$${item.total.toFixed(2)}`}
                  editable={false}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${formData.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (10%)</Text>
            <Text style={styles.summaryValue}>${formData.tax.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>${formData.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter notes"
            multiline
            numberOfLines={4}
            value={formData.notes}
            onChangeText={(value) => setFormData({ ...formData, notes: value })}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  select: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault,
    borderRadius: 8,
  },
  selectInput: {
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  addItemButton: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  summary: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
}); 