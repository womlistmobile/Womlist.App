import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';

const API = 'http://192.168.1.15:45472/api';
const THEME = { primary: '#FF6B00', sub: '#666', line: '#eee', card: '#f7f7f7' };

type Review = { id:number; rating:number; comment?:string; userName:string; createdAt:string };

export default function ReviewsListScreen({ route }: any) {
  const { provider } = route.params; // Home->BusinessDetail gönderdiğin business objesi
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/ServiceProviders/${provider.id}/reviews?skip=0&take=50`);
        const data = await r.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
    })();
  }, [provider?.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={THEME.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
              <Text style={styles.name}>{item.userName}</Text>
              <Text style={styles.rating}>{'★'.repeat(item.rating)}{'☆'.repeat(5-item.rating)}</Text>
            </View>
            {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign:'center', color:THEME.sub }}>Henüz yorum yok.</Text>}
        contentContainerStyle={{ padding:16, paddingBottom:24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  center:{ flex:1, alignItems:'center', justifyContent:'center' },
  card:{ backgroundColor:THEME.card, padding:12, borderRadius:12, marginBottom:10, borderWidth:1, borderColor:THEME.line },
  name:{ fontWeight:'800', color:'#222' },
  rating:{ fontWeight:'800', color:'#222' },
  comment:{ marginTop:6, color:'#333' },
  date:{ marginTop:6, color:THEME.sub, fontSize:12 },
});
