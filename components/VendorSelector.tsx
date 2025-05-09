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
import { Vendor } from '@/types/vendor';
import Colors from '@/constants/colors';

interface VendorSelectorProps {
  vendors: Vendor[];
  onSelectVendor: (vendor: Vendor) => void;
  onAddNewVendor?: () => void;
}

const VendorSelector: React.FC<VendorSelectorProps> = ({
  vendors,
  onSelectVendor,
  onAddNewVendor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>(vendors);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredVendors(vendors);
      return;
    }

    setIsLoading(true);
    
    // Simulate search delay
    const timer = setTimeout(() => {
      const filtered = vendors.filter(vendor => 
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vendor.email && vendor.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vendor.phone && vendor.phone.includes(searchQuery)) ||
        (vendor.company && vendor.company.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      setFilteredVendors(filtered);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, vendors]);

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity
      style={styles.vendorItem}
      onPress={() => onSelectVendor(item)}
    >
      <View>
        <Text style={styles.vendorName}>{item.name}</Text>
        {item.company && (
          <Text style={styles.vendorCompany}>{item.company}</Text>
        )}
        {item.email && (
          <Text style={styles.vendorDetail}>{item.email}</Text>
        )}
      </View>
      {item.phone && (
        <Text style={styles.vendorPhone}>{item.phone}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {onAddNewVendor && (
        <TouchableOpacity
          style={styles.addNewButton}
          onPress={onAddNewVendor}
        >
          <Plus size={16} color={Colors.primary} style={styles.addIcon} />
          <Text style={styles.addNewText}>Add New Vendor</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : filteredVendors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No vendors found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVendors}
          renderItem={renderVendorItem}
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
  vendorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  vendorCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  vendorDetail: {
    fontSize: 13,
    color: '#999',
  },
  vendorPhone: {
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

export default VendorSelector; 