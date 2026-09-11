import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Picking + normalising prepared-dish photos. Kept behind this module so the
// native deps (expo-image-picker / expo-image-manipulator) have one entry point.
// See docs/specs/2026-09-09-prepared-photos.md §5.

export const MAX_PHOTOS = 5;   // per make — matches the server cap
const MAX_DIM = 1440;          // longest edge; re-encode also strips EXIF/GPS

export type PhotoSource = 'camera' | 'library';

/** Just-in-time permission for the chosen source. */
async function ensurePermission(source: PhotoSource): Promise<boolean> {
  const res = source === 'camera'
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  return res.status === 'granted';
}

/** Downscale + re-encode to JPEG. Re-encoding drops EXIF/GPS before upload. */
async function normalize(uri: string): Promise<string> {
  const out = await manipulateAsync(uri, [{ resize: { width: MAX_DIM } }], {
    compress: 0.7,
    format: SaveFormat.JPEG,
  });
  return out.uri;
}

/**
 * Launch the camera or library and return up to `remaining` normalised local
 * URIs. `denied` distinguishes a permission refusal (worth a Settings prompt)
 * from a plain cancel (say nothing).
 */
export async function pickDishPhotos(
  source: PhotoSource,
  remaining: number,
): Promise<{ uris: string[]; denied: boolean }> {
  if (remaining <= 0) return { uris: [], denied: false };
  if (!(await ensurePermission(source))) return { uris: [], denied: true };

  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      });

  if (result.canceled || !result.assets) return { uris: [], denied: false };
  const picked = result.assets.slice(0, remaining).map(a => a.uri);
  const uris = await Promise.all(picked.map(normalize));
  return { uris, denied: false };
}
