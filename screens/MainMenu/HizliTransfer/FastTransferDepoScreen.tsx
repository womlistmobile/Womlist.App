import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function FastTransferDepoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { depoListesi, user, selectedDepo } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {depoListesi && depoListesi.length > 0 ? (
        depoListesi.map((depo: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.depoButton}
            onPress={() => {
             
              navigation.navigate("FastTransferUrun", {
                selectedDepo: depo,             
                selectedDepoMevcut: selectedDepo, 
                user: user                     
              });
            }}
          >
            <Text style={styles.depoButtonText}>{depo.aciklamasi}</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>Gösterilecek depo bulunamadı.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f3edea',
  },
  header: {
    backgroundColor: '#ea5a21',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  depoButton: {
    backgroundColor: '#ea5a21',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  depoButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    color: '#555',
  },
});
