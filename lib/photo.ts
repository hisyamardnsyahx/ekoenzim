/**
 * Convert a local image URI (file://, content://, blob:, or http) into a
 * persisted data URL so monitoring photos survive without Supabase Storage.
 */
export async function uriToDataUrl(uri: string): Promise<string> {
  const src = (uri || '').trim();
  if (!src) return '';
  // Already a data URL
  if (src.startsWith('data:')) return src;
  // Remote https already durable
  if (src.startsWith('http://') || src.startsWith('https://')) return src;

  const res = await fetch(src);
  if (!res.ok) {
    throw new Error(`Gagal membaca foto (${res.status})`);
  }
  const blob = await res.blob();
  const mime = blob.type || 'image/jpeg';

  // Prefer FileReader when available (web / many RN runtimes)
  if (typeof FileReader !== 'undefined') {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string' && result.startsWith('data:')) resolve(result);
        else reject(new Error('FileReader gagal menghasilkan data URL'));
      };
      reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
    return dataUrl;
  }

  // Fallback: arrayBuffer → base64
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const b64 =
    typeof btoa !== 'undefined'
      ? btoa(binary)
      : // Node test / rare RN without btoa
        Buffer.from(bytes).toString('base64');
  return `data:${mime};base64,${b64}`;
}
