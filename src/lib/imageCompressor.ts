/**
 * Client-side image compressor using HTML Canvas
 * Resizes large smartphone photos (which can be 5-10MB) to crisp, web-optimized ~150-300KB WebP/JPEG
 */
export async function compressImageFile(file: File, maxWidth = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's a PDF or video, return as dataURL directly
    if (file.type.startsWith('application/pdf') || file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to jpeg
        try {
          const compressedDataUrl = canvas.toDataURL('image/webp', quality);
          resolve(compressedDataUrl);
        } catch {
          const fallbackDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(fallbackDataUrl);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
