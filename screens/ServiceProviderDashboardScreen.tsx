// screens/ServiceProviderDashboardScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ServiceProviderDashboard'>;

const THEME = {
  primary: '#FF6B00',
  bg: '#FFFFFF',
  card: '#F9F9F9',
  text: '#222',
  subtext: '#666',
  line: '#eee',
  success: '#21A179',
  warn: '#F4A100',
  danger: '#FF3B30',
};

// API'yi merkezi servisten al
import { API_BASE } from '../services/api';
const API = API_BASE;

export default function ServiceProviderDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [userInfo, setUserInfo] = useState<any>(null);
  const [profession, setProfession] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      await Promise.all([loadAppointments(), loadUserInfo(), loadProfession()]);
      if (mounted.current) setLoading(false);
    })();
    return () => { mounted.current = false; };
  }, []);

  const loadProfession = async () => {
    const stored = await AsyncStorage.getItem('profession');
    if (stored && mounted.current) setProfession(stored);
  };

  const loadAppointments = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) throw new Error('Giriş bilgisi bulunamadı. Tekrar giriş yapın.');

      const res = await fetch(`${API}/appointment/provider/${storedUserId}`);
      if (!res.ok) throw new Error(`Sunucu hatası: ${res.status}`);
      const data = await res.json();
      if (mounted.current) setAppointments(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('Bağlantı Hatası', e?.message || 'Randevular alınamadı.');
    }
  };

  const loadUserInfo = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) return;
      const res = await fetch(`${API}/users/${storedUserId}`);
      if (!res.ok) throw new Error('Kullanıcı bilgisi alınamadı.');
      const data = await res.json();
      if (mounted.current) setUserInfo(data);
    } catch (e) {
      console.log('❌ Kullanıcı bilgisi alınamadı:', e);
    }
  };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadAppointments();
      await loadUserInfo();
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ---- actions
  const approveAppointment = async (id: number) => {
    try {
      const res = await fetch(`${API}/appointment/${id}/approve`, { method: 'PUT' });
      if (!res.ok) throw new Error('Randevu onaylanamadı.');
      Alert.alert('Başarılı', 'Randevu onaylandı!');
      loadAppointments();
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Randevu onaylanamadı.');
    }
  };

  const cancelAppointment = async (id: number) => {
    try {
      const res = await fetch(`${API}/appointment/${id}`, { method: 'DELETE' });
    // başarılı ise mesaj ve yenile
      if (!res.ok) throw new Error('Randevu iptal edilemedi.');
      Alert.alert('Başarılı', 'Randevu iptal edildi!');
      loadAppointments();
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Randevu iptal edilemedi.');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'role', 'userId', 'profession']);
    navigation.replace('Login');
  };

  // ---- helpers
  const professionToTitle = (value: string) => {
    switch (value) {
      case 'Barber': return 'Berber';
      case 'BeautySalon': return 'Güzellik Salonu';
      case 'Dentist': return 'Diş Hekimi';
      case 'FootballField': return 'Halı Saha';
      default: return 'Hizmet Sağlayıcı';
    }
  };

  const formatDateTime = (item: any) => {
    const start = item?.startTime || item?.date;
    const end = item?.endTime;
    if (!start) return '-';
    const s = new Date(start);
    const e = end ? new Date(end) : null;
    const day = s.toLocaleDateString();
    const from = s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const to = e ? e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    return `${day} — ${from}${to ? ' • ' + to : ''}`;
  };

  const statusChip = (status: string) => {
    const map: Record<string, { bg: string; fg: string; label?: string }> = {
      Approved: { bg: '#E9F7F2', fg: THEME.success, label: 'Onaylı' },
      Pending:  { bg: '#FFF6E5', fg: THEME.warn,    label: 'Beklemede' },
      Cancelled:{ bg: '#FFECEC', fg: THEME.danger,  label: 'İptal' },
      Rejected: { bg: '#FFECEC', fg: THEME.danger,  label: 'Reddedildi' },
    };
    const it = map[status] || { bg: '#EEE', fg: '#444', label: status || 'Durum' };
    return (
      <View style={[styles.chip, { backgroundColor: it.bg }]}>
        <Text style={[styles.chipText, { color: it.fg }]}>{it.label}</Text>
      </View>
    );
  };

  // ---- UI
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{professionToTitle(profession)} Paneli</Text>

        <View>
          <Pressable onPress={() => setMenuOpen(v => !v)} style={styles.profileBtn}>
            <Image
              source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/user-male-circle.png' }}
              style={styles.profileIcon}
            />
          </Pressable>

          {menuOpen && (
            <View style={styles.dropdown}>
              <Pressable
                style={styles.dropdownItem}
                onPress={() => { setMenuOpen(false); navigation.navigate('Services' as never); }}
              >
                <Text style={styles.dropdownText}>🛠 Hizmetlerim</Text>
              </Pressable>

              <Pressable
                style={styles.dropdownItem}
                onPress={() => { setMenuOpen(false); navigation.navigate('Staff' as never); }}
              >
                <Text style={styles.dropdownText}>👥 Personellerim</Text>
              </Pressable>

              <Pressable
                style={styles.dropdownItem}
                onPress={() => { setMenuOpen(false); navigation.navigate('BusinessHours' as never); }}
              >
                <Text style={styles.dropdownText}>⏰ Çalışma Saatleri</Text>
              </Pressable>

              {/* ✅ Yeni madde */}
              <Pressable
                style={styles.dropdownItem}
                onPress={() => { setMenuOpen(false); navigation.navigate('StaffHours' as never); }}
              >
                <Text style={styles.dropdownText}>👤 Personel Saatleri</Text>
              </Pressable>

              <Pressable style={styles.dropdownItemDanger} onPress={handleLogout}>
                <Text style={styles.dropdownTextDanger}>🚪 Çıkış Yap</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Menü açıkken arka plana tıklayınca kapansın */}
      {menuOpen && <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />}

      {/* INFO CARD */}
      <Text style={styles.sectionTitle}>📄 Bilgilerim</Text>
      <View style={styles.infoCard}>
        {userInfo ? (
          <>
            <Text style={styles.name}>{userInfo.fullName}</Text>
            {userInfo.tcNumber ? <Text style={styles.infoText}>TCKN: {userInfo.tcNumber}</Text> : null}
            {userInfo.taxNumber ? <Text style={styles.infoText}>Vergi No: {userInfo.taxNumber}</Text> : null}
            <Text style={styles.infoText}>E-posta: {userInfo.email}</Text>
            <Text style={styles.infoText}>Telefon: {userInfo.phoneNumber}</Text>
          </>
        ) : (
          <Text style={styles.infoText}>Kullanıcı bilgisi yüklenemedi.</Text>
        )}
      </View>

      {/* APPOINTMENTS */}
      <Text style={styles.sectionTitle}>📅 Randevularım</Text>

      <FlatList
        data={appointments}
        keyExtractor={(item, idx) => String(item?.id ?? idx)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.primary]} />}
        renderItem={({ item }) => {
          const status = (item?.status || '').toString();
          const start = item?.startTime || item?.date;
          const end = item?.endTime;

          const startDate = start ? new Date(start) : null;
          const endDate   = end ? new Date(end) : null;
          // geçmiş: endTime varsa onu; yoksa startTime’ı baz al
          const compareDate = endDate ?? startDate;
          const isPast = compareDate ? compareDate.getTime() < Date.now() : false;

          const showApprove = status === 'Pending' && !isPast;
          const showCancel  = status !== 'Cancelled' && !isPast; // iptal edilmişse ya da geçmişse gösterme

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.customerName}>{item?.user?.fullName || 'Müşteri'}</Text>
                {statusChip(status)}
              </View>

              <Text style={styles.date}>{formatDateTime(item)}</Text>

              {(showApprove || showCancel) && (
                <View style={styles.actions}>
                  {showApprove && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: THEME.success }]}
                      onPress={() => approveAppointment(item.id)}
                    >
                      <Text style={styles.actionText}>Onayla</Text>
                    </TouchableOpacity>
                  )}
                  {showCancel && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: THEME.danger }]}
                      onPress={() => cancelAppointment(item.id)}
                    >
                      <Text style={styles.actionText}>İptal Et</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Henüz randevu yok.</Text>
            <Text style={[styles.emptyText, { color: THEME.subtext, marginTop: 2 }]}>
              Müşteriler uygulamadan randevu aldıkça burada görünecek.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
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
    marginTop: 30,
    marginBottom: 8,
    position: 'relative',
    zIndex: 50,
  },
  headerText: { fontSize: 22, fontWeight: '800', color: THEME.primary },

  profileBtn: { padding: 6 },
  profileIcon: { width: 28, height: 28, tintColor: THEME.primary },

  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 24,
    zIndex: 60,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 14 },
  dropdownItemDanger: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.line,
  },
  dropdownText: { fontSize: 15, color: THEME.text },
  dropdownTextDanger: { fontSize: 15, color: THEME.danger, fontWeight: '700' },
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 40 },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 8, marginBottom: 8, color: THEME.text },

  infoCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  name: { fontSize: 18, fontWeight: '700', color: THEME.text, marginBottom: 6 },
  infoText: { color: THEME.subtext, marginTop: 2 },

  card: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  customerName: { fontSize: 16, fontWeight: '700', color: THEME.text },
  date: { color: THEME.subtext },

  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '700' },

  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flexGrow: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '800' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  emptyWrap: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: THEME.text, fontWeight: '600' },
});
