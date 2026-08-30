import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootStack';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../../components/Header';
import { COLORS } from '../../constants/colors';
import { AppDispatch, RootState } from '../../store/store';
import {
  fetchCurrentUser,
  updateUserProfile,
  User,
} from '../../store/userSlice';
import {
  launchImageLibrary,
  launchCamera,
  Asset,
} from 'react-native-image-picker';

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string;
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidName = (value: string) => value.trim().length >= 1;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.user.user) as User | null;
  const status = useSelector((state: RootState) => state.user.status);
  const fetchError = useSelector((state: RootState) => state.user.error);
  const profileStatus = useSelector(
    (state: RootState) => state.user.profileStatus,
  );
  const profileError = useSelector((state: RootState) => state.user.profileError);

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    profileImage: '',
  });
  const [original, setOriginal] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    profileImage: '',
  });
  const [localImageAsset, setLocalImageAsset] = useState<Asset | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Load the user on mount if not already present.
  useEffect(() => {
    if (!user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      const next: FormState = {
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        profileImage: user.profileImage ?? '',
      };
      setForm(next);
      setOriginal(next);
      setLocalImageAsset(null);
      setFieldErrors({});
    }
  }, [user]);

  const isDirty = useMemo(() => {
    if (localImageAsset) return true;

    return (
      form.firstName !== original.firstName ||
      form.lastName !== original.lastName ||
      form.email !== original.email ||
      form.profileImage !== original.profileImage
    );
  }, [form, original, localImageAsset]);

  const isSaving = profileStatus === 'loading';

  const handlePreferencesPress = () => {
    navigation.navigate('Preferences');
  };

  const handleChange = (key: keyof FieldErrors, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!isValidName(form.firstName)) {
      errors.firstName = 'First name is required.';
    }
    if (!isValidName(form.lastName)) {
      errors.lastName = 'Last name is required.';
    }
    if (!form.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!isValidEmail(form.email)) {
      errors.email = 'Enter a valid email address.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePickFromLibrary = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        includeBase64: false,
        quality: 0.8,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert(
          'Image picker error',
          result.errorMessage ?? 'Unable to open the gallery.',
        );
        return;
      }

      const asset = result.assets?.[0];

      if (asset?.uri) {
        setLocalImageAsset(asset);
        setForm(prev => ({ ...prev, profileImage: asset.uri ?? '' }));
      }
    } catch {
      Alert.alert('Image picker error', 'Unable to open the gallery.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'front',
        saveToPhotos: true,
        quality: 0.8,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert(
          'Camera error',
          result.errorMessage ?? 'Unable to open camera.',
        );
        return;
      }

      const asset = result.assets?.[0];
      if (asset?.uri) {
        setLocalImageAsset(asset);
        setForm(prev => ({ ...prev, profileImage: asset.uri ?? '' }));
      }
    } catch {
      Alert.alert('Camera error', 'Unable to open the camera.');
    }
  };

  const handleImageOptions = () => {
    Alert.alert(
      'Update profile image',
      'Choose a source for your new profile picture.',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickFromLibrary },
        ...(form.profileImage
          ? [
              {
                text: 'Remove Photo',
                style: 'destructive' as const,
                onPress: () => {
                  setLocalImageAsset(null);
                  setForm(prev => ({ ...prev, profileImage: '' }));
                },
              },
            ]
          : []),
        {
          text: 'Cancel',
          style: 'cancel' as const,
        },
      ],
    );
  };

  const handleCancel = () => {
    setForm(original);
    setLocalImageAsset(null);
    setFieldErrors({});
  };

  const handleSave = async () => {
    if (!validate()) return;

    if (!isDirty) {
      Alert.alert('No changes', 'There is nothing to update.');
      return;
    }

    const hasExistingImage = original.profileImage !== '';
    const isRemovingImage = localImageAsset === null && hasExistingImage;

    try {
      await dispatch(
        updateUserProfile({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          profileImage: localImageAsset
            ? {
                uri: localImageAsset.uri,
                type: localImageAsset.type,
                name: localImageAsset.fileName,
              }
            : undefined,
          removeProfileImage: isRemovingImage,
        }),
      ).unwrap();

      setOriginal({
        ...form,
        profileImage: localImageAsset?.uri ?? '',
      });
      setLocalImageAsset(null);

      Alert.alert('Profile updated', 'Your changes have been saved.');
    } catch (error: unknown) {
      const message =
        (error as { message?: string })?.message ??
        'Unable to update your profile. Please try again.';
      Alert.alert('Update failed', message);
    }
  };

  const avatarSource = form.profileImage ? { uri: form.profileImage } : null;

  const initials = useMemo(() => {
    const first = form.firstName.trim().charAt(0).toUpperCase();
    const last = form.lastName.trim().charAt(0).toUpperCase();
    return `${first}${last}` || '?';
  }, [form.firstName, form.lastName]);

  if (status === 'loading' && !user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <Header
          title={'Profile'}
          subtitle="Manage your account and settings"
        />

        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title={'Profile'} subtitle="Manage your account and settings" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {fetchError ? (
            <View style={styles.errorBanner}>
              <Icon name="alert-circle" size={18} color="#B91C1C" />
              <Text style={styles.errorBannerText}>{fetchError}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <View style={styles.avatarCard}>
              <TouchableOpacity
                onPress={handleImageOptions}
                activeOpacity={0.85}
                style={styles.avatarTap}
                accessibilityRole="button"
                accessibilityLabel="Update profile image"
              >
                {avatarSource ? (
                  <Image source={avatarSource} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
                <View style={styles.avatarBadge}>
                  <Icon name="camera" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <View style={styles.avatarMeta}>
                <Text style={styles.avatarName}>
                  {form.firstName || form.lastName
                    ? `${form.firstName} ${form.lastName}`.trim()
                    : 'Add your name'}
                </Text>
                <Text style={styles.avatarEmail} numberOfLines={1}>
                  {form.email || 'No email on file'}
                </Text>
                <Text style={styles.avatarHint}>
                  Tap the photo to change it
                </Text>
              </View>
            </View>

            {/* First Name */}
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>First Name</Text>
              <View
                style={[
                  styles.inputRow,
                  fieldErrors.firstName ? styles.inputRowError : null,
                ]}
              >
                <Icon
                  name="person-outline"
                  size={18}
                  color={COLORS.SECONDARY}
                />
                <TextInput
                  value={form.firstName}
                  onChangeText={text => handleChange('firstName', text)}
                  placeholder="Enter first name"
                  placeholderTextColor={'#94A3B8'}
                  style={styles.input}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isSaving}
                  returnKeyType="next"
                />
              </View>
              {fieldErrors.firstName ? (
                <Text style={styles.errorText}>{fieldErrors.firstName}</Text>
              ) : null}
            </View>

            {/* Last Name */}
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              <View
                style={[
                  styles.inputRow,
                  fieldErrors.lastName ? styles.inputRowError : null,
                ]}
              >
                <Icon
                  name="person-outline"
                  size={18}
                  color={COLORS.SECONDARY}
                />
                <TextInput
                  value={form.lastName}
                  onChangeText={text => handleChange('lastName', text)}
                  placeholder="Enter last name"
                  placeholderTextColor={'#94A3B8'}
                  style={styles.input}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isSaving}
                  returnKeyType="next"
                />
              </View>
              {fieldErrors.lastName ? (
                <Text style={styles.errorText}>{fieldErrors.lastName}</Text>
              ) : null}
            </View>

            {/* Email */}
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View
                style={[
                  styles.inputRow,
                  fieldErrors.email ? styles.inputRowError : null,
                ]}
              >
                <Icon name="mail-outline" size={18} color={COLORS.SECONDARY} />
                <TextInput
                  value={form.email}
                  onChangeText={text => handleChange('email', text)}
                  placeholder="Enter email address"
                  placeholderTextColor={'#94A3B8'}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!isSaving}
                  returnKeyType="done"
                />
              </View>
              {fieldErrors.email ? (
                <Text style={styles.errorText}>{fieldErrors.email}</Text>
              ) : null}
            </View>

            {profileError ? (
              <View style={styles.inlineError}>
                <Icon name="alert-circle-outline" size={16} color="#B91C1C" />
                <Text style={styles.inlineErrorText}>{profileError}</Text>
              </View>
            ) : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  (!isDirty || isSaving) && styles.buttonDisabled,
                ]}
                onPress={handleCancel}
                disabled={!isDirty || isSaving}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Discard changes"
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!isDirty || isSaving) && styles.buttonDisabled,
                ]}
                onPress={handleSave}
                disabled={!isDirty || isSaving}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Save profile changes"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={'#FFFFFF'} />
                ) : (
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={handlePreferencesPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open preferences"
            >
              <Text style={styles.optionTitle}>Preferences</Text>
              <Icon name="chevron-forward" size={20} color={COLORS.SECONDARY} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flex: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  avatarTap: {
    position: 'relative',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.PRIMARY_GLOW,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_LIGHT,
  },
  avatarInitials: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 22,
    fontWeight: '800',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarMeta: {
    flex: 1,
    marginLeft: 14,
  },
  avatarName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  avatarEmail: {
    color: COLORS.SECONDARY,
    fontSize: 13,
    marginTop: 2,
  },
  avatarHint: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  fieldCard: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  inputRowError: {
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    paddingVertical: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  inlineErrorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.PRIMARY_DARK,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ProfileScreen;
