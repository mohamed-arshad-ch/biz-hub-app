import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  FlatList,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Layers,
  FileText
} from 'lucide-react-native';

import Colors from '@/constants/colors';

// Define the AccountGroup type
interface AccountGroup {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for account groups
const mockAccountGroups: AccountGroup[] = [
  {
    id: '1',
    name: 'Assets',
    description: 'Resources owned by the business that have future economic value',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-03-10')
  },
  {
    id: '2',
    name: 'Liabilities',
    description: 'Financial obligations or debts owed to others',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-02-20')
  },
  {
    id: '3',
    name: 'Equity',
    description: 'Residual interest in the assets after deducting liabilities',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-02-15')
  },
  {
    id: '4',
    name: 'Revenue',
    description: 'Income generated from normal business operations',
    createdAt: new Date('2023-01-20'),
    updatedAt: new Date('2023-01-20')
  },
  {
    id: '5',
    name: 'Expenses',
    description: 'Costs incurred in normal business operations',
    createdAt: new Date('2023-01-20'),
    updatedAt: new Date('2023-01-20')
  }
];

export default function AccountGroupSettingsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<AccountGroup | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = () => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setGroups(mockAccountGroups);
      setIsLoading(false);
    }, 500);
  };

  const handleAddGroup = () => {
    setIsEditing(false);
    setCurrentGroup(null);
    setName('');
    setDescription('');
    setModalVisible(true);
  };

  const handleEditGroup = (group: AccountGroup) => {
    setIsEditing(true);
    setCurrentGroup(group);
    setName(group.name);
    setDescription(group.description);
    setModalVisible(true);
  };

  const handleDeleteGroup = (id: string) => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this account group?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setIsLoading(true);
            // Simulate API call delay
            setTimeout(() => {
              setGroups(groups.filter(group => group.id !== id));
              setIsLoading(false);
              Alert.alert('Success', 'Group deleted successfully');
            }, 500);
          }
        }
      ]
    );
  };

  const handleSaveGroup = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      if (isEditing && currentGroup) {
        // Update existing group
        const updatedGroup: AccountGroup = {
          ...currentGroup,
          name,
          description,
          updatedAt: new Date()
        };
        
        setGroups(groups.map(group => 
          group.id === currentGroup.id ? updatedGroup : group
        ));
        Alert.alert('Success', 'Group updated successfully');
      } else {
        // Add new group
        const newGroup: AccountGroup = {
          id: Date.now().toString(),
          name,
          description,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setGroups([...groups, newGroup]);
        Alert.alert('Success', 'Group added successfully');
      }
      
      setModalVisible(false);
      setIsLoading(false);
    }, 500);
  };

  const renderGroupItem = ({ item }: { item: AccountGroup }) => (
    <View style={styles.groupItem}>
      <View style={styles.groupInfo}>
        <View style={styles.groupIconContainer}>
          <Layers size={18} color={Colors.primary} />
        </View>
        <View style={styles.groupTextContainer}>
          <Text style={styles.groupName}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.groupDescription}>{item.description}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.groupActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditGroup(item)}
        >
          <Edit2 size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteGroup(item.id)}
        >
          <Trash2 size={18} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

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
          <FileText size={60} color={`${Colors.primary}80`} />
          <Text style={styles.emptyTitle}>No Account Groups</Text>
          <Text style={styles.emptyText}>
            Create account groups to better organize your financial accounts.
          </Text>
          <TouchableOpacity 
            style={styles.emptyAddButton}
            onPress={handleAddGroup}
          >
            <Text style={styles.emptyAddButtonText}>Add Group</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Group Form Modal */}
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
                  style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter description"
                  placeholderTextColor="#999"
                  multiline
                />
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
                    {isEditing ? 'Update Group' : 'Add Group'}
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
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}10`,
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
    marginTop: 4,
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