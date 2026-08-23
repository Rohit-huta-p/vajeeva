// AuthContext (imported for its Provider) transitively pulls in AsyncStorage,
// whose native module is null under Jest — use the library's official mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));
jest.mock('../src/hooks/useHealthProfile');
jest.mock('../src/hooks/usePreferences', () => ({
  usePreferences: () => ({ prefs: { units: 'g', keepAwake: true }, loading: false, setPref: jest.fn() }),
}));
jest.mock('../src/hooks/useHealthFlags', () => ({
  useHealthFlags: () => ([
    { code: 'OW', label: 'Overweight / Obesity' },
    { code: 'LI', label: 'Lactose intolerance' },
  ]),
}));
// Isolate the screen from the Modal editors (covered by their own tests).
jest.mock('../src/components/shared/HealthProfileSheet', () => ({ HealthProfileSheet: () => null }));
jest.mock('../src/components/shared/NameEditSheet', () => ({ NameEditSheet: () => null }));
jest.mock('../src/components/shared/ChoiceSheet', () => ({ ChoiceSheet: () => null }));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../src/screens/ProfileScreen';
import { AuthContext } from '../src/auth/AuthContext';
import { useHealthProfile } from '../src/hooks/useHealthProfile';

const mockUseHealthProfile = useHealthProfile as jest.Mock;

function renderScreen({
  user = { email: 'a@b.com', name: 'Rohith' } as any,
  isGuest = false,
  codes = [] as string[],
  save = jest.fn(),
  logout = jest.fn(),
  updateProfile = jest.fn(),
} = {}) {
  mockUseHealthProfile.mockReturnValue({ codes, loading: false, save });
  return render(
    <AuthContext.Provider value={{ user, isGuest, logout, updateProfile } as any}>
      <ProfileScreen />
    </AuthContext.Provider>,
  );
}

beforeEach(() => { jest.clearAllMocks(); });

test('signed-in: shows identity, condition chips, and the section rows', () => {
  const { getByText } = renderScreen({ codes: ['OW', 'LI'] });
  expect(getByText('Rohith')).toBeTruthy();
  expect(getByText('a@b.com')).toBeTruthy();
  expect(getByText('Overweight / Obesity')).toBeTruthy();
  expect(getByText('Units')).toBeTruthy();
  expect(getByText('Grams')).toBeTruthy();          // default units preference
  expect(getByText('Our sources & method')).toBeTruthy();
  expect(getByText('Medical disclaimer')).toBeTruthy();
  expect(getByText('About Vajeeva')).toBeTruthy();
  expect(getByText('Send feedback')).toBeTruthy();
  expect(getByText('Sign out')).toBeTruthy();
});

test('Sign out calls logout', () => {
  const logout = jest.fn();
  const { getByLabelText } = renderScreen({ logout });
  fireEvent.press(getByLabelText('Sign out'));
  expect(logout).toHaveBeenCalledTimes(1);
});

test('empty health profile shows the empty state', () => {
  const { getByText } = renderScreen({ codes: [] });
  expect(getByText(/No conditions set yet/)).toBeTruthy();
});

test('guest: shows the conversion banner, no identity, no account controls', () => {
  const { getByText, queryByText } = renderScreen({ user: null, isGuest: true });
  expect(getByText('Keep your kitchen')).toBeTruthy();
  expect(getByText(/Create account or sign in/)).toBeTruthy();
  expect(queryByText('Rohith')).toBeNull();
  expect(queryByText('Sign out')).toBeNull();
});
