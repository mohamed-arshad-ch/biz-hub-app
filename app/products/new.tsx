import React, { useState, useRef } from "react";
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
import { Stack, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Camera, 
  X, 
  ChevronDown, 
  ChevronUp,
  Barcode,
  Plus,
  Tag,
  DollarSign,
  Package,
  Info,
  FileText,
  Save,
  ShoppingBag
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import Colors from "@/constants/colors";
import { Product, StockStatus } from "@/types/product";
import SnackBar from "@/components/SnackBar";

export default function AddProductScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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
  
  const generateSku = () => {
    if (productName.trim() === "") {
      Alert.alert("Error", "Please enter a product name first");
      return;
    }
    
    // Generate SKU based on product name and random number
    const prefix = productName.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 90000) + 10000;
    setSku(`${prefix}-${randomNum}`);
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
        } else if (["tags", "notes"].includes(firstErrorKey)) {
          setAdditionalExpanded(true);
        }
        
        // Show error message
        setSnackbarMessage("Please fix the errors in the form");
        setSnackbarVisible(true);
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Determine stock status based on quantity and reorder level
      let status: StockStatus;
      const stockQty = parseInt(stockQuantity);
      const reorderLvl = parseInt(reorderLevel);
      
      if (!isActive) {
        status = "discontinued";
      } else if (stockQty === 0) {
        status = "out_of_stock";
      } else if (stockQty < reorderLvl) {
        status = "low_stock";
      } else {
        status = "in_stock";
      }
      
      // Create new product object
      const newProduct: Product = {
        id: `product-${Date.now()}`, // Generate a temporary ID (would be replaced with server-generated ID)
        name: productName.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        description: fullDescription.trim() || shortDescription.trim() || undefined,
        category: category.trim() || undefined,
        tags: tags.trim() ? tags.split(",").map(tag => tag.trim()) : [],
        purchasePrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        stockQuantity: parseInt(stockQuantity),
        reorderLevel: parseInt(reorderLevel),
        unit,
        taxRate: taxRate.trim() ? parseFloat(taxRate) : undefined,
        images: images.length > 0 ? images : [],
        vendor: vendor.trim() || undefined,
        location: location.trim() || undefined,
        dimensions: (length.trim() || width.trim() || height.trim() || weight.trim()) ? {
          length: length.trim() ? parseFloat(length) : undefined,
          width: width.trim() ? parseFloat(width) : undefined,
          height: height.trim() ? parseFloat(height) : undefined,
          weight: weight.trim() ? parseFloat(weight) : undefined,
        } : undefined,
        status,
        notes: notes.trim() || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Simulate saving to database/storage with a delay
      setTimeout(() => {
        // In a real implementation, would save to AsyncStorage or backend
        
        setIsLoading(false);
        setSnackbarMessage("Product added successfully");
        setSnackbarVisible(true);
        
        // Navigate back to products list after a short delay
        setTimeout(() => {
          router.replace("/products");
        }, 1500);
      }, 800);
    } catch (error) {
      console.error("Error adding product:", error);
      setSnackbarMessage("Failed to add product");
      setSnackbarVisible(true);
      setIsLoading(false);
    }
  };
  
  const handleSaveAndAddAnother = async () => {
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
        } else if (["tags", "notes"].includes(firstErrorKey)) {
          setAdditionalExpanded(true);
        }
        
        // Show error message
        setSnackbarMessage("Please fix the errors in the form");
        setSnackbarVisible(true);
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Determine stock status based on quantity and reorder level
      let status: StockStatus;
      const stockQty = parseInt(stockQuantity);
      const reorderLvl = parseInt(reorderLevel);
      
      if (!isActive) {
        status = "discontinued";
      } else if (stockQty === 0) {
        status = "out_of_stock";
      } else if (stockQty < reorderLvl) {
        status = "low_stock";
      } else {
        status = "in_stock";
      }
      
      // Create new product object
      const newProduct: Product = {
        id: `product-${Date.now()}`, // Generate a temporary ID (would be replaced with server-generated ID)
        name: productName.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        description: fullDescription.trim() || shortDescription.trim() || undefined,
        category: category.trim() || undefined,
        tags: tags.trim() ? tags.split(",").map(tag => tag.trim()) : [],
        purchasePrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        stockQuantity: parseInt(stockQuantity),
        reorderLevel: parseInt(reorderLevel),
        unit,
        taxRate: taxRate.trim() ? parseFloat(taxRate) : undefined,
        images: images.length > 0 ? images : [],
        vendor: vendor.trim() || undefined,
        location: location.trim() || undefined,
        dimensions: (length.trim() || width.trim() || height.trim() || weight.trim()) ? {
          length: length.trim() ? parseFloat(length) : undefined,
          width: width.trim() ? parseFloat(width) : undefined,
          height: height.trim() ? parseFloat(height) : undefined,
          weight: weight.trim() ? parseFloat(weight) : undefined,
        } : undefined,
        status,
        notes: notes.trim() || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Simulate saving to database/storage with a delay
      setTimeout(() => {
        // In a real implementation, would save to AsyncStorage or backend
        
        // Clear the form
        setProductName("");
        setSku("");
        setBarcode("");
        setCategory("");
        setBrand("");
        setCostPrice("");
        setSellingPrice("");
        setTaxRate("");
        setStockQuantity("");
        setReorderLevel("");
        setVendor("");
        setLocation("");
        setShortDescription("");
        setFullDescription("");
        setWeight("");
        setLength("");
        setWidth("");
        setHeight("");
        setTags("");
        setNotes("");
        setImages([]);
        
        // Reset form validation
        setErrors({});
        
        // Show success message
        setSnackbarMessage("Product added successfully, you can add another");
        setSnackbarVisible(true);
        setIsLoading(false);
        
        // Scroll back to top
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
        }
      }, 800);
    } catch (error) {
      console.error("Error adding product:", error);
      setSnackbarMessage("Failed to add product");
      setSnackbarVisible(true);
      setIsLoading(false);
    }
  };
  
  // Calculate profit margin
  const calculateProfitMargin = () => {
    if (!costPrice || !sellingPrice) return 0;
    
    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    
    if (isNaN(cost) || isNaN(selling) || cost <= 0 || selling <= 0) return 0;
    
    const margin = ((selling - cost) / selling) * 100;
    return margin;
  };
  
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
        <Text style={styles.headerTitle}>Add New Product</Text>
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
          {/* Form sections will go here */}
          
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
                {/* Product Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Product Name <Text style={styles.requiredAsterisk}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.productName && styles.inputError]}
                    placeholder="Enter product name"
                    value={productName}
                    onChangeText={setProductName}
                  />
                  {errors.productName && <Text style={styles.errorText}>{errors.productName}</Text>}
                </View>
                
                {/* SKU and Barcode row */}
                <View style={styles.twoColumnRow}>
                  <View style={[styles.formGroup, { flex: 2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>SKU <Text style={styles.requiredAsterisk}>*</Text></Text>
                    <View style={styles.inputWithButton}>
                      <TextInput
                        style={[
                          styles.input, 
                          styles.inputWithButtonText, 
                          errors.sku && styles.inputError
                        ]}
                        placeholder="Product SKU"
                        value={sku}
                        onChangeText={setSku}
                      />
                      <TouchableOpacity
                        style={styles.inputActionButton}
                        onPress={generateSku}
                      >
                        <Text style={styles.inputActionButtonText}>Generate</Text>
                      </TouchableOpacity>
                    </View>
                    {errors.sku && <Text style={styles.errorText}>{errors.sku}</Text>}
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 2 }]}>
                    <Text style={styles.inputLabel}>Barcode</Text>
                    <View style={styles.inputWithButton}>
                      <TextInput
                        style={[styles.input, styles.inputWithButtonText]}
                        placeholder="Product barcode"
                        value={barcode}
                        onChangeText={setBarcode}
                        keyboardType="number-pad"
                      />
                      <TouchableOpacity
                        style={styles.inputActionButton}
                        onPress={handleScanBarcode}
                      >
                        <Barcode size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                {/* Category and Brand row */}
                <View style={styles.twoColumnRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Category</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Product category"
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Brand</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Product brand"
                      value={brand}
                      onChangeText={setBrand}
                    />
                  </View>
                </View>
                
                {/* Active Status */}
                <View style={styles.formGroup}>
                  <View style={styles.switchRow}>
                    <Text style={styles.inputLabel}>Active Product</Text>
                    <Switch
                      trackColor={{ false: Colors.border.medium, true: `${Colors.primary}80` }}
                      thumbColor={isActive ? Colors.primary : Colors.border.dark}
                      onValueChange={setIsActive}
                      value={isActive}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Inactive products won't appear in sales transactions
                  </Text>
                </View>
                
                {/* Product Images */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Product Images</Text>
                  <View style={styles.imagesContainer}>
                    {images.map((image, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <Image source={{ uri: image }} style={styles.productImage} />
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
                      <Camera size={24} color={Colors.text.secondary} />
                      <Text style={styles.addImageText}>Add Image</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Short Description */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Short Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Brief description of the product"
                    value={shortDescription}
                    onChangeText={setShortDescription}
                    multiline
                    numberOfLines={3}
                  />
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
                {/* Cost and Selling Price row */}
                <View style={styles.twoColumnRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Cost Price <Text style={styles.requiredAsterisk}>*</Text></Text>
                    <View style={styles.inputWithIcon}>
                      <DollarSign 
                        size={16} 
                        color={Colors.text.secondary} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={[
                          styles.input, 
                          styles.inputWithIconText, 
                          errors.costPrice && styles.inputError
                        ]}
                        placeholder="0.00"
                        value={costPrice}
                        onChangeText={setCostPrice}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    {errors.costPrice && <Text style={styles.errorText}>{errors.costPrice}</Text>}
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Selling Price <Text style={styles.requiredAsterisk}>*</Text></Text>
                    <View style={styles.inputWithIcon}>
                      <DollarSign 
                        size={16} 
                        color={Colors.text.secondary} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={[
                          styles.input, 
                          styles.inputWithIconText, 
                          errors.sellingPrice && styles.inputError
                        ]}
                        placeholder="0.00"
                        value={sellingPrice}
                        onChangeText={setSellingPrice}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    {errors.sellingPrice && <Text style={styles.errorText}>{errors.sellingPrice}</Text>}
                  </View>
                </View>
                
                {/* Profit Margin */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Profit Margin</Text>
                  <View style={styles.profitMarginContainer}>
                    <View style={[
                      styles.profitMarginBar,
                      {
                        backgroundColor: Colors.primary,
                        width: `${Math.min(Math.round(calculateProfitMargin()), 100)}%`
                      }
                    ]}>
                      <Text style={styles.profitMarginText}>
                        {costPrice && sellingPrice && !isNaN(parseFloat(costPrice)) && !isNaN(parseFloat(sellingPrice)) 
                          ? `${calculateProfitMargin().toFixed(2)}%` 
                          : '0%'
                        }
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Tax Rate */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Tax Rate (%)</Text>
                  <TextInput
                    style={[styles.input, errors.taxRate && styles.inputError]}
                    placeholder="0"
                    value={taxRate}
                    onChangeText={setTaxRate}
                    keyboardType="decimal-pad"
                  />
                  {errors.taxRate && <Text style={styles.errorText}>{errors.taxRate}</Text>}
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
                {/* Stock Quantity and Unit row */}
                <View style={styles.twoColumnRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Stock Quantity <Text style={styles.requiredAsterisk}>*</Text></Text>
                    <TextInput
                      style={[styles.input, errors.stockQuantity && styles.inputError]}
                      placeholder="0"
                      value={stockQuantity}
                      onChangeText={setStockQuantity}
                      keyboardType="number-pad"
                    />
                    {errors.stockQuantity && <Text style={styles.errorText}>{errors.stockQuantity}</Text>}
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Unit <Text style={styles.requiredAsterisk}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="piece, kg, liter, etc."
                      value={unit}
                      onChangeText={setUnit}
                    />
                  </View>
                </View>
                
                {/* Reorder Level */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Reorder Level <Text style={styles.requiredAsterisk}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.reorderLevel && styles.inputError]}
                    placeholder="Minimum stock before reordering"
                    value={reorderLevel}
                    onChangeText={setReorderLevel}
                    keyboardType="number-pad"
                  />
                  {errors.reorderLevel && <Text style={styles.errorText}>{errors.reorderLevel}</Text>}
                  <Text style={styles.helperText}>
                    System will alert when stock falls below this level
                  </Text>
                </View>
                
                {/* Vendor and Location row */}
                <View style={styles.twoColumnRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Vendor/Supplier</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Supplier name"
                      value={vendor}
                      onChangeText={setVendor}
                    />
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Storage Location</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Shelf, warehouse, etc."
                      value={location}
                      onChangeText={setLocation}
                    />
                  </View>
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
                {/* Full Description */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Full Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Detailed description of the product features, benefits, etc."
                    value={fullDescription}
                    onChangeText={setFullDescription}
                    multiline
                    numberOfLines={5}
                  />
                </View>
                
                {/* Dimensions */}
                <Text style={styles.subSectionTitle}>Dimensions</Text>
                
                {/* Weight */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={[styles.input, errors.weight && styles.inputError]}
                    placeholder="0.00"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                  />
                  {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
                </View>
                
                {/* Length, Width, Height row */}
                <View style={styles.threeColumnRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Length (cm)</Text>
                    <TextInput
                      style={[styles.input, errors.length && styles.inputError]}
                      placeholder="0"
                      value={length}
                      onChangeText={setLength}
                      keyboardType="decimal-pad"
                    />
                    {errors.length && <Text style={styles.errorText}>{errors.length}</Text>}
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Width (cm)</Text>
                    <TextInput
                      style={[styles.input, errors.width && styles.inputError]}
                      placeholder="0"
                      value={width}
                      onChangeText={setWidth}
                      keyboardType="decimal-pad"
                    />
                    {errors.width && <Text style={styles.errorText}>{errors.width}</Text>}
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Height (cm)</Text>
                    <TextInput
                      style={[styles.input, errors.height && styles.inputError]}
                      placeholder="0"
                      value={height}
                      onChangeText={setHeight}
                      keyboardType="decimal-pad"
                    />
                    {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
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
                {/* Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Add any additional notes for internal reference"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                  />
                </View>
                
                {/* Tags */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Tags</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter tags separated by commas"
                    value={tags}
                    onChangeText={setTags}
                  />
                  <Text style={styles.helperText}>
                    Tags help with organization and searching
                  </Text>
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
                  <Text style={styles.saveButtonText}>Save Product</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveAndNewButton, isLoading && styles.disabledButton]}
              onPress={handleSaveAndAddAnother}
              disabled={isLoading}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Save & Add Another</Text>
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
  disabledButton: {
    opacity: 0.5,
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
  sectionContent: {
    padding: 16,
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
  saveAndNewButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.status.pending,
    paddingVertical: 14,
    borderRadius: 8,
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
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: Colors.negative,
  },
  input: {
    backgroundColor: Colors.background.tertiary,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  twoColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  threeColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithButtonText: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  inputActionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  inputWithIcon: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  inputWithIconText: {
    paddingLeft: 36,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 12,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.negative,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
  addImageText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 8,
  },
  profitMarginContainer: {
    height: 36,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  profitMarginBar: {
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  profitMarginText: {
    color: '#fff',
    fontWeight: '600',
  },
});