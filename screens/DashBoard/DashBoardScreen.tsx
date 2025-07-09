import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function DashboardScreen({ route, navigation }: any) {
  const { user, depolist } = route.params;

  return (
    <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.grid}>
        {depolist.map((depo: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.button}
            onPress={() => {
              navigation.navigate('MainMenu', {
                user,
                selectedDepo: depo, 
              });
            }}
          >
            <Text style={styles.buttonText}>{depo.aciklamasi}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3edea',
  },
  header: {
    backgroundColor: '#ea5a21',
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  grid: {
    padding: 20,
  },
  button: {
    backgroundColor: '#ea5a21',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
