import React, { JSX } from 'react';
import {
  View,
  Platform,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BAR_HEIGHT = 70;
const FAB_RADIUS = 30;
const NOTCH_DEPTH = 28;
const NOTCH_WIDTH = 90;
const CORNER_RADIUS = 24;
const ACTIVE_COLOR = '#6B4EFF';
const INACTIVE_COLOR = '#C4C4D4';

// ── Build the SVG notch path ───────────────────────────────────────────────────
// The path traces: top-left corner → left side → left notch curve → bottom of notch
// → right notch curve → right side → top-right corner → bottom edge → close
function buildNotchPath(w: number, h: number): string {
  const r = CORNER_RADIUS;
  const cx = w / 2; // horizontal center
  const nl = cx - NOTCH_WIDTH / 2; // notch left x
  const nr = cx + NOTCH_WIDTH / 2; // notch right x
  const nd = NOTCH_DEPTH; // notch depth from top (y=0)

  return [
    `M0,${r}`, // start below top-left corner
    `Q0,0 ${r},0`, // rounded top-left corner
    `L${nl},0`, // top edge → notch start
    // Left downward curve into notch
    `C${nl + 16},0 ${cx - FAB_RADIUS - 4},${nd} ${cx - FAB_RADIUS + 2},${nd}`,
    // Bottom arc of notch (hugs the FAB underside)
    `A${FAB_RADIUS + 6},${FAB_RADIUS + 6} 0 0,0 ${cx + FAB_RADIUS - 2},${nd}`,
    // Right upward curve out of notch
    `C${cx + FAB_RADIUS + 4},${nd} ${nr - 16},0 ${nr},0`,
    `L${w - r},0`, // top edge ← notch end
    `Q${w},0 ${w},${r}`, // rounded top-right corner
    `L${w},${h}`, // right side down
    `L0,${h}`, // bottom edge
    `Z`, // close path
  ].join(' ');
}

const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 15 15" fill="none">
    <Path
      d="M7.8254 0.120372C7.63815 -0.0401239 7.36185 -0.0401239 7.1746 0.120372L0 6.27003V13.5C0 14.3284 0.671573 15 1.5 15H5.5C5.77614 15 6 14.7761 6 14.5V11.5C6 10.6716 6.67157 10 7.5 10C8.32843 10 9 10.6716 9 11.5V14.5C9 14.7761 9.22386 15 9.5 15H13.5C14.3284 15 15 14.3284 15 13.5V6.27003L7.8254 0.120372Z"
      fill={color}
    />
  </Svg>
);

const AnalyticsIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      fill={color}
      fillRule="evenodd"
      d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6zm10 2a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0V8zm-4 3a1 1 0 1 0-2 0v5a1 1 0 1 0 2 0v-5zm8 3a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0v-2z"
      clipRule="evenodd"
    />
  </Svg>
);

const CardIcon = ({ color }: { color: string }) => {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M22 7.54844C22 8.20844 21.46 8.74844 20.8 8.74844H3.2C2.54 8.74844 2 8.20844 2 7.54844V7.53844C2 5.24844 3.85 3.39844 6.14 3.39844H17.85C20.14 3.39844 22 5.25844 22 7.54844Z"
        fill={color}
      />
      <Path
        d="M2 11.45V16.46C2 18.75 3.85 20.6 6.14 20.6H17.85C20.14 20.6 22 18.74 22 16.45V11.45C22 10.79 21.46 10.25 20.8 10.25H3.2C2.54 10.25 2 10.79 2 11.45ZM8 17.25H6C5.59 17.25 5.25 16.91 5.25 16.5C5.25 16.09 5.59 15.75 6 15.75H8C8.41 15.75 8.75 16.09 8.75 16.5C8.75 16.91 8.41 17.25 8 17.25ZM14.5 17.25H10.5C10.09 17.25 9.75 16.91 9.75 16.5C9.75 16.09 10.09 15.75 10.5 15.75H14.5C14.91 15.75 15.25 16.09 15.25 16.5C15.25 16.91 14.91 17.25 14.5 17.25Z"
        fill={color}
      />
    </Svg>
  );
};

const ProfileIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.5 7.063C16.5 10.258 14.57 13 12 13c-2.572 0-4.5-2.742-4.5-5.938C7.5 3.868 9.16 2 12 2s4.5 1.867 4.5 5.063zM4.102 20.142C4.487 20.6 6.145 22 12 22c5.855 0 7.512-1.4 7.898-1.857a.416.416 0 0 0 .09-.317C19.9 18.944 19.106 15 12 15s-7.9 3.944-7.989 4.826a.416.416 0 0 0 .091.317z"
      fill={color}
    />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Path
      d="M14 6V22M6 14H22"
      stroke="#FFF"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  </Svg>
);

const TAB_ICONS: Record<string, (color: string) => JSX.Element> = {
  Home: c => <HomeIcon color={c} />,
  Analytics: c => <AnalyticsIcon color={c} />,
  Transactions: c => <CardIcon color={c} />,
  Profile: c => <ProfileIcon color={c} />,
};

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  const tabs = state.routes;
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  const totalHeight = BAR_HEIGHT + bottomInset;
  const notchPath = buildNotchPath(SCREEN_WIDTH, totalHeight);

  const renderTab = (route: (typeof tabs)[0], index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
    const renderIcon = TAB_ICONS[route.name];

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        {renderIcon ? renderIcon(color) : null}
        {isFocused && <View style={styles.activeDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.wrapper, { height: totalHeight }]}>
      <Svg
        width={SCREEN_WIDTH}
        height={totalHeight}
        style={StyleSheet.absoluteFill}
      >
        {/* Shadow path (slightly larger, offset down) */}
        <Path d={notchPath} fill="rgba(107, 78, 255, 0.06)" translateY={2} />
        {/* Main white bar */}
        <Path d={notchPath} fill="#FFFFFF" />
      </Svg>

      {/* FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => {}}
        >
          <PlusIcon />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { paddingBottom: bottomInset }]}>
        {/* Left tabs */}
        <View style={styles.tabSection}>
          {leftTabs.map((route, i) => renderTab(route, i))}
        </View>

        {/* Center spacer -- sits under the notch */}
        <View style={{ width: NOTCH_WIDTH + 8 }} />

        {/* Right tabs */}
        <View style={styles.tabSection}>
          {rightTabs.map((route, i) => renderTab(route, i + leftTabs.length))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    // IMPORTANT: allow FAB to visually overflow upward
    overflow: 'visible',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: NOTCH_DEPTH, // Push tabs down below notch curve
    // paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    height: '100%',
  },
  tabSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACTIVE_COLOR,
    marginTop: 2,
  },
  fabContainer: {
    position: 'absolute',
    top: -FAB_RADIUS, // FAB sits half above the bar top edge
    alignSelf: 'center',
    zIndex: 10,
    shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 14,
  },
  fab: {
    width: FAB_RADIUS * 2,
    height: FAB_RADIUS * 2,
    borderRadius: FAB_RADIUS,
    backgroundColor: '#6B4EFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
