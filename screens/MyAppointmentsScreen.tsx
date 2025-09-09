// screens/MyAppointmentsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

// 🔧 Backend IP/port’unu kendi ortamına göre ayarla
const BASE_URL = 'http://192.168.1.15:45472';

type Appointment = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Pending' | 'Approved' | 'Cancelled';
  provider?: { id?: number; fullName?: string } | null;
  review?: { rating: number; comment?: string } | null;
};

// --- JWT yardımcıları ---
const tokenKeys = ['token', 'jwt', 'authToken', 'accessToken', 'userToken'];

const extractJwt = (raw?: string | null): string | null => {
  if (!raw) return null;
  let t = raw.trim().replace(/^Bearer\s+/i, '').replace(/^"+|"+$/g, '');
  const m = t.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*/);
  return m ? m[0] : t;
};

const getToken = async (): Promise<string | null> => {
  for (const k of tokenKeys) {
    const v = await AsyncStorage.getItem(k);
    const jwt = extractJwt(v);
    if (jwt) return jwt;
  }
  return null;
};

export default function MyAppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // ⭐ Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTargetId, setReviewTargetId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // ❗ Hata modalı
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('Hata');
  const [errorText, setErrorText] = useState('');

  const showError = (title: string, text: string) => {
    setErrorTitle(title);
    setErrorText(text);
    setErrorVisible(true);
  };

  const copyError = async () => {
    await Clipboard.setStringAsync(errorText);
  };

  useEffect(() => {
    getUserIdAndFetch();
  }, []);

  // --- fetch yardımcıları ---
  const timeoutFetch = async (
    url: string,
    init?: RequestInit,
    ms = 12000,
    forceToken?: string | null
  ): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
      const token = forceToken ?? (await getToken());
      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(init?.headers as Record<string, string> | undefined),
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { ...init, headers, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(id);
    }
  };

  const apiFetch = (path: string, init?: RequestInit, ms?: number, forceToken?: string | null) =>
    timeoutFetch(`${BASE_URL}${path}`, init, ms, forceToken);

  const bodyToString = (txt: string) => {
    try {
      const obj = JSON.parse(txt);
      // ASP.NET genelde {message} ya da ProblemDetails döndürür
      return JSON.stringify(obj, null, 2);
    } catch {
      return txt;
    }
  };

  const readErrorDetail = async (res: Response, path: string, method = 'GET') => {
    let text = '';
    try {
      text = await res.text();
    } catch {
      /* ignore */
    }
    const detail =
      `URL   : ${BASE_URL}${path}\n` +
      `Method: ${method}\n` +
      `Status: ${res.status}\n` +
      `------ Body ------\n` +
      (bodyToString(text) || '(boş)');
    return detail;
  };

  const getUserIdAndFetch = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      const rawToken = await getToken();

      if (!id) {
        setLoading(false);
        showError('Giriş gerekli', 'AsyncStorage’da userId bulunamadı. Lütfen tekrar giriş yap.');
        return;
      }

      const num = Number(id);
      setUserId(num);
      await fetchAppointments(num, rawToken ?? null);
    } catch (e: any) {
      setLoading(false);
      showError('Kullanıcı bilgisi okunamadı', String(e?.message || e));
    }
  };

  const normalizeAppointments = (list: any[]): Appointment[] =>
    list.map((a: any) => {
      const id = a.id ?? a.Id;
      const status = (a.status ?? a.Status) as Appointment['status'];
      const date = a.date ?? a.Date ?? a.startTime ?? a.StartTime;
      const startTime = a.startTime ?? a.StartTime ?? date;
      const endTime = a.endTime ?? a.EndTime ?? date;
      const provider = a.provider ?? a.Provider ?? null;
      const review = a.review ?? a.Review ?? null;
      if (provider && provider.fullName === undefined && provider.FullName !== undefined) {
        provider.fullName = provider.FullName;
        delete provider.FullName;
      }
      return { id, status, date, startTime, endTime, provider, review };
    });

  const fetchAppointments = async (id: number, tokenHint?: string | null) => {
    const path = `/api/appointment/user/${id}`;
    try {
      // 1. deneme
      let res = await apiFetch(path, undefined, undefined, tokenHint ?? null);

      // 401 ise bir kez sanitize token ile dene
      if (res.status === 401) {
        const raw = await getToken();
        const cleaned = extractJwt(raw);
        if (cleaned && cleaned !== raw) {
          res = await apiFetch(path, undefined, undefined, cleaned);
        }
      }

      if (!res.ok) {
        const detail = await readErrorDetail(res, path);
        showError('Randevular alınamadı', detail);
        return;
      }

      const rawList = await res.json();
      const data = Array.isArray(rawList) ? normalizeAppointments(rawList) : [];
      setAppointments(data);
    } catch (error: any) {
      showError('Bağlantı hatası', String(error?.message || error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    fetchAppointments(userId);
  }, [userId]);

  const cancelAppointment = async (appointmentId: number) => {
    const path = `/api/appointment/${appointmentId}`;
    try {
      const res = await apiFetch(path, { method: 'DELETE' });
      if (!res.ok) {
        const detail = await readErrorDetail(res, path, 'DELETE');
        showError('Randevu iptal edilemedi', detail);
        return;
      }
      await fetchAppointments(userId!);
    } catch (error: any) {
      showError('İptal sırasında hata', String(error?.message || error));
    }
  };

  // Zaman kontrol yardımcıları
  const toDate = (iso: string) => new Date(iso);
  const isPast = (iso: string) => toDate(iso).getTime() < Date.now();

  const canCancel = (item: Appointment) =>
    !isPast(item.startTime) && item.status !== 'Cancelled';

  const canReview = (item: Appointment) =>
    item.status === 'Approved' && isPast(item.endTime) && !item.review;

  // ⭐ Review modal aç/kapat
  const openReviewModal = (appointmentId: number) => {
    setReviewTargetId(appointmentId);
    setRating(0);
    setComment('');
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!reviewTargetId || rating === 0) {
      showError('Uyarı', 'Lütfen puan verin (en az 1 yıldız).');
      return;
    }
    const path = `/api/appointment/${reviewTargetId}/review`;
    try {
      setSubmitting(true);
      const res = await apiFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) {
        const detail = await readErrorDetail(res, path, 'POST');
        showError('Değerlendirme kaydedilemedi', detail);
        return;
      }
      setReviewModalVisible(false);
      await fetchAppointments(userId!);
    } catch (e: any) {
      showError('Değerlendirme sırasında hata', String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  // Yıldız seçim componenti
  const StarRow = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 8 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onChange(i)} style={{ padding: 6 }}>
          <Text style={{ fontSize: 28, color: '#FF6B00' }}>{i <= value ? '★' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Randevularım</Text>

      {appointments.length === 0 ? (
        <Text style={styles.emptyText}>Henüz randevunuz yok.</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const start = toDate(item.startTime);
            const end = toDate(item.endTime);

            return (
              <View style={styles.card}>
                <Text style={styles.barber}>
                  {item.provider?.fullName || 'İşyeri Bilgisi Yok'}
                </Text>

                <Text style={styles.date}>
                  {start.toLocaleDateString()} -{' '}
                  {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} /{' '}
                  {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>

                <Text style={styles.status}>
                  Durum: {item.status}
                  {item.review ? ' (Değerlendirme yapıldı)' : ''}
                </Text>

                {canCancel(item) && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() =>
                      setTimeout(() => cancelAppointment(item.id), 0)
                    }
                  >
                    <Text style={styles.cancelText}>❌ Randevuyu İptal Et</Text>
                  </TouchableOpacity>
                )}

                {canReview(item) && (
                  <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={() => openReviewModal(item.id)}
                  >
                    <Text style={styles.reviewText}>⭐ Değerlendir & Yorum Yap</Text>
                  </TouchableOpacity>
                )}

                {item.review && (
                  <View style={styles.reviewSummary}>
                    <Text style={{ fontWeight: 'bold' }}>
                      Puan: {'★'.repeat(item.review.rating)}
                      {'☆'.repeat(5 - item.review.rating)}
                    </Text>
                    {item.review.comment ? (
                      <Text style={{ marginTop: 4 }}>Yorum: {item.review.comment}</Text>
                    ) : null}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* ⭐ Review Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Randevuyu Değerlendir</Text>

            <StarRow value={rating} onChange={setRating} />

            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Yorumunuzu yazabilirsiniz (opsiyonel)"
              value={comment}
              onChangeText={setComment}
            />

            <TouchableOpacity
              style={[styles.saveButton, { opacity: submitting ? 0.6 : 1 }]}
              disabled={submitting}
              onPress={submitReview}
            >
              <Text style={styles.saveButtonText}>
                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
              <Text style={styles.cancelLink}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ❗ Hata Modalı (kopyalanabilir) */}
      <Modal
        visible={errorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorVisible(false)}
      >
        <View style={styles.errorBg}>
          <View style={styles.errorBody}>
            <Text style={styles.errorTitle}>{errorTitle}</Text>
            <ScrollView style={styles.errorScroll}>
              <Text selectable style={styles.errorText}>
                {errorText}
              </Text>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.errorBtn, { backgroundColor: '#0EA5E9' }]} onPress={copyError}>
                <Text style={styles.errorBtnText}>Kopyala</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.errorBtn, { backgroundColor: '#22C55E' }]} onPress={() => { setErrorVisible(false); onRefresh(); }}>
                <Text style={styles.errorBtnText}>Tekrar Dene</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.errorBtn, { backgroundColor: '#6B7280' }]} onPress={() => setErrorVisible(false)}>
                <Text style={styles.errorBtnText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#fff' },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#FF6B00',
  },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#777' },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  barber: { fontSize: 18, fontWeight: 'bold' },
  date: { marginTop: 5, fontSize: 16, color: '#555' },
  status: { marginTop: 5, fontSize: 14, color: '#666' },

  cancelButton: { marginTop: 10, backgroundColor: '#FF6B00', padding: 10, borderRadius: 6 },
  cancelText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },

  reviewButton: { marginTop: 10, backgroundColor: '#0EA5E9', padding: 10, borderRadius: 6 },
  reviewText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },

  reviewSummary: { marginTop: 8, backgroundColor: '#fff', padding: 10, borderRadius: 6 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBody: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  textArea: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: '#22C55E',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  cancelLink: { textAlign: 'center', color: '#666', marginTop: 10, fontSize: 16 },

  // Hata modalı stilleri
  errorBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  errorBody: { backgroundColor: '#fff', borderRadius: 12, padding: 14, maxHeight: '80%' },
  errorTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#DC2626', textAlign: 'center' },
  errorScroll: { maxHeight: 260, marginBottom: 10, padding: 6, backgroundColor: '#F3F4F6', borderRadius: 8 },
  errorText: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }), fontSize: 12, color: '#111827' },
  errorBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  errorBtnText: { color: '#fff', fontWeight: '600' },
});
