import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecipeCard } from '../src/components/shared/RecipeCard';
import type { RecipeListItem } from '../src/api/recipes';

const MOCK_RECIPE: RecipeListItem = {
  slug: 'coconut-burfi',
  nameEn: 'Coconut Burfi',
  nameTa: 'தேங்காய்',
  category: 'semi-solid',
  cookTimeMin: 25,
  contraCount: 1,
};

test('renders recipe name and calls onPress', () => {
  const onPress = jest.fn();
  const { getByText } = render(<RecipeCard recipe={MOCK_RECIPE} onPress={onPress} />);
  expect(getByText('Coconut Burfi')).toBeTruthy();
  fireEvent.press(getByText('Coconut Burfi'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
