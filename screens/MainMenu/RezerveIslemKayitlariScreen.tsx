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
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface IslemKaydi {
  islemId: string;
  lotNo: string;
  miktar: string;
  eklenme: string;
}

export default function RezerveIslemKayitlariScreen({ route, navigation }: any) {
  const { rezerveSatirId, satirData, rezerveData } = route.params;
  const [islemKayitlari, setIslemKayitlari] = useState<IslemKaydi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: 'İşlem Kayıtları',
      headerStyle: { backgroundColor: '#ea5a21' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
    });
    
    fetchIslemKayitlari();
  }, []);

  const fetchIslemKayitlari = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://apicloud.womlistapi.com/api/Rezerve/RezerveIslemKayitlari/${rezerveSatirId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setIslemKayitlari(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('İşlem kayıtları yükleme hatası:', error);
      Alert.alert('❌ Yükleme Hatası', 'İşlem kayıtları yüklenirken bir hata oluştu.\n\nLütfen sayfayı yenileyin veya daha sonra tekrar deneyin.');
      setIslemKayitlari([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchIslemKayitlari();
  };

  const handleDeleteIslem = (islemId: string, miktar: string, lotNo: string) => {
    Alert.alert(
      '🗑️ İşlemi Sil',
      `Bu işlemi silmek istediğinizden emin misiniz?\n\n• Lot: ${lotNo === '----' ? 'Lot Yok' : lotNo}\n• Miktar: ${miktar}`,
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => deleteIslem(islemId)
        }
      ]
    );
  };

  const deleteIslem = async (islemId: string) => {
    try {
      setDeletingId(islemId);
      
      const requestBody = {
        islemId: islemId,
        terminalId: rezerveData?.user?.id || 'MOBILE_TERMINAL'
      };

      console.log('📤 Silinecek işlem:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        'https://apicloud.womlistapi.com/api/Rezerve/RezerveIslemSatiriniPasifeAl',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        let errorMessage = 'İşlem silinirken bir hata oluştu.';
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            const message = errorData.message.toLowerCase();
            
            if (message.includes('bulunamadı') || message.includes('not found')) {
              errorMessage = 'İşlem bulunamadı. Zaten silinmiş olabilir.';
            } else if (message.includes('yetki') || message.includes('unauthorized')) {
              errorMessage = 'Bu işlemi silme yetkiniz bulunmuyor.';
            } else if (message.includes('zaten') || message.includes('already')) {
              errorMessage = 'Bu işlem zaten silinmiş.';
            } else {
              errorMessage = errorData.message;
            }
          }
        } catch (e) {
          // JSON parse edilemezse genel mesaj kullan
        }
        
        Alert.alert('❌ Silme Başarısız', errorMessage);
        return;
      }

      const responseData = await response.json();
      console.log('✅ Silme Response:', responseData);

      Alert.alert(
        '✅ Başarılı', 
        'İşlem başarıyla silindi.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              fetchIslemKayitlari(); // Listeyi yenile
            }
          }
        ]
      );
    } catch (error) {
      console.error('İşlem silme hatası:', error);
      
      let errorMessage = 'Beklenmeyen bir hata oluştu.';
      
      if (error.message.includes('Network')) {
        errorMessage = 'İnternet bağlantınızı kontrol edin.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Sunucuya bağlanılamıyor. Lütfen tekrar deneyin.';
      }
      
      Alert.alert('❌ Bağlantı Hatası', errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      // "02.09.2025 10:58" formatından "02/09/2025 10:58" formatına çevir
      return dateTimeString.replace(/\./g, '/');
    } catch {
      return dateTimeString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea5a21" />
        <Text style={styles.loadingText}>İşlem kayıtları yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Satır Bilgileri Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.rezerveKod}>{rezerveData?.rezerveBaslikKod}</Text>
          <Text style={styles.satirInfo}>Satır Detayı</Text>
        </View>
        
        <View style={styles.satirInfoCard}>
          <View style={styles.satirHeader}>
            <Text style={styles.malzemeKodu}>{satirData?.malzemeKodu}</Text>
            <Text style={styles.birim}>{satirData?.birimAciklamasi}</Text>
          </View>
          
          <Text style={styles.malzemeAciklama}>{satirData?.malzemeAciklamasi}</Text>
          
          <View style={styles.miktarRow}>
            <View style={styles.miktarItem}>
              <Text style={styles.miktarLabel}>Rezerve</Text>
              <Text style={styles.miktarValue}>{satirData?.rezerveAlinacakMiktar}</Text>
            </View>
            
            <View style={styles.miktarItem}>
              <Text style={styles.miktarLabel}>İşlenen</Text>
              <Text style={[styles.miktarValue, { color: '#27ae60' }]}>{satirData?.islenenMiktar}</Text>
            </View>
            
            <View style={styles.miktarItem}>
              <Text style={styles.miktarLabel}>Kalan</Text>
              <Text style={[styles.miktarValue, { color: '#e74c3c' }]}>{satirData?.kalanMiktar}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* İşlem Kayıtları */}
        <View style={styles.islemlerContainer}>
          <Text style={styles.islemlerTitle}>
            İşlem Kayıtları ({islemKayitlari.length})
          </Text>
          
          {islemKayitlari.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Bu satır için işlem kaydı bulunamadı.
              </Text>
            </View>
          ) : (
            islemKayitlari.map((islem, index) => (
              <View key={islem.islemId} style={styles.islemCard}>
                <View style={styles.islemHeader}>
                  <Text style={styles.islemId}>#{index + 1}</Text>
                  <View style={styles.headerRight}>
                    <Text style={styles.islemTarih}>
                      {formatDateTime(islem.eklenme)}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteIslem(islem.islemId, islem.miktar, islem.lotNo)}
                      disabled={deletingId === islem.islemId}
                    >
                      {deletingId === islem.islemId ? (
                        <ActivityIndicator size="small" color="#e74c3c" />
                      ) : (
                        <MaterialCommunityIcons 
                          name="delete-outline" 
                          size={20} 
                          color="#e74c3c" 
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.islemDetails}>
                  <View style={styles.islemDetailItem}>
                    <Text style={styles.islemDetailLabel}>Lot No</Text>
                    <Text style={styles.islemDetailValue}>
                      {islem.lotNo === '----' ? 'Lot Yok' : islem.lotNo}
                    </Text>
                  </View>
                  
                  <View style={styles.islemDetailItem}>
                    <Text style={styles.islemDetailLabel}>Miktar</Text>
                    <Text style={[styles.islemDetailValue, styles.miktarHighlight]}>
                      {islem.miktar}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
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
  headerCard: {
    backgroundColor: '#ea5a21',
    padding: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rezerveKod: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  satirInfo: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  satirInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
  birim: {
    fontSize: 14,
    color: '#7f8c8d',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  malzemeAciklama: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 12,
  },
  miktarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  islemlerContainer: {
    marginTop: 8,
  },
  islemlerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
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
  islemCard: {
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
  islemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffeaea',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  islemId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ea5a21',
  },
  islemTarih: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  islemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  islemDetailItem: {
    flex: 1,
  },
  islemDetailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  islemDetailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  miktarHighlight: {
    color: '#27ae60',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

