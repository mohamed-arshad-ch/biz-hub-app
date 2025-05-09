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
  Linking
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
  DollarSign,
  Building,
  Briefcase
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { formatCurrency, formatDate, formatPhoneNumber } from "@/utils/formatters";
import SnackBar from "@/components/SnackBar";
import EmptyState from '@/components/EmptyState';
import { Vendor } from '@/types/vendor';
import { getVendorById, deleteVendor } from "@/utils/asyncStorageUtils";

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
      setError('Vendor ID is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getVendorById(id);
      
      if (!data) {
        setError('Vendor not found');
      } else {
        setVendor(data);
        setError(null);
      }
    } catch (error) {
      console.error('Error loading vendor:', error);
      setError('Failed to load vendor data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditVendor = () => {
    if (id) {
      router.push(`/vendors/edit/${id}`);
    }
  };
  
  const handleDeleteVendor = () => {
    Alert.alert(
      "Delete Vendor",
      "Are you sure you want to delete this vendor? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (id) {
              try {
                await deleteVendor(id);
                router.replace("/vendors");
              } catch (error) {
                console.error('Error deleting vendor:', error);
                showSnackbar("Failed to delete vendor");
              }
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
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  
  if (error || !vendor) {
    return (
      <View style={styles.errorContainer}>
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
    <>
      <Stack.Screen 
        options={{
          title: vendor.name,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={handleEditVendor}
                style={styles.headerButton}
              >
                <Edit size={20} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleDeleteVendor}
                style={styles.headerButton}
              >
                <Trash size={20} color="#333" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <ScrollView style={styles.container}>
        {/* Vendor Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>{vendor.name.charAt(0)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.vendorName}>{vendor.name}</Text>
              <Text style={styles.vendorCompany}>{vendor.company}</Text>
              <View style={styles.vendorMeta}>
                <Text style={styles.vendorSince}>Vendor since: {formatDate(vendor.createdAt)}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: vendor.status === "active" ? "#34a85320" : 
                                    vendor.status === "inactive" ? "#fbbc0420" : "#ea433520" }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: vendor.status === "active" ? "#34a853" : 
                             vendor.status === "inactive" ? "#fbbc04" : "#ea4335" }
                  ]}>
                    {vendor.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleCallVendor}
              disabled={!vendor.phone}
            >
              <Phone size={20} color={vendor.phone ? Colors.primary : "#ccc"} />
              <Text style={[styles.contactButtonText, !vendor.phone && styles.disabledText]}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleEmailVendor}
              disabled={!vendor.email}
            >
              <Mail size={20} color={vendor.email ? Colors.primary : "#ccc"} />
              <Text style={[styles.contactButtonText, !vendor.email && styles.disabledText]}>Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleVisitWebsite}
              disabled={!vendor.website}
            >
              <Globe size={20} color={vendor.website ? Colors.primary : "#ccc"} />
              <Text style={[styles.contactButtonText, !vendor.website && styles.disabledText]}>Website</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleCreatePurchase}
            >
              <ShoppingCart size={20} color={Colors.primary} />
              <Text style={styles.contactButtonText}>Order</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Financial Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          
          <View style={styles.financialSummary}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Current Balance</Text>
              <Text style={styles.financialValue}>{formatCurrency(vendor.outstandingBalance)}</Text>
            </View>
            
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Payment Terms</Text>
              <Text style={styles.financialValue}>{vendor.paymentTerms || "Not specified"}</Text>
            </View>
            
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Total Purchases</Text>
              <Text style={styles.financialValue}>{formatCurrency(vendor.totalPurchases)}</Text>
            </View>
            
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Last Purchase</Text>
              <Text style={styles.financialValue}>
                {vendor.lastPurchaseDate ? formatDate(vendor.lastPurchaseDate) : "No purchases yet"}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Contact Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.contactInfo}>
            {vendor.contactPerson && (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Contact Person</Text>
                <Text style={styles.contactValue}>{vendor.contactPerson}</Text>
              </View>
            )}
            
            {vendor.phone && (
              <View style={styles.contactItem}>
                <View style={styles.contactItemHeader}>
                  <Phone size={16} color="#666" style={styles.contactIcon} />
                  <Text style={styles.contactLabel}>Phone</Text>
                </View>
                <Text style={styles.contactValue}>{formatPhoneNumber(vendor.phone)}</Text>
              </View>
            )}
            
            {vendor.email && (
              <View style={styles.contactItem}>
                <View style={styles.contactItemHeader}>
                  <Mail size={16} color="#666" style={styles.contactIcon} />
                  <Text style={styles.contactLabel}>Email</Text>
                </View>
                <Text style={styles.contactValue}>{vendor.email}</Text>
              </View>
            )}
            
            {vendor.website && (
              <View style={styles.contactItem}>
                <View style={styles.contactItemHeader}>
                  <Globe size={16} color="#666" style={styles.contactIcon} />
                  <Text style={styles.contactLabel}>Website</Text>
                </View>
                <Text style={styles.contactValue}>{vendor.website}</Text>
              </View>
            )}
            
            {vendor.address && (
              <View style={styles.contactItem}>
                <View style={styles.contactItemHeader}>
                  <MapPin size={16} color="#666" style={styles.contactIcon} />
                  <Text style={styles.contactLabel}>Address</Text>
                </View>
                <Text style={styles.contactValue}>
                  {vendor.address}
                  {vendor.city && `, ${vendor.city}`}
                  {vendor.state && `, ${vendor.state}`}
                  {vendor.zipCode && ` ${vendor.zipCode}`}
                  {vendor.country && `, ${vendor.country}`}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Purchase History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Purchase History</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push(`/purchases?vendorId=${id}`)}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
              <ChevronRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          
          {purchaseHistory.length > 0 ? (
            <View style={styles.purchaseHistoryList}>
              {purchaseHistory.map((purchase) => (
                <TouchableOpacity
                  key={purchase.id}
                  style={styles.purchaseItem}
                  onPress={() => router.push(`/purchases/${purchase.id}`)}
                >
                  <View style={styles.purchaseItemLeft}>
                    <Text style={styles.purchaseDate}>{formatDate(purchase.date)}</Text>
                    <Text style={styles.purchasePoNumber}>{purchase.invoiceNumber}</Text>
                  </View>
                  
                  <View style={styles.purchaseItemRight}>
                    <Text style={styles.purchaseAmount}>{formatCurrency(purchase.amount)}</Text>
                    <View style={[
                      styles.purchaseStatusBadge,
                      { backgroundColor: `${getStatusColor(purchase.status)}20` }
                    ]}>
                      <Text style={[
                        styles.purchaseStatusText,
                        { color: getStatusColor(purchase.status) }
                      ]}>
                        {purchase.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={styles.newPurchaseButton}
                onPress={handleCreatePurchase}
              >
                <Plus size={16} color={Colors.primary} />
                <Text style={styles.newPurchaseButtonText}>New Purchase Order</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyPurchaseHistory}>
              <Text style={styles.emptyPurchaseText}>No purchase history found</Text>
              <TouchableOpacity
                style={styles.newPurchaseButton}
                onPress={handleCreatePurchase}
              >
                <Plus size={16} color={Colors.primary} />
                <Text style={styles.newPurchaseButtonText}>New Purchase Order</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Additional Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <View style={styles.additionalInfo}>
            {vendor.category && (
              <View style={styles.additionalItem}>
                <View style={styles.additionalItemHeader}>
                  <Tag size={16} color="#666" style={styles.additionalIcon} />
                  <Text style={styles.additionalLabel}>Category</Text>
                </View>
                <Text style={styles.additionalValue}>{vendor.category}</Text>
              </View>
            )}
            
            {vendor.taxId && (
              <View style={styles.additionalItem}>
                <View style={styles.additionalItemHeader}>
                  <FileText size={16} color="#666" style={styles.additionalIcon} />
                  <Text style={styles.additionalLabel}>Tax/VAT ID</Text>
                </View>
                <Text style={styles.additionalValue}>{vendor.taxId}</Text>
              </View>
            )}
            
            {vendor.bankDetails && (
              <View style={styles.additionalItem}>
                <View style={styles.additionalItemHeader}>
                  <FileText size={16} color="#666" style={styles.additionalIcon} />
                  <Text style={styles.additionalLabel}>Bank Details</Text>
                </View>
                <Text style={styles.additionalValue}>{vendor.bankDetails}</Text>
              </View>
            )}
            
            {vendor.tags && vendor.tags.length > 0 && (
              <View style={styles.additionalItem}>
                <View style={styles.additionalItemHeader}>
                  <Tag size={16} color="#666" style={styles.additionalIcon} />
                  <Text style={styles.additionalLabel}>Tags</Text>
                </View>
                <View style={styles.tagsContainer}>
                  {vendor.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {vendor.notes && (
              <View style={styles.additionalItem}>
                <View style={styles.additionalItemHeader}>
                  <FileText size={16} color="#666" style={styles.additionalIcon} />
                  <Text style={styles.additionalLabel}>Notes</Text>
                </View>
                <Text style={styles.additionalValue}>{vendor.notes}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Vendor Statistics Section */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Vendor Statistics</Text>
          
          <View style={styles.statisticsContainer}>
            <View style={styles.statisticItem}>
              <Text style={styles.statisticValue}>{formatCurrency(vendor.totalPurchases)}</Text>
              <Text style={styles.statisticLabel}>Total Purchases</Text>
            </View>
            
            <View style={styles.statisticItem}>
              <Text style={styles.statisticValue}>
                {vendor.lastPurchaseDate ? formatDate(vendor.lastPurchaseDate) : "N/A"}
              </Text>
              <Text style={styles.statisticLabel}>Last Purchase</Text>
            </View>
            
            <View style={styles.statisticItem}>
              <Text style={styles.statisticValue}>
                {vendor.creditLimit ? formatCurrency(vendor.creditLimit) : "N/A"}
              </Text>
              <Text style={styles.statisticLabel}>Credit Limit</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <SnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: "row",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    color: "#333",
    marginBottom: 16,
  },
  errorButton: {
    padding: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  profileSection: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  vendorCompany: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  vendorMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vendorSince: {
    fontSize: 12,
    color: "#888",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  contactButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  contactButton: {
    alignItems: "center",
    padding: 8,
  },
  contactButtonText: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  disabledText: {
    color: "#ccc",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllButtonText: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 4,
  },
  financialSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  financialItem: {
    width: "48%",
    marginBottom: 16,
  },
  financialLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  contactInfo: {
    marginBottom: 8,
  },
  contactItem: {
    marginBottom: 16,
  },
  contactItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactIcon: {
    marginRight: 8,
  },
  contactLabel: {
    fontSize: 14,
    color: "#666",
  },
  contactValue: {
    fontSize: 16,
    color: "#333",
  },
  purchaseHistoryList: {
    marginBottom: 8,
  },
  purchaseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  purchaseItemLeft: {
    flex: 1,
  },
  purchaseItemRight: {
    alignItems: "flex-end",
  },
  purchaseDate: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  purchasePoNumber: {
    fontSize: 12,
    color: "#666",
  },
  purchaseAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  purchaseStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  purchaseStatusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  emptyPurchaseHistory: {
    alignItems: "center",
    padding: 16,
  },
  emptyPurchaseText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  newPurchaseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  newPurchaseButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
    marginLeft: 8,
  },
  additionalInfo: {
    marginBottom: 8,
  },
  additionalItem: {
    marginBottom: 16,
  },
  additionalItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  additionalIcon: {
    marginRight: 8,
  },
  additionalLabel: {
    fontSize: 14,
    color: "#666",
  },
  additionalValue: {
    fontSize: 16,
    color: "#333",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#666",
  },
  statisticsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statisticItem: {
    alignItems: "center",
    flex: 1,
  },
  statisticValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  statisticLabel: {
    fontSize: 12,
    color: "#666",
  },
});