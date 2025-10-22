// src/components/SettingsPage.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getTTSOptions } from '../services/ttsService';

function SettingsPage({ isVisible, onClose }) {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    languagePreference: 'vi',
    voicePreference: 'alloy',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [availableVoices, setAvailableVoices] = useState(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'ash', 'sage', 'coral']);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  useEffect(() => {
    if (isVisible && user) {
      setFormData({
        name: user.name || '',
        age: user.age?.toString() || '',
        languagePreference: user.languagePreference || 'vi',
        voicePreference: user.voicePreference || 'alloy',
      });
    }
  }, [isVisible, user]);

  // Load available voices when component mounts
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const ttsOptions = await getTTSOptions();
        if (ttsOptions.voices) {
          setAvailableVoices(ttsOptions.voices);
        }
      } catch (error) {
        console.error('Failed to load TTS voices:', error);
        // Keep default voices if API fails
      }
    };
    
    if (isVisible) {
      loadVoices();
    }
  }, [isVisible]);

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      
      const profileData = {
        name: formData.name,
        age: parseInt(formData.age) || 7,
        languagePreference: formData.languagePreference,
        voicePreference: formData.voicePreference,
      };

      await updateProfile(profileData);
      setIsEditing(false);
      Alert.alert('Thành công', 'Thông tin đã được cập nhật!');
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Thành công', 'Mật khẩu đã được thay đổi!');
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể thay đổi mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            onClose();
          }
        }
      ]
    );
  };

  const languageOptions = [
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'en', label: 'English' },
  ];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cài đặt</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* User Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
            
            <View style={styles.userInfoCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
                </Text>
              </View>
              
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'Chưa đăng nhập'}</Text>
                {user?.isGuest && (
                  <Text style={styles.guestBadge}>Tài khoản khách</Text>
                )}
              </View>
            </View>

            {/* Editable Profile Fields */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.disabledInput]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  editable={isEditing}
                  placeholder="Nhập tên của bạn"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tuổi</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.disabledInput]}
                  value={formData.age}
                  onChangeText={(text) => setFormData({ ...formData, age: text })}
                  editable={isEditing}
                  placeholder="Nhập tuổi"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ngôn ngữ</Text>
                <View style={styles.languageSelector}>
                  {languageOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.languageOption,
                        formData.languagePreference === option.value && styles.languageOptionSelected
                      ]}
                      onPress={() => isEditing && setFormData({ ...formData, languagePreference: option.value })}
                      disabled={!isEditing}
                    >
                      <Text style={[
                        styles.languageOptionText,
                        formData.languagePreference === option.value && styles.languageOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Giọng nói</Text>
                <TouchableOpacity
                  style={[styles.voiceSelector, !isEditing && styles.disabledInput]}
                  onPress={() => isEditing && setShowVoiceModal(true)}
                  disabled={!isEditing}
                >
                  <Text style={[styles.voiceSelectorText, !isEditing && styles.disabledText]}>
                    {formData.voicePreference.charAt(0).toUpperCase() + formData.voicePreference.slice(1)}
                  </Text>
                  <Text style={styles.voiceSelectorArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionButtons}>
                {isEditing ? (
                  <>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user.name || '',
                          age: user.age?.toString() || '',
                          languagePreference: user.languagePreference || 'vi',
                          voicePreference: user.voicePreference || 'alloy',
                        });
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSaveProfile}
                      disabled={isLoading}
                    >
                      <Text style={styles.saveButtonText}>
                        {isLoading ? 'Đang lưu...' : 'Lưu'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditing(true)}
                    disabled={user?.isGuest}
                  >
                    <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Password Section */}
          {user && !user.isGuest && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bảo mật</Text>
              
              {isChangingPassword ? (
                <View style={styles.passwordSection}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
                    <TextInput
                      style={styles.input}
                      value={passwordData.currentPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                      placeholder="Nhập mật khẩu hiện tại"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                    <TextInput
                      style={styles.input}
                      value={passwordData.newPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                      placeholder="Nhập mật khẩu mới"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
                    <TextInput
                      style={styles.input}
                      value={passwordData.confirmPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                      placeholder="Nhập lại mật khẩu mới"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleChangePassword}
                      disabled={isLoading}
                    >
                      <Text style={styles.saveButtonText}>
                        {isLoading ? 'Đang thay đổi...' : 'Thay đổi'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.changePasswordButton}
                  onPress={() => setIsChangingPassword(true)}
                >
                  <Text style={styles.changePasswordButtonText}>Đổi mật khẩu</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tài khoản</Text>
            
            {user && !user.isGuest && (
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Đăng xuất</Text>
              </TouchableOpacity>
            )}
            
            {user?.isGuest && (
              <View style={styles.guestInfo}>
                <Text style={styles.guestInfoText}>
                  Bạn đang sử dụng tài khoản khách. Đăng ký để lưu tiến độ học tập và truy cập đầy đủ tính năng.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Voice Selection Modal */}
        <Modal
          visible={showVoiceModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowVoiceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.voiceModal}>
              <View style={styles.voiceModalHeader}>
                <Text style={styles.voiceModalTitle}>Chọn giọng nói</Text>
                <TouchableOpacity
                  style={styles.voiceModalClose}
                  onPress={() => setShowVoiceModal(false)}
                >
                  <Text style={styles.voiceModalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.voiceList}>
                {availableVoices.map((voice) => (
                  <TouchableOpacity
                    key={voice}
                    style={[
                      styles.voiceOption,
                      formData.voicePreference === voice && styles.voiceOptionSelected
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, voicePreference: voice });
                      setShowVoiceModal(false);
                    }}
                  >
                    <Text style={[
                      styles.voiceOptionText,
                      formData.voicePreference === voice && styles.voiceOptionTextSelected
                    ]}>
                      {voice.charAt(0).toUpperCase() + voice.slice(1)}
                    </Text>
                    {formData.voicePreference === voice && (
                      <Text style={styles.voiceOptionCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50, // Account for status bar
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  guestBadge: {
    fontSize: 12,
    color: '#ff9800',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  formSection: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666666',
  },
  languageSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  languageOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  languageOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  languageOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  languageOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordSection: {
    marginTop: 8,
  },
  changePasswordButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  changePasswordButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  guestInfo: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  guestInfoText: {
    fontSize: 14,
    color: '#e65100',
    lineHeight: 20,
  },
  voiceSelector: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceSelectorText: {
    fontSize: 16,
    color: '#333333',
  },
  voiceSelectorArrow: {
    fontSize: 12,
    color: '#666666',
  },
  disabledText: {
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  voiceModal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  voiceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  voiceModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  voiceModalClose: {
    padding: 4,
  },
  voiceModalCloseText: {
    fontSize: 18,
    color: '#666666',
  },
  voiceList: {
    maxHeight: 300,
  },
  voiceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  voiceOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  voiceOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  voiceOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  voiceOptionCheck: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default SettingsPage;
