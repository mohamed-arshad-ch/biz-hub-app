import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  FlatList,
  Modal,
  ColorValue,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Circle
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { ExpenseCategory } from '@/types/category';
import { 
  getExpenseCategories, 
  addExpenseCategory, 
  updateExpenseCategory, 
  deleteExpenseCategory 
} from '@/utils/categoryStorageUtils';

// Color options for categories
const colorOptions = [
  '#e74c3c', '#3498db', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22',
  '#16a085', '#2980b9', '#8e44ad', '#d35400', '#2c3e50', '#7f8c8d',
];

export default function ExpenseCategorySettingsScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<ExpenseCategory | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const categoriesData = await getExpenseCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading expense categories:', error);
      Alert.alert('Error', 'Failed to load expense categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = () => {
    setIsEditing(false);
    setCurrentCategory(null);
    setName('');
    setDescription('');
    setSelectedColor(colorOptions[0]);
    setModalVisible(true);
  };

  const handleEditCategory = (category: ExpenseCategory) => {
    setIsEditing(true);
    setCurrentCategory(category);
    setName(category.name);
    setDescription(category.description);
    setSelectedColor(category.color);
    setModalVisible(true);
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this expense category?',
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
              const success = await deleteExpenseCategory(id);
              if (success) {
                setCategories(categories.filter(category => category.id !== id));
                Alert.alert('Success', 'Category deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete category');
              }
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'An error occurred while deleting the category');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveCategory = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isEditing && currentCategory) {
        // Update existing category
        const updatedCategory = await updateExpenseCategory(currentCategory.id, {
          name,
          description,
          color: selectedColor
        });
        
        if (updatedCategory) {
          setCategories(categories.map(category => 
            category.id === currentCategory.id ? updatedCategory : category
          ));
          Alert.alert('Success', 'Category updated successfully');
        } else {
          Alert.alert('Error', 'Failed to update category');
        }
      } else {
        // Add new category
        const newCategory = await addExpenseCategory({
          name,
          description,
          color: selectedColor
        });
        
        setCategories([...categories, newCategory]);
        Alert.alert('Success', 'Category added successfully');
      }
      
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'An error occurred while saving the category');
    } finally {
      setIsLoading(false);
    }
  };

  const renderColorOption = (color: string) => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        { backgroundColor: color },
        selectedColor === color && styles.selectedColorOption
      ]}
      onPress={() => setSelectedColor(color)}
    />
  );

  const renderCategoryItem = ({ item }: { item: ExpenseCategory }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <View style={styles.categoryHeader}>
          <Circle size={16} fill={item.color} color={item.color} />
          <Text style={styles.categoryName}>{item.name}</Text>
        </View>
        <Text style={styles.categoryDescription}>{item.description}</Text>
      </View>
      <View style={styles.categoryActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditCategory(item)}
        >
          <Edit2 size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteCategory(item.id)}
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
          title: "Expense Categories",
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
            Manage expense categories to categorize your expense transactions.
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddCategory}
            disabled={isLoading}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add New Category</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      {/* Add/Edit Category Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Expense Category' : 'Add Expense Category'}
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
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter category name"
                editable={!isLoading}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter category description"
                multiline
                numberOfLines={3}
                editable={!isLoading}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorOptions}>
                {colorOptions.map(renderColorOption)}
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.saveButton, isLoading && styles.disabledButton]}
              onPress={handleSaveCategory}
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
  categoryItem: {
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
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 24,
  },
  categoryActions: {
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
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    margin: 4,
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#333',
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