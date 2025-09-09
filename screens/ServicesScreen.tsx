// screens/ServicesScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = 'http://192.168.1.15:45472/api';

type ServiceItem = {
  id?: number; Id?: number;
  name?: string; Name?: string;
  price?: number; Price?: number;
  duration?: number; Duration?: number;
};

const normId = (s: ServiceItem) => Number(s.id ?? s.Id);
const normName = (s: ServiceItem) => s.name ?? s.Name ?? '';
const normPrice = (s: ServiceItem) => Number(s.price ?? s.Price ?? 0);
const normDuration = (s: ServiceItem) => Number(s.duration ?? s.Duration ?? 0);

// --- Clipboard helper (paket varsa onu, yoksa RN fallback) ---
const copyText = async (text: string) => {
  try {
    // @ts-ignore
    const Clip = require('@react-native-clipboard/clipboard');
    Clip.setString(text);
  } catch {
    try {
      // @ts-ignore
      const { Clipboard } = require('react-native');
      // @ts-ignore
      Clipboard?.setString?.(text);
    } catch {
      // web fallback (expo-web vs)
      // @ts-ignore
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        // @ts-ignore
        await navigator.clipboard.writeText(text);
      }
    }
  }
};

const makeHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export default function ServicesScreen() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', duration: '' });

  // 🔎 Log modal state
  const [logVisible, setLogVisible] = useState(false);
  const [logTitle, setLogTitle] = useState('Hata Günlüğü');
  const [logText, setLogText] = useState('');

  useEffect(() => { fetchServices(); }, []);

  const openLog = (title: string, content: any) => {
    setLogTitle(title);
    const txt = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    setLogText(txt);
    setLogVisible(true);
  };

  const fmt = (o: any) => JSON.stringify(o, null, 2);

  const fetchServices = async () => {
    const reqUrl = `${API}/service/provider/${Number(await AsyncStorage.getItem('userId'))}`;
    try {
      setLoading(true);
      const providerId = await AsyncStorage.getItem('userId');
      if (!providerId) throw new Error('Giriş bulunamadı.');

      const headers = await makeHeaders();
      const res = await fetch(`${API}/service/provider/${Number(providerId)}`, { headers });

      if (!res.ok) {
        const t = await res.text();
        openLog('Hizmetler Listelenemedi', {
          REQUEST: { method: 'GET', url: reqUrl, headers },
          RESPONSE: { status: res.status, body: t },
        });
        throw new Error(t || 'Hizmetler alınamadı.');
      }
      const data = (await res.json()) as ServiceItem[];
      setServices(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log('fetchServices error:', err?.message || err);
      Alert.alert('Hata', 'Hizmetler alınırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const addService = async () => {
    if (submitting) return;

    // TR klavye virgül desteği
    const name = newService.name.trim();
    const priceStr = newService.price.trim().replace(',', '.');
    const durationStr = newService.duration.trim();

    const priceNum = Number(priceStr);
    const durationNum = Number(durationStr);

    if (!name || isNaN(priceNum) || isNaN(durationNum)) {
      Alert.alert('Hata', 'Lütfen tüm alanları doğru doldurun!');
      return;
    }
    if (priceNum < 0) {
      Alert.alert('Hata', 'Fiyat negatif olamaz.');
      return;
    }
    if (durationNum <= 0 || durationNum > 480) {
      Alert.alert('Hata', 'Süre 1–480 dk aralığında olmalı.');
      return;
    }

    const url = `${API}/service`;
    const payload = { name, price: priceNum, duration: durationNum };

    try {
      setSubmitting(true);

      const headers = await makeHeaders();
      if (!headers.Authorization) {
        openLog('Token Bulunamadı', {
          NOTE: 'POST /service için Authorization gerekiyor.',
          REQUEST: { method: 'POST', url, headers, body: payload },
        });
        Alert.alert('Hata', 'Giriş yapmanız gerekiyor (token bulunamadı).');
        return;
      }

      console.log('POST /service payload ->', payload);

      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });

      const text = await res.text();
      console.log('POST /service status:', res.status, 'body:', text);

      if (!res.ok) {
        const msgJson = (() => { try { return JSON.parse(text); } catch { return null; } })();
        const msg = msgJson?.message || text || 'Hizmet eklenemedi.';
        openLog('Hizmet Eklenemedi', {
          REQUEST: { method: 'POST', url, headers, body: payload },
          RESPONSE: { status: res.status, body: msgJson ?? text },
        });

        Alert.alert('Hata', res.status === 401
          ? (msg || 'Yetkisiz. Lütfen yeniden giriş yapın.')
          : res.status === 403
          ? (msg || 'Bu işlem için yetkiniz yok.')
          : msg);
        return;
      }

      Alert.alert('Başarılı', 'Hizmet eklendi.');
      setModalVisible(false);
      setNewService({ name: '', price: '', duration: '' });
      fetchServices();
    } catch (err: any) {
      openLog('İstek Gönderilirken Hata', {
        REQUEST: { method: 'POST', url, body: payload },
        ERROR: err?.message || String(err),
      });
      console.log('addService error:', err?.message || err);
      Alert.alert('Hata', err?.message || 'Hizmet eklenirken bir sorun oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>💈 Hizmetlerim</Text>

      <FlatList
        data={services}
        keyExtractor={(item) => String(normId(item))}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.serviceName}>{normName(item)}</Text>
            <Text style={styles.info}>💵 {normPrice(item)} ₺ | ⏱ {normDuration(item)} dk</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#666' }}>Hizmet bulunamadı.</Text>}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Yeni Hizmet Ekle</Text>
      </TouchableOpacity>

      {/* Yeni Hizmet Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={()=>setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Yeni Hizmet Ekle</Text>
            <TextInput
              placeholder="Hizmet Adı"
              style={styles.input}
              value={newService.name}
              onChangeText={(text) => setNewService({ ...newService, name: text })}
            />
            <TextInput
              placeholder="Fiyat (₺)"
              style={styles.input}
              keyboardType="decimal-pad"
              value={newService.price}
              onChangeText={(text) => setNewService({ ...newService, price: text })}
            />
            <TextInput
              placeholder="Süre (dk)"
              style={styles.input}
              keyboardType="number-pad"
              value={newService.duration}
              onChangeText={(text) => setNewService({ ...newService, duration: text })}
            />

            <TouchableOpacity style={[styles.saveButton, submitting && {opacity:0.6}]} onPress={addService} disabled={submitting}>
              <Text style={styles.saveButtonText}>{submitting ? 'Kaydediliyor…' : 'Kaydet'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 📋 Log Modal (kopyalanabilir) */}
      <Modal visible={logVisible} transparent animationType="fade" onRequestClose={()=>setLogVisible(false)}>
        <View style={styles.logBackdrop}>
          <View style={styles.logCard}>
            <Text style={styles.logTitle}>🧾 {logTitle}</Text>

            <View style={styles.logBox}>
              <ScrollView>
                <Text selectable style={styles.logText}>{logText}</Text>
              </ScrollView>
            </View>

            <View style={styles.logActions}>
              <TouchableOpacity
                style={[styles.logBtn, { backgroundColor: '#222' }]}
                onPress={async () => {
                  await copyText(logText);
                  Alert.alert('Kopyalandı', 'Log panoya kopyalandı.');
                }}
              >
                <Text style={styles.logBtnText}>Kopyala</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logBtn, { backgroundColor: '#FF6B00' }]}
                onPress={() => setLogVisible(false)}
              >
                <Text style={styles.logBtnText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#FF6B00' },
  card: { backgroundColor: '#f1f1f1', padding: 15, borderRadius: 8, marginBottom: 10 },
  serviceName: { fontSize: 18, fontWeight: 'bold' },
  info: { fontSize: 14, color: '#555' },
  addButton: { backgroundColor: '#FF6B00', padding: 15, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold' },

  modalBackground: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { backgroundColor: '#fff', padding: 20, margin: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  saveButton: { backgroundColor: '#FF6B00', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  cancelText: { textAlign: 'center', marginTop: 10, color: '#666' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Log modal styles
  logBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 16 },
  logCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, maxHeight: '85%' },
  logTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8, color: '#111' },
  logBox: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, backgroundColor: '#FAFAFA', maxHeight: 420 },
  logText: { fontFamily: 'monospace', fontSize: 12, color: '#222' },
  logActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  logBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  logBtnText: { color: '#fff', fontWeight: '800' },
});
