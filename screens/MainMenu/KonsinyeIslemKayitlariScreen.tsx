import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  RefreshControl,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQr } from '../DashBoard/QrContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface IslemKaydi {
  islemId: string;
  lotNo: string;
  miktar: string;
  eklenme: string;
}

export default function KonsinyeIslemKayitlariScreen({ route, navigation }: any) {
  const { konsinyeSatirId, satirData, konsinyeData, user } = route.params;
  const [islemKayitlari, setIslemKayitlari] = useState<IslemKaydi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lotInput, setLotInput] = useState('');
  const [miktarInput, setMiktarInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { scannedValue, setScannedValue } = useQr();

  useEffect(() => {
    navigation.setOptions({
      title: 'İşlem Kayıtları',
      headerStyle: { backgroundColor: '#ea5a21' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
    });
    
    fetchIslemKayitlari();
  }, []);

  // QR kod tarandığında barkod input'una yerleştir
  useFocusEffect(
    React.useCallback(() => {
      if (scannedValue) {
        setBarcodeInput(scannedValue);
        setScannedValue(''); // QR değerini temizle
      }
    }, [scannedValue])
  );

  const fetchIslemKayitlari = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://apicloud.womlistapi.com/api/Konsinye/IslemKayitlari/${konsinyeSatirId}`
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

  const formatDateTime = (dateTimeString: string) => {
    try {
      // "02.09.2025 10:58" formatından "02/09/2025 10:58" formatına çevir
      return dateTimeString.replace(/\./g, '/');
    } catch {
      return dateTimeString;
    }
  };

  const parseApiError = (errorText: string, statusCode: number) => {
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        return errorData.message;
      }
    } catch {
      // JSON parse edilemezse, HTTP status koduna göre mesaj döndür
    }

    switch (statusCode) {
      case 400:
        return 'Geçersiz veri gönderildi. Lütfen bilgileri kontrol edin.';
      case 401:
        return 'Yetkiniz bulunmuyor. Lütfen tekrar giriş yapın.';
      case 403:
        return 'Bu işlem için yetkiniz bulunmuyor.';
      case 404:
        return 'Konsinye satırı bulunamadı.';
      case 500:
        return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      default:
        return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
    }
  };

  const handleKonsinyeEkle = async () => {
    // Validasyonlar
    if (!barcodeInput.trim()) {
      Alert.alert('❌ Eksik Bilgi', 'Lütfen barkod numarasını giriniz.');
      return;
    }

    if (satirData?.malzemeLotluMu && !lotInput.trim()) {
      Alert.alert('❌ Eksik Bilgi', 'Bu ürün lotlu olduğu için lot numarası gereklidir.');
      return;
    }

    if (!miktarInput.trim()) {
      Alert.alert('❌ Eksik Bilgi', 'Lütfen miktar bilgisini giriniz.');
      return;
    }

    const miktar = Number(miktarInput);
    if (isNaN(miktar) || miktar <= 0) {
      Alert.alert('❌ Geçersiz Miktar', 'Lütfen geçerli bir miktar giriniz.');
      return;
    }

    try {
      setSubmitting(true);
      
      const requestBody = {
        konsinyeSatirId: konsinyeSatirId,
        kod: barcodeInput.trim(), // Her zaman barkod sorgulanacak
        miktar: miktar,
        terminalId: user?.id || 'MOBILE_TERMINAL',
        lotNo: satirData?.malzemeLotluMu ? lotInput.trim() : null // Lotlu ürünler için lot numarası
      };

      console.log('🔍 Konsinye API Request Body:', requestBody);
      console.log('🔍 Satır Data:', satirData);
      console.log('🔍 Malzeme Lotlu Mu:', satirData?.malzemeLotluMu);

      const response = await fetch(
        'https://apicloud.womlistapi.com/api/Konsinye/GonderimIslemSatiriEkle',
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
        console.log('❌ API Error Response:', errorText);
        console.log('❌ Response Status:', response.status);
        const userFriendlyMessage = parseApiError(errorText, response.status);
        Alert.alert('❌ İşlem Başarısız', userFriendlyMessage, [
          { text: 'Tamam', style: 'default' }
        ]);
        return;
      }

      const result = await response.json();
      
      if (result.durum) {
        Alert.alert('✅ Başarılı', 'Konsinye işlemi başarıyla eklendi!', [
          { text: 'Tamam', style: 'default' }
        ]);
        
        // Input'ları temizle
        setBarcodeInput('');
        setLotInput('');
        setMiktarInput('');
        
        // Listeyi yenile
        fetchIslemKayitlari();
      } else {
        Alert.alert('❌ İşlem Başarısız', result.message || 'Bilinmeyen bir hata oluştu.', [
          { text: 'Tamam', style: 'default' }
        ]);
      }
    } catch (error) {
      console.error('Konsinye ekleme hatası:', error);
      Alert.alert('❌ Bağlantı Hatası', 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.', [
        { text: 'Tamam', style: 'default' }
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIslem = (islemId: string, miktar: string, lotNo: string) => {
    Alert.alert(
      '🗑️ İşlemi Sil',
      `Bu işlemi silmek istediğinizden emin misiniz?\n\n• Lot: ${lotNo === '----' ? 'Lot Yok' : lotNo}\n• Miktar: ${miktar}`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => deleteIslem(islemId) }
      ]
    );
  };

  const deleteIslem = async (islemId: string) => {
    try {
      setDeletingId(islemId);
      
      const requestBody = {
        terminalId: user?.id || 'MOBILE_TERMINAL'
      };

      const response = await fetch(
        `https://apicloud.womlistapi.com/api/Konsinye/GonderimIslemSatiriniPasifeAl/${islemId}`,
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
        const userFriendlyMessage = parseApiError(errorText, response.status);
        Alert.alert('❌ Silme Başarısız', userFriendlyMessage, [
          { text: 'Tamam', style: 'default' }
        ]);
        return;
      }

      const result = await response.json();
      
      if (result.durum) {
        Alert.alert('✅ Başarılı', 'İşlem başarıyla silindi!', [
          { text: 'Tamam', style: 'default' }
        ]);
        
        // Listeyi yenile
        fetchIslemKayitlari();
      } else {
        Alert.alert('❌ Silme Başarısız', result.message || 'Bilinmeyen bir hata oluştu.', [
          { text: 'Tamam', style: 'default' }
        ]);
      }
    } catch (error) {
      console.error('İşlem silme hatası:', error);
      Alert.alert('❌ Bağlantı Hatası', 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.', [
        { text: 'Tamam', style: 'default' }
      ]);
    } finally {
      setDeletingId(null);
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
          <Text style={styles.konsinyeKod}>{konsinyeData?.kod}</Text>
          <Text style={styles.satirInfo}>Satır Detayı</Text>
        </View>
        
        <View style={styles.satirInfoCard}>
          <View style={styles.satirHeader}>
            <Text style={styles.malzemeKodu}>{satirData?.malzemeKodu}</Text>
            <Text style={styles.birim}>{satirData?.birimAciklamasi}</Text>
          </View>
          
          <Text style={styles.malzemeAdi}>{satirData?.malzemeAdi}</Text>
          
          <View style={styles.miktarRow}>
            <View style={styles.miktarItem}>
              <Text style={styles.miktarLabel}>Talep</Text>
              <Text style={styles.miktarValue}>{satirData?.talepMiktarStr}</Text>
            </View>
            
            <View style={styles.miktarItem}>
              <Text style={styles.miktarLabel}>İşlenen</Text>
              <Text style={[styles.miktarValue, { color: '#27ae60' }]}>{satirData?.islenenToplamMiktarStr}</Text>
            </View>
            
            <View style={styles.miktarItem}>
              <Text style={styles.miktarLabel}>Kalan</Text>
              <Text style={[styles.miktarValue, { color: '#e74c3c' }]}>
                {(satirData?.talepMiktar || 0) - (satirData?.islenenToplamMiktar || 0)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Yeni İşlem Ekleme Barı */}
      <View style={styles.inputCard}>
        <Text style={styles.inputTitle}>Yeni Konsinye İşlemi Ekle</Text>
        
        {/* Barkod Input - Her zaman göster */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.barcodeInput}
            placeholder="Barkod numarasını giriniz"
            value={barcodeInput}
            onChangeText={setBarcodeInput}
          />
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => navigation.navigate('QrScanner')}
          >
            <MaterialCommunityIcons name="camera" size={24} color="#ea5a21" />
          </TouchableOpacity>
        </View>

        {/* Lot Input - Sadece lotlu ürünler için göster */}
        {satirData?.malzemeLotluMu && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.barcodeInput}
              placeholder="Lot numarasını giriniz"
              value={lotInput}
              onChangeText={setLotInput}
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => navigation.navigate('QrScanner')}
            >
              <MaterialCommunityIcons name="camera" size={24} color="#ea5a21" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.miktarContainer}>
          <TextInput
            style={styles.miktarInput}
            placeholder="Miktar giriniz"
            value={miktarInput}
            onChangeText={setMiktarInput}
            keyboardType="numeric"
          />
        </View>
        
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleKonsinyeEkle}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>KONSİNYE EKLE</Text>
          )}
        </TouchableOpacity>
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
  konsinyeKod: {
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
  malzemeAdi: {
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
  },
  islemId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ea5a21',
  },
  islemTarih: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fdf2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
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
  // Input Bar Stilleri
  inputCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barcodeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  cameraButton: {
    marginLeft: 8,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  miktarContainer: {
    marginBottom: 12,
  },
  miktarInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  submitButton: {
    backgroundColor: '#ea5a21',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
