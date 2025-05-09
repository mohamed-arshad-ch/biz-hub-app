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
  Alert
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  ArrowUpDown,
  Filter,
  Download,
  Upload
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import { Customer } from "@/types/customer";
import EmptyState from "@/components/EmptyState";
import FloatingActionButton from "@/components/FloatingActionButton";
import CustomerItem from "@/components/CustomerItem";
import { getCustomers, deleteCustomer, searchCustomers } from "@/utils/customerUtils";

export default function CustomersScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<"name" | "balance" | "recent">("name");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive" | "blocked">("all");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  // Load customers on initial render
  useEffect(() => {
    loadCustomers();
  }, []);

  // Load customers from AsyncStorage
  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
      filterAndSortCustomers(data, searchQuery, activeFilter, sortOrder);
    } catch (error) {
      console.error("Error loading customers:", error);
      Alert.alert("Error", "Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filtering and sorting to customers
  const filterAndSortCustomers = (
    data: Customer[],
    query: string,
    filter: "all" | "active" | "inactive" | "blocked",
    order: "name" | "balance" | "recent"
  ) => {
    // First filter the customers
    let result = [...data];
    
    if (query) {
      const searchLower = query.toLowerCase();
      result = result.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchLower)) ||
        (customer.company && customer.company.toLowerCase().includes(searchLower))
      );
    }
    
    if (filter !== "all") {
      result = result.filter(customer => customer.status === filter);
    }
    
    // Then sort the customers
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
    
    setFilteredCustomers(result);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterAndSortCustomers(customers, text, activeFilter, sortOrder);
  };

  const handleSort = (order: "name" | "balance" | "recent") => {
    setSortOrder(order);
    filterAndSortCustomers(customers, searchQuery, activeFilter, order);
    setShowSortOptions(false);
  };

  const handleFilter = (filter: "all" | "active" | "inactive" | "blocked") => {
    setActiveFilter(filter);
    filterAndSortCustomers(customers, searchQuery, filter, sortOrder);
    setShowFilterOptions(false);
  };

  const handleAddCustomer = () => {
    router.push("/customers/new");
  };

  const handleEditCustomer = (id: string) => {
    router.push(`/customers/edit/${id}`);
  };

  const handleDeleteCustomer = async (id: string) => {
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
            setIsLoading(true);
            try {
              await deleteCustomer(id);
              // Update the local state to reflect the deletion
              const updatedCustomers = customers.filter(customer => customer.id !== id);
              setCustomers(updatedCustomers);
              filterAndSortCustomers(updatedCustomers, searchQuery, activeFilter, sortOrder);
              Alert.alert("Success", "Customer deleted successfully");
            } catch (error) {
              console.error("Error deleting customer:", error);
              Alert.alert("Error", "Failed to delete customer");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleViewCustomer = (id: string) => {
    router.push(`/customers/${id}`);
  };

  const handleImport = () => {
    // Implement import functionality
    Alert.alert("Import", "Import functionality will be available soon.");
  };

  const handleExport = () => {
    // Implement export functionality
    Alert.alert("Export", "Export functionality will be available soon.");
  };

  // Calculate statistics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === "active").length;
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Customers",
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
            </View>
          ),
        }} 
      />
      
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => handleSearch("")}
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
            <Text style={styles.statValue}>{totalCustomers}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {activeCustomers}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatCurrency(totalOutstanding)}
            </Text>
            <Text style={styles.statLabel}>Outstanding</Text>
          </View>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CustomerItem
                customer={item}
                onPress={() => handleViewCustomer(item.id)}
                onEdit={() => handleEditCustomer(item.id)}
                onDelete={() => handleDeleteCustomer(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                title="No customers found"
                description="Add your first customer by clicking the + button below"
                icon="users"
              />
            }
          />
        )}
        
        <FloatingActionButton
          icon={<Plus size={24} color="#fff" />}
          onPress={handleAddCustomer}
        />
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
});