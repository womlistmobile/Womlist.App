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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const BASE_URL = 'http://192.168.1.15:45472'; // MyAppointments ile aynı port

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Güvenli gövde okuma (JSON değilse metne düşer) ---
  const readBodySafe = async (res: Response): Promise<any | string> => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  // --- Token ve userId olası farklı alan adlarından çıkar ---
  const pickToken = (body: any): string | null => {
    if (!body) return null;
    if (typeof body === 'string') {
      const m = body.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*/);
      return m ? m[0] : null;
    }
    return (
      body.token ??
      body.jwt ??
      body.accessToken ??
      body.data?.token ??
      null
    );
  };
  const pickUserId = (body: any): number | null => {
    if (!body) return null;
    const v =
      body.userId ??
      body.id ??
      body.user?.id ??
      body.data?.userId ??
      body.data?.id ??
      null;
    return v != null ? Number(v) : null;
  };
  const pickRole = (body: any): string | null =>
    body?.role ?? body?.user?.role ?? body?.data?.role ?? null;
  const pickProfession = (body: any): string | number | null =>
    body?.profession ?? body?.user?.profession ?? body?.data?.profession ?? null;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const body = await readBodySafe(response);
      if (!response.ok) {
        const msg =
          (typeof body === 'object' && (body?.message || body?.title)) ||
          (typeof body === 'string' ? body : 'Bir hata oluştu.');
        throw new Error(msg);
      }

      // ✅ Alan adları farklı gelse bile yakala
      const token = pickToken(body);
      const userId = pickUserId(body);
      const role = (pickRole(body) ?? '').toString();
      const profession = pickProfession(body);

      if (!token) throw new Error('Sunucudan token alınamadı.');
      if (userId == null || Number.isNaN(userId)) throw new Error('Sunucudan kullanıcı kimliği alınamadı.');

      // ✅ Login bilgilerini AsyncStorage’a kaydet
      await AsyncStorage.multiSet([
        ['token', token],
        ['jwt', token],           // uyumluluk
        ['authToken', token],     // uyumluluk
        ['userId', String(userId)],
        ['role', role || ''],
      ]);
      if (profession != null) {
        await AsyncStorage.setItem('profession', String(profession));
      }

      Alert.alert('Başarılı', 'Giriş başarılı!');

      // ✅ Rol kontrolü ile yönlendirme (mevcut akış korunur)
      if (role === 'ServiceProvider') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ServiceProviderDashboard' as never }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ProfessionSelect' as never }],
        });
      }
    } catch (error: any) {
      Alert.alert('Giriş Başarısız', error?.message || 'Sunucuya bağlanırken sorun oluştu.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#ffffff', '#FF6B00']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <Text style={styles.title}>Bansera</Text>

        <TextInput
          placeholder="E-mail"
          style={styles.input}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Şifre"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 25 }}>
          <Text style={[styles.registerLink, { textAlign: 'center' }]}>Hesabın yok mu?</Text>

          <TouchableOpacity
            style={[styles.button, { marginTop: 10, backgroundColor: '#FFA94D' }]}
            onPress={() => navigation.navigate('CustomerRegister' as never)}
          >
            <Text style={styles.buttonText}>Müşteri Olarak Kayıt Ol</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { marginTop: 10, backgroundColor: '#FF922B' }]}
            onPress={() => navigation.navigate('ServiceProviderRegister' as never)}
          >
            <Text style={styles.buttonText}>Hizmet Sağlayıcı Olarak Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: 30 },
  title: {
    fontSize: 28,
    color: '#FF6B00',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#FF6B00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  registerLink: {
    color: '#333',
    fontSize: 16,
    marginBottom: 5,
  },
});
