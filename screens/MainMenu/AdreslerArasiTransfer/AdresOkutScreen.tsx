import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function AdresOkutScreen({ route, navigation }: any) {
  const { urun, selectedDepo, user, miktar, secilenAdres,barcode } = route.params;
  const [targetBarkod, setTargetBarkod] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!targetBarkod.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir adres barkodu girin.');
      return;
    }

    if (targetBarkod === secilenAdres.adresBarkodu) {
      Alert.alert('Hata', 'Aynı adrese transfer yapılamaz.');
      return;
    }

    setLoading(true);

    try {
      
      const hedefUrl = `https://apicloud.womlistapi.com/api/Adres/AdresGetir/${selectedDepo.depoId}/${targetBarkod}`;
      console.log('\n🔎 [1] Hedef Adres API:', hedefUrl);
      const hedefResponse = await fetch(hedefUrl);
      const hedefText = await hedefResponse.text();
      const hedefAdres = JSON.parse(hedefText);
      console.log('📥 Hedef Adres JSON:', hedefAdres);

      if (!hedefAdres?.adresId || hedefAdres?.durum === false) {
        Alert.alert('Hata', 'Girilen hedef adres geçersiz.');
        return;
      }

      
      const kaynakUrl = `https://apicloud.womlistapi.com/api/Adres/AdresGetir/${selectedDepo.depoId}/${secilenAdres.adresBarkodu}`;
      console.log('\n🔎 [2] Kaynak Adres API:', kaynakUrl);
      const kaynakResponse = await fetch(kaynakUrl);
      const kaynakText = await kaynakResponse.text();
      const kaynakAdres = JSON.parse(kaynakText);
      console.log('📥 Kaynak Adres JSON:', kaynakAdres);

      if (!kaynakAdres?.adresId || kaynakAdres?.durum === false) {
        Alert.alert('Hata', 'Kaynak adres geçersiz.');
        return;
      }

     
      const birim = urun?.birimListesi?.find(
        (x: any) => x.carpan1 === 1 && x.carpan2 === 1
      );
      const birimId = birim?.birimId;
      if (!birimId) {
        Alert.alert('Uyarı', 'Geçerli bir birimId bulunamadı.');
        return;
      }

      if (!urun.malzemeId) {
        Alert.alert('Uyarı', 'Geçerli bir malzemeId bulunamadı.');
        return;
      }

      const stokKodUrl = `https://apicloud.womlistapi.com/api/Stok/KotlinYeniKod/10`;
      const kodResponse = await fetch(stokKodUrl);
      const kodText = await kodResponse.text();
      const kod = JSON.parse(kodText);

       if (!kod.durum) {
        Alert.alert('Uyarı', 'Geçerli bir stok kodu bulunamadı.');
        return;
      }

     
      const now = new Date();

const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0'); 
const year = now.getFullYear();

const formattedDate = `${day}-${month}-${year}`;
      const payload = {
        kod: kod.message,
        tarih: formattedDate,
        beyannameKod: '',
        beyannameTarih: '',
        stokFisTuru: 10,
        kaynakDepoId: selectedDepo.depoId,
        kullaniciTerminalId: user.id,
        destinationDepoId: selectedDepo.depoId,
        satirlar: [
          {
            depoId: selectedDepo.depoId,
            adresId: kaynakAdres.adresId,
            malzemeTemelBilgiId: urun.malzemeId,
            kullaniciTerminalId: user.id,
            birimId: birimId,
            lotNo: barcode|| '',
            miktar: Number(miktar),
            girisCikisTuru: 2,
            carpan1: 1,
            carpan2: 1,
          },
          {
            depoId: selectedDepo.depoId,
            adresId: hedefAdres.adresId,
            malzemeTemelBilgiId: urun.malzemeId,
            kullaniciTerminalId: user.id,
            birimId: birimId,
            lotNo: barcode|| '',
            miktar: Number(miktar),
            girisCikisTuru: 1,
            carpan1: 1,
            carpan2: 1,
          },
        ],
      };

      console.log('\n📦 [3] GÖNDERİLECEK PAYLOAD:\n', JSON.stringify(payload, null, 2));

    
      const saveResponse = await fetch('https://apicloud.womlistapi.com/api/Stok/StokHareketEkle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (saveResponse.ok) {
        Alert.alert('Başarılı', 'Transfer tamamlandı.', [
          {
            text: 'Tamam',
            onPress: () =>
              navigation.navigate('MainMenu', {
                user,
                selectedDepo,
              }),
          },
        ]);
      } else {
        Alert.alert('Hata', 'Transfer API başarısız oldu.');
      }

    } catch (err) {
      console.error('❌ Transfer Hatası:', err);
      Alert.alert('Sunucu Hatası', 'Transfer sırasında bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Adres Okutunuz</Text>

        <View style={styles.card}>
          <Text style={styles.boldText}>{urun.kodu}</Text>
          <Text style={styles.barcodeText}>{urun.urunKodu}</Text>
          <Text>{urun.aciklama}</Text>
        </View>

        <View style={styles.card}>
          {urun.lotNo && (
            <Text>
              <Text style={styles.label}>Lot No:</Text> {urun.lotNo}
            </Text>
          )}
          <Text>
            <Text style={styles.label}>Sevkedilecek Miktar:</Text> {miktar}
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Adres Barkodu Giriniz"
          value={targetBarkod}
          onChangeText={setTargetBarkod}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleTransfer}
          disabled={loading}
        >
          <Text style={styles.buttonText}>KAYDET</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ea5a21',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f8f8f8',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  barcodeText: {
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ea5a21',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
