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
import { Stack, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  X
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { 
  AccountGroup, 
  getAccountGroups, 
  addAccountGroup, 
  updateAccountGroup, 
  deleteAccountGroup 
} from '@/utils/accountGroupStorageUtils';

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

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const groupsData = await getAccountGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading account groups:', error);
      Alert.alert('Error', 'Failed to load account groups');
    } finally {
      setIsLoading(false);
    }
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
          onPress: async () => {
            setIsLoading(true);
            try {
              const success = await deleteAccountGroup(id);
              if (success) {
                setGroups(groups.filter(group => group.id !== id));
                Alert.alert('Success', 'Group deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete group');
              }
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', 'An error occurred while deleting the group');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isEditing && currentGroup) {
        // Update existing group
        const updatedGroup = await updateAccountGroup(currentGroup.id, {
          name,
          description
        });
        
        if (updatedGroup) {
          setGroups(groups.map(group => 
            group.id === currentGroup.id ? updatedGroup : group
          ));
          Alert.alert('Success', 'Group updated successfully');
        } else {
          Alert.alert('Error', 'Failed to update group');
        }
      } else {
        // Add new group
        const newGroup = await addAccountGroup({
          name,
          description
        });
        
        setGroups([...groups, newGroup]);
        Alert.alert('Success', 'Group added successfully');
      }
      
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving group:', error);
      Alert.alert('Error', 'An error occurred while saving the group');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGroupItem = ({ item }: { item: AccountGroup }) => (
    <View style={styles.groupItem}>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupDescription}>{item.description}</Text>
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
      <Stack.Screen 
        options={{
          title: "Account Group Settings",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
        }} 
      />
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerDescription}>
            Manage account groups for better organization of your financial accounts.
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddGroup}
            disabled={isLoading}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add New Group</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading account groups...</Text>
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
      </View>
      
      {/* Add/Edit Group Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Account Group' : 'Add Account Group'}
              </Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
                disabled={isLoading}
              >
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Group Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter group name"
                editable={!isLoading}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter group description"
                multiline
                numberOfLines={3}
                editable={!isLoading}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.saveButton, isLoading && styles.disabledButton]}
              onPress={handleSaveGroup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
  },
  groupActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  disabledButton: {
    opacity: 0.7,
  }
}); 