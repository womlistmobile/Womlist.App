import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function SarfEkBilgilerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { selectedItems, fisId, depoId, userId, girisCikisTuru } = route.params;

  const [kod, setKod] = useState('');
  const [date] = useState(new Date().toLocaleDateString('tr-TR').replace(/\./g, '-'));

  const handleGonder = async () => {
    if (!kod) {
      Alert.alert('Hata', 'Lütfen kod giriniz.');
      return;
    }

    const requestBody = {
      kod,
      tarih: date,
      beyannameKod: '',
      beyannameTarih: '',
      stokFisTuru: 5,
      kaynakDepoId: depoId.toUpperCase?.() || '',
      kullaniciTerminalId: userId.toUpperCase?.() || '',
      destinasyonDepoId: '',
      satirlar: selectedItems.map((item: any) => ({
        depoId: item.depoId || depoId,
        adresId: '',
        stokId: '',
        sayimHareketId: '',
        sabitFisHareketleriId: item.satirId?.toUpperCase?.() || '',
        transferHareketId: '',
        malzemeTemelBilgiId: item.malzemeId?.toUpperCase?.() || '',
        kullaniciTerminalId: userId.toUpperCase?.() || '',
        birimId: item.birimId?.toUpperCase?.() || '',
        carpan1: item.carpan1 || 1,
        carpan2: item.carpan2 || 1,
        lotNo: '',
        miktar: item.okutulanMiktar,
        girisCikisTuru,
      })),
    };

    try {
      const response = await fetch('https://apicloud.womlistapi.com/api/Stok/StokHareketEkle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const rawText = await response.text();
      const result = JSON.parse(rawText);

      if (result.durum) {
        Alert.alert('✅ Başarılı', result.message || 'Veriler başarıyla gönderildi.', [
          { text: 'Tamam', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('❌ Hata', result.message || 'Gönderme başarısız.');
      }
    } catch (error: any) {
      Alert.alert('❌ Hata', 'Sunucu hatası: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>GÜNCEL TARİH</Text>
      <TouchableOpacity style={styles.dateButton}>
        <Text style={styles.dateText}>{date}</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="KOD"
        value={kod}
        onChangeText={setKod}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleGonder}>
        <Text style={styles.buttonText}>➤ VERİLERİ GÖNDER</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3edea', padding: 20 },
  label: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  dateButton: {
    backgroundColor: '#ea5a21',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ea5a21',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
