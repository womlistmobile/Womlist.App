// screens/StaffHoursScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Switch,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { API_BASE, makeHeaders, getUserId, normId, normName } from '../services/api';

type Staff = { id?: number; Id?: number; fullName?: string; FullName?: string; isActive?: boolean };
type Raw = Record<string, any>;
type Hour = { day: number; isClosed: boolean; open: string | null; close: string | null };

const THEME = {
  primary: '#FF6B00',
  card: '#F6F6F6',
  text: '#222',
  sub: '#666',
  line: '#EEE',
  success: '#1B9C77',
  danger: '#FF3B30',
};

const DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']; // 0=Pazar

// Remove this function since we're importing it from api.ts

// ---- Gün normalizasyonu (0–6 / 1–7 / EN-TR isimler) ----
const DOW_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  pazar: 0, pazartesi: 1, 'salı': 2, sali: 2, 'çarşamba': 3, carsamba: 3,
  'perşembe': 4, persembe: 4, cuma: 5, cumartesi: 6,
};
const normDow = (v: any): number | null => {
  if (v == null) return null;
  if (typeof v === 'string') {
    const k = v.trim().toLowerCase();
    if (k in DOW_MAP) return DOW_MAP[k];
    const asNum = Number(v);
    if (!Number.isNaN(asNum)) v = asNum;
    else return null;
  }
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  if (n >= 0 && n <= 6) return n;
  if (n >= 1 && n <= 7) return n === 7 ? 0 : n;
  return null;
};

// alan seçici
const pick = (o: Raw, keys: string[]) => {
  const all = Object.keys(o);
  for (const want of keys) {
    const hit = all.find(a => a.toLowerCase() === want.toLowerCase());
    if (hit && o[hit] != null && o[hit] !== '') return o[hit];
  }
  return null;
};

// normalize -> 7 gün tamamlanmış Hour[]
const normalize = (arr: Raw[]): Hour[] => {
  const mapped: Hour[] = (arr || [])
    .map(h => {
      const day = normDow(h.dayOfWeek ?? h.DayOfWeek);
      if (day === null) return null;
      const isClosed = Boolean(h.isClosed ?? h.IsClosed);
      const open = pick(h, ['open', 'openTime', 'opentime', 'open_time']);
      const close = pick(h, ['close', 'closeTime', 'closetime', 'close_time']);
      return { day, isClosed, open: open ?? null, close: close ?? null } as Hour;
    })
    .filter(Boolean) as Hour[];

  return Array.from({ length: 7 }, (_, d) => {
    const m = mapped.find(x => x.day === d);
    return m ?? { day: d, isClosed: true, open: null, close: null };
  });
};

// küçük yardımcılar
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase?.() || '').join('');

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(n => parseInt(n, 10));
  return h * 60 + (m || 0);
};
const toHM = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
const rangeHM = (from: string, to: string, step = 15) => {
  const a = toMin(from);
  const b = toMin(to);
  const arr: string[] = [];
  for (let t = a; t <= b; t += step) arr.push(toHM(t));
  return arr;
};

