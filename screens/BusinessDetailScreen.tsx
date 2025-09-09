// screens/BusinessDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../App';
import { API_BASE } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BusinessDetail'>;
type RoutePropType = RouteProp<RootStackParamList, 'BusinessDetail'>;

const THEME = {
  primary: '#FF6B00',
  bg: '#FFFFFF',
  card: '#F9F9F9',
  text: '#222',
  subtext: '#666',
  line: '#eee',
  success: '#21A179',
  warn: '#F4A100',
  danger: '#FF3B30',
};

interface Review {
  id: number;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    fullName: string;
  };
}

interface RatingSummary {
  average: number;
  count: number;
  breakdown: Record<number, number>;
}

export default function BusinessDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { provider } = route.params;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    loadBusinessData();
  }, [provider.id]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadRatingSummary(),
        loadReviews()
      ]);
    } catch (error) {
      console.error('❌ İşletme bilgileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRatingSummary = async () => {
    try {
      const res = await fetch(`${API_BASE}/ServiceProviders/${provider.id}/rating`);
      if (res.ok) {
        const data = await res.json();
        setRatingSummary(data);
      }
    } catch (error) {
      console.error('❌ Yıldız bilgisi yüklenemedi:', error);
    }
  };

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await fetch(`${API_BASE}/ServiceProviders/${provider.id}/reviews?take=10`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('❌ Yorumlar yüklenemedi:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[styles.star, { fontSize: size }]}>
          {i <= rating ? '⭐' : '☆'}
        </Text>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>{item.user.fullName}</Text>
        {renderStars(item.rating, 14)}
      </View>
      {item.comment && (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      )}
      <Text style={styles.reviewDate}>
        {new Date(item.createdAt).toLocaleDateString('tr-TR')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.businessName}>{provider.shopName || provider.fullName}</Text>
        <Text style={styles.profession}>{provider.profession}</Text>
      </View>

      {/* RATING CARD */}
      {ratingSummary && ratingSummary.count > 0 && (
        <View style={styles.ratingCard}>
          <View style={styles.ratingHeader}>
            <View style={styles.ratingMain}>
              <Text style={styles.ratingNumber}>{ratingSummary.average.toFixed(1)}</Text>
              {renderStars(Math.round(ratingSummary.average), 20)}
            </View>
            <View style={styles.ratingDetails}>
              <Text style={styles.ratingCount}>{ratingSummary.count} değerlendirme</Text>
              <Text style={styles.ratingBreakdown}>
                {Object.entries(ratingSummary.breakdown)
                  .reverse()
                  .map(([rating, count]) => `${rating}⭐: ${count}`)
                  .join(' • ')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* REVIEWS */}
      <Text style={styles.sectionTitle}>💬 Müşteri Yorumları</Text>
      
      {loadingReviews ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={THEME.primary} />
        </View>
      ) : reviews.length > 0 ? (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReview}
          scrollEnabled={false}
          ListFooterComponent={
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('ReviewsList', { providerId: provider.id })}
            >
              <Text style={styles.viewAllText}>Tüm Yorumları Gör</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <View style={styles.emptyReviews}>
          <Text style={styles.emptyText}>Henüz yorum yapılmamış.</Text>
          <Text style={styles.emptySubtext}>İlk yorumu sen yap!</Text>
        </View>
      )}

      {/* BOOK APPOINTMENT BUTTON */}
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => navigation.navigate('Appointment', { provider })}
      >
        <Text style={styles.bookButtonText}>📅 Randevu Al</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    backgroundColor: THEME.primary,
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  businessName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  profession: { fontSize: 16, color: '#fff', opacity: 0.9 },
  
  ratingCard: {
    backgroundColor: THEME.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  ratingHeader: { flexDirection: 'row', alignItems: 'center' },
  ratingMain: { alignItems: 'center', marginRight: 20 },
  ratingNumber: { fontSize: 32, fontWeight: '800', color: THEME.text, marginBottom: 8 },
  ratingDetails: { flex: 1 },
  ratingCount: { fontSize: 16, fontWeight: '700', color: THEME.text, marginBottom: 4 },
  ratingBreakdown: { fontSize: 12, color: THEME.subtext },
  starsContainer: { flexDirection: 'row' },
  star: { marginHorizontal: 1 },
  
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    marginHorizontal: 16, 
    marginTop: 16, 
    marginBottom: 12, 
    color: THEME.text 
  },
  
  reviewCard: {
    backgroundColor: THEME.card,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  reviewHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  reviewerName: { fontSize: 16, fontWeight: '700', color: THEME.text },
  reviewComment: { fontSize: 14, color: THEME.text, marginBottom: 8, lineHeight: 20 },
  reviewDate: { fontSize: 12, color: THEME.subtext, textAlign: 'right' },
  
  viewAllButton: {
    backgroundColor: THEME.primary,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllText: { color: '#fff', fontWeight: '700' },
  
  emptyReviews: {
    alignItems: 'center',
    marginVertical: 40,
    marginHorizontal: 16,
  },
  emptyText: { fontSize: 16, color: THEME.subtext, marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: THEME.subtext, opacity: 0.7 },
  
  bookButton: {
    backgroundColor: THEME.success,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
