import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileText, CheckCircle2, Plus, RefreshCcw } from 'lucide-react-native';
import { clearanceAPI } from '../services/api';
import ClearanceModal from './ClearanceModal';
import WhatsAppButton from '../components/WhatsAppButton';

export default function ClearanceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/clearance');
    }
  };

  const loadRequest = useCallback(async () => {
    try {
      const { data } = await clearanceAPI.get(id);
      const container = data?.data || data;
      const req = container?.request || container;
      setRequest(req || null);
      setError('');
    } catch (e) {
      console.error('Failed to load clearance request', e);
      setError(e?.message || 'Failed to load clearance request');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await clearanceAPI.get(id);
        const container = data?.data || data;
        const req = container?.request || container;
        if (mounted) {
          setRequest(req || null);
        }
      } catch (e) {
        console.error('Failed to load clearance request', e);
        if (mounted) {
          setError(e?.message || 'Failed to load clearance request');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequest();
  }, [loadRequest]);

  const formatDateTime = (value) => {
    if (!value) return '—';
    try {
      const d = new Date(value);
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(value);
    }
  };

  const renderMetaRow = (label, value) => (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value ?? '—'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clearance Request</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#01304e" />
        </View>
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clearance Request</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || 'Request not found'}</Text>
        </View>
      </View>
    );
  }

  const docs = Array.isArray(request.Documents) ? request.Documents : [];

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.container}
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#01304e']}
          tintColor="#01304e"
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <FileText size={32} color="#FFFFFF" style={{alignSelf: 'center'}} />
        <Text style={styles.title}>Clearance Details</Text>
      </View>

      {/* Buttons row - Add Clearance on left, Refresh on right */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalOpen(true)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Clearance</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
          disabled={refreshing}
        >
          <RefreshCcw size={16} color="#fff" />
          <Text style={styles.refreshText}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        {renderMetaRow('Request ID', request.id)}
        {renderMetaRow(
          'Type',
          request.requestType === 'freight_forwarding'
            ? 'Freight Forwarding'
            : request.requestType === 'import'
            ? 'Import Clearance'
            : 'Export Clearance'
        )}
        {renderMetaRow('Status', request.status)}
        {renderMetaRow('City', request.city)}
        {renderMetaRow('Container Type', request.containerType)}
        {renderMetaRow('Transport Mode', request.transportMode)}
        {renderMetaRow('Created At', formatDateTime(request.createdAt))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipment Details</Text>
        {renderMetaRow('Port of Loading (POL)', request.pol)}
        {renderMetaRow('Port of Discharge (POD)', request.pod)}
        {renderMetaRow('Product', request.product)}
        {renderMetaRow('Incoterms', request.incoterms)}
        {renderMetaRow('CBM', request.cbm)}
        {renderMetaRow('Packages', request.packages)}
        {renderMetaRow('Container Size', request.containerSize)}
        {renderMetaRow('No. of Containers', request.numberOfContainers)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documents</Text>
        {docs.length === 0 ? (
          <Text style={styles.mutedText}>No documents linked to this request.</Text>
        ) : (
          docs.map((doc) => (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docIcon}>
                <CheckCircle2 size={18} color="#10B981" />
              </View>
              <View style={styles.docContent}>
                <Text style={styles.docTitle}>{doc.documentType}</Text>
                <Text style={styles.docSubtitle}>{doc.fileName}</Text>
              </View>
            </View>
          ))
        )}
      </View>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>

    {/* Clearance Modal */}
    <ClearanceModal 
      visible={isModalOpen} 
      onClose={() => {
        setIsModalOpen(false);
        // Reload the request in case we need to refresh
        loadRequest();
      }} 
    />
    <WhatsAppButton accessibilityLabel="Contact Cargo360 support on WhatsApp" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 24,
    backgroundColor: '#01304e',
    color: '#FFFFFF',
    gap: 16,
    marginBottom: 24,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    height: 180,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 1,
    marginBottom: 17,
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#01304e',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ed8411',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 8,
    gap: 6,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    marginLeft: 12,
    flexShrink: 1,
    textAlign: 'right',
  },
  mutedText: {
    fontSize: 13,
    color: '#6B7280',
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  docIcon: {
    width: 28,
    alignItems: 'center',
  },
  docContent: {
    flex: 1,
    marginLeft: 4,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  docSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
});


