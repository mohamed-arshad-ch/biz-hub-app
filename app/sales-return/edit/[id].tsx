import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, X, FileText, Calendar, Hash, Package, DollarSign, ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { getSalesReturnById, updateSalesReturn } from '@/db/sales-return';
import * as dbInvoice from '@/db/sales-invoice';
import * as dbProduct from '@/db/product';

export default function EditSalesReturnScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [returnData, setReturnData] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    if (!user || !id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const ret = await getSalesReturnById(Number(id), user.id);
        if (!ret) throw new Error('Return not found');
        setReturnData(ret);
        if (ret?.invoiceId) {
          const inv = await dbInvoice.getSalesInvoiceById(ret.invoiceId, user.id);
          setInvoice(inv);
        }
        const prods = await dbProduct.getAllProducts();
        setProducts(prods);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load return data');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, id]);

  const handleSave = async () => {
    if (!user || !returnData) return;
    try {
      setSaving(true);
      await updateSalesReturn(returnData.id, user.id, {
        returnNumber: returnData.returnNumber,
        invoiceId: returnData.invoiceId,
        returnDate: returnData.returnDate,
        status: returnData.status,
        subtotal: returnData.subtotal,
        tax: returnData.tax,
        total: returnData.total,
        notes: returnData.notes,
      }, returnData.items);
      Alert.alert('Success', 'Return updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating return:', error);
      Alert.alert('Error', 'Failed to update return');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const newItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.productName,
      quantity: 1,
      unitPrice: selectedProduct.sellingPrice,
      total: selectedProduct.sellingPrice,
      notes: '',
    };
    setReturnData({
      ...returnData,
      items: [...(returnData.items || []), newItem],
      subtotal: (returnData.subtotal || 0) + selectedProduct.sellingPrice,
      total: (returnData.total || 0) + selectedProduct.sellingPrice,
    });
    setSelectedProduct(null);
    setShowProductModal(false);
  };

  const handleRemoveItem = (index: number) => {
    const item = returnData.items[index];
    setReturnData({
      ...returnData,
      items: returnData.items.filter((_: any, i: number) => i !== index),
      subtotal: returnData.subtotal - item.total,
      total: returnData.total - item.total,
    });
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...returnData.items];
    const item = { ...newItems[index] };
    item[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = item.quantity * item.unitPrice;
    }
    newItems[index] = item;
    
    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
    const tax = Math.round(subtotal * 0.1); // 10% tax
    const total = subtotal + tax;

    setReturnData({
      ...returnData,
      items: newItems,
      subtotal,
      tax,
      total,
    });
  };

  if (loading || !returnData) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Return</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Invoice</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowInvoiceModal(true)}
          >
            <FileText size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.inputText}>#{invoice?.invoiceNumber || 'Select Invoice'}</Text>
            <ChevronDown size={16} color={Colors.text.secondary} />
          </TouchableOpacity>

          <Text style={styles.label}>Return Number</Text>
          <View style={styles.input}>
            <Hash size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={returnData.returnNumber}
              onChangeText={(text) => setReturnData({ ...returnData, returnNumber: text })}
              placeholder="Enter return number"
            />
          </View>

          <Text style={styles.label}>Status</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowStatusModal(true)}
          >
            <FileText size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.inputText}>{returnData.status.charAt(0).toUpperCase() + returnData.status.slice(1)}</Text>
            <ChevronDown size={16} color={Colors.text.secondary} />
          </TouchableOpacity>

          <Text style={styles.label}>Return Date</Text>
          <View style={styles.input}>
            <Calendar size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={returnData.returnDate}
              onChangeText={(text) => setReturnData({ ...returnData, returnDate: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowProductModal(true)}
            >
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {returnData.items && returnData.items.length > 0 ? returnData.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Package size={16} color={Colors.text.secondary} />
                  <Text style={styles.itemName}>{item.productName}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(index)}
                >
                  <X size={16} color={Colors.negative} />
                </TouchableOpacity>
              </View>
              <View style={styles.itemDetails}>
                <View style={styles.itemInput}>
                  <Text style={styles.itemLabel}>Quantity</Text>
                  <TextInput
                    style={styles.itemTextInput}
                    value={item.quantity.toString()}
                    onChangeText={(text) => handleUpdateItem(index, 'quantity', parseInt(text) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.itemInput}>
                  <Text style={styles.itemLabel}>Unit Price</Text>
                  <TextInput
                    style={styles.itemTextInput}
                    value={(item.unitPrice / 100).toFixed(2)}
                    onChangeText={(text) => handleUpdateItem(index, 'unitPrice', Math.round(parseFloat(text) * 100) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.itemTotal}>
                  <Text style={styles.itemLabel}>Total</Text>
                  <Text style={styles.itemTotalText}>${(item.total / 100).toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )) : (
            <Text style={styles.emptyText}>No items added</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={returnData.notes}
            onChangeText={(text) => setReturnData({ ...returnData, notes: text })}
            placeholder="Add notes..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${(returnData.subtotal / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${(returnData.tax / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalRowLabel}>Total</Text>
            <Text style={styles.totalRowValue}>${(returnData.total / 100).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Invoice Selection Modal */}
      <Modal
        visible={showInvoiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Invoice</Text>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {invoice && (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => {
                    setReturnData({ ...returnData, invoiceId: invoice.id });
                    setShowInvoiceModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>#{invoice.invoiceNumber}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Selection Modal */}
      <Modal
        visible={showProductModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {products.map((product) => (
                <TouchableOpacity 
                  key={product.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedProduct(product);
                    handleAddItem();
                  }}
                >
                  <Text style={styles.modalItemText}>{product.productName}</Text>
                  <Text style={styles.modalItemSubtext}>${(product.sellingPrice / 100).toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {['draft', 'pending', 'approved', 'rejected', 'completed'].map((status) => (
                <TouchableOpacity 
                  key={status}
                  style={styles.modalItem}
                  onPress={() => {
                    setReturnData({ ...returnData, status });
                    setShowStatusModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: Colors.background.default,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
    color: Colors.text.primary,
  },
  label: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    padding: 0,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  itemCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  removeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  itemInput: {
    flex: 1,
    marginRight: 8,
  },
  itemLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  itemTextInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    color: Colors.text.primary,
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text.primary,
    textAlignVertical: 'top',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    marginTop: 8,
    paddingTop: 16,
  },
  totalRowLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  totalRowValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  modalItemSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
}); 