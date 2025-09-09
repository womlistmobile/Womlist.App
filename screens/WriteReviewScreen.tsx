import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = 'http://192.168.1.15:45472/api';
const THEME = { primary: '#FF6B00', sub: '#666', line: '#eee' };

export default function WriteReviewScreen({ route, navigation }: any) {
  const { appointment, providerId } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/reviews/byAppointment/${appointment.id}`).then(r => r.json());
        if (r?.id) {
          Alert.alert('Bilgi', 'Bu randevu için zaten yorum yapılmış.');
          navigation.goBack();
        }
      } catch {}
    })();
  }, []);

  const submit = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Hata', 'Giriş yapmanız gerekiyor.');
        return;
      }
      const payload = {
        appointmentId: appointment.id,
        providerId,
        userId: Number(userId),
        rating,
        comment: comment.trim(),
      };
      const res = await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.text()) || 'Gönderilemedi.');
      Alert.alert('Teşekkürler', 'Yorumunuz gönderildi.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Gönderilemedi.');
    }
  };

  const Star = ({ i }: { i: number }) => (
    <TouchableOpacity onPress={() => setRating(i)} style={{ padding: 6 }}>
      <Text style={{ fontSize: 28 }}>{i <= rating ? '★' : '☆'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yorum Yaz</Text>
      <Text style={{ color: THEME.sub, marginBottom: 10 }}>
        {new Date(appointment.startTime || appointment.date).toLocaleString()}
      </Text>

      <View style={styles.stars}>{[1,2,3,4,5].map(n => <Star key={n} i={n} />)}</View>

      <TextInput
        placeholder="Deneyimini anlat (opsiyonel)"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={5}
        style={styles.input}
      />

      <TouchableOpacity style={styles.btn} onPress={submit}>
        <Text style={styles.btnText}>Gönder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff', padding:16 },
  title:{ fontSize:20, fontWeight:'800', color:THEME.primary, marginBottom:6 },
  stars:{ flexDirection:'row', marginBottom:10 },
  input:{
    borderWidth:1, borderColor:THEME.line, borderRadius:10,
    padding:12, minHeight:120, textAlignVertical:'top', marginBottom:12
  },
  btn:{ backgroundColor:THEME.primary, paddingVertical:14, borderRadius:12, alignItems:'center' },
  btnText:{ color:'#fff', fontWeight:'800' },
});
