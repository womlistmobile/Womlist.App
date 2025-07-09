import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StyleSheetProperties } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQr } from './QrContext';

export default function QrScanner({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { setScannedValue } = useQr();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScannedValue(data);
    navigation.goBack();
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Kamera izni kontrol ediliyor...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>🚫 Kameraya erişim yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <View style={styles.overlay}>
        <Text style={styles.infoText}>📷 QR Kodunuzu Kameraya Gösterin</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  infoText: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
  },
});
