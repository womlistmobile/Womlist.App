import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';

const API_BASE = 'http://192.168.1.15:45472/api';

type DayRow = {
  dayOfWeek: number; // .NET: 0=Pazar ... 6=Cumartesi
  label: string;
  isClosed: boolean;
  open: string | null;   // "09:00"
  close: string | null;  // "18:00"
};

const DAYS: { dayOfWeek: number; label: string }[] = [
  { dayOfWeek: 1, label: 'Pazartesi' },
  { dayOfWeek: 2, label: 'Salı' },
  { dayOfWeek: 3, label: 'Çarşamba' },
  { dayOfWeek: 4, label: 'Perşembe' },
  { dayOfWeek: 5, label: 'Cuma' },
  { dayOfWeek: 6, label: 'Cumartesi' },
  { dayOfWeek: 0, label: 'Pazar' },
];

const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

export default function BusinessHoursScreen() {
  const route = useRoute<any>();            // opsiyonel: route.params.providerId
  const navigation = useNavigation<any>();

  const [providerId, setProviderId] = useState<number | null>(null);
  const [rows, setRows] = useState<DayRow[]>(
    DAYS.map(d => ({ dayOfWeek: d.dayOfWeek, label: d.label, isClosed: false, open: '09:00', close: '18:00' }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // 1) providerId: route param öncelikli, yoksa storage
        const routeId = route?.params?.providerId;
        const storedUserId = await AsyncStorage.getItem('userId');

        const pid = Number(routeId ?? storedUserId);
        if (!pid) {
          Alert.alert('Uyarı', 'Kullanıcı bulunamadı. Lütfen yeniden giriş yapın.');
          navigation.goBack();
          return;
        }
        setProviderId(pid);

        // 2) GET /api/ServiceProviders/{id}/hours
        const res = await fetch(`${API_BASE}/ServiceProviders/${pid}/hours`);
        if (!res.ok) throw new Error('Saatler alınamadı.');
        const data: { dayOfWeek: number; isClosed: boolean; open?: string; close?: string }[] = await res.json();

        if (Array.isArray(data) && data.length) {
          const map = new Map<number, { isClosed: boolean; open?: string; close?: string }>();
          data.forEach(h => map.set(h.dayOfWeek, h));

          setRows(DAYS.map(d => {
            const h = map.get(d.dayOfWeek);
            return {
              dayOfWeek: d.dayOfWeek,
              label: d.label,
              isClosed: h?.isClosed ?? false,
              open: h?.open ?? '09:00',
              close: h?.close ?? '18:00',
            };
          }));
        }
      } catch (e: any) {
        Alert.alert('Hata', e?.message || 'Saatler alınamadı.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasErrors = useMemo(() => {
    for (const r of rows) {
      if (r.isClosed) continue;
      if (!r.open || !r.close) return true;
      if (!isTime(r.open) || !isTime(r.close)) return true;
      if (r.close <= r.open) return true;
    }
    return false;
  }, [rows]);

  const setRow = (idx: number, patch: Partial<DayRow>) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      if (patch.isClosed === true) { copy[idx].open = null; copy[idx].close = null; }
      if (patch.isClosed === false) {
        copy[idx].open ??= '09:00';
        copy[idx].close ??= '18:00';
      }
      return copy;
    });
  };

  const save = async () => {
    if (!providerId) return;
    if (hasErrors) {
      Alert.alert('Uyarı', 'Lütfen saatleri HH:mm formatında ve geçerli aralıkta girin.');
      return;
    }
    try {
      setSaving(true);

      const dto = {
        hours: rows.map(r => ({
          dayOfWeek: r.dayOfWeek,
          isClosed: r.isClosed,
          open: r.isClosed ? null : r.open,
          close: r.isClosed ? null : r.close,
        })),
      };

      const token = await AsyncStorage.getItem('token');

      // PUT /api/ServiceProviders/{id}/hours
      const res = await fetch(`${API_BASE}/ServiceProviders/${providerId}/hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(dto),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Kaydedilemedi.');
      }

      Alert.alert('Başarılı', 'Çalışma saatleri kaydedildi.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Kaydetme sırasında sorun oluştu.');
    } finally {
      setSaving(false);
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
      <Text style={styles.title}>Çalışma Saatleri</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {rows.map((r, i) => (
          <View key={r.dayOfWeek} style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.dayText}>{r.label}</Text>
              <View style={styles.switchWrap}>
                <Text style={styles.switchLabel}>Kapalı</Text>
                <Switch
                  value={r.isClosed}
                  onValueChange={(v) => setRow(i, { isClosed: v })}
                  trackColor={{ true: '#ddd', false: '#FF6B00' }}
                  thumbColor={r.isClosed ? '#bbb' : '#fff'}
                />
              </View>
            </View>

            {!r.isClosed && (
              <View style={styles.timeWrap}>
                <View style={styles.timeBox}>
                  <Text style={styles.timeLabel}>Açılış</Text>
                  <TextInput
                    value={r.open ?? ''}
                    onChangeText={(t) => setRow(i, { open: t })}
                    placeholder="09:00"
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                    style={[styles.timeInput, !r.open || !isTime(r.open) ? styles.timeError : null]}
                    maxLength={5}
                  />
                </View>
                <View style={styles.timeBox}>
                  <Text style={styles.timeLabel}>Kapanış</Text>
                  <TextInput
                    value={r.close ?? ''}
                    onChangeText={(t) => setRow(i, { close: t })}
                    placeholder="18:00"
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                    style={[styles.timeInput, !r.close || !isTime(r.close) || (r.open && r.close <= r.open) ? styles.timeError : null]}
                    maxLength={5}
                  />
                </View>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveBtn, (saving || hasErrors) && { opacity: 0.6 }]}
          disabled={saving || hasErrors}
          onPress={save}
        >
          <Text style={styles.saveText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#FF6B00', marginBottom: 10 },
  row: {
    backgroundColor: '#F9F9F9', borderRadius: 12, padding: 12, marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#eee',
  },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayText: { fontSize: 16, fontWeight: '700', color: '#222' },
  switchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { color: '#666' },
  timeWrap: { flexDirection: 'row', gap: 10, marginTop: 10 },
  timeBox: { flex: 1 },
  timeLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  timeInput: {
    height: 44, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: '#eee', fontSize: 16, color: '#222',
  },
  timeError: { borderColor: '#FF3B30' },
  saveBtn: { backgroundColor: '#FF6B00', alignItems: 'center', paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
