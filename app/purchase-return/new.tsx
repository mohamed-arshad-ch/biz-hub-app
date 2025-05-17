import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, StatusBar, KeyboardAvoidingView, Platform, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Calendar, Hash, FileText, Plus, Minus, Package, ChevronDown, Check, Search, X, DollarSign } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { createPurchaseReturn } from '@/db/purchase-return';
import * as dbVendor from '@/db/vendor';
import * as dbProduct from '@/db/product';
import * as dbPurchaseInvoice from '@/db/purchase-invoice';

interface PurchaseReturnItem {
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PurchaseReturnFormData {
  invoiceId: string;
  returnNumber: string;
  returnDate: string;
  items: PurchaseReturnItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  notes: string;
}

export default function NewPurchaseReturnScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<PurchaseReturnFormData>({
    invoiceId: '',
    returnNumber: '',
    returnDate: new Date().toISOString().split('T')[0],
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'draft',
    notes: '',
  });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceSheet, setShowInvoiceSheet] = useState(false);
  const [showProductSheet, setShowProductSheet] = useState<number | null>(null);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const dbInvoices = await dbPurchaseInvoice.getPurchaseInvoices(user.id);
        setInvoices(dbInvoices);
        const dbProducts = await dbProduct.getAllProducts();
        setProducts(dbProducts);
      } catch (e) {
        Alert.alert('Error', 'Failed to load data');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleAddItem = () => {
    const newItem: PurchaseReturnItem = {
      productId: null,
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.1;
      return { ...prev, items: newItems, subtotal, tax, total: subtotal + tax };
    });
  };

  const handleItemChange = (index: number, field: keyof PurchaseReturnItem, value: string | number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      if (field === 'productId') {
        const productIdNum = typeof value === 'string' ? parseInt(value, 10) : value;
        const selectedProduct = products.find(p => p.id === productIdNum);
        if (selectedProduct) {
          newItems[index] = {
            ...newItems[index],
            productId: selectedProduct.id,
            productName: selectedProduct.productName,
            unitPrice: selectedProduct.costPrice / 100,
            total: (selectedProduct.costPrice / 100) * newItems[index].quantity
          };
        }
      } else {
        let updatedValue = value;
        if (field === 'quantity' || field === 'unitPrice') {
          updatedValue = Number(value);
        }
        newItems[index] = {
          ...newItems[index],
          [field]: updatedValue,
        };
        newItems[index].total = newItems[index].unitPrice * newItems[index].quantity;
      }
      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.1;
      return { ...prev, items: newItems, subtotal, tax, total: subtotal + tax };
    });
  };

  const selectInvoice = (invoice: any) => {
    setFormData({ ...formData, invoiceId: invoice.id.toString() });
    setShowInvoiceSheet(false);
    setInvoiceSearch('');
  };

  const selectProduct = (index: number, product: any) => {
    handleItemChange(index, 'productId', product.id);
    setShowProductSheet(null);
    setProductSearch('');
  };

  const selectStatus = (status: string) => {
    setFormData({ ...formData, status: status as PurchaseReturnFormData['status'] });
    setShowStatusSheet(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.invoiceId) {
      Alert.alert('Validation Error', 'Please select an invoice.');
      return;
    }
    if (formData.items.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one item.');
      return;
    }
    for (const item of formData.items) {
      if (!item.productId || !item.productName || !item.quantity || !item.unitPrice) {
        Alert.alert('Validation Error', 'Please complete all item details.');
        return;
      }
    }
    try {
      const subtotal = Math.round(formData.subtotal * 100);
      const tax = Math.round(formData.tax * 100);
      const total = Math.round(formData.total * 100);
      const items = formData.items.map(item => ({
        productId: item.productId ?? 0,
        quantity: item.quantity,
        unitPrice: Math.round(item.unitPrice * 100),
        total: Math.round(item.total * 100),
        notes: undefined,
      }));
      await createPurchaseReturn(user.id, {
        invoiceId: Number(formData.invoiceId),
        returnNumber: formData.returnNumber,
        returnDate: formData.returnDate,
        status: formData.status,
        subtotal,
        tax,
        total,
        notes: formData.notes,
        items,
      });
      Alert.alert('Success', 'Return created successfully');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to create return');
    }
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>New Return</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Invoice</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowInvoiceSheet(true)}
            >
              <View style={styles.selectButtonContent}>
                <FileText size={20} color={Colors.text.secondary} />
                <Text style={styles.selectButtonText}>
                  {invoices.find(i => i.id.toString() === formData.invoiceId)?.invoiceNumber || 'Select Invoice'}
                </Text>
              </View>
              <ChevronDown size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Return Number</Text>
            <View style={styles.inputContainer}>
              <Hash size={20} color={Colors.text.secondary} />
              <TextInput
                style={styles.input}
                value={formData.returnNumber}
                onChangeText={(text) => setFormData({ ...formData, returnNumber: text })}
                placeholder="Enter return number"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Return Date</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color={Colors.text.secondary} />
              <TextInput
                style={styles.input}
                value={formData.returnDate}
                onChangeText={(text) => setFormData({ ...formData, returnDate: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Status</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowStatusSheet(true)}
            >
              <View style={styles.selectButtonContent}>
                <FileText size={20} color={Colors.text.secondary} />
                <Text style={styles.selectButtonText}>
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </Text>
              </View>
              <ChevronDown size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddItem}
              >
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {formData.items.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowProductSheet(index)}
                  >
                    <View style={styles.selectButtonContent}>
                      <Package size={20} color={Colors.text.secondary} />
                      <Text style={styles.selectButtonText}>
                        {item.productName || 'Select Product'}
                      </Text>
                    </View>
                    <ChevronDown size={20} color={Colors.text.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(index)}
                  >
                    <Minus size={20} color={Colors.negative} />
                  </TouchableOpacity>
                </View>

                <View style={styles.itemDetails}>
                  <View style={styles.itemInput}>
                    <Text style={styles.itemLabel}>Quantity</Text>
                    <TextInput
                      style={styles.itemTextInput}
                      value={item.quantity.toString()}
                      onChangeText={(text) => handleItemChange(index, 'quantity', text)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.itemInput}>
                    <Text style={styles.itemLabel}>Unit Price</Text>
                    <View style={styles.priceInput}>
                      <DollarSign size={16} color={Colors.text.secondary} />
                      <TextInput
                        style={styles.itemTextInput}
                        value={item.unitPrice.toString()}
                        onChangeText={(text) => handleItemChange(index, 'unitPrice', text)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View style={styles.itemInput}>
                    <Text style={styles.itemLabel}>Total</Text>
                    <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Add notes..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${formData.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${formData.tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalRowLabel}>Total</Text>
              <Text style={styles.totalRowValue}>${formData.total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Invoice Selection Bottom Sheet */}
        <Modal
          visible={showInvoiceSheet}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Invoice</Text>
                <TouchableOpacity onPress={() => setShowInvoiceSheet(false)}>
                  <X size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <Search size={20} color={Colors.text.secondary} />
                <TextInput
                  style={styles.searchInput}
                  value={invoiceSearch}
                  onChangeText={setInvoiceSearch}
                  placeholder="Search invoices..."
                />
              </View>
              <FlatList
                data={invoices.filter(i => 
                  i.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase())
                )}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => selectInvoice(item)}
                  >
                    <Text style={styles.modalItemText}>{item.invoiceNumber}</Text>
                    {item.id.toString() === formData.invoiceId && (
                      <Check size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Product Selection Bottom Sheet */}
        <Modal
          visible={showProductSheet !== null}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Product</Text>
                <TouchableOpacity onPress={() => setShowProductSheet(null)}>
                  <X size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <Search size={20} color={Colors.text.secondary} />
                <TextInput
                  style={styles.searchInput}
                  value={productSearch}
                  onChangeText={setProductSearch}
                  placeholder="Search products..."
                />
              </View>
              <FlatList
                data={products.filter(p => 
                  p.productName.toLowerCase().includes(productSearch.toLowerCase())
                )}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => selectProduct(showProductSheet!, item)}
                  >
                    <Text style={styles.modalItemText}>{item.productName}</Text>
                    {item.id === formData.items[showProductSheet!]?.productId && (
                      <Check size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Status Selection Bottom Sheet */}
        <Modal
          visible={showStatusSheet}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Status</Text>
                <TouchableOpacity onPress={() => setShowStatusSheet(false)}>
                  <X size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              {['draft', 'pending', 'approved', 'rejected', 'completed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.modalItem}
                  onPress={() => selectStatus(status)}
                >
                  <Text style={styles.modalItemText}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                  {status === formData.status && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#fff',
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
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  label: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  removeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemInput: {
    flex: 1,
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
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text.primary,
    height: 100,
    textAlignVertical: 'top',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  totalRowLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  totalRowValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
}); 