export default function StaffHoursScreen() {
  const [loading, setLoading] = useState(true);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  const [bizHours, setBizHours] = useState<Hour[]>([]);
  const [staffHours, setStaffHours] = useState<Hour[]>([]); // düzenlenebilir kaynak

  // edit modal state
  const [editDay, setEditDay] = useState<number | null>(null);
  const [tmpClosed, setTmpClosed] = useState<boolean>(true);
  const [tmpOpen, setTmpOpen] = useState<string>('09:00');
  const [tmpClose, setTmpClose] = useState<string>('18:00');

  // LOG modal state
  const [logVisible, setLogVisible] = useState(false);
  const [logText, setLogText] = useState('');

  const openLog = (obj: any) => {
    const text = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
    setLogText(text);
    setLogVisible(true);
  };

  // ilk yükleme
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadStaff(), loadBusinessHours()]);
      } catch (e: any) {
        Alert.alert('Hata', 'Veriler yüklenemedi.');
        openLog({ error: String(e?.message || e) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // personel değişince saatlerini çek
  useEffect(() => {
    if (selectedStaffId) loadStaffHours(selectedStaffId);
  }, [selectedStaffId]);

  const loadStaff = async () => {
    const providerId = await getUserId();
    if (!providerId) return;
    const url = `${API_BASE}/staff/provider/${providerId}`;
    try {
      const r = await fetch(url);
      if (!r.ok) {
        const body = await r.text();
        openLog({ REQUEST: { method: 'GET', url }, RESPONSE: { status: r.status, body } });
        throw new Error('Personeller alınamadı.');
      }
      const data = await r.json();
      const list = (Array.isArray(data) ? data : []).filter(s => (s?.isActive ?? true));
      setStaff(list);
      if (list[0]) setSelectedStaffId(normId(list[0]));
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Personeller alınamadı.');
    }
  };

  const loadBusinessHours = async () => {
    const providerId = await getUserId();
    if (!providerId) return;
    const url = `${API_BASE}/ServiceProviders/${providerId}/hours`;
    try {
      const r = await fetch(url);
      if (!r.ok) {
        const body = await r.text();
        openLog({ REQUEST: { method: 'GET', url }, RESPONSE: { status: r.status, body } });
        throw new Error('İşletme saatleri alınamadı.');
      }
      const raw = await r.json();
      setBizHours(normalize(Array.isArray(raw) ? raw : []));
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'İşletme saatleri alınamadı.');
    }
  };

  const loadStaffHours = async (sid: number) => {
    const url = `${API_BASE}/staff/${sid}/hours`;
    try {
      const r = await fetch(url, { headers: await makeHeaders() });
      if (!r.ok) {
        const body = await r.text();
        openLog({ REQUEST: { method: 'GET', url }, RESPONSE: { status: r.status, body } });
        throw new Error('Personel saatleri alınamadı.');
      }
      const raw = await r.json();
      setStaffHours(normalize(Array.isArray(raw) ? raw : []));
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Personel saatleri alınamadı.');
    }
  };

  // ekranda gösterilecek efektif saat (işletme + personel kısıtı)
  const effective: Hour[] = useMemo(() => {
    const sMap = new Map(staffHours.map(h => [h.day, h]));
    return bizHours.map(b => {
      const s = sMap.get(b.day);
      if (!s) return b; // personel saati yoksa işletme saati
      const closed = b.isClosed || s.isClosed;
      return {
        day: b.day,
        isClosed: closed,
        open: closed ? null : (s.open ?? b.open),
        close: closed ? null : (s.close ?? b.close),
      };
    });
  }, [bizHours, staffHours]);

  // tek tıkla: personel saatlerine işletme saatlerini uygula
  const applyBusinessToStaff = () => {
    setStaffHours(bizHours.map(b => ({ ...b })));
  };

  // EDITOR ------------------------------------------------------------------
  const openEditor = (day: number) => {
    const b = bizHours.find(x => x.day === day);
    const s = staffHours.find(x => x.day === day);
    if (!b) return;

    if (b.isClosed) {
      Alert.alert('Bilgi', 'İşletme kapalı olduğu için bu gün personel de kapalıdır.');
      return;
    }

    setTmpClosed(Boolean(s?.isClosed));
    setTmpOpen((s?.open ?? b.open) || '09:00');
    setTmpClose((s?.close ?? b.close) || '18:00');
    setEditDay(day);
  };

  const saveEditor = () => {
    if (editDay === null) return;
    const b = bizHours.find(x => x.day === editDay);
    if (!b) return;

    // güvenlik: işletme saatini aşma
    if (!tmpClosed) {
      const o = toMin(tmpOpen);
      const c = toMin(tmpClose);
      const bo = toMin(b.open || '00:00');
      const bc = toMin(b.close || '23:59');

      if (o >= c) {
        Alert.alert('Hata', 'Kapanış saati açılıştan sonra olmalı.');
        return;
      }
      if (o < bo || c > bc) {
        Alert.alert('Hata', 'Personel saatleri, işletme saatlerini aşamaz.');
        return;
      }
    }

    setStaffHours(prev => {
      const copy = [...prev];
      const idx = copy.findIndex(x => x.day === editDay);
      if (idx >= 0) {
        copy[idx] = { day: editDay, isClosed: tmpClosed, open: tmpClosed ? null : tmpOpen, close: tmpClosed ? null : tmpClose };
      } else {
        copy.push({ day: editDay, isClosed: tmpClosed, open: tmpClosed ? null : tmpOpen, close: tmpClosed ? null : tmpClose });
      }
      return copy;
    });
    setEditDay(null);
  };

  // KAYDET (API)
  const save = async () => {
    try {
      if (!selectedStaffId) return;
      const payload = {
        hours: staffHours.map(s => ({
          dayOfWeek: s.day, // 0–6
          isClosed: s.isClosed,
          open: s.open,
          close: s.close,
        })),
      };
      const url = `${API_BASE}/staff/${selectedStaffId}/hours`;
      const headers = await makeHeaders();
      const r = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const bodyText = await r.text();
      if (!r.ok) {
        openLog({
          REQUEST: { method: 'PUT', url, headers, body: payload },
          RESPONSE: { status: r.status, body: bodyText },
        });
        throw new Error('Kayıt başarısız.');
      }

      Alert.alert('Başarılı', 'Personel saatleri kaydedildi.');
      await loadStaffHours(selectedStaffId);
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Kayıt başarısız.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={THEME.primary} />
      </View>
    );
  }

  // editor yardımcıları
  const bForEdit = editDay != null ? bizHours.find(x => x.day === editDay) : null;
  const openOpts =
    bForEdit && bForEdit.open && bForEdit.close
      ? rangeHM(bForEdit.open, toHM(toMin(bForEdit.close) - 15), 15)
      : [];
  const closeOpts =
    bForEdit && bForEdit.open && bForEdit.close
      ? rangeHM(toHM(toMin(tmpOpen) + 15), bForEdit.close, 15)
      : [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 Personel Çalışma Saatleri</Text>

      {/* PERSONEL CHIPS */}
      <View style={styles.chipsWrap}>
        {staff.length === 0 && <Text style={{ color: THEME.sub }}>Kayıtlı personel bulunamadı.</Text>}
        {staff.map((s) => {
          const id = normId(s);
          const active = id === selectedStaffId;
          const name = normName(s);
          return (
            <TouchableOpacity
              key={String(id)}
              onPress={() => setSelectedStaffId(id)}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, active && styles.avatarActive]}>
                <Text style={[styles.avatarText, active && styles.avatarTextActive]}>
                  {initials(name)}
                </Text>
              </View>
              <Text numberOfLines={1} style={[styles.chipText, active && styles.chipTextActive]}>
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* NOT */}
      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          Personel saatlerini özel olarak ayarlayabilirsin. Ancak işletmenin açılış–kapanış aralığını aşamaz.
        </Text>
      </View>

      {/* GÜNLER */}
      <View style={styles.daysCard}>
        {effective.map((h) => (
          <Pressable key={h.day} onPress={() => openEditor(h.day)} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{DAY_NAMES[h.day]}</Text>
            {h.isClosed ? (
              <View style={styles.badgeClosed}>
                <Text style={styles.badgeClosedText}>Kapalı</Text>
              </View>
            ) : (
              <View style={styles.badgeOpen}>
                <Text style={styles.badgeOpenText}>
                  {h.open} – {h.close}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Aksiyonlar */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={applyBusinessToStaff}>
          <Text style={[styles.btnText, styles.btnGhostText]}>İşletme Saatlerini Uygula</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={save}>
          <Text style={[styles.btnText, styles.btnPrimaryText]}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      {/* EDIT MODAL */}
      <Modal visible={editDay !== null} transparent animationType="slide" onRequestClose={() => setEditDay(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editDay !== null ? `${DAY_NAMES[editDay]} – Düzenle` : 'Düzenle'}</Text>

            {bForEdit?.isClosed ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>İşletme kapalı: Personel de kapalıdır.</Text>
              </View>
            ) : (
              <>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Kapalı</Text>
                  <Switch value={tmpClosed} onValueChange={setTmpClosed} />
                </View>

                {!tmpClosed && (
                  <>
                    <Text style={styles.modalSub}>Açılış</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optsRow}>
                      {openOpts.map((hm) => (
                        <TouchableOpacity
                          key={`o-${hm}`}
                          style={[styles.opt, tmpOpen === hm && styles.optActive]}
                          onPress={() => {
                            setTmpOpen(hm);
                            if (toMin(tmpClose) <= toMin(hm)) {
                              const next = toHM(toMin(hm) + 15);
                              setTmpClose(next);
                            }
                          }}
                        >
                          <Text style={[styles.optText, tmpOpen === hm && styles.optTextActive]}>{hm}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.modalSub}>Kapanış</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optsRow}>
                      {closeOpts.map((hm) => (
                        <TouchableOpacity
                          key={`c-${hm}`}
                          style={[styles.opt, tmpClose === hm && styles.optActive]}
                          onPress={() => setTmpClose(hm)}
                        >
                          <Text style={[styles.optText, tmpClose === hm && styles.optTextActive]}>{hm}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View style={styles.hintRow}>
                      <TouchableOpacity
                        onPress={() => {
                          if (!bForEdit) return;
                          setTmpClosed(bForEdit.isClosed);
                          setTmpOpen(bForEdit.open || '09:00');
                          setTmpClose(bForEdit.close || '18:00');
                        }}
                      >
                        <Text style={styles.hintLink}>Sıfırla (İşletme)</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.smallBtn, styles.smallGhost]} onPress={() => setEditDay(null)}>
                <Text style={[styles.smallText, styles.smallGhostText]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, styles.smallPrimary]} onPress={saveEditor}>
                <Text style={[styles.smallText, styles.smallPrimaryText]}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* LOG MODAL (kopyalanabilir) */}
      <Modal visible={logVisible} transparent animationType="fade" onRequestClose={() => setLogVisible(false)}>
        <View style={styles.logOverlay}>
          <View style={styles.logBox}>
            <Text style={styles.logTitle}>Hata Günlüğü</Text>
            <ScrollView style={styles.logScroll}>
              <Text selectable style={styles.logMono}>
                {logText || '(boş)'}
              </Text>
            </ScrollView>

            <View style={styles.logActions}>
              <TouchableOpacity
                style={[styles.smallBtn, styles.smallGhost]}
                onPress={async () => {
                  try { await Share.share({ message: logText || '' }); } catch {}
                }}
              >
                <Text style={[styles.smallText, styles.smallGhostText]}>Paylaş/Kopyala</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, styles.smallPrimary]} onPress={() => setLogVisible(false)}>
                <Text style={[styles.smallText, styles.smallPrimaryText]}>Kapat</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.logHint}>Metin seçilebilir. Uzun basarak kopyalayabilirsin.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// -- STYLES -------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: THEME.primary, marginBottom: 10 },

  // personel chipleri
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 10,
    backgroundColor: THEME.card, borderRadius: 999,
    borderWidth: 1, borderColor: THEME.line, maxWidth: '100%',
  },
  chipActive: { backgroundColor: '#FFF4EC', borderColor: THEME.primary },
  chipText: { color: THEME.text, fontWeight: '700', maxWidth: 160 },
  chipTextActive: { color: THEME.primary },
  avatar: {
    width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EDEDED', marginRight: 8,
  },
  avatarActive: { backgroundColor: THEME.primary },
  avatarText: { color: '#444', fontWeight: '800', fontSize: 12 },
  avatarTextActive: { color: '#fff' },

  // bilgi kutusu
  noteBox: {
    backgroundColor: '#FFF5EC', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#F2E3D6', marginBottom: 8,
  },
  noteText: { color: THEME.sub },

  // gün listesi
  daysCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: THEME.line, borderRadius: 12, overflow: 'hidden' },
  dayRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: THEME.line,
  },
  dayLabel: { fontWeight: '800', color: THEME.text },

  badgeClosed: { backgroundColor: '#FFE9E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeClosedText: { color: THEME.danger, fontWeight: '800' },
  badgeOpen:   { backgroundColor: '#E9F7F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeOpenText: { color: THEME.success, fontWeight: '800' },

  // alt aksiyonlar
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  btnGhost: { backgroundColor: '#fff', borderColor: THEME.line },
  btnGhostText: { color: THEME.text },
  btnPrimary: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  btnPrimaryText: { color: '#fff' },
  btnText: { fontWeight: '800' },

  // modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', padding: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: THEME.text, marginBottom: 8 },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  switchLabel: { fontWeight: '700', color: THEME.text },

  modalSub: { marginTop: 6, marginBottom: 6, fontWeight: '800', color: THEME.text },
  optsRow: { paddingVertical: 4, gap: 8, paddingHorizontal: 2 },
  opt: {
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10,
    backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.line, marginRight: 8,
  },
  optActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  optText: { color: THEME.text, fontWeight: '700' },
  optTextActive: { color: '#fff' },

  infoBox: { backgroundColor: '#FFF0F0', borderColor: '#FFDADA', borderWidth: 1, borderRadius: 10, padding: 10, marginVertical: 8 },
  infoText: { color: THEME.danger },

  hintRow: { marginTop: 8 },
  hintLink: { color: THEME.primary, fontWeight: '800' },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },

  // küçük butonlar (modal & log)
  smallBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  smallGhost: { backgroundColor: '#fff', borderColor: THEME.line },
  smallGhostText: { color: THEME.text, fontWeight: '800' },
  smallPrimary: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  smallPrimaryText: { color: '#fff', fontWeight: '800' },
  smallText: { fontWeight: '800' },

  // LOG modal
  logOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  logBox: { backgroundColor: '#fff', borderRadius: 14, padding: 14, maxHeight: '85%' },
  logTitle: { fontSize: 16, fontWeight: '800', color: THEME.text, marginBottom: 8 },
  logScroll: { borderWidth: 1, borderColor: THEME.line, borderRadius: 8, padding: 10, backgroundColor: '#FAFAFA' },
  logMono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }), color: '#333' },
  logActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  logHint: { marginTop: 6, color: THEME.sub, textAlign: 'right' },
});
