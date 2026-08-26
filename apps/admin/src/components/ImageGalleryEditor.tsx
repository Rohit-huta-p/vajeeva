import { useRef, useState } from 'react';
import { getToken } from '../api/client';

export interface GalleryImage {
  url: string;
  alt: string;
  order: number;
}

interface Props {
  /** Human-readable context string used in aria-labels, e.g. "hero" or "step 1" */
  context: string;
  value: GalleryImage[];
  onChange: (next: GalleryImage[]) => void;
  /** Optional dimension hint shown below the picker, e.g. "1200 × 800 px · 3:2 · JPEG/WebP" */
  hint?: string;
}

/** Upload one file to /api/admin/uploads and return { url, publicId }. */
async function uploadFile(file: File): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/admin/uploads', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
    body: formData,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Upload failed (${res.status})`);
  return body as { url: string; publicId: string };
}

export function ImageGalleryEditor({ context, value, onChange, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const file = files[0];
      const result = await uploadFile(file);
      const next: GalleryImage = {
        url: result.url,
        alt: '',
        order: value.length,
      };
      onChange([...value, next]);
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
      // Reset the input so the same file can be re-uploaded after removal
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove(idx: number) {
    onChange(
      value
        .filter((_, i) => i !== idx)
        .map((img, i) => ({ ...img, order: i }))
    );
  }

  function setAlt(idx: number, alt: string) {
    onChange(value.map((img, i) => (i === idx ? { ...img, alt } : img)));
  }

  const inputId = `img-upload-${context.replace(/\s+/g, '-')}`;

  return (
    <div className="mt-2">
      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img.url}
                alt={`${context} image ${i + 1}`}
                aria-label={`${context} image ${i + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-ink/20"
              />
              <button
                type="button"
                aria-label={`Remove ${context} image ${i + 1}`}
                onClick={() => remove(i)}
                className="absolute -top-1.5 -right-1.5 bg-clay text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                ×
              </button>
              <input
                aria-label={`Alt text for ${context} image ${i + 1}`}
                placeholder="Alt text"
                value={img.alt}
                onChange={e => setAlt(i, e.target.value)}
                className="mt-1 w-20 text-xs border border-ink/20 rounded px-1 py-0.5 bg-white"
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload input */}
      <label
        htmlFor={inputId}
        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-dashed border-ink/30 rounded-lg cursor-pointer hover:border-brand text-ink/55 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {uploading ? 'Uploading…' : `+ Add ${context} image`}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        aria-label={`Add ${context} image`}
        className="sr-only"
        disabled={uploading}
        onChange={e => handleFiles(e.target.files)}
      />

      {hint && (
        <p className="text-xs text-ink/35 mt-1.5 leading-snug">
          📐 {hint} · max 8 MB
        </p>
      )}

      {uploadError && (
        <p role="alert" className="text-xs text-clay mt-1">{uploadError}</p>
      )}
    </div>
  );
}
