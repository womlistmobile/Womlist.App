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

interface RezerveSatir {
  rezerveSatirId: string;
  malzemeKodu: string;
  malzemeAciklamasi: string;
  birimAciklamasi: string;
  rezerveAlinacakMiktar: string;
  islenenMiktar: string;
  kalanMiktar: string;
}

interface RezerveDetay {
  rezerveBaslikId: string;
  rezerveBaslikKod: string;
  rezerveAciklamasi: string;
  rezerveGecerliGunSayisi: number;
  rezerveDurumu: string;
  rezerveOlusturulmaTarihi: string;
  rezerveBitisTarihi: string;
  sabitFiskodu: string;
  sabitFisAciklamasi: string;
  cariAciklamasi: string;
  depoAciklamasi: string;
  satirlar: RezerveSatir[];
}

export default function RezerveDetayScreen({ route, navigation }: any) {
  const { rezerveId, rezerveData, selectedDepo, user } = route.params;
  const [detayData, setDetayData] = useState<RezerveDetay | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [miktarInput, setMiktarInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { scannedValue, setScannedValue } = useQr();

  useEffect(() => {
    navigation.setOptions({
      title: 'Rezerve Detayı',
      headerStyle: { backgroundColor: '#ea5a21' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
    });
    
    fetchRezerveDetay();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (scannedValue) {
        setBarcodeInput(scannedValue);
        setScannedValue('');
      }
    }, [scannedValue])
  );

  const fetchRezerveDetay = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://apicloud.womlistapi.com/api/Rezerve/RezerveDetay/${rezerveId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDetayData(data);
    } catch (error) {
      console.error('Rezerve detay yükleme hatası:', error);
      Alert.alert('❌ Yükleme Hatası', 'Rezerve detayları yüklenirken bir hata oluştu.\n\nLütfen sayfayı yenileyin veya daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRezerveDetay();
  };

  const parseApiError = (errorText: string, statusCode: number) => {
    try {
      const errorData = JSON.parse(errorText);
      
      // API'den gelen hata mesajlarını Türkçe'ye çevir
      if (errorData.message) {
        const message = errorData.message.toLowerCase();
        
        if (message.includes('rezerve') && message.includes('bulunamadı')) {
          return 'Rezerve kaydı bulunamadı. Lütfen sayfayı yenileyin.';
        }
        if (message.includes('malzeme') && message.includes('bulunamadı')) {
          return 'Girilen barkod/lot numarası sistemde bulunamadı.';
        }
        if (message.includes('miktar') && message.includes('geçersiz')) {
          return 'Girilen miktar geçersiz. Lütfen pozitif bir sayı giriniz.';
        }
        if (message.includes('terminal') && message.includes('bulunamadı')) {
          return 'Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.';
        }
        if (message.includes('depo') && message.includes('bulunamadı')) {
          return 'Depo bilgisi bulunamadı. Lütfen depo seçimini kontrol edin.';
        }
        if (message.includes('yetki') || message.includes('unauthorized')) {
          return 'Bu işlem için yetkiniz bulunmuyor.';
        }
        if (message.includes('duplicate') || message.includes('zaten')) {
          return 'Bu işlem daha önce eklenmiş.';
        }
        
        return errorData.message;
      }
    } catch (e) {
      // JSON parse edilemezse genel hata mesajları
    }
    
    // HTTP status koduna göre genel mesajlar
    switch (statusCode) {
      case 400:
        return 'Gönderilen veriler hatalı. Lütfen bilgileri kontrol edin.';
      case 401:
        return 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
      case 403:
        return 'Bu işlem için yetkiniz bulunmuyor.';
      case 404:
        return 'İstenen kaynak bulunamadı.';
      case 409:
        return 'Bu işlem zaten mevcut.';
      case 422:
        return 'Girilen bilgiler geçersiz. Lütfen kontrol edin.';
      case 500:
        return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      default:
        return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
    }
  };

  const handleRezerveEkle = async () => {
    if (!barcodeInput.trim()) {
      Alert.alert('⚠️ Eksik Bilgi', 'Lütfen lot veya barkod numarası giriniz.');
      return;
    }

    if (!miktarInput.trim() || isNaN(Number(miktarInput))) {
      Alert.alert('⚠️ Geçersiz Miktar', 'Lütfen geçerli bir miktar giriniz.');
      return;
    }

    if (Number(miktarInput) <= 0) {
      Alert.alert('⚠️ Geçersiz Miktar', 'Miktar sıfırdan büyük olmalıdır.');
      return;
    }

    if (!detayData?.satirlar || detayData.satirlar.length === 0) {
      Alert.alert('❌ Rezerve Hatası', 'Rezerve satırı bulunamadı. Lütfen sayfayı yenileyin.');
      return;
    }

    try {
      setSubmitting(true);
      
      // İlk satırı kullan (genellikle tek satır olur)
      const rezerveSatirId = detayData.satirlar[0].rezerveSatirId;
      
      const requestBody = {
        rezerveSatirId: rezerveSatirId,
        terminalId: user?.id || 'MOBILE_TERMINAL',
        kod: barcodeInput.trim(),
        miktar: Number(miktarInput)
      };

      console.log('📤 Gönderilecek veri:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        'https://apicloud.womlistapi.com/api/Rezerve/RezerveIslemSatiriEkle',
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
        
        const userFriendlyMessage = parseApiError(errorText, response.status);
        
        Alert.alert('❌ İşlem Başarısız', userFriendlyMessage, [
          { text: 'Tamam', style: 'default' }
        ]);
        return;
      }

      const responseData = await response.json();
      console.log('✅ API Response:', responseData);

      Alert.alert(
        '✅ Başarılı', 
        'Rezerve işlemi başarıyla eklendi.\n\nEklenen:\n• Barkod/Lot: ' + barcodeInput + '\n• Miktar: ' + miktarInput, 
        [
          {
            text: 'Tamam',
            onPress: () => {
              setBarcodeInput('');
              setMiktarInput('');
              fetchRezerveDetay(); // Listeyi yenile
            }
          }
        ]
      );
    } catch (error) {
      console.error('Rezerve ekleme hatası:', error);
      
      let errorMessage = 'Beklenmeyen bir hata oluştu.';
      
      if (error.message.includes('Network')) {
        errorMessage = 'İnternet bağlantınızı kontrol edin.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Sunucuya bağlanılamıyor. Lütfen tekrar deneyin.';
      }
      
      Alert.alert('❌ Bağlantı Hatası', errorMessage, [
        { text: 'Tamam', style: 'default' }
      ]);
    } finally {
      setSubmitting(false);
    }
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
        <Text style={styles.loadingText}>Rezerve detayı yükleniyor...</Text>
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
        {/* Rezerve Başlık Bilgileri */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.rezerveKod}>{detayData?.rezerveBaslikKod || rezerveData?.rezerveBaslikKod}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(detayData?.rezerveDurumu || rezerveData?.rezerveDurumu) }]}>
              <Text style={styles.statusText}>{detayData?.rezerveDurumu || rezerveData?.rezerveDurumu}</Text>
            </View>
          </View>
          
          <Text style={styles.rezerveAciklama}>
            {detayData?.rezerveAciklamasi || rezerveData?.rezerveAciklamasi}
          </Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Müşteri</Text>
              <Text style={styles.infoValue}>{detayData?.cariAciklamasi || rezerveData?.cariAciklamasi}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Depo</Text>
              <Text style={styles.infoValue}>{detayData?.depoAciklamasi || rezerveData?.depoAciklamasi}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sabit Fiş</Text>
              <Text style={styles.infoValue}>{detayData?.sabitFiskodu || rezerveData?.sabitFisKodu}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Geçerli Gün</Text>
              <Text style={styles.infoValue}>{detayData?.rezerveGecerliGunSayisi || rezerveData?.rezerveGecerliGunSayisi} gün</Text>
            </View>
          </View>
          
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Oluşturulma Tarihi</Text>
              <Text style={styles.dateValue}>
                {formatDate(detayData?.rezerveOlusturulmaTarihi || rezerveData?.rezerveOlusturulmaTarihi)}
              </Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Bitiş Tarihi</Text>
              <Text style={styles.dateValue}>
                {formatDate(detayData?.rezerveBitisTarihi || rezerveData?.rezerveBitisTarihi)}
              </Text>
            </View>
          </View>
        </View>

        {/* Barkod Girişi */}
        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>Yeni Rezerve İşlemi Ekle</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.barcodeInput}
              placeholder="Lot veya Barkod numarasını giriniz"
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
            onPress={handleRezerveEkle}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>REZERVE EKLE</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Rezerve Satırları */}
        {detayData?.satirlar && detayData.satirlar.length > 0 && (
          <View style={styles.satirlarContainer}>
            <Text style={styles.satirlarTitle}>Rezerve Kalemleri ({detayData.satirlar.length})</Text>
            
                         {detayData.satirlar.map((satir, index) => (
               <TouchableOpacity 
                 key={satir.rezerveSatirId} 
                 style={styles.satirCard}
                 onPress={() => {
                   navigation.navigate('RezerveIslemKayitlari', {
                     rezerveSatirId: satir.rezerveSatirId,
                     satirData: satir,
                     rezerveData: detayData
                   });
                 }}
               >
                <View style={styles.satirHeader}>
                  <Text style={styles.malzemeKodu}>{satir.malzemeKodu}</Text>
                  <Text style={styles.birim}>{satir.birimAciklamasi}</Text>
                </View>
                
                <Text style={styles.malzemeAciklama}>{satir.malzemeAciklamasi}</Text>
                
                <View style={styles.miktarRow}>
                  <View style={styles.miktarItem}>
                    <Text style={styles.miktarLabel}>Rezerve</Text>
                    <Text style={styles.miktarValue}>{satir.rezerveAlinacakMiktar}</Text>
                  </View>
                  
                  <View style={styles.miktarItem}>
                    <Text style={styles.miktarLabel}>İşlenen</Text>
                    <Text style={[styles.miktarValue, { color: '#27ae60' }]}>{satir.islenenMiktar}</Text>
                  </View>
                  
                  <View style={styles.miktarItem}>
                    <Text style={styles.miktarLabel}>Kalan</Text>
                    <Text style={[styles.miktarValue, { color: '#e74c3c' }]}>{satir.kalanMiktar}</Text>
                  </View>
                                 </View>
               </TouchableOpacity>
             ))}
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
  rezerveKod: {
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
  rezerveAciklama: {
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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  dateValue: {
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
  inputCard: {
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
  inputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  barcodeInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  cameraButton: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  miktarContainer: {
    marginBottom: 16,
  },
  miktarInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  submitButton: {
    backgroundColor: '#ea5a21',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
