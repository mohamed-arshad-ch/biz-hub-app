import React, { useState, useRef, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Camera, 
  X, 
  ChevronDown, 
  ChevronUp,
  Barcode,
  Plus,
  AlertCircle,
  Tag,
  DollarSign,
  ShoppingBag,
  Info,
  FileText,
  Save
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import Colors from "@/constants/colors";
import { Product, StockStatus } from "@/types/product";
import SnackBar from "@/components/SnackBar";

// Mock product data for demonstration
const mockProducts: { [key: string]: Product } = {
  '1': {
    id: '1',
    name: 'Laptop Computer',
    sku: 'LAP-10001',
    barcode: '8901234567890',
    description: 'High-performance laptop with SSD storage and dedicated graphics',
    category: 'Electronics',
    sellingPrice: 1299.99,
    purchasePrice: 899.99,
    stockQuantity: 24,
    reorderLevel: 5,
    unit: 'piece',
    status: 'in_stock',
    taxRate: 10,
    vendor: 'TechSuppliers Inc.',
    location: 'Warehouse A',
    dimensions: {
      weight: 2.5,
      length: 35,
      width: 25,
      height: 2
    },
    tags: ['electronics', 'computer', 'laptop'],
    images: [],
    notes: 'Popular item during back-to-school season',
    createdAt: new Date('2023-06-12'),
    updatedAt: new Date('2023-10-01')
  },
  '2': {
    id: '2',
    name: 'Office Desk Chair',
    sku: 'CHR-20050',
    barcode: '7890123456789',
    description: 'Ergonomic office chair with adjustable height and lumbar support',
    category: 'Furniture',
    sellingPrice: 249.99,
    purchasePrice: 149.99,
    stockQuantity: 15,
    reorderLevel: 3,
    unit: 'piece',
    status: 'in_stock',
    taxRate: 8,
    vendor: 'FurniturePlus',
    location: 'Warehouse B',
    dimensions: {
      weight: 15,
      length: 60,
      width: 60,
      height: 120
    },
    tags: ['furniture', 'office', 'chair'],
    images: [],
    notes: 'Available in black and gray',
    createdAt: new Date('2023-05-20'),
    updatedAt: new Date('2023-09-15')
  },
  '3': {
    id: '3',
    name: 'Smartphone',
    sku: 'PHN-30200',
    barcode: '6789012345678',
    description: '5G smartphone with high-resolution camera and fast charging',
    category: 'Electronics',
    sellingPrice: 899.99,
    purchasePrice: 599.99,
    stockQuantity: 42,
    reorderLevel: 10,
    unit: 'piece',
    status: 'in_stock',
    taxRate: 10,
    vendor: 'MobileTech Distributors',
    location: 'Warehouse A',
    dimensions: {
      weight: 0.18,
      length: 15,
      width: 7,
      height: 0.8
    },
    tags: ['electronics', 'phone', 'mobile'],
    images: [],
    notes: 'High demand item during holiday season',
    createdAt: new Date('2023-07-05'),
    updatedAt: new Date('2023-10-10')
  },
  '4': {
    id: '4',
    name: 'Wireless Headphones',
    sku: 'AUD-40075',
    barcode: '5678901234567',
    description: 'Noise-cancelling wireless headphones with long battery life',
    category: 'Audio',
    sellingPrice: 199.99,
    purchasePrice: 119.99,
    stockQuantity: 38,
    reorderLevel: 8,
    unit: 'piece',
    status: 'in_stock',
    taxRate: 10,
    vendor: 'AudioPlus Supplies',
    location: 'Warehouse A',
    dimensions: {
      weight: 0.3,
      length: 18,
      width: 16,
      height: 8
    },
    tags: ['electronics', 'audio', 'headphones'],
    images: [],
    notes: 'Available in multiple colors',
    createdAt: new Date('2023-04-15'),
    updatedAt: new Date('2023-08-20')
  },
  '5': {
    id: '5',
    name: 'Coffee Maker',
    sku: 'KIT-50100',
    barcode: '4567890123456',
    description: 'Programmable coffee maker with thermal carafe',
    category: 'Kitchen Appliances',
    sellingPrice: 129.99,
    purchasePrice: 79.99,
    stockQuantity: 25,
    reorderLevel: 5,
    unit: 'piece',
    status: 'in_stock',
    taxRate: 8,
    vendor: 'HomeGoods Supply',
    location: 'Warehouse B',
    dimensions: {
      weight: 5,
      length: 25,
      width: 20,
      height: 35
    },
    tags: ['appliances', 'kitchen', 'coffee'],
    images: [],
    notes: 'Bestseller in kitchen category',
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-09-05')
  }
};

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  
  // Collapsible sections state
  const [basicInfoExpanded, setBasicInfoExpanded] = useState(true);
  const [pricingExpanded, setPricingExpanded] = useState(true);
  const [inventoryExpanded, setInventoryExpanded] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [additionalExpanded, setAdditionalExpanded] = useState(false);
  
  // Form state
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [unit, setUnit] = useState("piece");
  const [reorderLevel, setReorderLevel] = useState("");
  const [vendor, setVendor] = useState("");
  const [location, setLocation] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Refs for scrolling to errors
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Load product data
  useEffect(() => {
    if (id) {
      setIsInitialLoading(true);
      
      const fetchProduct = async () => {
        try {
          // Use mock data instead of AsyncStorage
          const fetchedProduct = mockProducts[id];
          
          if (fetchedProduct) {
            setProduct(fetchedProduct);
            
            // Populate form fields
            setProductName(fetchedProduct.name);
            setSku(fetchedProduct.sku);
            setBarcode(fetchedProduct.barcode || "");
            setCategory(fetchedProduct.category || "");
            setBrand(""); // Brand not in the model, would be added in a real app
            setIsActive(fetchedProduct.status !== "discontinued");
            setCostPrice(fetchedProduct.purchasePrice.toString());
            setSellingPrice(fetchedProduct.sellingPrice.toString());
            setTaxRate(fetchedProduct.taxRate?.toString() || "");
            setStockQuantity(fetchedProduct.stockQuantity.toString());
            setUnit(fetchedProduct.unit);
            setReorderLevel(fetchedProduct.reorderLevel.toString());
            setVendor(fetchedProduct.vendor || "");
            setLocation(fetchedProduct.location || "");
            
            // Description handling
            if (fetchedProduct.description) {
              setFullDescription(fetchedProduct.description);
              setShortDescription("");
            }
            
            // Dimensions handling
            if (fetchedProduct.dimensions) {
              setWeight(fetchedProduct.dimensions.weight?.toString() || "");
              setLength(fetchedProduct.dimensions.length?.toString() || "");
              setWidth(fetchedProduct.dimensions.width?.toString() || "");
              setHeight(fetchedProduct.dimensions.height?.toString() || "");
            }
            
            // Tags handling
            if (fetchedProduct.tags && fetchedProduct.tags.length > 0) {
              setTags(fetchedProduct.tags.join(", "));
            }
            
            // Notes handling
            setNotes(fetchedProduct.notes || "");
            
            // Images handling
            if (fetchedProduct.images && fetchedProduct.images.length > 0) {
              setImages(fetchedProduct.images);
            }
          } else {
            console.error("Product not found");
            setSnackbarMessage("Failed to load product data");
            setSnackbarVisible(true);
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          setSnackbarMessage("Failed to load product data");
          setSnackbarVisible(true);
        } finally {
          setIsInitialLoading(false);
        }
      };
      
      fetchProduct();
    }
  }, [id]);
  
  // Track changes
  useEffect(() => {
    if (!product) return;
    
    const hasFormChanges = 
      productName !== product.name ||
      sku !== product.sku ||
      barcode !== (product.barcode || "") ||
      category !== (product.category || "") ||
      isActive !== (product.status !== "discontinued") ||
      parseFloat(costPrice) !== product.purchasePrice ||
      parseFloat(sellingPrice) !== product.sellingPrice ||
      (taxRate ? parseFloat(taxRate) : null) !== (product.taxRate || null) ||
      parseInt(stockQuantity) !== product.stockQuantity ||
      unit !== product.unit ||
      parseInt(reorderLevel) !== product.reorderLevel ||
      vendor !== (product.vendor || "") ||
      location !== (product.location || "") ||
      fullDescription !== (product.description || "") ||
      notes !== (product.notes || "") ||
      (product.tags ? tags !== product.tags.join(", ") : tags !== "") ||
      JSON.stringify(images) !== JSON.stringify(product.images || []);
    
    setHasChanges(hasFormChanges);
  }, [
    product,
    productName,
    sku,
    barcode,
    category,
    isActive,
    costPrice,
    sellingPrice,
    taxRate,
    stockQuantity,
    unit,
    reorderLevel,
    vendor,
    location,
    shortDescription,
    fullDescription,
    weight,
    length,
    width,
    height,
    tags,
    notes,
    images
  ]);
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!productName.trim()) {
      newErrors.productName = "Product name is required";
    }
    
    if (!sku.trim()) {
      newErrors.sku = "SKU is required";
    }
    
    if (!costPrice.trim()) {
      newErrors.costPrice = "Cost price is required";
    } else if (isNaN(parseFloat(costPrice)) || parseFloat(costPrice) < 0) {
      newErrors.costPrice = "Cost price must be a positive number";
    }
    
    if (!sellingPrice.trim()) {
      newErrors.sellingPrice = "Selling price is required";
    } else if (isNaN(parseFloat(sellingPrice)) || parseFloat(sellingPrice) < 0) {
      newErrors.sellingPrice = "Selling price must be a positive number";
    }
    
    if (!stockQuantity.trim()) {
      newErrors.stockQuantity = "Stock quantity is required";
    } else if (isNaN(parseInt(stockQuantity)) || parseInt(stockQuantity) < 0) {
      newErrors.stockQuantity = "Stock quantity must be a positive number";
    }
    
    if (!reorderLevel.trim()) {
      newErrors.reorderLevel = "Reorder level is required";
    } else if (isNaN(parseInt(reorderLevel)) || parseInt(reorderLevel) < 0) {
      newErrors.reorderLevel = "Reorder level must be a positive number";
    }
    
    if (taxRate.trim() && (isNaN(parseFloat(taxRate)) || parseFloat(taxRate) < 0)) {
      newErrors.taxRate = "Tax rate must be a positive number";
    }
    
    if (weight.trim() && (isNaN(parseFloat(weight)) || parseFloat(weight) < 0)) {
      newErrors.weight = "Weight must be a positive number";
    }
    
    if (length.trim() && (isNaN(parseFloat(length)) || parseFloat(length) < 0)) {
      newErrors.length = "Length must be a positive number";
    }
    
    if (width.trim() && (isNaN(parseFloat(width)) || parseFloat(width) < 0)) {
      newErrors.width = "Width must be a positive number";
    }
    
    if (height.trim() && (isNaN(parseFloat(height)) || parseFloat(height) < 0)) {
      newErrors.height = "Height must be a positive number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleScanBarcode = () => {
    Alert.alert(
      "Scan Barcode",
      "This feature will allow you to scan a barcode using your camera.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Scan",
          onPress: () => {
            // Simulate barcode scanning
            const randomBarcode = Math.floor(Math.random() * 9000000000000) + 1000000000000;
            setBarcode(randomBarcode.toString());
          }
        }
      ]
    );
  };
  
  const handleAddImage = async () => {
    Alert.alert(
      "Add Image",
      "Choose image source",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Camera",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Permission Denied", "Camera permission is required to take photos");
              return;
            }
            
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setImages([...images, result.assets[0].uri]);
            }
          }
        },
        {
          text: "Gallery",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Permission Denied", "Media library permission is required to select photos");
              return;
            }
            
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setImages([...images, result.assets[0].uri]);
            }
          }
        }
      ]
    );
  };
  
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };
  
  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        "Discard Changes",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          {
            text: "Keep Editing",
            style: "cancel"
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back()
          }
        ]
      );
    } else {
      router.back();
    }
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        // Expand the section containing the error
        if (["productName", "sku", "barcode", "category", "brand"].includes(firstErrorKey)) {
          setBasicInfoExpanded(true);
        } else if (["costPrice", "sellingPrice", "taxRate"].includes(firstErrorKey)) {
          setPricingExpanded(true);
        } else if (["stockQuantity", "reorderLevel", "unit", "vendor", "location"].includes(firstErrorKey)) {
          setInventoryExpanded(true);
        } else if (["shortDescription", "fullDescription", "weight", "length", "width", "height"].includes(firstErrorKey)) {
          setDetailsExpanded(true);
        }
      }
      
      setSnackbarMessage("Please fix the errors before saving");
      setSnackbarVisible(true);
      return;
    }
    
    // Prepare product object
    const updatedProduct: Product = {
      ...(product as Product), // Base with existing product data
      name: productName.trim(),
      sku: sku.trim(),
      barcode: barcode.trim() || undefined,
      category: category.trim() || undefined,
      sellingPrice: parseFloat(sellingPrice),
      purchasePrice: parseFloat(costPrice),
      taxRate: taxRate.trim() ? parseFloat(taxRate) : undefined,
      stockQuantity: parseInt(stockQuantity),
      reorderLevel: parseInt(reorderLevel),
      unit: unit,
      vendor: vendor.trim() || undefined,
      location: location.trim() || undefined,
      description: fullDescription.trim() || undefined,
      notes: notes.trim() || undefined,
      dimensions: {
        weight: weight.trim() ? parseFloat(weight) : undefined,
        length: length.trim() ? parseFloat(length) : undefined,
        width: width.trim() ? parseFloat(width) : undefined,
        height: height.trim() ? parseFloat(height) : undefined,
      },
      status: isActive ? 
        (parseInt(stockQuantity) <= 0 ? "out_of_stock" : 
         parseInt(stockQuantity) <= parseInt(reorderLevel) ? "low_stock" : "in_stock") : 
        "discontinued",
      tags: tags.trim() ? tags.split(",").map(tag => tag.trim()) : [],
      images: images,
      updatedAt: new Date()
    };
    
    setIsLoading(true);
    
    try {
      // Simulate saving to AsyncStorage with a delay
      setTimeout(() => {
        // In a real implementation, would update AsyncStorage
        // For now, just update our local mock data
        if (id) {
          mockProducts[id] = updatedProduct;
        }
        
        setIsLoading(false);
        setSnackbarMessage("Product updated successfully");
        setSnackbarVisible(true);
        setHasChanges(false);
        
        // Navigate back to product details after short delay
        setTimeout(() => {
          router.push(`/products/${id}`);
        }, 1000);
      }, 800);
    } catch (error) {
      console.error("Error updating product:", error);
      setIsLoading(false);
      setSnackbarMessage("Failed to update product");
      setSnackbarVisible(true);
    }
  };
  
  // Calculate profit margin
  const calculateProfitMargin = () => {
    if (!costPrice || !sellingPrice) return "0.00";
    
    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    
    if (isNaN(cost) || isNaN(selling) || cost <= 0 || selling <= 0) return "0.00";
    
    const margin = ((selling - cost) / selling) * 100;
    return margin.toFixed(2);
  };
  
  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading product data...</Text>
      </View>
    );
  }
  
  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={64} color="#ea4335" />
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <Text style={styles.errorMessage}>The product you're trying to edit doesn't exist or has been deleted.</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <TouchableOpacity 
          style={[styles.headerActionButton, isLoading && styles.disabledButton]} 
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.headerActionButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information Card */}
          <View style={styles.formSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setBasicInfoExpanded(!basicInfoExpanded)}
            >
              <View style={styles.sectionHeaderLeft}>
                <Tag size={20} color={Colors.text.primary} />
                <Text style={styles.sectionTitle}>Basic Information</Text>
              </View>
              {basicInfoExpanded ? (
                <ChevronUp size={20} color={Colors.text.secondary} />
              ) : (
                <ChevronDown size={20} color={Colors.text.secondary} />
              )}
            </TouchableOpacity>
            
            {basicInfoExpanded && (
              <View style={styles.sectionContent}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.productName && styles.inputError]}
                    value={productName}
                    onChangeText={setProductName}
                    placeholder="Enter product name"
                  />
                  {errors.productName && (
                    <Text style={styles.errorText}>{errors.productName}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>SKU <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.sku && styles.inputError]}
                    value={sku}
                    onChangeText={setSku}
                    placeholder="Enter SKU"
                  />
                  {errors.sku && (
                    <Text style={styles.errorText}>{errors.sku}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Barcode</Text>
                  <View style={styles.inputWithButton}>
                    <TextInput
                      style={[
                        styles.input, 
                        styles.inputWithButtonField,
                        errors.barcode && styles.inputError
                      ]}
                      value={barcode}
                      onChangeText={setBarcode}
                      placeholder="Enter barcode"
                      keyboardType="numeric"
                    />
                    <TouchableOpacity 
                      style={styles.inputButton}
                      onPress={handleScanBarcode}
                    >
                      <Barcode size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  {errors.barcode && (
                    <Text style={styles.errorText}>{errors.barcode}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Category</Text>
                  <TextInput
                    style={[styles.input, errors.category && styles.inputError]}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="Enter category"
                  />
                  {errors.category && (
                    <Text style={styles.errorText}>{errors.category}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Brand/Manufacturer</Text>
                  <TextInput
                    style={[styles.input, errors.brand && styles.inputError]}
                    value={brand}
                    onChangeText={setBrand}
                    placeholder="Enter brand or manufacturer"
                  />
                  {errors.brand && (
                    <Text style={styles.errorText}>{errors.brand}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Product Images</Text>
                  <View style={styles.imagesContainer}>
                    {images.map((image, index) => (
                      <View key={index} style={styles.imageContainer}>
                        <Image source={{ uri: image }} style={styles.image} />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => handleRemoveImage(index)}
                        >
                          <X size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity 
                      style={styles.addImageButton}
                      onPress={handleAddImage}
                    >
                      <Camera size={24} color="#666" />
                      <Text style={styles.addImageText}>Add Image</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>
                      {isActive ? "Active" : "Discontinued"}
                    </Text>
                    <Switch
                      value={isActive}
                      onValueChange={setIsActive}
                      trackColor={{ false: "#ccc", true: `${Colors.primary}80` }}
                      thumbColor={isActive ? Colors.primary : "#f4f3f4"}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
          
          {/* Pricing Card */}
          <View style={styles.formSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setPricingExpanded(!pricingExpanded)}
            >
              <View style={styles.sectionHeaderLeft}>
                <DollarSign size={20} color={Colors.text.primary} />
                <Text style={styles.sectionTitle}>Pricing</Text>
              </View>
              {pricingExpanded ? (
                <ChevronUp size={20} color={Colors.text.secondary} />
              ) : (
                <ChevronDown size={20} color={Colors.text.secondary} />
              )}
            </TouchableOpacity>
            
            {pricingExpanded && (
              <View style={styles.sectionContent}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Cost Price <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputWithPrefix}>
                    <Text style={styles.inputPrefix}>$</Text>
                    <TextInput
                      style={[
                        styles.input, 
                        styles.inputWithPrefixField,
                        errors.costPrice && styles.inputError
                      ]}
                      value={costPrice}
                      onChangeText={setCostPrice}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  {errors.costPrice && (
                    <Text style={styles.errorText}>{errors.costPrice}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Selling Price <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputWithPrefix}>
                    <Text style={styles.inputPrefix}>$</Text>
                    <TextInput
                      style={[
                        styles.input, 
                        styles.inputWithPrefixField,
                        errors.sellingPrice && styles.inputError
                      ]}
                      value={sellingPrice}
                      onChangeText={setSellingPrice}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  {errors.sellingPrice && (
                    <Text style={styles.errorText}>{errors.sellingPrice}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Profit Margin</Text>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      style={[
                        styles.input, 
                        styles.inputWithSuffixField,
                        { backgroundColor: "#f0f0f0" }
                      ]}
                      value={calculateProfitMargin()}
                      editable={false}
                    />
                    <Text style={styles.inputSuffix}>%</Text>
                  </View>
                  <Text style={styles.helperText}>
                    Calculated automatically based on cost and selling price
                  </Text>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tax Rate</Text>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      style={[
                        styles.input, 
                        styles.inputWithSuffixField,
                        errors.taxRate && styles.inputError
                      ]}
                      value={taxRate}
                      onChangeText={setTaxRate}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.inputSuffix}>%</Text>
                  </View>
                  {errors.taxRate && (
                    <Text style={styles.errorText}>{errors.taxRate}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
          
          {/* Inventory Card */}
          <View style={styles.formSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setInventoryExpanded(!inventoryExpanded)}
            >
              <View style={styles.sectionHeaderLeft}>
                <ShoppingBag size={20} color={Colors.text.primary} />
                <Text style={styles.sectionTitle}>Inventory</Text>
              </View>
              {inventoryExpanded ? (
                <ChevronUp size={20} color={Colors.text.secondary} />
              ) : (
                <ChevronDown size={20} color={Colors.text.secondary} />
              )}
            </TouchableOpacity>
            
            {inventoryExpanded && (
              <View style={styles.sectionContent}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Current Stock <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.stockQuantity && styles.inputError]}
                    value={stockQuantity}
                    onChangeText={setStockQuantity}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                  {errors.stockQuantity && (
                    <Text style={styles.errorText}>{errors.stockQuantity}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Unit of Measure <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="piece, kg, liter, etc."
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Reorder Level <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.reorderLevel && styles.inputError]}
                    value={reorderLevel}
                    onChangeText={setReorderLevel}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                  {errors.reorderLevel && (
                    <Text style={styles.errorText}>{errors.reorderLevel}</Text>
                  )}
                  <Text style={styles.helperText}>
                    Minimum stock level before reordering
                  </Text>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Preferred Vendor</Text>
                  <TextInput
                    style={styles.input}
                    value={vendor}
                    onChangeText={setVendor}
                    placeholder="Enter vendor name"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Location in Store/Warehouse</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Enter storage location"
                  />
                </View>
              </View>
            )}
          </View>
          
          {/* Details Card */}
          <View style={styles.formSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setDetailsExpanded(!detailsExpanded)}
            >
              <View style={styles.sectionHeaderLeft}>
                <Info size={20} color={Colors.text.primary} />
                <Text style={styles.sectionTitle}>Additional Details</Text>
              </View>
              {detailsExpanded ? (
                <ChevronUp size={20} color={Colors.text.secondary} />
              ) : (
                <ChevronDown size={20} color={Colors.text.secondary} />
              )}
            </TouchableOpacity>
            
            {detailsExpanded && (
              <View style={styles.sectionContent}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Short Description</Text>
                  <TextInput
                    style={styles.input}
                    value={shortDescription}
                    onChangeText={setShortDescription}
                    placeholder="Brief description of the product"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Full Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={fullDescription}
                    onChangeText={setFullDescription}
                    placeholder="Detailed description of the product"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                
                <Text style={styles.subSectionTitle}>Dimensions & Weight</Text>
                
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Weight</Text>
                    <View style={styles.inputWithSuffix}>
                      <TextInput
                        style={[
                          styles.input, 
                          styles.inputWithSuffixField,
                          errors.weight && styles.inputError
                        ]}
                        value={weight}
                        onChangeText={setWeight}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.inputSuffix}>kg</Text>
                    </View>
                    {errors.weight && (
                      <Text style={styles.errorText}>{errors.weight}</Text>
                    )}
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Length</Text>
                    <View style={styles.inputWithSuffix}>
                      <TextInput
                        style={[
                          styles.input, 
                          styles.inputWithSuffixField,
                          errors.length && styles.inputError
                        ]}
                        value={length}
                        onChangeText={setLength}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.inputSuffix}>cm</Text>
                    </View>
                    {errors.length && (
                      <Text style={styles.errorText}>{errors.length}</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Width</Text>
                    <View style={styles.inputWithSuffix}>
                      <TextInput
                        style={[
                          styles.input, 
                          styles.inputWithSuffixField,
                          errors.width && styles.inputError
                        ]}
                        value={width}
                        onChangeText={setWidth}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.inputSuffix}>cm</Text>
                    </View>
                    {errors.width && (
                      <Text style={styles.errorText}>{errors.width}</Text>
                    )}
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Height</Text>
                    <View style={styles.inputWithSuffix}>
                      <TextInput
                        style={[
                          styles.input, 
                          styles.inputWithSuffixField,
                          errors.height && styles.inputError
                        ]}
                        value={height}
                        onChangeText={setHeight}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.inputSuffix}>cm</Text>
                    </View>
                    {errors.height && (
                      <Text style={styles.errorText}>{errors.height}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
          
          {/* Notes Card */}
          <View style={styles.formSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setAdditionalExpanded(!additionalExpanded)}
            >
              <View style={styles.sectionHeaderLeft}>
                <FileText size={20} color={Colors.text.primary} />
                <Text style={styles.sectionTitle}>Notes & Tags</Text>
              </View>
              {additionalExpanded ? (
                <ChevronUp size={20} color={Colors.text.secondary} />
              ) : (
                <ChevronDown size={20} color={Colors.text.secondary} />
              )}
            </TouchableOpacity>
            
            {additionalExpanded && (
              <View style={styles.sectionContent}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tags</Text>
                  <TextInput
                    style={styles.input}
                    value={tags}
                    onChangeText={setTags}
                    placeholder="Enter tags separated by commas"
                  />
                  <Text style={styles.helperText}>
                    Example: electronics, gadget, wireless
                  </Text>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Additional notes about the product"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.disabledButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Save size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <SnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
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
  headerButton: {
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
  headerActionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formSection: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 12,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  cancelButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  sectionContent: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  required: {
    color: "#ea4335",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  inputError: {
    borderColor: "#ea4335",
  },
  errorText: {
    color: "#ea4335",
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputWithButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputWithButtonField: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  inputButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  inputButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  inputWithPrefix: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputPrefix: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRightWidth: 0,
    fontSize: 14,
    color: "#333",
  },
  inputWithPrefixField: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  inputWithSuffix: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputSuffix: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderLeftWidth: 0,
    fontSize: 14,
    color: "#333",
  },
  inputWithSuffixField: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: "#333",
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ea4335",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  addImageText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
});