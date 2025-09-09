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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

// String -> Enum numarası (BACKEND'E UYUMLU!)
const PROF_TO_NUM: Record<string, number> = {
  Barber: 1,
  BeautySalon: 2,
  Dentist: 3,
  FootballField: 4,
};


export default function ServiceProviderRegisterScreen() {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [tcNumber, setTcNumber] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [shopName, setShopName] = useState('');
  // Değerler: "Barber" | "BeautySalon" | "Dentist" | "FootballField"
  const [profession, setProfession] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !phoneNumber || !password || !tcNumber || !taxNumber || !shopName || !profession) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    // Picker string değerini enum numarasına çevir
    const professionNumber = PROF_TO_NUM[profession];
    if (typeof professionNumber !== 'number') {
      Alert.alert('Hata', 'Geçerli bir meslek seçin.');
      return;
    }

    const userData = {
      fullName,
      email: email.trim().toLowerCase(),
      phoneNumber,
      password,
      role: 'ServiceProvider',
      tcNumber,
      taxNumber,
      shopName,
      profession: professionNumber, // <-- API'ye numara gider
    };

    try {
      setSubmitting(true);
      const response = await fetch('http://192.168.1.15:45472/api/Auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        let msg = 'Kayıt başarısız.';
        try {
          const err = await response.json();
          msg = err?.message || msg;
        } catch {}
        Alert.alert('Kayıt Hatası', msg);
        return;
      }

      Alert.alert('Başarılı', 'Kayıt başarılı! Giriş yapabilirsiniz.');
      navigation.navigate('Login' as never);
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Sunucuya bağlanırken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={['#ffffff', '#FF6B00']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <Text style={styles.title}>Hizmet Sağlayıcı Kayıt</Text>

        <TextInput placeholder="Ad Soyad" style={styles.input} value={fullName} onChangeText={setFullName} />
        <TextInput placeholder="Email" style={styles.input} keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput placeholder="Telefon Numarası" style={styles.input} keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
        <TextInput placeholder="Şifre" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput placeholder="T.C. Kimlik No" style={styles.input} keyboardType="numeric" value={tcNumber} onChangeText={setTcNumber} />
        <TextInput placeholder="Vergi No" style={styles.input} keyboardType="numeric" value={taxNumber} onChangeText={setTaxNumber} />
        <TextInput placeholder="İşyeri Adı" style={styles.input} value={shopName} onChangeText={setShopName} />

        {/* Meslek Seçimi (string saklanır, gönderirken numaraya çevrilir) */}
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={profession}
            onValueChange={(itemValue) => setProfession(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Meslek Seçin" value={null} />
            <Picker.Item label="Berber" value="Barber" />
            <Picker.Item label="Güzellik Salonu" value="BeautySalon" />
            <Picker.Item label="Dişçi" value="Dentist" />
            <Picker.Item label="Halı Saha" value="FootballField" />
          </Picker>
        </View>

        <TouchableOpacity style={[styles.button, submitting && { opacity: 0.6 }]} onPress={handleRegister} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Kaydediliyor...' : 'Kayıt Ol'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
          <Text style={styles.loginLink}>
            Zaten hesabın var mı? <Text style={{ fontWeight: 'bold' }}>Giriş Yap</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF6B00', textAlign: 'center', marginBottom: 25 },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  picker: { height: 50, width: '100%' },
  button: {
    backgroundColor: '#FF6B00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loginLink: { marginTop: 20, color: '#333', textAlign: 'center', fontSize: 16 },
});
