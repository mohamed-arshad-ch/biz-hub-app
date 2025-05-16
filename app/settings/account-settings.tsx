import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { 
  ArrowLeft, 
  Bell, 
  Moon, 
  Globe, 
  Shield, 
  Trash2,
  ChevronRight,
  Languages
} from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

import Colors from '@/constants/colors';
import { User } from '@/db/schema';

// Type for user settings
interface UserSettings {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: string;
  language: string;
}

// Toggle setting props
interface ToggleSettingProps {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  description?: string;
}

// Navigation setting props
interface NavigationSettingProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onPress: () => void;
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: true,
    emailNotifications: true,
    pushNotifications: true,
    theme: 'light',
    language: 'en',
  });

  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const user = await db.select().from(schema.users).limit(1).get();
        if (user) {
          setUserData(user);
          setSettings({
            notificationsEnabled: user.notificationsEnabled ?? true,
            emailNotifications: user.emailNotifications ?? true,
            pushNotifications: user.pushNotifications ?? true,
            theme: user.theme || 'light',
            language: user.language || 'en',
          });
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
        Alert.alert('Error', 'Failed to load user settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserSettings();
  }, []);

  const updateSetting = async (setting: keyof UserSettings, value: boolean | string) => {
    if (!userData || !userData.id) return;
    
    try {
      await db.update(schema.users)
        .set({ [setting]: value })
        .where(eq(schema.users.id, userData.id))
        .run();
      
      setSettings(prev => ({
        ...prev,
        [setting]: value
      }));
    } catch (error) {
      console.error(`Failed to update ${setting}:`, error);
      Alert.alert('Error', `Failed to update setting`);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  // Toggle switch component
  const ToggleSetting = ({ label, value, onToggle, description }: ToggleSettingProps) => (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border.dark, true: Colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );

  // Setting item with navigation
  const NavigationSetting = ({ icon, title, description, onPress }: NavigationSettingProps) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIconContainer}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <ChevronRight size={18} color={Colors.text.secondary} />
    </TouchableOpacity>
  );

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
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.sectionCard}>
            <ToggleSetting 
              label="Enable Notifications" 
              value={settings.notificationsEnabled}
              onToggle={(value) => updateSetting('notificationsEnabled', value)}
              description="Receive important alerts and updates"
            />
            <View style={styles.settingDivider} />
            <ToggleSetting 
              label="Email Notifications" 
              value={settings.emailNotifications}
              onToggle={(value) => updateSetting('emailNotifications', value)}
              description="Receive notifications via email"
            />
            <View style={styles.settingDivider} />
            <ToggleSetting 
              label="Push Notifications" 
              value={settings.pushNotifications}
              onToggle={(value) => updateSetting('pushNotifications', value)}
              description="Receive notifications on your device"
            />
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.sectionCard}>
            <NavigationSetting
              icon={<Moon size={20} color={Colors.primary} />}
              title="Theme"
              description={settings.theme === 'light' ? 'Light mode' : 'Dark mode'}
              onPress={() => navigateTo('/settings/theme-settings')}
            />
            <View style={styles.settingDivider} />
            <NavigationSetting
              icon={<Languages size={20} color={Colors.primary} />}
              title="Language"
              description={settings.language === 'en' ? 'English' : settings.language}
              onPress={() => navigateTo('/settings/language-settings')}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.sectionCard}>
            <NavigationSetting
              icon={<Shield size={20} color={Colors.primary} />}
              title="Change Password"
              description="Update your account password"
              onPress={() => navigateTo('/settings/change-password')}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={[styles.sectionCard, styles.dangerCard]}>
            <TouchableOpacity 
              style={styles.dangerButton}
              onPress={() => Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => Alert.alert('Not Implemented', 'Account deletion is not currently implemented.')
                  }
                ]
              )}
              activeOpacity={0.7}
            >
              <Trash2 size={20} color={Colors.negative} />
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
        
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.default,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    fontSize: 14,
    color: Colors.text.secondary,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginLeft: 16,
  },
  dangerCard: {
    borderColor: Colors.negative,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.negative,
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 16,
    marginBottom: 24,
  },
}); 