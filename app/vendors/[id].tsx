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
  StatusBar,
  Platform,
  Share
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Share2,
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
  DollarSign,
  Building,
  Briefcase,
  CreditCard,
  Info
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { formatCurrency, formatDate, formatPhoneNumber } from "@/utils/formatters";
import SnackBar from "@/components/SnackBar";
import EmptyState from '@/components/EmptyState';
import { Vendor } from '@/types/vendor';

// Mock purchase history - this would be replaced with actual data
const purchaseHistory = [
  {
    id: '1',
    date: new Date('2023-05-10'),
    amount: 1500,
    status: 'paid',
    invoiceNumber: 'PO-2023-001',
  },
  {
    id: '2',
    date: new Date('2023-06-15'),
    amount: 2500,
    status: 'paid',
    invoiceNumber: 'PO-2023-010',
  },
  {
    id: '3',
    date: new Date('2023-07-20'),
    amount: 1200,
    status: 'pending',
    invoiceNumber: 'PO-2023-022',
  },
];

// Mock vendors data for demonstration
const mockVendors: { [key: string]: Vendor } = {
  '1': {
    id: '1',
    name: 'TechSuppliers Inc.',
    contactName: 'John Smith',
    email: 'john@techsuppliers.com',
    phone: '+1 (555) 123-4567',
    address: '123 Supplier St, San Francisco, CA 94107',
    website: 'https://techsuppliers.com',
    notes: 'Primary supplier for electronics and technology products',
    status: 'active',
    paymentTerms: 'Net 30',
    taxIdentifier: 'TX-12345678',
    outstandingBalance: 5200.50,
    totalPurchases: 42800.75,
    category: 'Electronics',
    tags: ['technology', 'electronics', 'computers'],
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2023-05-15')
  },
  '2': {
    id: '2',
    name: 'FurniturePlus',
    contactName: 'Sarah Johnson',
    email: 'sarah@furnitureplus.com',
    phone: '+1 (555) 987-6543',
    address: '456 Furniture Ave, Chicago, IL 60611',
    website: 'https://furnitureplus.com',
    notes: 'Office furniture and accessories supplier',
    status: 'active',
    paymentTerms: 'Net 45',
    taxIdentifier: 'TX-87654321',
    outstandingBalance: 0,
    totalPurchases: 18900.25,
    category: 'Furniture',
    tags: ['furniture', 'office', 'chairs'],
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2023-06-01')
  },
  '3': {
    id: '3',
    name: 'Global Shipping Services',
    contactName: 'Michael Brown',
    email: 'michael@globalshipping.com',
    phone: '+1 (555) 567-8901',
    address: '789 Logistics Pkwy, Miami, FL 33101',
    website: 'https://globalshipping.com',
    notes: 'International shipping and logistics provider',
    status: 'inactive',
    paymentTerms: 'Net 15',
    taxIdentifier: 'TX-23456789',
    outstandingBalance: 1250.00,
    totalPurchases: 35600.50,
    category: 'Logistics',
    tags: ['shipping', 'logistics', 'international'],
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-04-10')
  },
  '4': {
    id: '4',
    name: 'Office Supplies Direct',
    contactName: 'Jennifer Lee',
    email: 'jennifer@officesupplies.com',
    phone: '+1 (555) 234-5678',
    address: '101 Office Park, Boston, MA 02110',
    website: 'https://officesuppliesdirect.com',
    notes: 'Bulk supplier for office consumables and supplies',
    status: 'active',
    paymentTerms: 'Net 30',
    taxIdentifier: 'TX-34567890',
    outstandingBalance: 750.25,
    totalPurchases: 12500.75,
    category: 'Office Supplies',
    tags: ['office', 'supplies', 'paper'],
    createdAt: new Date('2023-01-25'),
    updatedAt: new Date('2023-05-05')
  },
  '5': {
    id: '5',
    name: 'Digital Marketing Solutions',
    contactName: 'Robert Chen',
    email: 'robert@digitalmarketing.com',
    phone: '+1 (555) 345-6789',
    address: '222 Digital Dr, Seattle, WA 98101',
    website: 'https://digitalmarketingsolutions.com',
    notes: 'Marketing services and software provider',
    status: 'active',
    paymentTerms: 'Net 15',
    taxIdentifier: 'TX-45678901',
    outstandingBalance: 3200.00,
    totalPurchases: 28750.50,
    category: 'Services',
    tags: ['marketing', 'digital', 'software'],
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2023-06-10')
  }
};

