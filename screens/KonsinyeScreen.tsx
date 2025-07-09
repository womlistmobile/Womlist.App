import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function KonsinyeScreen({ navigation }: any) {
  useEffect(() => {
    navigation.setOptions({
      title: 'Konsinye',
      headerStyle: { backgroundColor: '#ea5a21' },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Bu sayfa şu anda bakım aşamasındadır. Kısa zaman içinde kullanıma açılacaktır.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3edea',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
});
