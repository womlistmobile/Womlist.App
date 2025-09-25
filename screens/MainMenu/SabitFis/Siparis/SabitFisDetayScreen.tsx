import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert,
  TextInput, Modal, Dimensions, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;

type RootStackParamList = {
  SabitFisDetay: {
    fisId: string;
    fisNo: string;
    cariBilgisi: string;
    tarih: string;
    depoId: string;
    userId: string;
    girisCikisTuru: 1 | 2;
  };
};

interface SatirItem {
  satirId: string;
  malzemeId: string;
  birimId: string; // String olarak tutulacak ama integer değer
  kodu: string;
  malzeme: string;
  istenenMiktar: number;
  okutulanMiktar: number;
  birim: string;
  malzemeTemelBilgiId: string;
  carpan1: number;
  carpan2: number;
  depoId: string;
  lotNo?: string;       
  lotlu?: boolean;
  sonKullanmaTarihi?: string;
}

export default function SabitFisDetayScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'SabitFisDetay'>>();
  const navigation = useNavigation<any>();
  const { fisId, fisNo, cariBilgisi, tarih, depoId, userId, girisCikisTuru } = route.params;

  const [activeTab, setActiveTab] = useState<'Genel' | 'Satirlar' | 'Okunan' | 'Kontrol'>('Genel');
  const [satirlar, setSatirlar] = useState<SatirItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [barkodInput, setBarkodInput] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<SatirItem | null>(null);
  const [girilmisMiktar, setGirilmisMiktar] = useState('');
  const [lotNo, setLotNo] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferCompleted, setTransferCompleted] = useState(false);
  const [showAutoApproveModal, setShowAutoApproveModal] = useState(false);
  const [autoApproveStats, setAutoApproveStats] = useState({
    toplam: 0,
    onaylanan: 0,
    lotlu: 0,
    lotsuz: 0,
    bilinmeyen: 0
  });

  // SKT Kontrol Modal States
  const [showSktModal, setShowSktModal] = useState(false);
  const [sktModalData, setSktModalData] = useState<{
    malzeme: string;
    kodu: string;
    miktar: number;
    satirId: string;
  } | null>(null);
  const [sktTarihi, setSktTarihi] = useState('');
  const [sktLoading, setSktLoading] = useState(false);
  const [sktWarningModal, setSktWarningModal] = useState(false);
  const [sktWarningData, setSktWarningData] = useState<any>(null);

  useEffect(() => {
    fetch(`https://apicloud.womlistapi.com/api/SabitFis/FisSatirlari/${fisId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('API verisi:', data);
        console.log('İlk item tüm alanları:', data[0]);
        console.log('İlk item tüm field isimleri:', Object.keys(data[0] || {}));
        console.log('Lot ile ilgili fieldlar:', Object.keys(data[0] || {}).filter(key => key.toLowerCase().includes('lot')));
        console.log('🔍 API Response - Tüm birim fieldları:', Object.keys(data[0] || {}).filter(key => key.toLowerCase().includes('birim')));
        console.log('🔍 API Response - İlk item birim detayları:', {
          birimId: data[0]?.birimId,
          birim: data[0]?.birim,
          birimAciklamasi: data[0]?.birimAciklamasi,
          birimKodu: data[0]?.birimKodu,
          tip: typeof data[0]?.birimId
        });
        console.log('🔍 API Response - Tüm data:', JSON.stringify(data, null, 2));
        
        // BirimId'yi bulmak için tüm field'ları kontrol et
        if (data && data.length > 0) {
          const firstItem = data[0];
          console.log('🔍 İlk item tüm field isimleri:', Object.keys(firstItem));
          console.log('🔍 İlk item tüm değerleri:', firstItem);
          
          // Birim ile ilgili tüm field'ları bul
          const birimFields = Object.keys(firstItem).filter(key => 
            key.toLowerCase().includes('birim') || 
            key.toLowerCase().includes('unit') ||
            key.toLowerCase().includes('id')
          );
          console.log('🔍 Birim/Unit/Id fieldları:', birimFields);
          
          birimFields.forEach(field => {
            console.log(`🔍 ${field}:`, firstItem[field], 'tip:', typeof firstItem[field]);
          });
        }
        
        const formatted = data.map((item: any) => {
          console.log(`Item ${item.kodu} - lotluMu:`, item.lotluMu, 'tip:', typeof item.lotluMu);
          console.log(`Item ${item.kodu} - tüm fieldlar:`, Object.keys(item));
          console.log(`Item ${item.kodu} - birimId:`, item.birimId, 'birim:', item.birim);
          
          // BirimId değerini güvenli şekilde belirle
          let safeBirimId = item.birimId;
          if (!safeBirimId || safeBirimId === null || safeBirimId === undefined) {
            // Eğer birimId yoksa, birim kodu veya açıklamasına göre varsayılan değer ata
            if (item.birim === 'Adet' || item.birimAciklamasi === 'Adet') {
              safeBirimId = "1"; // Adet için varsayılan ID
            } else if (item.birim === 'Kg' || item.birimAciklamasi === 'Kg') {
              safeBirimId = "2"; // Kg için varsayılan ID
            } else if (item.birim === 'Lt' || item.birimAciklamasi === 'Lt') {
              safeBirimId = "3"; // Lt için varsayılan ID
            } else {
              safeBirimId = "1"; // Genel varsayılan
            }
          } else {
            // Eğer birimId varsa, string olarak tut ama geçerli olduğundan emin ol
            safeBirimId = safeBirimId.toString();
          }
          
          console.log(`Item ${item.kodu} - safeBirimId:`, safeBirimId);
          
          return {
            satirId: item.satirId,
            malzemeId: item.malzemeId,
            birimId: safeBirimId,
            kodu: item.kodu,
            malzeme: item.malzeme,
            istenenMiktar: item.istenenMiktar,
            okutulanMiktar: item.okunanMiktar,
            birim: item.birim,
            malzemeTemelBilgiId: item.malzemeId,
            carpan1: item.carpan1 || 1,
            carpan2: item.carpan2 || 1,
            depoId,
            lotlu: item.lotluMu, // API'den gelen lotluMu field'ını kullan
          };
        });
        console.log('Formatlanmis veri:', formatted);
        setSatirlar(formatted);
      })
      .catch((err) => console.error('Hata:', err))
      .finally(() => setLoading(false));
  }, [fisId]);

  const otomatikOnayla = () => {
    console.log('Otomatik onaylama başlatıldı');
    console.log('Mevcut satirlar:', satirlar);
    
    // Lot analizi yap
    const lotluUrunler = satirlar.filter(item => item.lotlu === true);
    const lotsuzUrunler = satirlar.filter(item => item.lotlu === false);
    const lotBilinmeyen = satirlar.filter(item => item.lotlu === undefined || item.lotlu === null);
    
    console.log('Lot analizi detayları:');
    console.log('- Lotlu ürünler:', lotluUrunler.map(item => ({ kodu: item.kodu, lotlu: item.lotlu })));
    console.log('- Lotsuz ürünler:', lotsuzUrunler.map(item => ({ kodu: item.kodu, lotlu: item.lotlu })));
    console.log('- Bilinmeyen ürünler:', lotBilinmeyen.map(item => ({ kodu: item.kodu, lotlu: item.lotlu })));
    console.log('Özet:', { lotlu: lotluUrunler.length, lotsuz: lotsuzUrunler.length, bilinmeyen: lotBilinmeyen.length });
    
    // Eğer lot durumu bilinmeyen ürünler varsa uyarı ver
    if (lotBilinmeyen.length > 0) {
      Alert.alert(
        'Lot Durumu Bilinmiyor',
        `${lotBilinmeyen.length} adet ürünün lot durumu bilinmiyor. Bu ürünler için önce barkod okutarak lot durumunu belirlemeniz gerekmektedir.`,
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Devam Et', onPress: () => performAutoApprove() }
        ]
      );
      return;
    }
    
    performAutoApprove();
  };

  const performAutoApprove = () => {
    // Lot analizi yap
    const lotluUrunler = satirlar.filter(item => item.lotlu === true);
    const lotsuzUrunler = satirlar.filter(item => item.lotlu === false);
    const lotBilinmeyen = satirlar.filter(item => item.lotlu === undefined || item.lotlu === null);
    
    // Sadece lotsuz ürünleri otomatik onayla
    const updated = satirlar.map((item) => {
      if (item.lotlu === false) {
        return {
          ...item,
          okutulanMiktar: item.istenenMiktar,
        };
      }
      return item;
    });
    
    // İstatistikleri hesapla
    const stats = {
      toplam: satirlar.length,
      onaylanan: lotsuzUrunler.length,
      lotlu: lotluUrunler.length,
      lotsuz: lotsuzUrunler.length,
      bilinmeyen: lotBilinmeyen.length
    };
    
    console.log('Otomatik onaylama istatistikleri:', stats);
    
    setAutoApproveStats(stats);
    setSatirlar(updated);
    setShowAutoApproveModal(true);
    setActiveTab('Kontrol');
  };

  const barkodSorgula = async () => {
    if (!barkodInput) return;
    try {
      const res = await fetch(`https://apicloud.womlistapi.com/api/Sorgulama/Malzeme?barkod=${barkodInput}`);
      const data = await res.json();
      const urunKodu = data.kodu;
      const lotlu = data.lotlu; 
  
      const kayit = satirlar.find(s => s.kodu === urunKodu);
      if (!kayit) {
        Alert.alert('Hatalı Barkod', 'Bu barkoda ait ürün bulunamadı.');
        return;
      }

      // Çıkış bölümünde lot numarası otomatik olarak alınacak
      let lotNumarasi = '';
      if (lotlu) {
        // Lotlu ürünler için lot numarası iste
        Alert.prompt(
          'Lot Numarası',
          'Bu ürün lotlu olduğu için lot numarası gereklidir:',
          [
            { text: 'İptal', style: 'cancel' },
            { 
              text: 'Tamam', 
              onPress: (lotNo) => {
                if (lotNo && lotNo.trim()) {
                  setModalData({ ...kayit, lotlu }); 
                  setGirilmisMiktar('');
                  setLotNo(lotNo.trim());
                  setModalVisible(true);
                } else {
                  Alert.alert('Hata', 'Lot numarası boş olamaz.');
                }
              }
            }
          ],
          'plain-text',
          '',
          'default'
        );
        return;
      } else {
        // Lotsuz ürünler için lot numarası boş
        setModalData({ ...kayit, lotlu }); 
        setGirilmisMiktar('');
        setLotNo(''); // Lotsuz ürünler için boş
        setModalVisible(true);
      }
    } catch {
      Alert.alert('Hata', 'Sunucudan veri alınamadı.');
    }
  };
  

  const kaydetModal = () => {
    if (!modalData || !girilmisMiktar) {
      Alert.alert('Hata', 'Lütfen miktar giriniz.');
      return;
    }

    const miktar = parseFloat(girilmisMiktar);
    if (isNaN(miktar) || miktar <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar giriniz.');
      return;
    }

    if (miktar > modalData.istenenMiktar) {
      Alert.alert('Hata', `Girilen miktar (${miktar}) istenen miktardan (${modalData.istenenMiktar}) fazla olamaz.`);
      return;
    }

    // Lot numarası artık otomatik olarak alındı, kontrol gerekmiyor

    // Mevcut okutulan miktarı kontrol et
    const mevcutOkutulan = satirlar.find(s => s.satirId === modalData.satirId)?.okutulanMiktar || 0;
    const toplamOkutulan = mevcutOkutulan + miktar;
    
    if (toplamOkutulan > modalData.istenenMiktar) {
      Alert.alert('Hata', `Toplam okutulan miktar (${toplamOkutulan}) istenen miktardan (${modalData.istenenMiktar}) fazla olamaz.`);
      return;
    }

    const guncellenmis = satirlar.map(s =>
      s.satirId === modalData.satirId
        ? { ...s, okutulanMiktar: toplamOkutulan, lotNo: lotNo || s.lotNo, lotlu: modalData.lotlu }
        : s
    );

    setSatirlar(guncellenmis);
    setModalVisible(false);
    setModalData(null);
    setGirilmisMiktar('');
    setLotNo('');
  };

  // SKT Tarihi Kaydetme Fonksiyonu
  const sktTarihiKaydet = () => {
    if (!sktModalData || !sktTarihi.trim()) {
      Alert.alert('Hata', 'Lütfen SKT tarihini giriniz.');
      return;
    }

    // Tarih formatını kontrol et
    const tarihRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!tarihRegex.test(sktTarihi)) {
      Alert.alert('Hata', 'Lütfen tarihi YYYY-MM-DD formatında giriniz. (Örn: 2025-12-31)');
      return;
    }

    // Satırı güncelle
    const guncellenmis = satirlar.map(s =>
      s.satirId === sktModalData.satirId
        ? { ...s, sonKullanmaTarihi: sktTarihi }
        : s
    );

    setSatirlar(guncellenmis);
    setSktModal(false);
    setSktModalData(null);
    setSktTarihi('');

    // Tekrar SKT kontrolü yap
    const okutulanlar = guncellenmis.filter(x => x.okutulanMiktar > 0);
    sktKontroluYap(okutulanlar).then((sonuc) => {
      if (sonuc) {
        // SKT kontrolü başarılı, devam et
        navigation.navigate('EkBilgiler', {
          fisId,
          depoId,
          selectedItems: okutulanlar,
          userId,
          girisCikisTuru,
          onTransferComplete: () => {
            setTransferCompleted(true);
            setIsTransferring(false);
          },
          onTransferStart: () => {
            setIsTransferring(true);
          }
        });
      }
    });
  };

  // SKT Kontrol Fonksiyonu
  const sktKontroluYap = async (selectedItems: any[]) => {
    try {
      setSktLoading(true);
      
      const requestBody = {
        kod: "TEMP_KOD", // Geçici kod, EkBilgilerScreen'de gerçek kod oluşturulacak
        tarih: new Date().toLocaleDateString('tr-TR').replace(/\./g, '-'),
        beyannameKod: '',
        beyannameTarih: 'Dummy Data',
        stokFisTuru: 3, // SabitFis için 3
        kaynakDepoId: depoId,
        kullaniciTerminalId: userId,
        destinasyonDepoId: null,
        satirlar: selectedItems.map((item: any) => {
          // Gerçek birimId değerini kullan (GUID formatında)
          console.log(`🔍 SKT Kontrol - BirimId Debug - Item: ${item.kodu}, Original: ${item.birimId}, Using GUID`);
          
          return {
            depoId: item.depoId,
            adresId: null,
            stokId: null,
            sayimHareketId: null, // Düzeltildi: sayinHareketId -> sayimHareketId
            sabitFisHareketleriId: item.satirId,
            transferHareketId: null,
            malzemeTemelBilgiId: item.malzemeTemelBilgiId || item.malzemeId,
            kullaniciTerminalId: userId,
            birimId: item.birimId, // Gerçek birimId değerini kullan (GUID)
            carpan1: item.carpan1 || 1,
            carpan2: item.carpan2 || 1,
            lotNo: item.lotNo || null,
            miktar: item.okutulanMiktar,
            sonkullanmaTarihi: item.sonKullanmaTarihi || null,
            girisCikisTuru: girisCikisTuru,
          };
        }),
      };

      console.log('SKT Kontrol Request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://apicloud.womlistapi.com/api/Stok/SktKontroluYap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log('SKT Kontrol Response:', result);

      if (result.durum) {
        // SKT kontrolü başarılı
        if (result.sktüyarisi?.sktUyarisivar) {
          // SKT uyarısı var - çıkış bölümünde uyarı göster
          if (girisCikisTuru === 2) {
            setSktWarningData(result.sktüyarisi);
            setSktWarningModal(true);
            return false; // Devam etme, uyarı göster
          }
        }
        return true; // Devam et
      } else {
        // SKT kontrolü başarısız - malzeme SKT tarihi eksik
        const eksikSktMalzemeler = selectedItems.filter((item: any) => !item.sonKullanmaTarihi);
        if (eksikSktMalzemeler.length > 0) {
          const ilkEksik = eksikSktMalzemeler[0];
          setSktModalData({
            malzeme: ilkEksik.malzeme,
            kodu: ilkEksik.kodu,
            miktar: ilkEksik.okutulanMiktar,
            satirId: ilkEksik.satirId
          });
          setSktModal(true);
          return false; // Devam etme, SKT tarihi gir
        }
        return true;
      }
    } catch (error) {
      console.error('SKT Kontrol Hatası:', error);
      Alert.alert('Hata', 'SKT kontrolü yapılamadı. Lütfen tekrar deneyiniz.');
      return false;
    } finally {
      setSktLoading(false);
    }
  };

  const handleVeriTransferi = async () => {
    if (transferCompleted) {
      Alert.alert('Bilgi', 'Bu fiş için veri transferi zaten tamamlanmış.');
      return;
    }

    if (isTransferring) {
      Alert.alert('Bilgi', 'Veri transferi devam ediyor, lütfen bekleyiniz.');
      return;
    }

    const okutulanlar = satirlar.filter(x => x.okutulanMiktar > 0);
    if (okutulanlar.length === 0) {
      Alert.alert('Hata', 'Okutulan ürün yok.');
      return;
    }

    // Miktar kontrolü
    const miktarHatali = okutulanlar.some(item => item.okutulanMiktar > item.istenenMiktar);
    if (miktarHatali) {
      Alert.alert('Hata', 'Bazı ürünlerde okutulan miktar istenen miktardan fazla. Lütfen kontrol ediniz.');
      return;
    }

    // SKT kontrolü yap
    const sktKontrolSonucu = await sktKontroluYap(okutulanlar);
    if (!sktKontrolSonucu) {
      return; // SKT kontrolü başarısız, modal açıldı
    }

    navigation.navigate('EkBilgiler', {
      fisId,
      depoId,
      selectedItems: okutulanlar,
      userId,
      girisCikisTuru,
      onTransferComplete: () => {
        setTransferCompleted(true);
        setIsTransferring(false);
      },
      onTransferStart: () => {
        setIsTransferring(true);
      }
    });
  };

  const renderItem = (item: SatirItem, isOkunan = false) => (
    <View style={styles.card}>
      <View style={styles.itemHeader}>
        <Text style={styles.title}>{item.kodu}</Text>
        {item.lotlu !== undefined && (
          <View style={[styles.lotBadge, { backgroundColor: item.lotlu ? '#e74c3c' : '#27ae60' }]}>
            <Text style={styles.lotBadgeText}>
              {item.lotlu ? 'LOTLU' : 'LOTSUZ'}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.title}>{item.malzeme}</Text>
      {isOkunan && <Text style={styles.info}><Text style={styles.bold}>Lot No:</Text> {item.lotNo || '-'}</Text>}
      <View style={styles.rowBetween}>
        <Text style={styles.info}><Text style={styles.bold}>İstenen:</Text> {item.istenenMiktar}</Text>
        <Text style={styles.info}><Text style={styles.bold}>Okutulan:</Text> {item.okutulanMiktar}</Text>
      </View>
      <Text style={styles.info}><Text style={styles.bold}>Birim:</Text> {item.birim}</Text>
    </View>
  );

  const renderGenelBilgi = () => {
    const toplamIstenen = satirlar.reduce((total, item) => total + item.istenenMiktar, 0);
    const toplamOkutulan = satirlar.reduce((total, item) => total + item.okutulanMiktar, 0);
    const tamamlanmaOrani = toplamIstenen > 0 ? Math.round((toplamOkutulan / toplamIstenen) * 100) : 0;
    
    // Lot analizi
    const lotluUrunler = satirlar.filter(item => item.lotlu === true).length;
    const lotsuzUrunler = satirlar.filter(item => item.lotlu === false).length;
    const lotBilinmeyen = satirlar.filter(item => item.lotlu === undefined).length;
    
    return (
      <View style={styles.card}>
        <Text style={styles.title}>📋 Fiş Bilgileri</Text>
        <Text style={styles.info}><Text style={styles.bold}>Fiş No:</Text> {fisNo}</Text>
        <Text style={styles.info}><Text style={styles.bold}>Cari:</Text> {cariBilgisi}</Text>
        <Text style={styles.info}><Text style={styles.bold}>Tarih:</Text> {tarih}</Text>
        
        <View style={styles.separator} />
        
        <Text style={styles.title}>📊 Özet Bilgiler</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.info}><Text style={styles.bold}>Toplam İstenen:</Text> {toplamIstenen}</Text>
          <Text style={styles.info}><Text style={styles.bold}>Toplam Okutulan:</Text> {toplamOkutulan}</Text>
        </View>
        <Text style={styles.info}><Text style={styles.bold}>Satır Sayısı:</Text> {satirlar.length}</Text>
        <Text style={styles.info}><Text style={styles.bold}>Tamamlanma:</Text> %{tamamlanmaOrani}</Text>
        
        
        {toplamIstenen > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${tamamlanmaOrani}%`,
                    backgroundColor: tamamlanmaOrani === 100 ? '#27ae60' : '#f39c12'
                  }
                ]} 
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>

        <View style={styles.tabContainer}>
          {['Genel', 'Satirlar', 'Okunan', 'Kontrol'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'Satirlar' ? 'Satırlar' : tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#ea5a21" />
          ) : (
            <>
              {activeTab === 'Genel' && (
                <>
                  {renderGenelBilgi()}
                  <TouchableOpacity style={styles.button} onPress={otomatikOnayla}>
                    <Text style={styles.buttonText}>OTOMATİK ONAYLA</Text>
                  </TouchableOpacity>
                </>
              )}

              {activeTab === 'Satirlar' && (
                <FlatList data={satirlar} renderItem={({ item }) => renderItem(item)} keyExtractor={(item) => item.satirId} />
              )}

              {activeTab === 'Okunan' && (
                <>
                  <View style={styles.searchContainer}>
                    <TextInput
                      placeholder="Ürün Barkodu Giriniz"
                      value={barkodInput}
                      onChangeText={setBarkodInput}
                      style={styles.searchInput}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={barkodSorgula}>
                      <Text style={styles.searchButtonText}>Ara</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={satirlar.filter((s) => s.okutulanMiktar > 0)}
                    renderItem={({ item }) => renderItem(item, true)}
                    keyExtractor={(item) => item.satirId}
                  />
                </>
              )}

              {activeTab === 'Kontrol' && (
                <>
                  {satirlar.filter((s) => s.okutulanMiktar > 0).length === 0 ? (
                    <Text style={styles.emptyText}>Hiç Ürün Okutulmadı</Text>
                  ) : (
                    <>
                      <FlatList
                        data={satirlar.filter((s) => s.okutulanMiktar > 0)}
                        renderItem={({ item }) => renderItem(item)}
                        keyExtractor={(item) => item.satirId}
                      />
                      <TouchableOpacity 
                        style={[
                          styles.button, 
                          (isTransferring || transferCompleted) && styles.disabledButton
                        ]} 
                        onPress={handleVeriTransferi}
                        disabled={isTransferring || transferCompleted}
                      >
                        {isTransferring ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.buttonText}>TRANSFER EDİLİYOR...</Text>
                          </View>
                        ) : transferCompleted ? (
                          <Text style={styles.buttonText}>✅ TRANSFER TAMAMLANDI</Text>
                        ) : (
                          <Text style={styles.buttonText}>VERİ TRANSFERİ</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </View>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>{modalData?.malzeme}</Text>
                <Text style={styles.info}><Text style={styles.bold}>Kod:</Text> {modalData?.kodu}</Text>
                <Text style={styles.info}><Text style={styles.bold}>İstenen:</Text> {modalData?.istenenMiktar}</Text>
                
                {modalData?.lotlu !== undefined && (
                  <View style={styles.modalLotInfo}>
                    <Text style={styles.modalLotLabel}>Lot Durumu:</Text>
                    <View style={[styles.modalLotBadge, { backgroundColor: modalData.lotlu ? '#e74c3c' : '#27ae60' }]}>
                      <Text style={styles.modalLotBadgeText}>
                        {modalData.lotlu ? 'LOTLU ÜRÜN' : 'LOTSUZ ÜRÜN'}
                      </Text>
                    </View>
                  </View>
                )}
                
                <TextInput
                  placeholder="Miktar"
                  value={girilmisMiktar}
                  onChangeText={setGirilmisMiktar}
                  keyboardType="numeric"
                  style={styles.input}
                />
                
                {/* Lot numarası artık otomatik olarak alındı, sadece gösteriyoruz */}
                {lotNo && (
                  <View style={styles.lotDisplayContainer}>
                    <Text style={styles.lotDisplayLabel}>Lot No:</Text>
                    <Text style={styles.lotDisplayValue}>{lotNo}</Text>
                  </View>
                )}
                
                {modalData?.lotlu && !lotNo && (
                  <Text style={styles.lotWarningText}>
                    ⚠️ Bu ürün lotlu olduğu için lot numarası gereklidir.
                  </Text>
                )}
                
                <TouchableOpacity style={styles.button} onPress={kaydetModal}>
                  <Text style={styles.buttonText}>KAYDET</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Otomatik Onaylama Modal */}
        <Modal visible={showAutoApproveModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>🤖 Otomatik Onaylama Tamamlandı</Text>
              
              <View style={styles.autoApproveStats}>
                <Text style={styles.autoApproveSubtitle}>📊 İşlem Özeti</Text>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Toplam Ürün:</Text>
                  <Text style={styles.statValue}>{autoApproveStats.toplam}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>✅ Onaylanan (Lotsuz):</Text>
                  <Text style={[styles.statValue, { color: '#27ae60' }]}>{autoApproveStats.onaylanan}</Text>
                </View>
                
                {autoApproveStats.lotlu > 0 && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>⚠️ Lotlu Ürünler:</Text>
                    <Text style={[styles.statValue, { color: '#e74c3c' }]}>{autoApproveStats.lotlu}</Text>
                  </View>
                )}
                
                {autoApproveStats.bilinmeyen > 0 && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>❓ Lot Durumu Bilinmeyen:</Text>
                    <Text style={[styles.statValue, { color: '#f39c12' }]}>{autoApproveStats.bilinmeyen}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.lotluWarning}>
                <Text style={styles.warningTitle}>ℹ️ Bilgi</Text>
                <Text style={styles.warningText}>
                  {autoApproveStats.onaylanan > 0 && `${autoApproveStats.onaylanan} adet lotsuz ürün otomatik onaylandı.`}
                  {autoApproveStats.lotlu > 0 && ` ${autoApproveStats.lotlu} adet lotlu ürün`}
                  {autoApproveStats.bilinmeyen > 0 && ` ${autoApproveStats.bilinmeyen} adet lot durumu bilinmeyen ürün`}
                  {(autoApproveStats.lotlu > 0 || autoApproveStats.bilinmeyen > 0) && ' için lot bilgilerini manuel olarak girmeniz gerekmektedir.'}
                </Text>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.okButton} 
                  onPress={() => setShowAutoApproveModal(false)}
                >
                  <Text style={styles.okButtonText}>Tamam</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* SKT Tarihi Giriş Modal */}
        <Modal visible={showSktModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>📅 SKT Tarihi Gerekli</Text>
              
              <View style={styles.sktModalInfo}>
                <Text style={styles.sktModalLabel}>Malzeme:</Text>
                <Text style={styles.sktModalValue}>{sktModalData?.malzeme}</Text>
              </View>
              
              <View style={styles.sktModalInfo}>
                <Text style={styles.sktModalLabel}>Kod:</Text>
                <Text style={styles.sktModalValue}>{sktModalData?.kodu}</Text>
              </View>
              
              <View style={styles.sktModalInfo}>
                <Text style={styles.sktModalLabel}>Miktar:</Text>
                <Text style={styles.sktModalValue}>{sktModalData?.miktar}</Text>
              </View>
              
              <View style={styles.sktWarningBox}>
                <Text style={styles.sktWarningText}>
                  ⚠️ Bu malzeme için son kullanım tarihi (SKT) girilmesi zorunludur.
                </Text>
              </View>
              
              <TextInput
                placeholder="SKT Tarihi (YYYY-MM-DD)"
                value={sktTarihi}
                onChangeText={setSktTarihi}
                style={styles.sktInput}
                keyboardType="numeric"
              />
              
              <Text style={styles.sktFormatText}>
                Örnek: 2025-12-31
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.okButton, { backgroundColor: '#e74c3c' }]} 
                  onPress={() => {
                    setSktModal(false);
                    setSktModalData(null);
                    setSktTarihi('');
                  }}
                >
                  <Text style={styles.okButtonText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.okButton, { backgroundColor: '#27ae60' }]} 
                  onPress={sktTarihiKaydet}
                  disabled={sktLoading}
                >
                  {sktLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.okButtonText}>Kaydet</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* SKT Uyarı Modal (Çıkış Bölümü) */}
        <Modal visible={sktWarningModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>⚠️ SKT Uyarısı</Text>
              
              <View style={styles.sktWarningBox}>
                <Text style={styles.sktWarningText}>
                  Bazı malzemelerin son kullanım tarihi yaklaşmıştır. Lütfen kontrol ediniz.
                </Text>
              </View>
              
              {sktWarningData?.uyariDetaylari && sktWarningData.uyariDetaylari.length > 0 && (
                <View style={styles.sktDetailsContainer}>
                  <Text style={styles.sktDetailsTitle}>Uyarı Detayları:</Text>
                  {sktWarningData.uyariDetaylari.map((uyari: any, index: number) => (
                    <Text key={index} style={styles.sktDetailText}>
                      • {uyari}
                    </Text>
                  ))}
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.okButton, { backgroundColor: '#f39c12' }]} 
                  onPress={() => {
                    setSktWarningModal(false);
                    setSktWarningData(null);
                  }}
                >
                  <Text style={styles.okButtonText}>Uyarıyı Kapat</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.okButton, { backgroundColor: '#27ae60' }]} 
                  onPress={() => {
                    setSktWarningModal(false);
                    setSktWarningData(null);
                    // Devam et
                    const okutulanlar = satirlar.filter(x => x.okutulanMiktar > 0);
                    navigation.navigate('EkBilgiler', {
                      fisId,
                      depoId,
                      selectedItems: okutulanlar,
                      userId,
                      girisCikisTuru,
                      onTransferComplete: () => {
                        setTransferCompleted(true);
                        setIsTransferring(false);
                      },
                      onTransferStart: () => {
                        setIsTransferring(true);
                      }
                    });
                  }}
                >
                  <Text style={styles.okButtonText}>Devam Et</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3edea' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ea5a21', paddingTop: 40, paddingBottom: 16, paddingHorizontal: 16 },
  back: { color: '#fff', fontSize: 24, marginRight: 16 },
  headerText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#ea5a21', justifyContent: 'space-around', paddingBottom: 8 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 4, borderBottomColor: '#fff' },
  tabText: { color: '#fff', fontSize: 16 },
  activeTabText: { fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  info: { fontSize: 14, color: '#444' },
  bold: { fontWeight: 'bold' },
  button: { backgroundColor: '#ea5a21', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  searchContainer: { flexDirection: 'row', marginBottom: 10 },
  searchInput: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 16 },
  searchButton: { backgroundColor: '#ea5a21', paddingHorizontal: 18, justifyContent: 'center', marginLeft: 8, borderRadius: 8 },
  searchButtonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { backgroundColor: '#f3f3f3', borderRadius: 8, padding: 12, fontSize: 16, marginTop: 10 },
  disabledButton: { backgroundColor: '#bdc3c7' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  separator: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 12,
  },
  progressContainer: {
    marginTop: 12,
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lotBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  lotAnalysisContainer: {
    marginTop: 8,
  },
  lotAnalysisRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  lotAnalysisBadge: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  lotAnalysisText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalLotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  modalLotLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalLotBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalLotBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requiredInput: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  lotWarningText: {
    fontSize: 12,
    color: '#e74c3c',
    fontStyle: 'italic',
    marginTop: 4,
  },
  lotDisplayContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  lotDisplayLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 4,
  },
  lotDisplayValue: {
    fontSize: 16,
    color: '#212529',
    fontFamily: 'monospace',
  },
  autoApproveStats: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  autoApproveSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  lotluWarning: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0369a1',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#0c4a6e',
    lineHeight: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  okButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  okButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // SKT Modal Stilleri
  sktModalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sktModalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  sktModalValue: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
    textAlign: 'right',
  },
  sktWarningBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  sktWarningText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
    textAlign: 'center',
  },
  sktInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  sktFormatText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sktDetailsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  sktDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  sktDetailText: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 4,
  },
});
