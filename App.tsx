import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from './screens/LoginScreen';
import CustomerRegisterScreen from './screens/CustomerRegisterScreen';
import ServiceProviderRegisterScreen from './screens/ServiceProviderRegisterScreen';
import HomeScreen from './screens/HomeScreen';
import MyAppointmentsScreen from './screens/MyAppointmentsScreen';
import BusinessDetailScreen from './screens/BusinessDetailScreen';
import AppointmentScreen from './screens/AppointmentScreen';
import ServiceProviderDashboardScreen from './screens/ServiceProviderDashboardScreen';
import ServicesScreen from './screens/ServicesScreen';
import StaffScreen from './screens/StaffScreeen';
import ProfessionSelectScreen from './screens/ProfessionSelectScreen';
import BusinessHoursScreen from './screens/BusinessHoursScreen';
import ReviewsListScreen from './screens/ReviewsListScreen';
import WriteReviewScreen from './screens/WriteReviewScreen';
import StaffHoursScreen from './screens/StaffHoursScreen';

export type RootStackParamList = {
  Login: undefined;
  CustomerRegister: undefined;
  ServiceProviderRegister: undefined;
  Home: undefined;
  MyAppointments: undefined;
  BusinessDetail: { business: any };
  Appointment: { provider: any };
  ServiceProviderDashboard: undefined;
  Services: undefined;
  Staff: undefined;
  ProfessionSelect: undefined;
  BusinessHours: undefined;
  ReviewsList: undefined;
  WriteReview: undefined;
  StaffHours: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsLoggedIn(!!token);
      setLoading(false);
    };
    checkLogin();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? 'Home' : 'Login'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="CustomerRegister" component={CustomerRegisterScreen} />
        <Stack.Screen name="ServiceProviderRegister" component={ServiceProviderRegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
        <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
        <Stack.Screen name="Appointment" component={AppointmentScreen} />
        <Stack.Screen name="ServiceProviderDashboard" component={ServiceProviderDashboardScreen} />
        <Stack.Screen name="Services" component={ServicesScreen} />
        <Stack.Screen name="Staff" component={StaffScreen} />
        <Stack.Screen name="ProfessionSelect" component={ProfessionSelectScreen} />
        <Stack.Screen name="BusinessHours" component={BusinessHoursScreen} />
        <Stack.Screen name="ReviewsList" component={ReviewsListScreen} />
        <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
        <Stack.Screen name="StaffHours" component={StaffHoursScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
