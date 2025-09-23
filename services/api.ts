import AsyncStorage from '@react-native-async-storage/async-storage';

// Centralized API configuration
export const API_BASE = 'https://apicloud.womlistapi.com/api';

// Helper to create headers with authorization
export const makeHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Helper to get user ID from storage
export const getUserId = async (): Promise<number | null> => {
  const userId = await AsyncStorage.getItem('userId');
  return userId ? Number(userId) : null;
};

// Helper to normalize IDs (handles both 'id' and 'Id' properties)
export const normId = (x: any): number | null => {
  const id = x?.id ?? x?.Id;
  return id != null ? Number(id) : null;
};

// Helper to normalize names (handles both 'fullName' and 'FullName' properties)
export const normName = (x: any): string => {
  return x?.fullName ?? x?.FullName ?? 'Unknown';
};

export default {
  API_BASE,
  makeHeaders,
  getUserId,
  normId,
  normName
};
