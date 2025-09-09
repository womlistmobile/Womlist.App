import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const THEME = {
  primary: '#FF6B00',
  bg: '#FFFFFF',
  card: '#F9F9F9',
  muted: '#F6F6F6',
  text: '#222222',
  subtext: '#666666',
};

// API'yi merkezi servisten al
import { API_BASE } from '../services/api';
const API_URL = `${API_BASE}/ServiceProviders`;

const CANON = ['Barber', 'BeautySalon', 'Dentist', 'FootballField'] as const;
const NUM_MAP: Record<number, string> = { 1: 'Barber', 2: 'BeautySalon', 3: 'Dentist', 4: 'FootballField' };

function normalizeProfession(p: any): string | null {
  if (p == null) return null;
  if (typeof p === 'number') return NUM_MAP[p] ?? null;
  if (typeof p === 'string') {
    const s = p.trim();
    if (/^\d+$/.test(s)) return NUM_MAP[parseInt(s, 10)] ?? null;
    if ((CANON as readonly string[]).includes(s)) return s;
    const key = s.toLowerCase();
    const map: Record<string, string> = {
      barber: 'Barber',
      'güzellik salonu': 'BeautySalon',
      'guzellik salonu': 'BeautySalon',
      beautysalon: 'BeautySalon',
      dentist: 'Dentist',
      'dişçi': 'Dentist',
      disci: 'Dentist',
      footballfield: 'FootballField',
      'halı saha': 'FootballField',
      'hali saha': 'FootballField',
    };
    return map[key] ?? null;
  }
  if (typeof p === 'object' && 'name' in p) return normalizeProfession((p as any).name);
  return null;
}

