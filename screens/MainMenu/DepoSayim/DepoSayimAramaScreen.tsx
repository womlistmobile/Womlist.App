import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQr } from '../../DashBoard/QrContext';

export default function DepoSayimAramaScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { sayim, selectedDepo, user } = route.params;

  const [adresBarkodu, setAdresBarkodu] = useState('');
  const [malzemeBarkodu, setMalzemeBarkodu] = useState('');
  const [adresOnaylandi, setAdresOnaylandi] = useState(!selectedDepo.adresliMi);
  const [adresId, setAdresId] = useState<string | null>(null);

  const { scannedValue, setScannedValue } = useQr();

  useFocusEffect(
    React.useCallback(() => {
      if (scannedValue) {
        if (!adresOnaylandi) {
          setAdresBarkodu(scannedValue);
        } else {
          setMalzemeBarkodu(scannedValue);
        }
        setScannedValue('');
      }
    }, [scannedValue, adresOnaylandi])
  );

  const handleAdresKontrol = async () => {
    if (!adresBarkodu.trim()) {
      Alert.alert('Uyarı', 'Adres barkodu giriniz.');
      return;
    }

    const url = `https://apicloud.womlistapi.com/api/Adres/AdresGetir/${selectedDepo.depoId}/${adresBarkodu}`;
    try {
      const response = await fetch(url);
      const text = await response.text();
      const json = JSON.parse(text);

      if (!json?.adresId || json?.durum === false) {
        Alert.alert('Hata', 'Girilen adres bu depoda bulunamadı.');
        return;
      }

      setAdresId(json.adresId);
      setAdresOnaylandi(true);
    } catch (error) {
      console.error('Adres kontrol hatası:', error);
      Alert.alert('Hata', 'Adres doğrulaması sırasında hata oluştu.');
    }
  };

  const handleDevam = async () => {
    if (!malzemeBarkodu.trim()) {
      Alert.alert('Uyarı', 'Malzeme barkodu giriniz.');
      return;
    }

    const url = `https://apicloud.womlistapi.com/api/Malzeme/${selectedDepo.depoId}/${malzemeBarkodu}/1`;

    try {
      const response = await fetch(url);
      const text = await response.text();
      const data = JSON.parse(text);

      if (!data || !data.malzemeId) {
        Alert.alert('Hata', 'Malzeme bilgisi alınamadı.');
        return;
      }

      const enriched = {
        ...data,
        malzemeId: data.malzemeId,
        okutulanBirimId: data?.birimListesi?.[0]?.birimId || '',
      };

      navigation.navigate('DepoSayimDetay', {
        barkod: malzemeBarkodu,
        urun: enriched,
        sayim,
        selectedDepo,
        user,
        adresId: adresId,
      });
    } catch (error) {
      console.error('❌ Malzeme API hatası:', error);
      Alert.alert('Hata', 'Malzeme sorgulama sırasında hata oluştu.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Depo Sayımı</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('QrScanner')}
          style={styles.qrButton}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={120} color="#ea5a21" />
        </TouchableOpacity>

        {/* Adresli depo kontrolü */}
        {selectedDepo.adresliMi && !adresOnaylandi && (
          <>
            <Text style={styles.label}>Adres Barkodu Giriniz</Text>
            <TextInput
              style={styles.input}
              placeholder="Adres Barkodu"
              value={adresBarkodu}
              onChangeText={setAdresBarkodu}
            />
            <TouchableOpacity style={styles.button} onPress={handleAdresKontrol}>
              <Text style={styles.buttonText}>Devam Et</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Malzeme barkodu girişi */}
        {adresOnaylandi && (
          <>
            <Text style={styles.label}>Malzeme Barkodu Giriniz</Text>
            <TextInput
              style={styles.input}
              placeholder="Malzeme Barkodu"
              value={malzemeBarkodu}
              onChangeText={setMalzemeBarkodu}
            />
            <TouchableOpacity style={styles.button} onPress={handleDevam}>
              <Text style={styles.buttonText}>ARA</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f3edea',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ea5a21',
    textAlign: 'center',
    marginBottom: 20,
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
  label: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'white',
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    width: '100%',
    backgroundColor: '#ea5a21',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
