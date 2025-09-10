import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQr } from '../../DashBoard/QrContext';

export default function FastTransferUrunScreen({ route }: any) {
  const { selectedDepo, selectedDepoMevcut, user } = route.params;
  const navigation = useNavigation<any>();
  const { scannedValue, setScannedValue } = useQr();

  const [activeTab, setActiveTab] = useState<'Genel' | 'Okunan' | 'Kontrol'>('Genel');
  const [lotNo, setLotNo] = useState('');
  const [miktar, setMiktar] = useState('');
  const [malzemeBilgisi, setMalzemeBilgisi] = useState<any>(null);
  const [kontrolListesi, setKontrolListesi] = useState<any[]>([]);
  const [gonderilenVeriler, setGonderilenVeriler] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // QR kod değişikliğini dinle
  useEffect(() => {
    if (scannedValue) {
      setLotNo(scannedValue);
      setScannedValue('');
    }
  }, [scannedValue]);

  const handleLotSorgula = async () => {
    if (!lotNo.trim()) {
      Alert.alert('Uyarı', 'Lütfen lot numarası giriniz.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://apicloud.womlistapi.com/api/EnvanterSorgulama/LotSorgula?lotNo=${lotNo}&depoId=${selectedDepoMevcut.depoId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      
      if (!responseText.trim()) {
        throw new Error('API\'den boş yanıt alındı');
      }

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response Text:', responseText);
        throw new Error('API yanıtı geçersiz JSON formatında');
      }

      if (!Array.isArray(json) || json.length === 0) {
        throw new Error('Bu lot numarası için kayıt bulunamadı');
      }

      // İlk kaydı al (genellikle tek kayıt döner)
      const lotData = json[0];
      
      // Mevcut depodaki miktarı bul
      const mevcutDepoMiktari = lotData.depoMiktarlari?.find((depoItem: any) => 
        depoItem.depoAciklamasi?.trim() === selectedDepoMevcut.aciklamasi?.trim()
      )?.miktar ?? 0;

      if (mevcutDepoMiktari <= 0) {
        throw new Error('Bu lot numarası seçili depoda bulunmuyor');
      }

      setMalzemeBilgisi({
        malzemeId: lotData.malzemeId,
        malzemeKodu: lotData.malzemeKodu,
        malzemeAciklama: lotData.malzemeAciklama,
        lotNo: lotData.lotNo,
        miktar: mevcutDepoMiktari,
        birimId: lotData.birimId,
        birimAciklama: lotData.birimAciklama
      });
      
      setMiktar('');
    } catch (err) {
      console.error('Lot sorgulama hatası:', err);
      Alert.alert('Hata', err instanceof Error ? err.message : 'Lot bilgisi alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleMiktarEkle = () => {
    if (!malzemeBilgisi) {
      Alert.alert('Uyarı', 'Önce lot numarası sorgulayınız.');
      return;
    }

    if (!miktar.trim()) {
      Alert.alert('Uyarı', 'Lütfen miktar giriniz.');
      return;
    }

    const girilenMiktar = parseFloat(miktar);
    if (isNaN(girilenMiktar) || girilenMiktar <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir miktar giriniz.');
      return;
    }

    if (girilenMiktar > malzemeBilgisi.miktar) {
      Alert.alert('Hata', `Girilen miktar (${girilenMiktar}) mevcut miktarı (${malzemeBilgisi.miktar}) aşamaz!`);
      return;
    }

    const kontrolVerisi = {
      malzemeId: malzemeBilgisi.malzemeId,
      malzemeKodu: malzemeBilgisi.malzemeKodu,
      malzemeAciklama: malzemeBilgisi.malzemeAciklama,
      kaynakDepoId: selectedDepoMevcut.depoId,
      kaynakDepoAciklama: selectedDepoMevcut.aciklamasi,
      hedefDepoId: selectedDepo.depoId,
      hedefDepoAciklama: selectedDepo.aciklamasi,
      miktar: girilenMiktar,
      lotNo: lotNo.trim(),
      birimId: malzemeBilgisi.birimId,
      birimAciklama: malzemeBilgisi.birimAciklama,
      terminalId: user?.id || 'MOBILE_TERMINAL',
      mevcutMiktar: malzemeBilgisi.miktar
    };

    setKontrolListesi((prev) => [...prev, kontrolVerisi]);
    setMiktar('');
    setLotNo('');
    setMalzemeBilgisi(null);
    setActiveTab('Kontrol');
  };

  const handleKaydet = async () => {
    if (kontrolListesi.length === 0) return;

    setSubmitting(true);
    try {
      // Her ürün için ayrı stok hareketi oluştur
      const stokHareketleri = kontrolListesi.map((item) => ({
        kod: `TRANSFER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tarih: new Date().toISOString().split('T')[0],
        beyannameKod: "",
        beyannameTarih: "",
        stokFisTuru: 1,
        kaynakDepoId: item.kaynakDepoId,
        kullaniciTerminalId: item.terminalId,
        destinasyonDepoId: item.hedefDepoId,
        satirlar: [{
          depoId: item.kaynakDepoId,
          adresId: "",
          stokId: item.malzemeId,
          sayimHareketId: "",
          sabitFisHareketleriId: "",
          transferHareketId: "",
          malzemeTemelBilgiId: item.malzemeId,
          kullaniciTerminalId: item.terminalId,
          birimId: item.birimId,
          carpan1: 0,
          carpan2: 0,
          lotNo: item.lotNo || "",
          miktar: item.miktar,
          girisCikisTuru: 1
        }]
      }));

      // Her stok hareketini ayrı ayrı gönder
      const promises = stokHareketleri.map(async (hareket) => {
        const response = await fetch("https://apicloud.womlistapi.com/api/Stok/StokHareketEkle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hareket),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = "Stok hareketi kaydedilemedi.";
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            // JSON parse edilemezse raw text kullan
          }
          
          throw new Error(`${hareket.kod}: ${errorMessage}`);
        }

        return await response.json();
      });

      await Promise.all(promises);
      
      setGonderilenVeriler((prev) => [...prev, ...kontrolListesi]);
      setKontrolListesi([]);
      Alert.alert("✅ Başarılı", "Transfer işlemi başarıyla kaydedildi.");
    } catch (err) {
      console.error('Transfer kaydetme hatası:', err);
      Alert.alert("❌ Hata", err instanceof Error ? err.message : "Transfer kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderGenelTab = () => (
    <View style={styles.card}>
      <Text style={styles.text}><Text style={styles.bold}>Mevcut :</Text> {selectedDepoMevcut.aciklamasi}</Text>
      <Text style={styles.text}><Text style={styles.bold}>Aktarılacak :</Text> {selectedDepo.aciklamasi}</Text>
    </View>
  );

  const renderOkunanTab = () => (
    <View style={styles.okunanContainer}>
      <TextInput
        style={styles.input}
        placeholder="Lot Numarası Giriniz"
        value={lotNo}
        onChangeText={setLotNo}
      />
      
      <View style={styles.iconRow}>
        <TouchableOpacity 
          style={[styles.iconButton, loading && styles.iconButtonDisabled]} 
          onPress={handleLotSorgula}
          disabled={loading}
        >
          <Text style={styles.iconText}>
            {loading ? '⏳' : '🔍'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigation.navigate('QrScanner')}
        >
          <Text style={styles.iconText}>📷</Text>
        </TouchableOpacity>
      </View>

      {malzemeBilgisi && (
        <View style={styles.malzemeCard}>
          <Text style={styles.malzemeTitle}>Malzeme Bilgisi</Text>
          <Text style={styles.malzemeText}><Text style={styles.bold}>Kod:</Text> {malzemeBilgisi.malzemeKodu}</Text>
          <Text style={styles.malzemeText}><Text style={styles.bold}>Açıklama:</Text> {malzemeBilgisi.malzemeAciklama}</Text>
          <Text style={styles.malzemeText}><Text style={styles.bold}>Mevcut Miktar:</Text> {malzemeBilgisi.miktar} {malzemeBilgisi.birimAciklama}</Text>
          <Text style={styles.malzemeText}><Text style={styles.bold}>Lot No:</Text> {malzemeBilgisi.lotNo}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Transfer Miktarı Giriniz"
            value={miktar}
            onChangeText={setMiktar}
            keyboardType="numeric"
          />
          
          <TouchableOpacity style={styles.ekleButton} onPress={handleMiktarEkle}>
            <Text style={styles.ekleButtonText}>➕ Listeye Ekle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderKontrolTab = () => (
    <ScrollView contentContainerStyle={styles.kontrolContainer}>
      <View style={styles.kontrolHeader}>
        <Text style={styles.kontrolCellBold}>Kodu</Text>
        <Text style={styles.kontrolCellBold}>Açıklama</Text>
        <Text style={styles.kontrolCellBold}>Kaynak</Text>
        <Text style={styles.kontrolCellBold}>Hedef</Text>
        <Text style={styles.kontrolCellBold}>Miktar</Text>
        <Text style={styles.kontrolCellBold}>Lot</Text>
      </View>
      {kontrolListesi.map((item, index) => (
        <View key={index} style={styles.kontrolRow}>
          <Text style={styles.kontrolCell}>{item.malzemeKodu}</Text>
          <Text style={styles.kontrolCell}>{item.malzemeAciklama}</Text>
          <Text style={styles.kontrolCell}>{item.kaynakDepoAciklama}</Text>
          <Text style={styles.kontrolCell}>{item.hedefDepoAciklama}</Text>
          <Text style={styles.kontrolCell}>{item.miktar}</Text>
          <Text style={styles.kontrolCell}>{item.lotNo || '-'}</Text>
        </View>
      ))}

      {kontrolListesi.length > 0 && (
        <TouchableOpacity 
          style={[styles.kaydetButton, submitting && styles.kaydetButtonDisabled]} 
          onPress={handleKaydet}
          disabled={submitting}
        >
          <Text style={styles.kaydetText}>
            {submitting ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
          </Text>
        </TouchableOpacity>
      )}

      {gonderilenVeriler.length > 0 && (
        <>
          <Text style={{ fontWeight: 'bold', marginTop: 20, fontSize: 16 }}>Gönderilenler:</Text>
          {gonderilenVeriler.map((item, i) => (
            <View key={i} style={styles.kontrolRow}>
              <Text style={styles.kontrolCell}>{item.malzemeKodu}</Text>
              <Text style={styles.kontrolCell}>{item.malzemeAciklama}</Text>
              <Text style={styles.kontrolCell}>{item.kaynakDepoAciklama}</Text>
              <Text style={styles.kontrolCell}>{item.hedefDepoAciklama}</Text>
              <Text style={styles.kontrolCell}>{item.miktar}</Text>
              <Text style={styles.kontrolCell}>{item.lotNo || '-'}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Hızlı Transfer</Text>
      </View>

      <View style={styles.content}>
        {activeTab === 'Genel' && renderGenelTab()}
        {activeTab === 'Okunan' && renderOkunanTab()}
        {activeTab === 'Kontrol' && renderKontrolTab()}
      </View>

      <View style={styles.tabBar}>
        {['Genel', 'Okunan', 'Kontrol'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as any)}
            style={[styles.tabItem, activeTab === tab && styles.activeTab]}
          >
            <Text style={styles.tabIcon}>{tab === 'Genel' ? 'ℹ️' : tab === 'Okunan' ? '📦' : '✅'}</Text>
            <Text style={styles.tabLabel}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3edea' },
  header: { backgroundColor: '#ea5a21', padding: 14 },
  headerText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1 },
  card: {
    backgroundColor: 'white', margin: 16, padding: 16,
    borderRadius: 12, elevation: 4,
  },
  text: { fontSize: 16, marginBottom: 4 },
  bold: { fontWeight: 'bold' },
  okunanContainer: { margin: 16 },
  input: {
    borderColor: '#ccc', borderWidth: 1, borderRadius: 10,
    backgroundColor: 'white', padding: 12, marginBottom: 16,
    fontSize: 16,
  },
  iconRow: { flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: {
    backgroundColor: '#ea5a21', borderRadius: 12,
    padding: 10, width: 50, alignItems: 'center',
  },
  iconText: { fontSize: 18, color: 'white' },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#ea5a21',
    justifyContent: 'space-around', paddingVertical: 12,
    borderTopWidth: 1, borderColor: '#ccc',
  },
  tabItem: { alignItems: 'center', flex: 1 },
  activeTab: {
    backgroundColor: '#d35400',
    borderTopWidth: 4, borderTopColor: '#fff',
  },
  tabIcon: { color: 'white', fontSize: 20, marginBottom: 4 },
  tabLabel: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  kontrolContainer: { padding: 10 },
  kontrolHeader: {
    flexDirection: 'row', backgroundColor: '#ddd',
    padding: 8, borderRadius: 6,
  },
  kontrolRow: {
    flexDirection: 'row', backgroundColor: 'white',
    padding: 8, marginTop: 4, borderRadius: 6,
  },
  kontrolCellBold: { flex: 1, fontWeight: 'bold', fontSize: 12 },
  kontrolCell: { flex: 1, fontSize: 12 },
  kaydetButton: {
    backgroundColor: '#2ecc71',
    padding: 12, borderRadius: 8, marginTop: 16, alignItems: 'center',
  },
  kaydetButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  kaydetText: {
    color: 'white', fontSize: 16, fontWeight: 'bold',
  },
  iconButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  malzemeCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    marginTop: 20,
  },
  malzemeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  malzemeText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#34495e',
  },
  ekleButton: {
    backgroundColor: '#27ae60',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  ekleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
