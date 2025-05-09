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
  Platform
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Camera, 
  X, 
  ChevronDown, 
  ChevronUp,
  Barcode,
  Plus
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import Colors from "@/constants/colors";
import { Product, StockStatus } from "@/types/product";
import SnackBar from "@/components/SnackBar";
import { addProduct } from "@/utils/asyncStorageUtils";

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
      
      if (stockQty === 0) {
        status = "out_of_stock";
      } else if (stockQty < reorderLvl) {
        status = "low_stock";
      } else {
        status = "in_stock";
      }
      
      // Create new product object
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: productName,
        sku,
        barcode: barcode || undefined,
        description: fullDescription || shortDescription || undefined,
        category: category || undefined,
        tags: tags ? tags.split(",").map(tag => tag.trim()) : undefined,
        purchasePrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        stockQuantity: parseInt(stockQuantity),
        reorderLevel: parseInt(reorderLevel),
        unit,
        taxRate: taxRate ? parseFloat(taxRate) : undefined,
        images: images.length > 0 ? images : undefined,
        vendor: vendor || undefined,
        location: location || undefined,
        dimensions: (length || width || height || weight) ? {
          length: length ? parseFloat(length) : undefined,
          width: width ? parseFloat(width) : undefined,
          height: height ? parseFloat(height) : undefined,
          weight: weight ? parseFloat(weight) : undefined,
        } : undefined,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: notes || undefined,
      };
      
      // Save product to AsyncStorage
      await addProduct(newProduct);
      
      // Show success message
      setSnackbarMessage("Product saved successfully");
      setSnackbarVisible(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("Error saving product:", error);
      setSnackbarMessage("Failed to save product. Please try again.");
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveAndAddAnother = async () => {
    if (!validateForm()) {
      // Show error message
      setSnackbarMessage("Please fix the errors in the form");
      setSnackbarVisible(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Determine stock status based on quantity and reorder level
      let status: StockStatus;
      const stockQty = parseInt(stockQuantity);
      const reorderLvl = parseInt(reorderLevel);
      
      if (stockQty === 0) {
        status = "out_of_stock";
      } else if (stockQty < reorderLvl) {
        status = "low_stock";
      } else {
        status = "in_stock";
      }
      
      // Create new product object
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: productName,
        sku,
        barcode: barcode || undefined,
        description: fullDescription || shortDescription || undefined,
        category: category || undefined,
        tags: tags ? tags.split(",").map(tag => tag.trim()) : undefined,
        purchasePrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        stockQuantity: parseInt(stockQuantity),
        reorderLevel: parseInt(reorderLevel),
        unit,
        taxRate: taxRate ? parseFloat(taxRate) : undefined,
        images: images.length > 0 ? images : undefined,
        vendor: vendor || undefined,
        location: location || undefined,
        dimensions: (length || width || height || weight) ? {
          length: length ? parseFloat(length) : undefined,
          width: width ? parseFloat(width) : undefined,
          height: height ? parseFloat(height) : undefined,
          weight: weight ? parseFloat(weight) : undefined,
        } : undefined,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: notes || undefined,
      };
      
      // Save product to AsyncStorage
      await addProduct(newProduct);
      
      // Show success message
      setSnackbarMessage("Product saved successfully");
      setSnackbarVisible(true);
      
      // Clear form for next product
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
      
      // Reset errors
      setErrors({});
      
      // Scroll to top
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error) {
      console.error("Error saving product:", error);
      setSnackbarMessage("Failed to save product. Please try again.");
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
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
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: "Add Product",
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
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Basic Information Section */}
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setBasicInfoExpanded(!basicInfoExpanded)}
          >
            <Text style={styles.sectionTitle}>Basic Information</Text>
            {basicInfoExpanded ? (
              <ChevronUp size={20} color="#333" />
            ) : (
              <ChevronDown size={20} color="#333" />
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
                <View style={styles.inputWithButton}>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.inputWithButtonField,
                      errors.sku && styles.inputError
                    ]}
                    value={sku}
                    onChangeText={setSku}
                    placeholder="Enter SKU"
                  />
                  <TouchableOpacity 
                    style={styles.inputButton}
                    onPress={generateSku}
                  >
                    <Text style={styles.inputButtonText}>Generate</Text>
                  </TouchableOpacity>
                </View>
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
                    {isActive ? "Active" : "Inactive"}
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
          
          {/* Pricing Information Section */}
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setPricingExpanded(!pricingExpanded)}
          >
            <Text style={styles.sectionTitle}>Pricing Information</Text>
            {pricingExpanded ? (
              <ChevronUp size={20} color="#333" />
            ) : (
              <ChevronDown size={20} color="#333" />
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
          
          {/* Inventory Information Section */}
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setInventoryExpanded(!inventoryExpanded)}
          >
            <Text style={styles.sectionTitle}>Inventory Information</Text>
            {inventoryExpanded ? (
              <ChevronUp size={20} color="#333" />
            ) : (
              <ChevronDown size={20} color="#333" />
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
          
          {/* Product Details Section */}
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setDetailsExpanded(!detailsExpanded)}
          >
            <Text style={styles.sectionTitle}>Product Details</Text>
            {detailsExpanded ? (
              <ChevronUp size={20} color="#333" />
            ) : (
              <ChevronDown size={20} color="#333" />
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
          
          {/* Additional Information Section */}
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setAdditionalExpanded(!additionalExpanded)}
          >
            <Text style={styles.sectionTitle}>Additional Information</Text>
            {additionalExpanded ? (
              <ChevronUp size={20} color="#333" />
            ) : (
              <ChevronDown size={20} color="#333" />
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
          
          {/* Bottom padding */}
          <View style={{ height: 100 }} />
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveAndAddButton]}
            onPress={handleSaveAndAddAnother}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Plus size={16} color={Colors.primary} />
                <Text style={styles.saveAndAddButtonText}>Save & Add Another</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      <SnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
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
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
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
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  saveAndAddButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.primary,
    flexDirection: "row",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  saveAndAddButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
});