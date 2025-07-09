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

export default function FastTransferUrunScreen({ route }: any) {
  const { selectedDepo } = route.params;
  const { selectedDepoMevcut } = route.params;
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<'Genel' | 'Okunan' | 'Kontrol'>('Genel');
  const [barcode, setBarcode] = useState('');
  const [kontrolListesi, setKontrolListesi] = useState<any[]>([]);
  const [gonderilenVeriler, setGonderilenVeriler] = useState<any[]>([]);

  const handleNavigate = async () => {
    if (!barcode.trim()) return;

    try {
      const response = await fetch(`https://apicloud.womlistapi.com/api/Sorgulama/Malzeme?barkod=${barcode}`);
      const json = await response.json();


      const seciliDepoMiktari = json.depoMiktarlari.find((depoItem: any) => 
        depoItem.depoAciklamasi.trim() === selectedDepoMevcut.aciklamasi.trim())?.miktar ?? 0;  

      const kontrolVerisi = {
        kodu: json.kodu,
        aciklama: json.aciklama,
        kaynakDepo: selectedDepoMevcut.aciklamasi,
        hedefDepo: selectedDepo.aciklamasi,
        miktar: seciliDepoMiktari
      };

      setKontrolListesi((prev) => [...prev, kontrolVerisi]);
      setBarcode('');
      setActiveTab('Kontrol');
    } catch (err) {
      Alert.alert('Hata', 'Ürün bilgisi alınamadı.');
    }
  };

  const handleKaydet = async () => {
    if (kontrolListesi.length === 0) return;

    try {
      const response = await fetch("https://apicloud.womlistapi.com/api/Transfer/Kaydet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kontrolListesi),
      });

      if (response.ok) {
        setGonderilenVeriler((prev) => [...prev, ...kontrolListesi]);
        setKontrolListesi([]);
        Alert.alert("Başarılı", "Veriler kaydedildi.");
      } else {
        Alert.alert("Hata", "Veriler kaydedilemedi.");
      }
    } catch (err) {
      Alert.alert("Sunucu Hatası", "Veriler gönderilemedi.");
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
        placeholder="Ürün Barkodu Giriniz"
        value={barcode}
        onChangeText={setBarcode}
      />
      <View style={styles.iconRow}>
        <TouchableOpacity style={styles.iconButton} onPress={handleNavigate}>
          <Text style={styles.iconText}>▶️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>📷</Text>
        </TouchableOpacity>
      </View>
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
      </View>
      {kontrolListesi.map((item, index) => (
        <View key={index} style={styles.kontrolRow}>
          <Text style={styles.kontrolCell}>{item.kodu}</Text>
          <Text style={styles.kontrolCell}>{item.aciklama}</Text>
          <Text style={styles.kontrolCell}>{item.kaynakDepo}</Text>
          <Text style={styles.kontrolCell}>{item.hedefDepo}</Text>
          <Text style={styles.kontrolCell}>{item.miktar}</Text>
        </View>
      ))}

      {kontrolListesi.length > 0 && (
        <TouchableOpacity style={styles.kaydetButton} onPress={handleKaydet}>
          <Text style={styles.kaydetText}>💾 Kaydet</Text>
        </TouchableOpacity>
      )}

      {gonderilenVeriler.length > 0 && (
        <>
          <Text style={{ fontWeight: 'bold', marginTop: 20, fontSize: 16 }}>Gönderilenler:</Text>
          {gonderilenVeriler.map((item, i) => (
            <View key={i} style={styles.kontrolRow}>
              <Text style={styles.kontrolCell}>{item.kodu}</Text>
              <Text style={styles.kontrolCell}>{item.aciklama}</Text>
              <Text style={styles.kontrolCell}>{item.kaynakDepo}</Text>
              <Text style={styles.kontrolCell}>{item.hedefDepo}</Text>
              <Text style={styles.kontrolCell}>{item.miktar}</Text>
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
  kaydetText: {
    color: 'white', fontSize: 16, fontWeight: 'bold',
  },
});
