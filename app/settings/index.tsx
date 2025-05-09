import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  Platform,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronRight, 
  DollarSign, 
  User as UserIcon, 
  Users, 
  LogOut,
  ArrowDownCircle,
  ArrowUpCircle,
  Settings as SettingsIcon,
  Bell,
  Moon,
  Shield,
  ChevronDown,
  UserCog,
  Wallet,
  PieChart,
  Layers,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import { getUser } from '@/utils/userStorageUtils';

const { width } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Function to create a linear gradient style (as React Native doesn't have built-in gradients)
const createGradientStyle = (startColor, endColor, angle = '180deg') => ({
  backgroundColor: startColor,
  position: 'relative',
  overflow: 'hidden',
});

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user: authUser, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user data from AsyncStorage if not already in auth store
        if (!authUser) {
          const userData = await getUser();
          updateUser(userData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
        
        // Start animations when data is loaded
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    loadUserData();
  }, [authUser, updateUser, fadeAnim, slideAnim]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const navigateTo = (screen: string) => {
    router.push(screen as any);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    description: string,
    screenPath: string,
    index: number
  ) => {
    const itemAnimStyle = {
      opacity: fadeAnim,
      transform: [{ 
        translateY: Animated.multiply(
          slideAnim, 
          new Animated.Value((index * 0.3) + 1)
        ) 
      }],
    };
    
    return (
      <AnimatedTouchable 
        style={[styles.settingsItem, itemAnimStyle]}
        onPress={() => navigateTo(screenPath)}
        activeOpacity={0.7}
      >
        <View style={styles.settingsItemIconContainer}>
          <View style={styles.settingsItemIcon}>
            {icon}
          </View>
        </View>
        <View style={styles.settingsItemContent}>
          <Text style={styles.settingsItemTitle}>{title}</Text>
          <Text style={styles.settingsItemDescription}>{description}</Text>
        </View>
        <View style={styles.settingsItemArrow}>
          <ChevronRight size={18} color={Colors.primary} />
        </View>
      </AnimatedTouchable>
    );
  };

  const renderCategorySection = (
    title: string, 
    icon: React.ReactNode, 
    items: Array<{
      icon: React.ReactNode,
      title: string,
      description: string,
      screenPath: string
    }>,
    index: number,
    sectionKey: string
  ) => {
    const isExpanded = expandedSection === sectionKey;
    const containerAnimStyle = {
      opacity: fadeAnim,
      transform: [{ 
        translateY: Animated.multiply(
          slideAnim, 
          new Animated.Value((index * 0.2) + 1)
        ) 
      }],
    };

    return (
      <Animated.View style={[styles.categorySection, containerAnimStyle]}>
        <TouchableOpacity 
          style={styles.categorySectionHeader}
          onPress={() => toggleSection(sectionKey)}
          activeOpacity={0.7}
        >
          <View style={styles.categorySectionTitleContainer}>
            <View style={styles.categorySectionIcon}>
              {icon}
            </View>
            <Text style={styles.categorySectionTitle}>{title}</Text>
          </View>
          <Animated.View style={{
            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }]
          }}>
            <ChevronDown size={20} color="#333" />
          </Animated.View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.categorySectionContent}>
            {items.map((item, itemIndex) => (
              <TouchableOpacity 
                key={itemIndex}
                style={styles.sectionItem}
                onPress={() => navigateTo(item.screenPath)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionItemIconContainer}>
                  <View style={styles.sectionItemIcon}>
                    {item.icon}
                  </View>
                </View>
                <View style={styles.sectionItemContent}>
                  <Text style={styles.sectionItemTitle}>{item.title}</Text>
                  <Text style={styles.sectionItemDescription}>{item.description}</Text>
                </View>
                <ChevronRight size={18} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.userProfile, { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}>
          <View style={styles.userAvatarContainer}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{authUser?.name?.[0] || 'U'}</Text>
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{authUser?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{authUser?.email || 'user@example.com'}</Text>
          </View>
          <TouchableOpacity style={styles.editProfileButton} onPress={() => navigateTo('/settings/profile')}>
            <Text style={styles.editProfileButtonText}>Edit</Text>
          </TouchableOpacity>
        </Animated.View>

        {renderCategorySection(
          "Account",
          <UserCog size={20} color="#fff" />,
          [
            { 
              icon: <UserIcon size={20} color={Colors.primary} />,
              title: "Account Settings",
              description: "Manage your account information",
              screenPath: "/settings/account-settings"
            },
            { 
              icon: <DollarSign size={20} color={Colors.primary} />,
              title: "Currency Settings",
              description: "Change your preferred currency",
              screenPath: "/settings/currency-settings"
            },
            { 
              icon: <Users size={20} color={Colors.primary} />,
              title: "Account Groups",
              description: "Manage account groups",
              screenPath: "/settings/account-group-settings"
            }
          ],
          0,
          "account"
        )}

        {renderCategorySection(
          "Categories",
          <Layers size={20} color="#fff" />,
          [
            { 
              icon: <ArrowDownCircle size={20} color={Colors.primary} />,
              title: "Income Categories",
              description: "Manage income categories",
              screenPath: "/settings/income-category-settings"
            },
            { 
              icon: <ArrowUpCircle size={20} color={Colors.primary} />,
              title: "Expense Categories",
              description: "Manage expense categories",
              screenPath: "/settings/expense-category-settings"
            }
          ],
          1,
          "categories"
        )}

        {renderCategorySection(
          "Preferences",
          <PieChart size={20} color="#fff" />,
          [
            { 
              icon: <Bell size={20} color={Colors.primary} />,
              title: "Notifications",
              description: "Configure app notifications",
              screenPath: "/settings/notifications"
            },
            { 
              icon: <Moon size={20} color={Colors.primary} />,
              title: "Theme Settings",
              description: "Change app appearance",
              screenPath: "/settings/theme"
            },
            { 
              icon: <Shield size={20} color={Colors.primary} />,
              title: "Privacy & Security",
              description: "Manage security preferences",
              screenPath: "/settings/privacy"
            }
          ],
          2,
          "preferences"
        )}
        
        <Animated.View style={[{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>InvoiceHub v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  userAvatarContainer: {
    marginRight: 16,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  editProfileButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editProfileButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  categorySection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categorySectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categorySectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categorySectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  categorySectionContent: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionItemIconContainer: {
    marginRight: 14,
  },
  sectionItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionItemContent: {
    flex: 1,
  },
  sectionItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  sectionItemDescription: {
    fontSize: 13,
    color: '#888',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsItemIconContainer: {
    marginRight: 14,
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingsItemDescription: {
    fontSize: 13,
    color: '#888',
  },
  settingsItemArrow: {
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4757',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#ff4757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#888',
  },
}); 