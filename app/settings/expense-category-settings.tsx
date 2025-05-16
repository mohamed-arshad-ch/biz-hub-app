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
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Circle,
  ArrowDownCircle
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { ExpenseCategory } from '@/types/category';
import { 
  getExpenseCategories, 
  addExpenseCategory, 
  updateExpenseCategory, 
  deleteExpenseCategory 
} from '@/mocks/categoryData';

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

  const handleAddCategory = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const newCategory = {
        id: Date.now().toString(), // Generate a unique ID
        name,
        description,
        color: selectedColor
      };
      
      const updatedCategories = await addExpenseCategory(newCategory);
      setCategories(updatedCategories);
      setName('');
      setDescription('');
      setSelectedColor(colorOptions[0]);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add category');
    } finally {
      setIsLoading(false);
    }
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
        {item.description ? (
          <Text style={styles.categoryDescription}>{item.description}</Text>
        ) : null}
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Categories</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading && categories.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ArrowDownCircle size={60} color={`${Colors.primary}80`} />
          <Text style={styles.emptyTitle}>No Categories</Text>
          <Text style={styles.emptyText}>
            Add expense categories to organize your financial records.
          </Text>
          <TouchableOpacity 
            style={styles.emptyAddButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.emptyAddButtonText}>Add Category</Text>
          </TouchableOpacity>
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

      {/* Category Form Modal */}
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
                {isEditing ? 'Edit Category' : 'Add Category'}
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
                <Text style={styles.label}>Category Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter category name"
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
                <Text style={styles.label}>Color</Text>
                <View style={styles.colorOptions}>
                  {colorOptions.map(renderColorOption)}
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveCategory}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isEditing ? 'Update Category' : 'Add Category'}
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
  categoryItem: {
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
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
    marginLeft: 24,
  },
  categoryActions: {
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
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    margin: 8,
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: Colors.text.primary,
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