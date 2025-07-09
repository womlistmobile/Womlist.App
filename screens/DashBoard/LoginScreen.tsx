import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function LoginScreen({ route, navigation }: any) {
  const { user, url } = route.params || {};
  const [password, setPassword] = useState('');

  if (!user || !url) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Yükleniyor...</Text>
      </View>
    );
  }

  const handleLogin = async () => {
    try {
      const response = await fetch(`${url}/api/Login/${user.id}/${password}`);
      const text = await response.text();

      if (!text || text.trim() === '') {
        throw new Error('Boş yanıt alındı');
      }

      const data = JSON.parse(text);

      if (data.durum) {
        navigation.replace('Dashboard', {
          user: data,
          depolist: data.depoListesi,
        });
      } else {
        Alert.alert('Hatalı Giriş', 'Şifre yanlış.');
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      Alert.alert('Hata', 'Bağlantı kurulamadı veya veri okunamadı.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{user.unvan}</Text>
      <Text style={styles.label}>Parola Giriniz</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="••••"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>GİRİŞ YAP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#f3edea', padding: 20, justifyContent: 'center',
  },
  header: {
    fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20,
  },
  label: {
    fontSize: 16, marginBottom: 8,
  },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20,
  },
  button: {
    backgroundColor: '#ea5a21',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white', fontSize: 16, fontWeight: 'bold',
  },
});
