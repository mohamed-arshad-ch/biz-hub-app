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
  Save,
  Trash2
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as dbProduct from '@/db/product';
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { Product, StockStatus } from "@/types/product";
import SnackBar from "@/components/SnackBar";

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  
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
  
  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Refs for scrolling to errors
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadProductData();
  }, [id]);

  const loadProductData = async () => {
    if (!id) {
      setSnackbarMessage("Product ID is required");
      setSnackbarVisible(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const product = await dbProduct.getProductById(Number(id));
      
      if (product) {
        setProductName(product.productName);
        setSku(product.sku);
        setBarcode(product.barcode || "");
        setCategory(product.category || "");
        setBrand(product.brand || "");
        setIsActive(Boolean(product.isActive));
        setCostPrice(product.costPrice?.toString() || "");
        setSellingPrice(product.sellingPrice?.toString() || "");
        setTaxRate(product.taxRate?.toString() || "");
        setStockQuantity(product.stockQuantity?.toString() || "");
        setUnit(product.unit || "piece");
        setReorderLevel(product.reorderLevel?.toString() || "");
        setVendor(product.vendor || "");
        setLocation(product.location || "");
        setShortDescription(product.shortDescription || "");
        setFullDescription(product.fullDescription || "");
        setWeight(product.weight?.toString() || "");
        setLength(product.length?.toString() || "");
        setWidth(product.width?.toString() || "");
        setHeight(product.height?.toString() || "");
        setTags(product.tags || "");
        setNotes(product.notes || "");
        setImages(product.images ? product.images.split(',').map(i => i.trim()).filter(Boolean) : []);
      } else {
        setSnackbarMessage("Product not found");
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error("Error loading product:", error);
      setSnackbarMessage("Failed to load product data");
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };
  
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
  
  const handleSave = async () => {
    if (!validateForm()) {
      setSnackbarMessage("Please fix the errors before saving");
      setSnackbarVisible(true);
      return;
    }
    
    if (!id) {
      setSnackbarMessage("Product ID is required");
      setSnackbarVisible(true);
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updatedProduct = {
        productName: productName.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() || null,
        category: category.trim() || null,
        brand: brand.trim() || null,
        isActive: isActive,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        taxRate: taxRate ? parseFloat(taxRate) : null,
        stockQuantity: parseInt(stockQuantity),
        unit: unit,
        reorderLevel: parseInt(reorderLevel),
        vendor: vendor.trim() || null,
        location: location.trim() || null,
        shortDescription: shortDescription.trim() || null,
        fullDescription: fullDescription.trim() || null,
        weight: weight ? parseFloat(weight) : null,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        tags: tags.trim() || null,
        notes: notes.trim() || null,
        images: images.join(','),
      };
      
      const success = await dbProduct.updateProduct(Number(id), updatedProduct);
      
      if (success) {
        setSnackbarMessage("Product updated successfully");
        setSnackbarVisible(true);
        
        // Navigate back to product details after a short delay
        setTimeout(() => {
          router.replace(`/products/${id}`);
        }, 1500);
      } else {
        throw new Error("Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setSnackbarMessage("Failed to update product");
      setSnackbarVisible(true);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            
            setIsDeleting(true);
            
            try {
              const success = await dbProduct.deleteProduct(Number(id));
              
              if (success) {
                setSnackbarMessage("Product deleted successfully");
                setSnackbarVisible(true);
                
                // Navigate back to products list after a short delay
                setTimeout(() => {
                  router.replace("/products");
                }, 1500);
              } else {
                throw new Error("Failed to delete product");
              }
            } catch (error) {
              console.error("Error deleting product:", error);
              setSnackbarMessage("Failed to delete product");
              setSnackbarVisible(true);
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.headerButton, styles.deleteButton]} 
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={Colors.negative} />
            ) : (
              <Trash2 size={24} color={Colors.negative} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information Section */}
          <View style={styles.section}>
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
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Product Name *</Text>
                  <TextInput
                    style={[styles.input, errors.productName && styles.inputError]}
                    value={productName}
                    onChangeText={setProductName}
                    placeholder="Enter product name"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                  {errors.productName && (
                    <Text style={styles.errorText}>{errors.productName}</Text>
                  )}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>SKU *</Text>
                  <TextInput
                    style={[styles.input, errors.sku && styles.inputError]}
                    value={sku}
                    onChangeText={setSku}
                    placeholder="Enter SKU"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                  {errors.sku && (
                    <Text style={styles.errorText}>{errors.sku}</Text>
                  )}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Barcode</Text>
                  <View style={styles.barcodeInputContainer}>
                    <TextInput
                      style={[styles.input, styles.barcodeInput, errors.barcode && styles.inputError]}
                      value={barcode}
                      onChangeText={setBarcode}
                      placeholder="Enter barcode"
                      placeholderTextColor={Colors.text.tertiary}
                    />
                    <TouchableOpacity 
                      style={styles.scanButton}
                      onPress={handleScanBarcode}
                    >
                      <Barcode size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                  {errors.barcode && (
                    <Text style={styles.errorText}>{errors.barcode}</Text>
                  )}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <TextInput
                    style={styles.input}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="Enter category"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Brand</Text>
                  <TextInput
                    style={styles.input}
                    value={brand}
                    onChangeText={setBrand}
                    placeholder="Enter brand"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                </View>
                
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Active</Text>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: Colors.border.light, true: Colors.primary + '40' }}
                    thumbColor={isActive ? Colors.primary : Colors.text.tertiary}
                  />
                </View>
              </View>
            )}
          </View>
          
          {/* Pricing Section */}
          <View style={styles.section}>
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
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Cost Price *</Text>
                  <TextInput
                    style={[styles.input, errors.costPrice && styles.inputError]}
                    value={costPrice}
                    onChangeText={setCostPrice}
                    placeholder="Enter cost price"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="decimal-pad"
                  />
                  {errors.costPrice && (
                    <Text style={styles.errorText}>{errors.costPrice}</Text>
                  )}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Selling Price *</Text>
                  <TextInput
                    style={[styles.input, errors.sellingPrice && styles.inputError]}
                    value={sellingPrice}
                    onChangeText={setSellingPrice}
                    placeholder="Enter selling price"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="decimal-pad"
                  />
                  {errors.sellingPrice && (
                    <Text style={styles.errorText}>{errors.sellingPrice}</Text>
                  )}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tax Rate (%)</Text>
                  <TextInput
                    style={[styles.input, errors.taxRate && styles.inputError]}
                    value={taxRate}
                    onChangeText={setTaxRate}
                    placeholder="Enter tax rate"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="decimal-pad"
                  />
                  {errors.taxRate && (
                    <Text style={styles.errorText}>{errors.taxRate}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
          
          {/* Inventory Section */}
          <View style={styles.section}>
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
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Stock Quantity *</Text>
                  <TextInput
                    style={[styles.input, errors.stockQuantity && styles.inputError]}
                    value={stockQuantity}
                    onChangeText={setStockQuantity}
                    placeholder="Enter stock quantity"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="number-pad"
                  />
                  {errors.stockQuantity && (
                    <Text style={styles.errorText}>{errors.stockQuantity}</Text>
                  )}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Reorder Level *</Text>
                  <TextInput
                    style={[styles.input, errors.reorderLevel && styles.inputError]}
                    value={reorderLevel}
                    onChangeText={setReorderLevel}
                    placeholder="Enter reorder level"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="number-pad"
                  />
                  {errors.reorderLevel && (
                    <Text style={styles.errorText}>{errors.reorderLevel}</Text>
                  )}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="Enter unit (e.g., piece, kg, etc.)"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Vendor</Text>
                  <TextInput
                    style={styles.input}
                    value={vendor}
                    onChangeText={setVendor}
                    placeholder="Enter vendor name"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Enter storage location"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                </View>
              </View>
            )}
          </View>
          
          {/* Details Section */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setDetailsExpanded(!detailsExpanded)}
            >
              <View style={styles.sectionHeaderLeft}>
                <Info size={20} color={Colors.text.primary} />
                <Text style={styles.sectionTitle}>Details</Text>
              </View>
              {detailsExpanded ? (
                <ChevronUp size={20} color={Colors.text.secondary} />
              ) : (
                <ChevronDown size={20} color={Colors.text.secondary} />
              )}
            </TouchableOpacity>
            
            {detailsExpanded && (
              <View style={styles.sectionContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Short Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={shortDescription}
                    onChangeText={setShortDescription}
                    placeholder="Enter short description"
                    placeholderTextColor={Colors.text.tertiary}
                    multiline
                    numberOfLines={2}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={fullDescription}
                    onChangeText={setFullDescription}
                    placeholder="Enter full description"
                    placeholderTextColor={Colors.text.tertiary}
                    multiline
                    numberOfLines={4}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    style={[styles.input, errors.weight && styles.inputError]}
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="Enter weight"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="decimal-pad"
                  />
                  {errors.weight && (
                    <Text style={styles.errorText}>{errors.weight}</Text>
                  )}
                </View>
                
                <View style={styles.dimensionsContainer}>
                  <View style={[styles.inputGroup, styles.dimensionInput]}>
                    <Text style={styles.label}>Length (cm)</Text>
                    <TextInput
                      style={[styles.input, errors.length && styles.inputError]}
                      value={length}
                      onChangeText={setLength}
                      placeholder="Length"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                    />
                    {errors.length && (
                      <Text style={styles.errorText}>{errors.length}</Text>
                    )}
                  </View>
                  
                  <View style={[styles.inputGroup, styles.dimensionInput]}>
                    <Text style={styles.label}>Width (cm)</Text>
                    <TextInput
                      style={[styles.input, errors.width && styles.inputError]}
                      value={width}
                      onChangeText={setWidth}
                      placeholder="Width"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                    />
                    {errors.width && (
                      <Text style={styles.errorText}>{errors.width}</Text>
                    )}
                  </View>
                  
                  <View style={[styles.inputGroup, styles.dimensionInput]}>
                    <Text style={styles.label}>Height (cm)</Text>
                    <TextInput
                      style={[styles.input, errors.height && styles.inputError]}
                      value={height}
                      onChangeText={setHeight}
                      placeholder="Height"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                    />
                    {errors.height && (
                      <Text style={styles.errorText}>{errors.height}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
          
          {/* Additional Information Section */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setAdditionalExpanded(!additionalExpanded)}
            >
              <View style={styles.sectionHeaderLeft}>
                <FileText size={20} color={Colors.text.primary} />
                <Text style={styles.sectionTitle}>Additional Information</Text>
              </View>
              {additionalExpanded ? (
                <ChevronUp size={20} color={Colors.text.secondary} />
              ) : (
                <ChevronDown size={20} color={Colors.text.secondary} />
              )}
            </TouchableOpacity>
            
            {additionalExpanded && (
              <View style={styles.sectionContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tags</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={tags}
                    onChangeText={setTags}
                    placeholder="Enter tags (comma-separated)"
                    placeholderTextColor={Colors.text.tertiary}
                    multiline
                    numberOfLines={2}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Enter additional notes"
                    placeholderTextColor={Colors.text.tertiary}
                    multiline
                    numberOfLines={4}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Images</Text>
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
                      <Camera size={24} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <SnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
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
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
  },
  deleteButton: {
    backgroundColor: Colors.negative + '10',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
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
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  inputError: {
    borderColor: Colors.negative,
  },
  errorText: {
    color: Colors.negative,
    fontSize: 12,
    marginTop: 4,
  },
  barcodeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcodeInput: {
    flex: 1,
    marginRight: 8,
  },
  scanButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dimensionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dimensionInput: {
    flex: 1,
    marginRight: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  imageContainer: {
    width: 80,
    height: 80,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 80,
    height: 80,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderStyle: 'dashed',
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});