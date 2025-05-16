import React, { useState } from 'react';
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
  FlatList
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
import { SalesOrderFormData, SalesOrderItem } from '@/types/sales-order';
import { getCustomersData } from '@/mocks/customersData';
import { getProductsData } from '@/mocks/productsData';
import { Customer } from '@/types/customer';
import { Product } from '@/types/product';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function NewSalesOrderScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState<SalesOrderFormData>({
    customerId: '',
    orderNumber: `SO-${Date.now().toString().slice(-4)}`,
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
  
  // Search functionality for customers
  const [customers] = useState<Customer[]>(getCustomersData());
  const [customerSearch, setCustomerSearch] = useState('');
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  );
  
  const [products] = useState<Product[]>(getProductsData());
  // Search functionality for products
  const [productSearch, setProductSearch] = useState('');
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddItem = () => {
    const newItem: SalesOrderItem = {
      productId: '',
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
          productName: selectedProduct.name,
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
    setFormData({ ...formData, customerId: customer.id });
    setShowCustomerSheet(false);
    setCustomerSearch('');
  };
  
  const selectProduct = (index: number, product: Product) => {
    handleItemChange(index, 'productId', product.id);
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
      <Text style={styles.sheetItemText}>{item.name}</Text>
      {formData.customerId === item.id && (
        <Check size={18} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );
  
  const renderProductItem = ({ item }: { item: Product }, index: number) => (
    <TouchableOpacity
      style={styles.sheetItem}
      onPress={() => selectProduct(index, item)}
    >
      <View style={{flex: 1}}>
        <Text style={styles.sheetItemText}>{item.name}</Text>
        <Text style={styles.sheetItemPrice}>${item.sellingPrice.toFixed(2)}</Text>
      </View>
      {formData.items[index]?.productId === item.id && (
        <Check size={18} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

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
    
    const invalidItems = formData.items.filter(item => !item.productId || item.quantity <= 0);
    if (invalidItems.length > 0) {
      Alert.alert('Error', 'Please complete all item details');
      return;
    }

    // Here you would typically save the data to your backend
    Alert.alert(
      'Success',
      'Sales order saved successfully',
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
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
        <Text style={styles.title}>New Sales Order</Text>
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
            
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id}
              renderItem={renderCustomerItem}
              contentContainerStyle={styles.bottomSheetContent}
            />
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
            
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={(props) => showProductSheet !== null ? renderProductItem(props, showProductSheet) : null}
              contentContainerStyle={styles.bottomSheetContent}
            />
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
}); 