import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function IadeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { depoId, userId } = route.params;

  const [hareketTipi, setHareketTipi] = useState<1 | 2>(1);
  const [veriler, setVeriler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = `https://apicloud.womlistapi.com/api/SabitFis/FisListesi/${depoId}/3/${hareketTipi}`;
        const response = await fetch(url);
        const data = await response.json();
        setVeriler(data);
      } catch (error) {
        console.error('Veri alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [depoId, hareketTipi]);

  const handleSec = (item: any) => {
    navigation.navigate('IadeDetay', {
      fisId: item.fisId,
      fisNo: item.fisNo,
      cariBilgisi: item.cariBilgisi,
      tarih: item.tarih,
      depoId,
      userId,
      girisCikisTuru: hareketTipi
    });
  };

  return (
    <View style={styles.container}>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, hareketTipi === 1 && styles.activeTab]} onPress={() => setHareketTipi(1)}>
          <Text style={[styles.tabText, hareketTipi === 1 && styles.activeTabText]}>Giriş</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, hareketTipi === 2 && styles.activeTab]} onPress={() => setHareketTipi(2)}>
          <Text style={[styles.tabText, hareketTipi === 2 && styles.activeTabText]}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ea5a21" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={veriler}
          keyExtractor={(item) => item.fisId}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleSec(item)}>
              <Text style={styles.title}>{item.cariBilgisi}</Text>
              <Text style={styles.info}>Fiş No: {item.fisNo}</Text>
              <Text style={styles.info}>Tarih: {item.tarih}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3edea' },
  header: { paddingTop: 40, paddingBottom: 16, backgroundColor: '#ea5a21', alignItems: 'center' },
  headerText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#ea5a21', justifyContent: 'space-around', paddingBottom: 8 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 4, borderBottomColor: '#fff' },
  tabText: { color: '#fff', fontSize: 16 },
  activeTabText: { fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  info: { fontSize: 14, color: '#444' },
});
