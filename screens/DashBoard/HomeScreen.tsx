import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useQr } from './QrContext'; // ✅ QrContext doğru yerden import edilmeli

export default function HomeScreen({ navigation }: any) {
  const { scannedValue, setScannedValue } = useQr(); // ✅ QR verisini temizleyeceğiz
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (scannedValue) {
      setUrl(scannedValue);
      setScannedValue(''); // ✅ Temizle
    }
  }, [scannedValue]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Womlist Cloud Mobile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/logo.png')} style={styles.logo} />

        <View style={styles.card}>
          <Text style={styles.cardText}>
            Cihazın yanlarında bulunan tuşlar ile QR kod okutun veya tuşlayarak URL giriniz
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Lütfen URL Giriniz"
            value={url}
            onChangeText={setUrl}
          />
          <TouchableOpacity onPress={() => navigation.navigate('QrScanner')}>
            <Image
              source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/qr-code.png' }}
              style={{ width: 24, height: 24, marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (!url.trim()) return;
            navigation.navigate('Loading', { url });
          }}
        >
          <Text style={styles.buttonText}>SİSTEME BAĞLAN</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3edea',
  },
  header: {
    backgroundColor: '#ea5a21',
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  body: {
    padding: 20,
    justifyContent: 'flex-start',
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginVertical: 30,
  },
  card: {
    backgroundColor: '#ea5a21',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  cardText: {
    color: 'white',
    fontSize: 15,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#ea5a21',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
