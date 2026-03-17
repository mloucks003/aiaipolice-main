/**
 * VehicleCard - Display vehicle search results
 */

import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {VehicleRecord} from '../types/results';

interface VehicleCardProps {
  vehicle: VehicleRecord;
}

const VehicleCard: React.FC<VehicleCardProps> = ({vehicle}) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.plate}>
          {vehicle.plate_number} ({vehicle.state})
        </Text>
        {vehicle.year && vehicle.make && vehicle.model && (
          <Text style={styles.vehicle}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
        )}
      </View>

      {vehicle.color && (
        <View style={styles.section}>
          <Text style={styles.label}>Color:</Text>
          <Text style={styles.value}>{vehicle.color}</Text>
        </View>
      )}

      {vehicle.registered_owner && (
        <View style={styles.section}>
          <Text style={styles.label}>Registered Owner:</Text>
          <Text style={styles.value}>{vehicle.registered_owner}</Text>
        </View>
      )}

      {vehicle.registration_status && (
        <View style={styles.section}>
          <Text style={styles.label}>Registration Status:</Text>
          <Text style={[
            styles.value,
            vehicle.registration_status.toLowerCase() === 'expired' && styles.expired
          ]}>
            {vehicle.registration_status}
          </Text>
        </View>
      )}

      {vehicle.flags && vehicle.flags.length > 0 && vehicle.flags[0] !== 'None' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Flags</Text>
          {vehicle.flags.map((flag, index) => (
            <View key={index} style={styles.flagCard}>
              <Text style={styles.flagText}>{flag}</Text>
            </View>
          ))}
        </View>
      )}

      {(!vehicle.flags || vehicle.flags.length === 0 || vehicle.flags[0] === 'None') && (
        <View style={styles.section}>
          <Text style={styles.noFlags}>✓ No flags on record</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  plate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vehicle: {
    fontSize: 18,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  expired: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  flagCard: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  flagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
  },
  noFlags: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default VehicleCard;
