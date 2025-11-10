import { useTheme } from '@/contexts/ThemeContext';
import React, { ReactNode } from 'react';
import {
  ImageBackground,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Header için icon tipini tanımla
export interface HeaderIconProps {
  icon: ReactNode;
  onPress?: () => void;
}

// Header props interface'i
export interface HeaderProps {
  leftIcon?: HeaderIconProps;
  rightIcon?: HeaderIconProps;
  title?: ReactNode;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
}

// BaseLayout props interface'i
export interface BaseLayoutProps {
  children: ReactNode;
  fullScreen?: boolean;
  headerShow?: boolean;
  header?: HeaderProps;
  backgroundImage?: any;
  backgroundColor?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

// Header Component'i
const Header: React.FC<HeaderProps> = ({
  leftIcon,
  rightIcon,
  title,
  backgroundColor,
  height = 56,
  style,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: backgroundColor || colors.background,
          height: height + insets.top,
          paddingTop: insets.top,
        },
        style,
      ]}
    >
      <View style={styles.headerContent}>
        {/* Sol taraf - Icon ve Title */}
        <View style={styles.headerLeft}>
          {leftIcon && (
            <TouchableOpacity 
              style={styles.iconContainer}
              onPress={leftIcon.onPress}
              activeOpacity={0.7}
            >
              {leftIcon.icon}
            </TouchableOpacity>
          )}
          {title && <View style={styles.titleContainer}>{title}</View>}
        </View>

        {/* Sağ taraf - Icon */}
        {rightIcon && (
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconContainer}
              onPress={rightIcon.onPress}
              activeOpacity={0.7}
            >
              {rightIcon.icon}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// Ana BaseLayout Component'i
const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  fullScreen = false,
  headerShow = true,
  header,
  backgroundImage,
  backgroundColor,
  style,
  contentStyle,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Status bar style'ını tema göre ayarla
  const statusBarStyle = isDark ? 'light-content' : 'dark-content';
  const statusBarBackgroundColor = header?.backgroundColor || backgroundColor || colors.background;

  // Container style'ını hazırla
  const containerStyle: ViewStyle = {
    ...styles.container,
    backgroundColor: backgroundColor || colors.background,
    paddingTop: fullScreen ? 0 : (headerShow && header ? 0 : insets.top),
    paddingBottom: fullScreen ? 0 : insets.bottom,
    paddingLeft: fullScreen ? 0 : insets.left,
    paddingRight: fullScreen ? 0 : insets.right,
    ...style,
  };

  // Content style'ını hazırla
  const finalContentStyle: ViewStyle = {
    ...styles.content,
    ...contentStyle,
  };

  return (
    <>
      {/* Status Bar */}
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={Platform.OS === 'android' ? statusBarBackgroundColor : undefined}
        translucent={fullScreen}
      />

      {/* Ana Container */}
      {backgroundImage ? (
        <ImageBackground source={backgroundImage} style={containerStyle}>
          {/* Header */}
          {headerShow && header && (
            <Header {...header} />
          )}

          {/* Content */}
          <View style={finalContentStyle}>
            {children}
          </View>
        </ImageBackground>
      ) : (
        <View style={containerStyle}>
          {/* Header */}
          {headerShow && header && (
            <Header {...header} />
          )}

          {/* Content */}
          <View style={finalContentStyle}>
            {children}
          </View>
        </View>
      )}
    </>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    marginLeft: 12,
    flex: 1,
  },
});

export default BaseLayout;
