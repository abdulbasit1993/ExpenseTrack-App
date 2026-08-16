import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

type HeaderAction = {
  icon: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

type HeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: HeaderAction;
};

const Header = ({ title, subtitle, onBack, rightAction }: HeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + 14 }]}
    >
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconButton}
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconButtonPlaceholder} />
        )}

        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={styles.iconButton}
            accessibilityLabel={rightAction.accessibilityLabel ?? 'Action'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name={rightAction.icon} size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconButtonPlaceholder} />
        )}
      </View>

      {/* Soft glow accent tucked behind the content, using the palette's glow token */}
      <View pointerEvents="none" style={styles.glow} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  iconButtonPlaceholder: {
    width: 38,
    height: 38,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.PRIMARY_GLOW,
    top: -70,
    right: -50,
  },
});

export default Header;
