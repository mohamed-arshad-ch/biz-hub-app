import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  StatusBar, 
  KeyboardAvoidingView, 
  Platform,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Hash, 
  FileText, 
  Plus, 
  Minus, 
  Package, 
  ChevronDown, 
  Check,
  Search,
  X,
  DollarSign,
  Printer
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { createSalesOrder } from '@/db/sales-order';
import { getAllCustomers } from '@/db/customer';
import { getAllProducts } from '@/db/product';
import type { Customer } from '@/db/schema';
import type { Product } from '@/db/schema';
import type { NewSalesOrder, NewSalesOrderItem } from '@/db/schema';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { desc } from 'drizzle-orm';
import { formatCurrency } from '@/utils/currency';

interface OrderItem {
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discount: number;
  tax: number;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function NewSalesOrderScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('draft');

  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });

  useEffect(() => {
    loadData();
    autoGenerateOrderNumber();
  }, []);

  const loadData = async () => {
    try {
      if (!user) return;
      const [fetchedCustomers, fetchedProducts] = await Promise.all([
        getAllCustomers(),
        getAllProducts()
      ]);
      setCustomers(fetchedCustomers);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load customers and products');
    }
  };

  // Auto-generate order number with prefix SO-
  const autoGenerateOrderNumber = async () => {
    try {
      // Get the latest order number
      const latestOrder = await db.select().from(schema.salesOrders).orderBy(desc(schema.salesOrders.id)).limit(1).get();
      let nextNumber = 1;
      if (latestOrder && latestOrder.orderNumber) {
        const match = latestOrder.orderNumber.match(/SO-(\d+)/);
        if (match && match[1]) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      const nextOrderNumber = `SO-${nextNumber.toString().padStart(4, '0')}`;
      setOrderNumber((prev) => prev || nextOrderNumber);
    } catch (err) {
      setOrderNumber((prev) => prev || 'SO-0001');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!user || !selectedCustomer) {
        Alert.alert('Error', 'Please select a customer');
        return;
      }

      if (orderItems.length === 0) {
        Alert.alert('Error', 'Please add at least one item');
        return;
      }

      setSaving(true);

      const order: NewSalesOrder = {
        userId: user.id,
        customerId: selectedCustomer.id,
        orderNumber: orderNumber || `SO-${Date.now()}`,
        orderDate,
        status: status,
        total: Math.round(calculateOrderTotal() * 100),
        subtotal: Math.round(orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * 100),
        tax: Math.round(orderItems.reduce((sum, item) => sum + ((item.quantity * item.unitPrice - (item.quantity * item.unitPrice * item.discount / 100)) * item.tax / 100), 0) * 100),
        discount: Math.round(orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.discount / 100), 0) * 100),
        notes
      };

      const items = orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Math.round(item.unitPrice * 100),
        total: Math.round(item.total * 100),
        discount: Math.round(item.discount * 100),
        tax: Math.round(item.tax * 100)
      }));

      await createSalesOrder(order, items as any);
      Alert.alert('Success', 'Sales order created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating sales order:', error);
      Alert.alert('Error', 'Failed to create sales order');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Printing sales order...');
    // Printing logic would go here
  };

  // Bottom sheet visibility states
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showProductSheet, setShowProductSheet] = useState<number | null>(null);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  
  // Customer data state
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Product data state
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(customerSearch.toLowerCase())) ||
    (customer.phone && customer.phone.includes(customerSearch))
  );
  
  // Filter products based on search
  const filteredProducts = products.filter(product => 
    product.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // Load customers when bottom sheet is opened
  useEffect(() => {
    if (showCustomerSheet) {
      loadCustomers();
    }
  }, [showCustomerSheet]);

  // Load products when bottom sheet is opened
  useEffect(() => {
    if (showProductSheet !== null) {
      loadProducts();
    }
  }, [showProductSheet]);

  const loadCustomers = async () => {
    if (!user) return;
    try {
      setLoadingCustomers(true);
      const dbCustomers = await getAllCustomers();
      const mappedCustomers: Customer[] = dbCustomers.map(c => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        company: c.company,
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city,
        state: c.state,
        zipCode: c.zipCode,
        country: c.country,
        contactPerson: c.contactPerson,
        category: c.category,
        status: c.status,
        notes: c.notes,
        creditLimit: c.creditLimit,
        paymentTerms: c.paymentTerms,
        taxId: c.taxId,
        tags: c.tags,
        outstandingBalance: c.outstandingBalance,
        totalPurchases: c.totalPurchases,
        createdAt: c.createdAt
      }));
      setCustomers(mappedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('Error', 'Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadProducts = async () => {
    if (!user) return;
    try {
      setLoadingProducts(true);
      const dbProducts = await getAllProducts();
      const mappedProducts: Product[] = dbProducts.map(p => ({
        id: p.id,
        userId: p.userId,
        productName: p.productName,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category,
        brand: p.brand,
        isActive: p.isActive ?? true,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        taxRate: p.taxRate,
        stockQuantity: p.stockQuantity,
        unit: p.unit,
        reorderLevel: p.reorderLevel,
        vendor: p.vendor,
        location: p.location,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        weight: p.weight,
        length: p.length,
        width: p.width,
        height: p.height,
        tags: p.tags,
        notes: p.notes,
        images: p.images,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      {
        productId: 0,
        quantity: 1,
        unitPrice: 0,
        total: 0,
        discount: 0,
        tax: 0
      }
    ]);
  };
  
  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: number) => {
    const newItems = [...orderItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };

    // Recalculate total
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount' || field === 'tax') {
      const item = newItems[index];
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = (subtotal * item.discount) / 100;
      const taxAmount = ((subtotal - discountAmount) * item.tax) / 100;
      newItems[index].total = Math.round(subtotal - discountAmount + taxAmount);
    }

    setOrderItems(newItems);
  };
  
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSheet(false);
    setCustomerSearch('');
  };
  
  const selectProduct = (index: number, selectedProduct: Product) => {
    const newItems = [...orderItems];
    newItems[index] = {
      ...newItems[index],
      productId: selectedProduct.id,
      productName: selectedProduct.productName,
      unitPrice: selectedProduct.sellingPrice,
      total: selectedProduct.sellingPrice * newItems[index].quantity
    };
    setOrderItems(newItems);
    setShowProductSheet(null);
    setProductSearch('');
  };
  
  const selectStatus = (status: string) => {
    setStatus(status);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'processing':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'draft':
        return { bg: 'rgba(0, 122, 255, 0.1)', text: '#007AFF' };
      case 'cancelled':
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.status.cancelled };
      default:
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.text.secondary };
    }
  };
  
  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.sheetItem}
      onPress={() => selectCustomer(item)}
    >
      <View style={styles.customerItemContent}>
        <Text style={styles.customerName}>{item.name}</Text>
        {item.company && (
          <Text style={styles.customerCompany}>{item.company}</Text>
        )}
      </View>
      {selectedCustomer?.id === item.id && (
        <Check size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );
  
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.sheetItem}
      onPress={() => selectProduct(showProductSheet!, item)}
    >
      <View style={styles.productItemContent}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.productSku}>SKU: {item.sku}</Text>
      </View>
      <Text style={styles.productPrice}>{formatCurrency(item.sellingPrice)}</Text>
    </TouchableOpacity>
  );

  // Get currency symbol from formatCurrency utility
  const getCurrencySymbol = () => {
    // Extract just the symbol from a formatted amount
    const formatted = formatCurrency(0);
    // The symbol is typically at the beginning or end
    const symbol = formatted.replace(/[\d,.]/g, '').trim();
    return symbol;
  };

  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Sales Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Information</Text>
            
            {/* Order Number */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Hash size={16} color={Colors.text.secondary} />
                <Text style={styles.label}>Order Number <Text style={styles.required}>*</Text></Text>
              </View>
              <View style={styles.inputControl}>
                <TextInput
                  style={styles.input}
                  value={orderNumber}
                  onChangeText={setOrderNumber}
                  placeholder="Auto-generated"
                />
              </View>
            </View>
            
            {/* Order Date */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Calendar size={16} color={Colors.text.secondary} />
                <Text style={styles.label}>Order Date <Text style={styles.required}>*</Text></Text>
              </View>
              <TouchableOpacity style={styles.inputControl}>
                <TextInput
                  style={styles.input}
                  value={orderDate}
                  onChangeText={setOrderDate}
                  placeholder="YYYY-MM-DD"
                />
              </TouchableOpacity>
            </View>
            
            {/* Customer */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <User size={16} color={Colors.text.secondary} />
                <Text style={styles.label}>Customer <Text style={styles.required}>*</Text></Text>
              </View>
              <TouchableOpacity 
                style={styles.selectControl}
                onPress={() => setShowCustomerSheet(true)}
              >
                {selectedCustomer ? (
                  <Text style={styles.selectText}>{selectedCustomer.name}</Text>
                ) : (
                  <Text style={styles.placeholderText}>Select Customer</Text>
                )}
                <ChevronDown size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Order Status */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Check size={16} color={Colors.text.secondary} />
                <Text style={styles.label}>Status</Text>
              </View>
              <TouchableOpacity 
                style={styles.selectControl}
                onPress={() => setShowStatusSheet(true)}
              >
                <Text style={styles.selectText}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
                <ChevronDown size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Items</Text>
            
            {orderItems.length > 0 ? (
              <View style={styles.itemList}>
                {orderItems.map((item, index) => (
                  <View key={index} style={styles.itemCard}>
                    <View style={styles.itemCardHeader}>
                      <View style={styles.itemTitleContainer}>
                        <Package size={16} color={Colors.text.secondary} style={{ marginRight: 8 }} />
                        <TouchableOpacity 
                          style={{flex: 1}} 
                          onPress={() => setShowProductSheet(index)}
                        >
                          {item.productName ? (
                            <Text style={styles.itemCardTitle}>{item.productName}</Text>
                          ) : (
                            <Text style={styles.placeholderText}>Select Product</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity 
                        style={styles.itemCardRemove}
                        onPress={() => handleRemoveItem(index)}
                      >
                        <X size={18} color={Colors.negative} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.itemDetailsRow}>
                      <View style={styles.itemDetailColumn}>
                        <Text style={styles.itemDetailLabel}>Quantity</Text>
                        <View style={styles.itemDetailInputContainer}>
                          <TextInput
                            style={styles.itemDetailInput}
                            value={item.quantity.toString()}
                            onChangeText={(value) => handleItemChange(index, 'quantity', Number(value) || 0)}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                      
                      <View style={styles.itemDetailColumn}>
                        <Text style={styles.itemDetailLabel}>Unit Price</Text>
                        <View style={styles.itemDetailInputContainer}>
                          <View style={styles.currencyInputWrapper}>
                            <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
                            <TextInput
                              style={styles.itemDetailInput}
                              value={item.unitPrice.toString()}
                              onChangeText={(value) => handleItemChange(index, 'unitPrice', Number(value) || 0)}
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.itemDetailColumn}>
                        <Text style={styles.itemDetailLabel}>Total</Text>
                        <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyItems}>
                <Text style={styles.emptyText}>No items added yet</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddItem}
            >
              <Plus size={18} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
            
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>{formatCurrency(calculateOrderTotal())}</Text>
            </View>
          </View>
          
          {/* Notes */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Additional Information</Text>
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <FileText size={16} color={Colors.text.secondary} />
                <Text style={styles.label}>Notes</Text>
              </View>
              <View style={styles.textareaControl}>
                <TextInput
                  style={styles.textarea}
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes about this order"
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
          
          {/* Space for footer */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Sticky Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, styles.printButton]}
            onPress={handlePrint}
          >
            <Printer size={20} color={Colors.primary} />
            <Text style={styles.printButtonText}>Print</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.footerButton, styles.saveButton]}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Order'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Customer Modal */}
      <Modal
        visible={showCustomerSheet}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowCustomerSheet(false);
          setCustomerSearch('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Customer</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowCustomerSheet(false);
                  setCustomerSearch('');
                }}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search customers..."
                value={customerSearch}
                onChangeText={setCustomerSearch}
              />
              {customerSearch ? (
                <TouchableOpacity onPress={() => setCustomerSearch('')}>
                  <X size={18} color={Colors.text.secondary} />
                </TouchableOpacity>
              ) : null}
            </View>
            
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCustomerItem}
              contentContainerStyle={styles.bottomSheetContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No customers found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal
        visible={showStatusSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStatusSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusSheet(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={STATUS_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.sheetItem}
                  onPress={() => {
                    selectStatus(item.value);
                    setShowStatusSheet(false);
                  }}
                >
                  <Text style={styles.sheetItemText}>{item.label}</Text>
                  {status === item.value && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.bottomSheetContent}
            />
          </View>
        </View>
      </Modal>

      {/* Product Modal */}
      {showProductSheet !== null && (
        <Modal
          visible={showProductSheet !== null}
          animationType="slide"
          transparent
          onRequestClose={() => {
            setShowProductSheet(null);
            setProductSearch('');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Select Product</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowProductSheet(null);
                    setProductSearch('');
                  }}
                >
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
                {productSearch ? (
                  <TouchableOpacity onPress={() => setProductSearch('')}>
                    <X size={18} color={Colors.text.secondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
              
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderProductItem}
                contentContainerStyle={styles.bottomSheetContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No products found</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.default,
    zIndex: 10,
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: Colors.background.default,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 8,
  },
  required: {
    color: Colors.negative,
  },
  inputControl: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text.primary,
  },
  selectControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.background.secondary,
  },
  selectText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.text.tertiary,
  },
  itemList: {
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemCardTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
    flex: 1,
  },
  itemCardRemove: {
    padding: 4,
  },
  itemDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetailColumn: {
    flex: 1,
  },
  itemDetailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  itemDetailInputContainer: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 6,
    backgroundColor: Colors.background.default,
  },
  itemDetailInput: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyItems: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  textareaControl: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  textarea: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '60%',
    paddingBottom: 20,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 8,
  },
  sheetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sheetItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.default,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  printButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  printButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  customerItemContent: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  customerCompany: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  productItemContent: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  productSku: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  currencyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 8,
  },
}); 