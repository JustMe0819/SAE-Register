import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const backgroundColor = lightColor || darkColor || theme.bg;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
