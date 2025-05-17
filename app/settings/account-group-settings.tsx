import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
  SectionList,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Circle,
  ListPlus,
  ChevronDown,
  ChevronRight,
  Wallet,
  Users,
  Package,
  RefreshCw,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { 
  AccountGroup,
  createAccountGroup,
  getAllAccountGroups,
  updateAccountGroup,
  deleteAccountGroup
} from '@/db/account-group';

// Predefined accounts for each type
const predefinedAccounts = {
  asset: [
    { name: 'Bank/Cash', description: 'Cash and bank accounts', icon: Wallet },
    { name: 'Accounts Receivable', description: 'Money owed by customers', icon: Users },
    { name: 'Inventory', description: 'Stock and merchandise', icon: Package },
    { name: 'Purchase Returns', description: 'Returns to suppliers', icon: RefreshCw }
  ],
  liability: [
    { name: 'Accounts Payable', description: 'Money owed to suppliers', icon: CreditCard }
  ],
  revenue: [
    { name: 'Sales Revenue', description: 'Income from sales', icon: TrendingUp },
    { name: 'Sales Returns', description: 'Returns from customers', icon: TrendingDown },
    { name: 'Income', description: 'Other income sources', icon: DollarSign }
  ],
  expense: [
    { name: 'Expenses', description: 'Business operating expenses', icon: TrendingDown }
  ]
};

// Account group types with descriptions
const accountTypes = [
  { 
    value: 'asset', 
    label: 'Asset',
    description: 'Resources owned by the business',
    color: '#4caf50',
    icon: Wallet
  },
  { 
    value: 'liability', 
    label: 'Liability',
    description: 'Debts and obligations',
    color: '#f44336',
    icon: CreditCard
  },
  { 
    value: 'revenue', 
    label: 'Revenue',
    description: 'Income from business operations',
    color: '#9c27b0',
    icon: TrendingUp
  },
  { 
    value: 'expense', 
    label: 'Expense',
    description: 'Costs incurred in business operations',
    color: '#ff9800',
    icon: TrendingDown
  }
];

