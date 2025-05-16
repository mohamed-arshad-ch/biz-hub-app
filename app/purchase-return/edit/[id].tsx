import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PurchaseReturn, PurchaseReturnFormData } from '@/types/purchase-return';
import { purchaseReturnData } from '@/mocks/purchaseReturnData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function EditPurchaseReturnScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [formData, setFormData] = useState<PurchaseReturnFormData>({
    vendorId: '',
    returnNumber: '',
    returnDate: '',
    originalOrderId: '',
    originalOrderNumber: '',
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'draft',
    notes: '',
  });

  useEffect(() => {
    const returnRecord = purchaseReturnData.find(r => r.id === id);
    if (returnRecord) {
      setFormData({
        vendorId: returnRecord.vendorId,
        returnNumber: returnRecord.returnNumber,
        returnDate: returnRecord.returnDate,
        originalOrderId: returnRecord.originalOrderId,
        originalOrderNumber: returnRecord.originalOrderNumber,
        items: returnRecord.items,
        subtotal: returnRecord.subtotal,
        tax: returnRecord.tax,
        total: returnRecord.total,
        status: returnRecord.status,
        notes: returnRecord.notes || '',
      });
    } else {
      Alert.alert('Error', 'Return not found');
      router.back();
    }
  }, [id]);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: '',
          productName: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
          reason: '',
        },
      ],
    }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
        total: field === 'quantity' || field === 'unitPrice'
          ? Number(newItems[index].quantity) * Number(newItems[index].unitPrice)
          : newItems[index].total,
      };

      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      return {
        ...prev,
        items: newItems,
        subtotal,
        tax,
        total,
      };
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      return {
        ...prev,
        items: newItems,
        subtotal,
        tax,
        total,
      };
    });
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.vendorId || !formData.returnNumber || !formData.returnDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    // Here you would typically save the data to your backend
    Alert.alert('Success', 'Return updated successfully');
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Return</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Return Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vendor *</Text>
            <TextInput
              style={styles.input}
              value={formData.vendorId}
              onChangeText={(value) => setFormData(prev => ({ ...prev, vendorId: value }))}
              placeholder="Select vendor"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Return Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.returnNumber}
              onChangeText={(value) => setFormData(prev => ({ ...prev, returnNumber: value }))}
              placeholder="Enter return number"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Original Order Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.originalOrderNumber}
              onChangeText={(value) => setFormData(prev => ({ ...prev, originalOrderNumber: value }))}
              placeholder="Enter original order number"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Return Date *</Text>
            <TextInput
              style={styles.input}
              value={formData.returnDate}
              onChangeText={(value) => setFormData(prev => ({ ...prev, returnDate: value }))}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Return Items</Text>
            <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
              <Plus size={20} color={Colors.light.background} />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {formData.items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Item {index + 1}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                  <X size={20} color={Colors.light.tabIconDefault} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product *</Text>
                <TextInput
                  style={styles.input}
                  value={item.productName}
                  onChangeText={(value) => handleItemChange(index, 'productName', value)}
                  placeholder="Select product"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    value={item.quantity.toString()}
                    onChangeText={(value) => handleItemChange(index, 'quantity', Number(value) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Unit Price *</Text>
                  <TextInput
                    style={styles.input}
                    value={item.unitPrice.toString()}
                    onChangeText={(value) => handleItemChange(index, 'unitPrice', Number(value) || 0)}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reason for Return *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={item.reason}
                  onChangeText={(value) => handleItemChange(index, 'reason', value)}
                  placeholder="Enter reason for return"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.itemTotal}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>${item.total.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
            placeholder="Enter any additional notes"
            multiline
            numberOfLines={4}
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
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
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.light.background,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  itemContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  itemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.tabIconDefault,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
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
}); 