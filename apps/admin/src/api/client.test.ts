import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, setToken } from './client';

function jsonRes(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
  setToken(null);
});

describe('api()', () => {
  it('sends Authorization header when token set', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    setToken('abc');
    await api('/api/admin/recipes');
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });

  it('on 401, refreshes and retries once', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonRes(401, { error: 'expired' }))
      .mockResolvedValueOnce(jsonRes(200, { accessToken: 'fresh' }))
      .mockResolvedValueOnce(jsonRes(200, [{ slug: 'x' }]));
    vi.stubGlobal('fetch', fetchMock);
    setToken('stale');
    const out = await api('/api/admin/recipes');
    expect(out).toEqual([{ slug: 'x' }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh');
  });

  it('throws ApiError when refresh also fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonRes(401, { error: 'expired' }))
      .mockResolvedValueOnce(jsonRes(401, { error: 'no cookie' }));
    vi.stubGlobal('fetch', fetchMock);
    setToken('stale');
    await expect(api('/api/admin/recipes')).rejects.toMatchObject({ status: 401 });
  });
});
