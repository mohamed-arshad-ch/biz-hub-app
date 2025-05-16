import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Plus,
  Search,
  Trash,
  ChevronRight,
  X,
  Check
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Mock data for purchase orders
const purchaseOrderData = [
  {
    id: 'po-001',
    orderNumber: 'PO-2023-001',
    vendorId: 'v-001',
    vendorName: 'ABC Suppliers',
    orderDate: '2023-08-15',
    deliveryDate: '2023-09-15',
    subtotal: 750.00,
    tax: 75.00,
    total: 825.00,
    status: 'completed',
    items: [
      { id: 'item-001', productId: 'p-001', productName: 'Office Chair', quantity: 3, unitPrice: 150.00, total: 450.00 },
      { id: 'item-002', productId: 'p-002', productName: 'Desk Lamp', quantity: 6, unitPrice: 50.00, total: 300.00 }
    ]
  },
  {
    id: 'po-002',
    orderNumber: 'PO-2023-002',
    vendorId: 'v-002',
    vendorName: 'XYZ Electronics',
    orderDate: '2023-08-20',
    deliveryDate: '2023-09-20',
    subtotal: 1200.00,
    tax: 120.00,
    total: 1320.00,
    status: 'pending',
    items: [
      { id: 'item-003', productId: 'p-003', productName: 'Laptop', quantity: 1, unitPrice: 1200.00, total: 1200.00 }
    ]
  },
  {
    id: 'po-003',
    orderNumber: 'PO-2023-003',
    vendorId: 'v-003',
    vendorName: 'Office Supplies Co.',
    orderDate: '2023-08-10',
    deliveryDate: '2023-09-10',
    subtotal: 480.00,
    tax: 48.00,
    total: 528.00,
    status: 'processing',
    items: [
      { id: 'item-004', productId: 'p-004', productName: 'Printer Paper', quantity: 20, unitPrice: 10.00, total: 200.00 },
      { id: 'item-005', productId: 'p-005', productName: 'Ink Cartridges', quantity: 4, unitPrice: 70.00, total: 280.00 }
    ]
  },
  {
    id: 'po-004',
    orderNumber: 'PO-2023-004',
    vendorId: 'v-004',
    vendorName: 'Tech Gadgets Inc.',
    orderDate: '2023-08-25',
    deliveryDate: '2023-09-25',
    subtotal: 900.00,
    tax: 90.00,
    total: 990.00,
    status: 'pending',
    items: [
      { id: 'item-006', productId: 'p-006', productName: 'Wireless Headphones', quantity: 3, unitPrice: 150.00, total: 450.00 },
      { id: 'item-007', productId: 'p-007', productName: 'Smart Speaker', quantity: 3, unitPrice: 150.00, total: 450.00 }
    ]
  },
  {
    id: 'po-005',
    orderNumber: 'PO-2023-005',
    vendorId: 'v-005',
    vendorName: 'Furniture Warehouse',
    orderDate: '2023-07-30',
    deliveryDate: '2023-08-30',
    subtotal: 2500.00,
    tax: 250.00,
    total: 2750.00,
    status: 'cancelled',
    items: [
      { id: 'item-008', productId: 'p-008', productName: 'Conference Table', quantity: 1, unitPrice: 1500.00, total: 1500.00 },
      { id: 'item-009', productId: 'p-001', productName: 'Office Chair', quantity: 5, unitPrice: 200.00, total: 1000.00 }
    ]
  }
];

// Mock vendors data
const vendors = [
  { id: 'v-001', name: 'ABC Suppliers', email: 'contact@abcsuppliers.com', phone: '123-456-7890' },
  { id: 'v-002', name: 'XYZ Electronics', email: 'info@xyzelectronics.com', phone: '234-567-8901' },
  { id: 'v-003', name: 'Office Supplies Co.', email: 'sales@officesupplies.co', phone: '345-678-9012' },
  { id: 'v-004', name: 'Tech Gadgets Inc.', email: 'orders@techgadgets.com', phone: '456-789-0123' },
  { id: 'v-005', name: 'Furniture Warehouse', email: 'support@furniturewarehouse.com', phone: '567-890-1234' },
];

