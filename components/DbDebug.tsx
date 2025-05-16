import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';

export default function DbDebug() {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use SQLite context
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });

  // Fetch data from the database
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all users
      const usersData = await db.select().from(schema.users).all();
      setUsers(usersData);
      
      // Get all companies
      const companiesData = await db.select().from(schema.companies).all();
      setCompanies(companiesData);
    } catch (err) {
      console.error('Database error:', err);
      setError(`Database error: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Database Debug</Text>
        <Text style={styles.loading}>Loading database data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Database Debug</Text>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={fetchData}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Database Debug</Text>
      
      <TouchableOpacity style={styles.button} onPress={fetchData}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.sectionTitle}>Users ({users.length})</Text>
        {users.length === 0 ? (
          <Text style={styles.empty}>No users found</Text>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.item}>
              <Text style={styles.itemTitle}>{user.name}</Text>
              <Text style={styles.itemSubtitle}>{user.email}</Text>
              <Text style={styles.itemDetail}>ID: {user.id}</Text>
            </View>
          ))
        )}
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Companies ({companies.length})</Text>
        {companies.length === 0 ? (
          <Text style={styles.empty}>No companies found</Text>
        ) : (
          companies.map((company) => (
            <View key={company.id} style={styles.item}>
              <Text style={styles.itemTitle}>{company.name}</Text>
              <Text style={styles.itemSubtitle}>User ID: {company.userId}</Text>
              <Text style={styles.itemDetail}>ID: {company.id}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
  },
  item: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  loading: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    fontSize: 14,
    color: 'red',
    marginBottom: 16,
  },
  empty: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
}); 