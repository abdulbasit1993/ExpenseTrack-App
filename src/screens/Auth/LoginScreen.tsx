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
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import EyeIcon from '../../assets/icons/eye.svg';
import EyeOffIcon from '../../assets/icons/eye-off.svg';
import EmailIcon from '../../assets/icons/email.svg';
import PasswordIcon from '../../assets/icons/key.svg';
import CustomButton from '../../components/CustomButton';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NavigationProp<any>;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSub}>Sign in to your account</Text>

            {/* Email */}
            <View style={[styles.fieldWrap]}>
              <EmailIcon width={22} height={22} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#5A5670"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={[styles.fieldWrap]}>
              <PasswordIcon width={22} height={22} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#5A5670"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                // style={styles.eyeBtn}
              >
                {showPassword ? (
                  <EyeOffIcon width={24} height={24} />
                ) : (
                  <EyeIcon width={24} height={24} />
                )}
              </TouchableOpacity>
            </View>

            {/* Forgot */}
            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign in button */}
            <CustomButton
              title="Sign In"
              onPress={() => {
                navigation.navigate('Home');
              }}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialLabel}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={styles.socialIcon}>𝕏</Text>
                <Text style={styles.socialLabel}>Twitter / X</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
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
});

export default LoginScreen;
