import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQr } from '../../DashBoard/QrContext';

export default function AdresDetayScreen() {
  const [adresBarkodu, setAdresBarkodu] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const { scannedValue, setScannedValue } = useQr();

  useFocusEffect(
    React.useCallback(() => {
      if (scannedValue) {
        setAdresBarkodu(scannedValue);
        setScannedValue('');
      }
    }, [scannedValue])
  );

  const handleSearch = async () => {
    if (!adresBarkodu) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://apicloud.womlistapi.com/api/EnvanterSorgulama/AdresSorgula?adresBarkodu=${adresBarkodu}`
      );
      const json = await response.json();
      setData(json[0]);
    } catch (error) {
      console.error('Adres sorgulama hatası:', error);
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

      <Text style={styles.title}>Adres Barkodu ile Arama</Text>

      <TextInput
        placeholder="Adres Barkodu Giriniz"
        style={styles.input}
        value={adresBarkodu}
        onChangeText={setAdresBarkodu}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>🔍 ARA</Text>
      </TouchableOpacity>

      {loading && <Text style={{ textAlign: 'center', marginTop: 20 }}>Yükleniyor...</Text>}

      {data && (
        <View style={styles.card}>
          <Text style={styles.label}>Adres Barkodu:</Text>
          <Text style={styles.value}>{data.adresBarkodu}</Text>

          <Text style={styles.label}>Adres Açıklaması:</Text>
          <Text style={styles.value}>{data.adresAciklamasi}</Text>

          <Text style={styles.label}>Depo:</Text>
          <Text style={styles.value}>{data.depo}</Text>

          <Text style={styles.label}>Ürün Kodu:</Text>
          <Text style={styles.value}>{data.urunKodu}</Text>

          <Text style={styles.label}>Ürün Açıklaması:</Text>
          <Text style={styles.value}>{data.urunAciklamasi}</Text>

          <Text style={styles.label}>Miktar:</Text>
          <Text style={styles.value}>{data.miktar} {data.birim}</Text>
        </View>
      )}
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
  card: {
    width: '100%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
});
