import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Share
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Printer,
  Share2,
  Edit,
  Trash,
  FileText,
  Package,
  DollarSign,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../db';
import { purchaseOrders, purchaseOrderItems, vendors, products } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { useAuthStore } from '@/store/auth';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';

interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discount: number;
  tax: number;
}

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  vendorId: number;
  vendorName: string;
  orderDate: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  notes: string;
  shippingAddress: string;
  billingAddress: string;
  paymentTerms: string;
  dueDate: string;
  items: PurchaseOrderItem[];
}

export default function PurchaseOrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    loadPurchaseOrder();
  }, [id]);

  const loadPurchaseOrder = async () => {
    if (!user || !id) return;

    try {
      // Load purchase order details
      const [orderResult] = await db
        .select({
          id: purchaseOrders.id,
          orderNumber: purchaseOrders.orderNumber,
          orderDate: purchaseOrders.orderDate,
          status: purchaseOrders.status,
          total: purchaseOrders.total,
          subtotal: purchaseOrders.subtotal,
          tax: purchaseOrders.tax,
          discount: purchaseOrders.discount,
          notes: purchaseOrders.notes,
          shippingAddress: purchaseOrders.shippingAddress,
          billingAddress: purchaseOrders.billingAddress,
          paymentTerms: purchaseOrders.paymentTerms,
          dueDate: purchaseOrders.dueDate,
          vendorId: purchaseOrders.vendorId,
          vendorName: vendors.name,
        })
        .from(purchaseOrders)
        .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
        .where(eq(purchaseOrders.id, parseInt(id as string)))
        .limit(1);

      if (!orderResult) {
        Alert.alert('Error', 'Purchase order not found');
        router.back();
        return;
      }

      // Load purchase order items
      const itemsResult = await db
        .select({
          id: purchaseOrderItems.id,
          productId: purchaseOrderItems.productId,
          quantity: purchaseOrderItems.quantity,
          unitPrice: purchaseOrderItems.unitPrice,
          total: purchaseOrderItems.total,
          discount: purchaseOrderItems.discount,
          tax: purchaseOrderItems.tax,
          productName: products.productName,
        })
        .from(purchaseOrderItems)
        .leftJoin(products, eq(purchaseOrderItems.productId, products.id))
        .where(eq(purchaseOrderItems.orderId, parseInt(id as string)));

      setOrder({
        ...orderResult,
        items: itemsResult,
      });
    } catch (error) {
      console.error('Error loading purchase order:', error);
      Alert.alert('Error', 'Failed to load purchase order details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Purchase Order',
      'Are you sure you want to delete this purchase order?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, parseInt(id as string)));
              await db.delete(purchaseOrders).where(eq(purchaseOrders.id, parseInt(id as string)));
              Alert.alert('Success', 'Purchase order deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting purchase order:', error);
              Alert.alert('Error', 'Failed to delete purchase order');
            }
          },
        },
      ]
    );
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Printing purchase order...');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Purchase Order #${order?.orderNumber}\nVendor: ${order?.vendorName}\nTotal: ${formatCurrency(order?.total || 0)}`,
      });
    } catch (error) {
      console.error('Error sharing purchase order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'pending':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'processing':
        return { bg: 'rgba(33, 150, 243, 0.1)', text: '#2196F3' };
      case 'cancelled':
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.status.cancelled };
      default:
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.text.secondary };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Purchase order not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Purchase Order Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handlePrint} style={styles.actionButton}>
            <Printer size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Share2 size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Order Status */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status).bg }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status).text }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Order Information</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Order Number</Text>
              <Text style={styles.infoValue}>{order.orderNumber}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Order Date</Text>
              <Text style={styles.infoValue}>{format(new Date(order.orderDate), 'MMM dd, yyyy')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>{order.dueDate ? format(new Date(order.dueDate), 'MMM dd, yyyy') : 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Payment Terms</Text>
              <Text style={styles.infoValue}>{order.paymentTerms || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Vendor Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Vendor Information</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Vendor Name</Text>
              <Text style={styles.infoValue}>{order.vendorName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Shipping Address</Text>
              <Text style={styles.infoValue}>{order.shippingAddress || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Billing Address</Text>
              <Text style={styles.infoValue}>{order.billingAddress || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Items</Text>
          </View>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemDetails}>
                  {item.quantity} x {formatCurrency(item.unitPrice)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Totals</Text>
          </View>
          <View style={styles.totalsGrid}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.tax)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.discount)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <Text style={styles.notes}>{order.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.editButton]}
          onPress={() => router.push(`/purchase-order/edit/${id}`)}
        >
          <Edit size={20} color="#fff" />
          <Text style={styles.footerButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Trash size={20} color="#fff" />
          <Text style={styles.footerButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
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
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusSection: {
    marginBottom: 24,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.background.default,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  infoItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  totalsGrid: {
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  totalValue: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  notes: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.background.default,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.negative,
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 