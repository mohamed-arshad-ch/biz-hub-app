import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
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
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  Package, 
  Tag,
  X,
  Check,
  ChevronRight,
  ShoppingCart
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PurchaseReturnFormData, PurchaseReturnItem } from '@/types/purchase-return';
import { getVendorsData } from '@/mocks/vendorsData';
import { Vendor } from '@/types/vendor';
import { getProductsData } from '@/mocks/productsData';
import { Product } from '@/types/product';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Define common return reasons
const RETURN_REASONS = [
  { id: 'defective', name: 'Defective Product' },
  { id: 'damaged', name: 'Damaged During Shipping' },
  { id: 'wrong_item', name: 'Wrong Item Received' },
  { id: 'not_needed', name: 'No Longer Needed' },
  { id: 'other', name: 'Other' }
];

export default function NewPurchaseReturnScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  
  const [formData, setFormData] = useState<PurchaseReturnFormData>({
    vendorId: '',
    returnNumber: `PR-${Date.now().toString().slice(-4)}`,
    returnDate: new Date().toISOString().split('T')[0],
    originalOrderId: '',
    originalOrderNumber: '',
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'draft',
    notes: ''
  });

  useEffect(() => {
    // Load vendors and products data
    setVendors(getVendorsData());
    setProducts(getProductsData());
  }, []);

  const handleAddItem = () => {
    const newItem: PurchaseReturnItem = {
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

  const handleItemChange = (index: number, field: keyof PurchaseReturnItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      total: field === 'quantity' || field === 'unitPrice'
        ? Number(updatedItems[index].quantity) * Number(updatedItems[index].unitPrice)
        : updatedItems[index].total
    };

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      tax,
      total
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      tax,
      total
    });
  };

  const handleSelectVendor = (vendorId: string) => {
    setFormData({ ...formData, vendorId });
    setShowVendorModal(false);
  };

  const handleSelectProduct = (index: number, productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) return;

    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      productId,
      productName: selectedProduct.name,
      unitPrice: selectedProduct.purchasePrice,
      total: selectedProduct.purchasePrice * updatedItems[index].quantity
    };

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      tax,
      total
    });
    
    setShowProductModal(false);
  };

  const handleSelectReason = (index: number, reason: string) => {
    handleItemChange(index, 'reason', reason);
    setShowReasonModal(false);
  };

  const openProductModal = (index: number) => {
    setCurrentItemIndex(index);
    setShowProductModal(true);
  };

  const openReasonModal = (index: number) => {
    setCurrentItemIndex(index);
    setShowReasonModal(true);
  };

  const handleSave = () => {
    // Validate form data
    if (!formData.vendorId) {
      Alert.alert('Error', 'Please select a vendor');
      return;
    }

    if (!formData.originalOrderNumber) {
      Alert.alert('Error', 'Please enter the original order number');
      return;
    }

    if (formData.items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    // Check if all items have products and reasons
    const invalidItems = formData.items.findIndex(
      item => !item.productId || !item.reason
    );
    
    if (invalidItems !== -1) {
      Alert.alert('Error', `Please complete details for item ${invalidItems + 1}`);
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Success',
        'Purchase return saved successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    }, 1000);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>New Purchase Return</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Save size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          
          {/* Vendor Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Vendor <Text style={styles.requiredMark}>*</Text></Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setShowVendorModal(true)}
            >
              <View style={styles.selectButtonContent}>
                <User size={18} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
                {formData.vendorId ? (
                  <Text style={styles.selectText} numberOfLines={1}>
                    {vendors.find(v => v.id === formData.vendorId)?.name || 'Select Vendor'}
                  </Text>
                ) : (
                  <Text style={styles.placeholderText}>Select Vendor</Text>
                )}
              </View>
              <ChevronRight size={18} color={Colors.light.tabIconDefault} />
            </TouchableOpacity>
          </View>

          {/* Return Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Return Number</Text>
            <View style={styles.inputWrapper}>
              <Tag size={18} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.returnNumber}
                editable={false}
                placeholderTextColor={Colors.light.tabIconDefault}
              />
            </View>
          </View>

          {/* Original Order Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Original Order Number <Text style={styles.requiredMark}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <ShoppingCart size={18} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter original order number"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={formData.originalOrderNumber}
                onChangeText={(value) => setFormData({ ...formData, originalOrderNumber: value })}
              />
            </View>
          </View>

          {/* Return Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Return Date <Text style={styles.requiredMark}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Calendar size={18} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={formData.returnDate}
                onChangeText={(value) => setFormData({ ...formData, returnDate: value })}
              />
            </View>
          </View>
        </View>

        {/* Return Items Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Return Items</Text>
            <TouchableOpacity 
              style={styles.addItemButton}
              onPress={handleAddItem}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.addItemButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
          
          {formData.items.length === 0 ? (
            <View style={styles.noItemsContainer}>
              <Package size={40} color={Colors.light.tabIconDefault + '70'} />
              <Text style={styles.noItemsText}>No items added yet</Text>
              <Text style={styles.noItemsSubtext}>Tap "Add Item" to add return items</Text>
            </View>
          ) : (
            formData.items.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Item {index + 1}</Text>
                  <TouchableOpacity 
                    onPress={() => handleRemoveItem(index)}
                    style={styles.removeItemButton}
                  >
                    <Trash2 size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>

                {/* Product Selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Product <Text style={styles.requiredMark}>*</Text></Text>
                  <TouchableOpacity 
                    style={styles.selectButton}
                    onPress={() => openProductModal(index)}
                  >
                    <View style={styles.selectButtonContent}>
                      <Package size={18} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
                      {item.productId ? (
                        <Text style={styles.selectText} numberOfLines={1}>
                          {item.productName}
                        </Text>
                      ) : (
                        <Text style={styles.placeholderText}>Select Product</Text>
                      )}
                    </View>
                    <ChevronRight size={18} color={Colors.light.tabIconDefault} />
                  </TouchableOpacity>
                </View>

                {/* Quantity and Unit Price */}
                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Quantity <Text style={styles.requiredMark}>*</Text></Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor={Colors.light.tabIconDefault}
                        keyboardType="numeric"
                        value={item.quantity.toString()}
                        onChangeText={(value) => handleItemChange(index, 'quantity', Number(value) || 0)}
                      />
                    </View>
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Unit Price <Text style={styles.requiredMark}>*</Text></Text>
                    <View style={styles.inputWrapper}>
                      <DollarSign size={18} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor={Colors.light.tabIconDefault}
                        keyboardType="numeric"
                        value={item.unitPrice.toString()}
                        onChangeText={(value) => handleItemChange(index, 'unitPrice', Number(value) || 0)}
                      />
                    </View>
                  </View>
                </View>

                {/* Return Reason */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Return Reason <Text style={styles.requiredMark}>*</Text></Text>
                  <TouchableOpacity 
                    style={styles.selectButton}
                    onPress={() => openReasonModal(index)}
                  >
                    <View style={styles.selectButtonContent}>
                      <Tag size={18} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
                      {item.reason ? (
                        <Text style={styles.selectText} numberOfLines={1}>
                          {item.reason}
                        </Text>
                      ) : (
                        <Text style={styles.placeholderText}>Select Return Reason</Text>
                      )}
                    </View>
                    <ChevronRight size={18} color={Colors.light.tabIconDefault} />
                  </TouchableOpacity>
                </View>

                {/* Item Total */}
                <View style={styles.itemTotal}>
                  <Text style={styles.itemTotalLabel}>Item Total</Text>
                  <Text style={styles.itemTotalValue}>${item.total.toFixed(2)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Summary</Text>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${formData.subtotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tax (10%)</Text>
            <Text style={styles.summaryValue}>${formData.tax.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryItemTotal}>
            <Text style={styles.summaryLabelTotal}>Total</Text>
            <Text style={styles.summaryValueTotal}>${formData.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Notes Card */}
        <View style={styles.card}>
          <View style={styles.notesHeader}>
            <FileText size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Notes</Text>
          </View>
          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textArea}
              placeholder="Enter additional notes here..."
              placeholderTextColor={Colors.light.tabIconDefault}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.notes}
              onChangeText={(value) => setFormData({ ...formData, notes: value })}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={() => router.back()}
          >
            <X size={20} color={Colors.light.text} style={styles.buttonIcon} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.saveButtonLarge,
              loading && styles.disabledButton
            ]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Check size={20} color="#FFFFFF" style={styles.buttonIcon} />
            )}
            <Text style={styles.saveButtonText}>Save Return</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Vendor Selection Modal */}
      <Modal
        visible={showVendorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVendorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vendor</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowVendorModal(false)}
              >
                <X size={22} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={vendors}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => handleSelectVendor(item.id)}
                >
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    <Text style={styles.modalItemSubtitle}>{item.email}</Text>
                  </View>
                  {formData.vendorId === item.id && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Product Selection Modal */}
      <Modal
        visible={showProductModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowProductModal(false)}
              >
                <X size={22} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => handleSelectProduct(currentItemIndex, item.id)}
                >
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    <Text style={styles.modalItemSubtitle}>${item.purchasePrice.toFixed(2)}</Text>
                  </View>
                  {formData.items[currentItemIndex]?.productId === item.id && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Return Reason Modal */}
      <Modal
        visible={showReasonModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReasonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Return Reason</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowReasonModal(false)}
              >
                <X size={22} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={RETURN_REASONS}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => handleSelectReason(currentItemIndex, item.name)}
                >
                  <Text style={styles.modalItemTitle}>{item.name}</Text>
                  {formData.items[currentItemIndex]?.reason === item.name && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListFooterComponent={() => (
                <TouchableOpacity 
                  style={[styles.modalItem, styles.customReasonItem]}
                >
                  <TextInput 
                    style={styles.customReasonInput}
                    placeholder="Type custom reason..."
                    placeholderTextColor={Colors.light.tabIconDefault}
                    onChangeText={(text) => {
                      if (text.trim()) {
                        handleSelectReason(currentItemIndex, text);
                      }
                    }}
                    onSubmitEditing={(e) => {
                      if (e.nativeEvent.text.trim()) {
                        handleSelectReason(currentItemIndex, e.nativeEvent.text);
                      }
                    }}
                    autoFocus
                  />
                </TouchableOpacity>
              )}
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
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '30',
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
    color: Colors.light.text,
  },
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  requiredMark: {
    color: '#FF3B30',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '50',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '50',
    borderRadius: 8,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  row: {
    flexDirection: 'row',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addItemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  noItemsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '30',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  noItemsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 12,
  },
  noItemsSubtext: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  itemContainer: {
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '30',
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: Colors.light.background,
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
    color: Colors.light.text,
  },
  removeItemButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  itemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.tabIconDefault + '20',
    marginTop: 8,
  },
  itemTotalLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  itemTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.light.text,
  },
  summaryValue: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500',
  },
  summaryItemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.tabIconDefault + '30',
    marginTop: 4,
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '50',
    borderRadius: 8,
  },
  textArea: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 120,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 32,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '50',
  },
  saveButtonLarge: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '30',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalList: {
    padding: 8,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  customReasonItem: {
    borderBottomWidth: 0,
  },
  customReasonInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
}); 