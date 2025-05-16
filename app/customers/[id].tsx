import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Share,
  Platform,
  StatusBar
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  FileText,
  ShoppingCart,
  Clock,
  Tag,
  Calendar,
  ChevronRight,
  Plus,
  User,
  Trash2,
  DollarSign,
  Share2,
  Check,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Building2
} from "lucide-react-native";
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as dbCustomer from '@/db/customer';
import * as schema from '@/db/schema';

import Colors from "@/constants/colors";
import { formatCurrency, formatDate, formatPhoneNumber } from "@/utils/formatters";
import SnackBar from "@/components/SnackBar";
import EmptyState from '@/components/EmptyState';
import { Customer } from '@/types/customer';

// Mock sales history - this would be replaced with actual data
const salesHistory = [
  {
    id: '1',
    date: new Date('2023-05-10'),
    amount: 1500,
    status: 'paid',
    invoiceNumber: 'INV-2023-001',
  },
  {
    id: '2',
    date: new Date('2023-06-15'),
    amount: 2500,
    status: 'paid',
    invoiceNumber: 'INV-2023-010',
  },
  {
    id: '3',
    date: new Date('2023-07-20'),
    amount: 1200,
    status: 'unpaid',
    invoiceNumber: 'INV-2023-022',
  },
];

export default function CustomerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    loadCustomerData();
  }, [id]);
  
  const loadCustomerData = async () => {
    if (!id) {
      setError('Customer ID is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const dbCustomerData = await dbCustomer.getCustomerById(Number(id));
      
      if (dbCustomerData) {
        setCustomer({
          id: dbCustomerData.id.toString(),
          name: dbCustomerData.name,
          email: dbCustomerData.email || '',
          phone: dbCustomerData.phone || '',
          address: dbCustomerData.address || '',
          city: dbCustomerData.city || '',
          state: dbCustomerData.state || '',
          zipCode: dbCustomerData.zipCode || '',
          country: dbCustomerData.country || '',
          company: dbCustomerData.company || '',
          notes: dbCustomerData.notes || '',
          outstandingBalance: dbCustomerData.outstandingBalance || 0,
          totalPurchases: dbCustomerData.totalPurchases || 0,
          createdAt: dbCustomerData.createdAt ? new Date(dbCustomerData.createdAt) : new Date(),
          updatedAt: new Date(), // Not in schema, but required by type
          category: dbCustomerData.category || '',
          tags: dbCustomerData.tags ? dbCustomerData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          contactPerson: dbCustomerData.contactPerson || '',
          taxId: dbCustomerData.taxId || '',
          paymentTerms: dbCustomerData.paymentTerms || '',
          creditLimit: dbCustomerData.creditLimit || 0,
          status: (dbCustomerData.status as 'active' | 'inactive' | 'blocked') || 'active',
        });
        setError(null);
      } else {
        setError('Customer not found');
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      setError('Failed to load customer data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditCustomer = () => {
    if (id) {
      router.push(`/customers/edit/${id}`);
    }
  };
  
  const handleDeleteCustomer = () => {
    Alert.alert(
      "Delete Customer",
      "Are you sure you want to delete this customer? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (id) {
              try {
                // Simulate successful deletion
                setTimeout(() => {
                  router.replace("/customers");
                }, 500);
              } catch (error) {
                console.error('Error deleting customer:', error);
                showSnackbar("Failed to delete customer");
              }
            }
          }
        }
      ]
    );
  };
  
  const handleCreateSale = () => {
    // Navigate to create new sale page
    Alert.alert('Create Sale', 'This feature will be implemented soon');
  };
  
  const handleCallCustomer = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };
  
  const handleEmailCustomer = () => {
    if (customer?.email) {
      Linking.openURL(`mailto:${customer.email}`);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "#34a853";
      case "pending":
        return "#fbbc04";
      case "overdue":
        return "#ea4335";
      default:
        return "#999";
    }
  };
  
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
    setTimeout(() => {
      setSnackbarVisible(false);
    }, 3000);
  };
  
  const handleShare = async () => {
    if (!customer) return;
    
    try {
      await Share.share({
        message: `Customer: ${customer.name}
Email: ${customer.email}
Phone: ${customer.phone}
Address: ${customer.address || 'N/A'}
Company: ${customer.company || 'N/A'}
Notes: ${customer.notes || 'N/A'}`,
        title: "Customer Details"
      });
    } catch (error) {
      console.error("Error sharing customer:", error);
    }
  };
  
  const handleDelete = async () => {
    if (!id) return;

    Alert.alert(
      "Delete Customer",
      "Are you sure you want to delete this customer? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              const success = await dbCustomer.deleteCustomer(Number(id));
              
              if (success) {
                setSnackbarMessage("Customer deleted successfully");
                setSnackbarVisible(true);
                
                // Navigate back to customers list after a delay
                setTimeout(() => {
                  router.replace('/customers');
                }, 1500);
              } else {
                setSnackbarMessage("Failed to delete customer");
                setSnackbarVisible(true);
              }
            } catch (error) {
              console.error('Error deleting customer:', error);
              setSnackbarMessage("Failed to delete customer");
              setSnackbarVisible(true);
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading customer details...</Text>
      </View>
    );
  }
  
  if (error || !customer) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <Info size={48} color={Colors.negative} />
        <Text style={styles.errorText}>{error || 'Customer not found'}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.secondary} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{customer.name}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => router.push(`/customers/edit/${id}`)} 
            style={styles.headerButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleDelete}
            style={[styles.headerButton, styles.deleteButton]}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Trash2 size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.mainContainer}>
        <View style={styles.profileSection}>
          <View style={styles.profileImage}>
            <User size={60} color={Colors.primary} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            {customer.company && (
              <Text style={styles.companyName}>{customer.company}</Text>
            )}
            <View style={styles.statusBadge}>
              <View 
                style={[
                  styles.statusIndicator, 
                  { 
                    backgroundColor: 
                      customer.status === "active" ? Colors.status.active :
                      customer.status === "inactive" ? Colors.status.pending : 
                      Colors.status.blocked
                  }
                ]} 
              />
              <Text style={styles.statusText}>
                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(customer.outstandingBalance)}</Text>
            <Text style={styles.statLabel}>Balance</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(customer.totalPurchases)}</Text>
            <Text style={styles.statLabel}>Total Purchases</Text>
          </View>
        </View>
        
        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleCallCustomer}>
            <Phone size={20} color={customer.phone ? Colors.primary : '#ccc'} style={styles.contactIcon} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>{formatPhoneNumber(customer.phone)}</Text>
            </View>
            <ChevronRight size={18} color="#999" />
          </TouchableOpacity>
          
          {customer.email && (
            <TouchableOpacity style={styles.contactItem} onPress={handleEmailCustomer}>
              <Mail size={20} color={customer.email ? Colors.primary : '#ccc'} style={styles.contactIcon} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{customer.email}</Text>
              </View>
              <ChevronRight size={18} color="#999" />
            </TouchableOpacity>
          )}
          
          {customer.address && (
            <View style={styles.contactItem}>
              <MapPin size={20} color="#333" style={styles.contactIcon} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactValue}>
                  {customer.address}
                  {customer.city && `, ${customer.city}`}
                  {customer.state && `, ${customer.state}`}
                  {customer.zipCode && ` ${customer.zipCode}`}
                  {customer.country && `, ${customer.country}`}
                </Text>
              </View>
            </View>
          )}
        </View>
        
        {customer.category || (customer.tags && customer.tags.length > 0) ? (
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            {customer.category && (
              <View style={styles.detailItem}>
                <Tag size={20} color="#333" style={styles.detailIcon} />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{customer.category}</Text>
                </View>
              </View>
            )}
            
            {customer.tags && customer.tags.length > 0 && (
              <View style={styles.detailItem}>
                <Tag size={20} color="#333" style={styles.detailIcon} />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Tags</Text>
                  <View style={styles.tagsContainer}>
                    {customer.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
            
            {customer.paymentTerms && (
              <View style={styles.detailItem}>
                <Clock size={20} color="#333" style={styles.detailIcon} />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Payment Terms</Text>
                  <Text style={styles.detailValue}>{customer.paymentTerms}</Text>
                </View>
              </View>
            )}
            
            {customer.creditLimit !== undefined && (
              <View style={styles.detailItem}>
                <FileText size={20} color="#333" style={styles.detailIcon} />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Credit Limit</Text>
                  <Text style={styles.detailValue}>{formatCurrency(customer.creditLimit)}</Text>
                </View>
              </View>
            )}
            
            {customer.createdAt && (
              <View style={styles.detailItem}>
                <Calendar size={20} color="#333" style={styles.detailIcon} />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Customer Since</Text>
                  <Text style={styles.detailValue}>{formatDate(customer.createdAt)}</Text>
                </View>
              </View>
            )}
          </View>
        ) : null}
        
        {customer.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{customer.notes}</Text>
          </View>
        )}
        
        <View style={styles.salesCard}>
          <View style={styles.salesCardHeader}>
            <Text style={styles.sectionTitle}>Sales History</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateSale}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.createButtonText}>New Sale</Text>
            </TouchableOpacity>
          </View>
          
          {salesHistory.length > 0 ? (
            <FlatList
              data={salesHistory}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.salesItem}
                  onPress={() => router.push(`/sales-invoice/${item.id}`)}
                >
                  <View style={styles.salesItemMain}>
                    <View style={styles.salesItemLeft}>
                      <Text style={styles.salesInvoiceNumber}>{item.invoiceNumber}</Text>
                      <Text style={styles.salesDate}>{formatDate(item.date)}</Text>
                    </View>
                    <View style={styles.salesItemRight}>
                      <Text style={styles.salesAmount}>{formatCurrency(item.amount)}</Text>
                      <View style={[
                        styles.salesStatusBadge,
                        { backgroundColor: `${getStatusColor(item.status)}15` }
                      ]}>
                        <Text style={[styles.salesStatusText, { color: getStatusColor(item.status) }]}>
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No sales history yet</Text>
            </View>
          )}
          
          {salesHistory.length > 0 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.back()}
            >
              <Text style={styles.viewAllText}>View All Sales</Text>
              <ChevronRight size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      <SnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  mainContainer: {
    flex: 1,
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
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  editButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: Colors.negative,
    borderRadius: 8,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
margin:6,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginBottom: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  divider: {
    width: 1,
    height: "100%",
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
  },
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  contactIcon: {
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: "#333",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  detailItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailIcon: {
    marginRight: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#666",
  },
  notesCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  notes: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  salesCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  salesCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  createButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  salesItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  salesItemMain: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  salesItemLeft: {
    flex: 1,
  },
  salesInvoiceNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  salesDate: {
    fontSize: 12,
    color: "#666",
  },
  salesItemRight: {
    alignItems: "flex-end",
  },
  salesAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 4,
  },
  salesStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  salesStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
    marginRight: 4,
  },
  bottomSpacer: {
    height: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#c62828',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
}); 