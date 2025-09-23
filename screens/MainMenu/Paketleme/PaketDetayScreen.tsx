import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

type PaketSatiri = {
  paketSatirId: string;
  paketlenecekMiktar: number;
  paketlenecekMiktarStr: string;
  paketlenenMiktar: number;
  paketlenenMiktarMiktarStr: string;
  paketlenebilirMiktar: number;
  paketlenebilirMiktarStr: string;
  malzemekodu: string;
  malzemeAciklamasi: string;
  birimAciklamasi: string;
  sabitFiskodu: string;
};

export default function PaketDetayScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { selectedDepo, user, paketId, paketKodu } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paketSatirlari, setPaketSatirlari] = useState<PaketSatiri[]>([]);

  useEffect(() => {
    navigation.setOptions({
      title: `Paket: ${paketKodu}`,
      headerStyle: { backgroundColor: '#ea5a21' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
    });
  }, [paketKodu]);

  const fetchPaketSatirlari = async () => {
    try {
      const response = await fetch(
        `https://apicloud.womlistapi.com/api/Paket/PaketSatirlari/${paketId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      
      if (!Array.isArray(json)) {
        throw new Error('API yanıtı beklenen formatta değil');
      }

      setPaketSatirlari(json);
    } catch (error) {
      console.error('Paket satırları API hatası:', error);
      Alert.alert('Hata', error instanceof Error ? error.message : 'Paket satırları alınamadı.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaketSatirlari();
  }, [paketId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaketSatirlari();
  };


  const getProgressPercentage = (paketlenen: number, paketlenecek: number) => {
    if (paketlenecek === 0) return 0;
    return Math.round((paketlenen / paketlenecek) * 100);
  };

  const getStatusColor = (paketlenen: number, paketlenecek: number) => {
    if (paketlenen === 0) return '#e74c3c'; // Kırmızı - Başlanmamış
    if (paketlenen < paketlenecek) return '#f39c12'; // Turuncu - Kısmen tamamlanmış
    return '#27ae60'; // Yeşil - Tamamlanmış
  };

  const handleSatirPress = (item: PaketSatiri) => {
    navigation.navigate('PaketlemeDetay', {
      selectedDepo,
      user,
      paketId: paketId,
      paketSatirId: item.paketSatirId,
      malzemeKodu: item.malzemekodu,
      malzemeAciklama: item.malzemeAciklamasi,
    });
  };

  const renderItem = ({ item }: { item: PaketSatiri }) => {
    const progressPercentage = getProgressPercentage(item.paketlenenMiktar, item.paketlenecekMiktar);
    const statusColor = getStatusColor(item.paketlenenMiktar, item.paketlenecekMiktar);
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleSatirPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.malzemeKodu}>{item.malzemekodu}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{progressPercentage}%</Text>
          </View>
        </View>
        
        <Text style={styles.malzemeAciklama}>{item.malzemeAciklamasi}</Text>
        
        <View style={styles.miktarContainer}>
          <View style={styles.miktarRow}>
            <Text style={styles.miktarLabel}>Paketlenecek:</Text>
            <Text style={styles.miktarValue}>{item.paketlenecekMiktarStr} {item.birimAciklamasi}</Text>
          </View>
          
          <View style={styles.miktarRow}>
            <Text style={styles.miktarLabel}>Paketlenen:</Text>
            <Text style={[styles.miktarValue, { color: statusColor }]}>
              {item.paketlenenMiktarMiktarStr} {item.birimAciklamasi}
            </Text>
          </View>
          
          <View style={styles.miktarRow}>
            <Text style={styles.miktarLabel}>Kalan:</Text>
            <Text style={styles.miktarValue}>{item.paketlenebilirMiktarStr} {item.birimAciklamasi}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: statusColor
                }
              ]} 
            />
          </View>
        </View>

        {item.sabitFiskodu && (
          <View style={styles.sabitFisContainer}>
            <Text style={styles.sabitFisLabel}>Sabit Fiş:</Text>
            <Text style={styles.sabitFisKodu}>{item.sabitFiskodu}</Text>
          </View>
        )}

        <View style={styles.tapIndicator}>
          <Text style={styles.tapText}>Detaylar için dokunun →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#ea5a21" />
      ) : (
        <FlatList
          data={paketSatirlari}
          keyExtractor={(item) => item.paketSatirId}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ea5a21']}
              tintColor="#ea5a21"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Bu pakete ait satır bulunamadı.</Text>
            </View>
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
    marginBottom: 8,
  },
  malzemeKodu: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  malzemeAciklama: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 12,
    lineHeight: 20,
  },
  miktarContainer: {
    marginBottom: 12,
  },
  miktarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  miktarLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  miktarValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sabitFisContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  sabitFisLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  sabitFisKodu: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tapIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    alignItems: 'flex-end',
  },
  tapText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});
