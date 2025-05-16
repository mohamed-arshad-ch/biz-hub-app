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
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  Package, 
  FileText, 
  DollarSign, 
  ClipboardList,
  Hash,
  Printer
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SalesReturn } from '@/types/sales-return';
import { salesReturnData } from '@/mocks/salesReturnData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function SalesReturnDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [returnData, setReturnData] = useState<SalesReturn | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with loading state
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const returnRecord = salesReturnData.find(r => r.id === id);
        if (returnRecord) {
          setReturnData(returnRecord);
        } else {
          Alert.alert('Error', 'Sales return not found');
          router.back();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load sales return data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Sales Return',
      'Are you sure you want to delete this sales return?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Here you would typically delete the record from your backend
            Alert.alert('Success', 'Sales return deleted successfully');
            router.back();
          }
        }
      ]
    );
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Printing return document...');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'approved':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.active };
      case 'pending':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'rejected':
        return { bg: 'rgba(234, 67, 53, 0.1)', text: Colors.status.cancelled };
      default:
        return { bg: 'rgba(142, 142, 147, 0.1)', text: Colors.text.secondary };
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!returnData) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <Text style={styles.errorText}>Sales return not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackButton}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Return Details</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handlePrint}
            style={styles.headerButton}
          >
            <Printer size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/sales-return/edit/${id}`)}
            style={styles.headerButton}
          >
            <Edit size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Trash2 size={22} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Summary Card */}
        <View style={styles.card}>
          <View style={styles.returnNumberRow}>
            <View style={styles.returnNumberContainer}>
              <Hash size={18} color={Colors.text.secondary} />
              <Text style={styles.returnNumberValue}>{returnData.returnNumber}</Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(returnData.status).bg }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(returnData.status).text }
              ]}>
                {returnData.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Refund</Text>
            <Text style={styles.totalValue}>${returnData.total.toFixed(2)}</Text>
          </View>
        </View>
        
        {/* Return Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Return Information</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <User size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{returnData.customerName}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Calendar size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Return Date</Text>
              <Text style={styles.infoValue}>{new Date(returnData.returnDate).toLocaleDateString()}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <ClipboardList size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Original Order</Text>
              <Text style={styles.infoValue}>{returnData.originalOrderNumber}</Text>
            </View>
          </View>
        </View>
        
        {/* Return Items Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Return Items</Text>
          
          {returnData.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleContainer}>
                  <Package size={18} color={Colors.text.secondary} style={styles.itemIcon} />
                  <Text style={styles.itemTitle}>{item.productName}</Text>
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
              
              <View style={styles.itemReason}>
                <Text style={styles.itemReasonLabel}>Return Reason:</Text>
                <Text style={styles.itemReasonValue}>{item.reason}</Text>
              </View>
            </View>
          ))}
        </View>
        
        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Financial Summary</Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${returnData.subtotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${returnData.tax.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total Refund</Text>
              <Text style={styles.summaryTotalValue}>${returnData.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
        
        {/* Notes */}
        {returnData.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Additional Notes</Text>
            <Text style={styles.notesText}>{returnData.notes}</Text>
          </View>
        )}
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
    marginBottom: 20,
  },
  goBackButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: 'white',
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
    alignItems: 'center',
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
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
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
  returnNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  returnNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  returnNumberValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardTitle: {
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
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  itemCard: {
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
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 8,
  },
  itemTitle: {
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
    flexDirection: 'row',
    marginBottom: 8,
  },
  itemDetail: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  itemReason: {
    marginTop: 4,
  },
  itemReasonLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  itemReasonValue: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  summaryContainer: {
    padding: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  notesText: {
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 22,
  },
}); 