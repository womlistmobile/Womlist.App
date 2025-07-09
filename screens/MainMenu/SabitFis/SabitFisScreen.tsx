import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function SabitFisScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { selectedDepo,user } = route.params;

  const fisTipleri = [
    'Siparis',
    'Depo',
    'Iade',
    'Zayi',
    'Sarf',
    'Uretim',
    'Fason',
  ];

  const handlePress = (tip: string) => {
    console.log('Seçilen fiş:', tip);

    switch (tip) {
      case 'Siparis':
        navigation.navigate('Siparis', { depoId: selectedDepo.depoId,userId: user.id });
        break;
      case 'Depo':
        navigation.navigate('Depo', { depoId: selectedDepo.depoId,userId: user.id });
        break;
      case 'Iade':
        navigation.navigate('Iade', { depoId: selectedDepo.depoId, userId: user.id  });
        break;
      case 'Zayi':
        navigation.navigate('Zayi', { depoId: selectedDepo.depoId, userId: user.id });
        break;
      case 'Sarf':
        navigation.navigate('Sarf', { depoId: selectedDepo.depoId, userId: user.id });
        break;
      case 'Uretim':
        navigation.navigate('Uretim', { depoId: selectedDepo.depoId, userId: user.id });
        break;
      case 'Fason':
        navigation.navigate('Fason', { depoId: selectedDepo.depoId, userId: user.id });
        break;
      default:
        console.warn(`"${tip}" tipi için yönlendirme bulunamadı.`);
        break;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.grid}>
        {fisTipleri.map((tip, index) => (
          <TouchableOpacity key={index} style={styles.box} onPress={() => handlePress(tip)}>
            <Text style={styles.boxText}>{tip}</Text>
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
    paddingTop: 40,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  grid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  box: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#ea5a21',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
  },
  boxText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
