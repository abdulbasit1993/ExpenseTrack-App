import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

type Props = {};

const SplashScreen: React.FC<Props> = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(1)).current;

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingOpacity, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(loadingOpacity, {
          toValue: 1,
          duration: 1200,
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
            <Animated.View
              style={[styles.loadingWrap, { opacity: loadingOpacity }]}
            >
              <View style={styles.loadingDot} />
              <View style={[styles.loadingDot, { marginLeft: 8 }]} />
              <View style={[styles.loadingDot, { marginLeft: 8 }]} />
            </Animated.View>
          </Animated.View>
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
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
});

export default SplashScreen;
