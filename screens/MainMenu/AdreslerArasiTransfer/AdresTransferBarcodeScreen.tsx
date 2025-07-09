import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQr } from '../../DashBoard/QrContext';

export default function AdresTransferBarcodeScreen({ route }: any) {
  const { selectedDepo, user } = route.params;
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<any>();
  const { scannedValue, setScannedValue } = useQr();

  useFocusEffect(
    React.useCallback(() => {
      if (scannedValue) {
        setBarcode(scannedValue);
        setScannedValue('');
      }
    }, [scannedValue])
  );

  useEffect(() => {
    if (!selectedDepo?.adresliMi) {
      Alert.alert(
        'Adresli Olmayan Depo',
        'Bu depo adresli değildir. Adresler Arası Transfer işlemi yapılamaz.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!barcode.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir barkod girin.');
      return;
    }

    const depoId = selectedDepo?.depoId;
    if (!depoId) {
      Alert.alert('Hata', 'Depo ID bulunamadı.');
      return;
    }

    setLoading(true);

    try {
      const malzemeUrl = `https://apicloud.womlistapi.com/api/Malzeme/${depoId}/${barcode}/2`;
      const malzemeRes = await fetch(malzemeUrl);
      const malzemeText = await malzemeRes.text();

      if (!malzemeText.trim()) {
        Alert.alert('Hata', 'Malzeme bilgisi alınamadı.');
        return;
      }

      let malzemeData;
      try {
        malzemeData = JSON.parse(malzemeText);
      } catch {
        Alert.alert('Hata', 'Geçersiz malzeme verisi.');
        return;
      }

      const malzemeId = malzemeData?.malzemeId;
      const lotluMu = malzemeData?.lotluMu;
      const correctedBarcode = lotluMu ? barcode : '';
      const lotNo = lotluMu ? barcode : '';

      if (!malzemeId) {
        Alert.alert('Hata', 'Malzeme ID alınamadı.');
        return;
      }

      const adresUrl = `https://apicloud.womlistapi.com/api/Adres/AdresMiktarlariGetir?depoId=${depoId}&malzemeId=${malzemeId}&lotNo=${lotNo}`;
      const adresRes = await fetch(adresUrl);
      const adresText = await adresRes.text();

      if (!adresText.trim()) {
        Alert.alert('Hata', 'Adres bilgisi alınamadı.');
        return;
      }

      let adresData;
      try {
        adresData = JSON.parse(adresText);
      } catch {
        Alert.alert('Hata', 'Adres verisi çözümlenemedi.');
        return;
      }

      if (!Array.isArray(adresData) || adresData.length === 0) {
        Alert.alert('Bilgi', 'Bu ürüne ait adres bulunamadı.');
        return;
      }

      navigation.navigate('AdresSec', {
        selectedDepo,
        user,
        barcode: correctedBarcode,
        urun: malzemeData,
        adresListesi: adresData,
      });

    } catch (err) {
      console.error('❌ API Hatası:', err);
      Alert.alert('Sunucu Hatası', 'İşlem sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Ürün Okutunuz</Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('QrScanner')}
        style={styles.qrButton}
      >
        <MaterialCommunityIcons name="qrcode-scan" size={120} color="#ea5a21" />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Ürün Barkodu / Lot Okutunuz"
        value={barcode}
        onChangeText={setBarcode}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleSearch}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>ARA</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#ea5a21',
    textAlign: 'center',
  },
  qrButton: {
    backgroundColor: '#fff',
    borderRadius: 100,
    padding: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#ea5a21',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
