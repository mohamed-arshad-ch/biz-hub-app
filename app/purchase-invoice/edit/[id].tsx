import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Alert,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Plus,
  Trash,
  X,
  Save,
  Search
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// This would typically come from your API or state management
const purchaseInvoiceData = [
  {
    id: 'pi-001',
    invoiceNumber: 'PI-2023-001',
    vendorId: 'v-001',
    vendorName: 'ABC Suppliers',
    invoiceDate: '2023-08-15',
    dueDate: '2023-09-15',
    subtotal: 750.00,
    tax: 75.00,
    total: 825.00,
    status: 'paid',
    items: [
      { id: 'item-001', productId: 'p1', productName: 'Office Chair', quantity: 3, unitPrice: 150.00, total: 450.00 },
      { id: 'item-002', productId: 'p2', productName: 'Desk Lamp', quantity: 6, unitPrice: 50.00, total: 300.00 }
    ]
  },
  {
    id: 'pi-002',
    invoiceNumber: 'PI-2023-002',
    vendorId: 'v-002',
    vendorName: 'XYZ Electronics',
    invoiceDate: '2023-08-20',
    dueDate: '2023-09-20',
    subtotal: 1200.00,
    tax: 120.00,
    total: 1320.00,
    status: 'unpaid',
    items: [
      { id: 'item-003', productId: 'p3', productName: 'Laptop', quantity: 1, unitPrice: 1200.00, total: 1200.00 }
    ]
  }
];

// Mock vendors data
const vendorsData = [
  { id: 'v-001', name: 'ABC Suppliers', email: 'info@abcsuppliers.com', phone: '123-456-7890' },
  { id: 'v-002', name: 'XYZ Electronics', email: 'contact@xyzelectronics.com', phone: '987-654-3210' },
  { id: 'v-003', name: 'Office Supplies Co.', email: 'sales@officesupplies.com', phone: '555-123-4567' },
  { id: 'v-004', name: 'Tech Gadgets Inc.', email: 'support@techgadgets.com', phone: '333-222-1111' },
  { id: 'v-005', name: 'Furniture Warehouse', email: 'orders@furniturewarehouse.com', phone: '444-555-6666' },
];

// Mock products data
const productsData = [
  { id: 'p1', name: 'Office Chair', price: 150.00, description: 'Ergonomic office chair' },
  { id: 'p2', name: 'Desk Lamp', price: 50.00, description: 'LED desk lamp' },
  { id: 'p3', name: 'Laptop', price: 1200.00, description: 'Business laptop' },
  { id: 'p4', name: 'Printer Paper', price: 10.00, description: 'A4 printer paper (500 sheets)' },
  { id: 'p5', name: 'Ink Cartridges', price: 70.00, description: 'Printer ink cartridges' },
  { id: 'p6', name: 'Wireless Headphones', price: 150.00, description: 'Noise cancelling headphones' },
  { id: 'p7', name: 'Smart Speaker', price: 150.00, description: 'Bluetooth smart speaker' },
  { id: 'p8', name: 'Conference Table', price: 1500.00, description: 'Large conference table' },
  { id: 'p9', name: 'Office Chair Deluxe', price: 200.00, description: 'Premium ergonomic office chair' },
];

// Status options
const statusOptions = [
  { id: 'paid', label: 'Paid', color: Colors.status.completed },
  { id: 'unpaid', label: 'Unpaid', color: Colors.status.pending },
  { id: 'overdue', label: 'Overdue', color: '#FF3B30' },
  { id: 'cancelled', label: 'Cancelled', color: Colors.status.cancelled },
];

interface Item {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  items: Item[];
}

