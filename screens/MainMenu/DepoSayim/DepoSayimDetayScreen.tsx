import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function DepoSayimDetayScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { urun, barkod, sayim, selectedDepo, user, adresId } = route.params;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [miktar, setMiktar] = useState('');
  const birimListesi = urun?.birimListesi || [];

  const handleKaydet = async () => {
    if (selectedIndex === null) {
      Alert.alert('Uyarı', 'Lütfen bir satır (birim) seçiniz.');
      return;
    }

    if (!miktar || isNaN(Number(miktar))) {
      Alert.alert('Uyarı', 'Geçerli bir miktar giriniz.');
      return;
    }

    const secilenBirim = birimListesi[selectedIndex];

    const payload = {
      malzemeTemelBilgiId: urun?.malzemeId,
      birimId: secilenBirim?.birimId,
      depoId: selectedDepo?.depoId,
      miktar: Number(miktar),
      lotNo: barkod || '',
      kullaniciTerminalId: user?.id,
      sayimId: sayim?.sayimId,
      adresId: adresId || '',
    };

    console.log('📤 Gönderilecek veri:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(
        'https://apicloud.womlistapi.com/api/Sayim/SayimHareketEkle',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const resultText = await response.text();
      const result = JSON.parse(resultText);

      if (result?.durum) {
        Alert.alert('Başarılı', 'Sayım başarıyla kaydedildi.', [
          {
            text: 'Tamam',
            onPress: () => navigation.navigate('MainMenu', { user, selectedDepo }),
          },
        ]);
      } else {
        Alert.alert('Hata', result?.message || 'Kayıt başarısız.');
      }
    } catch (err) {
      console.error('❌ Kayıt Hatası:', err);
      Alert.alert('Hata', 'Sunucuya bağlanırken hata oluştu.');
    }
  };

  const renderBirim = ({ item, index }: any) => (
    <TouchableOpacity
      key={item.birimId}
      style={[
        styles.row,
        selectedIndex === index && styles.selectedRow,
      ]}
      onPress={() => setSelectedIndex(index)}
    >
      <Text style={styles.rowText}>
        {item?.aciklama || item?.aciklamasi || 'Birim'} — Çarpan: {item?.carpan1} x {item?.carpan2}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{urun?.aciklama}</Text>

      <FlatList
        data={birimListesi}
        renderItem={renderBirim}
        keyExtractor={(item, index) => index.toString()}
        scrollEnabled={false}
        style={{ marginBottom: 20 }}
      />

      <TextInput
        style={styles.input}
        placeholder="Miktar Giriniz"
        keyboardType="numeric"
        value={miktar}
        onChangeText={setMiktar}
      />

      <TouchableOpacity style={styles.button} onPress={handleKaydet}>
        <Text style={styles.buttonText}>KAYDET</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ea5a21',
    marginBottom: 16,
    textAlign: 'center',
  },
  row: {
    backgroundColor: '#d6eaff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  selectedRow: {
    backgroundColor: '#4fc3f7',
  },
  rowText: {
    fontSize: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#ea5a21',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
 