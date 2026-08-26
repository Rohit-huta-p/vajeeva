import { setAccessToken, getAccessToken } from '../src/api';

test('setAccessToken / getAccessToken round-trip', () => {
  setAccessToken('tok-123');
  expect(getAccessToken()).toBe('tok-123');
  setAccessToken(null);
  expect(getAccessToken()).toBeNull();
});
