import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function AddressLotInfoScreen() {
  const route = useRoute();
  const params: any = route.params ?? {};
  const addressLotList = params.addressLotList ?? [];
  const depoAciklamasi = params.depoAciklamasi ?? "";
  const urunAciklamasi = params.urunAciklamasi ?? "";

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Depo:</Text>
        <Text style={styles.value}>{depoAciklamasi}</Text>
        <Text style={styles.label}>Ürün:</Text>
        <Text style={styles.value}>{urunAciklamasi}</Text>
      </View>

      {addressLotList.map((item: any, index: number) => (
        <View key={index} style={styles.card}>
          <Text style={styles.lot}>Lot No: {item.lotNo}</Text>
          <Text style={styles.adres}>{item.aciklamasi}</Text>
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
  header: {
    backgroundColor: '#ea5a21',
    padding: 16,
    borderRadius: 6,
    marginBottom: 10,
  },
  label: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: 'white',
    marginBottom: 10,
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
