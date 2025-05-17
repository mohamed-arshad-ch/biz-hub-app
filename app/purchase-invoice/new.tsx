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
import { Vendor } from '@/types/vendor';
import { Product } from '@/types/product';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import * as dbVendor from '@/db/vendor';
import * as dbProduct from '@/db/product';
import { useAuthStore } from '@/store/auth';
import { createPurchaseInvoice } from '@/db/purchase-invoice';
import { formatCurrency } from '@/utils/format';

// Define the PurchaseInvoiceItem interface
interface PurchaseInvoiceItem {
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Define the PurchaseInvoiceFormData interface
interface PurchaseInvoiceFormData {
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: PurchaseInvoiceItem[];
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

export default function NewPurchaseInvoiceScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<PurchaseInvoiceFormData>({
    vendorId: '',
    invoiceNumber: `PI-${Date.now().toString().slice(-4)}`,
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
  const [showVendorSheet, setShowVendorSheet] = useState(false);
  const [showProductSheet, setShowProductSheet] = useState<number | null>(null);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  
  // Vendor data state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  
  // Product data state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Filter vendors based on search
  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    (vendor.email && vendor.email.toLowerCase().includes(vendorSearch.toLowerCase())) ||
    (vendor.phone && vendor.phone.includes(vendorSearch))
  );
  
  // Filter products based on search
  const filteredProducts = products.filter(product => 
    product.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // Load vendors when bottom sheet is opened
  useEffect(() => {
    if (showVendorSheet) {
      loadVendors();
    }
  }, [showVendorSheet]);

  // Load products when bottom sheet is opened
  useEffect(() => {
    if (showProductSheet !== null) {
      loadProducts();
    }
  }, [showProductSheet]);

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const dbVendors = await dbVendor.getAllVendors();
      const mappedVendors: Vendor[] = dbVendors.map(v => ({
        id: v.id.toString(),
        userId: v.userId.toString(),
        name: v.name,
        company: v.company || '',
        email: v.email || '',
        phone: v.phone || '',
        address: v.address || undefined,
        city: v.city || undefined,
        state: v.state || undefined,
        zipCode: v.zipCode || undefined,
        country: v.country || undefined,
        contactPerson: v.contactPerson || undefined,
        category: v.category || undefined,
        status: (v.status === 'active' || v.status === 'inactive' || v.status === 'blocked') ? v.status : 'active',
        notes: v.notes || undefined,
        paymentTerms: v.paymentTerms || undefined,
        taxId: v.taxId || undefined,
        tags: v.tags ? v.tags.split(',') : undefined,
        totalPurchases: v.totalPurchases || 0,
        outstandingBalance: 0,
        createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
        updatedAt: new Date() // Since we don't have updatedAt from DB, use current date
      }));
      setVendors(mappedVendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
      Alert.alert('Error', 'Failed to load vendors');
    } finally {
      setLoadingVendors(false);
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
    const newItem: PurchaseInvoiceItem = {
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

  const handleItemChange = (index: number, field: keyof PurchaseInvoiceItem, value: string | number) => {
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
            unitPrice: selectedProduct.costPrice,
            total: selectedProduct.costPrice * newItems[index].quantity
          };
        }
      } else if (field === 'quantity' || field === 'unitPrice') {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
        newItems[index] = {
          ...newItems[index],
          [field]: numValue,
          total: field === 'quantity' 
            ? numValue * newItems[index].unitPrice 
            : newItems[index].quantity * numValue
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          [field]: value
        };
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

  const selectVendor = (vendor: Vendor) => {
    setFormData(prev => ({ ...prev, vendorId: vendor.id.toString() }));
    setShowVendorSheet(false);
  };

  const selectProduct = (index: number, product: Product) => {
    handleItemChange(index, 'productId', product.id);
    setShowProductSheet(null);
  };

  const selectStatus = (status: string) => {
    setFormData(prev => ({ ...prev, status: status as PurchaseInvoiceFormData['status'] }));
    setShowStatusSheet(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return Colors.status.completed;
      case 'unpaid':
        return Colors.status.pending;
      case 'overdue':
        return Colors.status.cancelled;
      case 'cancelled':
        return Colors.status.cancelled;
      default:
        return Colors.status.pending;
    }
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity
      style={[
        styles.vendorItem,
        formData.vendorId === item.id.toString() && styles.selectedVendor
      ]}
      onPress={() => selectVendor(item)}
    >
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName}>{item.name}</Text>
        {item.company && <Text style={styles.vendorCompany}>{item.company}</Text>}
      </View>
      {formData.vendorId === item.id.toString() && (
        <Check size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => selectProduct(showProductSheet!, item)}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.productSku}>SKU: {item.sku}</Text>
      </View>
      <Text style={styles.productPrice}>{formatCurrency(item.costPrice)}</Text>
    </TouchableOpacity>
  );

  const handleSave = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      if (!formData.vendorId) {
        Alert.alert('Error', 'Please select a vendor');
        return;
      }

      if (formData.items.length === 0) {
        Alert.alert('Error', 'Please add at least one item');
        return;
      }

      const invoice = {
        userId: user.id,
        invoiceNumber: formData.invoiceNumber,
        vendorId: parseInt(formData.vendorId),
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        status: formData.status,
        subtotal: formData.subtotal,
        tax: formData.tax,
        total: formData.total,
        notes: formData.notes || null,
      };

      const invoiceItems = formData.items.map(item => ({
        productId: item.productId!,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        notes: null,
        invoiceId: 0 // This will be set by the database
      }));

      await createPurchaseInvoice(invoice, invoiceItems);
      Alert.alert('Success', 'Purchase invoice created successfully');
      router.back();
    } catch (error) {
      console.error('Error creating purchase invoice:', error);
      Alert.alert('Error', 'Failed to create purchase invoice');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Purchase Invoice</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor</Text>
          <TouchableOpacity
            style={styles.vendorSelector}
            onPress={() => setShowVendorSheet(true)}
          >
            <View style={styles.selectorContent}>
              <User size={20} color={Colors.text.secondary} />
              <Text style={styles.selectorText}>
                {formData.vendorId
                  ? vendors.find(v => v.id.toString() === formData.vendorId)?.name
                  : 'Select Vendor'}
              </Text>
            </View>
            <ChevronDown size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailField}>
              <Text style={styles.label}>Invoice Number</Text>
              <View style={styles.inputContainer}>
                <Hash size={20} color={Colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  value={formData.invoiceNumber}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, invoiceNumber: value }))}
                  placeholder="Enter invoice number"
                />
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailField}>
              <Text style={styles.label}>Invoice Date</Text>
              <View style={styles.inputContainer}>
                <Calendar size={20} color={Colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  value={formData.invoiceDate}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, invoiceDate: value }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <View style={styles.detailField}>
              <Text style={styles.label}>Due Date</Text>
              <View style={styles.inputContainer}>
                <Calendar size={20} color={Colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  value={formData.dueDate}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, dueDate: value }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailField}>
              <Text style={styles.label}>Status</Text>
              <TouchableOpacity
                style={styles.statusSelector}
                onPress={() => setShowStatusSheet(true)}
              >
                <View style={styles.selectorContent}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(formData.status) }
                    ]}
                  />
                  <Text style={styles.selectorText}>
                    {STATUS_OPTIONS.find(s => s.value === formData.status)?.label}
                  </Text>
                </View>
                <ChevronDown size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Plus size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {formData.items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Item {index + 1}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(index)}
                >
                  <X size={20} color={Colors.status.cancelled} />
                </TouchableOpacity>
              </View>

              <View style={styles.itemContent}>
                <TouchableOpacity
                  style={styles.productSelector}
                  onPress={() => setShowProductSheet(index)}
                >
                  <View style={styles.selectorContent}>
                    <Package size={20} color={Colors.text.secondary} />
                    <Text style={styles.selectorText}>
                      {item.productName || 'Select Product'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color={Colors.text.secondary} />
                </TouchableOpacity>

                <View style={styles.itemRow}>
                  <View style={styles.itemField}>
                    <Text style={styles.label}>Quantity</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={item.quantity.toString()}
                        onChangeText={(value) => handleItemChange(index, 'quantity', value)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                  </View>

                  <View style={styles.itemField}>
                    <Text style={styles.label}>Unit Price</Text>
                    <View style={styles.inputContainer}>
                      <DollarSign size={20} color={Colors.text.secondary} />
                      <TextInput
                        style={styles.input}
                        value={item.unitPrice.toString()}
                        onChangeText={(value) => handleItemChange(index, 'unitPrice', value)}
                        keyboardType="numeric"
                        placeholder="0.00"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.itemField}>
                  <Text style={styles.label}>Total</Text>
                  <Text style={styles.totalText}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.notesContainer}>
            <FileText size={20} color={Colors.text.secondary} />
            <TextInput
              style={styles.notesInput}
              value={formData.notes}
              onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(formData.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (10%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(formData.tax)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(formData.total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Invoice</Text>
        </TouchableOpacity>
      </View>

      {/* Vendor Selection Bottom Sheet */}
      <Modal
        visible={showVendorSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVendorSheet(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Vendor</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowVendorSheet(false)}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                value={vendorSearch}
                onChangeText={setVendorSearch}
                placeholder="Search vendors..."
              />
            </View>

            {loadingVendors ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <FlatList
                data={filteredVendors}
                renderItem={renderVendorItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Product Selection Bottom Sheet */}
      <Modal
        visible={showProductSheet !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProductSheet(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Product</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowProductSheet(null)}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                value={productSearch}
                onChangeText={setProductSearch}
                placeholder="Search products..."
              />
            </View>

            {loadingProducts ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Status Selection Bottom Sheet */}
      <Modal
        visible={showStatusSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStatusSheet(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Status</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStatusSheet(false)}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={STATUS_OPTIONS}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.statusItem,
                    formData.status === item.value && styles.selectedStatus
                  ]}
                  onPress={() => selectStatus(item.value)}
                >
                  <View style={styles.statusItemContent}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(item.value) }
                      ]}
                    />
                    <Text style={styles.statusItemText}>{item.label}</Text>
                  </View>
                  {formData.status === item.value && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.list}
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
    padding: 16,
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
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.background.default,
    marginBottom: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  vendorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  removeButton: {
    padding: 4,
  },
  itemContent: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
  },
  itemField: {
    flex: 1,
  },
  productSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  notesInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  totals: {
    backgroundColor: Colors.background.default,
    padding: 16,
    marginBottom: 80,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  totalValue: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.default,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
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
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  list: {
    padding: 16,
  },
  vendorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  selectedVendor: {
    backgroundColor: Colors.background.secondary,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  vendorCompany: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  productSku: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  productPrice: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  statusSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  selectedStatus: {
    backgroundColor: Colors.background.secondary,
  },
  statusItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
}); 