export default function EditPurchaseInvoiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  // Modal states
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  
  // Search states
  const [vendorSearch, setVendorSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    // Simulate API fetch
    const fetchInvoice = () => {
      setLoading(true);
      setTimeout(() => {
        const foundInvoice = purchaseInvoiceData.find(i => i.id === id);
        if (foundInvoice) {
          setInvoice(foundInvoice);
          // Set form values from invoice
          setInvoiceNumber(foundInvoice.invoiceNumber);
          setVendorId(foundInvoice.vendorId);
          setVendorName(foundInvoice.vendorName);
          setInvoiceDate(foundInvoice.invoiceDate);
          setDueDate(foundInvoice.dueDate);
          setStatus(foundInvoice.status);
          setItems([...foundInvoice.items]);
          setSubtotal(foundInvoice.subtotal);
          setTax(foundInvoice.tax);
          setTotal(foundInvoice.total);
        }
        setLoading(false);
      }, 500);
    };

    fetchInvoice();
  }, [id]);

  // Calculate totals whenever items change
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(newSubtotal);
    // Assuming 10% tax rate, but you could make this configurable
    const newTax = parseFloat((newSubtotal * 0.1).toFixed(2));
    setTax(newTax);
    setTotal(newSubtotal + newTax);
  }, [items]);

  const handleSelectVendor = (vendor: any) => {
    setVendorId(vendor.id);
    setVendorName(vendor.name);
    setVendorModalVisible(false);
  };

  const handleSelectProduct = (product: any) => {
    if (selectedItemIndex !== null) {
      // Edit existing item
      const updatedItems = [...items];
      const quantity = updatedItems[selectedItemIndex]?.quantity || 1;
      const total = quantity * product.price;
      updatedItems[selectedItemIndex] = {
        id: updatedItems[selectedItemIndex]?.id || `item-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        unitPrice: product.price,
        total: total
      };
      setItems(updatedItems);
    } else {
      // Add new item
      const newItem = {
        id: `item-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price
      };
      setItems([...items, newItem]);
    }
    setProductModalVisible(false);
    setSelectedItemIndex(null);
  };

  const handleUpdateQuantity = (index: number, quantity: string) => {
    const parsedQuantity = parseInt(quantity) || 0;
    const updatedItems = [...items];
    const item = updatedItems[index];
    const total = parsedQuantity * item.unitPrice;
    updatedItems[index] = {
      ...item,
      quantity: parsedQuantity,
      total: total
    };
    setItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const handleSaveInvoice = () => {
    // Validation
    if (!invoiceNumber) {
      Alert.alert('Error', 'Please enter an invoice number');
      return;
    }
    if (!vendorId) {
      Alert.alert('Error', 'Please select a vendor');
      return;
    }
    if (!invoiceDate) {
      Alert.alert('Error', 'Please select an invoice date');
      return;
    }
    if (!dueDate) {
      Alert.alert('Error', 'Please select a due date');
      return;
    }
    if (!status) {
      Alert.alert('Error', 'Please select a status');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    // Here you would typically call an API to save the invoice
    Alert.alert(
      'Success',
      'Invoice updated successfully',
      [
        {
          text: 'OK',
          onPress: () => router.push(`/purchase-invoice/${id}`)
        }
      ]
    );
  };

  const filteredVendors = vendorsData.filter(vendor => 
    vendor.name.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const filteredProducts = productsData.filter(product => 
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading invoice...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <Text style={styles.errorText}>Invoice not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Purchase Invoice</Text>
        <TouchableOpacity onPress={handleSaveInvoice} style={styles.headerButton}>
          <Save size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Invoice Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Information</Text>
          <View style={styles.card}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Invoice Number</Text>
              <TextInput
                style={styles.input}
                value={invoiceNumber}
                onChangeText={setInvoiceNumber}
                placeholder="Enter invoice number"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Vendor</Text>
              <TouchableOpacity 
                style={styles.selectInput}
                onPress={() => setVendorModalVisible(true)}
              >
                <Text style={vendorName ? styles.selectText : styles.placeholderText}>
                  {vendorName || 'Select Vendor'}
                </Text>
                <ChevronDown size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Invoice Date</Text>
                <TouchableOpacity 
                  style={styles.selectInput}
                  onPress={() => {
                    // In a real app, show a date picker here
                    Alert.alert('Date Picker', 'Show date picker here');
                  }}
                >
                  <Text style={invoiceDate ? styles.selectText : styles.placeholderText}>
                    {invoiceDate ? new Date(invoiceDate).toLocaleDateString() : 'Select Date'}
                  </Text>
                  <Calendar size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Due Date</Text>
                <TouchableOpacity 
                  style={styles.selectInput}
                  onPress={() => {
                    // In a real app, show a date picker here
                    Alert.alert('Date Picker', 'Show date picker here');
                  }}
                >
                  <Text style={dueDate ? styles.selectText : styles.placeholderText}>
                    {dueDate ? new Date(dueDate).toLocaleDateString() : 'Select Date'}
                  </Text>
                  <Calendar size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <TouchableOpacity 
                style={styles.selectInput}
                onPress={() => setStatusModalVisible(true)}
              >
                <View style={styles.statusContainer}>
                  {status && (
                    <View 
                      style={[
                        styles.statusDot, 
                        { backgroundColor: statusOptions.find(opt => opt.id === status)?.color || Colors.text.secondary }
                      ]} 
                    />
                  )}
                  <Text style={status ? styles.selectText : styles.placeholderText}>
                    {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Select Status'}
                  </Text>
                </View>
                <ChevronDown size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Invoice Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Items</Text>
          <View style={styles.card}>
            {items.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No items added yet</Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={item.id} style={styles.itemContainer}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                      <Trash size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.itemDetails}>
                    <View style={styles.quantityContainer}>
                      <Text style={styles.itemLabel}>Quantity</Text>
                      <TextInput
                        style={styles.quantityInput}
                        value={item.quantity.toString()}
                        onChangeText={(value) => handleUpdateQuantity(index, value)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.itemLabel}>Unit Price</Text>
                      <Text style={styles.priceText}>${item.unitPrice.toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalContainer}>
                      <Text style={styles.itemLabel}>Total</Text>
                      <Text style={styles.totalText}>${item.total.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity 
              style={styles.addItemButton}
              onPress={() => {
                setSelectedItemIndex(null);
                setProductModalVisible(true);
              }}
            >
              <Plus size={20} color="#FFF" />
              <Text style={styles.addItemButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (10%)</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRowTotal}>
              <Text style={styles.summaryLabelTotal}>Total</Text>
              <Text style={styles.summaryValueTotal}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveInvoice}
        >
          <Save size={20} color="#FFF" />
          <Text style={styles.saveButtonText}>Save Invoice</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Vendor Selection Modal */}
      <Modal
        visible={vendorModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vendor</Text>
              <TouchableOpacity onPress={() => setVendorModalVisible(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search vendors..."
                value={vendorSearch}
                onChangeText={setVendorSearch}
              />
            </View>

            <ScrollView style={styles.modalList}>
              {filteredVendors.length === 0 ? (
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>No vendors found</Text>
                </View>
              ) : (
                filteredVendors.map(vendor => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={styles.listItem}
                    onPress={() => handleSelectVendor(vendor)}
                  >
                    <View>
                      <Text style={styles.listItemTitle}>{vendor.name}</Text>
                      <Text style={styles.listItemSubtitle}>{vendor.email}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Selection Modal */}
      <Modal
        visible={productModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => {
                setProductModalVisible(false);
                setSelectedItemIndex(null);
              }}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                value={productSearch}
                onChangeText={setProductSearch}
              />
            </View>

            <ScrollView style={styles.modalList}>
              {filteredProducts.length === 0 ? (
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>No products found</Text>
                </View>
              ) : (
                filteredProducts.map(product => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.listItem}
                    onPress={() => handleSelectProduct(product)}
                  >
                    <View>
                      <Text style={styles.listItemTitle}>{product.name}</Text>
                      <Text style={styles.listItemSubtitle}>${product.price.toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        visible={statusModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              {statusOptions.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.listItem}
                  onPress={() => {
                    setStatus(option.id);
                    setStatusModalVisible(false);
                  }}
                >
                  <View style={styles.statusListItem}>
                    <View style={[styles.statusColorDot, { backgroundColor: option.color }]} />
                    <Text style={styles.listItemTitle}>{option.label}</Text>
                  </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text.primary,
  },
  selectInput: {
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  itemContainer: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    flex: 1,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {
    flex: 1,
  },
  priceContainer: {
    flex: 1,
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    width: 60,
  },
  priceText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  addItemButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontWeight: '600',
    color: Colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 8,
  },
  modalList: {
    maxHeight: '70%',
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  listItemTitle: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  statusListItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
}); 