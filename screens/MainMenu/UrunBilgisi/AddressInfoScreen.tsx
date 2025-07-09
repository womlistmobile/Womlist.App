import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function AddressInfoScreen() {
  const route = useRoute();
  const params: any = route.params ?? {};
  const addressList = params.addressList ?? [];
  const depoAciklamasi = params.depoAciklamasi ?? '';
  const urunAciklamasi = params.urunAciklamasi ?? '';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerText}>
          <Text style={styles.headerLabel}>Depo: </Text>
          <Text style={styles.headerValue}>{depoAciklamasi}</Text>
        </Text>
        <Text style={styles.headerText}>
          <Text style={styles.headerLabel}>Ürün: </Text>
          <Text style={styles.headerValue}>{urunAciklamasi}</Text>
        </Text>
      </View>

      {addressList.map((item: any, index: number) => (
        <View key={index} style={styles.card}>
          <Text style={styles.lot}>Adres Barkodu: <Text style={{ fontWeight: 'bold' }}>{item.barkod}</Text></Text>
          <Text style={styles.adres}>Adres Açıklaması: {item.aciklamasi}</Text>
          <Text style={styles.miktar}>Miktar: {item.miktar}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3edea',
    padding: 16,
  },
  headerBox: {
    backgroundColor: '#ea5a21',
    padding: 16,
    marginBottom: 12,
    borderRadius: 6,
  },
  headerText: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  headerLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerValue: {
    fontSize: 18,
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  lot: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  adres: {
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 4,
  },
  miktar: {
    fontWeight: '600',
    fontSize: 14,
  },
});
