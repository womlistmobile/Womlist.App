import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function UserSelectScreen({ route, navigation }: any) {
  const { users } = route.params;

  return (
    <ScrollView style={styles.container}>
      {users.map((user: any, index: number) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => navigation.navigate('Login', { user, url: route.params.url })}

        >
          <Text style={styles.buttonText}>{user.unvan}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3edea',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
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