// Mock products data
const products = [
  { id: 'p-001', name: 'Office Chair', description: 'Ergonomic office chair with adjustable height', price: 150.00 },
  { id: 'p-002', name: 'Desk Lamp', description: 'LED desk lamp with adjustable brightness', price: 50.00 },
  { id: 'p-003', name: 'Laptop', description: '15-inch laptop with i7 processor', price: 1200.00 },
  { id: 'p-004', name: 'Printer Paper', description: 'A4 printer paper, 500 sheets', price: 10.00 },
  { id: 'p-005', name: 'Ink Cartridges', description: 'Black ink cartridge for HP printers', price: 70.00 },
  { id: 'p-006', name: 'Wireless Headphones', description: 'Noise-cancelling wireless headphones', price: 150.00 },
  { id: 'p-007', name: 'Smart Speaker', description: 'Smart speaker with voice assistant', price: 150.00 },
  { id: 'p-008', name: 'Conference Table', description: 'Large conference table for meetings', price: 1500.00 },
];

// Interface for Item
interface Item {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function EditPurchaseOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState<Item[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  // UI state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderDatePicker, setShowOrderDatePicker] = useState(false);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [searchVendor, setSearchVendor] = useState('');
  const [searchProduct, setSearchProduct] = useState('');

  useEffect(() => {
    // Fetch order data
    const fetchOrder = async () => {
      setLoading(true);
      try {
        // Simulate API call
        setTimeout(() => {
          const order = purchaseOrderData.find(o => o.id === id);
          if (order) {
            setOrderNumber(order.orderNumber);
            setVendorId(order.vendorId);
            setVendorName(order.vendorName);
            setOrderDate(new Date(order.orderDate));
            setDeliveryDate(new Date(order.deliveryDate));
            setStatus(order.status);
            setItems(order.items);
            setSubtotal(order.subtotal);
            setTax(order.tax);
            setTotal(order.total);
          }
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching order:', error);
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  useEffect(() => {
    // Calculate subtotal, tax and total
    const newSubtotal = items.reduce((acc, item) => acc + item.total, 0);
    const newTax = newSubtotal * 0.1; // 10% tax rate
    const newTotal = newSubtotal + newTax;

    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);
  }, [items]);

  const handleVendorSelect = (vendor: { id: string; name: string }) => {
    setVendorId(vendor.id);
    setVendorName(vendor.name);
    setShowVendorModal(false);
  };

  const handleAddProduct = (product: { id: string; name: string; price: number }) => {
    const newItem: Item = {
      id: `item-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      total: 1 * product.price,
    };
    setItems([...items, newItem]);
    setShowProductModal(false);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return;

    setItems(items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity,
          total: quantity * item.unitPrice,
        };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleStatusSelect = (newStatus: string) => {
    setStatus(newStatus);
    setShowStatusModal(false);
  };

  const handleSave = () => {
    // Validate form
    if (!vendorId) {
      Alert.alert('Error', 'Please select a vendor');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    // Create updated order object
    const updatedOrder = {
      id,
      orderNumber,
      vendorId,
      vendorName,
      orderDate: orderDate.toISOString().split('T')[0],
      deliveryDate: deliveryDate.toISOString().split('T')[0],
      subtotal,
      tax,
      total,
      status,
      items,
    };

    // Here you would typically call an API to update the order
    console.log('Updating order:', updatedOrder);
    Alert.alert('Success', 'Purchase order updated successfully');
    router.back();
  };

  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchVendor.toLowerCase())
  );

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'completed':
        return Colors.status.completed;
      case 'pending':
        return Colors.status.pending;
      case 'processing':
        return '#2196F3';
      case 'cancelled':
        return Colors.status.cancelled;
      default:
        return Colors.text.secondary;
    }
  };

  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Purchase Order</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Information</Text>
            <View style={styles.card}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Order Number</Text>
                <TextInput
                  style={styles.input}
                  value={orderNumber}
                  onChangeText={setOrderNumber}
                  placeholder="Enter order number"
                />
              </View>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.formField}
                onPress={() => setShowVendorModal(true)}
              >
                <Text style={styles.fieldLabel}>Vendor</Text>
                <View style={styles.selectedItem}>
                  <Text style={styles.fieldValue}>{vendorName}</Text>
                  <ChevronRight size={20} color={Colors.text.secondary} />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.formField}
                onPress={() => setShowOrderDatePicker(true)}
              >
                <Text style={styles.fieldLabel}>Order Date</Text>
                <View style={styles.selectedItem}>
                  <Text style={styles.fieldValue}>
                    {orderDate.toLocaleDateString()}
                  </Text>
                  <Calendar size={20} color={Colors.text.secondary} />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.formField}
                onPress={() => setShowDeliveryDatePicker(true)}
              >
                <Text style={styles.fieldLabel}>Delivery Date</Text>
                <View style={styles.selectedItem}>
                  <Text style={styles.fieldValue}>
                    {deliveryDate.toLocaleDateString()}
                  </Text>
                  <Calendar size={20} color={Colors.text.secondary} />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.formField}
                onPress={() => setShowStatusModal(true)}
              >
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.selectedItem}>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: `${getStatusColor(status)}20` }
                  ]}>
                    <Text style={[
                      styles.statusText, 
                      { color: getStatusColor(status) }
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </View>
                  <ChevronDown size={20} color={Colors.text.secondary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowProductModal(true)}
              >
                <Plus size={18} color={Colors.primary} />
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={[styles.card, styles.emptyItemsCard]}>
                <Text style={styles.emptyItemsText}>
                  No items added yet. Click "Add Item" to add products to this order.
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                {items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.itemContainer}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemName}>{item.productName}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveItem(item.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Trash size={18} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.itemFooter}>
                        <View style={styles.priceContainer}>
                          <Text style={styles.unitPrice}>
                            ${item.unitPrice.toFixed(2)} each
                          </Text>
                        </View>
                        <View style={styles.quantityContainer}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            <Text style={styles.quantityButtonText}>-</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={styles.quantityInput}
                            value={item.quantity.toString()}
                            onChangeText={(text) => {
                              const quantity = parseInt(text, 10);
                              if (!isNaN(quantity)) {
                                handleUpdateQuantity(item.id, quantity);
                              }
                            }}
                            keyboardType="numeric"
                          />
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Text style={styles.quantityButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.itemTotal}>
                        <Text style={styles.itemTotalText}>
                          ${item.total.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}
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
        </ScrollView>

        {/* Vendor Selection Modal */}
        <Modal
          visible={showVendorModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowVendorModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Vendor</Text>
                <TouchableOpacity
                  onPress={() => setShowVendorModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.searchContainer}>
                <Search size={20} color={Colors.text.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search vendors..."
                  value={searchVendor}
                  onChangeText={setSearchVendor}
                />
              </View>
              
              <FlatList
                data={filteredVendors}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleVendorSelect(item)}
                  >
                    <View>
                      <Text style={styles.modalItemTitle}>{item.name}</Text>
                      <Text style={styles.modalItemSubtitle}>{item.email}</Text>
                    </View>
                    <ChevronRight size={20} color={Colors.text.secondary} />
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
              />
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
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Product</Text>
                <TouchableOpacity
                  onPress={() => setShowProductModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.searchContainer}>
                <Search size={20} color={Colors.text.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search products..."
                  value={searchProduct}
                  onChangeText={setSearchProduct}
                />
              </View>
              
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleAddProduct(item)}
                  >
                    <View>
                      <Text style={styles.modalItemTitle}>{item.name}</Text>
                      <Text style={styles.modalItemSubtitle}>${item.price.toFixed(2)}</Text>
                    </View>
                    <Plus size={20} color={Colors.primary} />
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
              />
            </View>
          </View>
        </Modal>

        {/* Status Selection Modal */}
        <Modal
          visible={showStatusModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, styles.statusModalContent]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Status</Text>
                <TouchableOpacity
                  onPress={() => setShowStatusModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={statuses}
                keyExtractor={(item) => item.value}
                contentContainerStyle={styles.modalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.statusItem}
                    onPress={() => handleStatusSelect(item.value)}
                  >
                    <View style={styles.statusItemContent}>
                      <View style={[
                        styles.statusItemBadge,
                        { backgroundColor: `${getStatusColor(item.value)}20` }
                      ]}>
                        <Text style={[
                          styles.statusItemText,
                          { color: getStatusColor(item.value) }
                        ]}>
                          {item.label}
                        </Text>
                      </View>
                      {status === item.value && (
                        <Check size={20} color={Colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
              />
            </View>
          </View>
        </Modal>

        {/* Date Pickers */}
        {showOrderDatePicker && (
          <DateTimePicker
            value={orderDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowOrderDatePicker(false);
              if (selectedDate) {
                setOrderDate(selectedDate);
              }
            }}
          />
        )}

        {showDeliveryDatePicker && (
          <DateTimePicker
            value={deliveryDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDeliveryDatePicker(false);
              if (selectedDate) {
                setDeliveryDate(selectedDate);
              }
            }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
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
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.background.default,
    borderRadius: 16,
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
  formField: {
    marginBottom: 4,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: Colors.text.primary,
    padding: 0,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  emptyItemsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyItemsText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: '80%',
  },
  itemContainer: {
    paddingVertical: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    flex: 1,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flex: 1,
  },
  unitPrice: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  quantityInput: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  statusModalContent: {
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  modalList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
  },
  statusItem: {
    paddingVertical: 12,
  },
  statusItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusItemBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 