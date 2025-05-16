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
  ShoppingCart,
  Tag,
  Receipt
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PurchaseReturn } from '@/types/purchase-return';
import { purchaseReturnData } from '@/mocks/purchaseReturnData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function PurchaseReturnDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [returnData, setReturnData] = useState<PurchaseReturn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const fetchReturn = () => {
      setLoading(true);
      setTimeout(() => {
        const foundReturn = purchaseReturnData.find(r => r.id === id);
        setReturnData(foundReturn || null);
        setLoading(false);
      }, 500);
    };

    fetchReturn();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Return',
      'Are you sure you want to delete this return?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Here you would typically call an API to delete the return
            Alert.alert('Success', 'Return deleted successfully');
            router.back();
          },
        },
      ]
    );
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Printing return...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'pending':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'draft':
        return { bg: 'rgba(90, 200, 250, 0.1)', text: '#5AC8FA' };
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
        <Text style={styles.loadingText}>Loading return details...</Text>
      </View>
    );
  }

  if (!returnData) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <Text style={styles.errorText}>Return not found</Text>
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
        <Text style={styles.title}>Return Details</Text>
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
          <Text style={styles.amountValue}>${returnData.total.toFixed(2)}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(returnData.status).bg }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: getStatusColor(returnData.status).text }
            ]}>
              {returnData.status.charAt(0).toUpperCase() + returnData.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Return Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Return Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Receipt size={18} color={Colors.text.secondary} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Return Number</Text>
                  <Text style={styles.infoValue}>{returnData.returnNumber}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <ShoppingCart size={18} color={Colors.text.secondary} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Original Order</Text>
                  <Text style={styles.infoValue}>{returnData.originalOrderNumber}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Calendar size={18} color={Colors.text.secondary} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Return Date</Text>
                  <Text style={styles.infoValue}>{new Date(returnData.returnDate).toLocaleDateString()}</Text>
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
                  <Text style={styles.infoValue}>{returnData.vendorName}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Return Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Return Items</Text>
          <View style={styles.card}>
            {returnData.items.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.itemContainer}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemPrice}>${item.unitPrice.toFixed(2)} × {item.quantity}</Text>
                  </View>
                  <View style={styles.itemDetails}>
                    <View style={styles.reasonContainer}>
                      <Tag size={14} color={Colors.text.secondary} />
                      <Text style={styles.reasonText}>{item.reason}</Text>
                    </View>
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
              <Text style={styles.summaryValue}>${returnData.subtotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${returnData.tax.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRowTotal}>
              <Text style={styles.summaryLabelTotal}>Total</Text>
              <Text style={styles.summaryValueTotal}>${returnData.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {returnData.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <FileText size={18} color={Colors.text.secondary} style={styles.infoIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notesText}>{returnData.notes}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

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
            onPress={() => router.push(`/purchase-return/edit/${returnData.id}`)}
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
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 6,
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
  notesText: {
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 22,
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