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

interface RezerveItem {
  rezerveBaslikId: string;
  rezerveBaslikKod: string;
  rezerveAciklamasi: string;
  rezerveGecerliGunSayisi: number;
  rezerveDurumu: string;
  rezerveOlusturulmaTarihi: string;
  rezerveBitisTarihi: string;
  sabitFisKodu: string;
  sabitFisAciklamasi: string;
  cariAciklamasi: string;
  depoAciklamasi: string;
  satirSayisi: number;
}

export default function RezervScreen({ route, navigation }: any) {
  const { selectedDepo, user } = route.params;
  const [rezerveListesi, setRezerveListesi] = useState<RezerveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: 'Rezerve Listesi',
      headerStyle: { backgroundColor: '#ea5a21' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
    });
    
    fetchRezerveListesi();
  }, []);

  const fetchRezerveListesi = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://apicloud.womlistapi.com/api/Rezerve/RezerveListesi?depoId=${selectedDepo.depoId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setRezerveListesi(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Rezerve listesi yükleme hatası:', error);
      Alert.alert('❌ Yükleme Hatası', 'Rezerve listesi yüklenirken bir hata oluştu.\n\nLütfen sayfayı yenileyin veya daha sonra tekrar deneyin.');
      setRezerveListesi([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRezerveListesi();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'onaylandi':
        return '#2ecc71';
      case 'beklemede':
        return '#f39c12';
      case 'iptal':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const [day, month, year] = dateString.split('.');
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea5a21" />
        <Text style={styles.loadingText}>Rezerve listesi yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Depo: {selectedDepo?.aciklamasi}</Text>
        <Text style={styles.countText}>
          Toplam {rezerveListesi.length} rezerve kaydı
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {rezerveListesi.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Bu depo için rezerve kaydı bulunamadı.
            </Text>
          </View>
        ) : (
          rezerveListesi.map((item, index) => (
            <TouchableOpacity 
              key={item.rezerveBaslikId} 
              style={styles.card}
              onPress={() => {
                navigation.navigate('RezerveDetay', {
                  rezerveId: item.rezerveBaslikId,
                  rezerveData: item,
                  selectedDepo,
                  user
                });
              }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.rezerveKod}>{item.rezerveBaslikKod}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.rezerveDurumu) }]}>
                  <Text style={styles.statusText}>{item.rezerveDurumu}</Text>
                </View>
              </View>
              
              <Text style={styles.rezerveAciklama}>{item.rezerveAciklamasi}</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Müşteri:</Text>
                <Text style={styles.infoValue}>{item.cariAciklamasi}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sabit Fiş:</Text>
                <Text style={styles.infoValue}>{item.sabitFisKodu}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Satır Sayısı:</Text>
                <Text style={styles.infoValue}>{item.satirSayisi}</Text>
              </View>
              
              <View style={styles.dateRow}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Oluşturulma:</Text>
                  <Text style={styles.dateValue}>{formatDate(item.rezerveOlusturulmaTarihi)}</Text>
                </View>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Bitiş:</Text>
                  <Text style={styles.dateValue}>{formatDate(item.rezerveBitisTarihi)}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Geçerli Gün:</Text>
                <Text style={styles.infoValue}>{item.rezerveGecerliGunSayisi} gün</Text>
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
  rezerveKod: {
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
  rezerveAciklama: {
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
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '600',
  },
});
