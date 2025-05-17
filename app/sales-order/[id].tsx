import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, ActivityIndicator, Share as RNShare } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Edit, Trash2, User, Calendar, Tag, Clock, Package, DollarSign, FileText, Printer, Hash, Share2, CreditCard } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SalesOrder } from '@/types/sales-order';
import { salesOrderData } from '@/mocks/salesOrderData';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { getSalesOrderById, deleteSalesOrder } from '@/db/sales-order';
import { getCustomerById } from '@/db/customer';
import { getProductById } from '@/db/product';
import { useAuthStore } from '@/store/auth';
import { formatCurrency } from '@/utils/currency';

export default function SalesOrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      if (!user || !id) return;
      setLoading(true);
      const orderData = await getSalesOrderById(Number(id), user.id);
      if (!orderData) {
        Alert.alert('Error', 'Sales order not found');
        router.back();
        return;
      }
      setOrder(orderData);
      // Fetch customer
      const customerData = await getCustomerById(orderData.customerId);
      setCustomer(customerData);
      // Fetch product names for items
      const itemsWithNames = await Promise.all(
        (orderData.items || []).map(async (item: any) => {
          const product = await getProductById(item.productId);
          return {
            ...item,
            productName: product ? product.productName : `Product #${item.productId}`
          };
        })
      );
      setItems(itemsWithNames);
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchOrder();
    }, [id, user])
  );

  const handleDelete = async () => {
    Alert.alert(
      'Delete Sales Order',
      'Are you sure you want to delete this sales order?',
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
              if (!user || !id) return;
              await deleteSalesOrder(Number(id), user.id);
              Alert.alert('Deleted', 'Sales order deleted successfully', [
                { text: 'OK', onPress: () => router.replace({ pathname: '/sales-order/sales-order' }) }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete sales order');
            }
          },
        },
      ]
    );
  };
  
  const handlePrint = () => {
    Alert.alert('Print', 'Printing sales order...');
  };
  
  const handleShareOrder = async () => {
    try {
      if (!order) return;
      const message = `Sales Order: #${order.orderNumber}\nCustomer: ${customer?.name || 'Unknown'}\nTotal: ${formatCurrency(order.total / 100)}\nDate: ${new Date(order.orderDate).toLocaleDateString()}`;
      await RNShare.share({
        message,
      });
    } catch (error) {
      console.log('Error sharing order:', error);
    }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return null;
  }

  const formattedDate = new Date(order.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handlePrint}
          >
            <Printer size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push({
              pathname: '/sales-order/edit/[id]',
              params: { id: id as string }
            })}
          >
            <Edit size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
              <Text style={styles.orderDate}>{formattedDate}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status || 'draft').bg }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status || 'draft').text }]}>
                {(order.status || 'Draft').charAt(0).toUpperCase() + (order.status || 'Draft').slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryAmountContainer}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(order.total / 100)}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Customer</Text>
          {customer && (
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              {customer.email && <Text style={styles.customerDetail}>{customer.email}</Text>}
              {customer.phone && <Text style={styles.customerDetail}>{customer.phone}</Text>}
              
              {/* Customer Balance */}
              <View style={styles.balanceContainer}>
                <CreditCard size={16} color={Colors.text.secondary} />
                <Text style={styles.balanceLabel}>Balance:</Text>
                <Text style={styles.balanceAmount}>
                  {formatCurrency(customer.outstandingBalance ? customer.outstandingBalance / 100 : 0)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Order Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Calendar size={16} color={Colors.text.secondary} />
              <Text style={styles.detailLabel}>Date</Text>
            </View>
            <Text style={styles.detailValue}>{formattedDate}</Text>
          </View>
          
          {order.paymentTerms && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Clock size={16} color={Colors.text.secondary} />
                <Text style={styles.detailLabel}>Payment Terms</Text>
              </View>
              <Text style={styles.detailValue}>{order.paymentTerms}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Tag size={16} color={Colors.text.secondary} />
              <Text style={styles.detailLabel}>Status</Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: getStatusColor(order.status || 'draft').bg }]}>
              <Text style={[styles.statusChipText, { color: getStatusColor(order.status || 'draft').text }]}>
                {(order.status || 'Draft').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <View style={styles.itemNameContainer}>
                  <Package size={16} color={Colors.text.secondary} style={styles.itemIcon} />
                  <Text style={styles.itemName}>{item.productName}</Text>
                </View>
                <Text style={styles.itemTotal}>{formatCurrency(item.total / 100)}</Text>
              </View>
              
              <View style={styles.itemDetails}>
                <View style={styles.itemDetail}>
                  <Text style={styles.itemDetailLabel}>Quantity:</Text>
                  <Text style={styles.itemDetailValue}>{item.quantity}</Text>
                </View>
                
                <View style={styles.itemDetail}>
                  <Text style={styles.itemDetailLabel}>Unit Price:</Text>
                  <Text style={styles.itemDetailValue}>{formatCurrency(item.unitPrice / 100)}</Text>
                </View>
              </View>
              
              {item.description && (
                <Text style={styles.itemDescription}>{item.description}</Text>
              )}
            </View>
          ))}
          
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.subtotal / 100)}</Text>
            </View>
            
            {order.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>{formatCurrency(order.tax / 100)}</Text>
              </View>
            )}
            
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(order.total / 100)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}
        
        {/* Space for footer */}
        <View style={{ height: 80 }} />
      </ScrollView>
      
      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={handleShareOrder}
        >
          <Share2 size={20} color={Colors.primary} />
          <Text style={styles.footerButtonText}>Share Order</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.footerButton, styles.deleteButton]} 
          onPress={handleDelete}
        >
          <Trash2 size={20} color={Colors.negative} />
          <Text style={[styles.footerButtonText, styles.deleteButtonText]}>Delete</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  summaryCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryAmountContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: 16,
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
  },
  sectionCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  customerInfo: {
    gap: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  itemIcon: {
    marginRight: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
    flex: 1,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  itemDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  itemDetail: {
    flexDirection: 'row',
    marginRight: 16,
  },
  itemDetailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginRight: 4,
  },
  itemDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  itemDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  totalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  grandTotalRow: {
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  notesText: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.default,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingVertical: 16,
    paddingHorizontal: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: 'rgba(244, 67, 54, 0.2)',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  deleteButtonText: {
    color: Colors.negative,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
}); 