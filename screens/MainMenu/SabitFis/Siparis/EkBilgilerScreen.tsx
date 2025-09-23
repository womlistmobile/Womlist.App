import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function EkBilgilerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { selectedItems, fisId, depoId, userId, girisCikisTuru, onTransferComplete, onTransferStart } = route.params;
  const [kod, setKod] = useState('');
  const [date] = useState(
    new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Sayfa yüklendiğinde otomatik kod oluştur
  useEffect(() => {
    generateCode();
  }, []);

  const generateCode = async () => {
    if (isGeneratingCode) return;
    
    setIsGeneratingCode(true);
    try {
      const response = await fetch(`https://apicloud.womlistapi.com/api/Stok/KotlinYeniKod/${girisCikisTuru}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.durum && result.message) {
          setKod(result.message);
        } else {
          console.error('Kod oluşturma hatası:', result.message);
          Alert.alert('Uyarı', 'Otomatik kod oluşturulamadı. Manuel olarak girebilirsiniz.');
        }
      } else {
        console.error('Kod oluşturma API hatası:', response.status);
        Alert.alert('Uyarı', 'Otomatik kod oluşturulamadı. Manuel olarak girebilirsiniz.');
      }
    } catch (error) {
      console.error('Kod oluşturma hatası:', error);
      Alert.alert('Uyarı', 'Otomatik kod oluşturulamadı. Manuel olarak girebilirsiniz.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleGonder = async () => {
    if (isLoading) {
      Alert.alert('Bilgi', 'Veri transferi devam ediyor, lütfen bekleyiniz.');
      return;
    }

    if (!kod.trim()) {
      Alert.alert('Hata', 'Lütfen kod giriniz.');
      return;
    }

    setIsLoading(true);
    if (onTransferStart) onTransferStart();
  
    const requestBody = {
      kod: kod.trim(),
      tarih: date,
      beyannameKod: '',
      beyannameTarih: 'Dummy Data',
      stokFisTuru: 3, // SabitFis için 3 kullanılıyor
      kaynakDepoId: depoId,
      kullaniciTerminalId: userId,
      destinasyonDepoId: null,
      satirlar: selectedItems.map((item: any) => ({
        depoId: item.depoId,
        adresId: null,
        stokId: null,
        sayinHareketId: null,
        sabitFisHareketleriId: item.satirId,
        transferHareketId: null,
        malzemeTemelBilgiId: item.malzemeTemelBilgiId || item.malzemeId,
        kullaniciTerminalId: userId,
        birinId: item.birimId,
        carpan1: item.carpan1 || 1,
        carpan2: item.carpan2 || 1,
        lotNo: item.lotNo || null,
        miktar: item.okutulanMiktar,
        sonkullanmaTarihi: item.sonKullanmaTarihi || null,
        girisCikisTuru: girisCikisTuru,
      })),
    }; 
  
    try {
      console.log('Gönderilen veri:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(
        'https://apicloud.womlistapi.com/api/Stok/StokHareketEkle',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );
  
      const rawText = await response.text();
      console.log('API Yanıtı:', rawText);
  
      if (!rawText) {
        throw new Error('Sunucu boş cevap döndü.');
      }
  
      const result = JSON.parse(rawText);
  
      if (result.durum) {
        Alert.alert('✅ Başarılı', result.message || 'Veriler başarıyla gönderildi.');
        if (onTransferComplete) onTransferComplete();
        navigation.goBack();
      } else {
        // Stok yetersizliği gibi özel hata mesajları
        let errorMessage = result.message || 'Veri gönderme başarısız.';
        
        if (errorMessage.includes('Stok yetersiz')) {
          errorMessage = `⚠️ Stok Yetersiz!\n\n${errorMessage}`;
        } else if (errorMessage.includes('Malzeme')) {
          errorMessage = `📦 Malzeme Hatası!\n\n${errorMessage}`;
        } else {
          errorMessage = `❌ Hata!\n\n${errorMessage}`;
        }
        
        Alert.alert('Hata', errorMessage);
      }
    } catch (error: any) {
      console.error('Veri gönderim hatası:', error.message);
      Alert.alert('❌ Hata', `Veriler gönderilemedi:\n\n${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.label}>GÜNCEL TARİH</Text>
      <TouchableOpacity style={styles.dateButton}>
        <Text style={styles.dateText}>{date}</Text>
      </TouchableOpacity>

      <TextInput
        placeholder={isGeneratingCode ? "Kod oluşturuluyor..." : "KOD"}
        value={kod}
        onChangeText={setKod}
        style={[styles.input, isGeneratingCode && styles.generatingInput]}
        editable={!isGeneratingCode}
      />

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.disabledButton]} 
        onPress={handleGonder}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.buttonText}>GÖNDERİLİYOR...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>➤ VERİLERİ GÖNDER</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3edea', padding: 20 },
  label: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  dateButton: {
    backgroundColor: '#ea5a21',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ea5a21',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#bdc3c7' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  generatingInput: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
  },
});
