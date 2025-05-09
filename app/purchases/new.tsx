import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight,
  Trash2,
  Plus,
  DollarSign,
  AlertCircle
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import Colors from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import { PurchaseItem } from "@/types/purchases";
import { Vendor } from "@/types/vendor";
import { Product } from "@/types/product";
import BottomSheet from "@/components/BottomSheet";
import VendorSelector from "@/components/VendorSelector";
import ProductSelector from "@/components/ProductSelector";

// Import AsyncStorage utils
import { getVendors, getProducts, addPurchase } from "@/utils/asyncStorageUtils";

// Payment status options
const PAYMENT_STATUSES = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
];

// Payment method options
const PAYMENT_METHODS = [
  "Credit Card",
  "Bank Transfer",
  "Cash",
  "Check",
  "PayPal",
  "Venmo",
  "Wire Transfer",
];

export default function NewPurchaseScreen() {
  const router = useRouter();
  
  // Form state
  const [poNumber, setPoNumber] = useState(`PO-${Math.floor(10000 + Math.random() * 90000)}`);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState("0");
  const [notes, setNotes] = useState("");
  
  // UI state
  const [isVendorSheetVisible, setIsVendorSheetVisible] = useState(false);
  const [isProductSheetVisible, setIsProductSheetVisible] = useState(false);
  const [isPaymentStatusSheetVisible, setIsPaymentStatusSheetVisible] = useState(false);
  const [isPaymentMethodSheetVisible, setIsPaymentMethodSheetVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Data state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Load data from AsyncStorage
  useEffect(() => {
    setIsLoading(true);
    
    const loadData = async () => {
      try {
        const [vendorsData, productsData] = await Promise.all([
          getVendors(),
          getProducts()
        ]);
        
        setVendors(vendorsData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load vendors and products');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = parseFloat(discount) || 0;
  const taxAmount = (subtotal - discountAmount) * (parseFloat(tax) / 100 || 0);
  const total = subtotal - discountAmount + taxAmount;
  
  // Update amount paid when payment status changes
  useEffect(() => {
    if (paymentStatus === "paid") {
      setAmountPaid(total.toFixed(2));
    }
  }, [paymentStatus, total]);
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleDueDateChange = (event: any, selectedDate?: Date) => {
    setShowDueDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };
  
  const handleSelectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsVendorSheetVisible(false);
  };
  
  const handleAddProduct = (product: Product) => {
    const existingItemIndex = items.findIndex(item => 
      item.productId === product.id
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity if product already exists
      const updatedItems = [...items];
      const item = updatedItems[existingItemIndex];
      item.quantity += 1;
      item.total = item.unitPrice * item.quantity;
      setItems(updatedItems);
    } else {
      // Add new item
      const newItem: PurchaseItem = {
        id: `item-${Date.now()}`,
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.purchasePrice,
        total: product.purchasePrice,
        description: product.description || "",
      };
      setItems([...items, newItem]);
    }
    
    setIsProductSheetVisible(false);
  };
  
  const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      handleRemoveItem(itemId);
      return;
    }
    
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          total: item.unitPrice * quantity,
        };
      }
      return item;
    }));
  };
  
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };
  
  const handleSelectPaymentStatus = (status: string) => {
    setPaymentStatus(status);
    setIsPaymentStatusSheetVisible(false);
    
    if (status === "paid") {
      setAmountPaid(total.toFixed(2));
    }
  };
  
  const handleSelectPaymentMethod = (method: string) => {
    setPaymentMethod(method);
    setIsPaymentMethodSheetVisible(false);
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!poNumber.trim()) {
      newErrors.poNumber = 'Purchase order number is required';
    }
    
    if (!selectedVendor) {
      newErrors.vendor = 'Please select a vendor';
    }
    
    if (items.length === 0) {
      newErrors.items = 'Please add at least one product';
    }
    
    if (paymentStatus === 'paid' && parseFloat(amountPaid) < total) {
      newErrors.amountPaid = 'Amount paid must equal total for paid status';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors before saving');
      return;
    }
    
    setIsLoading(true);
    
    const purchase = {
      id: `purchase-${Date.now()}`,
      poNumber,
      date: date.toISOString(),
      dueDate: dueDate.toISOString(),
      vendor: selectedVendor,
      items,
      subtotal,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      total,
      paymentStatus,
      paymentMethod,
      amountPaid: parseFloat(amountPaid) || 0,
      notes,
      createdAt: new Date().toISOString(),
    };
    
    try {
      await addPurchase(purchase);
      Alert.alert(
        'Success',
        'Purchase has been saved successfully',
        [
          { 
            text: 'OK', 
            onPress: () => router.back() 
          }
        ]
      );
    } catch (error) {
      console.error('Error saving purchase:', error);
      Alert.alert('Error', 'Failed to save purchase');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    Alert.alert(
      'Confirm Cancel',
      'Are you sure you want to cancel? Any unsaved changes will be lost.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => router.back() }
      ]
    );
  };
  
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#34a853'; // green
      case 'pending':
        return '#fbbc04'; // yellow
      case 'overdue':
        return '#ea4335'; // red
      default:
        return '#9aa0a6'; // grey
    }
  };
  
  if (isLoading && vendors.length === 0 && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen 
        options={{
          title: "New Purchase",
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Purchase Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Purchase Details</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Purchase Order #</Text>
              <TextInput
                style={[styles.input, errors.poNumber ? styles.inputError : null]}
                value={poNumber}
                onChangeText={setPoNumber}
                placeholder="Enter PO number"
              />
              {errors.poNumber && <Text style={styles.errorText}>{errors.poNumber}</Text>}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {date.toLocaleDateString()}
                </Text>
                <Calendar size={20} color="#666" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDueDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {dueDate.toLocaleDateString()}
                </Text>
                <Calendar size={20} color="#666" />
              </TouchableOpacity>
              {showDueDatePicker && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display="default"
                  onChange={handleDueDateChange}
                />
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Vendor</Text>
              <TouchableOpacity
                style={[styles.vendorSelector, errors.vendor ? styles.inputError : null]}
                onPress={() => setIsVendorSheetVisible(true)}
              >
                {selectedVendor ? (
                  <View style={styles.selectedVendor}>
                    <Text style={styles.vendorName}>{selectedVendor.name}</Text>
                    {selectedVendor.company && (
                      <Text style={styles.vendorDetail}>{selectedVendor.company}</Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>Select a vendor</Text>
                )}
                <ChevronRight size={20} color="#666" />
              </TouchableOpacity>
              {errors.vendor && <Text style={styles.errorText}>{errors.vendor}</Text>}
            </View>
          </View>
          
          {/* Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsProductSheetVisible(true)}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
            
            {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}
            
            {items.length === 0 ? (
              <View style={styles.noItemsContainer}>
                <Text style={styles.noItemsText}>No items added yet</Text>
                <Text style={styles.noItemsSubtext}>Tap "Add Item" to add products</Text>
              </View>
            ) : (
              <View style={styles.itemsContainer}>
                {items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View style={styles.itemPriceRow}>
                        <Text style={styles.itemPrice}>
                          {formatCurrency(item.unitPrice)} × 
                        </Text>
                        <View style={styles.quantityContainer}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                          >
                            <Text style={styles.quantityButtonText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Text style={styles.quantityButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    <View style={styles.itemActions}>
                      <Text style={styles.itemTotal}>
                        {formatCurrency(item.total)}
                      </Text>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 size={18} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {/* Summary Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Discount</Text>
              <View style={styles.currencyInputContainer}>
                <DollarSign size={16} color="#666" style={styles.currencyIcon} />
                <TextInput
                  style={styles.currencyInput}
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tax (%)</Text>
              <TextInput
                style={styles.input}
                value={tax}
                onChangeText={setTax}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
          
          {/* Payment Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setIsPaymentStatusSheetVisible(true)}
              >
                <View style={styles.dropdownSelection}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: getPaymentStatusColor(paymentStatus) }
                    ]}
                  />
                  <Text style={styles.dropdownText}>
                    {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                  </Text>
                </View>
                <ChevronDown size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Method</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setIsPaymentMethodSheetVisible(true)}
              >
                <Text style={styles.dropdownText}>
                  {paymentMethod || "Select payment method"}
                </Text>
                <ChevronDown size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount Paid</Text>
              <View style={styles.currencyInputContainer}>
                <DollarSign size={16} color="#666" style={styles.currencyIcon} />
                <TextInput
                  style={[styles.currencyInput, errors.amountPaid ? styles.inputError : null]}
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>
              {errors.amountPaid && <Text style={styles.errorText}>{errors.amountPaid}</Text>}
            </View>
            
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Balance Due</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(Math.max(0, total - parseFloat(amountPaid || '0')))}
              </Text>
            </View>
          </View>
          
          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes here..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom Sheets */}
      <BottomSheet
        isVisible={isVendorSheetVisible}
        onClose={() => setIsVendorSheetVisible(false)}
        title="Select Vendor"
      >
        <VendorSelector
          vendors={vendors}
          onSelectVendor={handleSelectVendor}
        />
      </BottomSheet>
      
      <BottomSheet
        isVisible={isProductSheetVisible}
        onClose={() => setIsProductSheetVisible(false)}
        title="Select Product"
      >
        <ProductSelector
          products={products}
          onSelectProduct={handleAddProduct}
        />
      </BottomSheet>
      
      <BottomSheet
        isVisible={isPaymentStatusSheetVisible}
        onClose={() => setIsPaymentStatusSheetVisible(false)}
        title="Select Payment Status"
        height={300}
      >
        <View style={styles.optionsList}>
          {PAYMENT_STATUSES.map((status) => (
            <TouchableOpacity
              key={status.value}
              style={styles.optionItem}
              onPress={() => handleSelectPaymentStatus(status.value)}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: getPaymentStatusColor(status.value) }
                  ]}
                />
                <Text style={styles.optionText}>{status.label}</Text>
              </View>
              {paymentStatus === status.value && (
                <View style={styles.selectedOption} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
      
      <BottomSheet
        isVisible={isPaymentMethodSheetVisible}
        onClose={() => setIsPaymentMethodSheetVisible(false)}
        title="Select Payment Method"
        height={400}
      >
        <View style={styles.optionsList}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method}
              style={styles.optionItem}
              onPress={() => handleSelectPaymentMethod(method)}
            >
              <Text style={styles.optionText}>{method}</Text>
              {paymentMethod === method && (
                <View style={styles.selectedOption} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    color: '#333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  vendorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
  },
  selectedVendor: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  vendorDetail: {
    fontSize: 14,
    color: '#666',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  noItemsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  noItemsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  noItemsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  itemsContainer: {
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 24,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityText: {
    fontSize: 14,
    color: '#333',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 12,
  },
  deleteButton: {
    padding: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
  },
  currencyIcon: {
    marginRight: 8,
  },
  currencyInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
  },
  dropdownSelection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: paymentStatus => paymentStatus === 'paid' ? '#34a853' : '#ea4335',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    minHeight: 100,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  optionsList: {
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOption: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});