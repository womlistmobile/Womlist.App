// UretimDetayScreen güncellenmiş versiyonudur

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;

type RootStackParamList = {
  UretimDetay: {
    fisId: string;
    fisNo: string;
    cariBilgisi: string;
    tarih: string;
    depoId: string;
    userId: string;
    girisCikisTuru: 1 | 2;
  };
};

type SatirItem = {
  satirId: string;
  malzemeId: string;
  birimId: string;
  kodu: string;
  malzeme: string;
  istenenMiktar: number;
  okutulanMiktar: number;
  birim: string;
  malzemeTemelBilgiId: string;
  carpan1: number;
  carpan2: number;
  depoId: string;
  lotluMu?: boolean;
  lotNo?: string;
};

export default function UretimDetayScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'UretimDetay'>>();
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

  useEffect(() => {
    fetch(`https://apicloud.womlistapi.com/api/SabitFis/FisSatirlari/${fisId}`)
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((item: any) => ({
          satirId: item.satirId,
          malzemeId: item.malzemeId,
          birimId: item.birimId,
          kodu: item.kodu,
          malzeme: item.malzeme,
          istenenMiktar: item.istenenMiktar,
          okutulanMiktar: item.okunanMiktar,
          birim: item.birim,
          malzemeTemelBilgiId: item.malzemeId,
          carpan1: item.carpan1 || 1,
          carpan2: item.carpan2 || 1,
          depoId,
          lotluMu: item.lotluMu || false,
        }));
        setSatirlar(formatted);
      })
      .catch(err => console.error('Satır verisi alınamadı:', err))
      .finally(() => setLoading(false));
  }, []);

  const otomatikOnayla = () => {
    const updated = satirlar.map(item => ({
      ...item,
      okutulanMiktar: item.istenenMiktar,
    }));
    setSatirlar(updated);
    setActiveTab('Kontrol');
  };

  const barkodSorgula = async () => {
    if (!barkodInput) return;
    try {
      const res = await fetch(`https://apicloud.womlistapi.com/api/Sorgulama/Malzeme?barkod=${barkodInput}`);
      const data = await res.json();
      const urunKodu = data.kodu;
      const kayit = satirlar.find(s => s.kodu === urunKodu);

      if (!kayit) {
        Alert.alert('Hatalı Barkod', 'Bu barkoda ait ürün bulunamadı.');
        return;
      }

      setModalData(kayit);
      setGirilmisMiktar('');
      setLotNo('');
      setModalVisible(true);
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
    if (isNaN(miktar) || miktar <= 0 || miktar > modalData.istenenMiktar) {
      Alert.alert('Hata', 'Geçerli miktar giriniz.');
      return;
    }
    const guncellenmis = satirlar.map(s =>
      s.satirId === modalData.satirId ? { ...s, okutulanMiktar: miktar, lotNo } : s
    );
    setSatirlar(guncellenmis);
    setModalVisible(false);
    setModalData(null);
  };

  const handleVeriTransferi = () => {
    const okutulanlar = satirlar.filter(s => s.okutulanMiktar > 0);
    if (okutulanlar.length === 0) {
      Alert.alert('Hata', 'Okutulan ürün yok.');
      return;
    }
    navigation.navigate('UretimEkBilgiler', {
      fisId,
      depoId,
      userId,
      selectedItems: okutulanlar,
      girisCikisTuru,
    });
  };

  const renderItem = (item: SatirItem, isOkunan = false) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.kodu}</Text>
      <Text style={styles.title}>{item.malzeme}</Text>
      {isOkunan && <Text style={styles.info}><Text style={styles.bold}>Lot No:</Text> {item.lotNo || '-'}</Text>}
      <View style={styles.rowBetween}>
        <Text style={styles.info}>İstenen: {item.istenenMiktar}</Text>
        <Text style={styles.info}>Okutulan: {item.okutulanMiktar}</Text>
      </View>
      <Text style={styles.info}>Birim: {item.birim}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>Üretim Detay</Text>
        </View>

        <View style={styles.tabContainer}>
          {['Genel', 'Satirlar', 'Okunan', 'Kontrol'].map(tab => (
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
                  {renderItem({ kodu: fisNo, malzeme: cariBilgisi, istenenMiktar: 0, okutulanMiktar: 0, birim: '', satirId: '', malzemeId: '', birimId: '', malzemeTemelBilgiId: '', carpan1: 1, carpan2: 1, depoId })}
                  <TouchableOpacity style={styles.button} onPress={otomatikOnayla}>
                    <Text style={styles.buttonText}>OTOMATİK ONAYLA</Text>
                  </TouchableOpacity>
                </>
              )}

              {activeTab === 'Satirlar' && (
                <FlatList data={satirlar} renderItem={({ item }) => renderItem(item)} keyExtractor={item => item.satirId} />
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
                      <TouchableOpacity style={styles.button} onPress={handleVeriTransferi}>
                        <Text style={styles.buttonText}>VERİ TRANSFERİ</Text>
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
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
              <ScrollView>
                <Text style={styles.modalTitle}>{modalData?.malzeme}</Text>
                <Text style={styles.info}><Text style={styles.bold}>İstenen:</Text> {modalData?.istenenMiktar}</Text>
                <TextInput placeholder="Miktar" value={girilmisMiktar} onChangeText={setGirilmisMiktar} keyboardType="numeric" style={styles.input} />
                {modalData?.lotluMu && (
                  <TextInput placeholder="Lot No" value={lotNo} onChangeText={setLotNo} style={styles.input} />
                )}
                <TouchableOpacity style={styles.button} onPress={kaydetModal}>
                  <Text style={styles.buttonText}>KAYDET</Text>
                </TouchableOpacity>
              </ScrollView>
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
  closeButton: { position: 'absolute', right: 10, top: 10, zIndex: 1 },
  closeButtonText: { fontSize: 24, fontWeight: 'bold', color: '#ea5a21' },
});

