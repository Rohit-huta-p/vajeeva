// OfflineProvider boot + connectivity orchestration. Catalog + NetInfo are
// mocked; we assert the provider hydrates first, then syncs, and re-syncs when
// connectivity returns — and that a sync failure still leaves the app usable.
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => () => {}) },
}));
jest.mock('../src/offline/catalog', () => ({
  hydrateCatalog: jest.fn(() => Promise.resolve()),
  syncCatalog: jest.fn(() => Promise.resolve({ count: 3 })),
  getMeta: jest.fn(() => Promise.resolve({ lastSyncedAt: '2026-08-27T00:00:00.000Z' })),
  getAllRecipes: jest.fn(() => []),
}));
jest.mock('../src/offline/images', () => ({
  hydrateImages: jest.fn(() => Promise.resolve()),
  syncImages: jest.fn(() => Promise.resolve()),
}));

import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { OfflineProvider, useOffline } from '../src/offline/OfflineProvider';
import { hydrateCatalog, syncCatalog } from '../src/offline/catalog';

const addSpy = (NetInfo as any).addEventListener as jest.Mock;

function Probe() {
  const { ready, isOnline, syncPhase, lastSyncedAt } = useOffline();
  return <Text>{`${ready}|${isOnline}|${syncPhase}|${lastSyncedAt ?? ''}`}</Text>;
}

beforeEach(() => { jest.clearAllMocks(); });

test('boot hydrates the cache, then syncs and publishes lastSyncedAt', async () => {
  const { getByText } = render(<OfflineProvider><Probe /></OfflineProvider>);
  await waitFor(() => expect(getByText(/^true\|/)).toBeTruthy());     // ready
  expect(hydrateCatalog).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(getByText(/\|done\|/)).toBeTruthy());    // sync finished
  expect(syncCatalog).toHaveBeenCalledTimes(1);
  expect(getByText(/2026-08-27/)).toBeTruthy();
});

test('re-syncs when connectivity returns (offline → online)', async () => {
  const { getByText } = render(<OfflineProvider><Probe /></OfflineProvider>);
  await waitFor(() => expect(getByText(/\|done\|/)).toBeTruthy());    // boot sync done
  expect(syncCatalog).toHaveBeenCalledTimes(1);

  const cb = addSpy.mock.calls[0][0];
  await act(async () => { cb({ isConnected: false }); });            // go offline
  await act(async () => { cb({ isConnected: true }); });             // back online
  await waitFor(() => expect(syncCatalog).toHaveBeenCalledTimes(2));
});

test('sync failure leaves the app ready with an error phase (cache stays usable)', async () => {
  (syncCatalog as jest.Mock).mockRejectedValueOnce(new Error('offline'));
  const { getByText } = render(<OfflineProvider><Probe /></OfflineProvider>);
  await waitFor(() => expect(getByText(/^true\|/)).toBeTruthy());     // still ready
  await waitFor(() => expect(getByText(/\|error\|/)).toBeTruthy());
});
