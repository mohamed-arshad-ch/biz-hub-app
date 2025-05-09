import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface CheckBoxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
}

export default function CheckBox({ checked, onToggle, label }: CheckBoxProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[
        styles.checkbox,
        checked ? styles.checked : styles.unchecked
      ]}>
        {checked && <Check size={14} color="#fff" />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checked: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
  },
  unchecked: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
});