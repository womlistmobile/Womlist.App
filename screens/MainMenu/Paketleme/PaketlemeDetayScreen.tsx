import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQr } from '../../DashBoard/QrContext';

interface PaketlenenSatir {
  paketlenenSatirId: string;
  malzemeKodu: string;
  malzemeAciklamasi: string;
  miktar: number;
  birimAciklamasi: string;
  lotNo: string;
}

interface PaketSatirBilgisi {
  paketSatirId: number;
  malzemeKodu: string;
  malzemeAciklama: string;
  paketlenecekMiktar: number;
  paketlenecekMiktarStr: string;
  paketlenenMiktar: number;
  paketlenenMiktarMiktarStr: string;
  paketlenebilirMiktar: number;
  paketlenebilirMiktarStr: string;
  birimAciklama: string;
}

interface PaketlemeDetayScreenProps {
  route: {
    params: {
      paketId: string;
      paketSatirId: number;
      malzemeKodu: string;
      malzemeAciklama: string;
      selectedDepo: any;
      user: any;
    };
  };
  navigation: any;
}

const PaketlemeDetayScreen: React.FC<PaketlemeDetayScreenProps> = ({ route, navigation }) => {
  const { paketId, paketSatirId, malzemeKodu, malzemeAciklama, selectedDepo, user } = route.params;
  const { scannedValue, setScannedValue } = useQr();
  
  const [paketlenenSatirlar, setPaketlenenSatirlar] = useState<PaketlenenSatir[]>([]);
  const [paketSatirBilgisi, setPaketSatirBilgisi] = useState<PaketSatirBilgisi | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kod, setKod] = useState('');
  const [miktar, setMiktar] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [breakLoading, setBreakLoading] = useState(false);
  const [malzemeInput, setMalzemeInput] = useState('');
  const [malzemeData, setMalzemeData] = useState<any>(null);
  const [malzemeLoading, setMalzemeLoading] = useState(false);

  useEffect(() => {
    fetchPaketlenenSatirlar();
    fetchPaketSatirBilgisi();
  }, []);

  useEffect(() => {
    if (scannedValue) {
      setMalzemeInput(scannedValue);
      setScannedValue('');
    }
  }, [scannedValue]);

  const fetchPaketlenenSatirlar = async () => {
    try {
      const response = await fetch(`https://apicloud.womlistapi.com/api/Paket/PaketlenenSatirlar/${paketSatirId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Paketlenen satırlar API response:', data);
        if (data && data.length > 0) {
          console.log('📦 İlk satır örneği:', data[0]);
          console.log('📦 islemTarihi değeri:', data[0].islemTarihi);
        }
        setPaketlenenSatirlar(data || []);
      } else {
        console.error('Paketlenen satırlar yüklenemedi:', response.status);
        setPaketlenenSatirlar([]);
      }
    } catch (error) {
      console.error('Paketlenen satırlar yüklenirken hata:', error);
      setPaketlenenSatirlar([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPaketSatirBilgisi = async () => {
    try {
      console.log('PaketId:', paketId);
      // PaketSatirlari endpoint'ini paketId ile çağırıyoruz
      const url = `https://apicloud.womlistapi.com/api/Paket/PaketSatirlari/${paketId}`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        // PaketSatirlari'ndan paketSatirId'ye göre satırı buluyoruz
        const paketSatiri = Array.isArray(data) ? data.find(item => item.paketSatirId === paketSatirId) : data;
        if (paketSatiri) {
          setPaketSatirBilgisi({
            paketSatirId: paketSatiri.paketSatirId,
            malzemeKodu: paketSatiri.malzemekodu,
            malzemeAciklama: paketSatiri.malzemeAciklamasi,
            paketlenecekMiktar: paketSatiri.paketlenecekMiktar,
            paketlenecekMiktarStr: paketSatiri.paketlenecekMiktarStr,
            paketlenenMiktar: paketSatiri.paketlenenMiktar,
            paketlenenMiktarMiktarStr: paketSatiri.paketlenenMiktarMiktarStr,
            paketlenebilirMiktar: paketSatiri.paketlenebilirMiktar,
            paketlenebilirMiktarStr: paketSatiri.paketlenebilirMiktarStr,
            birimAciklama: paketSatiri.birimAciklamasi,
          });
        }
      } else {
        const errorText = await response.text();
        console.error('Paket satır bilgisi yüklenemedi:', response.status, errorText);
      }
    } catch (error) {
      console.error('Paket satır bilgisi yüklenirken hata:', error);
    }
  };

  const malzemeSorgula = async () => {
    if (!malzemeInput.trim()) {
      Alert.alert('⚠️ Eksik Bilgi', 'Lütfen barkod numarasını giriniz.');
      return;
    }

    try {
      setMalzemeLoading(true);
      const url = `https://apicloud.womlistapi.com/api/Sorgulama/Malzeme?barkod=${malzemeInput.trim()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.kodu) {
          setMalzemeData(data);
          // Başarılı mesajı gösterme, sadece malzeme bilgilerini göster
        } else {
          Alert.alert('❌ Malzeme Bulunamadı', 'Girilen barkod numarasına ait malzeme bulunamadı.\n\nLütfen barkod numarasını kontrol ediniz.');
          setMalzemeData(null);
        }
      } else {
        Alert.alert('❌ Bağlantı Hatası', 'Malzeme sorgulanırken bir hata oluştu.\n\nLütfen internet bağlantınızı kontrol ediniz.');
        setMalzemeData(null);
      }
    } catch (error) {
      console.error('Malzeme sorgulama hatası:', error);
      Alert.alert('❌ Bağlantı Hatası', 'Malzeme sorgulanırken bir hata oluştu.\n\nLütfen internet bağlantınızı kontrol ediniz.');
    } finally {
      setMalzemeLoading(false);
    }
  };

  const handleAddPaketleme = async () => {
    if (!miktar.trim()) {
      Alert.alert('⚠️ Eksik Bilgi', 'Lütfen paketlenecek miktarı giriniz.');
      return;
    }

    const miktarNum = parseFloat(miktar);
    if (isNaN(miktarNum) || miktarNum <= 0) {
      Alert.alert('⚠️ Geçersiz Miktar', 'Lütfen geçerli bir miktar giriniz.\n\nMiktar 0\'dan büyük olmalıdır.');
      return;
    }

    if (paketSatirBilgisi && miktarNum > paketSatirBilgisi.paketlenebilirMiktar) {
      Alert.alert('⚠️ Miktar Aşımı', `Girilen miktar kalan miktardan fazla!\n\n• Girilen: ${miktarNum}\n• Kalan: ${paketSatirBilgisi.paketlenebilirMiktarStr}`);
      return;
    }

    setAddLoading(true);
    try {
      // Yeni API parametreleri
      const requestBody = {
        paketId: paketId,
        paketSatirId: paketSatirId.toString(),
        miktar: miktarNum,
        kullaniciId: user?.id?.toString() || user?.kullaniciId?.toString() || user?.userId?.toString() || "1"
      };

      console.log('API Request Body:', requestBody);
      console.log('PaketSatirBilgisi:', paketSatirBilgisi);
      console.log('Malzeme Kodu:', paketSatirBilgisi?.malzemeKodu);
      console.log('User Object:', user);
      console.log('User ID:', user?.id);
      console.log('User KullaniciId:', user?.kullaniciId);
      console.log('User UserId:', user?.userId);

      const response = await fetch('https://apicloud.womlistapi.com/api/Paket/PaketlenenSatirEkle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('API Response Status:', response.status);

      if (response.ok) {
        Alert.alert('✅ Başarılı', `Paketleme kaydı başarıyla eklendi!\n\n• Miktar: ${miktarNum}\n• Malzeme: ${malzemeData?.kodu || 'Bilinmiyor'}`);
        setMiktar('');
        setMalzemeInput('');
        setMalzemeData(null);
        fetchPaketlenenSatirlar();
        fetchPaketSatirBilgisi();
      } else {
        const errorText = await response.text();
        console.error('Paketleme ekleme hatası:', response.status, errorText);
        Alert.alert('❌ Hata', `Paketleme kaydı eklenirken hata oluştu.\n\nHata Kodu: ${response.status}`);
      }
    } catch (error) {
      console.error('Paketleme ekleme hatası:', error);
      Alert.alert('❌ Bağlantı Hatası', 'Paketleme kaydı eklenirken bir hata oluştu.\n\nLütfen internet bağlantınızı kontrol ediniz.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeletePaketleme = (paketlenenSatirId: number) => {
    Alert.alert(
      'Paketleme Sil',
      'Bu paketleme kaydını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => deletePaketleme(paketlenenSatirId) },
      ]
    );
  };

  const deletePaketleme = async (paketlenenSatirId: number) => {
    setDeleteLoading(paketlenenSatirId);
    try {
      const response = await fetch(`https://apicloud.womlistapi.com/api/Paket/PaketlenenSatirSil/${paketlenenSatirId}?kullanicild=${user?.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Paketleme kaydı başarıyla silindi.');
        fetchPaketlenenSatirlar();
        fetchPaketSatirBilgisi();
      } else {
        const errorText = await response.text();
        console.error('Paketleme silme hatası:', response.status, errorText);
        Alert.alert('Hata', 'Paketleme kaydı silinirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Paketleme silme hatası:', error);
      Alert.alert('Hata', 'Paketleme kaydı silinirken bir hata oluştu.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleBreakPackaging = () => {
    if (paketlenenSatirlar.length === 0) {
      Alert.alert('Bilgi', 'Silinecek paketleme kaydı bulunmuyor.');
      return;
    }

    Alert.alert(
      'Paketlemeyi Boz',
      `Tüm paketleme kayıtları (${paketlenenSatirlar.length} adet) silinecek. Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Evet, Tümünü Sil', style: 'destructive', onPress: breakAllPackaging },
      ]
    );
  };

  const breakAllPackaging = async () => {
    setBreakLoading(true);
    try {
      // Her paketlenen satırı tek tek silelim
      const deletePromises = paketlenenSatirlar.map(item => 
        fetch(`https://apicloud.womlistapi.com/api/Paket/PaketlenenSatirSil/${item.paketlenenSatirId}?kullanicild=${user?.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const responses = await Promise.all(deletePromises);
      const allSuccessful = responses.every(response => response.ok);

      if (allSuccessful) {
        Alert.alert('Başarılı', 'Tüm paketleme kayıtları başarıyla silindi.');
        fetchPaketlenenSatirlar();
        fetchPaketSatirBilgisi();
      } else {
        Alert.alert('Hata', 'Bazı paketleme kayıtları silinirken hata oluştu.');
      }
    } catch (error) {
      console.error('Paketleme bozma hatası:', error);
      Alert.alert('Hata', 'Paketleme kayıtları silinirken bir hata oluştu.');
    } finally {
      setBreakLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaketlenenSatirlar();
    fetchPaketSatirBilgisi();
  };


  const renderPaketlenenSatir = ({ item }: { item: PaketlenenSatir }) => (
    <View style={styles.paketlenenSatirCard}>
      <View style={styles.paketlenenSatirHeader}>
        <Text style={styles.paketlenenSatirKod}>{item.malzemeKodu}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePaketleme(item.paketlenenSatirId)}
          disabled={deleteLoading === item.paketlenenSatirId}
        >
          {deleteLoading === item.paketlenenSatirId ? (
            <ActivityIndicator size="small" color="#e74c3c" />
          ) : (
            <MaterialCommunityIcons name="delete" size={20} color="#e74c3c" />
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.paketlenenSatirInfo}>
        <Text style={styles.paketlenenSatirMiktar}>
          {item.miktar} {item.birimAciklamasi}
        </Text>
        <Text style={styles.paketlenenSatirKullanici}>
          {item.malzemeAciklamasi}
        </Text>
        {item.lotNo && (
          <Text style={styles.paketlenenSatirLot}>
            Lot: {item.lotNo}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea5a21" />
        <Text style={styles.loadingText}>Paketleme detayları yükleniyor...</Text>
      </View>
    );
  }

  if (paketlenenSatirlar.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.malzemeKodu}>{malzemeKodu}</Text>
          <Text style={styles.malzemeAciklama}>{malzemeAciklama}</Text>
          
          {paketSatirBilgisi && (
            <View style={styles.miktarInfoContainer}>
              <View style={styles.miktarRow}>
                <Text style={styles.miktarLabel}>Paketlenecek:</Text>
                <Text style={styles.miktarValue}>{paketSatirBilgisi.paketlenecekMiktarStr} {paketSatirBilgisi.birimAciklama}</Text>
              </View>
              
              <View style={styles.miktarRow}>
                <Text style={styles.miktarLabel}>Paketlenen:</Text>
                <Text style={[styles.miktarValue, { color: '#27ae60' }]}>
                  {paketSatirBilgisi.paketlenenMiktarMiktarStr} {paketSatirBilgisi.birimAciklama}
                </Text>
              </View>
              
              <View style={styles.miktarRow}>
                <Text style={styles.miktarLabel}>Kalan:</Text>
                <Text style={[styles.miktarValue, { color: '#e74c3c' }]}>
                  {paketSatirBilgisi.paketlenebilirMiktarStr} {paketSatirBilgisi.birimAciklama}
                </Text>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.round((paketSatirBilgisi.paketlenenMiktar / paketSatirBilgisi.paketlenecekMiktar) * 100)}%`,
                        backgroundColor: '#27ae60'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  %{Math.round((paketSatirBilgisi.paketlenenMiktar / paketSatirBilgisi.paketlenecekMiktar) * 100)} Tamamlandı
                </Text>
              </View>
            </View>
          )}
        </View>


        {/* Malzeme Ekleme Barı */}
        <View style={styles.malzemeBarContainer}>
          <Text style={styles.malzemeBarTitle}>Malzeme Ekle</Text>
          
          <View style={styles.malzemeInputContainer}>
            <TextInput
              style={styles.malzemeInput}
              placeholder="Barkod numarasını giriniz veya QR kod okutun"
              value={malzemeInput}
              onChangeText={setMalzemeInput}
            />
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => navigation.navigate('QrScanner')}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={24} color="#ea5a21" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sorgulaButton, malzemeLoading && styles.disabledButton]}
              onPress={malzemeSorgula}
              disabled={malzemeLoading}
            >
              {malzemeLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sorgulaButtonText}>Sorgula</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Malzeme Bilgileri */}
          {malzemeData && (
            <View style={styles.malzemeInfoContainer}>
              <View style={styles.malzemeInfoHeader}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#27ae60" />
                <Text style={styles.malzemeInfoTitle}>Malzeme Bulundu</Text>
              </View>
              <Text style={styles.malzemeKodu}>{malzemeData.kodu}</Text>
              <Text style={styles.malzemeAciklamasi}>{malzemeData.aciklama}</Text>
              {malzemeData.miktar && (
                <Text style={styles.malzemeMiktari}>Mevcut Miktar: {malzemeData.miktar}</Text>
              )}
            </View>
          )}
        </View>

        {/* Ekleme Formu */}
        <View style={styles.addFormContainer}>
          <Text style={styles.addFormTitle}>Yeni Paketleme Ekle</Text>
          
          <View style={styles.inputRow}>
            <TextInput
              style={styles.formInput}
              placeholder="Miktar giriniz"
              value={miktar}
              onChangeText={setMiktar}
              keyboardType="numeric"
            />
          </View>
          
          {miktar && paketSatirBilgisi && (
            <View style={styles.validationContainer}>
              {parseFloat(miktar) > paketSatirBilgisi.paketlenebilirMiktar ? (
                <Text style={styles.warningText}>
                  ⚠️ Girilen miktar kalan miktardan fazla!
                </Text>
              ) : (
                <Text style={styles.successText}>
                  ✅ Bu miktar paketlenebilir
                </Text>
              )}
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.addFormButton, addLoading && styles.disabledButton]}
            onPress={handleAddPaketleme}
            disabled={addLoading}
          >
            {addLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                <Text style={styles.addFormButtonText}>Paketleme Ekle</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={64} color="#bdc3c7" />
          <Text style={styles.emptyText}>
            Bu ürün için henüz paketleme işlemi yapılmamış.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.malzemeKodu}>{malzemeKodu}</Text>
        <Text style={styles.malzemeAciklama}>{malzemeAciklama}</Text>
        
        {paketSatirBilgisi && (
          <View style={styles.miktarInfoContainer}>
            <View style={styles.miktarRow}>
              <Text style={styles.miktarLabel}>Paketlenecek:</Text>
              <Text style={styles.miktarValue}>{paketSatirBilgisi.paketlenecekMiktarStr} {paketSatirBilgisi.birimAciklama}</Text>
            </View>
            
            <View style={styles.miktarRow}>
              <Text style={styles.miktarLabel}>Paketlenen:</Text>
              <Text style={[styles.miktarValue, { color: '#27ae60' }]}>
                {paketSatirBilgisi.paketlenenMiktarMiktarStr} {paketSatirBilgisi.birimAciklama}
              </Text>
            </View>
            
            <View style={styles.miktarRow}>
              <Text style={styles.miktarLabel}>Kalan:</Text>
              <Text style={[styles.miktarValue, { color: '#e74c3c' }]}>
                {paketSatirBilgisi.paketlenebilirMiktarStr} {paketSatirBilgisi.birimAciklama}
              </Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.round((paketSatirBilgisi.paketlenenMiktar / paketSatirBilgisi.paketlenecekMiktar) * 100)}%`,
                      backgroundColor: '#27ae60'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                %{Math.round((paketSatirBilgisi.paketlenenMiktar / paketSatirBilgisi.paketlenecekMiktar) * 100)} Tamamlandı
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Malzeme Ekleme Barı */}
      <View style={styles.malzemeBarContainer}>
        <Text style={styles.malzemeBarTitle}>Malzeme Ekle</Text>
        
        <View style={styles.malzemeInputContainer}>
          <TextInput
            style={styles.malzemeInput}
            placeholder="Barkod numarasını giriniz veya QR kod okutun"
            value={malzemeInput}
            onChangeText={setMalzemeInput}
          />
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => navigation.navigate('QrScanner')}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#ea5a21" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sorgulaButton, malzemeLoading && styles.disabledButton]}
            onPress={malzemeSorgula}
            disabled={malzemeLoading}
          >
            {malzemeLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sorgulaButtonText}>Sorgula</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Malzeme Bilgileri */}
        {malzemeData && (
          <View style={styles.malzemeInfoContainer}>
            <View style={styles.malzemeInfoHeader}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#27ae60" />
              <Text style={styles.malzemeInfoTitle}>Malzeme Bulundu</Text>
            </View>
            <Text style={styles.malzemeKodu}>{malzemeData.kodu}</Text>
            <Text style={styles.malzemeAciklamasi}>{malzemeData.aciklama}</Text>
            {malzemeData.miktar && (
              <Text style={styles.malzemeMiktari}>Mevcut Miktar: {malzemeData.miktar}</Text>
            )}
          </View>
        )}
      </View>

      {/* Ekleme Formu */}
      <View style={styles.addFormContainer}>
        <Text style={styles.addFormTitle}>Yeni Paketleme Ekle</Text>
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.formInput}
            placeholder="Miktar giriniz"
            value={miktar}
            onChangeText={setMiktar}
            keyboardType="numeric"
          />
        </View>
        
        {miktar && paketSatirBilgisi && (
          <View style={styles.validationContainer}>
            {parseFloat(miktar) > paketSatirBilgisi.paketlenebilirMiktar ? (
              <Text style={styles.warningText}>
                ⚠️ Girilen miktar kalan miktardan fazla!
              </Text>
            ) : (
              <Text style={styles.successText}>
                ✅ Bu miktar paketlenebilir
              </Text>
            )}
          </View>
        )}
        
        <View style={styles.formButtonRow}>
          <TouchableOpacity
            style={[styles.addFormButton, addLoading && styles.disabledButton]}
            onPress={handleAddPaketleme}
            disabled={addLoading}
          >
            {addLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                <Text style={styles.addFormButtonText}>Ekle</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.breakButton, breakLoading && styles.disabledButton]}
            onPress={handleBreakPackaging}
            disabled={breakLoading}
          >
            {breakLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="package-variant-remove" size={18} color="#fff" />
                <Text style={styles.breakButtonText}>Paketlemeyi Boz</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={paketlenenSatirlar}
        renderItem={renderPaketlenenSatir}
        keyExtractor={(item) => item.paketlenenSatirId.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  headerCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  malzemeKodu: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  malzemeAciklama: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  miktarInfoContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  miktarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  malzemeBarContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  malzemeBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  malzemeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  malzemeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  qrButton: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sorgulaButton: {
    backgroundColor: '#ea5a21',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sorgulaButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  malzemeInfoContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27ae60',
    borderLeftWidth: 4,
  },
  malzemeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  malzemeInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  malzemeKodu: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  malzemeAciklamasi: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 4,
  },
  malzemeMiktari: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  addFormContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  formInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addFormButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addFormButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  breakButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  breakButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  paketlenenSatirCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paketlenenSatirHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paketlenenSatirKod: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fdf2f2',
  },
  paketlenenSatirInfo: {
    gap: 4,
  },
  paketlenenSatirMiktar: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  paketlenenSatirKullanici: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  paketlenenSatirLot: {
    fontSize: 11,
    color: '#3498db',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  debugText: {
    fontSize: 12,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalMiktarContainer: {
    marginTop: 8,
  },
  modalMiktarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalMiktarLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  modalMiktarValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  modalProgressContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  modalProgressBar: {
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalProgressText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  validationContainer: {
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addModalButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
});

export default PaketlemeDetayScreen;
