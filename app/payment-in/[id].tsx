import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, ActivityIndicator, Share as RNShare } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Edit, Trash2, Calendar, CreditCard, User, Hash, Tag, Clock, Printer } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PaymentIn } from '@/types/payment-in';
import { paymentInData } from '@/mocks/paymentInData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function PaymentInDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [payment, setPayment] = useState<PaymentIn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch the payment data from your backend
    const fetchPayment = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        const foundPayment = paymentInData.find(p => p.id === id);
        if (foundPayment) {
          setPayment(foundPayment);
        } else {
          Alert.alert('Error', 'Payment not found');
          router.back();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load payment details');
      } finally {
        setLoading(false);
      }
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
            // In a real app, you would delete the payment from your backend
            router.back();
          },
        },
      ]
    );
  };
  
  const handlePrint = () => {
    Alert.alert('Print', 'Printing payment receipt...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'pending':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      default:
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.status.cancelled };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Details</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handlePrint} style={styles.headerButton}>
            <Printer size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/payment-in/edit/[id]',
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
      ) : payment && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>${payment.amount.toFixed(2)}</Text>
            {payment.status && (
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(payment.status).bg }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(payment.status).text }
                ]}>
                  {payment.status.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <User size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Customer</Text>
                <Text style={styles.infoValue}>{payment.customerName}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Calendar size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Payment Date</Text>
                <Text style={styles.infoValue}>{new Date(payment.paymentDate).toLocaleDateString()}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <CreditCard size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>{payment.paymentMethod}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Hash size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Reference Number</Text>
                <Text style={styles.infoValue}>{payment.referenceNumber || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {payment.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notes}>{payment.notes}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Clock size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Created At</Text>
                <Text style={styles.infoValue}>{new Date(payment.createdAt).toLocaleString()}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Tag size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>{new Date(payment.updatedAt).toLocaleString()}</Text>
              </View>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 18,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  amountCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  amountLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
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
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
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
  notes: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 22,
  },
}); 