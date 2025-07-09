// ... diğer importlar
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';

export default function MainMenuScreen({ route, navigation }: any) {
  const { user, selectedDepo } = route.params;

  const currentVersion =
    Constants.expoConfig?.version ||
    (Constants.manifest as any)?.version ||
    '0.0.1';

  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://apicloud.womlistapi.com/api/Version/GetVersion')
      .then(async (response) => {
        const text = await response.text();
        const latest = text.trim();
        setLatestVersion(latest);
        if (latest !== currentVersion) {
          setShowUpdateModal(true);
        }
      })
      .catch((error) => {
        console.error('Versiyon kontrol hatası:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const buttons = [
    { label: 'Ürün Bilgisi', screen: 'ProductInfo' },
    { label: 'Lot Bilgisi', screen: 'LotSorgula' },
    { label: 'Adres Bilgisi', screen: 'AdresDetay' },
    {
      label: 'Sabit Fiş',
      screen: 'SabitFis',
      extraParams: { selectedDepo, user },
    },
    {
      label: 'Adresler Arası Transfer',
      screen: 'AdresTransferBarcode',
      extraParams: () => ({ selectedDepo, user }),
    },
    {
      label: 'Hızlı Transfer',
      screen: 'FastTransferDepo',
      extraParams: {
        depoListesi: user?.depoListesi ?? [],
        user,
        selectedDepo,
      },
    },
    {
      label: 'Depo Sayımı',
      screen: 'DepoSayim',
      extraParams: { user, selectedDepo },
    },
    {
      label: 'Paketleme',
      screen: 'PaketListesi',
      extraParams: { selectedDepo, user },
    },
    {
      label: 'Konsinye',
      screen: 'Konsinye',
      extraParams: {},
    },
    {
      label: 'Rezerv',
      screen: 'Rezerv',
      extraParams: {},
    },
  ];

  const colors = [
    '#2ecc71', '#e74c3c', '#e84393', '#2980b9',
    '#f1c40f', '#8e44ad', '#27ae60', '#c0392b',
    '#e67e22', '#16a085',
  ];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ea5a21" />
        <Text style={{ marginTop: 12 }}>Versiyon kontrolü yapılıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtext}>Kullanıcı: {user?.unvan}</Text>
        <Text style={styles.subtext}>Depo: {selectedDepo?.aciklamasi}</Text>
        <Text style={styles.versionText}>v{currentVersion}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {buttons.map((btn, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.button, { backgroundColor: colors[index % colors.length] }]}
            onPress={() => {
              if (
                btn.label === 'Adresler Arası Transfer' &&
                !selectedDepo?.adresliMi
              ) {
                Alert.alert('Uyarı', 'Bu depo adresli değildir. Transfer işlemi yapılamaz.');
                return;
              }

              const params =
                typeof btn.extraParams === 'function'
                  ? btn.extraParams()
                  : btn.extraParams || { user, selectedDepo };

              navigation.navigate(btn.screen, params);
            }}
          >
            <Text style={styles.buttonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showUpdateModal && (
        <Modal transparent visible animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Güncelleme Gerekli</Text>
              <Text style={styles.modalText}>
                Uygulamanız eski bir sürümde. Devam etmek için lütfen güncelleyin.
              </Text>
              <Pressable
                style={styles.updateButton}
                onPress={() => Linking.openURL('https://www.google.com')}
              >
                <Text style={styles.updateButtonText}>GÜNCELLE</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3edea' },
  header: { backgroundColor: '#ea5a21', padding: 16, alignItems: 'center' },
  subtext: { marginTop: 4, color: 'white', fontSize: 14 },
  versionText: { marginTop: 4, color: 'white', fontSize: 12, fontStyle: 'italic' },
  grid: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalText: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  updateButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  updateButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
