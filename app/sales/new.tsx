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
import { SaleItem } from "@/types/sales";
import { Customer } from "@/types/customer";
import { Product } from "@/types/product";
import BottomSheet from "@/components/BottomSheet";
import CustomerSelector from "@/components/CustomerSelector";
import ProductSelector from "@/components/ProductSelector";

// Replace the import from asyncStorageUtils with separate imports for each utility
import { getCustomers } from "@/utils/customerUtils";
import { getProducts } from "@/utils/productUtils";
import { addSale } from "@/utils/asyncStorageUtils"; // Keep this import until we implement sales utils

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

export default function NewSaleScreen() {
  const router = useRouter();
  
  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState("0");
  const [notes, setNotes] = useState("");
  
  // UI state
  const [isCustomerSheetVisible, setIsCustomerSheetVisible] = useState(false);
  const [isProductSheetVisible, setIsProductSheetVisible] = useState(false);
  const [isPaymentStatusSheetVisible, setIsPaymentStatusSheetVisible] = useState(false);
  const [isPaymentMethodSheetVisible, setIsPaymentMethodSheetVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Load data from AsyncStorage
  useEffect(() => {
    setIsLoading(true);
    
    const loadData = async () => {
      try {
        const [customersData, productsData] = await Promise.all([
          getCustomers(),
          getProducts()
        ]);
        
        setCustomers(customersData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load customers and products');
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
  
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerSheetVisible(false);
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
      const newItem: SaleItem = {
        id: `item-${Date.now()}`,
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        total: product.sellingPrice,
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
    
    if (!invoiceNumber.trim()) {
      newErrors.invoiceNumber = "Invoice number is required";
    }
    
    if (!selectedCustomer) {
      newErrors.customer = "Customer is required";
    }
    
    if (items.length === 0) {
      newErrors.items = "At least one item is required";
    }
    
    if (paymentStatus === "paid") {
      if (!paymentMethod) {
        newErrors.paymentMethod = "Payment method is required";
      }
      
      const paid = parseFloat(amountPaid);
      if (isNaN(paid) || paid <= 0) {
        newErrors.amountPaid = "Valid amount paid is required";
      } else if (paid > total) {
        newErrors.amountPaid = "Amount paid cannot exceed total";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please fix the errors in the form");
      return;
    }
    
    setIsLoading(true);
    
    // Create sale object to save
    const sale = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      date: date.toISOString(),
      dueDate: dueDate.toISOString(),
      customer: selectedCustomer,
      items,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      subtotal,
      total,
      paymentStatus,
      paymentMethod,
      amountPaid: parseFloat(amountPaid) || 0,
      notes,
      createdAt: new Date().toISOString(),
    };
    
    try {
      await addSale(sale);
      Alert.alert(
        "Success",
        "Sale has been created successfully",
        [
          { 
            text: "OK", 
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error("Error saving sale:", error);
      Alert.alert("Error", "Failed to save sale");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    Alert.alert(
      "Cancel",
      "Are you sure you want to cancel? All changes will be lost.",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          style: "destructive",
          onPress: () => router.back()
        }
      ]
    );
  };
  
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return Colors.status.active;
      case "pending":
        return Colors.status.pending;
      case "overdue":
        return Colors.status.blocked;
      default:
        return "#999";
    }
  };
  
  if (isLoading && (!customers.length || !products.length)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: "New Sale",
          headerLeft: () => null,
          headerRight: () => null,
        }} 
      />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView style={styles.container}>
          {/* Basic Info Card */}
          <View style={styles.card}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Invoice Number</Text>
              <TextInput
                style={[styles.input, errors.invoiceNumber && styles.inputError]}
                value={invoiceNumber}
                onChangeText={setInvoiceNumber}
                placeholder="Enter invoice number"
              />
              {errors.invoiceNumber && (
                <Text style={styles.errorText}>{errors.invoiceNumber}</Text>
              )}
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
          </View>
          
          {/* Customer Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Select Customer</Text>
            <TouchableOpacity
              style={[styles.selectButton, errors.customer && styles.inputError]}
              onPress={() => setIsCustomerSheetVisible(true)}
            >
              {selectedCustomer ? (
                <View style={styles.selectedCustomer}>
                  <Text style={styles.selectedCustomerName}>{selectedCustomer.name}</Text>
                </View>
              ) : (
                <Text style={styles.selectButtonText}>Search customers...</Text>
              )}
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>
            {errors.customer && (
              <Text style={styles.errorText}>{errors.customer}</Text>
            )}
          </View>
          
          {/* Products Card */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Products</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsProductSheetVisible(true)}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.addButtonText}>Add Product</Text>
              </TouchableOpacity>
            </View>
            
            {items.length === 0 ? (
              <View style={styles.emptyProducts}>
                <Text style={styles.emptyProductsText}>No products added</Text>
                {errors.items && (
                  <Text style={styles.errorText}>{errors.items}</Text>
                )}
              </View>
            ) : (
              <View style={styles.productsList}>
                {items.map(item => (
                  <View key={item.id} style={styles.productItem}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productPrice}>{formatCurrency(item.unitPrice)}</Text>
                    </View>
                    
                    <View style={styles.productActions}>
                      <View style={styles.quantityControl}>
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
                      
                      <View style={styles.productTotalContainer}>
                        <Text style={styles.productTotal}>{formatCurrency(item.total)}</Text>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 size={18} color="#ea4335" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.divider} />
            
            <View style={styles.summarySection}>
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
                    keyboardType="numeric"
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
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
              </View>
            </View>
          </View>
          
          {/* Payment Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Payment Status</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setIsPaymentStatusSheetVisible(true)}
              >
                <View style={styles.statusBadge}>
                  <View 
                    style={[
                      styles.statusIndicator, 
                      { backgroundColor: getPaymentStatusColor(paymentStatus) }
                    ]} 
                  />
                  <Text style={styles.statusText}>
                    {PAYMENT_STATUSES.find(s => s.value === paymentStatus)?.label || "Select status"}
                  </Text>
                </View>
                <ChevronDown size={20} color="#999" />
              </TouchableOpacity>
            </View>
            
            {(paymentStatus === "paid" || paymentStatus === "partial") && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Payment Method</Text>
                  <TouchableOpacity
                    style={[styles.selectButton, errors.paymentMethod && styles.inputError]}
                    onPress={() => setIsPaymentMethodSheetVisible(true)}
                  >
                    <Text style={paymentMethod ? styles.selectButtonValue : styles.selectButtonText}>
                      {paymentMethod || "Select payment method"}
                    </Text>
                    <ChevronDown size={20} color="#999" />
                  </TouchableOpacity>
                  {errors.paymentMethod && (
                    <Text style={styles.errorText}>{errors.paymentMethod}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Amount Paid</Text>
                  <View style={styles.currencyInputContainer}>
                    <DollarSign size={16} color="#666" style={styles.currencyIcon} />
                    <TextInput
                      style={[styles.currencyInput, errors.amountPaid && styles.inputError]}
                      value={amountPaid}
                      onChangeText={setAmountPaid}
                      keyboardType="numeric"
                      placeholder="0.00"
                      editable={paymentStatus !== "paid"}
                    />
                  </View>
                  {errors.amountPaid && (
                    <Text style={styles.errorText}>{errors.amountPaid}</Text>
                  )}
                </View>
              </>
            )}
          </View>
          
          {/* Notes Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes here"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Sticky Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={handleCancel}
          >
            <Text style={styles.footerButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.footerButton, styles.footerButtonPrimary]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={[styles.footerButtonText, styles.footerButtonTextPrimary]}>
              {isLoading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* Customer Selection Bottom Sheet */}
      <BottomSheet
        isVisible={isCustomerSheetVisible}
        onClose={() => setIsCustomerSheetVisible(false)}
        title="Select Customer"
        height="70%"
      >
        <CustomerSelector
          customers={customers}
          onSelectCustomer={handleSelectCustomer}
          onAddNewCustomer={() => {
            setIsCustomerSheetVisible(false);
            // Navigate to add customer screen or show add customer modal
            Alert.alert("Add Customer", "This would navigate to the Add Customer screen");
          }}
        />
      </BottomSheet>
      
      {/* Product Selection Bottom Sheet */}
      <BottomSheet
        isVisible={isProductSheetVisible}
        onClose={() => setIsProductSheetVisible(false)}
        title="Select Product"
        height="70%"
      >
        <ProductSelector
          products={products}
          onSelectProduct={handleAddProduct}
          onAddNewProduct={() => {
            setIsProductSheetVisible(false);
            // Navigate to add product screen or show add product modal
            Alert.alert("Add Product", "This would navigate to the Add Product screen");
          }}
        />
      </BottomSheet>
      
      {/* Payment Status Bottom Sheet */}
      <BottomSheet
        isVisible={isPaymentStatusSheetVisible}
        onClose={() => setIsPaymentStatusSheetVisible(false)}
        title="Select Payment Status"
        height="30%"
      >
        <View style={styles.optionsList}>
          {PAYMENT_STATUSES.map(status => (
            <TouchableOpacity
              key={status.value}
              style={styles.optionItem}
              onPress={() => handleSelectPaymentStatus(status.value)}
            >
              <View style={styles.statusBadge}>
                <View 
                  style={[
                    styles.statusIndicator, 
                    { backgroundColor: getPaymentStatusColor(status.value) }
                  ]} 
                />
                <Text style={styles.optionText}>{status.label}</Text>
              </View>
              {paymentStatus === status.value && (
                <View style={styles.selectedIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
      
      {/* Payment Method Bottom Sheet */}
      <BottomSheet
        isVisible={isPaymentMethodSheetVisible}
        onClose={() => setIsPaymentMethodSheetVisible(false)}
        title="Select Payment Method"
        height="50%"
      >
        <View style={styles.optionsList}>
          {PAYMENT_METHODS.map(method => (
            <TouchableOpacity
              key={method}
              style={styles.optionItem}
              onPress={() => handleSelectPaymentMethod(method)}
            >
              <Text style={styles.optionText}>{method}</Text>
              {paymentMethod === method && (
                <View style={styles.selectedIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#ea4335",
  },
  errorText: {
    color: "#ea4335",
    fontSize: 12,
    marginTop: 4,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  selectButtonText: {
    fontSize: 16,
    color: "#999",
  },
  selectButtonValue: {
    fontSize: 16,
    color: "#333",
  },
  selectedCustomer: {
    flex: 1,
  },
  selectedCustomerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  selectedCustomerDetail: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyProducts: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    borderStyle: "dashed",
    backgroundColor: "#fafafa",
  },
  emptyProductsText: {
    fontSize: 15,
    color: "#666",
    marginBottom: 8,
  },
  productsList: {
    marginBottom: 16,
  },
  productItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  productInfo: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#666",
  },
  productActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: "center",
  },
  productTotalContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  productTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginRight: 12,
  },
  removeButton: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffebee",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  summarySection: {
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  currencyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  currencyIcon: {
    marginRight: 8,
  },
  currencyInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
    minHeight: 100,
  },
  bottomSpacer: {
    height: 40,
  },
  optionsList: {
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: "#333",
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  footerButtonTextPrimary: {
    color: '#fff',
  },
});