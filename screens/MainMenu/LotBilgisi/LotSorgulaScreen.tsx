import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQr } from '../../DashBoard/QrContext';

export default function LotSorgulaScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params = route.params ?? {};

  const [lotNo, setLotNo] = useState('');
  const [result, setResult] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { scannedValue, setScannedValue } = useQr();

  const lotListesi = params.lotListesi ?? [];
  const depoAciklamasi = params.depoAciklamasi ?? '';
  const urunAciklamasi = params.urunAciklamasi ?? '';

  useEffect(() => {
    if (lotListesi.length > 0) {
      setResult(lotListesi);
    }
  }, [lotListesi]);

  useFocusEffect(
    React.useCallback(() => {
      if (scannedValue) {
        setLotNo(scannedValue);
        setScannedValue('');
      }
    }, [scannedValue])
  );

  const handleSearch = async () => {
    if (!lotNo) return;
    try {
      setLoading(true);
      const response = await fetch(
        `https://apicloud.womlistapi.com/api/EnvanterSorgulama/LotSorgula?lotNo=${lotNo}`
      );
      const json = await response.json();
      setResult(json);
    } catch (error) {
      console.error('Lot sorgulama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <TouchableOpacity
        onPress={() => navigation.navigate('QrScanner')}
        style={styles.qrButton}
      >
        <MaterialCommunityIcons name="qrcode-scan" size={140} color="#ea5a21" />
      </TouchableOpacity>

      <Text style={styles.title}>Ürün Barkodu / Lot Okutunuz</Text>

      <TextInput
        placeholder="Ürün Barkodu Giriniz"
        style={styles.input}
        value={lotNo}
        onChangeText={setLotNo}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>🔍 ARA</Text>
      </TouchableOpacity>

      {loading && (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Yükleniyor...</Text>
      )}

      {result.map((item, index) => (
        <View key={index} style={styles.resultBox}>
          {depoAciklamasi !== '' && urunAciklamasi !== '' && (
            <>
              <View style={styles.row}>
                <Text style={styles.bold}>Depo:</Text>
                <Text>{depoAciklamasi}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.bold}>Ürün:</Text>
                <Text>{urunAciklamasi}</Text>
              </View>
            </>
          )}

          {item.depo && (
            <View style={styles.row}>
              <Text style={styles.bold}>Depo:</Text>
              <Text>{item.depo}</Text>
            </View>
          )}
          {item.urunKodu && (
            <View style={styles.row}>
              <Text style={styles.bold}>Ürün Kodu:</Text>
              <Text>{item.urunKodu}</Text>
            </View>
          )}
          {item.urunAciklamasi && (
            <View style={styles.row}>
              <Text style={styles.bold}>Ürün Açıklaması:</Text>
              <Text>{item.urunAciklamasi}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.bold}>Lot No:</Text>
            <Text>{item.lotNo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>Miktar:</Text>
            <Text>
              {item.miktar} {item.birim ?? ''}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f3edea',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButton: {
    backgroundColor: '#fff',
    borderRadius: 100,
    padding: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  button: {
    width: '100%',
    backgroundColor: '#ea5a21',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultBox: {
    width: '100%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    marginRight: 5,
  },
});
