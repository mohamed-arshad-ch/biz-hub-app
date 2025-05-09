import React, { useState, useCallback, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  ArrowUpDown,
  Filter,
  Download,
  Upload,
  MoreVertical,
  CheckCircle2,
  X
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { formatCurrency, formatDate } from "@/utils/formatters";
import EmptyState from "@/components/EmptyState";
import FloatingActionButton from "@/components/FloatingActionButton";
import VendorItem from "@/components/VendorItem";
import SnackBar from "@/components/SnackBar";
import { Vendor } from "@/types/vendor";
import { getVendors, deleteVendor, searchVendors } from "@/utils/vendorUtils";

export default function VendorsScreen() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<"name" | "balance" | "recent">("name");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive" | "blocked">("all");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [batchSelectionMode, setBatchSelectionMode] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);

  // Load vendors on initial render
  useEffect(() => {
    loadVendors();
  }, []);

  // Load vendors from AsyncStorage
  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const data = await getVendors();
      setVendors(data);
      filterAndSortVendors(data, searchQuery, activeFilter, sortOrder);
    } catch (error) {
      console.error("Error loading vendors:", error);
      Alert.alert("Error", "Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filtering and sorting to vendors
  const filterAndSortVendors = (
    data: Vendor[],
    query: string,
    filter: "all" | "active" | "inactive" | "blocked",
    order: "name" | "balance" | "recent"
  ) => {
    // First filter the vendors
    let result = [...data];
    
    if (query) {
      const searchLower = query.toLowerCase();
      result = result.filter(vendor => 
        vendor.name.toLowerCase().includes(searchLower) ||
        (vendor.email && vendor.email.toLowerCase().includes(searchLower)) ||
        (vendor.phone && vendor.phone.toLowerCase().includes(searchLower)) ||
        (vendor.company && vendor.company.toLowerCase().includes(searchLower))
      );
    }
    
    if (filter !== "all") {
      result = result.filter(vendor => vendor.status === filter);
    }
    
    // Then sort the vendors
    result.sort((a, b) => {
      switch (order) {
        case "name":
          return a.name.localeCompare(b.name);
        case "balance":
          return b.outstandingBalance - a.outstandingBalance;
        case "recent":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredVendors(result);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVendors();
    setRefreshing(false);
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterAndSortVendors(vendors, text, activeFilter, sortOrder);
  };

  const handleSort = (order: "name" | "balance" | "recent") => {
    setSortOrder(order);
    filterAndSortVendors(vendors, searchQuery, activeFilter, order);
    setShowSortOptions(false);
  };

  const handleFilter = (filter: "all" | "active" | "inactive" | "blocked") => {
    setActiveFilter(filter);
    filterAndSortVendors(vendors, searchQuery, filter, sortOrder);
    setShowFilterOptions(false);
  };

  const handleAddVendor = () => {
    router.push("/vendors/new");
  };

  const handleEditVendor = (id: string) => {
    router.push(`/vendors/edit/${id}`);
  };

  const handleDeleteVendor = async (id: string) => {
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
            setIsLoading(true);
            try {
              await deleteVendor(id);
              // Update the local state to reflect the deletion
              const updatedVendors = vendors.filter(vendor => vendor.id !== id);
              setVendors(updatedVendors);
              filterAndSortVendors(updatedVendors, searchQuery, activeFilter, sortOrder);
              setSnackbarMessage("Vendor deleted successfully");
              setShowSnackbar(true);
            } catch (error) {
              console.error("Error deleting vendor:", error);
              Alert.alert("Error", "Failed to delete vendor");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleViewVendor = (id: string) => {
    router.push(`/vendors/${id}`);
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  const handleExport = () => {
    if (batchSelectionMode && selectedVendors.length > 0) {
      Alert.alert(
        "Export Selected Vendors",
        `Export ${selectedVendors.length} selected vendors?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Export",
            onPress: () => {
              setSnackbarMessage(`${selectedVendors.length} vendors exported successfully`);
              setShowSnackbar(true);
              setBatchSelectionMode(false);
              setSelectedVendors([]);
            }
          }
        ]
      );
    } else {
      Alert.alert(
        "Export Vendors",
        "Export all vendors?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Export",
            onPress: () => {
              setSnackbarMessage("All vendors exported successfully");
              setShowSnackbar(true);
            }
          }
        ]
      );
    }
  };

  const toggleBatchSelectionMode = () => {
    setBatchSelectionMode(!batchSelectionMode);
    if (batchSelectionMode) {
      setSelectedVendors([]);
    }
  };

  const toggleVendorSelection = (id: string) => {
    if (selectedVendors.includes(id)) {
      setSelectedVendors(selectedVendors.filter(vendorId => vendorId !== id));
    } else {
      setSelectedVendors([...selectedVendors, id]);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedVendors.length === 0) return;
    
    Alert.alert(
      "Delete Selected Vendors",
      `Are you sure you want to delete ${selectedVendors.length} vendors? This action cannot be undone.`,
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
              // Delete each selected vendor one by one
              for (const id of selectedVendors) {
                await deleteVendor(id);
              }
              
              // Update local state
              const updatedVendors = vendors.filter(vendor => !selectedVendors.includes(vendor.id));
              setVendors(updatedVendors);
              filterAndSortVendors(updatedVendors, searchQuery, activeFilter, sortOrder);
              
              // Clear selection
              setBatchSelectionMode(false);
              setSelectedVendors([]);
              
              // Show success message
              setSnackbarMessage(`${selectedVendors.length} vendors deleted successfully`);
              setShowSnackbar(true);
            } catch (error) {
              console.error("Error in batch delete:", error);
              Alert.alert("Error", "Failed to delete some vendors");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Calculate statistics
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.status === "active").length;
  const totalOutstanding = vendors.reduce((sum, v) => sum + v.outstandingBalance, 0);
  
  // Determine if we should show the batch actions
  const showBatchActions = batchSelectionMode && selectedVendors.length > 0;

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Vendors",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              {showBatchActions ? (
                <>
                  <TouchableOpacity 
                    onPress={toggleBatchSelectionMode}
                    style={styles.headerButton}
                  >
                    <X size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleBatchDelete}
                    style={[styles.headerButton, selectedVendors.length === 0 && styles.disabledButton]}
                    disabled={selectedVendors.length === 0}
                  >
                    <Text style={[styles.batchActionText, selectedVendors.length === 0 && styles.disabledText]}>
                      Delete ({selectedVendors.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleExport}
                    style={[styles.headerButton, selectedVendors.length === 0 && styles.disabledButton]}
                    disabled={selectedVendors.length === 0}
                  >
                    <Text style={[styles.batchActionText, selectedVendors.length === 0 && styles.disabledText]}>
                      Export ({selectedVendors.length})
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    onPress={toggleBatchSelectionMode}
                    style={styles.headerButton}
                  >
                    <CheckCircle2 size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowFilterOptions(!showFilterOptions)}
                    style={styles.headerButton}
                  >
                    <Filter size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowSortOptions(!showSortOptions)}
                    style={styles.headerButton}
                  >
                    <ArrowUpDown size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleImport}
                    style={styles.headerButton}
                  >
                    <Upload size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleExport}
                    style={styles.headerButton}
                  >
                    <Download size={20} color="#333" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
        }} 
      />
      
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendors..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {showFilterOptions && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.optionButton, activeFilter === "all" && styles.activeOptionButton]}
              onPress={() => handleFilter("all")}
            >
              <Text style={[styles.optionText, activeFilter === "all" && styles.activeOptionText]}>
                All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, activeFilter === "active" && styles.activeOptionButton]}
              onPress={() => handleFilter("active")}
            >
              <Text style={[styles.optionText, activeFilter === "active" && styles.activeOptionText]}>
                Active
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, activeFilter === "inactive" && styles.activeOptionButton]}
              onPress={() => handleFilter("inactive")}
            >
              <Text style={[styles.optionText, activeFilter === "inactive" && styles.activeOptionText]}>
                Inactive
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, activeFilter === "blocked" && styles.activeOptionButton]}
              onPress={() => handleFilter("blocked")}
            >
              <Text style={[styles.optionText, activeFilter === "blocked" && styles.activeOptionText]}>
                Blocked
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {showSortOptions && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.optionButton, sortOrder === "name" && styles.activeOptionButton]}
              onPress={() => handleSort("name")}
            >
              <Text style={[styles.optionText, sortOrder === "name" && styles.activeOptionText]}>
                Name
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, sortOrder === "balance" && styles.activeOptionButton]}
              onPress={() => handleSort("balance")}
            >
              <Text style={[styles.optionText, sortOrder === "balance" && styles.activeOptionText]}>
                Balance
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, sortOrder === "recent" && styles.activeOptionButton]}
              onPress={() => handleSort("recent")}
            >
              <Text style={[styles.optionText, sortOrder === "recent" && styles.activeOptionText]}>
                Recent
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalVendors}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeVendors}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatCurrency(totalOutstanding)}
            </Text>
            <Text style={styles.statLabel}>Payable</Text>
          </View>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredVendors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VendorItem
                vendor={item}
                onPress={batchSelectionMode ? () => toggleVendorSelection(item.id) : () => handleViewVendor(item.id)}
                onEdit={() => handleEditVendor(item.id)}
                onDelete={() => handleDeleteVendor(item.id)}
                isSelected={selectedVendors.includes(item.id)}
                selectionMode={batchSelectionMode}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                title="No vendors found"
                description="Add your first vendor by clicking the + button below"
                icon="building"
              />
            }
          />
        )}
        
        <FloatingActionButton
          icon={<Plus size={24} color="#fff" />}
          onPress={handleAddVendor}
        />

        <SnackBar
          visible={showSnackbar}
          message={snackbarMessage}
          onDismiss={() => setShowSnackbar(false)}
          action={{
            label: "DISMISS",
            onPress: () => setShowSnackbar(false),
          }}
        />

        <Modal
          visible={showImportModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Import Vendors</Text>
                <TouchableOpacity onPress={() => setShowImportModal(false)}>
                  <X size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                <Text style={styles.modalSectionTitle}>Import Options</Text>
                
                <TouchableOpacity 
                  style={styles.importOption}
                  onPress={() => {
                    setShowImportModal(false);
                    setSnackbarMessage("CSV file import started");
                    setShowSnackbar(true);
                  }}
                >
                  <View style={styles.importOptionIcon}>
                    <Upload size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.importOptionContent}>
                    <Text style={styles.importOptionTitle}>Import from CSV</Text>
                    <Text style={styles.importOptionDescription}>
                      Upload a CSV file with vendor data
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.importOption}
                  onPress={() => {
                    setShowImportModal(false);
                    setSnackbarMessage("Excel file import started");
                    setShowSnackbar(true);
                  }}
                >
                  <View style={styles.importOptionIcon}>
                    <Upload size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.importOptionContent}>
                    <Text style={styles.importOptionTitle}>Import from Excel</Text>
                    <Text style={styles.importOptionDescription}>
                      Upload an Excel file with vendor data
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <Text style={styles.modalSectionTitle}>Template</Text>
                <Text style={styles.modalDescription}>
                  Download a template file to see the required format for importing vendors.
                </Text>
                
                <TouchableOpacity 
                  style={styles.templateButton}
                  onPress={() => {
                    setSnackbarMessage("Template downloaded");
                    setShowSnackbar(true);
                  }}
                >
                  <Download size={16} color="#fff" style={styles.templateButtonIcon} />
                  <Text style={styles.templateButtonText}>Download Template</Text>
                </TouchableOpacity>
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowImportModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
  headerRightContainer: {
    flexDirection: "row",
  },
  batchActionText: {
    color: Colors.primary,
    fontWeight: "500",
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#999",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#666",
  },
  optionsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    borderRadius: 4,
  },
  activeOptionButton: {
    backgroundColor: "#1a73e810",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  activeOptionText: {
    color: Colors.primary,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalContent: {
    padding: 16,
    maxHeight: 400,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginTop: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  importOption: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  importOptionIcon: {
    marginRight: 16,
    justifyContent: "center",
  },
  importOptionContent: {
    flex: 1,
  },
  importOptionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  importOptionDescription: {
    fontSize: 14,
    color: "#666",
  },
  templateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  templateButtonIcon: {
    marginRight: 8,
  },
  templateButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  modalCancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
});