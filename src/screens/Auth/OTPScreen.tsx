import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  ToastAndroid,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import EyeIcon from '../../assets/icons/eye.svg';
import EyeOffIcon from '../../assets/icons/eye-off.svg';
import EmailIcon from '../../assets/icons/email.svg';
import PasswordIcon from '../../assets/icons/key.svg';
import CustomButton from '../../components/CustomButton';
import { api } from '../../services/apiService';

const { width, height } = Dimensions.get('window');
const OTP_LENGTH = 6;

type OTPInputProps = {
  length: number;
  value: string;
  focusIndex: number;
  onChangeText: (value: string) => void;
  onFocus: (index: number) => void;
  onBlur: () => void;
};

const OTPInput: React.FC<OTPInputProps> = ({
  length,
  value,
  focusIndex,
  onChangeText,
  onFocus,
  onBlur,
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (event.nativeEvent.key !== 'Backspace') return;

    if (value[index]) {
      onChangeText(value.slice(0, index) + value.slice(index + 1));
    } else if (index > 0 && value[index - 1]) {
      onChangeText(value.slice(0, index - 1) + value.slice(index));
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpRow}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={ref => {
            inputRefs.current[index] = ref;
          }}
          style={[
            styles.otpInput,
            index === focusIndex && styles.otpInputFocused,
          ]}
          keyboardType="number-pad"
          maxLength={1}
          value={value[index] ?? ''}
          onChangeText={text => {
            const digits = text.replace(/\D/g, '');
            if (!digits) return;

            const nextValue =
              value.slice(0, index) + digits.charAt(0) + value.slice(index + 1);
            const cleaned = nextValue.replace(/\D/g, '').slice(0, length);
            onChangeText(cleaned);

            if (index < length - 1) {
              inputRefs.current[index + 1]?.focus();
            }
          }}
          onKeyPress={event => handleKeyPress(index, event)}
          onFocus={() => onFocus(index)}
          onBlur={() => {
            if (index === length - 1) {
              onBlur();
            }
          }}
          autoFocus={index === 0}
          blurOnSubmit={false}
        />
      ))}
    </View>
  );
};

type Props = {
  navigation: NavigationProp<any>;
};

const OTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [focusIndex, setFocusIndex] = useState(0);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),

        Animated.timing(orb1, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2, {
          toValue: 1,
          duration: 5500,
          useNativeDriver: true,
        }),

        Animated.timing(orb2, {
          toValue: 0,
          duration: 5500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const orb2Y = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  const orb1X = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });
  const orb2X = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  const handleResend = async () => {
    if (!canResend) return;
    setResendTimer(60);
    setCanResend(false);

    setLoading(true);

    try {
      const resp = await api.post('/auth/forgot-password', { email });

      if (resp?.success) {
        ToastAndroid.show('OTP Resent', ToastAndroid.SHORT);
        setResendTimer(60);
        setCanResend(false);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    setLoading(true);

    const payload = {
      email,
      otpCode: otp,
    };

    try {
      const resp = await api.post('/auth/verify-otp', payload);

      if (resp?.success) {
        // Navigate on success
        navigation.navigate('ResetPassword', { email, otp });
      }
    } catch (error) {
      console.log('error (verify-otp) ===>> ', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor={'#0F0E17'} />

      {/* Background */}
      <View style={styles.bg} />

      {/* Decorative orbs */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          { transform: [{ translateY: orb1Y }, { translateX: orb1X }] },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orb2,
          { transform: [{ translateY: orb2Y }, { translateX: orb2X }] },
        ]}
      />
      <View style={styles.orbSmall} />

      {/* Grid overlay */}
      <View style={styles.gridOverlay} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          style={[
            styles.container,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Logo Area */}
          <Animated.View
            style={[styles.logoArea, { transform: [{ scale: logoScale }] }]}
          >
            <View style={styles.logoIconWrap}>
              <View style={styles.logoIconInner}>
                <Text style={styles.logoIconText}>Rs.</Text>
              </View>
              <View style={styles.logoIconRing} />
            </View>
            <Text style={styles.logoText}>
              <Text style={styles.logoTextBold}>Expense</Text>
              <Text style={styles.logoTextLight}>Track</Text>
            </Text>
            <Text style={styles.logoTagline}>
              Smart spending. Clear picture
            </Text>
          </Animated.View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enter OTP</Text>
            <Text style={styles.cardSub}>
              Enter the OTP code we sent to {email}
            </Text>

            <OTPInput
              length={OTP_LENGTH}
              value={otp}
              focusIndex={focusIndex}
              onChangeText={nextOtp => {
                setOtp(nextOtp);

                if (nextOtp.length === OTP_LENGTH) {
                  // handleSubmit();
                }
              }}
              onFocus={setFocusIndex}
              onBlur={() => {
                if (
                  focusIndex === OTP_LENGTH - 1 &&
                  otp.length === OTP_LENGTH
                ) {
                  // handleSubmit();
                }
              }}
            />

            {/* Resend timer */}
            <View style={styles.timerRow}>
              <Text style={styles.timerText}>
                Didn't receive the code?{' '}
                <Text style={styles.timerLabel}>
                  Resend in {formatTime(resendTimer)}
                </Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.resendBtn,
                  !canResend && styles.resendBtnDisabled,
                ]}
                onPress={handleResend}
                disabled={!canResend}
              >
                <Text
                  style={[
                    styles.resendText,
                    !canResend && styles.resendTextDisabled,
                  ]}
                >
                  Resend
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit button */}
            <CustomButton
              title="Submit"
              onPress={() => {
                handleSubmit();
              }}
              loading={loading}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F0E17',
  },
  bg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F0E17',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.03,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 280,
    height: 280,
    top: -60,
    right: -80,
    backgroundColor: 'rgba(99,102,241,0.22)',
  },
  orb2: {
    width: 220,
    height: 220,
    bottom: 80,
    left: -90,
    backgroundColor: 'rgba(99,102,241,0.14)',
  },
  orbSmall: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: height * 0.35,
    right: -20,
    backgroundColor: 'rgba(165,180,252,0.09)',
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
    minHeight: height,
  },
  scrollContent: {
    flexGrow: 1,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIconWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoIconInner: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
  },
  logoIconRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.35)',
  },
  logoIconText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
  },
  logoText: {
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  logoTextBold: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  logoTextLight: {
    color: COLORS.PRIMARY_LIGHT,
    fontWeight: '300',
  },
  logoTagline: {
    fontSize: 13,
    color: '#6B6880',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 14,
    color: '#6B6880',
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 46,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
  },
  otpInputFocused: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(99,102,241,0.10)',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  fieldWrapFocused: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(99,102,241,0.08)',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fieldIcon: {
    fontSize: 16,
    marginRight: 10,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '400',
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 16,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: 4,
  },
  forgotText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 13,
    fontWeight: '500',
  },
  signInBtn: {
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  signInBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  signInArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '300',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: '#5A5670',
    fontSize: 13,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    height: 46,
    gap: 8,
  },
  socialIcon: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  socialLabel: {
    color: '#9993B4',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#5A5670',
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 14,
    fontWeight: '600',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 20,
    marginTop: 4,
  },
  timerText: {
    color: '#6B6880',
    fontSize: 13,
    fontWeight: '400',
    marginRight: 6,
  },
  timerLabel: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 13,
    fontWeight: '500',
  },
  resendBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY,
  },
  resendBtnDisabled: {
    backgroundColor: 'rgba(99,102,241,0.3)',
  },
  resendText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
});

export default OTPScreen;
