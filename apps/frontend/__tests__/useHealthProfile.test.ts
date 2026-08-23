jest.mock('../src/api', () => ({
  api: { patch: jest.fn().mockResolvedValue({ data: {} }) },
  getAccessToken: jest.fn(),
}));
jest.mock('../src/offline/storage', () => ({
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useHealthProfile } from '../src/hooks/useHealthProfile';
import { api, getAccessToken } from '../src/api';
import * as storage from '../src/offline/storage';

const mockGet = storage.get as jest.Mock;
const mockSet = storage.set as jest.Mock;
const mockPatch = api.patch as jest.Mock;
const mockToken = getAccessToken as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); });

test('loads existing codes from the local store', async () => {
  mockGet.mockResolvedValue(['OW', 'LI']);
  const { result } = renderHook(() => useHealthProfile());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.codes).toEqual(['OW', 'LI']);
});

test('save writes the store and PATCHes /users/me when signed in', async () => {
  mockGet.mockResolvedValue([]);
  mockToken.mockReturnValue('access-token');
  const { result } = renderHook(() => useHealthProfile());
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(async () => { await result.current.save(['DM']); });

  expect(mockSet).toHaveBeenCalledWith('healthProfile', ['DM']);
  expect(mockPatch).toHaveBeenCalledWith('/api/users/me', { healthProfile: ['DM'] });
  expect(result.current.codes).toEqual(['DM']);
});

test('save writes the store but skips the PATCH for a guest (no token)', async () => {
  mockGet.mockResolvedValue([]);
  mockToken.mockReturnValue(null);
  const { result } = renderHook(() => useHealthProfile());
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(async () => { await result.current.save(['SD']); });

  expect(mockSet).toHaveBeenCalledWith('healthProfile', ['SD']);
  expect(mockPatch).not.toHaveBeenCalled();
});
