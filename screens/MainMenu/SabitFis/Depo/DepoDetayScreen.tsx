import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

type RootStackParamList = {
  DepoDetay: {
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
  userId: string;
};

export default function DepoDetayScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'DepoDetay'>>();
  const { fisId, fisNo, cariBilgisi, tarih, depoId, userId, girisCikisTuru } = route.params;

  const [satirlar, setSatirlar] = useState<SatirItem[]>([]);
  const [activeTab, setActiveTab] = useState<'Genel' | 'Satirlar' | 'Okunan' | 'Kontrol'>('Genel');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<SatirItem | null>(null);

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
          okutulanMiktar: item.okutulanMiktar,
          birim: item.birim,
          userId: userId,
        }));
        setSatirlar(formatted);
      })
      .catch(err => console.error('Satır verisi alınamadı:', err))
      .finally(() => setLoading(false));
  }, []);

  const otomatikOnayla = () => {
    const updated = satirlar.map(item => ({ ...item, okutulanMiktar: item.istenenMiktar }));
    setSatirlar(updated);
    setActiveTab('Kontrol');
  };

  const handleVeriTransferi = () => {
    const okutulanlar = satirlar.filter(s => s.okutulanMiktar > 0);
    if (okutulanlar.length === 0) {
      Alert.alert('Hata', 'Okutulan ürün yok.');
      return;
    }

    navigation.navigate('DepoEkBilgiler', {
      fisId,
      depoId,
      userId,
      selectedItems: okutulanlar,
      girisCikisTuru,
    });
  };

  const renderItem = (item: SatirItem) => (
    <TouchableOpacity onPress={() => {
      setModalData(item);
      setModalVisible(true);
    }}>
      <View style={styles.card}>
        <Text style={styles.title}>{item.kodu}</Text>
        <Text style={styles.title}>{item.malzeme}</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.info}>İstenen: {item.istenenMiktar}</Text>
          <Text style={styles.info}>Okutulan: {item.okutulanMiktar}</Text>
        </View>
        <Text style={styles.info}>Birim: {item.birim}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerText}>Depo Detay</Text>
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
                {renderItem({
                  kodu: fisNo,
                  malzeme: cariBilgisi,
                  istenenMiktar: 0,
                  okutulanMiktar: 0,
                  birim: '',
                  satirId: '',
                  malzemeId: '',
                  birimId: '',
                  userId: '',
                })}
                <TouchableOpacity style={styles.button} onPress={otomatikOnayla}>
                  <Text style={styles.buttonText}>OTOMATİK ONAYLA</Text>
                </TouchableOpacity>
              </>
            )}

            {activeTab === 'Satirlar' && (
              <FlatList
                data={satirlar}
                renderItem={({ item }) => renderItem(item)}
                keyExtractor={item => item.satirId}
              />
            )}

            {activeTab === 'Okunan' && (
              <FlatList
                data={satirlar.filter(s => s.okutulanMiktar > 0)}
                renderItem={({ item }) => renderItem(item)}
                keyExtractor={item => item.satirId}
              />
            )}

            {activeTab === 'Kontrol' && (
              <>
                {satirlar.filter(s => s.okutulanMiktar > 0).length === 0 ? (
                  <Text style={styles.emptyText}>Hiç Ürün Okutulmadı</Text>
                ) : (
                  <>
                    <FlatList
                      data={satirlar.filter(s => s.okutulanMiktar > 0)}
                      renderItem={({ item }) => renderItem(item)}
                      keyExtractor={item => item.satirId}
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

      {/* Modal */}
      {modalData && (
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.title}>{modalData.malzeme}</Text>
              <Text style={styles.info}>İstenen: {modalData.istenenMiktar}</Text>
              <Text style={styles.info}>Birim: {modalData.birim}</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3edea' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ea5a21',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  back: { color: '#fff', fontSize: 24, marginRight: 16 },
  headerText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ea5a21',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 4, borderBottomColor: '#fff' },
  tabText: { color: '#fff', fontSize: 16 },
  activeTabText: { fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  info: { fontSize: 14, color: '#444' },
  button: {
    backgroundColor: '#ea5a21',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
});
