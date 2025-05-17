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
  DollarSign
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { createSalesOrder } from '@/db/sales-order';
import { getAllCustomers } from '@/db/customer';
import { getAllProducts } from '@/db/product';
import type { Customer } from '@/db/schema';
import type { Product } from '@/db/schema';
import type { NewSalesOrder, NewSalesOrderItem } from '@/db/schema';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { desc } from 'drizzle-orm';

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

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

      setLoading(true);

      const order: NewSalesOrder = {
        userId: user.id,
        customerId: selectedCustomer.id,
        orderNumber: orderNumber || `SO-${Date.now()}`,
        orderDate,
        status: 'draft',
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
      setLoading(false);
    }
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
    // Implement status selection logic
    setShowStatusSheet(false);
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
      <Text style={styles.productPrice}>${item.sellingPrice.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right','bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Sales Order</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <User size={16} color={Colors.primary} style={styles.labelIcon} />
              <Text style={styles.label}>Customer <Text style={{ color: Colors.primary }}>*</Text></Text>
            </View>
            <TouchableOpacity 
              style={styles.selectContainer}
              onPress={() => setShowCustomerSheet(true)}
            >
              <Text style={[
                styles.selectText, 
                !selectedCustomer && styles.placeholderText
              ]}>
                {selectedCustomer?.name || 'Select customer'}
              </Text>
              <ChevronDown size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Hash size={16} color={Colors.primary} style={styles.labelIcon} />
              <Text style={styles.label}>Order Number <Text style={{ color: Colors.primary }}>*</Text></Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={orderNumber}
                onChangeText={(value) => setOrderNumber(value)}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Calendar size={16} color={Colors.primary} style={styles.labelIcon} />
              <Text style={styles.label}>Order Date <Text style={{ color: Colors.primary }}>*</Text></Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={orderDate}
                onChangeText={(value) => setOrderDate(value)}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddItem}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
          
          {orderItems.length === 0 ? (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>No items added yet</Text>
            </View>
          ) : (
            orderItems.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemFormGroup}>
                  <View style={styles.labelContainer}>
                    <Package size={16} color={Colors.primary} style={styles.labelIcon} />
                    <Text style={styles.label}>Product <Text style={{ color: Colors.primary }}>*</Text></Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.selectContainer}
                    onPress={() => {
                      setShowProductSheet(index);
                      setProductSearch('');
                    }}
                  >
                    <Text style={[
                      styles.selectText, 
                      !item.productId && styles.placeholderText
                    ]}>
                      {item.productName || 'Select product'}
                    </Text>
                    <ChevronDown size={18} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.itemDetails}>
                  <View style={styles.itemFormGroup}>
                    <Text style={styles.label}>Quantity <Text style={{ color: Colors.primary }}>*</Text></Text>
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => {
                          if (item.quantity > 1) {
                            handleItemChange(index, 'quantity', item.quantity - 1);
                          }
                        }}
                      >
                        <Minus size={16} color={Colors.text.secondary} />
                      </TouchableOpacity>
                      <TextInput
                        style={styles.quantityInput}
                        value={item.quantity.toString()}
                        onChangeText={(value) => handleItemChange(index, 'quantity', parseInt(value) || 0)}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => handleItemChange(index, 'quantity', item.quantity + 1)}
                      >
                        <Plus size={16} color={Colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.itemFormGroup}>
                    <Text style={styles.label}>Unit Price <Text style={{ color: Colors.primary }}>*</Text></Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={item.unitPrice.toString()}
                        onChangeText={(value) => handleItemChange(index, 'unitPrice', parseFloat(value) || 0)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
                
                <View style={styles.itemFooter}>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(index)}
                  >
                    <Minus size={14} color={Colors.negative} />
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                  <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
                </View>
              </View>
            ))
          )}
          
          {orderItems.length > 0 && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${orderItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (10%)</Text>
                <Text style={styles.summaryValue}>${orderItems.reduce((sum, item) => sum + ((item.quantity * item.unitPrice - (item.quantity * item.unitPrice * item.discount / 100)) * item.tax / 100), 0).toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${orderItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.card}>
          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Status</Text>
            </View>
            <TouchableOpacity 
              style={styles.selectContainer}
              onPress={() => setShowStatusSheet(true)}
            >
              <View style={[styles.statusIndicator, { 
                backgroundColor: getStatusColor('draft').bg
              }]}>
                <Text style={[styles.statusIndicatorText, { 
                  color: getStatusColor('draft').text
                }]}>
                  {STATUS_OPTIONS.find(option => option.value === 'draft')?.label}
                </Text>
              </View>
              <ChevronDown size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <FileText size={16} color={Colors.primary} style={styles.labelIcon} />
              <Text style={styles.label}>Notes</Text>
            </View>
            <View style={styles.textareaContainer}>
              <TextInput
                style={styles.textarea}
                placeholder="Add notes or details about this order"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                value={notes}
                onChangeText={(value) => setNotes(value)}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Customer selection bottom sheet */}
      <Modal
        visible={showCustomerSheet}
        animationType="slide"
        transparent={true}
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
            
            {loadingCustomers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderCustomerItem}
                contentContainerStyle={styles.bottomSheetContent}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No customers found</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Product selection bottom sheet */}
      <Modal
        visible={showProductSheet !== null}
        animationType="slide"
        transparent={true}
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
            
            {loadingProducts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderProductItem}
                contentContainerStyle={styles.bottomSheetContent}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No products found</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Status selection bottom sheet */}
      <Modal
        visible={showStatusSheet}
        animationType="slide"
        transparent={true}
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
            
            <ScrollView contentContainerStyle={styles.bottomSheetContent}>
              {STATUS_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.sheetItem}
                  onPress={() => selectStatus(option.value)}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={[styles.statusDot, { 
                      backgroundColor: getStatusColor(option.value).text
                    }]} />
                    <Text style={styles.sheetItemText}>{option.label}</Text>
                  </View>
                  {selectedCustomer?.status === option.value && (
                    <Check size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  labelIcon: {
    marginRight: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: Colors.text.primary,
    height: '100%',
  },
  selectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  selectText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  placeholderText: {
    color: Colors.text.tertiary,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  emptyItems: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
  },
  emptyItemsText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  itemCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemFormGroup: {
    marginBottom: 12,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    overflow: 'hidden',
    height: 44,
  },
  quantityButton: {
    width: 36,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  quantityInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: Colors.text.primary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  currencySymbol: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  removeButtonText: {
    fontSize: 14,
    color: Colors.negative,
    marginLeft: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  summaryContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  textareaContainer: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    padding: 8,
    height: 120,
  },
  textarea: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    textAlignVertical: 'top',
  },
  statusIndicator: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  statusIndicatorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Bottom sheet styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    maxHeight: '80%',
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bottomSheetContent: {
    paddingBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  sheetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sheetItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  sheetItemPrice: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
}); 