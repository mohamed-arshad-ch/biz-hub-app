import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  Modal,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  ChevronRight, 
  DollarSign, 
  Package, 
  FileText,
  X,
  Search,
  Check
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SalesReturnFormData, SalesReturnItem } from '@/types/sales-return';
import { getCustomersData } from '@/mocks/customersData';
import { getProductsData } from '@/mocks/productsData';
import { Customer } from '@/types/customer';
import { Product } from '@/types/product';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const RETURN_REASONS = [
  'Damaged Product',
  'Wrong Item Delivered',
  'Defective Product',
  'Customer Changed Mind',
  'Sizing Issue',
  'Other'
];

export default function NewSalesReturnScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  
  // Modal visibility states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  
  const [formData, setFormData] = useState<SalesReturnFormData>({
    customerId: '',
    returnNumber: `SR-${Date.now().toString().slice(-4)}`,
    returnDate: new Date().toISOString().split('T')[0],
    originalOrderId: '',
    originalOrderNumber: '',
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'pending',
    notes: ''
  });

  useEffect(() => {
    // Load customers and products data
    const customersData = getCustomersData();
    const productsData = getProductsData();
    setCustomers(customersData);
    setFilteredCustomers(customersData);
    setProducts(productsData);
    setFilteredProducts(productsData);
  }, []);

  const handleAddItem = () => {
    const newItem: SalesReturnItem = {
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      reason: ''
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    
    // Recalculate totals
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

  const handleItemChange = (index: number, field: keyof SalesReturnItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
      total: field === 'quantity' || field === 'unitPrice'
        ? (field === 'quantity' ? Number(value) : newItems[index].quantity) *
          (field === 'unitPrice' ? Number(value) : newItems[index].unitPrice)
        : newItems[index].total
    };

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

  const handleSelectCustomer = (customer: Customer) => {
    setFormData({
      ...formData,
      customerId: customer.id,
    });
    setShowCustomerModal(false);
    setCustomerSearchQuery('');
  };

  const handleOpenProductModal = (index: number) => {
    setSelectedItemIndex(index);
    setProductSearchQuery('');
    setFilteredProducts(products);
    setShowProductModal(true);
  };

  const handleSelectProduct = (product: Product) => {
    if (selectedItemIndex === -1) return;
    
    const newItems = [...formData.items];
    newItems[selectedItemIndex] = {
      ...newItems[selectedItemIndex],
      productId: product.id,
      productName: product.name,
      unitPrice: product.sellingPrice,
      total: product.sellingPrice * newItems[selectedItemIndex].quantity
    };

    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax rate

    setFormData({
      ...formData,
      items: newItems,
      subtotal,
      tax,
      total: subtotal + tax
    });
    
    setShowProductModal(false);
  };

  const handleOpenReasonModal = (index: number) => {
    setSelectedItemIndex(index);
    setShowReasonModal(true);
  };

  const handleSelectReason = (reason: string) => {
    if (selectedItemIndex === -1) return;
    
    const newItems = [...formData.items];
    newItems[selectedItemIndex] = {
      ...newItems[selectedItemIndex],
      reason
    };

    setFormData({
      ...formData,
      items: newItems
    });
    
    setShowReasonModal(false);
  };

  const handleCustomerSearch = (text: string) => {
    setCustomerSearchQuery(text);
    if (text) {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  };

  const handleProductSearch = (text: string) => {
    setProductSearchQuery(text);
    if (text) {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  };

  const handleSave = () => {
    // Validate form data
    if (!formData.customerId) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    
    if (formData.items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }
    
    for (const item of formData.items) {
      if (!item.productId) {
        Alert.alert('Error', 'Please select a product for all items');
        return;
      }
      
      if (!item.reason) {
        Alert.alert('Error', 'Please provide a return reason for all items');
        return;
      }
    }
    
    if (!formData.originalOrderNumber) {
      Alert.alert('Error', 'Please enter the original order number');
      return;
    }
    
    // If validation passes, proceed with saving
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Sales return created successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    }, 1500);
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={[
        styles.modalItem, 
        formData.customerId === item.id && styles.selectedModalItem
      ]}
      onPress={() => handleSelectCustomer(item)}
    >
      <View style={styles.modalItemContent}>
        <Text style={styles.modalItemTitle}>{item.name}</Text>
        <Text style={styles.modalItemSubtitle}>{item.email || item.phone}</Text>
      </View>
      {formData.customerId === item.id && (
        <Check size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleSelectProduct(item)}
    >
      <View style={styles.modalItemContent}>
        <Text style={styles.modalItemTitle}>{item.name}</Text>
        <Text style={styles.modalItemSubtitle}>${item.sellingPrice.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderReasonItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleSelectReason(item)}
    >
      <Text style={styles.modalItemTitle}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Sales Return</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.text.primary} />
          ) : (
            <Save size={24} color={Colors.text.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Customer <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => {
              setCustomerSearchQuery('');
              setFilteredCustomers(customers);
              setShowCustomerModal(true);
            }}
          >
            <Text style={[
              styles.selectButtonText,
              !formData.customerId && styles.placeholderText
            ]}>
              {customers.find(c => c.id === formData.customerId)?.name || 'Select customer'}
            </Text>
            <ChevronRight size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Return Number</Text>
          <View style={styles.disabledInput}>
            <Text style={styles.disabledInputText}>{formData.returnNumber}</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Original Order Number <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter original order number"
            placeholderTextColor={Colors.text.tertiary}
            value={formData.originalOrderNumber}
            onChangeText={(value) => setFormData({ ...formData, originalOrderNumber: value })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Return Date <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.text.tertiary}
            value={formData.returnDate}
            onChangeText={(value) => setFormData({ ...formData, returnDate: value })}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Return Items</Text>
          <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
            <Plus size={20} color="white" />
          </TouchableOpacity>
        </View>

        {formData.items.length === 0 ? (
          <View style={styles.emptyItemsContainer}>
            <Package size={40} color={Colors.text.tertiary} />
            <Text style={styles.emptyItemsText}>No items added yet</Text>
            <Text style={styles.emptyItemsSubtext}>Tap the + button to add return items</Text>
          </View>
        ) : (
          formData.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemIndexText}>Item {index + 1}</Text>
                <TouchableOpacity 
                  onPress={() => handleRemoveItem(index)}
                  style={styles.removeItemButton}
                >
                  <Trash2 size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Product <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => handleOpenProductModal(index)}
                >
                  <Text style={[
                    styles.selectButtonText,
                    !item.productId && styles.placeholderText
                  ]}>
                    {item.productName || 'Select product'}
                  </Text>
                  <ChevronRight size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Quantity <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={item.quantity.toString()}
                    onChangeText={(value) => handleItemChange(index, 'quantity', Number(value) || 0)}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Unit Price <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={item.unitPrice.toString()}
                    onChangeText={(value) => handleItemChange(index, 'unitPrice', Number(value) || 0)}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Return Reason <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => handleOpenReasonModal(index)}
                >
                  <Text style={[
                    styles.selectButtonText,
                    !item.reason && styles.placeholderText
                  ]}>
                    {item.reason || 'Select reason'}
                  </Text>
                  <ChevronRight size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Total</Text>
                <View style={styles.disabledInput}>
                  <Text style={styles.totalText}>${item.total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        {formData.items.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${formData.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (10%)</Text>
              <Text style={styles.summaryValue}>${formData.tax.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotalValue}>${formData.total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter additional notes or details"
            placeholderTextColor={Colors.text.tertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={formData.notes}
            onChangeText={(value) => setFormData({ ...formData, notes: value })}
          />
        </View>

        <TouchableOpacity
          style={styles.saveFullButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Save size={20} color="white" style={styles.saveButtonIcon} />
              <Text style={styles.saveButtonText}>Save Return</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search customers..."
                placeholderTextColor={Colors.text.tertiary}
                value={customerSearchQuery}
                onChangeText={handleCustomerSearch}
              />
              {customerSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleCustomerSearch('')}>
                  <X size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={filteredCustomers}
              renderItem={renderCustomerItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
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

      {/* Product Selection Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor={Colors.text.tertiary}
                value={productSearchQuery}
                onChangeText={handleProductSearch}
              />
              {productSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleProductSearch('')}>
                  <X size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
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

      {/* Reason Selection Modal */}
      <Modal
        visible={showReasonModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReasonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Return Reason</Text>
              <TouchableOpacity onPress={() => setShowReasonModal(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={RETURN_REASONS}
              renderItem={renderReasonItem}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            />
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
  },
  disabledInput: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  disabledInputText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  placeholderText: {
    color: Colors.text.tertiary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyItemsContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyItemsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyItemsSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemIndexText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  removeItemButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  summaryCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 8,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  saveFullButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 32,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
  modalList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  selectedModalItem: {
    backgroundColor: Colors.primary + '10',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  emptyList: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: Colors.text.secondary,
  }
}); 