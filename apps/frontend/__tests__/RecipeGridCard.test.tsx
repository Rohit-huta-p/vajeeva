import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecipeGridCard } from '../src/components/shared/RecipeGridCard';
import type { RecipeListItem } from '../src/api/recipes';

const MOCK_RECIPE: RecipeListItem = {
  slug: 'coconut-burfi',
  nameEn: 'Coconut Burfi',
  nameTa: 'தேங்காய்',
  category: 'semi-solid',
  cookTimeMin: 25,
  contraCount: 1,
  fit: 'caution',
  stepCount: 5,
  yieldStr: 'Makes 3–4',
};

test('renders name and calls onPress', () => {
  const onPress = jest.fn();
  const { getByText } = render(<RecipeGridCard recipe={MOCK_RECIPE} onPress={onPress} />);
  expect(getByText('Coconut Burfi')).toBeTruthy();
  fireEvent.press(getByText('Coconut Burfi'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('shows the fit badge and meta from the recipe data', () => {
  const { getByText } = render(<RecipeGridCard recipe={MOCK_RECIPE} onPress={() => {}} />);
  expect(getByText('Caution')).toBeTruthy();      // fit badge (feature on + fit set)
  expect(getByText('25 min')).toBeTruthy();       // cook-time chip
  expect(getByText('5 steps')).toBeTruthy();      // meta: step count
  expect(getByText('Makes 3–4')).toBeTruthy();    // meta: yield
});

test('no fit badge when the recipe is unassessed (fit null)', () => {
  const { queryByText } = render(
    <RecipeGridCard recipe={{ ...MOCK_RECIPE, fit: null }} onPress={() => {}} />,
  );
  expect(queryByText('Caution')).toBeNull();
  expect(queryByText('Safe')).toBeNull();
});

test('save toggle fires without triggering the card press', () => {
  const onPress = jest.fn();
  const onToggleSave = jest.fn();
  const { getByLabelText } = render(
    <RecipeGridCard recipe={MOCK_RECIPE} onPress={onPress} saved={false} onToggleSave={onToggleSave} />,
  );
  fireEvent.press(getByLabelText('Save Coconut Burfi'));
  expect(onToggleSave).toHaveBeenCalledTimes(1);
  expect(onPress).not.toHaveBeenCalled();
});
