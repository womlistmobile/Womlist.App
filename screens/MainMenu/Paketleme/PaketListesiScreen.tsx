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
        setLoading(true);
        const response = await fetch(
          `https://apicloud.womlistapi.com/api/Paket/PaketListesi?depoId=${selectedDepo.depoId}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        
        if (!Array.isArray(json)) {
          throw new Error('API yanıtı beklenen formatta değil');
        }

        setPaketler(json);
      } catch (error) {
        console.error('Paket listesi API hatası:', error);
        Alert.alert('Hata', error instanceof Error ? error.message : 'Paket listesi alınamadı.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaketler();
  }, [selectedDepo.depoId]);

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
      <View style={styles.cardHeader}>
        <Text style={styles.kodu}>{item.paketKodu}</Text>
        <Text style={styles.tarih}>{item.paketTarihi}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Cari:</Text>
          <Text style={styles.value}>{item.cariAciklamasi}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Paketleme Tipi:</Text>
          <Text style={styles.value}>{item.paketlemeTipiAciklamasi}</Text>
        </View>
      </View>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  kodu: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  tarih: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34495e',
    width: 100,
  },
  value: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    flexWrap: 'wrap',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});
