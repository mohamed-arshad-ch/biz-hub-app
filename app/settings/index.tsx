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
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Shield,
  UserCog,
  Wallet,
  Building2,
  ArrowLeft,
  CreditCard
} from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import * as FileSystem from 'expo-file-system';
import { setupDatabase } from '@/db/setup';
import { DATABASE_NAME } from '@/db';

import Colors from '@/constants/colors';
import type { User } from '@/db/schema';

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dbActionMessage, setDbActionMessage] = useState<string | null>(null);
  const [dbActionLoading, setDbActionLoading] = useState(false);

  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.select().from(schema.users).limit(1).get();
      setUser(userData ?? null);
    };
    
    loadUser();
  }, []);

  const handleLogout = () => {
    router.replace('/login');
  };

  const navigateTo = (screen: string) => {
    router.push(screen as any);
  };

  // Settings sections
  const accountSettings = [
    {
      icon: <UserIcon size={20} color={Colors.primary} />,
      title: "Profile Settings",
      description: "Manage profile and personal information",
      screenPath: "/settings/edit-profile"
    },
    {
      icon: <SettingsIcon size={20} color={Colors.primary} />,
      title: "Account Settings",
      description: "Manage notifications and preferences",
      screenPath: "/settings/account-settings"
    },
    {
      icon: <Building2 size={20} color={Colors.primary} />,
      title: "Company Settings",
      description: "Manage your company information",
      screenPath: "/settings/manage-company"
    },
    {
      icon: <UserCog size={20} color={Colors.primary} />,
      title: "Account Groups",
      description: "Manage account types and groups",
      screenPath: "/settings/account-group-settings"
    }
  ];

  const financialSettings = [
    {
      icon: <Wallet size={20} color={Colors.primary} />,
      title: "Income Categories",
      description: "Manage income categorization",
      screenPath: "/settings/income-category-settings"
    },
    {
      icon: <ArrowDownCircle size={20} color={Colors.primary} />,
      title: "Expense Categories",
      description: "Manage expense categorization",
      screenPath: "/settings/expense-category-settings"
    },
    {
      icon: <DollarSign size={20} color={Colors.primary} />,
      title: "Currency Settings",
      description: "Configure currency and formats",
      screenPath: "/settings/currency-settings"
    }
  ];

  const systemSettings = [
    {
      icon: <Bell size={20} color={Colors.primary} />,
      title: "Notifications",
      description: "Manage email and app notifications",
      screenPath: "/settings/account-settings"
    },
    {
      icon: <Shield size={20} color={Colors.primary} />,
      title: "Security",
      description: "Passwords and account security",
      screenPath: "/settings/account-settings"
    }
  ];

  // Generic setting item component
  interface SettingItemProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onPress: () => void;
  }
  const SettingItem: React.FC<SettingItemProps> = ({ icon, title, description, onPress }) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIconContainer}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <ChevronRight size={18} color={Colors.text.secondary} />
    </TouchableOpacity>
  );

  // Settings section with heading
  interface SettingsSectionProps {
    title: string;
    items: Array<{
      icon: React.ReactNode;
      title: string;
      description: string;
      screenPath: string;
    }>;
  }
  const SettingsSection: React.FC<SettingsSectionProps> = ({ title, items }) => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <SettingItem
              icon={item.icon}
              title={item.title}
              description={item.description}
              onPress={() => navigateTo(item.screenPath)}
            />
            {index < items.length - 1 && <View style={styles.settingDivider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  // Remove and recreate database (dev only)
  const handleResetDatabase = async () => {
    setDbActionLoading(true);
    setDbActionMessage(null);
    try {
      // Delete the SQLite database file
      const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(dbPath, { idempotent: true });
      }
      // Recreate/setup database
      await setupDatabase();
      setDbActionMessage('Database reset and setup successfully!');
    } catch (err) {
      setDbActionMessage('Error resetting database: ' + ((err as any)?.message || String(err)));
    } finally {
      setDbActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <UserIcon size={28} color={Colors.text.primary} />
                </View>
              )}
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => navigateTo('/settings/edit-profile')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        <SettingsSection title="Account" items={accountSettings} />
        <SettingsSection title="Financial" items={financialSettings} />
        <SettingsSection title="System" items={systemSettings} />

        {/* Dev-only: Remove and recreate database */}
        {__DEV__ && (
          <View style={{ marginVertical: 20 }}>
            <TouchableOpacity
              style={styles.devButton}
              onPress={handleResetDatabase}
              disabled={dbActionLoading}
            >
              <Text style={styles.devButtonText}>
                {dbActionLoading ? 'Resetting Database...' : 'Remove & Recreate Database (DEV ONLY)'}
              </Text>
            </TouchableOpacity>
            {dbActionMessage && (
              <Text style={styles.devMessage}>{dbActionMessage}</Text>
            )}
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={Colors.negative} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        {/* Version Info */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background.tertiary,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  editProfileButton: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  settingsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginLeft: 68,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(234, 67, 53, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    marginVertical: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.negative,
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.text.tertiary,
    marginBottom: 16,
  },
  devButton: {
    backgroundColor: '#e53935',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  devButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  devMessage: {
    color: '#e53935',
    textAlign: 'center',
    marginTop: 6,
    fontSize: 14,
  },
}); 