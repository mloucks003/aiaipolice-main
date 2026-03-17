/**
 * PersonCard - Display person search results
 */

import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {PersonRecord} from '../types/results';

interface PersonCardProps {
  person: PersonRecord;
}

const PersonCard: React.FC<PersonCardProps> = ({person}) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>
          {person.first_name} {person.last_name}
        </Text>
        <Text style={styles.dob}>DOB: {person.dob}</Text>
      </View>

      {person.drivers_license && (
        <View style={styles.section}>
          <Text style={styles.label}>Driver's License:</Text>
          <Text style={styles.value}>{person.drivers_license}</Text>
        </View>
      )}

      {person.address && (
        <View style={styles.section}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{person.address}</Text>
        </View>
      )}

      {person.phone && (
        <View style={styles.section}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{person.phone}</Text>
        </View>
      )}

      {person.warrants && person.warrants.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Active Warrants</Text>
          {person.warrants.map((warrant, index) => (
            <View key={warrant.id || index} style={styles.warrantCard}>
              <Text style={styles.warrantType}>{warrant.type}</Text>
              <Text style={styles.warrantDesc}>{warrant.description}</Text>
              <Text style={styles.warrantInfo}>
                Issued: {warrant.issue_date} | {warrant.jurisdiction}
              </Text>
            </View>
          ))}
        </View>
      )}

      {person.priors && person.priors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prior Offenses</Text>
          {person.priors.map((prior, index) => (
            <View key={prior.id || index} style={styles.priorCard}>
              <Text style={styles.priorOffense}>{prior.offense}</Text>
              <Text style={styles.priorInfo}>
                {prior.date} - {prior.disposition}
              </Text>
            </View>
          ))}
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
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dob: {
    fontSize: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  warrantCard: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  warrantType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 4,
  },
  warrantDesc: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  warrantInfo: {
    fontSize: 12,
    color: '#666',
  },
  priorCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  priorOffense: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  priorInfo: {
    fontSize: 12,
    color: '#666',
  },
});

export default PersonCard;
