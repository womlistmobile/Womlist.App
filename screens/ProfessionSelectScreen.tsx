import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function ProfessionSelectScreen() {
  const navigation = useNavigation();

  const handleSelectProfession = async (profession: string) => {
    try {
      await AsyncStorage.setItem('profession', profession);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' as never }],
      });
    } catch (error) {
      Alert.alert('Hata', 'Meslek seçimi kaydedilemedi.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hangi hizmeti arıyorsunuz?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelectProfession('Barber')}
      >
        <Text style={styles.buttonText}>💈 Berber</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelectProfession('BeautySalon')}
      >
        <Text style={styles.buttonText}>💅 Güzellik Salonu</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelectProfession('Dentist')}
      >
        <Text style={styles.buttonText}>🦷 Dişçi</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelectProfession('FootballField')}
      >
        <Text style={styles.buttonText}>⚽ Halı Saha</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#FF6B00',
  },
  button: {
    backgroundColor: '#FF6B00',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
