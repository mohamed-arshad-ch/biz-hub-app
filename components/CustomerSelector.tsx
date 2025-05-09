import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Search, Plus } from 'lucide-react-native';
import { Customer } from '@/types/customer';
import Colors from '@/constants/colors';

interface CustomerSelectorProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onAddNewCustomer?: () => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  onSelectCustomer,
  onAddNewCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
      return;
    }

    setIsLoading(true);
    
    // Simulate search delay
    const timer = setTimeout(() => {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.phone && customer.phone.includes(searchQuery))
      );
      
      setFilteredCustomers(filtered);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, customers]);

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => onSelectCustomer(item)}
    >
      <View>
        <Text style={styles.customerName}>{item.name}</Text>
        {item.company && (
          <Text style={styles.customerCompany}>{item.company}</Text>
        )}
        {item.email && (
          <Text style={styles.customerDetail}>{item.email}</Text>
        )}
      </View>
      {item.phone && (
        <Text style={styles.customerPhone}>{item.phone}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {onAddNewCustomer && (
        <TouchableOpacity
          style={styles.addNewButton}
          onPress={onAddNewCustomer}
        >
          <Plus size={16} color={Colors.primary} style={styles.addIcon} />
          <Text style={styles.addNewText}>Add New Customer</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : filteredCustomers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No customers found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addIcon: {
    marginRight: 8,
  },
  addNewText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  customerCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  customerDetail: {
    fontSize: 13,
    color: '#999',
  },
  customerPhone: {
    fontSize: 13,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
});

export default CustomerSelector;