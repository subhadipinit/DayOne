import { getSupabaseClient } from './supabaseClient';

/**
 * Converts a base64 Data URL to a Blob.
 */
export function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const parts = dataUrl.split(';base64,');
  const mimeType = parts[0].split(':')[1] || 'image/webp';
  const byteCharacters = atob(parts[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return { blob: new Blob([byteArray], { type: mimeType }), mimeType };
}

/**
 * Uploads media (File, Blob, or base64 data URL) to the Supabase Storage bucket 'baby-media'.
 * Returns the public CDN URL on success, or falls back to the data URL if offline/unconfigured.
 */
export async function uploadBabyMedia(
  source: File | Blob | string,
  folder: 'memories' | 'prescriptions' | 'vaccines' | 'avatars' = 'memories'
): Promise<string> {
  const client = getSupabaseClient();

  // If no Supabase connection is configured, return source if it's already a string/dataUrl
  if (!client) {
    if (typeof source === 'string') return source;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    });
  }

  try {
    let blob: Blob;
    let extension = 'webp';
    let mimeType = 'image/webp';

    if (typeof source === 'string') {
      if (source.startsWith('http://') || source.startsWith('https://')) {
        return source; // Already uploaded URL
      }
      if (source.startsWith('data:')) {
        const converted = dataUrlToBlob(source);
        blob = converted.blob;
        mimeType = converted.mimeType;
        if (mimeType.includes('pdf')) extension = 'pdf';
        else if (mimeType.includes('png')) extension = 'png';
        else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
        else extension = 'webp';
      } else {
        return source;
      }
    } else {
      blob = source;
      mimeType = source.type || 'image/webp';
      if (mimeType.includes('pdf')) extension = 'pdf';
      else if (mimeType.includes('png')) extension = 'png';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
      else extension = 'webp';
    }

    const uniqueName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;

    const { error: uploadError } = await client.storage
      .from('baby-media')
      .upload(uniqueName, blob, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('[Storage] Upload to baby-media failed, falling back:', uploadError.message);
      // Fallback: If source is string, return it; otherwise convert to dataURL
      if (typeof source === 'string') return source;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    }

    const { data } = client.storage.from('baby-media').getPublicUrl(uniqueName);
    return data.publicUrl;
  } catch (err: any) {
    console.warn('[Storage] Upload exception, falling back:', err?.message);
    if (typeof source === 'string') return source;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(source as Blob);
    });
  }
}
