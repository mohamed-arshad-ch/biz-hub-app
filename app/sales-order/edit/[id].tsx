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
  DollarSign
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SalesOrderFormData, SalesOrderItem } from '@/types/sales-order';
import { Customer } from '@/types/customer';
import { Product } from '@/types/product';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import * as dbCustomer from '@/db/customer';
import * as dbProduct from '@/db/product';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateSalesOrder, getSalesOrderById } from '@/db/sales-order';
import { useAuthStore } from '@/store/auth';

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });
  const { user } = useAuthStore();
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
      <Text style={styles.productPrice}>${item.sellingPrice.toFixed(2)}</Text>
    </TouchableOpacity>
  );

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
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right','bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Sales Order</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
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
                !formData.customerId && styles.placeholderText
              ]}>
                {customers.find(c => c.id === formData.customerId)?.name || 'Select customer'}
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
                value={formData.orderNumber}
                onChangeText={(value) => setFormData({ ...formData, orderNumber: value })}
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
                value={formData.orderDate}
                onChangeText={(value) => setFormData({ ...formData, orderDate: value })}
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
          
          {formData.items.length === 0 ? (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>No items added yet</Text>
            </View>
          ) : (
            formData.items.map((item, index) => (
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
          
          {formData.items.length > 0 && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${formData.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (10%)</Text>
                <Text style={styles.summaryValue}>${formData.tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${formData.total.toFixed(2)}</Text>
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
                backgroundColor: getStatusColor(formData.status).bg
              }]}>
                <Text style={[styles.statusIndicatorText, { 
                  color: getStatusColor(formData.status).text
                }]}>
                  {STATUS_OPTIONS.find(option => option.value === formData.status)?.label}
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
                value={formData.notes}
                onChangeText={(value) => setFormData({ ...formData, notes: value })}
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