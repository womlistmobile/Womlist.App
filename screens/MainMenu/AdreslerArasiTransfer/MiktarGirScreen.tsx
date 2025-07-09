import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';

export default function MiktarGirScreen({ route, navigation }: any) {
  const { selectedDepo, user, urun, secilenAdres,barcode } = route.params;
  const [miktar, setMiktar] = useState('');

  const handleSave = () => {
    const parsedMiktar = Number(miktar);

    if (!miktar.trim() || isNaN(parsedMiktar) || parsedMiktar <= 0) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir miktar girin.');
      return;
    }

    navigation.navigate('AdresOkut', {
      selectedDepo,
      barcode,
      user,
      urun,
      secilenAdres,
      miktar: parsedMiktar,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Miktar Giriniz</Text>

        <View style={styles.card}>
          <Text style={styles.boldText}>{urun.kodu}</Text>
          <Text style={styles.barcodeText}>{urun.urunKodu}</Text>
          <Text>{urun.aciklama}</Text>
          {urun.lotNo && (
            <Text style={styles.lotText}>
              Lot No: <Text style={{ fontWeight: 'bold' }}>{urun.lotNo}</Text>
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text>{secilenAdres.adresAciklamasi}</Text>
          <Text style={{ marginTop: 4 }}>
            <Text style={{ fontWeight: 'bold' }}>Adres Miktarı:</Text> {secilenAdres.miktar} | Adet X 1 - Adet
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Miktar"
          value={miktar}
          keyboardType="numeric"
          onChangeText={setMiktar}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>KAYDET</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ea5a21',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  barcodeText: {
    fontStyle: 'italic',
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  lotText: {
    marginTop: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
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
