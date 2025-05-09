import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Package, 
  Plus, 
  Minus, 
  DollarSign,
  Save,
  X
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import Colors from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import { getPurchaseById } from "@/mocks/purchasesData";
import { PurchaseRecord, PurchaseItem as PurchaseItemType } from "@/types/purchases";

// Mock vendors for dropdown
const VENDORS = [
  { id: "1", name: "Supplier Co" },
  { id: "2", name: "Wholesale Distributors" },
  { id: "3", name: "Factory Direct" },
  { id: "4", name: "Industrial Supplies" },
  { id: "5", name: "Office Essentials" },
];

// Mock products for dropdown
const PRODUCTS = [
  { id: "1", name: "Office Chair", price: 129.99 },
  { id: "2", name: "Desk Lamp", price: 45.50 },
  { id: "3", name: "Laptop Stand", price: 35.99 },
  { id: "4", name: "Wireless Mouse", price: 24.99 },
  { id: "5", name: "Keyboard", price: 59.99 },
];

// Payment methods
const PAYMENT_METHODS = [
  "Cash",
  "Credit Card",
  "Bank Transfer",
  "Check",
  "PayPal",
];

// Payment statuses
const PAYMENT_STATUSES = [
  "paid",
  "pending",
  "overdue",
  "cancelled",
];

