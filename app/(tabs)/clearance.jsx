import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FileText, ArrowRight } from 'lucide-react-native';
import { clearanceAPI } from '../../services/api';

export default function ClearanceListScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef(null);

  const fetchRequests = async () => {
    try {
      const { data } = await clearanceAPI.list({ limit: 50, offset: 0 });
      const container = data?.data || data;
      const list = Array.isArray(container?.requests)
        ? container.requests
        : Array.isArray(container)
        ? container
        : [];

      // Sort by newest first
      const sorted = [...list].sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da;
      });

      setRequests(sorted);
    } catch (e) {
      console.error('Failed to load clearance requests', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      const d = new Date(value);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(value);
    }
  };

  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    let bg = '#E5E7EB';
    let color = '#111827';
    if (s === 'pending') {
      bg = '#FEF3C7';
      color = '#92400E';
    } else if (s === 'under_review') {
      bg = '#DBEAFE';
      color = '#1D4ED8';
    } else if (s === 'approved') {
      bg = '#DCFCE7';
      color = '#166534';
    } else if (s === 'rejected') {
      bg = '#FEE2E2';
      color = '#B91C1C';
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[styles.statusText, { color }]}>{status || 'pending'}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Clearance Requests</Text>
          <Text style={styles.headerSubtitle}>Track all your clearance documentation</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#01304e" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clearance Requests</Text>
        <Text style={styles.headerSubtitle}>Track all your import, export and freight requests</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#01304e']}
            tintColor="#01304e"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={56} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No clearance requests yet</Text>
            <Text style={styles.emptySubtitle}>
              Submit import, export or freight documentation from the home screen to see them here.
            </Text>
          </View>
        ) : (
          requests.map((req) => {
            const id = req.id || req._id;
            const docsCount = Array.isArray(req.Documents) ? req.Documents.length : 0;

            return (
              <TouchableOpacity
                key={id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/clearance-detail', params: { id: String(id) } })}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {req.requestType === 'freight_forwarding'
                      ? 'Freight Forwarding'
                      : req.requestType === 'import'
                      ? 'Import Clearance'
                      : 'Export Clearance'}
                  </Text>
                  {renderStatusBadge(req.status)}
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>City</Text>
                  <Text style={styles.cardValue}>{req.city || '—'}</Text>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Container</Text>
                  <Text style={styles.cardValue}>{req.containerType || '—'}</Text>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Created</Text>
                  <Text style={styles.cardValue}>{formatDate(req.createdAt)}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>
                    {docsCount} document{docsCount === 1 ? '' : 's'}
                  </Text>
                  <ArrowRight size={18} color="#01304e" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#01304e',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#E5E7EB',
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  cardFooterText: {
    fontSize: 12,
    color: '#6B7280',
  },
});


