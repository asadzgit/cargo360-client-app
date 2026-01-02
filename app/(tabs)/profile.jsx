import { Alert, View, Text, TouchableOpacity, StyleSheet, Linking, TextInput, Modal, ScrollView } from 'react-native';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { User, Mail, Phone, MapPin, LogOut, Contact, Settings, CircleHelp as HelpCircle, Pencil, Lock, X } from 'lucide-react-native';
import { useBooking } from '../../context/BookingContext';
import { authAPI, userAPI } from '../../services/api';

// Dev-only mock profile for UI verification
const USE_PROFILE_MOCK = __DEV__; // true in dev/Expo, false in production
const MOCK_PROFILE = {
  id: 1,
  name: 'Demo User',
  email: 'demo@cargo360pk.com',
  phone: '+92 300 1234567',
  role: 'customer',
  isApproved: true,
  isEmailVerified: true,
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, bookings } = useBooking();

  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);

  const [formCompany, setFormCompany] = useState(''); // ✅ kept but no updates


  // Inline edit state
  const [editing, setEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Change password modal state
  const [pwdVisible, setPwdVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const [delLoading, setDelLoading] = useState(false);

  // Resend verification email state
  const [resendLoading, setResendLoading] = useState(false);

  // Scroll to top when screen gains focus
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await authAPI.me();
        // API returns { user: { ... } }
        const u = data?.user || data;
        if (mounted) {
          setProfile(u);
          setFormName(u?.name || '');
          setFormPhone(u?.phone || '');
          setFormCompany(u?.company || ''); // ✅ keep but not editable
        }
      } catch (e) {
        // If unauthorized, route to login
        if (USE_PROFILE_MOCK) {
          setProfile(MOCK_PROFILE);
          setFormName(MOCK_PROFILE.name);
          setFormPhone(MOCK_PROFILE.phone);
          setFormCompany(MOCK_PROFILE.company);
        } else {
          router.replace('/login');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (user && !profile) {
      setFormName(user?.name || '');
      setFormPhone(user?.phone || '');
      setFormCompany(user?.company || '');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleToggleEdit = () => {
    setUpdateError('');
    if (!editing) {
      setFormName(profile?.name || user?.name || '');
      setFormPhone(profile?.phone || user?.phone || '');
      setFormCompany(profile?.company || '');
    }
    setEditing((v) => !v);
  };
  
  const handleUpdateProfile = async () => {
    setUpdateError('');
    const payload = {};
    if (formName && formName !== (profile?.name || user?.name || '')) payload.name = formName.trim();
    if (formPhone !== (profile?.phone || user?.phone || '')) payload.phone = formPhone?.trim() || '';
    
    if (formCompany !== (profile?.company || '')){payload.company = formCompany.trim();
}

    // ✅ FIXED VALIDATION
    if (Object.keys(payload).length === 0) {  // ✅ CHANGE
      setUpdateError('No changes to update.');
      return;
    }
  
    try {
      setUpdateLoading(true);
      const { data } = await userAPI.updateMe(payload);
      const u = data?.user || data;
      if (u) {
        setProfile(u);
        setEditing(false);
      }
    } catch (e) {
      setUpdateError(e?.message || 'Failed to update profile.');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  const handleChangePassword = async () => {
    setPwdError('');
    if (!currentPassword || !newPassword) {
      setPwdError('Please enter both current and new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    try {
      setPwdLoading(true);
      const { data } = await userAPI.updateMe({ currentPassword, newPassword });
      const u = data?.user || data;
      if (u) {
        setProfile(u);
      }
      setPwdVisible(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      setPwdError(e?.message || 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDelLoading(true);
      const { data } = await authAPI.deletionLink();
      // Prefer server-provided URL; fallback to building with token if needed
      const url = data?.url || `https://app.cargo360pk.com/delete-mobile-account#token=${encodeURIComponent(data?.token)}`;
      if (!url) throw new Error('Deletion link unavailable.');
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Unable to open the deletion page.');
    } finally {
      setDelLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = profile?.email || user?.email;
    if (!email) {
      Alert.alert('Error', 'Email address not found.');
      return;
    }

    try {
      setResendLoading(true);
      await authAPI.resendVerification(email);
      Alert.alert('Success', 'Verification email sent successfully! Please check your inbox. The link will expire in 24 hours.');
      // Refresh profile to get updated data
      const { data } = await authAPI.me();
      const u = data?.user || data;
      setProfile(u);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to send verification email. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'Completed').length;
  const acceptedBookings = bookings.filter(b => b.status === 'Accepted').length;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {/* <View style={styles.profilePicture}> */}
            <User size={32} color="#FFFFFF" style={{alignSelf: 'center'}} />
          {/* </View> */}
          <Text style={styles.userName}>{profile?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{profile?.email || user?.email}</Text>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <TouchableOpacity style={styles.editBtn} onPress={handleToggleEdit}>
              {editing ? (
                <X size={16} color="#DC2626" />
                ) : (
                <Pencil size={16} color="#01304e" />
                )}
                <Text
                style={[
      styles.editBtnText,
      editing && { color: '#DC2626' }, // red text when cancel
      ]}
      >
        {editing ? 'Cancel' : 'Edit Profile'}
        </Text>
        </TouchableOpacity>

          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <User size={20} color="#01304e" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                {editing ? (
                  <TextInput
                    value={formName}
                    onChangeText={setFormName}
                    style={styles.inputInline}
                    placeholder="Full name"
                    placeholderTextColor="#94A3B8"
                  />
                ) : (
                  <Text style={styles.infoValue}>{profile?.name || user?.name || '—'}</Text>
                )}
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Mail size={20} color="#01304e" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email || user?.email || '—'}</Text>
                {/* Show resend verification button if email is not verified */}
                {(() => {
                  const userFromContext = user?.user || user;
                  const emailVerified = profile?.isEmailVerified ?? userFromContext?.isEmailVerified;
                  return emailVerified !== true;
                })() && (
                  <TouchableOpacity
                    style={[styles.resendButton, resendLoading && styles.resendButtonDisabled]}
                    onPress={handleResendVerification}
                    disabled={resendLoading}
                  >
                    <Mail size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.resendButtonText}>
                      {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ✅ COMPANY — READ-ONLY */}
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Contact size={20} color="#01304e" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Company</Text>
                {editing ? (
  <TextInput
    value={formCompany}
    onChangeText={setFormCompany}
    style={styles.inputInline}
    placeholder="Company Name"
    placeholderTextColor="#94A3B8"
  />
) : (
  <Text style={[styles.infoValue]}>
    {profile?.company || '—'}
  </Text>
)}

              </View>
            </View>
            
            {editing || profile?.phone || user?.phone ? (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Phone size={20} color="#01304e" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  {editing ? (
                    <TextInput
                      value={formPhone}
                      onChangeText={(t) => setFormPhone(t.replace(/[^0-9+\\-\\s]/g, ''))}
                      style={styles.inputInline}
                      keyboardType="phone-pad"
                      placeholder="Phone (optional)"
                      placeholderTextColor="#94A3B8"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{profile?.phone || user?.phone || '—'}</Text>
                  )}
                </View>
              </View>
            ) : null}

          </View>
          <View style={{ marginTop: 16 }}>
            <TouchableOpacity style={styles.actionButton} onPress={() => { setPwdVisible(true); setPwdError(''); }}>
              <View style={styles.iconContainerAction}>
                <Lock size={20} color="#01304e" />
              </View>
              <Text style={styles.actionText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>
        {editing && (
          <View style={{ marginTop: 12 , width: '50%', marginHorizontal: 'auto'}}>
            {updateError ? <Text style={{ color: '#DC2626', marginBottom: 8 }}>{updateError}</Text> : null}
            <TouchableOpacity
              style={[styles.saveBtn, updateLoading && { opacity: 0.7 }]}
              onPress={handleUpdateProfile}
              disabled={updateLoading}
            >
              <Text style={styles.saveBtnText}>{updateLoading ? 'Updating...' : 'Update'}</Text>
            </TouchableOpacity>
          </View>
        )}

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
            <View style={styles.iconContainerSupport}>
              <Mail size={20} color="#01304e" />
            </View>
            <Text style={styles.supportLinkTextNoDecoration}>info@cargo360pk.com</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => Linking.openURL('tel:923337766609')}
          >
            <View style={styles.iconContainerSupport}>
              <Phone size={20} color="#01304e" />
            </View>
            <Text style={styles.supportLinkTextNoDecoration}>92 333 7766609</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => Linking.openURL('https://app.cargo360pk.com/privacy-policy')}
          >
            <View style={styles.iconContainerSupport}>
              <Contact size={20} color="#01304e" />
            </View>
            <Text style={styles.supportLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.supportSection}>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.logoutButton}  onPress={handleDeleteAccount} disabled={delLoading}>
            <Text style={{ color: '#DC2626' }}>{delLoading ? 'Opening…' : 'Delete Account'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        {/* Bottom sticky footer */}
        <View style={styles.footerBottom}>
          <Text style={styles.supportText}>© 2025 CARGO 360. All rights reserved.</Text>
        </View>


      </ScrollView>
      <Modal
        visible={pwdVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPwdVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            {pwdError ? <Text style={{ color: '#DC2626', marginBottom: 8 }}>{pwdError}</Text> : null}
            <TextInput
              style={styles.modalInput}
              placeholder="Current password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholderTextColor="#94A3B8"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="New password (min 6 chars)"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholderTextColor="#94A3B8"
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#01304e' }]}
                onPress={handleChangePassword}
                disabled={pwdLoading}
              >
                <Text style={styles.modalButtonText}>{pwdLoading ? 'Updating...' : 'Update'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#64748B' }]}
                onPress={() => setPwdVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    overflow: 'scroll',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
    height: 180,
    backgroundColor: '#01304e',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    marginBottom: 12,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  scrollContent: {
    paddingBottom: 24,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#01304e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
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
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#01304e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#777777',
    textAlign: 'center',
    fontWeight: '500',
  },
  infoSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#01304e',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerAction: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSupport: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 14,
  },
  actionText: {
    fontSize: 16,
    color: '#333333',
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
    color: '#01304e',
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  supportLinkText: {
    color: '#01304e',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
    flex: 1,
  },
  supportLinkTextNoDecoration: {
    textDecorationLine: 'none',
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
  },
  supportText: {
    color: '#777777',
    fontSize: 12,
    textAlign: 'center',
  },
  footerBottom: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#E8F0F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#01304e',
  },
  editBtnText: {
    color: '#01304e',
    fontWeight: '600',
    fontSize: 12,
  },
  inputInline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#333333',
  },
  saveBtn: {
    backgroundColor: '#01304e',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Modal styles (you already have similar for edit modals; reuse if present)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#01304e',
    marginBottom: 10,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#333333',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#01304e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resendButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
    