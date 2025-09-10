import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  RefreshControl 
} from 'react-native';

interface KonsinyeIsEmri {
  id: string;
  kod: string;
  aciklama: string;
  cariKod: string;
  cariAciklama: string;
  depoAciklama: string;
  konsinyeDurumu: string;
  eklenmeTarihi: string;
}

export default function KonsinyeScreen({ route, navigation }: any) {
  const { selectedDepo, user } = route.params;
  const [konsinyeListesi, setKonsinyeListesi] = useState<KonsinyeIsEmri[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: 'Konsinye İş Emirleri',
      headerStyle: { backgroundColor: '#ea5a21' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
    });
    
    fetchKonsinyeListesi();
  }, []);

  const fetchKonsinyeListesi = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://apicloud.womlistapi.com/api/Konsinye/IsEmirleri?depoId=${selectedDepo.depoId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setKonsinyeListesi(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Konsinye listesi yükleme hatası:', error);
      Alert.alert('❌ Yükleme Hatası', 'Konsinye iş emirleri yüklenirken bir hata oluştu.\n\nLütfen sayfayı yenileyin veya daha sonra tekrar deneyin.');
      setKonsinyeListesi([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchKonsinyeListesi();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'onaylandi':
        return '#2ecc71';
      case 'beklemede':
        return '#f39c12';
      case 'iptal':
        return '#e74c3c';
      case 'tamamlandi':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // "13.08.2025 17:21" formatından "13/08/2025 17:21" formatına çevir
      const parts = dateString.split(' ');
      if (parts.length >= 2) {
        const datePart = parts[0].replace(/\./g, '/');
        const timePart = parts[1];
        return `${datePart} ${timePart}`;
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea5a21" />
        <Text style={styles.loadingText}>Konsinye iş emirleri yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Depo: {selectedDepo?.aciklamasi}</Text>
        <Text style={styles.countText}>
          Toplam {konsinyeListesi.length} konsinye iş emri
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {konsinyeListesi.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Bu depo için konsinye iş emri bulunamadı.
            </Text>
          </View>
        ) : (
          konsinyeListesi.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              onPress={() => {
                navigation.navigate('KonsinyeDetay', {
                  konsinyeId: item.id,
                  konsinyeData: item,
                  user: user
                });
              }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.konsinyeKod}>{item.kod}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.konsinyeDurumu) }]}>
                  <Text style={styles.statusText}>{item.konsinyeDurumu}</Text>
                </View>
              </View>
              
              <Text style={styles.konsinyeAciklama}>{item.aciklama}</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Müşteri:</Text>
                <Text style={styles.infoValue}>{item.cariAciklama}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cari Kod:</Text>
                <Text style={styles.infoValue}>{item.cariKod}</Text>
              </View>
              
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Eklenme Tarihi:</Text>
                <Text style={styles.dateValue}>{formatDate(item.eklenmeTarihi)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3edea',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3edea',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#ea5a21',
    padding: 16,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  countText: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  konsinyeKod: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  konsinyeAciklama: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 12,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  dateLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  dateValue: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '600',
  },
});
