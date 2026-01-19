/**
 * Компонент текстового поля в темной теме
 */
import React from 'react';
import { TextInput as RNTextInput, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

export default function TextInput({ style, ...props }) {
  return (
    <RNTextInput
      style={[styles.input, style]}
      placeholderTextColor={colors.textSecondary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...typography.body,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff', // Белый цвет текста
    minHeight: 44,
  },
});

