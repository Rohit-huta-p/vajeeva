jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';

function Probe() {
  const { scheme, mode, colors, setMode } = useTheme();
  return (
    <>
      <Text testID="scheme">{scheme}</Text>
      <Text testID="mode">{mode}</Text>
      <Text testID="bg">{colors.bone}</Text>
      <Text onPress={() => setMode('dark')}>go-dark</Text>
    </>
  );
}

test('defaults to system → light and flips to dark on setMode', async () => {
  const { getByTestId, getByText } = render(
    <ThemeProvider><Probe /></ThemeProvider>,
  );
  expect(getByTestId('mode').props.children).toBe('system');
  expect(getByTestId('scheme').props.children).toBe('light');
  expect(getByTestId('bg').props.children).toBe('#F2EDE1'); // light bone

  fireEvent.press(getByText('go-dark'));

  await waitFor(() => expect(getByTestId('scheme').props.children).toBe('dark'));
  expect(getByTestId('mode').props.children).toBe('dark');
  expect(getByTestId('bg').props.children).toBe('#1A1814'); // dark bone
});
