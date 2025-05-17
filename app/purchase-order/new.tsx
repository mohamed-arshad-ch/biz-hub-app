import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Trash,
  Calendar,
  X,
  Check,
  ChevronDown,
  Package,
  DollarSign,
  User,
  MapPin,
  FileText
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../db';
import { purchaseOrders, purchaseOrderItems, vendors, products } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { useAuthStore } from '@/store/auth';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discount: number;
  tax: number;
}

export default function NewPurchaseOrderScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [vendorsList, setVendorsList] = useState<Array<{ id: number; name: string }>>([]);
  const [productsList, setProductsList] = useState<Array<{ id: number; name: string; price: number }>>([]);
  const [selectedVendor, setSelectedVendor] = useState<{ id: number; name: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string; price: number } | null>(null);
  const [orderDate, setOrderDate] = useState(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  useEffect(() => {
    loadVendors();
    loadProducts();
  }, [user]);

  const loadVendors = async () => {
    if (!user) return;

    try {
      const result = await db
        .select({
          id: vendors.id,
          name: vendors.name,
        })
        .from(vendors)
        .where(eq(vendors.userId, user.id));

      setVendorsList(result);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const loadProducts = async () => {
    if (!user) return;

    try {
      const result = await db
        .select({
          id: products.id,
          name: products.productName,
          price: products.costPrice,
        })
        .from(products)
        .where(eq(products.userId, user.id));

      setProductsList(result);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;

    const newItem: PurchaseOrderItem = {
      id: Date.now(), // Temporary ID for new items
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: 1,
      unitPrice: selectedProduct.price,
      total: selectedProduct.price,
      discount: 0,
      tax: 0,
    };

    setItems([...items, newItem]);
    setSelectedProduct(null);
    setShowProductModal(false);
  };

  const handleUpdateItem = (itemId: number, field: keyof PurchaseOrderItem, value: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: number) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = items.reduce((sum, item) => sum + (item.tax || 0), 0);
    const discount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const total = subtotal + tax - discount;

    return { subtotal, tax, discount, total };
  };

  const handleSave = async () => {
    if (!user || !selectedVendor) {
      Alert.alert('Error', 'Please select a vendor');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    setSaving(true);

    try {
      const { subtotal, tax, discount, total } = calculateTotals();

      // Generate order number
      const orderNumber = `PO${Date.now().toString().slice(-6)}`;

      // Insert purchase order
      const [newOrder] = await db.insert(purchaseOrders).values({
        userId: user.id,
        orderNumber,
        vendorId: selectedVendor.id,
        orderDate: orderDate.toISOString(),
        dueDate: dueDate?.toISOString() || null,
        status: 'pending',
        total,
        subtotal,
        tax,
        discount,
        notes,
        shippingAddress,
        billingAddress,
        paymentTerms,
      }).returning();

      // Insert items
      for (const item of items) {
        await db.insert(purchaseOrderItems).values({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          discount: item.discount,
          tax: item.tax,
        });
      }

      Alert.alert('Success', 'Purchase order created successfully');
      router.back();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      Alert.alert('Error', 'Failed to create purchase order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Purchase Order</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView style={styles.scrollView}>
          {/* Vendor Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Vendor</Text>
            </View>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowVendorModal(true)}
            >
              <Text style={styles.selectButtonText}>
                {selectedVendor ? selectedVendor.name : 'Select Vendor'}
              </Text>
              <ChevronDown size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Order Date */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Order Date</Text>
            </View>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.selectButtonText}>
                {format(orderDate, 'MMM dd, yyyy')}
              </Text>
              <Calendar size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Due Date */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Due Date</Text>
            </View>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowDueDatePicker(true)}
            >
              <Text style={styles.selectButtonText}>
                {dueDate ? format(dueDate, 'MMM dd, yyyy') : 'Select Due Date'}
              </Text>
              <Calendar size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Items</Text>
            </View>
            {items.map((item) => (
              <View key={item.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(item.id)}
                    style={styles.removeButton}
                  >
                    <Trash size={16} color={Colors.negative} />
                  </TouchableOpacity>
                </View>
                <View style={styles.itemDetails}>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Quantity</Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={item.quantity.toString()}
                      onChangeText={(value) => handleUpdateItem(item.id, 'quantity', parseInt(value) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Unit Price</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={formatCurrency(item.unitPrice)}
                      onChangeText={(value) => handleUpdateItem(item.id, 'unitPrice', parseInt(value.replace(/[^0-9]/g, '')) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.itemTotal}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => setShowProductModal(true)}
            >
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addItemButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {/* Totals */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <DollarSign size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Totals</Text>
            </View>
            <View style={styles.totalsGrid}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatCurrency(calculateTotals().subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>{formatCurrency(calculateTotals().tax)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>{formatCurrency(calculateTotals().discount)}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotal]}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(calculateTotals().total)}</Text>
              </View>
            </View>
          </View>

          {/* Addresses */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Addresses</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Shipping Address</Text>
              <TextInput
                style={styles.textInput}
                value={shippingAddress}
                onChangeText={setShippingAddress}
                placeholder="Enter shipping address"
                multiline
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Billing Address</Text>
              <TextInput
                style={styles.textInput}
                value={billingAddress}
                onChangeText={setBillingAddress}
                placeholder="Enter billing address"
                multiline
              />
            </View>
          </View>

          {/* Payment Terms */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Payment Terms</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={paymentTerms}
                onChangeText={setPaymentTerms}
                placeholder="Enter payment terms"
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Enter notes"
                multiline
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Vendor Selection Modal */}
      <Modal
        visible={showVendorModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVendorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vendor</Text>
              <TouchableOpacity
                onPress={() => setShowVendorModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {vendorsList.map((vendor) => (
                <TouchableOpacity
                  key={vendor.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedVendor(vendor);
                    setShowVendorModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{vendor.name}</Text>
                  {selectedVendor?.id === vendor.id && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Selection Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity
                onPress={() => setShowProductModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {productsList.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedProduct(product);
                    handleAddItem();
                  }}
                >
                  <View>
                    <Text style={styles.modalItemText}>{product.name}</Text>
                    <Text style={styles.modalItemSubtext}>
                      {formatCurrency(product.price)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={orderDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setOrderDate(selectedDate);
            }
          }}
        />
      )}

      {/* Due Date Picker */}
      {showDueDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDueDatePicker(false);
            if (selectedDate) {
              setDueDate(selectedDate);
            }
          }}
        />
      )}
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
    padding: 16,
    backgroundColor: Colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: 8,
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: Colors.background.default,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 8,
  },
  selectButtonText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  itemContainer: {
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
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  removeButton: {
    padding: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  quantityContainer: {
    flex: 1,
    marginRight: 8,
  },
  quantityLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  quantityInput: {
    backgroundColor: Colors.background.default,
    padding: 8,
    borderRadius: 4,
    fontSize: 14,
    color: Colors.text.primary,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  priceInput: {
    backgroundColor: Colors.background.default,
    padding: 8,
    borderRadius: 4,
    fontSize: 14,
    color: Colors.text.primary,
  },
  itemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  addItemButtonText: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 8,
  },
  totalsGrid: {
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
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
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
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
  modalItemSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
});