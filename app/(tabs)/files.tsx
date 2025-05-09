import React from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { 
  Users, 
  Building, 
  Package,
  ChevronRight
} from "lucide-react-native";

import Colors from "@/constants/colors";

const { width } = Dimensions.get('window');

type MenuItemProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
};

const MenuItem = ({ icon, title, description, onPress }: MenuItemProps) => (
  <TouchableOpacity 
    style={styles.card} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.cardContent}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <ChevronRight size={18} color={Colors.primary} />
    </View>
  </TouchableOpacity>
);

export default function FilesScreen() {
  const router = useRouter();

  const navigateToScreen = (screen: string) => {
    router.push(screen as any);
  };

  const menuItems = [
    {
      icon: <Users size={22} color={Colors.primary} />,
      title: "Customers",
      description: "Manage customer profiles and contacts",
      screen: "/customers"
    },
    {
      icon: <Building size={22} color={Colors.primary} />,
      title: "Vendors",
      description: "Manage vendor information and purchases",
      screen: "/vendors"
    },
    {
      icon: <Package size={22} color={Colors.primary} />,
      title: "Products",
      description: "Manage inventory and pricing",
      screen: "/products"
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Hub</Text>
        <Text style={styles.headerSubtitle}>Manage your business in one place</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.cardsContainer}>
          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onPress={() => navigateToScreen(item.screen)}
            />
          ))}
          
          <TouchableOpacity style={styles.addResourceButton} activeOpacity={0.8}>
            <Text style={styles.addResourceText}>Add New Resource</Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#777",
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  cardsContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: "#777",
    lineHeight: 16,
  },
  addResourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
    marginTop: 8,
  },
  addResourceText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
});