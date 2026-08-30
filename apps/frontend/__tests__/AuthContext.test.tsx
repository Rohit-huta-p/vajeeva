// AuthProvider's launch effect must survive offline: a network failure has to
// KEEP the session (offline-first, cache-backed), and only a genuine 401 clears
// it. Regression test for the bug where any refresh failure deleted the session
// and locked signed-in users out the moment they opened the app without network.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../src/api', () => ({
  api: {},
  authApi: { refresh: jest.fn() },
  getAccessToken: jest.fn(),
  setAccessToken: jest.fn(),
  setRefreshToken: jest.fn(),
}));
jest.mock('../src/offline/storage', () => ({
  get: jest.fn(() => Promise.resolve(null)),
  getMany: jest.fn(() => Promise.resolve({})),
  set: jest.fn(() => Promise.resolve()),
  del: jest.fn(() => Promise.resolve()),
}));

import React, { useContext } from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { AuthProvider, AuthContext } from '../src/auth/AuthContext';
import { authApi, setAccessToken, setRefreshToken } from '../src/api';
import * as storage from '../src/offline/storage';

const mockRefresh = authApi.refresh as jest.Mock;
const mockGet = storage.get as jest.Mock;
const mockDel = storage.del as jest.Mock;

const SESSION = { email: 'a@b.com', name: 'Rohith', refreshToken: 'rt-1' };

// Only 'session' is seeded (no guest); everything else resolves null.
function seedSession() {
  mockGet.mockImplementation((key: string) =>
    Promise.resolve(key === 'session' ? SESSION : null));
}

// axios.isAxiosError just checks `isAxiosError === true`; a 401 carries a
// response, a network/offline failure does not.
const axiosErr = (extra: object) => Object.assign(new Error('x'), { isAxiosError: true, ...extra });

function Probe() {
  const { user, isGuest, isLoading } = useContext(AuthContext);
  return (
    <>
      <Text>{isLoading ? 'loading' : 'ready'}</Text>
      <Text>{user ? `user:${user.email}` : isGuest ? 'guest' : 'none'}</Text>
    </>
  );
}

beforeEach(() => { jest.clearAllMocks(); });

test('offline launch (network error) keeps the user signed in', async () => {
  seedSession();
  mockRefresh.mockRejectedValue(axiosErr({}));            // no .response → offline
  const { getByText } = render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(getByText('ready')).toBeTruthy());
  expect(getByText('user:a@b.com')).toBeTruthy();         // still signed in
  expect(mockDel).not.toHaveBeenCalledWith('session');    // session preserved
  expect(setRefreshToken).toHaveBeenCalledWith('rt-1');   // interceptor recovers online
});

test('dead refresh token (401) clears the session', async () => {
  seedSession();
  mockRefresh.mockRejectedValue(axiosErr({ response: { status: 401 } }));
  const { getByText } = render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(getByText('ready')).toBeTruthy());
  expect(getByText('none')).toBeTruthy();                 // logged out
  expect(mockDel).toHaveBeenCalledWith('session');
});

test('successful refresh signs the user in with a fresh access token', async () => {
  seedSession();
  mockRefresh.mockResolvedValue({ data: { accessToken: 'at-1' } });
  const { getByText } = render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(getByText('ready')).toBeTruthy());
  expect(getByText('user:a@b.com')).toBeTruthy();
  expect(setAccessToken).toHaveBeenCalledWith('at-1');
});
