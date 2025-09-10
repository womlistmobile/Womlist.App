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
  paketlenenSatirId: number;
  kod: string;
  miktar: number;
  miktarStr: string;
  birimAciklama: string;
  kullaniciAdi: string;
  islemTarihi: string;
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
  const { paketSatirId, malzemeKodu, malzemeAciklama, selectedDepo, user } = route.params;
  const { scannedValue, setScannedValue } = useQr();
  
  const [paketlenenSatirlar, setPaketlenenSatirlar] = useState<PaketlenenSatir[]>([]);
  const [paketSatirBilgisi, setPaketSatirBilgisi] = useState<PaketSatirBilgisi | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [kod, setKod] = useState('');
  const [miktar, setMiktar] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [breakLoading, setBreakLoading] = useState(false);

  useEffect(() => {
    fetchPaketlenenSatirlar();
    fetchPaketSatirBilgisi();
  }, []);

  useEffect(() => {
    if (scannedValue) {
      setKod(scannedValue);
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
      const response = await fetch(`https://apicloud.womlistapi.com/api/Paket/PaketSatirBilgisi/${paketSatirId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaketSatirBilgisi(data);
      } else {
        console.error('Paket satır bilgisi yüklenemedi:', response.status);
      }
    } catch (error) {
      console.error('Paket satır bilgisi yüklenirken hata:', error);
    }
  };

  const handleAddPaketleme = async () => {
    if (!kod.trim() || !miktar.trim()) {
      Alert.alert('Hata', 'Lütfen kod ve miktar alanlarını doldurunuz.');
      return;
    }

    const miktarNum = parseFloat(miktar);
    if (isNaN(miktarNum) || miktarNum <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir miktar giriniz.');
      return;
    }

    if (paketSatirBilgisi && miktarNum > paketSatirBilgisi.paketlenebilirMiktar) {
      Alert.alert('Hata', `Girilen miktar kalan miktardan (${paketSatirBilgisi.paketlenebilirMiktarStr}) fazla olamaz.`);
      return;
    }

    setAddLoading(true);
    try {
      const response = await fetch('https://apicloud.womlistapi.com/api/Paket/PaketlenenSatirEkle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paketSatirId: paketSatirId,
          kod: kod.trim(),
          miktar: miktarNum,
          kullaniciId: user?.id,
        }),
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Paketleme kaydı başarıyla eklendi.');
        setKod('');
        setMiktar('');
        setShowAddModal(false);
        fetchPaketlenenSatirlar();
        fetchPaketSatirBilgisi();
      } else {
        const errorText = await response.text();
        console.error('Paketleme ekleme hatası:', response.status, errorText);
        Alert.alert('Hata', 'Paketleme kaydı eklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Paketleme ekleme hatası:', error);
      Alert.alert('Hata', 'Paketleme kaydı eklenirken bir hata oluştu.');
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
      // PaketId'yi selectedDepo'dan alıyoruz (paketSatirId'den türetilebilir)
      const paketId = selectedDepo?.id || paketSatirId; // Bu değeri doğru şekilde almanız gerekebilir
      
      const response = await fetch(`https://apicloud.womlistapi.com/api/Paket/PaketlenenTumSatirlariSil/${paketId}?kullanicild=${user?.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Tüm paketleme kayıtları başarıyla silindi.');
        fetchPaketlenenSatirlar();
        fetchPaketSatirBilgisi();
      } else {
        const errorText = await response.text();
        console.error('Paketleme bozma hatası:', response.status, errorText);
        Alert.alert('Hata', 'Paketleme kayıtları silinirken bir hata oluştu.');
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
        <Text style={styles.paketlenenSatirKod}>{item.kod}</Text>
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
          {item.miktarStr} {item.birimAciklama}
        </Text>
        <Text style={styles.paketlenenSatirKullanici}>
          {item.kullaniciAdi} - {new Date(item.islemTarihi).toLocaleDateString('tr-TR')}
        </Text>
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

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Paketleme Ekle</Text>
        </TouchableOpacity>

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

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Paketleme Ekle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.breakButton}
          onPress={handleBreakPackaging}
          disabled={breakLoading}
        >
          {breakLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="package-variant-remove" size={20} color="#fff" />
          )}
          <Text style={styles.breakButtonText}>Paketlemeyi Boz</Text>
        </TouchableOpacity>
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

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Paketleme Ekle</Text>
            
            {/* Malzeme Bilgileri */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📦 Malzeme Bilgileri</Text>
              <Text style={styles.infoText}><Text style={styles.bold}>Kod:</Text> {malzemeKodu}</Text>
              <Text style={styles.infoText}><Text style={styles.bold}>Açıklama:</Text> {malzemeAciklama}</Text>
              {paketSatirBilgisi && (
                <>
                  <View style={styles.modalMiktarContainer}>
                    <View style={styles.modalMiktarRow}>
                      <Text style={styles.modalMiktarLabel}>📊 Paketlenecek:</Text>
                      <Text style={styles.modalMiktarValue}>{paketSatirBilgisi.paketlenecekMiktarStr} {paketSatirBilgisi.birimAciklama}</Text>
                    </View>
                    <View style={styles.modalMiktarRow}>
                      <Text style={styles.modalMiktarLabel}>✅ Paketlenen:</Text>
                      <Text style={[styles.modalMiktarValue, { color: '#27ae60' }]}>{paketSatirBilgisi.paketlenenMiktarMiktarStr} {paketSatirBilgisi.birimAciklama}</Text>
                    </View>
                    <View style={styles.modalMiktarRow}>
                      <Text style={styles.modalMiktarLabel}>⏳ Kalan:</Text>
                      <Text style={[styles.modalMiktarValue, { color: '#e74c3c' }]}>{paketSatirBilgisi.paketlenebilirMiktarStr} {paketSatirBilgisi.birimAciklama}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalProgressContainer}>
                    <View style={styles.modalProgressBar}>
                      <View 
                        style={[
                          styles.modalProgressFill, 
                          { 
                            width: `${Math.round((paketSatirBilgisi.paketlenenMiktar / paketSatirBilgisi.paketlenecekMiktar) * 100)}%`,
                            backgroundColor: '#27ae60'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.modalProgressText}>
                      %{Math.round((paketSatirBilgisi.paketlenenMiktar / paketSatirBilgisi.paketlenecekMiktar) * 100)} Tamamlandı
                    </Text>
                  </View>
                </>
              )}
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Kod giriniz"
              value={kod}
              onChangeText={setKod}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Miktar giriniz"
              value={miktar}
              onChangeText={setMiktar}
              keyboardType="numeric"
            />
            
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
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addModalButton, addLoading && styles.disabledButton]}
                onPress={handleAddPaketleme}
                disabled={addLoading}
              >
                {addLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.addModalButtonText}>Ekle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
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
