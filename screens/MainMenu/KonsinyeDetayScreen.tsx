import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  RefreshControl,
  TouchableOpacity 
} from 'react-native';

interface KonsinyeSatir {
  satirId: string;
  malzemeId: string;
  malzemeKodu: string;
  malzemeAdi: string;
  malzemeLotluMu: boolean;
  birimId: string;
  birimAciklamasi: string;
  talepMiktar: number;
  talepMiktarStr: string;
  islenenToplamMiktar: number;
  islenenToplamMiktarStr: string;
  islemler: any[];
}

interface KonsinyeDetay {
  id: string;
  kod: string;
  aciklama: string;
  carikod: string;
  cariAciklama: string;
  depoAciklama: string;
  konsinyeDurumu: string;
  satirlar: KonsinyeSatir[];
}

export default function KonsinyeDetayScreen({ route, navigation }: any) {
  const { konsinyeId, konsinyeData, user } = route.params;
  const [detayData, setDetayData] = useState<KonsinyeDetay | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: 'Konsinye Detayı',
      headerStyle: { backgroundColor: '#ea5a21' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
    });
    
    fetchKonsinyeDetay();
  }, []);

  const fetchKonsinyeDetay = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://apicloud.womlistapi.com/api/Konsinye/IsEmriDetay/${konsinyeId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDetayData(data);
    } catch (error) {
      console.error('Konsinye detay yükleme hatası:', error);
      Alert.alert('❌ Yükleme Hatası', 'Konsinye detayları yüklenirken bir hata oluştu.\n\nLütfen sayfayı yenileyin veya daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchKonsinyeDetay();
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

  const getProgressPercentage = (islenen: number, talep: number) => {
    if (talep === 0) return 0;
    return Math.round((islenen / talep) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea5a21" />
        <Text style={styles.loadingText}>Konsinye detayı yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Konsinye Başlık Bilgileri */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.konsinyeKod}>{detayData?.kod || konsinyeData?.kod}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(detayData?.konsinyeDurumu || konsinyeData?.konsinyeDurumu) }]}>
              <Text style={styles.statusText}>{detayData?.konsinyeDurumu || konsinyeData?.konsinyeDurumu}</Text>
            </View>
          </View>
          
          <Text style={styles.konsinyeAciklama}>
            {detayData?.aciklama || konsinyeData?.aciklama}
          </Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Müşteri</Text>
              <Text style={styles.infoValue}>{detayData?.cariAciklama || konsinyeData?.cariAciklama}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cari Kod</Text>
              <Text style={styles.infoValue}>{detayData?.carikod || konsinyeData?.cariKod}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Depo</Text>
              <Text style={styles.infoValue}>{detayData?.depoAciklama || konsinyeData?.depoAciklama}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Toplam Satır</Text>
              <Text style={styles.infoValue}>{detayData?.satirlar?.length || 0} adet</Text>
            </View>
          </View>
        </View>

        {/* Konsinye Satırları */}
        {detayData?.satirlar && detayData.satirlar.length > 0 && (
          <View style={styles.satirlarContainer}>
            <Text style={styles.satirlarTitle}>Konsinye Kalemleri ({detayData.satirlar.length})</Text>
            
            {detayData.satirlar.map((satir, index) => {
              const progressPercentage = getProgressPercentage(satir.islenenToplamMiktar, satir.talepMiktar);
              
              return (
                <TouchableOpacity 
                  key={satir.satirId} 
                  style={styles.satirCard}
                  onPress={() => {
                    navigation.navigate('KonsinyeIslemKayitlari', {
                      konsinyeSatirId: satir.satirId,
                      satirData: satir,
                      konsinyeData: detayData,
                      user: user
                    });
                  }}
                >
                  <View style={styles.satirHeader}>
                    <Text style={styles.malzemeKodu}>{satir.malzemeKodu}</Text>
                    <View style={styles.satirHeaderRight}>
                      <Text style={styles.birim}>{satir.birimAciklamasi}</Text>
                      {satir.malzemeLotluMu && (
                        <View style={styles.lotBadge}>
                          <Text style={styles.lotText}>LOT</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <Text style={styles.malzemeAdi}>{satir.malzemeAdi}</Text>
                  
                  <View style={styles.miktarRow}>
                    <View style={styles.miktarItem}>
                      <Text style={styles.miktarLabel}>Talep</Text>
                      <Text style={styles.miktarValue}>{satir.talepMiktarStr}</Text>
                    </View>
                    
                    <View style={styles.miktarItem}>
                      <Text style={styles.miktarLabel}>İşlenen</Text>
                      <Text style={[styles.miktarValue, { color: '#27ae60' }]}>{satir.islenenToplamMiktarStr}</Text>
                    </View>
                    
                    <View style={styles.miktarItem}>
                      <Text style={styles.miktarLabel}>Kalan</Text>
                      <Text style={[styles.miktarValue, { color: '#e74c3c' }]}>
                        {satir.talepMiktar - satir.islenenToplamMiktar}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${Math.min(progressPercentage, 100)}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{progressPercentage}%</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  konsinyeKod: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    marginBottom: 16,
    fontWeight: '500',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  infoItem: {
    width: '50%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  satirlarContainer: {
    marginTop: 8,
  },
  satirlarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  satirCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  satirHeader: {
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
  satirHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  birim: {
    fontSize: 14,
    color: '#7f8c8d',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lotBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lotText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  malzemeAdi: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 12,
  },
  miktarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  miktarItem: {
    flex: 1,
    alignItems: 'center',
  },
  miktarLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  miktarValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    minWidth: 35,
    textAlign: 'right',
  },
});
