import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

type SayimItem = {
  sayimId: string;
  kod: string;
  tarih: string;
  tumUrunler: boolean;
};

export default function DepoSayimScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { selectedDepo, user } = route.params;

  const [sayimlar, setSayimlar] = useState<SayimItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getSayimListesi = async () => {
    try {
      const response = await fetch(
        `https://apicloud.womlistapi.com/api/Sayim/SayimListesi/${selectedDepo.depoId}`
      );
      const data = await response.json();
      setSayimlar(data);
    } catch (error) {
      console.error('Sayım listesi çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSayimListesi();
  }, []);

const renderItem = ({ item }: { item: SayimItem }) => (
  <TouchableOpacity
    style={styles.card}
   onPress={() => {
  if (!item?.sayimId || !selectedDepo?.depoId || !user?.id) {
    Alert.alert('Hata', 'Eksik veri gönderiliyor.');
    return;
  }



  navigation.navigate('DepoSayimArama', {
    sayim: item,
    selectedDepo,
    user,
  });
}}

  >

    
      <Text style={styles.text}>KOD  :  {item.kod}</Text>
      <Text style={styles.text}>Tarih: {item.tarih}</Text>
      <Text style={styles.text}>
        Sayım Tipi: {item.tumUrunler ? 'Tüm Ürünler' : 'Seçili Ürünler'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#ea5a21" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={sayimlar}
          keyExtractor={(item) => item.sayimId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3edea' },
  header: {
    backgroundColor: '#ea5a21',
    padding: 16,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#add8e6',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  text: { fontSize: 16, marginBottom: 4 },
});
