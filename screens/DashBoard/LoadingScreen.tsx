import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';

export default function LoadingScreen({ route, navigation }: any) {
  const { url } = route.params;

  useEffect(() => {
    fetch(`${url}/api/Login`)
      .then(res => res.text())
      .then(text => {
        try {
         
          if (!text || text.trim() === '') {
            throw new Error('Boş yanıt geldi');
          }

         
          const data = JSON.parse(text);

          
          navigation.replace('UserSelect', { users: data, url });
        } catch (e) {
          console.error('JSON Hatası:', e);
          Alert.alert('Hata', 'API yanıtı işlenemedi.');
          navigation.goBack();
        }
      })
      .catch(error => {
        console.error('API Hatası:', error);
        Alert.alert('Hata', 'API bağlantısı kurulamadı.');
        navigation.goBack();
      });
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ea5a21" />
      <Text style={styles.text}>Kullanıcılar Yükleniyor...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3edea'
  },
  text: {
    marginTop: 12, fontSize: 16
  }
});
