import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Phone, MapPin, LogOut, Contact, Settings, CircleHelp as HelpCircle } from 'lucide-react-native';
import { useBooking } from '../../context/BookingContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, bookings } = useBooking();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'Completed').length;
  const acceptedBookings = bookings.filter(b => b.status === 'Accepted').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profilePicture}>
          <User size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.userName}>John Doe</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{acceptedBookings}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedBookings}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View> */}

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <User size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user?.name}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Mail size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>
          
          {user?.phone && <>
            <View style={styles.infoRow}>
              <Phone size={20} color="#64748B" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>
          </>}

        </View>
      </View>

      {/* <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Settings size={20} color="#64748B" />
          <Text style={styles.actionText}>Account Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <HelpCircle size={20} color="#64748B" />
          <Text style={styles.actionText}>Help & Support</Text>
        </TouchableOpacity>
        
       
      </View> */}
      {/* Support Section */}
      <View style={styles.supportSection}>
        <View style={styles.divider} />
        <Text style={styles.supportTitle}>Contact Support</Text>

        <TouchableOpacity
          style={styles.supportRow}
          onPress={() => Linking.openURL('mailto:info@cargo360pk.com')}
        >
          <Mail size={20} color="#64748B" />
          <Text style={styles.supportLinkTextNoDecoration}>info@cargo360pk.com</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportRow}
          onPress={() => Linking.openURL('tel:923337766609')}
        >
          <Phone size={20} color="#64748B" />
          <Text style={styles.supportLinkTextNoDecoration}>92 333 7766609</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportRow}
          onPress={() => Linking.openURL('https://cargo360pk.com/privacy-policy')}
        >
          <Contact size={20} color="#64748B" />
          <Text style={styles.supportLinkText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.supportSection}>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      {/* Bottom sticky footer */}
      <View style={styles.footerBottom}>
        <Text style={styles.supportText}>© 2025 CARGO 360. All rights reserved.</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  infoSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 12,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 24,
    marginTop: 16,
  },
  supportSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  supportLinkText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  supportLinkTextNoDecoration: {
    color: '#2563EB',
    textDecorationLine: 'none',
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  supportText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  footerBottom: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: 16,
  },
});
    