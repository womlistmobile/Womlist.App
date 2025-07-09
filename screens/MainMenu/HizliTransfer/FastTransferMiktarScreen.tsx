import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function FastTransferMiktarScreen({ route, navigation }: any) {
  const { urun } = route.params;
  const [miktar, setMiktar] = useState('');

  const kaydet = () => {
    const girilen = parseFloat(miktar);
    const mevcut = parseFloat(urun.miktar);

    if (isNaN(girilen)) {
      Alert.alert('Hata', 'Lütfen geçerli bir miktar girin.');
      return;
    }

    if (girilen > mevcut) {
      Alert.alert('Uyarı', `Girilen miktar mevcut miktarı (${mevcut}) aşamaz!`);
    } else {
      Alert.alert('Başarılı', 'Transfer kaydedildi.');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.kodu}>{urun.kodu}</Text>
      <Text style={styles.aciklama}>{urun.aciklama}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.bold}>Adet X 1 - {urun.birim}</Text>
        <Text style={[styles.bold, { color: 'red' }]}>Miktar: {urun.miktar}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Miktar:"
        keyboardType="numeric"
        value={miktar}
        onChangeText={setMiktar}
      />

      <TouchableOpacity style={styles.button} onPress={kaydet}>
        <Text style={styles.buttonText}>KAYDET</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3edea', padding: 16 },
  kodu: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  aciklama: { fontSize: 16, color: '#2980b9', textAlign: 'center', marginBottom: 16 },
  infoBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bold: { fontWeight: 'bold', fontSize: 16 },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ea5a21',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
