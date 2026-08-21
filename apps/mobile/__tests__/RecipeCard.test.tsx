import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RecipeCard from '../src/components/RecipeCard';

const MOCK_RECIPE = {
  id: '1', nameEn: 'Coconut Burfi', nameTa: 'தேங்காய்', category: 'semi-solid',
  yieldStr: '4 pieces', shelfLife: '5 days',
} as any;

test('renders recipe name and calls onPress', () => {
  const onPress = jest.fn();
  const { getByText } = render(<RecipeCard recipe={MOCK_RECIPE} onPress={onPress} />);
  expect(getByText('Coconut Burfi')).toBeTruthy();
  fireEvent.press(getByText('Coconut Burfi'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
