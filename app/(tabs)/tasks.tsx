import React, { useState, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ShoppingCart, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight,
  Plus,
  CreditCard,
  ClipboardList,
  Receipt,
  RotateCcw,
  ArrowDown,
  ArrowUp,
  FileText,
  DollarSign,
  Settings
} from "lucide-react-native";

import Colors from "@/constants/colors";

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 48 = padding (16) * 2 + gap between cards (16)

// Task Card Component
interface TaskCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
}

const TaskCard = ({ title, description, icon, onPress }: TaskCardProps) => {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Section Header Component
interface SectionHeaderProps {
  title: string;
}

const SectionHeader = ({ title }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

// FAB Menu Item Component
interface FabMenuItemProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  backgroundColor: string;
  onPress: () => void;
}

const FabMenuItem = ({ icon, label, backgroundColor, onPress }: FabMenuItemProps) => {
  const IconComponent = icon;
  return (
    <TouchableOpacity 
      style={[styles.fabMenuItem, { backgroundColor }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.fabMenuItemIcon}>
        <IconComponent size={20} color="#fff" />
      </View>
      <Text style={styles.fabMenuItemLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fabOpen, setFabOpen] = useState(false);
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const navigateToScreen = (screenPath: string) => {
    router.push(screenPath as any);
  };

  const navigateToSettings = () => {
    router.push("/settings");
  };

  const toggleFab = () => {
    if (fabOpen) {
      // Close the FAB menu
      Animated.parallel([
        Animated.timing(scaleAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => setFabOpen(false), 200);
    } else {
      // Open the FAB menu
      setFabOpen(true);
      Animated.parallel([
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleActionPress = (action: string) => {
    toggleFab();
    // Navigate to appropriate screen based on action
    switch(action) {
      case 'add-sales':
        router.push("/sales/new");
        break;
      case 'add-purchase':
        router.push("/purchases/new");
        break;
      case 'add-income':
        router.push("/income/new");
        break;
      case 'add-expense':
        router.push("/expenses/new");
        break;
    }
  };

  return (
    <View style={[
      styles.container,
      {
        paddingTop: insets.top,
        paddingBottom: insets.bottom
      }
    ]}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tasks</Text>
          <Text style={styles.headerSubtitle}>Manage your business transactions</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={navigateToSettings}
          activeOpacity={0.7}
        >
          <Settings size={22} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sales Transaction Section */}
        <SectionHeader title="Sales Transaction" />
        <View style={styles.cardsContainer}>
          <TaskCard 
            title="Payment In"
            description="Record incoming payments from customers"
            icon={<ArrowDown size={22} color={Colors.primary} />}
            onPress={() => navigateToScreen("/payment-in/payment-in")}
          />
          <TaskCard 
            title="Sales Order"
            description="Create and manage sales orders"
            icon={<ClipboardList size={22} color={Colors.primary} />}
            onPress={() => navigateToScreen("/sales-order/sales-order")}
          />
          <TaskCard 
            title="Sales Invoice"
            description="Generate and send invoices to customers"
            icon={<Receipt size={22} color={Colors.primary} />}
            onPress={() => navigateToScreen("/sales-invoice/sales-invoice")}
          />
          <TaskCard 
            title="Sales Return"
            description="Process and track customer returns"
            icon={<RotateCcw size={22} color={Colors.primary} />}
            onPress={() => navigateToScreen("/sales-return/sales-return")}
          />
        </View>
        
        {/* Purchase Transaction Section */}
        <SectionHeader title="Purchase Transaction" />
        <View style={styles.cardsContainer}>
          <TaskCard 
            title="Payment Out"
            description="Record outgoing payments to vendors"
            icon={<ArrowUp size={22} color={Colors.primary} />}
            onPress={() => navigateToScreen("/payment-out/payment-out")}
          />
          <TaskCard 
            title="Purchase Return"
            description="Process returns to suppliers"
            icon={<RotateCcw size={22} color={Colors.primary} />}
            onPress={() => navigateToScreen("/purchase-return/purchase-return")}
          />
          <TaskCard 
            title="Purchase Invoice"
            description="Manage vendor invoices and bills"
            icon={<FileText size={22} color={Colors.primary} />}
            onPress={() => navigateToScreen("/purchase-invoice/purchase-invoice")}
          />
          <TaskCard 
            title="Purchase Order"
            description="Create and track purchase orders"
            icon={<ShoppingCart size={22} color={Colors.primary} />}
            onPress={() => navigateToScreen("/purchase-order/purchase-order")}
          />
        </View>
        
        {/* Other Transaction Section */}
        <SectionHeader title="Other Transaction" />
        <View style={styles.cardsContainer}>
          <TaskCard 
            title="Income"
            description="Record additional business income"
            icon={<TrendingUp size={22} color={Colors.primary} />}
            onPress={() => navigateToScreen("/income/income")}
          />
          <TaskCard 
            title="Expenses"
            description="Track business expenses and costs"
            icon={<ArrowDownLeft size={22} color={Colors.primary} />}
            onPress={() => navigateToScreen("/expenses/expenses")}
          />
        </View>
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={toggleFab}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>
      
      {/* FAB Menu */}
      {fabOpen && (
        <TouchableWithoutFeedback onPress={toggleFab}>
          <Animated.View 
            style={[
              styles.fabBackdrop,
              {
                opacity: backdropOpacity,
              }
            ]}
          >
            <Animated.View 
              style={[
                styles.fabMenu,
                {
                  transform: [{ scale: scaleAnimation }],
                  bottom: 80 + insets.bottom,
                }
              ]}
            >
              <FabMenuItem 
                icon={ArrowUpRight}
                label="Add Sale"
                backgroundColor="#4285F4"
                onPress={() => handleActionPress('add-sales')}
              />
              <FabMenuItem 
                icon={ShoppingCart}
                label="Add Purchase"
                backgroundColor="#34A853"
                onPress={() => handleActionPress('add-purchase')}
              />
              <FabMenuItem 
                icon={TrendingUp}
                label="Add Income"
                backgroundColor="#FBBC05"
                onPress={() => handleActionPress('add-income')}
              />
              <FabMenuItem 
                icon={ArrowDownLeft}
                label="Add Expense"
                backgroundColor="#EA4335"
                onPress={() => handleActionPress('add-expense')}
              />
            </Animated.View>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background.default,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#777",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: cardWidth,
    height: 140,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`, // Light green border
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}10`, // Light green background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 12,
    color: "#777",
    lineHeight: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
  fabBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 998,
  },
  fabMenu: {
    position: 'absolute',
    right: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  fabMenuItemIcon: {
    marginRight: 12,
  },
  fabMenuItemLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});