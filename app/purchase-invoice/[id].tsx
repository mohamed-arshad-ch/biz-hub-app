import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Printer, 
  Trash, 
  Pencil,
  Calendar, 
  User, 
  FileText, 
  DollarSign,
  Receipt
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Mock data for purchase invoices
const purchaseInvoiceData = [
  {
    id: 'pi-001',
    invoiceNumber: 'PI-2023-001',
    vendorId: 'v-001',
    vendorName: 'ABC Suppliers',
    invoiceDate: '2023-08-15',
    dueDate: '2023-09-15',
    subtotal: 750.00,
    tax: 75.00,
    total: 825.00,
    status: 'paid',
    items: [
      { id: 'item-001', productName: 'Office Chair', quantity: 3, unitPrice: 150.00, total: 450.00 },
      { id: 'item-002', productName: 'Desk Lamp', quantity: 6, unitPrice: 50.00, total: 300.00 }
    ]
  },
  {
    id: 'pi-002',
    invoiceNumber: 'PI-2023-002',
    vendorId: 'v-002',
    vendorName: 'XYZ Electronics',
    invoiceDate: '2023-08-20',
    dueDate: '2023-09-20',
    subtotal: 1200.00,
    tax: 120.00,
    total: 1320.00,
    status: 'unpaid',
    items: [
      { id: 'item-003', productName: 'Laptop', quantity: 1, unitPrice: 1200.00, total: 1200.00 }
    ]
  },
  {
    id: 'pi-003',
    invoiceNumber: 'PI-2023-003',
    vendorId: 'v-003',
    vendorName: 'Office Supplies Co.',
    invoiceDate: '2023-08-10',
    dueDate: '2023-09-10',
    subtotal: 480.00,
    tax: 48.00,
    total: 528.00,
    status: 'overdue',
    items: [
      { id: 'item-004', productName: 'Printer Paper', quantity: 20, unitPrice: 10.00, total: 200.00 },
      { id: 'item-005', productName: 'Ink Cartridges', quantity: 4, unitPrice: 70.00, total: 280.00 }
    ]
  },
  {
    id: 'pi-004',
    invoiceNumber: 'PI-2023-004',
    vendorId: 'v-004',
    vendorName: 'Tech Gadgets Inc.',
    invoiceDate: '2023-08-25',
    dueDate: '2023-09-25',
    subtotal: 900.00,
    tax: 90.00,
    total: 990.00,
    status: 'unpaid',
    items: [
      { id: 'item-006', productName: 'Wireless Headphones', quantity: 3, unitPrice: 150.00, total: 450.00 },
      { id: 'item-007', productName: 'Smart Speaker', quantity: 3, unitPrice: 150.00, total: 450.00 }
    ]
  },
  {
    id: 'pi-005',
    invoiceNumber: 'PI-2023-005',
    vendorId: 'v-005',
    vendorName: 'Furniture Warehouse',
    invoiceDate: '2023-07-30',
    dueDate: '2023-08-30',
    subtotal: 2500.00,
    tax: 250.00,
    total: 2750.00,
    status: 'cancelled',
    items: [
      { id: 'item-008', productName: 'Conference Table', quantity: 1, unitPrice: 1500.00, total: 1500.00 },
      { id: 'item-009', productName: 'Office Chair', quantity: 5, unitPrice: 200.00, total: 1000.00 }
    ]
  }
];

// Interface for PurchaseInvoice
interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export default function PurchaseInvoiceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const fetchInvoice = () => {
      setLoading(true);
      setTimeout(() => {
        const foundInvoice = purchaseInvoiceData.find(i => i.id === id);
        setInvoice(foundInvoice || null);
        setLoading(false);
      }, 500);
    };

    fetchInvoice();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Here you would typically call an API to delete the invoice
            Alert.alert('Success', 'Invoice deleted successfully');
            router.back();
          },
        },
      ]
    );
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Printing invoice...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'unpaid':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'overdue':
        return { bg: 'rgba(255, 59, 48, 0.1)', text: '#FF3B30' };
      case 'cancelled':
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.status.cancelled };
      default:
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.text.secondary };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading invoice details...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <Text style={styles.errorText}>Invoice not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Invoice Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>${invoice.total.toFixed(2)}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(invoice.status).bg }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: getStatusColor(invoice.status).text }
            ]}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Invoice Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Receipt size={18} color={Colors.text.secondary} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Invoice Number</Text>
                  <Text style={styles.infoValue}>{invoice.invoiceNumber}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Calendar size={18} color={Colors.text.secondary} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Invoice Date</Text>
                  <Text style={styles.infoValue}>{new Date(invoice.invoiceDate).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Calendar size={18} color={Colors.text.secondary} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Due Date</Text>
                  <Text style={styles.infoValue}>{new Date(invoice.dueDate).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Vendor Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <User size={18} color={Colors.text.secondary} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Vendor Name</Text>
                  <Text style={styles.infoValue}>{invoice.vendorName}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Invoice Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Items</Text>
          <View style={styles.card}>
            {invoice.items.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.itemContainer}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemPrice}>${item.unitPrice.toFixed(2)} × {item.quantity}</Text>
                  </View>
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${invoice.subtotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${invoice.tax.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRowTotal}>
              <Text style={styles.summaryLabelTotal}>Total</Text>
              <Text style={styles.summaryValueTotal}>${invoice.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Trash size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.printButton]}
            onPress={handlePrint}
          >
            <Printer size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Print</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => router.push(`/purchase-invoice/edit/${invoice.id}`)}
          >
            <Pencil size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
  amountCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 12,
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 12,
  },
  itemContainer: {
    paddingVertical: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  itemTotal: {
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  printButton: {
    backgroundColor: Colors.text.secondary,
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
}); 