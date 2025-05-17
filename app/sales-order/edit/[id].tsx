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
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { SalesOrderFormData, SalesOrderItem } from '@/types/sales-order';
import { Customer } from '@/types/customer';
import { Product } from '@/types/product';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import * as dbCustomer from '@/db/customer';
import * as dbProduct from '@/db/product';
import { updateSalesOrder, getSalesOrderById } from '@/db/sales-order';
import { useAuthStore } from '@/store/auth';
import { formatCurrency } from '@/utils/currency';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

// Extend SalesOrderItem locally to include optional discount and tax for calculation
type SalesOrderItemWithExtras = SalesOrderItem & { discount?: number; tax?: number };

export default function EditSalesOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SalesOrderFormData>({
    customerId: 0,
    orderNumber: '',
    orderDate: new Date().toISOString().split('T')[0],
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'draft',
    notes: ''
  });
  
  // Bottom sheet visibility states
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showProductSheet, setShowProductSheet] = useState<number | null>(null);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  
  // Customer data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Product data state
  const [products, setProducts] = useState<Product[]>([]);
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

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!user || !id) return;
        const orderData = await getSalesOrderById(Number(id), user.id);
        if (!orderData) {
          Alert.alert('Error', 'Sales order not found');
          router.back();
          return;
        }
        // Fetch customer name and ensure customer is in customers array
        let customerObj: Customer | null = null;
        try {
          const rawCustomer = await dbCustomer.getCustomerById(orderData.customerId);
          if (rawCustomer) {
            // Normalize status property to match Customer type
            const normalizedCustomer = { ...rawCustomer, status: (rawCustomer.status ?? null) as Customer['status'] } as Customer;
            customerObj = normalizedCustomer;
            if (!customers.find(c => c.id === normalizedCustomer.id)) {
              setCustomers(prev => [...prev, normalizedCustomer]);
            }
          }
        } catch {}
        // Fetch product names for items
        const itemsWithNames = await Promise.all(
          (orderData.items || []).map(async (item) => {
            let productName = '';
            try {
              const product = await dbProduct.getProductById(item.productId);
              productName = product?.productName || '';
            } catch {}
            return {
              ...item,
              productName,
              unitPrice: item.unitPrice / 100,
              total: item.total / 100
            };
          })
        );
        setFormData({
          customerId: orderData.customerId,
          orderNumber: orderData.orderNumber,
          orderDate: orderData.orderDate,
          items: itemsWithNames,
          subtotal: orderData.subtotal / 100,
          tax: (orderData.tax ?? 0) / 100,
          total: orderData.total / 100,
          status: (orderData.status ?? 'draft') as SalesOrderFormData['status'],
          notes: orderData.notes || ''
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to load order for editing');
      }
    };
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // Recalculate subtotal, tax, and total whenever items change
  useEffect(() => {
    const items = formData.items as SalesOrderItemWithExtras[];
    // Calculation logic similar to new sales order
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    // If you have discount/tax fields per item, adjust here
    const discount = items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice * (item.discount ?? 0) / 100)), 0);
    const tax = items.reduce((sum, item) => sum + (((item.quantity * item.unitPrice - ((item.quantity * item.unitPrice * (item.discount ?? 0) / 100))) * (item.tax ?? 0) / 100)), 0);
    const total = subtotal - discount + tax;
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      total
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.items]);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const dbCustomers = await dbCustomer.getAllCustomers();
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
        status: (c.status ?? null) as Customer['status'],
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
    try {
      setLoadingProducts(true);
      const dbProducts = await dbProduct.getAllProducts();
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
    const newItem: SalesOrderItem = {
      productId: 0,
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
  };
  
  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    
    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax rate
    
    setFormData({
      ...formData,
      items: newItems,
      subtotal,
      tax,
      total: subtotal + tax
    });
  };

  const handleItemChange = (index: number, field: keyof SalesOrderItem, value: string | number) => {
    const newItems = [...formData.items];
    
    if (field === 'productId') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        newItems[index] = {
          ...newItems[index],
          productId: selectedProduct.id,
          productName: selectedProduct.productName,
          unitPrice: selectedProduct.sellingPrice,
          total: selectedProduct.sellingPrice * newItems[index].quantity
        };
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value,
        total: field === 'quantity' || field === 'unitPrice'
          ? (field === 'quantity' ? Number(value) : newItems[index].quantity) *
            (field === 'unitPrice' ? Number(value) : newItems[index].unitPrice)
          : newItems[index].total
      };
    }

    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax rate

    setFormData({
      ...formData,
      items: newItems,
      subtotal,
      tax,
      total: subtotal + tax
    });
  };
  
  const selectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.id
    }));
    setShowCustomerSheet(false);
    setCustomerSearch('');
  };
  
  const selectProduct = (index: number, selectedProduct: Product) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      productId: selectedProduct.id,
      productName: selectedProduct.productName,
      unitPrice: selectedProduct.sellingPrice,
      total: selectedProduct.sellingPrice * newItems[index].quantity
    };
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
    setShowProductSheet(null);
    setProductSearch('');
  };
  
  const selectStatus = (status: string) => {
    setFormData({ ...formData, status: status as SalesOrderFormData['status'] });
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
      {formData.customerId === item.id && (
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

  const handlePrint = () => {
    Alert.alert('Print', 'Printing sales order...');
    // Printing logic would go here
  };

  const handleSave = async () => {
    // Validate form data
    if (!formData.customerId) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    if (formData.items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }
    const invalidItems = formData.items.filter(item => !item.productId || item.quantity <= 0);
    if (invalidItems.length > 0) {
      Alert.alert('Error', 'Please complete all item details');
      return;
    }
    try {
      if (!user) {
        Alert.alert('Error', 'User not found');
        return;
      }
      setSaving(true);
      // Prepare order and items for DB (convert dollars to cents)
      const orderUpdate = {
        customerId: formData.customerId,
        orderNumber: formData.orderNumber,
        orderDate: formData.orderDate,
        status: formData.status,
        notes: formData.notes,
        subtotal: Math.round(formData.subtotal * 100),
        tax: Math.round(formData.tax * 100),
        total: Math.round(formData.total * 100),
        discount: 0 // Add discount if needed
      };
      // The updateSalesOrder function adds orderId to each item internally, so it's safe to omit it here.
      const items = formData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Math.round(item.unitPrice * 100),
        total: Math.round(item.total * 100),
        discount: 0, // Add discount if needed
        tax: 0 // Add tax if needed
      })) as any; // Type assertion: orderId is added internally
      await updateSalesOrder(Number(id), user.id, orderUpdate, items);
      Alert.alert('Success', 'Sales order updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update sales order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Sales Order</Text>
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
                  value={formData.orderNumber}
                  onChangeText={(value) => setFormData({ ...formData, orderNumber: value })}
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
                  value={formData.orderDate}
                  onChangeText={(value) => setFormData({ ...formData, orderDate: value })}
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
                {formData.customerId ? (
                  <Text style={styles.selectText}>
                    {customers.find(c => c.id === formData.customerId)?.name || 'Select Customer'}
                  </Text>
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
                  {STATUS_OPTIONS.find(option => option.value === formData.status)?.label || 'Draft'}
                </Text>
                <ChevronDown size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Items</Text>
            
            {formData.items.length > 0 ? (
              <View style={styles.itemList}>
                {formData.items.map((item, index) => (
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
              <Text style={styles.totalAmount}>{formatCurrency(formData.total)}</Text>
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
                  value={formData.notes}
                  onChangeText={(value) => setFormData({ ...formData, notes: value })}
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
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Updating...' : 'Update Order'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
                  {formData.status === option.value && (
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
  currencyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginRight: 8,
  },
}); 