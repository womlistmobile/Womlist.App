// screens/StaffScreen.tsx
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
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = 'http://192.168.1.15:45472/api';

type StaffItem = {
  id?: number;
  Id?: number;
  fullName?: string;
  FullName?: string;
  photoUrl?: string;
  PhotoUrl?: string;
  isActive?: boolean;
  IsActive?: boolean;
};

const normId = (s: StaffItem) => Number(s.id ?? s.Id);
const normName = (s: StaffItem) => s.fullName ?? s.FullName ?? '';
const normPhoto = (s: StaffItem) => s.photoUrl ?? s.PhotoUrl ?? '';

const makeHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export default function StaffScreen() {
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newStaff, setNewStaff] = useState({ fullName: '', photoUrl: '' });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const providerIdStr = await AsyncStorage.getItem('userId');
      if (!providerIdStr) throw new Error('Kullanıcı bulunamadı.');
      const providerId = Number(providerIdStr);

      const res = await fetch(`${API}/staff/provider/${providerId}`, {
        headers: await makeHeaders(),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Personeller alınamadı.');
      }

      const data = (await res.json()) as StaffItem[];
      setStaff(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log('fetchStaff error:', err?.message || err);
      Alert.alert('Hata', 'Personeller alınırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const addStaff = async () => {
    const fullName = newStaff.fullName.trim();
    const photoUrl = newStaff.photoUrl.trim();

    if (!fullName) {
      Alert.alert('Hata', 'Personel adı boş olamaz!');
      return;
    }

    try {
      const providerIdStr = await AsyncStorage.getItem('userId');
      if (!providerIdStr) throw new Error('Kullanıcı bulunamadı.');
      const providerId = Number(providerIdStr); // 🔧 int

      const res = await fetch(`${API}/staff`, {
        method: 'POST',
        headers: await makeHeaders(), // 🔧 Bearer token
        body: JSON.stringify({
          providerId,     // 🔧 int gider
          fullName,
          photoUrl,
          isActive: true, // 🔧 eklenir eklenmez listede görünsün
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = 'Personel eklenemedi.';
        try {
          const j = JSON.parse(text);
          msg = j?.message || msg;
        } catch {
          if (text) msg = text;
        }
        throw new Error(msg);
      }

      Alert.alert('Başarılı', 'Personel eklendi.');
      setModalVisible(false);
      setNewStaff({ fullName: '', photoUrl: '' });
      fetchStaff();
    } catch (err: any) {
      console.log('addStaff error:', err?.message || err);
      Alert.alert('Hata', err?.message || 'Personel eklenirken bir sorun oluştu.');
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
      <Text style={styles.header}>👥 Personellerim</Text>

      <FlatList
        data={staff}
        keyExtractor={(item) => String(normId(item))}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={{ uri: normPhoto(item) || 'https://via.placeholder.com/100' }}
              style={styles.staffImage}
            />
            <Text style={styles.staffName}>{normName(item)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#666' }}>Personel bulunamadı.</Text>}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Yeni Personel Ekle</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Yeni Personel Ekle</Text>
            <TextInput
              placeholder="Ad Soyad"
              style={styles.input}
              value={newStaff.fullName}
              onChangeText={(text) => setNewStaff({ ...newStaff, fullName: text })}
            />
            <TextInput
              placeholder="Fotoğraf URL (opsiyonel)"
              style={styles.input}
              value={newStaff.photoUrl}
              onChangeText={(text) => setNewStaff({ ...newStaff, photoUrl: text })}
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.saveButton} onPress={addStaff}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#FF6B00' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  staffImage: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  staffName: { fontSize: 18, fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#FF6B00',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  modalBackground: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { backgroundColor: '#fff', padding: 20, margin: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10,
  },
  saveButton: { backgroundColor: '#FF6B00', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  cancelText: { textAlign: 'center', marginTop: 10, color: '#666' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