const translateProfession = (value: string) => {
  switch (value) {
    case 'Barber': return 'Berber';
    case 'BeautySalon': return 'Güzellik Salonu';
    case 'Dentist': return 'Dişçi';
    case 'FootballField': return 'Halı Saha';
    default: return 'Hizmet Sağlayıcı';
  }
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [profession, setProfession] = useState<string>('');
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const mounted = useRef(true);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      load();
      return () => { mounted.current = false; };
    }, [])
  );

  const load = async () => {
    try {
      setLoading(true);
      const storedProfession = await AsyncStorage.getItem('profession');
      if (!storedProfession) {
        navigation.reset({ index: 0, routes: [{ name: 'ProfessionSelect' as never }] });
        return;
      }
      setProfession(storedProfession);

      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('İşletmeler alınamadı.');

      const data = await res.json();
      const arr: any[] = Array.isArray(data) ? data : [];

      const filtered = arr.filter(b => {
        const np = normalizeProfession(b.profession ?? b.professionType ?? b.Profession);
        return np === storedProfession;
      });

      filtered.sort((a, b) => (a.shopName || a.fullName || '').localeCompare(b.shopName || b.fullName || ''));

      if (mounted.current) setAllBusinesses(filtered);
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Bilinmeyen hata');
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const onRefresh = async () => {
    try { setRefreshing(true); await load(); }
    finally { setRefreshing(false); }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'role', 'userId', 'profession']);
    setMenuOpen(false);
    navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
  };

  const handleChangeProfession = async () => {
    await AsyncStorage.removeItem('profession');
    setMenuOpen(false);
    navigation.reset({ index: 0, routes: [{ name: 'ProfessionSelect' as never }] });
  };

  const visibleBusinesses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allBusinesses;
    return allBusinesses.filter((b) => {
      const name = (b.fullName || '').toLowerCase();
      const shop = (b.shopName || '').toLowerCase();
      return name.includes(q) || shop.includes(q);
    });
  }, [allBusinesses, query]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>İşletmeler ({translateProfession(profession)})</Text>

        <View>
          <Pressable onPress={() => setMenuOpen(v => !v)} style={styles.profileBtn}>
            <Image
              source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/user-male-circle.png' }}
              style={styles.profileIcon}
            />
          </Pressable>

          {menuOpen && (
            <View style={styles.dropdown}>
              <Pressable style={styles.dropdownItem} onPress={() => { setMenuOpen(false); navigation.navigate('MyAppointments'); }}>
                <Text style={styles.dropdownText}>📅 Randevularım</Text>
              </Pressable>
              <Pressable style={styles.dropdownItem} onPress={handleChangeProfession}>
                <Text style={styles.dropdownText}>🛠 Hizmet Değiştir</Text>
              </Pressable>
              <Pressable style={styles.dropdownItemDanger} onPress={handleLogout}>
                <Text style={styles.dropdownTextDanger}>🚪 Çıkış Yap</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Menü açıkken arka plana tıklayınca kapansın + layering fix */}
      {menuOpen && <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />}

      {/* SEARCH + COUNT */}
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="İşletme veya kişi ara..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.countText}>{visibleBusinesses.length} sonuç</Text>

      {/* LIST */}
      <FlatList
        data={visibleBusinesses}
        refreshing={refreshing}
        onRefresh={onRefresh}
        keyExtractor={(item, index) => String(item?.id ?? item?.providerId ?? item?.userId ?? `idx-${index}`)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Appointment', { provider: item })}
          >
            <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.fullName}</Text>
              <Text style={styles.location}>{item.shopName || 'İşyeri adı yok'}</Text>
              {/* Yıldız gösterimi */}
              {item.averageRating && item.ratingCount && (
                <View style={styles.ratingRow}>
                  <Text style={styles.stars}>
                    {'⭐'.repeat(Math.round(item.averageRating))}
                    {'☆'.repeat(5 - Math.round(item.averageRating))}
                  </Text>
                  <Text style={styles.ratingText}>
                    {item.averageRating.toFixed(1)} ({item.ratingCount})
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Uygun işletme bulunamadı</Text>
            <Text style={styles.emptyText}>Aramayı temizlemeyi veya hizmeti değiştirmeyi deneyin.</Text>
            <View style={styles.emptyBtns}>
              <TouchableOpacity style={styles.buttonSecondary} onPress={onRefresh}>
                <Text style={styles.buttonSecondaryText}>Yenile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonPrimary} onPress={handleChangeProfession}>
                <Text style={styles.buttonPrimaryText}>Hizmet Değiştir</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg, padding: 16 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 8,
    position: 'relative',
    zIndex: 50, // dropdown üstte kalsın
  },
  headerText: { fontSize: 22, fontWeight: '800', color: THEME.primary, letterSpacing: 0.2 },

  profileBtn: { padding: 6 },
  profileIcon: { width: 28, height: 28, tintColor: THEME.primary },

  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 190,
    // gölge
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 24, // Android
    zIndex: 60,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 14 },
  dropdownItemDanger: { paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  dropdownText: { fontSize: 15, color: THEME.text },
  dropdownTextDanger: { fontSize: 15, color: '#FF3B30', fontWeight: '700' },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40, // header(50)/dropdown(60)'ın altında; diğer içeriklerin üstünde
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.muted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 10, android: 6 }) as number,
    marginBottom: 6,
    zIndex: 1,
  },
  searchInput: { flex: 1, fontSize: 16, color: THEME.text },
  clearText: { marginLeft: 8, color: THEME.primary, fontSize: 20, fontWeight: '700' },

  countText: { color: THEME.subtext, marginBottom: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    // gölge
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  image: { width: 56, height: 56, borderRadius: 28, marginRight: 12, backgroundColor: '#eee' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: THEME.text },
  location: { fontSize: 13, color: THEME.subtext, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  stars: { fontSize: 12, marginRight: 6 },
  ratingText: { fontSize: 11, color: THEME.subtext },
  chevron: { fontSize: 26, color: '#bbb', marginLeft: 6 },

  emptyWrap: { alignItems: 'center', marginTop: 40, paddingHorizontal: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: THEME.text, marginBottom: 4 },
  emptyText: { color: THEME.subtext, textAlign: 'center', marginBottom: 14 },
  emptyBtns: { flexDirection: 'row', gap: 10 },
  buttonPrimary: { backgroundColor: THEME.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  buttonPrimaryText: { color: '#fff', fontWeight: '800' },
  buttonSecondary: { backgroundColor: '#eee', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  buttonSecondaryText: { color: THEME.text, fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
