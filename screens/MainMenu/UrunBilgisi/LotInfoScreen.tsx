import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useQr } from '../../DashBoard/QrContext'; // ✅ QR context import

export default function LotInfoScreen() {
  const route = useRoute();
  const { lotListesi = [] }: any = route.params || {};

  const { scannedValue, setScannedValue } = useQr(); // ✅ QR hook
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (scannedValue) {
      setSearchText(scannedValue); // ✅ inputa yaz
      setScannedValue('');         // ✅ belleği temizle
    }
  }, [scannedValue]);

  const filteredList = lotListesi.filter((lot: any) =>
    lot.lotNo.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lot</Text>
      <TextInput
        style={styles.search}
        placeholder="🔍 Lot No ile Ara"
        placeholderTextColor="#888"
        value={searchText}
        onChangeText={setSearchText}
      />
      <ScrollView>
        {filteredList.map((lot: any, index: number) => (
          <View key={index} style={styles.card}>
            <Text style={styles.lotText}>Lot No: {lot.lotNo}</Text>
            <Text style={styles.amountText}>Miktar:{lot.miktar}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3edea', padding: 16 },
  header: {
    fontSize: 22,
    color: 'white',
    backgroundColor: '#ea5a21',
    padding: 16,
    fontWeight: 'bold',
  },
  search: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  lotText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  amountText: {
    marginTop: 4,
    textAlign: 'right',
    fontWeight: '600',
  },
});
