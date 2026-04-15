/**
 * Reusable Card component for React Native
 */
import React, { ReactNode } from 'react';
import { Card as PaperCard } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface CardProps {
  children: ReactNode;
  style?: any;
  onPress?: () => void;
}

export const Card = ({ children, style, onPress }: CardProps) => {
  return (
    <PaperCard style={[styles.card, style]} onPress={onPress}>
      {children}
    </PaperCard>
  );
};

export const CardContent = PaperCard.Content;
export const CardTitle = PaperCard.Title;
export const CardCover = PaperCard.Cover;
export const CardActions = PaperCard.Actions;

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
});
