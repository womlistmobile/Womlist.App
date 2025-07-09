import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQr } from '../../DashBoard/QrContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProductInfoScreen() {
  const [barcode, setBarcode] = useState('');
  const [data, setData] = useState<any>(null);
  const navigation = useNavigation<any>();
  const { scannedValue, setScannedValue } = useQr();

  useFocusEffect(() => {
    if (scannedValue) {
      setBarcode(scannedValue);
      setScannedValue('');
    }
  });

  const handleSearch = async () => {
    try {
      const response = await fetch(`https://apicloud.womlistapi.com/api/Sorgulama/Malzeme?barkod=${barcode}`);
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error('Barkod sorgulama hatası:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <TouchableOpacity
        onPress={() => navigation.navigate('QrScanner')}
        style={styles.qrButton}
      >
        <MaterialCommunityIcons
          name="qrcode-scan"
          size={140}
          color="#ea5a21"
        />
      </TouchableOpacity>

      <Text style={styles.title}>Ürün Barkodu / Lot Okutunuz</Text>

      <TextInput
        placeholder="Ürün Barkodu Giriniz"
        style={styles.input}
        value={barcode}
        onChangeText={setBarcode}
      />

      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>🔍 ARA</Text>
      </TouchableOpacity>

      {data && (
        <View style={{ width: '100%', marginTop: 20 }}>
          <View style={styles.headerBox}>
            <Text style={styles.headerText}>
              <Text style={{ fontWeight: 'bold' }}>{data.kodu}</Text>  Miktar: {data.miktar}
            </Text>
            <Text>{data.aciklama}</Text>
          </View>

          {data.depoMiktarlari.map((depo: any, i: number) => (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{depo.depoKodu}</Text>
                <Text style={styles.cardDepo}>{depo.depoAciklamasi}</Text>
                <Text style={styles.cardAmount}>Miktar:{depo.miktar}</Text>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.infoButton, { backgroundColor: depo.lotlu ? '#2ecc71' : '#ccc' }]}
                  disabled={!depo.lotlu}
                  onPress={() => {
                    navigation.navigate('LotInfo', {
                      lotListesi: depo.lotMiktarlari ?? [],
                      depoAciklamasi: depo.depoAciklamasi ?? "",
                      urunAciklamasi: data.aciklama ?? ""
                    });
                  }}
                >
                  <Text style={styles.infoButtonText}>LOT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.infoButton, { backgroundColor: depo.adresli ? '#2ecc71' : '#ccc' }]}
                  disabled={!depo.adresli}
                  onPress={() => {
                    navigation.navigate('AddressInfo', {
                      addressList: depo.adresMiktarlari ?? [],
                      depoAciklamasi: depo.depoAciklamasi ?? "",
                      urunAciklamasi: data.aciklama ?? ""
                    });
                  }}
                >
                  <Text style={styles.infoButtonText}>ADRES</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.infoButton, {
                    backgroundColor: depo.adresli && depo.lotlu ? '#2ecc71' : '#ccc'
                  }]}
                  disabled={!(depo.adresli && depo.lotlu)}
                  onPress={() => {
                    navigation.navigate('AddressLotInfo', {
                      addressLotList: depo.adresLotMiktarlari ?? [],
                      depoAciklamasi: depo.depoAciklamasi ?? "",
                      urunAciklamasi: data.aciklama ?? ""
                    });
                  }}
                >
                  <Text style={styles.infoButtonText}>ADRES/LOT</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3edea',
    padding: 20,
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
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: 'white',
  },
  button: {
    width: '100%',
    backgroundColor: '#ea5a21',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  headerText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
  },
  cardDepo: {
    fontStyle: 'italic',
    color: '#555',
  },
  cardAmount: {
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