interface EditableItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function EditPurchaseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [purchase, setPurchase] = useState<PurchaseRecord | null>(null);
  
  const [poNumber, setPoNumber] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [total, setTotal] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [amountPaid, setAmountPaid] = useState("0");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch purchase data
  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        const purchaseData = getPurchaseById(id);
        if (purchaseData) {
          setPurchase(purchaseData);
          
          // Initialize form with purchase data
          setPoNumber(purchaseData.poNumber);
          setDate(new Date(purchaseData.date));
          setDueDate(purchaseData.dueDate ? new Date(purchaseData.dueDate) : new Date());
          
          // Find vendor ID by name (in a real app, you'd have the ID directly)
          const vendor = VENDORS.find(v => v.name === purchaseData.vendor);
          setSelectedVendor(vendor ? vendor.id : "");
          
          // Initialize items
          if (purchaseData.items && purchaseData.items.length > 0) {
            const editableItems = purchaseData.items.map(item => ({
              id: item.id,
              productId: item.id, // In a real app, you'd have the actual product ID
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            }));
            setItems(editableItems);
          }
          
          // Initialize payment info
          setPaymentStatus(purchaseData.status);
          setPaymentMethod(purchaseData.paymentMethod || "");
          setAmountPaid(purchaseData.amount.toString());
          
          // Initialize notes
          setNotes(purchaseData.notes || "");
          
          // Calculate totals
          setSubtotal(purchaseData.amount);
          setTotal(purchaseData.amount);
        }
        setIsLoading(false);
      }, 1000);
    }
  }, [id]);

  // Calculate totals whenever items, discount, or tax changes
  React.useEffect(() => {
    const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(itemsTotal);
    
    const discountAmount = parseFloat(discount) || 0;
    const taxAmount = parseFloat(tax) || 0;
    const calculatedTotal = itemsTotal - discountAmount + taxAmount;
    
    setTotal(calculatedTotal > 0 ? calculatedTotal : 0);
    setHasUnsavedChanges(true);
  }, [items, discount, tax]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setHasUnsavedChanges(true);
    }
  };

  const handleDueDateChange = (event: any, selectedDate?: Date) => {
    setShowDueDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
      setHasUnsavedChanges(true);
    }
  };

  const handleSelectVendor = (vendorId: string) => {
    setSelectedVendor(vendorId);
    setShowVendorDropdown(false);
    setHasUnsavedChanges(true);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProduct(productId);
    setShowProductDropdown(false);
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      Alert.alert("Error", "Please select a product");
      return;
    }

    const product = PRODUCTS.find(p => p.id === selectedProduct);
    if (!product) return;

    const qty = parseInt(quantity) || 1;
    const newItem: EditableItem = {
      id: `item-${Date.now()}`,
      productId: product.id,
      name: product.name,
      quantity: qty,
      unitPrice: product.price,
      total: product.price * qty,
    };

    setItems([...items, newItem]);
    setSelectedProduct("");
    setQuantity("1");
    setHasUnsavedChanges(true);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    setHasUnsavedChanges(true);
  };

  const handleSelectStatus = (status: string) => {
    setPaymentStatus(status);
    setShowStatusDropdown(false);
    setHasUnsavedChanges(true);
  };

  const handleSelectMethod = (method: string) => {
    setPaymentMethod(method);
    setShowMethodDropdown(false);
    setHasUnsavedChanges(true);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Discard Changes",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          {
            text: "Keep Editing",
            style: "cancel"
          },
          {
            text: "Discard",
            onPress: () => router.back(),
            style: "destructive"
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSubmit = () => {
    // Validate form
    if (!selectedVendor) {
      Alert.alert("Error", "Please select a vendor");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Error", "Please add at least one item");
      return;
    }

    if (paymentStatus === "paid" && (parseFloat(amountPaid) || 0) < total) {
      Alert.alert("Error", "Amount paid must equal the total for paid status");
      return;
    }

    if (paymentStatus === "partial" && (parseFloat(amountPaid) || 0) <= 0) {
      Alert.alert("Error", "Amount paid must be greater than zero for partial status");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Success",
        "Purchase record updated successfully",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          }
        ]
      );
    }, 1000);
  };

  const getVendorName = (id: string) => {
    const vendor = VENDORS.find(v => v.id === id);
    return vendor ? vendor.name : "Select Vendor";
  };

  const getProductName = (id: string) => {
    const product = PRODUCTS.find(p => p.id === id);
    return product ? product.name : "Select Product";
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Edit Purchase",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleCancel}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.editBanner}>
            <Text style={styles.editBannerText}>
              Editing Purchase Order: {poNumber}
            </Text>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Purchase Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Purchase Order Number</Text>
              <TextInput
                style={styles.input}
                value={poNumber}
                onChangeText={(text) => {
                  setPoNumber(text);
                  setHasUnsavedChanges(true);
                }}
                placeholder="PO-12345"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Purchase Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={16} color="#666" style={styles.inputIcon} />
                <Text style={styles.dateText}>
                  {date.toLocaleDateString()}
                </Text>
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
                <Calendar size={16} color="#666" style={styles.inputIcon} />
                <Text style={styles.dateText}>
                  {dueDate.toLocaleDateString()}
                </Text>
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
                style={styles.dropdownButton}
                onPress={() => setShowVendorDropdown(!showVendorDropdown)}
              >
                <User size={16} color="#666" style={styles.inputIcon} />
                <Text style={styles.dropdownButtonText}>
                  {selectedVendor ? getVendorName(selectedVendor) : "Select Vendor"}
                </Text>
              </TouchableOpacity>
              
              {showVendorDropdown && (
                <View style={styles.dropdownMenu}>
                  {VENDORS.map(vendor => (
                    <TouchableOpacity
                      key={vendor.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectVendor(vendor.id)}
                    >
                      <Text style={styles.dropdownItemText}>{vendor.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Items</Text>
            
            <View style={styles.itemsContainer}>
              {items.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDetails}>
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </Text>
                  </View>
                  <View style={styles.itemActions}>
                    <Text style={styles.itemTotal}>
                      {formatCurrency(item.total)}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeItemButton}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      <X size={16} color="#ea4335" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              
              <View style={styles.addItemContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Product</Text>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => setShowProductDropdown(!showProductDropdown)}
                  >
                    <Package size={16} color="#666" style={styles.inputIcon} />
                    <Text style={styles.dropdownButtonText}>
                      {selectedProduct ? getProductName(selectedProduct) : "Select Product"}
                    </Text>
                  </TouchableOpacity>
                  
                  {showProductDropdown && (
                    <View style={styles.dropdownMenu}>
                      {PRODUCTS.map(product => (
                        <TouchableOpacity
                          key={product.id}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectProduct(product.id)}
                        >
                          <Text style={styles.dropdownItemText}>
                            {product.name} - {formatCurrency(product.price)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                
                <View style={styles.quantityContainer}>
                  <Text style={styles.label}>Quantity</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => {
                        const current = parseInt(quantity) || 0;
                        if (current > 1) {
                          setQuantity((current - 1).toString());
                        }
                      }}
                    >
                      <Minus size={16} color="#666" />
                    </TouchableOpacity>
                    
                    <TextInput
                      style={styles.quantityInput}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                    />
                    
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => {
                        const current = parseInt(quantity) || 0;
                        setQuantity((current + 1).toString());
                      }}
                    >
                      <Plus size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={handleAddItem}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.addItemButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.totalsContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <View style={styles.totalInputContainer}>
                  <DollarSign size={16} color="#666" />
                  <TextInput
                    style={styles.totalInput}
                    value={discount}
                    onChangeText={(text) => {
                      setDiscount(text);
                      setHasUnsavedChanges(true);
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <View style={styles.totalInputContainer}>
                  <DollarSign size={16} color="#666" />
                  <TextInput
                    style={styles.totalInput}
                    value={tax}
                    onChangeText={(text) => {
                      setTax(text);
                      setHasUnsavedChanges(true);
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.totalRow}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Payment Status</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                </Text>
              </TouchableOpacity>
              
              {showStatusDropdown && (
                <View style={styles.dropdownMenu}>
                  {PAYMENT_STATUSES.map(status => (
                    <TouchableOpacity
                      key={status}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectStatus(status)}
                    >
                      <Text style={styles.dropdownItemText}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Payment Method</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowMethodDropdown(!showMethodDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {paymentMethod || "Select Payment Method"}
                </Text>
              </TouchableOpacity>
              
              {showMethodDropdown && (
                <View style={styles.dropdownMenu}>
                  {PAYMENT_METHODS.map(method => (
                    <TouchableOpacity
                      key={method}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectMethod(method)}
                    >
                      <Text style={styles.dropdownItemText}>{method}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {(paymentStatus === "paid" || paymentStatus === "partial") && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Amount Paid</Text>
                <View style={styles.amountInputContainer}>
                  <DollarSign size={16} color="#666" style={styles.amountInputIcon} />
                  <TextInput
                    style={styles.amountInput}
                    value={amountPaid}
                    onChangeText={(text) => {
                      setAmountPaid(text);
                      setHasUnsavedChanges(true);
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={styles.textArea}
                value={notes}
                onChangeText={(text) => {
                  setNotes(text);
                  setHasUnsavedChanges(true);
                }}
                placeholder="Add any additional notes here..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton,
                (!hasUnsavedChanges || isSubmitting) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={!hasUnsavedChanges || isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.saveButtonText}>Saving...</Text>
              ) : (
                <>
                  <Save size={16} color="#fff" />
                  <Text style={styles.saveButtonText}>Update Purchase</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  headerButton: {
    padding: 8,
  },
  editBanner: {
    backgroundColor: Colors.primary,
    padding: 12,
    alignItems: "center",
  },
  editBannerText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#333",
  },
  datePickerButton: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownButton: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  itemsContainer: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: "#666",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginRight: 12,
  },
  removeItemButton: {
    padding: 4,
  },
  addItemContainer: {
    marginTop: 16,
  },
  quantityContainer: {
    marginBottom: 16,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
  },
  quantityButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  quantityInput: {
    flex: 1,
    height: 48,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    textAlign: "center",
    fontSize: 16,
  },
  addItemButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  addItemButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  totalsContainer: {
    marginTop: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
  },
  totalValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  totalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    width: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  totalInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#333",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  amountInputIcon: {
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#333",
    minHeight: 100,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
  saveButton: {
    flex: 2,
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
});