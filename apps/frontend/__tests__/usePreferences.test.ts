jest.mock('../src/offline/storage', () => ({
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePreferences } from '../src/hooks/usePreferences';
import * as storage from '../src/offline/storage';

const mockGet = storage.get as jest.Mock;
const mockSet = storage.set as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); });

test('falls back to defaults when nothing is stored', async () => {
  mockGet.mockResolvedValue(null);
  const { result } = renderHook(() => usePreferences());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.prefs).toEqual({ units: 'g', keepAwake: true });
});

test('merges stored prefs over the defaults', async () => {
  mockGet.mockResolvedValue({ units: 'cup' });
  const { result } = renderHook(() => usePreferences());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.prefs).toEqual({ units: 'cup', keepAwake: true });
});

test('setPref persists the whole merged object', async () => {
  mockGet.mockResolvedValue(null);
  const { result } = renderHook(() => usePreferences());
  await waitFor(() => expect(result.current.loading).toBe(false));

  act(() => { result.current.setPref('units', 'cup'); });

  expect(mockSet).toHaveBeenCalledWith('preferences', { units: 'cup', keepAwake: true });
  expect(result.current.prefs.units).toBe('cup');
});
