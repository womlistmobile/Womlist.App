import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Paket = {
  paketId: string;
  paketKodu: string;
  paketTanimAciklamasi: string;
  paketTarihi: string;
  cariAciklamasi: string;
  paketlemeTipiAciklamasi: string;
};

export default function PaketListesiScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const { selectedDepo, user } = route.params;
  const [loading, setLoading] = useState(true);
  const [paketler, setPaketler] = useState<Paket[]>([]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Paketleme',
      headerStyle: { backgroundColor: '#ea5a21' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
    });
  }, []);

  useEffect(() => {
    const fetchPaketler = async () => {
      try {
        const response = await fetch(
          `https://apicloud.womlistapi.com/api/Paket/PaketListesi/${selectedDepo.depoId}`
        );
        const text = await response.text();
        const json = JSON.parse(text); // çünkü API `text/plain` dönüyor
        setPaketler(json);
      } catch (error) {
        Alert.alert('Hata', 'Paket listesi alınırken bir hata oluştu.');
        console.error('API Hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaketler();
  }, []);

  const handleSelect = (paket: Paket) => {
    navigation.navigate('PaketDetay', {
      selectedDepo,
      user,
      paketId: paket.paketId,
      paketKodu: paket.paketKodu,
    });
  };

  const renderItem = ({ item }: { item: Paket }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
      <Text style={styles.kodu}>{item.paketKodu}</Text>
      <Text style={styles.aciklama}>{item.paketTanimAciklamasi}</Text>
      <Text style={styles.label}>Tarih:</Text>
      <Text>{item.paketTarihi}</Text>
      <Text style={styles.label}>Cari:</Text>
      <Text>{item.cariAciklamasi}</Text>
      <Text style={styles.label}>Tip:</Text>
      <Text>{item.paketlemeTipiAciklamasi}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#ea5a21" />
      ) : (
        <FlatList
          data={paketler}
          keyExtractor={(item) => item.paketId}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Paket bulunamadı.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f3edea',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  kodu: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  aciklama: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
  label: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#555',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
    color: '#888',
  },
});
