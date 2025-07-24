export function sanitizeFileName(fileName: string): string {
  if (!fileName) return fileName;
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;

  const sanitizedName = nameWithoutExt
    .replace(/[<>:"/\\|?*%@#()[\]{}+]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 100);

  const finalName = sanitizedName || 'arquivo';
  return finalName + extension;
}
