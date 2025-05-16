import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Printer, 
  Trash, 
  Pencil,
  Calendar,
  CreditCard,
  DollarSign,
  Receipt,
  User,
  FileText
} from 'lucide-react-native';
import { paymentOutData } from '@/mocks/paymentOutData';
import { PaymentOut } from '@/types/payment-out';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function PaymentOutDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<PaymentOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const fetchPayment = () => {
      setLoading(true);
      setTimeout(() => {
        const foundPayment = paymentOutData.find(p => p.id === id);
        setPayment(foundPayment || null);
        setLoading(false);
      }, 500);
    };

    fetchPayment();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Here you would typically call an API to delete the payment
            Alert.alert('Success', 'Payment deleted successfully');
            router.back();
          },
        },
      ]
    );
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Printing payment...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'pending':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
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
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <Text style={styles.errorText}>Payment not found</Text>
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
        <Text style={styles.title}>Payment Details</Text>
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
          <Text style={styles.amountValue}>${payment.amount.toFixed(2)}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(payment.status).bg }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: getStatusColor(payment.status).text }
            ]}>
              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Receipt size={18} color={Colors.text.secondary} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Reference Number</Text>
                  <Text style={styles.infoValue}>#{payment.referenceNumber}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Calendar size={18} color={Colors.text.secondary} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Payment Date</Text>
                  <Text style={styles.infoValue}>{new Date(payment.paymentDate).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <CreditCard size={18} color={Colors.text.secondary} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Payment Method</Text>
                  <Text style={styles.infoValue}>
                    {payment.paymentMethod.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Text>
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
                  <Text style={styles.infoValue}>{payment.vendorName}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Description/Notes */}
        {payment.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <FileText size={18} color={Colors.text.secondary} style={styles.infoIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Description</Text>
                    <Text style={styles.infoValue}>{payment.notes}</Text>
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
            onPress={() => router.push(`/payment-out/edit/${payment.id}`)}
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