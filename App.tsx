import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QrProvider } from './screens/DashBoard/QrContext';

import HomeScreen from './screens/DashBoard/HomeScreen';
import LoadingScreen from './screens/DashBoard/LoadingScreen';
import UserSelectScreen from './screens/DashBoard/UserSelectScreen';
import LoginScreen from './screens/DashBoard/LoginScreen';
import DashboardScreen from './screens/DashBoard/DashBoardScreen';
import MainMenuScreen from './screens/MainMenu/MainMenuScreen';
import ProductInfoScreen from './screens/MainMenu/UrunBilgisi/ProductInfoScreen';
import LotInfoScreen from './screens/MainMenu/UrunBilgisi/LotInfoScreen';
import AddressInfoScreen from './screens/MainMenu/UrunBilgisi/AddressInfoScreen';
import AddressLotInfoScreen from './screens/MainMenu/UrunBilgisi/AddressLotInfoScreen';
import LotSorgulaScreen from './screens/MainMenu/LotBilgisi/LotSorgulaScreen';
import AdresDetayScreen from './screens/MainMenu/AdresBilgisi/AdresDetayScreen';
import FastTransferDepoScreen from './screens/MainMenu/HizliTransfer/FastTransferDepoScreen';
import FastTransferUrunScreen from './screens/MainMenu/HizliTransfer/FastTransferUrunScreen';
import FastTransferMiktarScreen from './screens/MainMenu/HizliTransfer/FastTransferMiktarScreen';
import SabitFisScreen from './screens/MainMenu/SabitFis/SabitFisScreen';
import SiparisScreen from './screens/MainMenu/SabitFis/Siparis/SiparisScreen';
import DepoScreen from './screens/MainMenu/SabitFis/Depo/SabitFisDepoScreen';
import SabitFisDetayScreen from './screens/MainMenu/SabitFis/Siparis/SabitFisDetayScreen';
import EkBilgilerScreen from './screens/MainMenu/SabitFis/Siparis/EkBilgilerScreen';
import SabitFisDepoScreen from './screens/MainMenu/SabitFis/Depo/SabitFisDepoScreen';
import DepoDetayScreen from './screens/MainMenu/SabitFis/Depo/DepoDetayScreen';
import DepoEkBilgilerScreen from './screens/MainMenu/SabitFis/Depo/DepoEkBilgilerScreen';
import IadeDetayScreen from './screens/MainMenu/SabitFis/Iade/IadeDetayScreen';
import IadeEkBilgilerScreen from './screens/MainMenu/SabitFis/Iade/IadeEkBilgilerScreen';
import IadeScreen from './screens/MainMenu/SabitFis/Iade/IadeScreen';
import ZayiScreen from './screens/MainMenu/SabitFis/Zayi/ZayiScreen';
import ZayiDetayScreen from './screens/MainMenu/SabitFis/Zayi/ZayiDetayScreen';
import ZayiEkBilgilerScreen from './screens/MainMenu/SabitFis/Zayi/ZayiEkBilgilerScreen';
import SarfScreen from './screens/MainMenu/SabitFis/Sarf/SarfScreen';
import SarfEkBilgilerScreen from './screens/MainMenu/SabitFis/Sarf/SarfEkBilgilerScreen';
import SarfDetayScreen from './screens/MainMenu/SabitFis/Sarf/SarfDetayScreen';
import UretimScreen from './screens/MainMenu/SabitFis/Uretim/UretimScreen';
import UretimEkBilgilerScreen from './screens/MainMenu/SabitFis/Uretim/UretimEkBilgilerScreen';
import UretimDetayScreen from './screens/MainMenu/SabitFis/Uretim/UretimDetayScreen';
import FasonScreen from './screens/MainMenu/SabitFis/Fason/FasonScreen';
import FasonDetayScreen from './screens/MainMenu/SabitFis/Fason/FasonDetayScreen';
import FasonEkBilgilerScreen from './screens/MainMenu/SabitFis/Fason/FasonEkBilgiler';
import DepoSayimScreen from './screens/MainMenu/DepoSayim/DepoSayimScreen';
import DepoSayimAramaScreen from './screens/MainMenu/DepoSayim/DepoSayimAramaScreen';
import DepoSayimDetayScreen from './screens/MainMenu/DepoSayim/DepoSayimDetayScreen';
import AdresTransferBarcodeScreen from './screens/MainMenu/AdreslerArasiTransfer/AdresTransferBarcodeScreen';
import AdresSecScreen from './screens/MainMenu/AdreslerArasiTransfer/AdresSecScreen';
import MiktarGirScreen from './screens/MainMenu/AdreslerArasiTransfer/MiktarGirScreen';
import AdresOkutScreen from './screens/MainMenu/AdreslerArasiTransfer/AdresOkutScreen';
import QrScanner from './screens/DashBoard/QrScanner';
import PaketListesiScreen from './screens/MainMenu/Paketleme/PaketListesiScreen';
import PaketDetayScreen from './screens/MainMenu/Paketleme/PaketDetayScreen';
import PaketlemeDetayScreen from './screens/MainMenu/Paketleme/PaketlemeDetayScreen';
import KonsinyeScreen from './screens/MainMenu/KonsinyeScreen';
import KonsinyeDetayScreen from './screens/MainMenu/KonsinyeDetayScreen';
import KonsinyeIslemKayitlariScreen from './screens/MainMenu/KonsinyeIslemKayitlariScreen';
import RezervScreen from './screens/MainMenu/RezervScreen';
import RezerveDetayScreen from './screens/MainMenu/RezerveDetayScreen';
import RezerveIslemKayitlariScreen from './screens/MainMenu/RezerveIslemKayitlariScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Geri tuşu basıldığında uygulamayı kapatma
      // Navigation otomatik olarak önceki sayfaya gidecek
      return false; // Default davranışı devam ettir
    });

    return () => backHandler.remove();
  }, []);

  return (
    <QrProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: true,
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: '#ea5a21' },
            headerTintColor: '#fff',
          }}>

          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Loading" component={LoadingScreen} options={{ title: 'Yükleniyor' }} />
          <Stack.Screen name="UserSelect" component={UserSelectScreen} options={{ title: 'Kullanıcı Seçimi' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş Yap' }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Kontrol Paneli' }} />
          <Stack.Screen name="MainMenu" component={MainMenuScreen} options={{ title: 'Ana Menü' }} />
          <Stack.Screen name="ProductInfo" component={ProductInfoScreen} options={{ title: 'Ürün Bilgisi' }} />
          <Stack.Screen name="LotInfo" component={LotInfoScreen} options={{ title: 'Lot Bilgisi' }} />
          <Stack.Screen name="AddressInfo" component={AddressInfoScreen} options={{ title: 'Adres Bilgisi' }} />
          <Stack.Screen name="AddressLotInfo" component={AddressLotInfoScreen} options={{ title: 'Adres/Lot Detay' }} />
          <Stack.Screen name="LotSorgula" component={LotSorgulaScreen} options={{ title: 'Lot Sorgula' }} />
          <Stack.Screen name="AdresDetay" component={AdresDetayScreen} options={{ title: 'Adres Detay' }} />
          <Stack.Screen name="FastTransferDepo" component={FastTransferDepoScreen} options={{ title: 'Hızlı Transfer - Depo' }} />
          <Stack.Screen name="FastTransferUrun" component={FastTransferUrunScreen} options={{ title: 'Hızlı Transfer - Ürün' }} />
          <Stack.Screen name="FastTransferMiktar" component={FastTransferMiktarScreen} options={{ title: 'Hızlı Transfer - Miktar' }} />
          <Stack.Screen name="SabitFis" component={SabitFisScreen} options={{ title: 'Sabit Fiş' }} />
          <Stack.Screen name="Siparis" component={SiparisScreen} options={{ title: 'Sipariş Fişi' }} />
          <Stack.Screen name="Depo" component={DepoScreen} options={{ title: 'Depo Fişi' }} />
          <Stack.Screen name="SabitFisDetay" component={SabitFisDetayScreen} options={{ title: 'Sipariş Detayı' }} />
          <Stack.Screen name="EkBilgiler" component={EkBilgilerScreen} options={{ title: 'Ek Bilgiler' }} />
          <Stack.Screen name="SabitFisDepo" component={SabitFisDepoScreen} options={{ title: 'Depo Girişi' }} />
          <Stack.Screen name="DepoDetay" component={DepoDetayScreen} options={{ title: 'Depo Detayı' }} />
          <Stack.Screen name="DepoEkBilgiler" component={DepoEkBilgilerScreen} options={{ title: 'Depo Ek Bilgiler' }} />
          <Stack.Screen name="Iade" component={IadeScreen} options={{ title: 'İade Fişi' }} />
          <Stack.Screen name="IadeDetay" component={IadeDetayScreen} options={{ title: 'İade Detayı' }} />
          <Stack.Screen name="IadeEkBilgiler" component={IadeEkBilgilerScreen} options={{ title: 'İade Ek Bilgiler' }} />
          <Stack.Screen name="Zayi" component={ZayiScreen} options={{ title: 'Zayi Fişi' }} />
          <Stack.Screen name="ZayiDetay" component={ZayiDetayScreen} options={{ title: 'Zayi Detayı' }} />
          <Stack.Screen name="ZayiEkBilgiler" component={ZayiEkBilgilerScreen} options={{ title: 'Zayi Ek Bilgiler' }} />
          <Stack.Screen name="Sarf" component={SarfScreen} options={{ title: 'Sarf Fişi' }} />
          <Stack.Screen name="SarfEkBilgiler" component={SarfEkBilgilerScreen} options={{ title: 'Sarf Ek Bilgiler' }} />
          <Stack.Screen name="SarfDetay" component={SarfDetayScreen} options={{ title: 'Sarf Detayı' }} />
          <Stack.Screen name="Uretim" component={UretimScreen} options={{ title: 'Üretim Fişi' }} />
          <Stack.Screen name="UretimDetay" component={UretimDetayScreen} options={{ title: 'Üretim Detayı' }} />
          <Stack.Screen name="UretimEkBilgiler" component={UretimEkBilgilerScreen} options={{ title: 'Üretim Ek Bilgiler' }} />
          <Stack.Screen name="Fason" component={FasonScreen} options={{ title: 'Fason Fişi' }} />
          <Stack.Screen name="FasonDetay" component={FasonDetayScreen} options={{ title: 'Fason Detayı' }} />
          <Stack.Screen name="FasonEkBilgiler" component={FasonEkBilgilerScreen} options={{ title: 'Fason Ek Bilgiler' }} />
          <Stack.Screen name="DepoSayim" component={DepoSayimScreen} options={{ title: 'Depo Sayımı' }} />
          <Stack.Screen name="DepoSayimArama" component={DepoSayimAramaScreen} options={{ title: 'Depo Sayım Arama' }} />
          <Stack.Screen name="DepoSayimDetay" component={DepoSayimDetayScreen} options={{ title: 'Depo Sayım Detayı' }} />
          <Stack.Screen name="AdresTransferBarcode" component={AdresTransferBarcodeScreen} options={{ title: 'Adres Transfer' }} />
          <Stack.Screen name="AdresSec" component={AdresSecScreen} options={{ title: 'Adres Seç' }} />
          <Stack.Screen name="MiktarGir" component={MiktarGirScreen} options={{ title: 'Miktar Gir' }} />
          <Stack.Screen name="AdresOkut" component={AdresOkutScreen} options={{ title: 'Adres Okut' }} />
          <Stack.Screen name="QrScanner" component={QrScanner} options={{ title: 'QR Okuyucu' }} />
          <Stack.Screen name="PaketListesi" component={PaketListesiScreen} options={{ title: 'Paket Listesi' }} />
          <Stack.Screen name="PaketDetay" component={PaketDetayScreen} options={{ title: 'Paket Detayı' }} />
          <Stack.Screen name="PaketlemeDetay" component={PaketlemeDetayScreen} options={{ title: 'Paketleme Detayı' }} />
          <Stack.Screen name="Konsinye" component={KonsinyeScreen} options={{ title: 'Konsinye' }} />
          <Stack.Screen name="KonsinyeDetay" component={KonsinyeDetayScreen} options={{ title: 'Konsinye Detayı' }} />
          <Stack.Screen name="KonsinyeIslemKayitlari" component={KonsinyeIslemKayitlariScreen} options={{ title: 'İşlem Kayıtları' }} />
          <Stack.Screen name="Rezerv" component={RezervScreen} options={{ title: 'Rezerv' }} />
          <Stack.Screen name="RezerveDetay" component={RezerveDetayScreen} options={{ title: 'Rezerve Detayı' }} />
          <Stack.Screen name="RezerveIslemKayitlari" component={RezerveIslemKayitlariScreen} options={{ title: 'İşlem Kayıtları' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </QrProvider>
  );
}
