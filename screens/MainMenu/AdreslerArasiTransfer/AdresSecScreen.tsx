import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

export default function AdresSecScreen({ route, navigation }: any) {
  const { urun, selectedDepo, user, adresListesi ,barcode} = route.params;

  const handleSelect = (adres: any) => {
    navigation.navigate('MiktarGir', {
      selectedDepo,
      barcode,
      user,
      urun,
      secilenAdres: adres,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adres Seçiniz</Text>

      <FlatList
        data={adresListesi}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
            <Text style={styles.adresText}>{item.adresAciklamasi}</Text>
            <Text>Miktar: {item.miktar}</Text>
            <Text>Barkod: {item.adresBarkodu}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#ea5a21' },
  item: {
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 6,
    marginBottom: 12,
  },
  adresText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
});
