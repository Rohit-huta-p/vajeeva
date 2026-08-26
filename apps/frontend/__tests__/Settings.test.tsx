// Themed components import ThemeContext → AsyncStorage; use the official mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsGroup, SettingsRow } from '../src/components/shared/Settings';

test('SettingsRow renders label + value and fires onPress', () => {
  const onPress = jest.fn();
  const { getByText, getByLabelText } = render(
    <SettingsGroup>
      <SettingsRow icon={<Text>◦</Text>} label="Units" value="Grams" onPress={onPress} />
    </SettingsGroup>,
  );
  expect(getByText('Units')).toBeTruthy();
  expect(getByText('Grams')).toBeTruthy();
  fireEvent.press(getByLabelText('Units'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('a row with no onPress is not pressable (renders as plain content)', () => {
  const { getByText, queryByLabelText } = render(
    <SettingsGroup>
      <SettingsRow icon={<Text>◦</Text>} label="Version" value="1.0.0" />
    </SettingsGroup>,
  );
  expect(getByText('Version')).toBeTruthy();
  expect(queryByLabelText('Version')).toBeNull(); // no accessibilityLabel without onPress
});
