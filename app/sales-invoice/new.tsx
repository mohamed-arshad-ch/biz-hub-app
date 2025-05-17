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
import { Customer } from '@/types/customer';
import { Product } from '@/types/product';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import * as dbCustomer from '@/db/customer';
import * as dbProduct from '@/db/product';
import { useAuthStore } from '@/store/auth';
import { createSalesInvoice } from '@/db/sales-invoice';

// Define the SalesInvoiceItem interface
interface SalesInvoiceItem {
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Define the SalesInvoiceFormData interface
interface SalesInvoiceFormData {
  customerId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: SalesInvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  notes: string;
}

const STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function NewSalesInvoiceScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<SalesInvoiceFormData>({
    customerId: '',
    invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // 30 days from now
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'unpaid',
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
        status: (c.status === 'active' || c.status === 'inactive' || c.status === 'blocked') ? c.status : 'active',
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
    const newItem: SalesInvoiceItem = {
      productId: null,
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setFormData(prev => {
      const items = [...prev.items, newItem];
      return { ...prev, items };
    });
  };
  
  const handleRemoveItem = (index: number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.1;
      return {
        ...prev,
        items: newItems,
        subtotal,
        tax,
        total: subtotal + tax
      };
    });
  };

  const handleItemChange = (index: number, field: keyof SalesInvoiceItem, value: string | number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      if (field === 'productId') {
        const productIdNum = typeof value === 'string' ? parseInt(value, 10) : value;
        const selectedProduct = products.find(p => p.id === productIdNum);
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
        let updatedValue = value;
        if (field === 'quantity' || field === 'unitPrice') {
          updatedValue = Number(value);
        }
        newItems[index] = {
          ...newItems[index],
          [field]: updatedValue,
        };
        // recalculate total
        newItems[index].total = newItems[index].unitPrice * newItems[index].quantity;
      }
      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.1;
      return {
        ...prev,
        items: newItems,
        subtotal,
        tax,
        total: subtotal + tax
      };
    });
  };
  
  const selectCustomer = (customer: Customer) => {
    setFormData({ ...formData, customerId: customer.id.toString() });
    setShowCustomerSheet(false);
    setCustomerSearch('');
  };
  
  const selectProduct = (index: number, product: Product) => {
    handleItemChange(index, 'productId', product.id);
    setShowProductSheet(null);
    setProductSearch('');
  };
  
  const selectStatus = (status: string) => {
    setFormData({ ...formData, status: status as SalesInvoiceFormData['status'] });
    setShowStatusSheet(false);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'unpaid':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'overdue':
        return { bg: 'rgba(244, 67, 54, 0.1)', text: Colors.negative };
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
      <Text style={styles.sheetItemText}>{item.name}</Text>
      {formData.customerId === item.id.toString() && (
        <Check size={18} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );
  
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.sheetItem}
      onPress={() => selectProduct(showProductSheet as number, item)}
    >
      <View style={{flex: 1}}>
        <Text style={styles.sheetItemText}>{item.productName}</Text>
        <Text style={styles.sheetItemPrice}>${item.sellingPrice.toFixed(2)}</Text>
      </View>
      {showProductSheet !== null && formData.items[showProductSheet]?.productId === item.id && (
        <Check size={18} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }
    if (!formData.customerId) {
      Alert.alert('Validation Error', 'Please select a customer.');
      return;
    }
    if (formData.items.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one item.');
      return;
    }
    for (const item of formData.items) {
      if (!item.productId || !item.productName || !item.quantity || !item.unitPrice) {
        Alert.alert('Validation Error', 'Please complete all item details.');
        return;
      }
    }
    try {
      // Prepare amounts in cents
      const subtotal = Math.round(formData.subtotal * 100);
      const tax = Math.round(formData.tax * 100);
      const total = Math.round(formData.total * 100);
      // Prepare items in cents and correct types
      const items = formData.items.map(item => ({
        productId: item.productId ?? 0,
        quantity: item.quantity,
        unitPrice: Math.round(item.unitPrice * 100),
        total: Math.round(item.total * 100),
        notes: undefined,
      }));
      // Save to DB
      await createSalesInvoice({
        userId: user.id,
        customerId: Number(formData.customerId),
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        subtotal,
        tax,
        total,
        status: formData.status ?? 'unpaid',
        notes: formData.notes,
      }, items as any);
      Alert.alert('Success', 'Invoice saved successfully!');
      router.replace('/sales-invoice/sales-invoice');
    } catch (error) {
      console.error('Error saving invoice:', error);
      Alert.alert('Error', 'Failed to save invoice.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Sales Invoice</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Customer <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setShowCustomerSheet(true)}
            >
              <User size={16} color={Colors.text.secondary} style={styles.inputIcon} />
              <Text 
                style={[
                  styles.selectButtonText,
                  !formData.customerId && styles.placeholderText
                ]}
              >
                {customers.find(c => c.id.toString() === formData.customerId)?.name || 'Select Customer'}
              </Text>
              <ChevronDown size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Invoice # <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputContainer}>
                <Hash size={16} color={Colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.invoiceNumber}
                  onChangeText={(text) => setFormData({ ...formData, invoiceNumber: text })}
                  placeholder="Invoice Number"
                  placeholderTextColor={Colors.text.tertiary}
                />
              </View>
            </View>
            
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Status <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowStatusSheet(true)}
              >
                <FileText size={16} color={Colors.text.secondary} style={styles.inputIcon} />
                <Text style={styles.selectButtonText}>
                  {STATUS_OPTIONS.find(option => option.value === formData.status)?.label || 'Unpaid'}
                </Text>
                <ChevronDown size={16} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Invoice Date <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputContainer}>
                <Calendar size={16} color={Colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.invoiceDate}
                  onChangeText={(text) => setFormData({ ...formData, invoiceDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.text.tertiary}
                />
              </View>
            </View>
            
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Due Date <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputContainer}>
                <Calendar size={16} color={Colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.dueDate}
                  onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.text.tertiary}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddItem}
            >
              <Plus size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {formData.items.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={36} color={Colors.text.tertiary} />
              <Text style={styles.emptyStateText}>No items added</Text>
              <Text style={styles.emptyStateSubText}>Press the + button to add items</Text>
            </View>
          ) : (
            formData.items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Item {index + 1}</Text>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(index)}
                  >
                    <Minus size={16} color={Colors.negative} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Product <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity 
                    style={styles.selectButton}
                    onPress={() => setShowProductSheet(index)}
                  >
                    <Package size={16} color={Colors.text.secondary} style={styles.inputIcon} />
                    <Text 
                      style={[
                        styles.selectButtonText,
                        !item.productId && styles.placeholderText
                      ]}
                    >
                      {item.productName || 'Select Product'}
                    </Text>
                    <ChevronDown size={16} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Quantity <Text style={styles.required}>*</Text></Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={item.quantity.toString()}
                        onChangeText={(text) => handleItemChange(index, 'quantity', text)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={Colors.text.tertiary}
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Unit Price <Text style={styles.required}>*</Text></Text>
                    <View style={styles.inputContainer}>
                      <DollarSign size={16} color={Colors.text.secondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={item.unitPrice.toString()}
                        onChangeText={(text) => handleItemChange(index, 'unitPrice', text)}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor={Colors.text.tertiary}
                      />
                    </View>
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Total</Text>
                  <View style={styles.totalContainer}>
                    <DollarSign size={16} color={Colors.primary} />
                    <Text style={styles.totalText}>${item.total.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {formData.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
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
                <Text style={styles.totalRowLabel}>Total</Text>
                <Text style={styles.totalRowValue}>${formData.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Add any additional notes here"
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveFullButton}
          onPress={handleSave}
        >
          <Text style={styles.saveFullButtonText}>Save Invoice</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Customer Selection Bottom Sheet */}
      <Modal
        visible={showCustomerSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomerSheet(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setShowCustomerSheet(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                value={customerSearch}
                onChangeText={setCustomerSearch}
                placeholder="Search customers..."
                placeholderTextColor={Colors.text.tertiary}
              />
              {customerSearch !== '' && (
                <TouchableOpacity onPress={() => setCustomerSearch('')}>
                  <X size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={filteredCustomers}
              renderItem={renderCustomerItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.sheetList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>No customers found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Product Selection Bottom Sheet */}
      <Modal
        visible={showProductSheet !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductSheet(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => setShowProductSheet(null)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                value={productSearch}
                onChangeText={setProductSearch}
                placeholder="Search products..."
                placeholderTextColor={Colors.text.tertiary}
              />
              {productSearch !== '' && (
                <TouchableOpacity onPress={() => setProductSearch('')}>
                  <X size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.sheetList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>No products found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Status Selection Bottom Sheet */}
      <Modal
        visible={showStatusSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStatusSheet(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusSheet(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.statusList}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusItem,
                    formData.status === option.value && styles.selectedStatusItem,
                    { backgroundColor: getStatusColor(option.value).bg }
                  ]}
                  onPress={() => selectStatus(option.value)}
                >
                  <Text 
                    style={[
                      styles.statusItemText,
                      { color: getStatusColor(option.value).text }
                    ]}
                  >
                    {option.label}
                  </Text>
                  {formData.status === option.value && (
                    <Check size={18} color={getStatusColor(option.value).text} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
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
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  required: {
    color: Colors.negative,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  placeholderText: {
    color: Colors.text.tertiary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  itemCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  totalText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  summaryContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
    paddingTop: 12,
    marginTop: 4,
  },
  totalRowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  totalRowValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  saveFullButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  saveFullButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 8,
  },
  sheetList: {
    padding: 16,
    maxHeight: 400,
  },
  sheetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
    marginTop: 4,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyListText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  statusList: {
    padding: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedStatusItem: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  statusItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 