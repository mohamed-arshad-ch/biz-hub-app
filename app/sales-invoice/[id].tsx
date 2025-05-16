import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Edit, Trash2, User, Calendar, Tag, Clock, Package, DollarSign, FileText, Printer, Hash, CheckCircle2, AlertTriangle, XCircle, Pencil } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Import the mock data
const salesInvoiceData: SalesInvoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-0001',
      customerName: 'Acme Corporation',
      invoiceDate: '2023-05-15',
      dueDate: '2023-06-15',
      total: 1250.00,
      subtotal: 1136.36,
      tax: 113.64,
      status: 'paid',
      items: [
        {
          productId: 'p1',
          productName: 'Website Development',
          quantity: 1,
          unitPrice: 1000.00,
          total: 1000.00
        },
        {
          productId: 'p2',
          productName: 'SEO Services',
          quantity: 5,
          unitPrice: 50.00,
          total: 250.00
        }
      ]
    },
    {
      id: '2',
      invoiceNumber: 'INV-0002',
      customerName: 'Tech Solutions Inc.',
      invoiceDate: '2023-05-20',
      dueDate: '2023-06-20',
      total: 750.00,
      subtotal: 681.82,
      tax: 68.18,
      status: 'unpaid',
      items: [
        {
          productId: 'p3',
          productName: 'Consulting Services',
          quantity: 5,
          unitPrice: 150.00,
          total: 750.00
        }
      ]
    },
    {
      id: '3',
      invoiceNumber: 'INV-0003',
      customerName: 'Global Enterprises',
      invoiceDate: '2023-04-10',
      dueDate: '2023-05-10',
      total: 3500.00,
      subtotal: 3181.82,
      tax: 318.18,
      status: 'overdue',
      items: [
        {
          productId: 'p4',
          productName: 'Software License',
          quantity: 1,
          unitPrice: 2500.00,
          total: 2500.00
        },
        {
          productId: 'p5',
          productName: 'Support Package',
          quantity: 10,
          unitPrice: 100.00,
          total: 1000.00
        }
      ]
    },
    {
      id: '4',
      invoiceNumber: 'INV-0004',
      customerName: 'Startups Ltd.',
      invoiceDate: '2023-05-25',
      dueDate: '2023-06-25',
      total: 500.00,
      subtotal: 454.55,
      tax: 45.45,
      status: 'cancelled',
      items: [
        {
          productId: 'p6',
          productName: 'Marketing Materials',
          quantity: 1,
          unitPrice: 500.00,
          total: 500.00
        }
      ]
    }
  ];

// Define the SalesInvoice interface from our list screen
interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  subtotal: number;
  tax: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
}

export default function SalesInvoiceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch the invoice data from your backend
    const fetchInvoice = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        const foundInvoice = salesInvoiceData.find(i => i.id === id);
        if (foundInvoice) {
          setInvoice(foundInvoice);
        } else {
          Alert.alert('Error', 'Sales invoice not found');
          router.back();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Sales Invoice',
      'Are you sure you want to delete this sales invoice?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In a real app, you would delete the invoice from your backend
            router.back();
          },
        },
      ]
    );
  };
  
  const handlePrint = () => {
    Alert.alert('Print', 'Printing sales invoice...');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 size={20} color={Colors.status.completed} />;
      case 'unpaid':
        return <Clock size={20} color={Colors.status.pending} />;
      case 'overdue':
        return <AlertTriangle size={20} color={Colors.negative} />;
      case 'cancelled':
        return <XCircle size={20} color={Colors.status.cancelled} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Invoice Details</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handlePrint} style={styles.headerButton}>
            <Printer size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push(`/sales-invoice/edit/1`)} 
            style={styles.headerButton}
          >
            <Pencil size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Trash2 size={22} color={Colors.negative} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : invoice && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>${invoice.total.toFixed(2)}</Text>
            {invoice.status && (
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(invoice.status).bg }
              ]}>
                {getStatusIcon(invoice.status)}
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(invoice.status).text }
                ]}>
                  {getStatusText(invoice.status)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invoice Information</Text>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Hash size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Invoice Number</Text>
                <Text style={styles.infoValue}>{invoice.invoiceNumber}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <User size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Customer</Text>
                <Text style={styles.infoValue}>{invoice.customerName}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Calendar size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Invoice Date</Text>
                <Text style={styles.infoValue}>{new Date(invoice.invoiceDate).toLocaleDateString()}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Calendar size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{new Date(invoice.dueDate).toLocaleDateString()}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <DollarSign size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Payment Status</Text>
                <View style={[
                  styles.statusBadgeSmall,
                  { backgroundColor: getStatusColor(invoice.status).bg }
                ]}>
                  <Text style={[
                    styles.statusTextSmall,
                    { color: getStatusColor(invoice.status).text }
                  ]}>
                    {invoice.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {invoice.items.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemNameContainer}>
                    <Package size={18} color={Colors.text.secondary} style={{ marginRight: 8 }} />
                    <Text style={styles.itemName}>{item.productName}</Text>
                  </View>
                  <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
                </View>
                <View style={styles.itemDetails}>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Quantity:</Text>
                    <Text style={styles.itemDetailValue}>{item.quantity}</Text>
                  </View>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Unit Price:</Text>
                    <Text style={styles.itemDetailValue}>${item.unitPrice.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${invoice.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (10%)</Text>
                <Text style={styles.summaryValue}>${invoice.tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalRowLabel}>Total</Text>
                <Text style={styles.totalRowValue}>${invoice.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {invoice.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}

          {/* <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => router.push(`/sales-invoice/edit/${invoice.id}`)}
          >
            <Pencil size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Edit Invoice</Text>
          </TouchableOpacity> */}
        </ScrollView>
      )}
    </View>
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
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
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  statusTextSmall: {
    fontSize: 11,
    fontWeight: '600',
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
    borderColor: Colors.primary + '40',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  itemContainer: {
    padding: 12,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    flex: 1,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  itemDetails: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  itemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  itemDetailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  itemDetailValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
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
  notesText: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
}); 