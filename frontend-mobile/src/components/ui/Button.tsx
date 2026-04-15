/**
 * Reusable Button component for React Native
 */
import React from 'react';
import { Button as PaperButton, ActivityIndicator } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: any;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) => {
  const mode = variant === 'primary' ? 'contained' : variant === 'outline' ? 'outlined' : 'text';
  const contentHeight = size === 'small' ? 36 : size === 'large' ? 52 : 48;

  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      disabled={disabled || loading}
      loading={loading}
      icon={icon}
      style={[styles.button, style]}
      contentStyle={[styles.content, { height: contentHeight }]}
      labelStyle={styles.label}
      buttonColor={variant === 'primary' ? '#16a34a' : undefined}
      textColor={variant === 'outline' ? '#16a34a' : undefined}
    >
      {title}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
  },
  content: {
    height: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
