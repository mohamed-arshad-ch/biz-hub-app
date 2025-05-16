import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Edit, Trash2, User, Calendar, Tag, Clock, Package, DollarSign, FileText, Printer, Hash } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SalesOrder } from '@/types/sales-order';
import { salesOrderData } from '@/mocks/salesOrderData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function SalesOrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch the order data from your backend
    const fetchOrder = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        const foundOrder = salesOrderData.find(o => o.id === id);
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          Alert.alert('Error', 'Sales order not found');
          router.back();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleDelete = () => {
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
          onPress: () => {
            // In a real app, you would delete the order from your backend
            router.back();
          },
        },
      ]
    );
  };
  
  const handlePrint = () => {
    Alert.alert('Print', 'Printing sales order...');
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handlePrint} style={styles.headerButton}>
            <Printer size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/sales-order/edit/[id]',
              params: { id: id as string }
            })}
            style={styles.headerButton}
          >
            <Edit size={22} color={Colors.text.secondary} />
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
      ) : order && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>${order.total.toFixed(2)}</Text>
            {order.status && (
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status).bg }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(order.status).text }
                ]}>
                  {order.status.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Information</Text>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Hash size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Order Number</Text>
                <Text style={styles.infoValue}>{order.orderNumber}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <User size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Customer</Text>
                <Text style={styles.infoValue}>{order.customerName}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Calendar size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Order Date</Text>
                <Text style={styles.infoValue}>{new Date(order.orderDate).toLocaleDateString()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {order.items.map((item, index) => (
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
                <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (10%)</Text>
                <Text style={styles.summaryValue}>${order.tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalRowLabel}>Total</Text>
                <Text style={styles.totalRowValue}>${order.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {order.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          )}
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    backgroundColor: Colors.primary + '10',
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
}); 