export default function VendorDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  useEffect(() => {
    loadVendorData();
  }, [id]);
  
  const loadVendorData = async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Use mock data instead of AsyncStorage
      if (mockVendors[id]) {
        setVendor(mockVendors[id]);
      } else {
        console.error("Vendor not found");
        setSnackbarMessage("Failed to load vendor details");
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error("Error loading vendor:", error);
      setSnackbarMessage("Failed to load vendor details");
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditVendor = () => {
    if (id) {
      router.push(`/vendors/edit/${id}`);
    }
  };
  
  const handleDeleteVendor = async () => {
    Alert.alert(
      "Delete Vendor",
      `Are you sure you want to delete ${vendor?.name}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            
            try {
              // Simulate successful deletion
              setTimeout(() => {
                setSnackbarMessage("Vendor deleted successfully");
                setSnackbarVisible(true);
                
                // Navigate back after a short delay
                setTimeout(() => {
                  router.replace("/vendors");
                }, 1000);
              }, 500);
            } catch (error) {
              console.error("Error deleting vendor:", error);
              setSnackbarMessage("Failed to delete vendor");
              setSnackbarVisible(true);
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const handleCreatePurchase = () => {
    // Navigate to create new purchase page
    Alert.alert('Create Purchase', 'This feature will be implemented soon');
  };
  
  const handleCallVendor = () => {
    if (vendor?.phone) {
      Linking.openURL(`tel:${vendor.phone}`);
    }
  };
  
  const handleEmailVendor = () => {
    if (vendor?.email) {
      Linking.openURL(`mailto:${vendor.email}`);
    }
  };
  
  const handleVisitWebsite = () => {
    if (vendor?.website) {
      let website = vendor.website;
      if (!website.startsWith('http')) {
        website = 'https://' + website;
      }
      Linking.openURL(website);
    }
  };
  
  const handleShare = () => {
    if (!vendor) return;
    
    const shareInfo = `Vendor: ${vendor.name}
Email: ${vendor.email || 'N/A'}
Phone: ${vendor.phone || 'N/A'}
Address: ${vendor.address || 'N/A'}
Website: ${vendor.website || 'N/A'}`;
    
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      try {
        Share.share({
          message: shareInfo,
          title: "Vendor Details"
        });
      } catch (error) {
        console.error("Error sharing vendor:", error);
      }
    } else {
      // Copy to clipboard or show a message for other platforms
      showSnackbar("Sharing not available on this platform");
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
  
  const getVendorStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return Colors.status.active;
      case 'inactive':
        return Colors.status.inactive;
      case 'blocked':
        return Colors.status.blocked;
      default:
        return Colors.status.inactive;
    }
  };
  
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
    setTimeout(() => {
      setSnackbarVisible(false);
    }, 3000);
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading vendor details...</Text>
      </View>
    );
  }
  
  if (error || !vendor) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <Info size={48} color={Colors.negative} />
        <Text style={styles.errorText}>{error || 'Vendor not found'}</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Vendor Details</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Share2 size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEditVendor} style={styles.headerButton}>
            <Edit size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteVendor} style={styles.headerButton}>
            <Trash2 size={22} color={Colors.negative} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.mainContent} contentContainerStyle={styles.contentContainer}>
        {/* Vendor Overview Card */}
        <View style={styles.card}>
          <View style={styles.vendorHeader}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.background.tertiary }]}>
                <Text style={styles.avatarText}>
                  {vendor.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.vendorMainInfo}>
              <Text style={styles.vendorName}>{vendor.name}</Text>
              {vendor.company && (
                <Text style={styles.companyName}>{vendor.company}</Text>
              )}
              <View style={styles.vendorSubInfo}>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: getVendorStatusColor(vendor.status) + '20' }
                ]}>
                  <View style={[
                    styles.statusDot, 
                    { backgroundColor: getVendorStatusColor(vendor.status) }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: getVendorStatusColor(vendor.status) }
                  ]}>
                    {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                  </Text>
                </View>
                {vendor.category && (
                  <View style={styles.categoryContainer}>
                    <Tag size={14} color={Colors.text.secondary} />
                    <Text style={styles.categoryText}>{vendor.category}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(vendor.outstandingBalance)}</Text>
            <Text style={styles.statLabel}>Payable Balance</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(vendor.totalPurchases)}</Text>
            <Text style={styles.statLabel}>Total Purchases</Text>
          </View>
        </View>
        
        {/* Contact Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          {vendor.phone && (
            <TouchableOpacity style={styles.contactItem} onPress={handleCallVendor}>
              <Phone size={20} color={Colors.primary} style={styles.contactIcon} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{formatPhoneNumber(vendor.phone)}</Text>
              </View>
              <ChevronRight size={18} color="#999" />
            </TouchableOpacity>
          )}
          
          {vendor.email && (
            <TouchableOpacity style={styles.contactItem} onPress={handleEmailVendor}>
              <Mail size={20} color={Colors.primary} style={styles.contactIcon} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{vendor.email}</Text>
              </View>
              <ChevronRight size={18} color="#999" />
            </TouchableOpacity>
          )}
          
          {vendor.website && (
            <TouchableOpacity style={styles.contactItem} onPress={handleVisitWebsite}>
              <Globe size={20} color={Colors.primary} style={styles.contactIcon} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>{vendor.website}</Text>
              </View>
              <ChevronRight size={18} color="#999" />
            </TouchableOpacity>
          )}
          
          {vendor.address && (
            <View style={styles.contactItem}>
              <MapPin size={20} color={Colors.primary} style={styles.contactIcon} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactValue}>{vendor.address}</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Business Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Business Details</Text>
          
          {vendor.paymentTerms && (
            <View style={styles.detailItem}>
              <Clock size={20} color={Colors.primary} style={styles.detailIcon} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Payment Terms</Text>
                <Text style={styles.detailValue}>{vendor.paymentTerms}</Text>
              </View>
            </View>
          )}
          
          {vendor.creditLimit !== undefined && (
            <View style={styles.detailItem}>
              <CreditCard size={20} color={Colors.primary} style={styles.detailIcon} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Credit Limit</Text>
                <Text style={styles.detailValue}>{formatCurrency(vendor.creditLimit)}</Text>
              </View>
            </View>
          )}
          
          {vendor.category && (
            <View style={styles.detailItem}>
              <Tag size={20} color={Colors.primary} style={styles.detailIcon} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{vendor.category}</Text>
              </View>
            </View>
          )}
          
          {vendor.tags && vendor.tags.length > 0 && (
            <View style={styles.detailItem}>
              <Tag size={20} color={Colors.primary} style={styles.detailIcon} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {vendor.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
          
          {vendor.createdAt && (
            <View style={styles.detailItem}>
              <Calendar size={20} color={Colors.primary} style={styles.detailIcon} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Vendor Since</Text>
                <Text style={styles.detailValue}>{formatDate(vendor.createdAt)}</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Notes Card */}
        {vendor.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{vendor.notes}</Text>
          </View>
        )}
        
        {/* Purchase History Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Purchase History</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreatePurchase}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.createButtonText}>New Purchase</Text>
            </TouchableOpacity>
          </View>
          
          {purchaseHistory.length > 0 ? (
            <FlatList
              data={purchaseHistory}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.purchaseItem}
                  onPress={() => router.push(`/purchases/${item.id}`)}
                >
                  <View style={styles.purchaseItemContent}>
                    <View style={styles.purchaseItemLeft}>
                      <Text style={styles.purchaseInvoiceNumber}>{item.invoiceNumber}</Text>
                      <Text style={styles.purchaseDate}>{formatDate(item.date)}</Text>
                    </View>
                    <View style={styles.purchaseItemRight}>
                      <Text style={styles.purchaseAmount}>{formatCurrency(item.amount)}</Text>
                      <View style={[
                        styles.purchaseStatusBadge,
                        { backgroundColor: `${getStatusColor(item.status)}15` }
                      ]}>
                        <Text style={[
                          styles.purchaseStatusText, 
                          { color: getStatusColor(item.status) }
                        ]}>
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
              <Text style={styles.emptyStateText}>No purchase history yet</Text>
            </View>
          )}
          
          {purchaseHistory.length > 0 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => {
                // Navigate to purchases with filter for this vendor
                router.back();
                setTimeout(() => {
                  router.push("/vendors");
                }, 100);
              }}
            >
              <Text style={styles.viewAllText}>View All Purchases</Text>
              <ChevronRight size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEditVendor}
          >
            <Edit size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteVendor}
          >
            <Trash2 size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
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
    backgroundColor: Colors.background.secondary,
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  mainContent: {
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
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  vendorMainInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  vendorSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.default,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.border.light,
    marginHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  contactIcon: {
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  detailItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  detailIcon: {
    marginRight: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  notes: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  purchaseItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  purchaseItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  purchaseItemLeft: {
    flex: 1,
  },
  purchaseInvoiceNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  purchaseDate: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  purchaseItemRight: {
    alignItems: 'flex-end',
  },
  purchaseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  purchaseStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  purchaseStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.negative,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background.default,
  },
  errorText: {
    fontSize: 18,
    color: Colors.negative,
    marginVertical: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});