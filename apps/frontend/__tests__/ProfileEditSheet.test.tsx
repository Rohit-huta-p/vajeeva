// Themed components import ThemeContext → AsyncStorage; use the official mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileEditSheet } from '../src/components/shared/ProfileEditSheet';

test('seeds the fields and saves name + age + gender', () => {
  const onSave = jest.fn();
  const onClose = jest.fn();
  const { getByLabelText, getByText } = render(
    <ProfileEditSheet visible name="Rohith" age={28} gender="male" onSave={onSave} onClose={onClose} />,
  );

  fireEvent.press(getByLabelText('Female'));   // switch gender
  fireEvent.press(getByText('Save'));

  expect(onSave).toHaveBeenCalledWith({ name: 'Rohith', age: 28, gender: 'female' });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('an out-of-range age blocks the save', () => {
  const onSave = jest.fn();
  const { getByLabelText, getByText } = render(
    <ProfileEditSheet visible name="Rohith" onSave={onSave} onClose={() => {}} />,
  );

  fireEvent.changeText(getByLabelText('Age'), '5'); // below the 13–120 range
  fireEvent.press(getByText('Save'));

  expect(onSave).not.toHaveBeenCalled();
});
