import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function LotResultScreen({ route }: any) {
  const { lotlar, barcode } = route.params;

  const filtered = lotlar.filter((lot: any) =>
    lot.lotNo.toLowerCase().includes(barcode.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      {filtered.map((lot: any, index: number) => (
        <View key={index} style={styles.card}>
          <Text style={styles.text}><Text style={styles.bold}>Lot No:</Text> {lot.lotNo}</Text>
          <Text style={styles.text}><Text style={styles.bold}>Miktar:</Text> {lot.miktar}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3edea', padding: 10 },
  card: { backgroundColor: 'white', borderRadius: 8, padding: 12, marginBottom: 10 },
  text: { fontSize: 16 },
  bold: { fontWeight: 'bold' },
});
