jest.mock('../src/api', () => ({
  api: { get: jest.fn(), post: jest.fn() },
  recipesApi: { list: jest.fn(), detail: jest.fn() },
  authApi: { login: jest.fn(), register: jest.fn(), refresh: jest.fn() },
  setAccessToken: jest.fn(),
  setRefreshToken: jest.fn(),
  getRefreshToken: jest.fn(),
}));

import { recipesApi } from '../src/api';

const mockList = recipesApi.list as jest.MockedFunction<typeof recipesApi.list>;

beforeEach(() => {
  jest.clearAllMocks();
});

test('recipesApi.list returns published recipes', async () => {
  mockList.mockResolvedValue([
    { slug: 'a', nameEn: 'A', category: 'solid', status: 'published', ingredients: [], steps: [], healthFlags: [], sources: [] },
    { slug: 'b', nameEn: 'B', category: 'liquid', status: 'draft', ingredients: [], steps: [], healthFlags: [], sources: [] },
  ]);
  const result = await recipesApi.list();
  expect(result).toHaveLength(2);
  expect(mockList).toHaveBeenCalled();
});