export default function AccountGroupSettingsScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<AccountGroup | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState(accountTypes[0].value);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const groupsData = await getAllAccountGroups(user.id);
      setGroups(groupsData);
      // Expand all sections by default
      setExpandedSections(accountTypes.map(type => type.value));
    } catch (error) {
      console.error('Error loading account groups:', error);
      Alert.alert('Error', 'Failed to load account groups');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (type: string) => {
    setExpandedSections(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getGroupsByType = () => {
    return accountTypes.map(type => ({
      title: type.label,
      type: type.value,
      data: groups.filter(group => group.type === type.value)
    }));
  };

  const handleAddGroup = () => {
    setIsEditing(false);
    setCurrentGroup(null);
    setName('');
    setDescription('');
    setSelectedType(accountTypes[0].value);
    setModalVisible(true);
  };

  const handleEditGroup = (group: AccountGroup) => {
    setIsEditing(true);
    setCurrentGroup(group);
    setName(group.name);
    setDescription(group.description || '');
    setSelectedType(group.type);
    setModalVisible(true);
  };

  const handleDeleteGroup = (id: number) => {
    Alert.alert(
      'Delete Account Group',
      'Are you sure you want to delete this account group?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            
            setIsLoading(true);
            try {
              await deleteAccountGroup(id, user.id);
              setGroups(groups.filter(group => group.id !== id));
              Alert.alert('Success', 'Account group deleted successfully');
            } catch (error) {
              console.error('Error deleting account group:', error);
              Alert.alert('Error', 'An error occurred while deleting the account group');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveGroup = async () => {
    if (!user) return;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Account group name is required');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isEditing && currentGroup) {
        // Update existing group
        const updatedGroup = await updateAccountGroup(currentGroup.id, user.id, {
          name,
          description,
          type: selectedType as AccountGroup['type']
        });
        
        if (updatedGroup) {
          setGroups(groups.map(group => 
            group.id === currentGroup.id ? updatedGroup : group
          ));
          Alert.alert('Success', 'Account group updated successfully');
        } else {
          Alert.alert('Error', 'Failed to update account group');
        }
      } else {
        // Add new group
        const newGroup = await createAccountGroup({
          userId: user.id,
          name,
          description,
          type: selectedType as AccountGroup['type']
        });
        
        setGroups([...groups, newGroup]);
        Alert.alert('Success', 'Account group added successfully');
      }
      
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving account group:', error);
      Alert.alert('Error', 'An error occurred while saving the account group');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGroupItem = ({ item }: { item: AccountGroup }) => {
    const Icon = accountTypes.find(t => t.value === item.type)?.icon || Circle;
    
    return (
      <View style={styles.groupItem}>
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${getTypeColor(item.type)}20` }]}>
              <Icon size={20} color={getTypeColor(item.type)} />
            </View>
            <View style={styles.groupTextContainer}>
              <Text style={styles.groupName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.groupDescription}>{item.description}</Text>
              ) : null}
            </View>
          </View>
        </View>
        <View style={styles.groupActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditGroup(item)}
          >
            <Edit2 size={18} color={Colors.primary} />
          </TouchableOpacity>
          {!item.isDefault && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteGroup(item.id)}
            >
              <Trash2 size={18} color="#e74c3c" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string; type: string } }) => {
    const typeInfo = accountTypes.find(t => t.value === section.type);
    const isExpanded = expandedSections.includes(section.type);
    const Icon = typeInfo?.icon || Circle;
    
    return (
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection(section.type)}
      >
        <View style={styles.sectionHeaderContent}>
          <View style={[styles.sectionIconContainer, { backgroundColor: `${typeInfo?.color}20` }]}>
            <Icon size={24} color={typeInfo?.color} />
          </View>
          <View style={styles.sectionTextContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionDescription}>{typeInfo?.description}</Text>
          </View>
        </View>
        {isExpanded ? (
          <ChevronDown size={24} color={Colors.text.secondary} />
        ) : (
          <ChevronRight size={24} color={Colors.text.secondary} />
        )}
      </TouchableOpacity>
    );
  };

  const getTypeColor = (type: AccountGroup['type']) => {
    return accountTypes.find(t => t.value === type)?.color || '#757575';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Groups</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddGroup}
          activeOpacity={0.7}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading && groups.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading account groups...</Text>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ListPlus size={60} color={`${Colors.primary}80`} />
          <Text style={styles.emptyTitle}>No Account Groups</Text>
          <Text style={styles.emptyText}>
            Add account groups to organize your financial records.
          </Text>
          <TouchableOpacity 
            style={styles.emptyAddButton}
            onPress={handleAddGroup}
          >
            <Text style={styles.emptyAddButtonText}>Add Account Group</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={getGroupsByType()}
          renderItem={renderGroupItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={true}
        />
      )}

      {/* Account Group Form Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Account Group' : 'Add Account Group'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Group Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter group name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter description"
                  placeholderTextColor="#999"
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeOptions}>
                  {accountTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.typeOption,
                          selectedType === type.value && styles.selectedTypeOption,
                          { borderColor: type.color }
                        ]}
                        onPress={() => setSelectedType(type.value)}
                      >
                        <Icon size={20} color={selectedType === type.value ? '#fff' : type.color} />
                        <Text style={[
                          styles.typeOptionText,
                          selectedType === type.value && styles.selectedTypeOptionText
                        ]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveGroup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isEditing ? 'Update Account Group' : 'Add Account Group'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.background.tertiary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    backgroundColor: Colors.background.default,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  sectionHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    marginLeft: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupTextContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  groupDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  groupActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: 12,
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 48,
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    margin: 4,
    minWidth: (width - 64) / 2,
  },
  selectedTypeOption: {
    backgroundColor: Colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginLeft: 8,
  },
  selectedTypeOptionText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 